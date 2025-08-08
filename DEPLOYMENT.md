# Figure Collector Services - Deployment Guide

This guide explains how to deploy the Figure Collector Services using the new environment-based configuration system.

## Overview

The system now uses environment variables to handle different deployment configurations (dev/prod) on the same host with different ports and service names.

## Environment Files

Four environment files are provided:

- `.env.example` - Template with all available variables
- `.env.dev` - Development environment configuration 
- `.env.test` - Test/staging environment configuration
- `.env.prod` - Production environment configuration

## Key Differences Between Environments

| Setting | Development | Test | Production |
|---------|-------------|------|------------|
| Service Names | `-dev` suffix | `-test` suffix | No suffix |
| Backend Port | 5060 | 5055 | 5050 |
| Frontend Port | 5061 | 5056 | 5051 |
| Scraper Port | 3010 | 3005 | 3000 |
| Database | separate dev DB | separate test DB | production DB |

## Quick Deployment

1. **Set up environment file:**
   ```bash
   # Copy and customize for your environment
   cp .env.example .env.dev
   # Edit .env.dev with your actual values (MongoDB URI, JWT secret, etc.)
   ```

2. **Deploy using the script:**
   ```bash
   # Deploy development environment
   ./deploy.sh dev
   
   # Deploy test environment
   ./deploy.sh test
   
   # Deploy production environment  
   ./deploy.sh prod
   ```

## Manual Deployment

If you prefer manual deployment:

```bash
# Load environment variables
export $(cat .env.dev | grep -v '^#' | xargs)

# Deploy with docker-compose
docker-compose --env-file .env.dev up -d
```

## Required Configuration

Before deploying, you MUST update these values in your environment file:

- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - A secure secret for JWT tokens
- `REGISTRY_URL` - Your Docker registry URL (if using)

## Service URLs

After deployment, services will be available at:

- **Development:**
  - Frontend: http://localhost:5061
  - Backend: http://localhost:5060
  - Scraper: http://localhost:3010

- **Test:**
  - Frontend: http://localhost:5056
  - Backend: http://localhost:5055
  - Scraper: http://localhost:3005

- **Production:**
  - Frontend: http://localhost:5051
  - Backend: http://localhost:5050  
  - Scraper: http://localhost:3000

## Coolify Integration

The docker-compose.yml includes Coolify labels for automatic deployment. Ensure your Coolify setup uses these environment variables for proper service naming and port configuration.

## Troubleshooting

1. **Port conflicts:** Check if the ports in your .env file are available
2. **Service communication:** Verify internal service hostnames match your .env configuration
3. **Database connection:** Ensure MongoDB URI is correct and accessible
4. **Registry access:** Verify REGISTRY_URL and image tags are correct

## Environment Variable Reference

See `.env.example` for a complete list of all configurable variables with descriptions.