import os
from pydantic_settings import BaseSettings
from urllib.parse import quote_plus
from typing import Optional

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "BNP Servicios"
    
    # --- DB ---
    DB_USER: str
    DB_PASSWORD: str
    POOLER_HOST: str
    POOLER_PORT: str = "5432"
    DB_NAME: str = "postgres"
    DB_SSLMODE: str = "require"
    NULL_POOL: bool = True

    # --- Auth ---
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 1 día

    # --- Servicios Externos ---
    APIPERU_TOKEN: Optional[str] = None
    SENDGRID_API_KEY: Optional[str] = None
    SENDGRID_SENDER: Optional[str] = None

    # --- Políticas de Negocio ---
    MAX_DIAS_PRESTAMO: int = 21
    MAX_HORAS_POR_DIA: int = 4
    ANTICIPACION_MINIMA_HORAS: int = 2
    VENTANA_CANCELACION_HORAS: int = 2
    CONCURRENCIA_MAXIMA_POR_USUARIO: int = 2
    
    # --- OTP ---
    OTP_EXP_MINUTES: int = 15

    def get_database_url(self) -> str:
        # Codificamos la contraseña para evitar errores con caracteres especiales
        password = quote_plus(self.DB_PASSWORD)
        return f"postgresql+psycopg2://{self.DB_USER}:{password}@{self.POOLER_HOST}:{self.POOLER_PORT}/{self.DB_NAME}?sslmode={self.DB_SSLMODE}"

    class Config:
        env_file = ".env"
        # Esto permite que haya variables extra en el .env sin que explote,
        # aunque es mejor tenerlas declaradas arriba como hicimos.
        extra = "ignore" 

settings = Settings()