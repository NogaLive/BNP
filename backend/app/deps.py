from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from datetime import datetime, timezone

from app.db.session import SessionLocal
from app.core.config import settings
from app.models.models import Usuario

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> Usuario:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        dni: str = payload.get("sub")
        if dni is None:
            raise HTTPException(status_code=401, detail="Token inválido")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")
    
    user = db.query(Usuario).filter(Usuario.dni == dni).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    # VALIDACIÓN DE BANEO
    if user.banned_until:
        if user.banned_until > datetime.now(timezone.utc):
            raise HTTPException(
                status_code=403, 
                detail=f"Cuenta suspendida hasta {user.banned_until}"
            )
            
    return user

def require_admin(user: Usuario = Depends(get_current_user)):
    if user.rol != "ADMIN":
        raise HTTPException(status_code=403, detail="Requiere permisos de administrador")
    return user