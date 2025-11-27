from pydantic import BaseModel
from app.models.models import TipoServicio

class ItemCreate(BaseModel):
    tipo: TipoServicio
    titulo_nombre: str
    autor_detalle: str = None

class ItemOut(ItemCreate):
    id: int
    disponible: bool

    class Config:
        from_attributes = True  