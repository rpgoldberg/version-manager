#!/bin/bash

# Deployment script for Figure Collector Services
# Usage: ./deploy.sh [dev|test|prod]

set -e

ENVIRONMENT=${1:-dev}

if [ "$ENVIRONMENT" != "dev" ] && [ "$ENVIRONMENT" != "test" ] && [ "$ENVIRONMENT" != "prod" ]; then
    echo "Error: Environment must be 'dev', 'test', or 'prod'"
    echo "Usage: ./deploy.sh [dev|test|prod]"
    exit 1
fi

echo "🚀 Deploying Figure Collector Services for $ENVIRONMENT environment..."

# Load environment variables
if [ -f ".env.$ENVIRONMENT" ]; then
    echo "📋 Loading environment variables from .env.$ENVIRONMENT"
    export $(cat .env.$ENVIRONMENT | grep -v '^#' | xargs)
else
    echo "❌ Error: .env.$ENVIRONMENT file not found!"
    exit 1
fi

# Display configuration
echo "🔧 Configuration:"
echo "  Environment: $ENVIRONMENT"
echo "  Backend: $BACKEND_SERVICE_NAME:$BACKEND_PORT"
echo "  Frontend: $FRONTEND_SERVICE_NAME:$FRONTEND_PORT"
echo "  Scraper: $SCRAPER_SERVICE_NAME:$SCRAPER_PORT"
echo ""

# Run docker-compose (we're already in the infra directory)
echo "🐳 Starting services with docker-compose..."
docker-compose --env-file .env.$ENVIRONMENT up -d

echo "✅ Deployment complete!"
echo "🌐 Frontend: http://localhost:$FRONTEND_PORT"
echo "🔧 Backend: http://localhost:$BACKEND_PORT"
echo "🔍 Scraper: http://localhost:$SCRAPER_PORT"