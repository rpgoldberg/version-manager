FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy application code
COPY index.js ./

# Copy version.json (should be copied into version-service directory before build)
COPY version.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S version-service -u 1001
USER version-service

# Default port (can be overridden)
ENV PORT=3020
EXPOSE ${PORT}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \

  CMD node -e "require('http').get('http://localhost:${PORT}/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["npm", "start"]