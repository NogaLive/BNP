from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.models import TipoServicio, EstadoReserva

class ReservaCreate(BaseModel):
    tipo: TipoServicio
    # Enviaremos uno de los dos IDs
    libro_id: Optional[int] = None
    recurso_id: Optional[int] = None
    
    fecha_reserva: datetime
    hora_inicio: Optional[datetime] = None
    hora_fin: Optional[datetime] = None

class ReservaOut(BaseModel):
    id: int
    code: str
    tipo_servicio: TipoServicio
    estado: EstadoReserva
    qr_token: str
    
    class Config:
        from_attributes = True