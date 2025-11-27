from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta, timezone, time
import uuid

from app.deps import get_db, get_current_user
from app.models.models import Reserva, Usuario, TipoServicio, EstadoReserva, Libro, Recurso
from app.schemas.reserva import ReservaCreate
from app.services.email import send_email 

router = APIRouter()

TZ_PERU = timezone(timedelta(hours=-5))

def get_now_peru():
    return datetime.now(TZ_PERU).replace(tzinfo=None)

def normalize_to_peru_naive(dt: datetime) -> datetime:
    if dt is None: return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(TZ_PERU).replace(tzinfo=None)

def date_range(start_date, end_date):
    current = start_date
    while current <= end_date:
        yield current
        current += timedelta(days=1)

@router.get("/disponibilidad")
def verificar_disponibilidad(
    recurso_id: int = Query(None), 
    libro_id: int = Query(None),
    fecha: str = Query(None),
    mes: str = Query(None),
    tipo: str = Query("SALA"), 
    db: Session = Depends(get_db)
):
    if tipo == "SALA" and fecha:
        try:
            fecha_dt = datetime.strptime(fecha, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(400, "Fecha inválida")
        
        reservas = db.query(Reserva).filter(
            Reserva.recurso_id == recurso_id,
            Reserva.estado.in_([EstadoReserva.PENDIENTE, EstadoReserva.EN_USO]),
            func.date(Reserva.hora_inicio) == fecha_dt
        ).all()
        
        ocupados = [r.hora_inicio.strftime("%H:%M") for r in reservas]
        return {"ocupados": ocupados}

    elif tipo == "LIBRO" and mes:
        try:
            anio, mes_num = map(int, mes.split('-'))
            inicio_mes = datetime(anio, mes_num, 1).date()
            if mes_num == 12:
                fin_mes = (datetime(anio + 1, 1, 1) - timedelta(days=1)).date()
            else:
                fin_mes = (datetime(anio, mes_num + 1, 1) - timedelta(days=1)).date()
        except ValueError:
            raise HTTPException(400, "Formato mes inválido")

        libro = db.query(Libro).filter(Libro.id == libro_id).first()
        if not libro: raise HTTPException(404, "Libro no encontrado")
        
        reservas = db.query(Reserva).filter(
            Reserva.libro_id == libro_id,
            Reserva.estado.in_([EstadoReserva.PENDIENTE, EstadoReserva.ENTREGADO]),
            Reserva.hora_inicio <= datetime.combine(fin_mes, time.max),
            Reserva.hora_fin >= datetime.combine(inicio_mes, time.min)
        ).all()

        dias_ocupados = {}
        for r in reservas:
            r_inicio = r.hora_inicio.date()
            r_fin = r.hora_fin.date()
            for dia in date_range(r_inicio, r_fin):
                dias_ocupados[dia] = dias_ocupados.get(dia, 0) + 1

        fechas_sin_stock = [
            dia.strftime("%Y-%m-%d") for dia, count in dias_ocupados.items() if count >= libro.stock_total
        ]
        return {"fechas_sin_stock": fechas_sin_stock}

    return {"msg": "Parámetros incorrectos"}

@router.post("/", response_model=dict)
def crear_reserva(
    data: ReservaCreate, 
    db: Session = Depends(get_db), 
    user: Usuario = Depends(get_current_user)
):
    ahora_peru = get_now_peru()
    if user.banned_until and user.banned_until > ahora_peru:
        raise HTTPException(403, f"Cuenta suspendida hasta {user.banned_until}")

    nombre_recurso = ""
    
    inicio_peru = normalize_to_peru_naive(data.hora_inicio)
    fin_peru = normalize_to_peru_naive(data.hora_fin)
    fecha_base_peru = normalize_to_peru_naive(data.fecha_reserva)

    if data.tipo == TipoServicio.SALA:
        if not data.recurso_id: raise HTTPException(400, "Falta recurso_id")
        
        solapamiento = db.query(Reserva).filter(
            Reserva.recurso_id == data.recurso_id,
            Reserva.estado.in_([EstadoReserva.PENDIENTE, EstadoReserva.EN_USO]),
            Reserva.hora_inicio == inicio_peru
        ).first()
        if solapamiento: raise HTTPException(400, "Horario reservado.")
        
        mis_reservas = db.query(Reserva).filter(
            Reserva.usuario_dni == user.dni,
            Reserva.tipo_servicio == TipoServicio.SALA,
            Reserva.estado.in_([EstadoReserva.PENDIENTE, EstadoReserva.EN_USO]),
            func.date(Reserva.hora_inicio) == inicio_peru.date()
        ).count()
        if mis_reservas >= 1: raise HTTPException(400, "Límite: 1 turno por día.")

        recurso = db.query(Recurso).filter(Recurso.id == data.recurso_id).first()
        nombre_recurso = recurso.nombre

    elif data.tipo == TipoServicio.LIBRO:
        if not data.libro_id: raise HTTPException(400, "Falta libro_id")
        
        libro = db.query(Libro).filter(Libro.id == data.libro_id).first()
        if not libro: raise HTTPException(404, "Libro no encontrado")
        nombre_recurso = libro.titulo

        dias_total = (fin_peru.date() - inicio_peru.date()).days + 1
        if dias_total > 5: raise HTTPException(400, f"Máximo 5 días.")

        reservas_existentes = db.query(Reserva).filter(
            Reserva.libro_id == data.libro_id,
            Reserva.estado.in_([EstadoReserva.PENDIENTE, EstadoReserva.ENTREGADO]),
            Reserva.hora_inicio <= fin_peru,
            Reserva.hora_fin >= inicio_peru
        ).all()

        for dia_check in date_range(inicio_peru.date(), fin_peru.date()):
            uso = 0
            for r in reservas_existentes:
                if r.hora_inicio.date() <= dia_check <= r.hora_fin.date():
                    uso += 1
            if uso >= libro.stock_total:
                raise HTTPException(400, f"No hay stock para el día {dia_check}")

        mis_prestamos = db.query(Reserva).filter(
            Reserva.usuario_dni == user.dni,
            Reserva.tipo_servicio == TipoServicio.LIBRO,
            Reserva.estado.in_([EstadoReserva.PENDIENTE, EstadoReserva.ENTREGADO])
        ).count()
        if mis_prestamos >= 2: raise HTTPException(400, "Límite excedido: Máx 2 préstamos.")

    qr_token = str(uuid.uuid4())
    human_code = f"{data.tipo.value[:2]}-{uuid.uuid4().hex[:6].upper()}"
    
    nueva = Reserva(
        code=human_code,
        qr_token=qr_token,
        usuario_dni=user.dni,
        libro_id=data.libro_id,
        recurso_id=data.recurso_id,
        tipo_servicio=data.tipo,
        fecha_reserva=fecha_base_peru,
        hora_inicio=inicio_peru,
        hora_fin=fin_peru,
        motivo="Web",
        estado=EstadoReserva.PENDIENTE
    )
    db.add(nueva)
    db.commit()
    
    # --- ENVÍO DE CORREO (PERSONALIZADO) ---
    try:
        qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={human_code}"
        
        # Formateo según tipo
        if data.tipo == TipoServicio.LIBRO:
            f_inicio = inicio_peru.strftime('%d/%m/%Y')
            f_fin = fin_peru.strftime('%d/%m/%Y')
            fecha_mostrar = f"Del {f_inicio} al {f_fin}"
        else:
            f_dia = inicio_peru.strftime('%d/%m/%Y')
            f_hora = inicio_peru.strftime('%H:%M')
            fecha_mostrar = f"{f_dia} - Hora: {f_hora}"

        html = f"""
        <div style="font-family: sans-serif; max-width: 500px; margin: auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
            <div style="background-color: #D91023; color: white; padding: 20px; text-align: center;">
                <h2 style="margin: 0;">¡Reserva Confirmada!</h2>
            </div>
            <div style="padding: 20px; text-align: center;">
                <p style="color: #666; font-size: 16px;">Hola <strong>{user.nombre}</strong>, tu solicitud ha sido procesada con éxito.</p>
                
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: left;">
                    <p><strong>Servicio:</strong> {data.tipo.value}</p>
                    <p><strong>Item:</strong> {nombre_recurso}</p>
                    <p><strong>Fecha:</strong> {fecha_mostrar}</p>
                </div>

                <p>Presenta este código QR al ingresar:</p>
                    <div style="text-align:center; margin:20px 0;">
                        <img src="{qr_url}" style="border:5px solid #fff; box-shadow:0 2px 5px #ccc;" />
                        <p style="font-size:20px; font-weight:bold; letter-spacing:2px;">{human_code}</p>
                    </div>
                
                <p style="font-size: 12px; color: #999; margin-top: 20px;">
                    Recuerda que tienes una tolerancia máxima de 20 minutos.<br>
                    Biblioteca Nacional del Perú
                </p>
            </div>
        </div>
        """
        send_email(user.email, f"Confirmación - {human_code}", html)
    except Exception as e:
        print(f"Error email: {e}")

    return {"msg": "Ok", "qr_token": qr_token, "code": human_code}