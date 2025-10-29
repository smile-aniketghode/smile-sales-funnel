# UI Service Dockerfile (for Railway monorepo deployment)
# Multi-stage build
# BUILD VERSION: 2025-10-29-v3-clean
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm ci

# Copy ONLY necessary source files (exclude everything else)
COPY src ./src
COPY public ./public
COPY index.html ./
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY tsconfig.node.json ./

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
