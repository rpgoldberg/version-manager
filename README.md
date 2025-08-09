# Figure Collector Services

A comprehensive microservices application for collecting, managing, and displaying figure information with web scraping capabilities.

## 🏗️ Architecture

The application consists of four main services:

- **Backend API** (`figure-collector-backend`) - Node.js/Express API with MongoDB, acts as orchestrator
- **Frontend Web App** (`figure-collector-frontend`) - React application with responsive UI and self-registration
- **Page Scraper** (`page-scraper`) - Dedicated web scraping service with browser automation
- **Version Service** (`version-service`) - Centralized version management and validation service

## ✨ Features

### Core Functionality
- User authentication and authorization with JWT
- Figure collection management (CRUD operations)
- Advanced search and filtering
- Statistics and analytics dashboard
- Responsive design for all devices

### Web Scraping Capabilities
- **MFC (MyFigureCollection) Integration**: Automatically extract figure details from MFC URLs
- **Generic Scraper**: Configurable scraping for multiple sites
- **Browser Automation**: Cloudflare bypass using Puppeteer with browser pooling
- **Real-time Processing**: Live URL processing in the add figure form

### Technical Features
- Microservice architecture with container communication
- Environment-based configuration for dev/prod deployments
- Automatic JWT token refresh
- Health checks and monitoring
- nginx reverse proxy with configurable routing
- Centralized version management and validation
- Service self-registration architecture (eliminates circular dependencies)

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- MongoDB Atlas account (or local MongoDB)
- Node.js 20+ (for development)

### Environment Setup

1. **Configure environment:**
   ```bash
   # Copy environment template
   cp .env.example .env.dev
   
   # Edit with your values
   nano .env.dev
   ```

2. **Required environment variables:**
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - Secure secret for JWT tokens
   - Update ports if needed (dev: 5060/5061, prod: 5000/80)

### Deployment

**Option 1: Quick Deploy Script**
```bash
# Deploy development environment
./deploy.sh dev

# Deploy production environment
./deploy.sh prod
```

**Option 2: Manual Deploy**
```bash
# Load environment
export $(cat .env.dev | grep -v '^#' | xargs)

# Deploy services
docker-compose --env-file .env.dev up -d
```

### Access Points

**Development:**
- Frontend: http://localhost:5061
- Backend API: http://localhost:5060
- Scraper Service: http://localhost:3010
- Version Service: http://localhost:3011

**Test:**
- Frontend: http://localhost:5056
- Backend API: http://localhost:5055
- Scraper Service: http://localhost:3005
- Version Service: http://localhost:3006

**Production:**
- Frontend: http://localhost:5051
- Backend API: http://localhost:5050
- Scraper Service: http://localhost:3000
- Version Service: http://localhost:3001

## 🔧 Development

### Local Development Setup

1. **Install dependencies for each service:**
   ```bash
   # Backend
   cd figure-collector-backend && npm install
   
   # Frontend  
   cd figure-collector-frontend && npm install
   
   # Scraper
   cd page-scraper && npm install
   ```

2. **Run services individually:**
   ```bash
   # Backend (with MongoDB running)
   cd figure-collector-backend && npm run dev
   
   # Frontend
   cd figure-collector-frontend && npm start
   
   # Scraper
   cd page-scraper && npm run dev
   ```

### Environment Configuration

The application uses environment variables for flexible deployment:

| Variable | Development | Test | Production | Description |
|----------|-------------|------|------------|-------------|
| `BACKEND_PORT` | 5060 | 5055 | 5050 | Backend API port |
| `FRONTEND_PORT` | 5061 | 5056 | 5051 | Frontend port |
| `SCRAPER_PORT` | 3010 | 3005 | 3000 | Scraper service port |
| `VERSION_SERVICE_PORT` | 3011 | 3006 | 3001 | Version service port |
| `*_SERVICE_NAME` | `*-dev` suffix | `*-test` suffix | No suffix | Service names for networking |

See `.env.example` for complete configuration options.

## 🕷️ Web Scraping

### MFC (MyFigureCollection) Scraping

The scraper automatically extracts:
- Figure name from Character field
- Manufacturer from Company section
- Scale from Dimensions (e.g., "1/7")
- Origin series information
- Images and additional metadata

### Usage

1. **In the Add Figure form:**
   - Enter an MFC URL in the "Figure URL" field
   - Data automatically populates as you type
   - Review and adjust before saving

2. **Programmatic API:**
   ```bash
   # Development
   curl -X POST http://localhost:3010/scrape/mfc \
     -H "Content-Type: application/json" \
     -d '{"url": "https://myfigurecollection.net/item/123456"}'
     
   # Production  
   curl -X POST http://localhost:3000/scrape/mfc \
     -H "Content-Type: application/json" \
     -d '{"url": "https://myfigurecollection.net/item/123456"}'
   ```

### Supported Sites

Currently supports MFC with plans for:
- AmiAmi
- HobbyLink Japan
- BigBadToyStore
- Other figure retailers

### Page Scraper Technical Details

**Standalone Service Features:**
- **Browser Pool**: Pre-launched Chromium browsers (3-5 second response time)
- **Cloudflare Bypass**: Real browser automation defeats anti-bot protection
- **Generic Engine**: Configurable CSS selectors for any site
- **Error Recovery**: Handles timeouts, challenges, and extraction failures
- **Independent Scaling**: Completely decoupled from main application

**Service Communication:**
```javascript
// Backend calls scraper via environment variable
const scraperUrl = process.env.SCRAPER_SERVICE_URL; // http://page-scraper-dev:3010
const response = await fetch(`${scraperUrl}/scrape/mfc`, {...});
```

**Deployment Isolation:**
- Separate Docker container with browser dependencies
- Own health checks and monitoring  
- Independent versioning and releases
- Can be used by multiple applications

## 🏷️ Version Management

The application implements a sophisticated version management system:

### Architecture
- **Version Service**: Centralized service that stores application version info and validates service combinations
- **Backend Orchestrator**: Aggregates version info from all services and validates combinations
- **Frontend Self-Registration**: Frontend registers its version with backend on startup (eliminates circular dependencies)
- **Service Communication**: Backend fetches scraper version directly

### Version Display
- Version info displayed in footer with hover popup
- Shows individual service versions with health status
- Displays validation results (tested/compatible/warning/invalid)
- Color-coded badges for quick status identification

### API Endpoints
**Version Service:**
- `GET /app-version` - Get application version and metadata
- `GET /validate-versions?backend=X&frontend=Y&scraper=Z` - Validate service combination

**Backend:**
- `POST /register-service` - Service registration endpoint (used by frontend)
- `GET /version` - Aggregated version info with validation results

### Service Registration Flow
1. Frontend starts and registers with backend via `/register-service` (proxied by nginx)
2. Backend fetches scraper version from scraper service
3. Backend calls version-service to validate the combination
4. Frontend displays comprehensive version info with validation status

### API Architecture
The application uses a hybrid routing approach with nginx upstream configuration:

**Business Logic APIs** (via `/api` prefix)
- Frontend: `/api/figures` → Backend: `/figures`
- Frontend: `/api/users` → Backend: `/users`
- Nginx strips `/api` prefix when proxying to backend via `upstream backend` block

**Infrastructure APIs** (direct proxy)
- Frontend: `/version` → Backend: `/version`
- Frontend: `/register-service` → Backend: `/register-service`
- No prefix stripping, direct 1:1 mapping via `upstream backend` block

### Nginx Proxy Configuration
The frontend uses an nginx `upstream` block for reliable backend connectivity:
```nginx
upstream backend {
    server ${BACKEND_HOST}:${BACKEND_PORT};
}
```

This approach ensures stable service-to-service communication and avoids DNS resolution issues that can occur in containerized environments.

## 📁 Repository Structure

This infrastructure repository contains deployment configuration. The services are in separate repositories:

- `figure-collector-backend` - Express.js API server and orchestrator
- `figure-collector-frontend` - React web application with self-registration
- `page-scraper` - Web scraping microservice
- `version-service` - Version management and validation service
- `figure-collector-infra` - **This repository** - Deployment configuration

## 🔐 Security Features

- JWT authentication with automatic token refresh
- Protected API routes with middleware
- Environment-based configuration (no hardcoded secrets)
- Input validation and sanitization
- Secure password hashing
- CORS protection

## 📚 API Documentation

### Authentication
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile

### Figures
- `GET /api/figures` - List figures with pagination/filtering
- `POST /api/figures` - Create new figure
- `GET /api/figures/:id` - Get figure details
- `PUT /api/figures/:id` - Update figure
- `DELETE /api/figures/:id` - Delete figure

### Version Management (Infrastructure APIs)
- `POST /register-service` - Service registration (used by frontend)
- `GET /version` - Get aggregated version info with validation

### Scraping (Backend Proxy)
- `POST /api/figures/scrape-mfc` - Scrape MFC URL via backend

### Page Scraper Service (Direct API)
- `GET /health` - Health check endpoint
- `GET /version` - Get scraper version info
- `GET /configs` - Get available site configurations
- `POST /scrape/mfc` - MFC scraping with pre-built config
- `POST /scrape` - Generic scraping with custom selectors

### Version Service (Direct API)
- `GET /health` - Health check endpoint
- `GET /app-version` - Get application version and metadata
- `GET /validate-versions` - Validate service version combinations

#### Example Scraper Usage:
```bash
# MFC scraping
curl -X POST http://localhost:3000/scrape/mfc \
  -H "Content-Type: application/json" \
  -d '{"url": "https://myfigurecollection.net/item/123456"}'

# Generic scraping  
curl -X POST http://localhost:3000/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/item/123",
    "config": {
      "imageSelector": ".product-image img",
      "manufacturerSelector": ".brand-name",
      "nameSelector": ".product-title"
    }
  }'
```

## 🚀 Deployment Options

### Coolify (Recommended)
See `deployment/coolify/setup-instructions.md` for detailed Coolify deployment guide.

### Docker Compose
Use the provided `docker-compose.yml` with environment variables for flexible deployment.

### Manual Deployment
Each service can be deployed independently using their respective Dockerfiles.

## 🔍 Monitoring & Health Checks

All services include health check endpoints:
- Backend: `/health`
- Frontend: nginx health checks
- Scraper: `/health`

Docker health checks are configured with appropriate intervals and retry logic.

## 🐛 Troubleshooting

### Common Issues

1. **Port Conflicts**: Check if ports in `.env` file are available
2. **Service Communication**: Verify service names match environment configuration
3. **Database Connection**: Ensure MongoDB URI is correct and accessible
4. **Scraper Failures**: Check browser dependencies in container environment

### Logs

View service logs:
```bash
docker-compose logs -f [service-name]
```

### Health Checks

Verify service health:
```bash
# Development environment
curl http://localhost:5060/health  # Backend
curl http://localhost:3010/health  # Scraper
curl http://localhost:3011/health  # Version Service

# Test environment  
curl http://localhost:5055/health  # Backend
curl http://localhost:3005/health  # Scraper
curl http://localhost:3006/health  # Version Service

# Production environment
curl http://localhost:5050/health  # Backend
curl http://localhost:3000/health  # Scraper
curl http://localhost:3001/health  # Version Service
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review deployment documentation
3. Check Docker logs for errors
4. Create an issue with detailed error information
