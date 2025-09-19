# Build stage - install dependencies
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# Production stage - minimal image
FROM node:20-alpine
WORKDIR /app

# Update Alpine packages for security
RUN apk update && apk upgrade && rm -rf /var/cache/apk/*

# Copy only production node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY package*.json ./
COPY index.js app.js service-registry.js ./
COPY utils ./utils/
COPY version.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S version-manager -u 1001
USER version-manager

# Default port (will be overridden by Docker Compose)
ENV PORT=3020
# EXPOSE will be handled by Docker Compose port mapping

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${PORT}/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["npm", "start"]