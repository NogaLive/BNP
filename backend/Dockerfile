# Usar una imagen oficial ligera de Python
FROM python:3.11-slim

# Variables para optimizar Python en Docker
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
# Asegurar que Python encuentre los módulos en la carpeta raíz
ENV PYTHONPATH=/app

WORKDIR /app

# Instalar dependencias del sistema (necesario para algunas libs de Python)
RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

# Copiar y e instalar requerimientos
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copiar el resto del código
COPY . .

# Comando de inicio explícito usando la variable de entorno PORT
# Cloud Run inyecta PORT=8080 por defecto
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT