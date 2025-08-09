# Deployment Guide for Figure Collector

This guide details how to deploy the Figure Collector application using a microservices architecture.

## Architecture Overview

The Figure Collector application consists of the following components:

1. **Backend Service**: Node.js/Express API with MongoDB Atlas
2. **Frontend Service**: React application with nginx reverse proxy
3. **Page Scraper Service**: Standalone web scraping microservice with browser automation
4. **Infrastructure**: Deployment configuration (Docker, Coolify, Cloudflare)

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
1. Deploy scraper service first
2. Deploy backend service (depends on scraper)
3. Deploy frontend service

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
   - Set up health checks for all services (backend `/health`, scraper `/health`)
   - Configure alerts for service disruptions
   - Monitor database performance
   - Monitor scraper service memory usage (browser processes)
   - Track scraper response times and success rates

3. **Updates**:
   - Regularly update your dependencies
   - Follow a CI/CD pipeline for safe updates
   - Test in staging before deploying to production
