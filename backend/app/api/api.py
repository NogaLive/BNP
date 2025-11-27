from fastapi import APIRouter
from app.api.endpoints import auth, reservas, admin, catalogo

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Autenticación"])
api_router.include_router(catalogo.router, prefix="/catalogo", tags=["Catálogo"])
api_router.include_router(reservas.router, prefix="/reservas", tags=["Reservas"])
api_router.include_router(admin.router, prefix="/admin", tags=["Administración"])