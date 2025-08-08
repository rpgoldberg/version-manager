# Coolify Deployment Guide

This guide explains how to deploy the Figure Collector application using Coolify.

## Prerequisites

- A server running Ubuntu 24.04 LTS
- Docker and Docker Compose installed
- Domain name (for Cloudflare Tunnel)
- Git repositories for backend and frontend components

## 1. Install Coolify

To install Coolify on your server, run the following command:

    curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

## 2. Configure Server for Dynamic IP

Set server hostname and configure for local discovery:

    # Set server hostname
    sudo hostnamectl set-hostname figure-server
    echo "127.0.0.1 figure-server" | sudo tee -a /etc/hosts

    # Install Avahi for mDNS discovery
    sudo apt update
    sudo apt install -y avahi-daemon
    sudo systemctl enable avahi-daemon
    sudo systemctl start avahi-daemon

## 3. Access Coolify Dashboard

1. Open a browser and navigate to `http://your-server-ip:8000`
2. Create an admin account
3. Follow the setup wizard

## 4. Add Git Repositories

1. In Coolify, go to "Sources" and click "New Source"
2. Select your Git provider (GitHub, GitLab, etc.)
3. Authenticate and connect your repositories:
   - figure-collector-backend
   - figure-collector-frontend
   - page-scraper

## 5. Create Coolify Project

1. Go to "Projects" and click "New Project"
2. Name it "FigureCollector"
3. Click "Create"

## 6. Environment Configuration

**IMPORTANT:** The application now uses environment variables for dev/prod deployment flexibility. 

Create your environment configuration:

1. Copy `.env.prod` (for production) or `.env.dev` (for development)
2. Update required values:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A secure random string
   - `REGISTRY_URL`: Your Docker registry URL

## 7. Add Scraper Service (Deploy First)

1. Within your project, click "New Service"
2. Select "Application" > "Docker Compose"
3. Choose your page-scraper repository
4. Configure environment variables from your .env file:
   - `NODE_ENV`: ${ENVIRONMENT}
   - `PORT`: ${SCRAPER_PORT}
5. Set service name to match `SCRAPER_SERVICE_NAME` from your .env
6. Click "Save" and "Deploy"

## 8. Add Backend Service

1. Within your project, click "New Service"
2. Select "Application" > "Docker Compose"
3. Choose your backend repository
4. Configure environment variables from your .env file:
   - `NODE_ENV`: ${ENVIRONMENT}
   - `PORT`: ${BACKEND_PORT}
   - `MONGODB_URI`: ${MONGODB_URI}
   - `JWT_SECRET`: ${JWT_SECRET}
   - `SCRAPER_SERVICE_URL`: ${SCRAPER_SERVICE_URL}
5. Set service name to match `BACKEND_SERVICE_NAME` from your .env
6. Click "Save" and "Deploy"

## 9. Add Frontend Service

1. Within your project, click "New Service"
2. Select "Application" > "Docker Compose"
3. Choose your frontend repository
4. Configure environment variables from your .env file:
   - `REACT_APP_API_URL`: /api (for local proxy)
   - `BACKEND_HOST`: ${BACKEND_HOST}
   - `BACKEND_PORT`: ${BACKEND_PORT}
   - `FRONTEND_PORT`: ${FRONTEND_PORT}
5. Set service name to match `FRONTEND_SERVICE_NAME` from your .env
6. Click "Save" and "Deploy"

## 10. Set Up Reverse Proxy

If you're not using Cloudflare Tunnel:

1. In Coolify, go to the "Services" tab in your project
2. Click on "Proxy" for the frontend service
3. Add your domain (e.g., figures.yourdomain.com)
4. Enable SSL with Let's Encrypt

## 11. Deploy the Application

1. In your project dashboard, click "Deploy" for each service in order:
   - First: Scraper Service
   - Second: Backend Service (depends on scraper)
   - Third: Frontend Service
2. Monitor the deployment logs for any errors
3. Once deployed, access your application at your configured domain

## Alternative: Using deploy.sh Script

For local deployments or development, you can use the provided deployment script:

```bash
# Deploy development environment
./deploy.sh dev

# Deploy production environment
./deploy.sh prod
```

This script automatically loads the correct environment variables and deploys all services using docker-compose.

## 11. Continuous Deployment

1. In your service settings, enable "Auto Deploy" to automatically deploy when changes are pushed to the repository
2. Configure webhook notifications if desired

## 12. Monitoring and Maintenance

1. Use Coolify's built-in monitoring to track service health
2. Use the logs viewer to troubleshoot issues
3. Set up backup schedules for your configuration

## Security Considerations

1. Always use environment variables for sensitive information
2. Use a strong, unique JWT_SECRET
3. Consider using Cloudflare Tunnel for secure connectivity
4. Regularly update your application containers
