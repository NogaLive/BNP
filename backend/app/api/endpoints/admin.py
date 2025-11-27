from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi.responses import StreamingResponse
import csv
import io

from app.deps import get_db, require_admin
from app.models.models import Reserva, Usuario, Libro, Recurso, Sede, EstadoReserva, TipoServicio
from app.schemas.inventario import (
    LibroCreate, LibroUpdate, LibroOut, 
    RecursoCreate, RecursoUpdate, RecursoOut, 
    SedeCreate, SedeUpdate, SedeOut
)
from app.schemas.reserva import ReservaOut

router = APIRouter()

# --- UTILITARIOS ---
TZ_PERU = timezone(timedelta(hours=-5))

def get_now_peru():
    """Retorna la fecha/hora actual en Perú (naive) para comparar con BD"""
    return datetime.now(TZ_PERU).replace(tzinfo=None)

# ... (Funciones de generación de códigos: generar_codigo_sede, generar_codigo_inventario se mantienen igual) ...
def generar_codigo_sede(db: Session) -> str:
    ultimo_id = db.query(func.max(Sede.id)).scalar() or 0
    return f"SED-{ultimo_id + 1:03d}"

def generar_codigo_inventario(db: Session, sede_id: int, tipo: str) -> str:
    sede = db.query(Sede).filter(Sede.id == sede_id).first()
    if not sede: raise HTTPException(404, "Sede no encontrada")
    prefijo = "LIB" if tipo == "LIBRO" else "REC"
    count = db.query(Libro if tipo == "LIBRO" else Recurso).filter_by(sede_id=sede_id).count()
    return f"{sede.codigo}-{prefijo}-{count + 1:04d}"

def aplicar_strike(db: Session, dni: str):
    user = db.query(Usuario).filter(Usuario.dni == dni).first()
    if user:
        user.strikes += 1
        # Si llega a 3 strikes, banear por 6 meses desde HOY
        if user.strikes >= 3:
            user.banned_until = get_now_peru() + timedelta(days=180)
        db.add(user)

# =================================================================
# 1. VALIDACIÓN DE ASISTENCIA (BLINDADA)
# =================================================================

@router.post("/validar-qr")
def validar_asistencia(
    qr_token: str, 
    db: Session = Depends(get_db), 
    admin = Depends(require_admin)
):
    # Buscar por token (QR) o código legible
    reserva = db.query(Reserva).filter(
        or_(Reserva.qr_token == qr_token, Reserva.code == qr_token)
    ).first()

    if not reserva:
        raise HTTPException(404, "Reserva no encontrada o código inválido.")

    ahora = get_now_peru() # Hora exacta Perú

    # --- CASO 1: CHECK-IN (Entrada / Recojo) ---
    if reserva.estado == EstadoReserva.PENDIENTE:
        
        # REGLA CRÍTICA: No permitir entrada antes de tiempo
        # Damos un margen de cortesía de 15 min antes (opcional)
        inicio_permitido = reserva.hora_inicio - timedelta(minutes=15)
        
        if ahora < inicio_permitido:
            falta = reserva.hora_inicio - ahora
            # Formato amigable de tiempo restante
            dias = falta.days
            horas, resto = divmod(falta.seconds, 3600)
            minutos = resto // 60
            
            tiempo_txt = f"{horas}h {minutos}m"
            if dias > 0:
                tiempo_txt = f"{dias} días, {tiempo_txt}"
            
            raise HTTPException(400, f"Aún no inicia tu reserva. Faltan {tiempo_txt}.")

        # Validación de Tolerancia (Solo Salas) - Llegada tarde
        if reserva.tipo_servicio == TipoServicio.SALA:
            limite_tolerancia = reserva.hora_inicio + timedelta(minutes=20)
            if ahora > limite_tolerancia:
                reserva.estado = EstadoReserva.NO_SHOW
                aplicar_strike(db, reserva.usuario_dni)
                db.commit()
                raise HTTPException(400, "Tolerancia de 20 min excedida. Se aplicó Strike y se canceló el turno.")

        # Check-in Exitoso
        reserva.estado = EstadoReserva.EN_USO if reserva.tipo_servicio == TipoServicio.SALA else EstadoReserva.ENTREGADO
        reserva.check_in_at = ahora
        db.commit()
        
        return {
            "status": "CHECK-IN EXITOSO", 
            "mensaje": f"Entrada registrada a las {ahora.strftime('%H:%M')}.",
            "usuario": {"nombre": reserva.usuario.nombre, "dni": reserva.usuario_dni}
        }

    # --- CASO 2: CHECK-OUT (Salida / Devolución) ---
    elif reserva.estado in [EstadoReserva.EN_USO, EstadoReserva.ENTREGADO]:
        
        reserva.estado = EstadoReserva.FINALIZADA
        reserva.check_out_at = ahora
        
        mensaje_extra = ""
        
        # REGLA CRÍTICA: Devolución Tardía = Strike
        if ahora > reserva.hora_fin:
            aplicar_strike(db, reserva.usuario_dni)
            retraso = ahora - reserva.hora_fin
            
            # Calcular cuánto se pasó
            dias = retraso.days
            horas = retraso.seconds // 3600
            
            tiempo_txt = f"{dias} días" if dias > 0 else f"{horas} horas"
            mensaje_extra = f"⚠️ ENTREGA TARDÍA (+{tiempo_txt}). Se aplicó 1 Strike."
        
        db.commit()
        
        return {
            "status": "CHECK-OUT REGISTRADO", 
            "mensaje": f"Salida registrada. {mensaje_extra}",
            "usuario": {"nombre": reserva.usuario.nombre, "dni": reserva.usuario_dni}
        }

    else:
        raise HTTPException(400, f"La reserva ya finalizó o fue cancelada (Estado: {reserva.estado}).")

# =================================================================
# 2. GESTIÓN DE SEDES (CRUD COMPLETO CON AUTO-CÓDIGO)
# =================================================================

@router.post("/sedes", response_model=SedeOut)
def crear_sede(sede_in: SedeCreate, db: Session = Depends(get_db), admin = Depends(require_admin)):
    # Generamos código automático, ignorando si el front envió algo
    nuevo_codigo = generar_codigo_sede(db)
    
    nueva = Sede(
        codigo=nuevo_codigo,
        nombre=sede_in.nombre,
        direccion=sede_in.direccion,
        telefono=sede_in.telefono
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva

@router.get("/sedes", response_model=List[SedeOut])
def listar_sedes(db: Session = Depends(get_db), admin = Depends(require_admin)):
    return db.query(Sede).all()

@router.put("/sedes/{sede_id}", response_model=SedeOut)
def actualizar_sede(sede_id: int, item: SedeUpdate, db: Session = Depends(get_db), admin = Depends(require_admin)):
    sede = db.query(Sede).filter(Sede.id == sede_id).first()
    if not sede:
        raise HTTPException(404, "Sede no encontrada")
    
    for key, value in item.model_dump(exclude_unset=True).items():
        if key != 'codigo': # Protegemos el código para que no se edite
            setattr(sede, key, value)
    
    db.commit()
    db.refresh(sede)
    return sede

@router.delete("/sedes/{sede_id}")
def eliminar_sede(sede_id: int, db: Session = Depends(get_db), admin = Depends(require_admin)):
    """Soft Delete: Desactiva la sede"""
    sede = db.query(Sede).filter(Sede.id == sede_id).first()
    if not sede: raise HTTPException(404, "Sede no encontrada")
    sede.activo = False
    db.commit()
    return {"msg": "Sede desactivada (en papelera)"}

# --- NUEVO ENDPOINT ---
@router.delete("/sedes/{sede_id}/force")
def eliminar_sede_definitiva(sede_id: int, db: Session = Depends(get_db), admin = Depends(require_admin)):
    """Hard Delete: Elimina el registro de la BD si no tiene inventario"""
    sede = db.query(Sede).filter(Sede.id == sede_id).first()
    if not sede: 
        raise HTTPException(404, "Sede no encontrada")
    
    # Validar integridad: No borrar si tiene hijos
    if sede.libros or sede.recursos:
        raise HTTPException(400, "No se puede eliminar definitivamente: La sede tiene libros o recursos asociados. Primero vacía su inventario.")

    db.delete(sede)
    db.commit()
    return {"msg": "Sede eliminada permanentemente"}

# =================================================================
# 3. GESTIÓN DE INVENTARIO: LIBROS (CON AUTO-CÓDIGO)
# =================================================================

@router.post("/libros", response_model=LibroOut)
def crear_libro(item: LibroCreate, db: Session = Depends(get_db), admin = Depends(require_admin)):
    sede = db.query(Sede).filter(Sede.id == item.sede_id).first()
    if not sede: raise HTTPException(404, "Sede no existe")
    
    codigo_inv = generar_codigo_inventario(db, item.sede_id, "LIBRO")
    nuevo = Libro(**item.model_dump())
    nuevo.codigo_inventario = codigo_inv
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

# NUEVO: Listar TODO para el admin (público solo ve disponible=True)
@router.get("/libros", response_model=List[LibroOut])
def listar_libros_admin(db: Session = Depends(get_db), admin = Depends(require_admin)):
    return db.query(Libro).order_by(Libro.id.desc()).all()

# Actualizar (Ya lo tenías)
@router.put("/libros/{libro_id}", response_model=LibroOut)
def actualizar_libro(libro_id: int, item: LibroUpdate, db: Session = Depends(get_db), admin = Depends(require_admin)):
    libro = db.query(Libro).filter(Libro.id == libro_id).first()
    if not libro: raise HTTPException(404, "Libro no encontrado")
    
    datos = item.model_dump(exclude_unset=True)
    for key, value in datos.items():
        setattr(libro, key, value)
    
    db.commit()
    db.refresh(libro)
    return libro

# Soft Delete (Desactivar/Activar) - Ya lo tenías, asegúrate de la lógica
@router.delete("/libros/{libro_id}")
def desactivar_libro(libro_id: int, db: Session = Depends(get_db), admin = Depends(require_admin)):
    libro = db.query(Libro).filter(Libro.id == libro_id).first()
    if not libro: raise HTTPException(404, "Libro no encontrado")
    
    # Toggle: Si está True pasa a False, si es False se queda False (o podrías hacer toggle)
    # Por estándar DELETE suele ser desactivar. Para reactivar usa PUT con disponible=True
    libro.disponible = False 
    db.commit()
    return {"msg": "Libro desactivado"}

# NUEVO: Hard Delete (Eliminar Definitivamente)
@router.delete("/libros/{libro_id}/force")
def eliminar_libro_definitivo(libro_id: int, db: Session = Depends(get_db), admin = Depends(require_admin)):
    libro = db.query(Libro).filter(Libro.id == libro_id).first()
    if not libro: raise HTTPException(404, "Libro no encontrado")
    
    # Validar dependencias
    reservas = db.query(Reserva).filter(Reserva.libro_id == libro_id).count()
    if reservas > 0:
        raise HTTPException(400, "No se puede eliminar: Tiene historial de reservas.")
        
    db.delete(libro)
    db.commit()
    return {"msg": "Libro eliminado permanentemente"}

# =================================================================
# 4. GESTIÓN DE INVENTARIO: RECURSOS (SALAS/EQUIPOS)
# =================================================================

@router.post("/recursos", response_model=RecursoOut)
def crear_recurso(item: RecursoCreate, db: Session = Depends(get_db), admin = Depends(require_admin)):
    sede = db.query(Sede).filter(Sede.id == item.sede_id).first()
    if not sede: raise HTTPException(404, "Sede no existe")

    codigo_inv = generar_codigo_inventario(db, item.sede_id, "RECURSO")
    nuevo = Recurso(**item.model_dump())
    nuevo.codigo_inventario = codigo_inv
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

# NUEVO: Listar TODO para admin
@router.get("/recursos", response_model=List[RecursoOut])
def listar_recursos_admin(db: Session = Depends(get_db), admin = Depends(require_admin)):
    return db.query(Recurso).order_by(Recurso.id.desc()).all()

@router.put("/recursos/{recurso_id}", response_model=RecursoOut)
def actualizar_recurso(recurso_id: int, item: RecursoUpdate, db: Session = Depends(get_db), admin = Depends(require_admin)):
    recurso = db.query(Recurso).filter(Recurso.id == recurso_id).first()
    if not recurso: raise HTTPException(404, "Recurso no encontrado")
    
    datos = item.model_dump(exclude_unset=True)
    for key, value in datos.items():
        setattr(recurso, key, value)
    
    db.commit()
    db.refresh(recurso)
    return recurso

@router.delete("/recursos/{recurso_id}")
def desactivar_recurso(recurso_id: int, db: Session = Depends(get_db), admin = Depends(require_admin)):
    recurso = db.query(Recurso).filter(Recurso.id == recurso_id).first()
    if not recurso: raise HTTPException(404, "Recurso no encontrado")
    recurso.disponible = False
    db.commit()
    return {"msg": "Recurso desactivado"}

# NUEVO: Hard Delete
@router.delete("/recursos/{recurso_id}/force")
def eliminar_recurso_definitivo(recurso_id: int, db: Session = Depends(get_db), admin = Depends(require_admin)):
    recurso = db.query(Recurso).filter(Recurso.id == recurso_id).first()
    if not recurso: raise HTTPException(404, "Recurso no encontrado")
    
    if db.query(Reserva).filter(Reserva.recurso_id == recurso_id).count() > 0:
        raise HTTPException(400, "No se puede eliminar: Tiene historial de reservas.")
        
    db.delete(recurso)
    db.commit()
    return {"msg": "Recurso eliminado permanentemente"}

# =================================================================
# 5. GESTIÓN DE RESERVAS Y REPORTES (EXPORTACIÓN CSV)
# =================================================================

@router.get("/reservas", response_model=List[ReservaOut])
def listar_reservas_admin(
    estado: Optional[EstadoReserva] = None,
    fecha: Optional[str] = None, # YYYY-MM-DD
    db: Session = Depends(get_db), 
    admin = Depends(require_admin)
):
    query = db.query(Reserva)
    if estado:
        query = query.filter(Reserva.estado == estado)
    if fecha:
        try:
            fecha_dt = datetime.strptime(fecha, "%Y-%m-%d").date()
            query = query.filter(func.date(Reserva.fecha_reserva) == fecha_dt)
        except ValueError:
            pass
    return query.order_by(desc(Reserva.fecha_reserva)).limit(100).all()

# --- NUEVO: EXPORTACIÓN DE DATOS (CSV) ---
@router.get("/reportes/exportar/{tipo}")
def exportar_data(tipo: str, db: Session = Depends(get_db), admin = Depends(require_admin)):
    output = io.StringIO()
    writer = csv.writer(output)
    
    filename = f"reporte_{tipo}_{datetime.now().strftime('%Y%m%d')}.csv"
    
    if tipo == "reservas":
        # Encabezados
        writer.writerow(["ID", "Codigo", "Usuario", "Servicio", "Fecha", "Estado", "Sede"])
        reservas = db.query(Reserva).all()
        for r in reservas:
            # Obtener nombre sede
            sede_nom = "-"
            if r.libro and r.libro.sede_rel: sede_nom = r.libro.sede_rel.nombre
            elif r.recurso and r.recurso.sede_rel: sede_nom = r.recurso.sede_rel.nombre
            
            writer.writerow([
                r.id, r.code, r.usuario_dni, r.tipo_servicio, 
                r.fecha_reserva, r.estado, sede_nom
            ])
            
    elif tipo == "usuarios":
        writer.writerow(["DNI", "Nombre", "Email", "Strikes", "Estado"])
        users = db.query(Usuario).all()
        for u in users:
            estado = "BANEADO" if (u.banned_until and u.banned_until > datetime.now(timezone.utc)) else "ACTIVO"
            writer.writerow([u.dni, u.nombre, u.email, u.strikes, estado])
            
    elif tipo == "inventario":
        writer.writerow(["Codigo", "Tipo", "Nombre/Titulo", "Sede", "Estado", "Stock/Capacidad"])
        libros = db.query(Libro).all()
        recursos = db.query(Recurso).all()
        
        for l in libros:
            writer.writerow([l.codigo_inventario, "LIBRO", l.titulo, l.sede_rel.nombre, 
                             "DISPONIBLE" if l.disponible else "AGOTADO", l.stock_total])
        for r in recursos:
            writer.writerow([r.codigo_inventario, r.tipo_recurso, r.nombre, r.sede_rel.nombre, 
                             "ACTIVO" if r.disponible else "INACTIVO", r.capacidad])
            
    else:
        raise HTTPException(400, "Tipo de reporte no válido (reservas, usuarios, inventario)")
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# --- DASHBOARD JSON (KPIs) ---
@router.get("/reportes/general")
def reporte_general(db: Session = Depends(get_db), admin = Depends(require_admin)):
    total_usuarios = db.query(Usuario).count()
    usuarios_baneados = db.query(Usuario).filter(Usuario.banned_until > datetime.now(timezone.utc)).count()
    reservas_activas = db.query(Reserva).filter(Reserva.estado.in_([EstadoReserva.EN_USO, EstadoReserva.ENTREGADO])).count()
    no_shows_hoy = db.query(Reserva).filter(
        Reserva.estado == EstadoReserva.NO_SHOW,
        func.date(Reserva.fecha_reserva) == datetime.now().date()
    ).count()
    
    return {
        "total_usuarios": total_usuarios,
        "usuarios_baneados": usuarios_baneados,
        "reservas_en_curso": reservas_activas,
        "faltas_hoy": no_shows_hoy
    }

@router.get("/reportes/top-libros")
def top_libros(limit: int = 5, db: Session = Depends(get_db), admin = Depends(require_admin)):
    results = db.query(Libro.titulo, func.count(Reserva.id).label("total"))\
        .join(Reserva, Reserva.libro_id == Libro.id)\
        .filter(Reserva.tipo_servicio == TipoServicio.LIBRO)\
        .group_by(Libro.id, Libro.titulo)\
        .order_by(desc("total")).limit(limit).all()
    return [{"titulo": r[0], "solicitudes": r[1]} for r in results]

@router.get("/reportes/top-salas")
def top_salas(limit: int = 5, db: Session = Depends(get_db), admin = Depends(require_admin)):
    results = db.query(Recurso.nombre, func.count(Reserva.id).label("total"))\
        .join(Reserva, Reserva.recurso_id == Recurso.id)\
        .filter(Reserva.tipo_servicio == TipoServicio.SALA)\
        .group_by(Recurso.id, Recurso.nombre)\
        .order_by(desc("total")).limit(limit).all()
    return [{"nombre": r[0], "reservas": r[1]} for r in results]

@router.get("/reportes/usuarios-riesgo")
def usuarios_riesgo(db: Session = Depends(get_db), admin = Depends(require_admin)):
    users = db.query(Usuario).filter(Usuario.strikes > 0).order_by(desc(Usuario.strikes)).all()
    return [
        {"dni": u.dni, "nombre": u.nombre, "strikes": u.strikes, 
         "estado": "BANEADO" if (u.banned_until and u.banned_until > datetime.now(timezone.utc)) else "ADVERTENCIA"}
        for u in users
    ]