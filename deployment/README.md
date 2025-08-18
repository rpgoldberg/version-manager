# Deployment Guide for Figure Collector

This guide details how to deploy the Figure Collector application using a microservices architecture.

## Architecture Overview

The Figure Collector application consists of the following components:

1. **Backend Service**: Node.js/Express API with MongoDB Atlas (acts as orchestrator)
2. **Frontend Service**: React application with nginx reverse proxy (self-registering)
3. **Page Scraper Service**: Standalone web scraping microservice with browser automation
4. **Version Service**: Centralized version management and validation service
5. **Infrastructure**: Deployment configuration (Docker, Coolify, Cloudflare)

## Deployment Options

### 1. Local Development

For local development, you can use Docker Compose:

    # Clone the repositories
    git clone https://github.com/yourusername/figure-collector-backend.git
    git clone https://github.com/yourusername/figure-collector-frontend.git
    git clone https://github.com/yourusername/page-scraper.git
    git clone https://github.com/yourusername/figure-collector-infra.git

    # Copy the docker-compose.yml and .env.example
    cp figure-collector-infra/docker-compose.yml ./
    cp figure-collector-infra/.env.example ./.env

    # Edit the .env file with your credentials
    nano .env

    # Build and start the services
    docker-compose up --build

### 2. Coolify Deployment (Recommended)

Follow the instructions in `deployment/coolify/setup-instructions.md`.

### 3. Cloud Provider Deployment

You can deploy to any cloud provider that supports Docker containers:

1. **AWS**:
   - Use ECS (Elastic Container Service) or EKS (Kubernetes)
   - Deploy MongoDB on Atlas or DocumentDB
   - Use ALB for load balancing

2. **Google Cloud**:
   - Use GKE (Google Kubernetes Engine) or Cloud Run
   - Deploy MongoDB on Atlas
   - Use Cloud Load Balancing

3. **Scaleway**:
   - Use Kubernetes Kapsule or Docker containers
   - Deploy MongoDB on Atlas
   - Use Scaleway Load Balancer

## Service-Specific Deployment Notes

### Page Scraper Service

The page scraper service has special requirements due to browser automation:

**Docker Requirements:**
- Requires Chrome/Chromium browser installation
- Needs additional system fonts for proper rendering
- Uses more memory due to browser pool (recommend 1GB+ RAM)
- Longer startup time due to browser initialization

**Environment Variables:**
- `NODE_ENV`: Environment (development/test/production)
- `PORT`: Service port (3010 dev, 3005 test, 3000 prod)

**Health Check:**
- Endpoint: `GET /health`
- Browser pool status included in health response

**Service Dependencies:**
- Completely standalone - no database connections
- Used by backend service via `SCRAPER_SERVICE_URL`
- Can be scaled independently

**Deployment Order:**
1. Deploy version service first (independent)
2. Deploy scraper service (independent)  
3. Deploy backend service (depends on version-service and scraper)
4. Deploy frontend service (registers with backend on startup)

### Version Service

The version service provides centralized version management:

**Environment Variables:**
- `NODE_ENV`: Environment (development/test/production)
- `PORT`: Service port (3011 dev, 3006 test, 3001 prod)

**Health Check:**
- Endpoint: `GET /health`
- Provides service status and version info

**API Endpoints:**
- `GET /app-version`: Application version information
- `GET /validate-versions`: Validate service combinations

**Service Dependencies:**
- Completely standalone - no database connections
- Used by backend service via `VERSION_SERVICE_URL`
- Reads version data from static `version.json` file

### Version Management Architecture

The application implements a sophisticated version management system that eliminates circular dependencies:

**Service Registration Flow:**
1. **Version Service**: Stores application version info and validation rules
2. **Backend Orchestrator**: Aggregates versions from all services and validates combinations  
3. **Frontend Self-Registration**: Frontend registers its version with backend on startup
4. **Service Communication**: Backend fetches scraper version directly, no circular dependencies

**Environment Variable Changes:**
- **Backend no longer needs**: `FRONTEND_HOST`, `FRONTEND_PORT` (eliminated circular dependency)
- **Backend still needs**: `VERSION_SERVICE_URL`, `SCRAPER_SERVICE_URL`
- **Frontend keeps all variables**: Still needs `BACKEND_HOST`, `BACKEND_PORT`, `FRONTEND_HOST`, `FRONTEND_PORT` for nginx
- **Frontend keeps**: `REACT_APP_API_URL=/api` (for business logic APIs)

**API Routing Architecture:**
- **Business APIs**: `/api/*` prefix stripped by nginx → backend endpoints without prefix
- **Infrastructure APIs**: Direct proxy (no prefix stripping)
  - `/version` → backend `/version`
  - `/register-service` → backend `/register-service`

**Nginx Configuration:**
- Uses `upstream backend` block for reliable service-to-service communication
- Avoids DNS resolution issues common with variable-based proxy configurations
- Configuration: `upstream backend { server ${BACKEND_HOST}:${BACKEND_PORT}; }`

## MongoDB Atlas Setup

Follow the instructions in `deployment/mongodb/setup-atlas.md`.

## Cloudflare Tunnel Setup (for CGNAT Workaround)

Follow the instructions in `deployment/cloudflare/setup-tunnel.sh`.

## Security Best Practices

1. **Environment Variables**:
   - Never commit sensitive data to Git
   - Use environment variables for all secrets
   - Consider using a secrets manager for production

2. **Network Security**:
   - Limit MongoDB Atlas access to specific IP addresses
   - Use Cloudflare for additional security
   - Enable TLS for all services
   - Restrict scraper service access (only backend should call it)
   - Consider rate limiting for scraper endpoints

3. **Authentication**:
   - Use strong, unique JWT_SECRET
   - Regularly rotate credentials
   - Implement proper authentication checks

## Maintenance

1. **Backups**:
   - Configure MongoDB Atlas backups
   - Set up regular database dumps
   - Back up your environment configurations

2. **Monitoring**:
   - Set up health checks for all services (backend `/health`, scraper `/health`, version-service `/health`)
   - Configure alerts for service disruptions
   - Monitor database performance
   - Monitor scraper service memory usage (browser processes)
   - Track scraper response times and success rates
   - Monitor version service validation accuracy

3. **Updates**:
   - Regularly update your dependencies
   - Follow a CI/CD pipeline for safe updates
   - Test in staging before deploying to production

## Troubleshooting

### Common Issues

1. **Port Conflicts**: Check if ports in `.env` file are available
2. **Service Communication**: Verify service names match environment configuration
3. **Database Connection**: Ensure MongoDB URI is correct and accessible
4. **Scraper Failures**: Check browser dependencies in container environment
5. **Nginx Proxy Issues**: 
   - If `/api/*` routes return 404 or "Cannot POST /", check nginx upstream configuration
   - Ensure `BACKEND_HOST` and `BACKEND_PORT` environment variables are correct in frontend service
   - Variable-based proxy configurations may fail in some container environments; use `upstream` blocks instead
6. **Frontend Version Shows "unknown"**: Check that frontend self-registration is working via `/register-service` endpoint

### Debug Steps

1. **Check Service Health**:
   ```bash
   curl https://your-domain.com/health      # Frontend health
   curl https://your-domain.com/version     # Backend aggregated version
   ```

2. **Test Backend Connectivity**:
   ```bash
   curl -X POST https://your-domain.com/register-service \
     -H "Content-Type: application/json" \
     -d '{"serviceName":"test","version":"1.0.0"}'
   ```

3. **Verify Environment Variables**: Check that all required environment variables are set correctly in Coolify

4. **Review Logs**: Use Coolify's log viewer to check for startup errors and connection issues
