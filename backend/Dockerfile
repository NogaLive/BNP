# Usar una imagen ligera de Python
FROM python:3.11-slim

# Evita que Python genere archivos .pyc y buffer de salida
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Directorio de trabajo en el contenedor
WORKDIR /app

# Instalar dependencias del sistema necesarias para compilar (opcional pero recomendado)
RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

# Copiar dependencias e instalarlas
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copiar el código del proyecto
COPY . .

# Exponer el puerto que usa Cloud Run (por defecto 8080)
ENV PORT=8080

# Comando para iniciar la aplicación
# OJO: Cloud Run inyecta la variable $PORT automáticamente
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]