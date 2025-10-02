# API Service Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . ./

# Build NestJS app
RUN npm run build

# Remove devDependencies after build
RUN npm prune --production

# Expose port (Railway will set PORT env var)
EXPOSE 3001

# Start NestJS in production mode
CMD ["node", "dist/src/main"]
