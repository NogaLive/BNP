from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from datetime import datetime, timedelta
import random
import httpx

from app.deps import get_db
from app.models.models import Usuario
from app.core import security
from app.core.config import settings
from app.schemas.usuario import UsuarioCreate, UsuarioOut, RecoveryVerify, RecoveryReset
from app.services.email import send_otp_email

router = APIRouter()

# Schema simple para el body de /forgot
class ForgotRequest(BaseModel):
    dni: str
    email: str

@router.post("/register", response_model=UsuarioOut)
async def register(user_in: UsuarioCreate, db: Session = Depends(get_db)):
    if db.query(Usuario).filter(Usuario.dni == user_in.dni).first():
        raise HTTPException(400, "El DNI ya está registrado")
    if db.query(Usuario).filter(Usuario.email == user_in.email).first():
        raise HTTPException(400, "El email ya está registrado")

    # Validación ApiPeruDev
    nombre_completo = None
    if not settings.APIPERU_TOKEN:
        nombre_completo = f"Ciudadano {user_in.dni}"
    else:
        try:
            async with httpx.AsyncClient() as client:
                url = "https://apiperu.dev/api/dni"
                headers = {
                    "Authorization": f"Bearer {settings.APIPERU_TOKEN}",
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
                payload = {"dni": user_in.dni}
                response = await client.post(url, headers=headers, json=payload, timeout=5.0)
                
                if response.status_code == 200 and response.json().get("success"):
                    d = response.json().get("data", {})
                    nombre_completo = f"{d.get('nombres')} {d.get('apellido_paterno')} {d.get('apellido_materno')}".strip()
                else:
                    raise HTTPException(400, "DNI no válido o no encontrado")
        except Exception:
            raise HTTPException(503, "Error de validación externa")

    new_user = Usuario(
        dni=user_in.dni,
        email=user_in.email,
        nombre=nombre_completo or f"Usuario {user_in.dni}",
        password_hash=security.get_password_hash(user_in.password),
        rol="USER"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.dni == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Credenciales incorrectas")
    
    if user.banned_until and user.banned_until > datetime.now():
         raise HTTPException(status_code=403, detail="Usuario bloqueado")

    # CORRECCIÓN: Pasamos el ROL al token
    access_token = security.create_access_token(
        subject=user.dni, 
        role=user.rol.value # Convertimos Enum a string ('ADMIN' o 'USER')
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

# --- NUEVO ENDPOINT: RECUPERACIÓN ---
@router.post("/forgot")
def forgot_password(data: ForgotRequest, db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.dni == data.dni, Usuario.email == data.email).first()
    
    # Por seguridad, si no existe, no damos error explícito,
    # pero evitamos enviar el correo para no spamear direcciones ajenas.
    if not user:
        # Simulamos tiempo de espera para evitar "timing attacks"
        return {"msg": "Si los datos son correctos, se envió el correo."}

    # Generar OTP
    otp = str(random.randint(100000, 999999))
    
    # Guardar en BD
    user.recovery_token = otp
    user.recovery_expires = datetime.utcnow() + timedelta(minutes=settings.OTP_EXP_MINUTES)
    db.commit()

    # --- ENVÍO REAL CON SENDGRID ---
    enviado = send_otp_email(user.email, otp)
    
    if not enviado:
        # Opcional: Podrías lanzar un 500 si es crítico, 
        # pero mejor no revelar que falló el servicio de correo al usuario final por seguridad.
        print(f"Fallo al enviar correo a {user.email}")

    return {"msg": "Código enviado"}

@router.post("/forgot/verify")
def verify_recovery_code(data: RecoveryVerify, db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.dni == data.dni, Usuario.email == data.email).first()
    if not user:
        raise HTTPException(404, "Usuario no encontrado")
    
    if not user.recovery_token or user.recovery_token != data.code:
        raise HTTPException(400, "Código inválido")
        
    if user.recovery_expires and user.recovery_expires < datetime.utcnow():
        raise HTTPException(400, "El código ha expirado")
        
    return {"msg": "Código correcto"}

@router.post("/forgot/reset")
def reset_password(data: RecoveryReset, db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.dni == data.dni, Usuario.email == data.email).first()
    if not user:
        raise HTTPException(404, "Usuario no encontrado")
    
    # Validar código nuevamente por seguridad
    if user.recovery_token != data.code:
        raise HTTPException(400, "Código inválido")
    if user.recovery_expires < datetime.utcnow():
        raise HTTPException(400, "El código ha expirado")
        
    # Actualizar contraseña
    user.password_hash = security.get_password_hash(data.new_password)
    
    # Limpiar token para que no se pueda reusar
    user.recovery_token = None
    user.recovery_expires = None
    
    db.commit()
    return {"msg": "Contraseña actualizada correctamente"}