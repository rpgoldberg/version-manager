# Build stage - install dependencies
FROM node:25-alpine AS builder
WORKDIR /app

# Setup localStorage directory for Node 25
RUN mkdir -p /tmp/node-localstorage
ENV NODE_OPTIONS="--localstorage-file=/tmp/node-localstorage/storage.sqlite"

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# Test stage - for running tests
FROM node:25-alpine AS test
WORKDIR /app

# Setup localStorage directory for Node 25
RUN mkdir -p /tmp/node-localstorage
ENV NODE_OPTIONS="--localstorage-file=/tmp/node-localstorage/storage.sqlite"

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for testing)
RUN npm ci

# Copy source code
COPY . .

# Run tests
CMD ["npm", "test"]

# Production stage - minimal image
FROM node:25-alpine AS production
WORKDIR /app

# Setup localStorage directory for Node 25
RUN mkdir -p /tmp/node-localstorage && \
    apk update && apk upgrade && rm -rf /var/cache/apk/*
ENV NODE_OPTIONS="--localstorage-file=/tmp/node-localstorage/storage.sqlite"

# Copy only production node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY package*.json ./
COPY index.js app.js service-registry.js ./
COPY utils ./utils/
COPY version.json ./

# Create non-root user and set ownership of localStorage directory
RUN addgroup -g 1001 -S nodejs && \
    adduser -S version-manager -u 1001 && \
    chown -R version-manager:nodejs /tmp/node-localstorage
USER version-manager

# Default port (will be overridden by Docker Compose)
ENV PORT=3020
# EXPOSE will be handled by Docker Compose port mapping

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${PORT}/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["npm", "start"]