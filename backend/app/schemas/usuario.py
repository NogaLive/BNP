from pydantic import BaseModel, EmailStr
from typing import Optional

class UsuarioBase(BaseModel):
    email: EmailStr

class UsuarioLogin(UsuarioBase):
    password: str

class UsuarioCreate(UsuarioLogin):
    dni: str
    # Nombre es opcional al recibirlo, porque el backend lo llena vía API
    nombre: Optional[str] = None 

class UsuarioOut(UsuarioBase):
    dni: str
    nombre: str
    rol: str
    strikes: int
    
    class Config:
        from_attributes = True

# Schema para validar el código
class RecoveryVerify(BaseModel):
    dni: str
    email: str
    code: str

# Schema para cambiar la contraseña
class RecoveryReset(BaseModel):
    dni: str
    email: str
    code: str
    new_password: str