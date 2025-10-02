# Worker Service Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . ./

# Expose port (Railway will set PORT env var)
EXPOSE 8000

# Start uvicorn
CMD uvicorn src.main:app --host 0.0.0.0 --port ${PORT:-8000}
