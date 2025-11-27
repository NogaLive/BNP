from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from app.deps import get_db
from app.models.models import Libro, Recurso, Sede
from app.schemas.inventario import LibroOut, RecursoOut, SedeOut

router = APIRouter()

# Endpoint para llenar el dropdown de Sedes en el Landing Page
@router.get("/sedes", response_model=List[SedeOut])
def obtener_sedes_publicas(db: Session = Depends(get_db)):
    return db.query(Sede).filter(Sede.activo == True).all()

@router.get("/libros", response_model=List[LibroOut])
def buscar_libros(
    q: Optional[str] = None,       # Búsqueda general (Título/Autor/ISBN)
    sede_id: Optional[int] = None, # Filtro por Sede
    categoria: Optional[str] = None, # Filtro por Categoría
    db: Session = Depends(get_db)
):
    query = db.query(Libro).join(Sede).filter(Libro.disponible == True)
    
    if sede_id:
        query = query.filter(Libro.sede_id == sede_id)
        
    if categoria:
        query = query.filter(Libro.categoria == categoria)
        
    if q:
        search = f"%{q}%"
        query = query.filter(
            (Libro.titulo.ilike(search)) | 
            (Libro.autor.ilike(search)) | 
            (Libro.isbn.ilike(search))
        )
    
    # Enriquecer respuesta con nombre de sede
    resultados = query.all()
    for libro in resultados:
        libro.nombre_sede = libro.sede_rel.nombre
        
    return resultados

@router.get("/recursos", response_model=List[RecursoOut])
def buscar_recursos(
    tipo: Optional[str] = None,    # SALA o EQUIPO
    sede_id: Optional[int] = None, # Filtro por Sede
    db: Session = Depends(get_db)
):
    query = db.query(Recurso).join(Sede).filter(Recurso.disponible == True)
    
    if sede_id:
        query = query.filter(Recurso.sede_id == sede_id)
        
    if tipo:
        query = query.filter(Recurso.tipo_recurso == tipo)
        
    resultados = query.all()
    for recurso in resultados:
        recurso.nombre_sede = recurso.sede_rel.nombre
        
    return resultados