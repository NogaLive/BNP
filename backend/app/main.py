from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.api import api_router
from app.db.session import engine
from app.models.models import Base

# Crear tablas (en prod usar Alembic, aquí por seguridad)
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

# CONFIGURACIÓN CORS ROBUSTA
origins = [
    "http://localhost:5173",    # Vite Local
    "http://127.0.0.1:5173",    # Vite Local IP
    "http://localhost:3000",    # React standard (por si acaso)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,      # Lista explícita es más segura que ["*"] con credenciales
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {"msg": "BNP API Funcionando 🚀"}