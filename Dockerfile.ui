# UI Service Dockerfile (for Railway monorepo deployment)
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy UI package files
COPY ui/package*.json ./

# Install all dependencies (including dev for build)
RUN npm ci

# Copy UI source code
COPY ui/ ./

# Build Vite app
RUN npm run build

# Production stage - serve static files
FROM node:18-alpine

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose port (Railway will set PORT env var)
EXPOSE 5173

# Serve static files
CMD serve -s dist -l ${PORT:-5173}
