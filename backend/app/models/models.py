from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey, Text, func
from sqlalchemy.orm import relationship, declarative_base
import enum
from datetime import datetime

Base = declarative_base()

class Rol(str, enum.Enum):
    USER = "USER"
    ADMIN = "ADMIN"

class EstadoReserva(str, enum.Enum):
    PENDIENTE = "PENDIENTE"
    EN_USO = "EN_USO"
    ENTREGADO = "ENTREGADO"
    FINALIZADA = "FINALIZADA"
    NO_SHOW = "NO_SHOW"
    CANCELADA = "CANCELADA"

class TipoServicio(str, enum.Enum):
    LIBRO = "LIBRO"
    SALA = "SALA"

class Sede(Base):
    __tablename__ = "sedes"
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String, unique=True, nullable=False)
    nombre = Column(String, nullable=False)
    direccion = Column(String, nullable=False)
    telefono = Column(String, nullable=True)
    activo = Column(Boolean, default=True)
    libros = relationship("Libro", back_populates="sede_rel")
    recursos = relationship("Recurso", back_populates="sede_rel")

class Usuario(Base):
    __tablename__ = "usuarios"
    dni = Column(String(8), primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    nombre = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    rol = Column(Enum(Rol), default=Rol.USER)
    strikes = Column(Integer, default=0)
    
    # Fechas SIN zona horaria (Se guardará la hora Perú tal cual)
    banned_until = Column(DateTime(timezone=False), nullable=True)
    recovery_token = Column(String, nullable=True)
    recovery_expires = Column(DateTime(timezone=False), nullable=True)
    creado_en = Column(DateTime(timezone=False), server_default=func.now())

class Libro(Base):
    __tablename__ = "libros"
    id = Column(Integer, primary_key=True, index=True)
    codigo_inventario = Column(String, unique=True, nullable=True)
    titulo = Column(String, nullable=False)
    autor = Column(String, nullable=False)
    isbn = Column(String, unique=True, nullable=True)
    categoria = Column(String, nullable=True)
    sede_id = Column(Integer, ForeignKey("sedes.id"), nullable=False)
    sede_rel = relationship("Sede", back_populates="libros")
    stock_total = Column(Integer, default=1, nullable=False)
    disponible = Column(Boolean, default=True)

class Recurso(Base):
    __tablename__ = "recursos"
    id = Column(Integer, primary_key=True, index=True)
    codigo_inventario = Column(String, unique=True, nullable=True)
    nombre = Column(String, nullable=False)
    tipo_recurso = Column(String, nullable=False)
    sede_id = Column(Integer, ForeignKey("sedes.id"), nullable=False)
    sede_rel = relationship("Sede", back_populates="recursos")
    capacidad = Column(Integer, nullable=True)
    disponible = Column(Boolean, default=True)

class Reserva(Base):
    __tablename__ = "reservas"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True) 
    qr_token = Column(String, unique=True)
    usuario_dni = Column(String(8), ForeignKey("usuarios.dni"))
    libro_id = Column(Integer, ForeignKey("libros.id"), nullable=True)
    recurso_id = Column(Integer, ForeignKey("recursos.id"), nullable=True)
    tipo_servicio = Column(Enum(TipoServicio), nullable=False)
    
    # FECHAS CRÍTICAS (timezone=False para guardar hora local literal)
    fecha_reserva = Column(DateTime(timezone=False), nullable=False)
    hora_inicio = Column(DateTime(timezone=False), nullable=True)
    hora_fin = Column(DateTime(timezone=False), nullable=True)
    
    motivo = Column(Text, nullable=True)
    cantidad_personas = Column(Integer, nullable=True)
    estado = Column(Enum(EstadoReserva), default=EstadoReserva.PENDIENTE)
    
    # Auditoría de tiempos
    check_in_at = Column(DateTime(timezone=False), nullable=True)
    check_out_at = Column(DateTime(timezone=False), nullable=True)
    
    usuario = relationship("Usuario")
    libro = relationship("Libro")
    recurso = relationship("Recurso")

class AuditLog(Base):
    __tablename__ = "audit_log"
    id = Column(Integer, primary_key=True, autoincrement=True)
    fecha = Column(DateTime(timezone=False), server_default=func.now())
    actor = Column(String, nullable=True) 
    accion = Column(String, nullable=False)
    detalle = Column(Text, nullable=True)