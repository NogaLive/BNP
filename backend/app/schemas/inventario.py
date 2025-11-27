from pydantic import BaseModel
from typing import Optional

# ==========================================
# SEDES
# ==========================================

# Base: Campos comunes que el usuario ingresa
class SedeBase(BaseModel):
    nombre: str
    direccion: str
    telefono: Optional[str] = None

# Create: Lo que el frontend envía (NO incluye código)
class SedeCreate(SedeBase):
    pass

# Update: Campos opcionales para editar
class SedeUpdate(BaseModel):
    nombre: Optional[str] = None
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    activo: Optional[bool] = None

# Out: Lo que el backend responde (SÍ incluye código e ID)
class SedeOut(SedeBase):
    id: int
    codigo: str  # Generado por el backend
    activo: bool
    
    class Config:
        from_attributes = True

# ==========================================
# LIBROS
# ==========================================

class LibroBase(BaseModel):
    titulo: str
    autor: str
    isbn: Optional[str] = None
    categoria: Optional[str] = None
    sede_id: int
    stock_total: int = 1

class LibroCreate(LibroBase):
    pass

class LibroUpdate(BaseModel):
    titulo: Optional[str] = None
    autor: Optional[str] = None
    isbn: Optional[str] = None
    categoria: Optional[str] = None
    sede_id: Optional[int] = None
    stock_total: Optional[int] = None
    disponible: Optional[bool] = None

class LibroOut(LibroBase):
    id: int
    # codigo_inventario puede ser null si es data antigua, así que Optional
    codigo_inventario: Optional[str] = None 
    disponible: bool
    stock_disponible: int = 0
    nombre_sede: Optional[str] = None
    
    class Config:
        from_attributes = True

# ==========================================
# RECURSOS (SALAS/EQUIPOS)
# ==========================================

class RecursoBase(BaseModel):
    nombre: str
    tipo_recurso: str # SALA o EQUIPO
    sede_id: int
    capacidad: Optional[int] = 0

class RecursoCreate(RecursoBase):
    pass

class RecursoUpdate(BaseModel):
    nombre: Optional[str] = None
    tipo_recurso: Optional[str] = None
    sede_id: Optional[int] = None
    capacidad: Optional[int] = None
    disponible: Optional[bool] = None

class RecursoOut(RecursoBase):
    id: int
    codigo_inventario: Optional[str] = None
    disponible: bool
    nombre_sede: Optional[str] = None
    
    class Config:
        from_attributes = True