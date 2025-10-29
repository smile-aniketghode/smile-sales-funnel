# UI Service Dockerfile (for Railway monorepo deployment)
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm ci

# Copy all source files
COPY . ./

# Build Vite app with environment variables
ARG VITE_API_BASE_URL
ARG VITE_WORKER_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WORKER_API_BASE_URL=$VITE_WORKER_API_BASE_URL
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
