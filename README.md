# Figure Collector Services

A comprehensive microservices application for collecting, managing, and displaying figure information with web scraping capabilities.

## 🏗️ Architecture

The application consists of three main services:

- **Backend API** (`figure-collector-backend`) - Node.js/Express API with MongoDB
- **Frontend Web App** (`figure-collector-frontend`) - React application with responsive UI
- **Page Scraper** (`page-scraper`) - Dedicated web scraping service with browser automation

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
- Scraper Service: http://localhost:3000

**Production:**
- Frontend: http://localhost:80
- Backend API: http://localhost:5000
- Scraper Service: http://localhost:3000

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

| Variable | Development | Production | Description |
|----------|-------------|------------|-------------|
| `BACKEND_PORT` | 5060 | 5000 | Backend API port |
| `FRONTEND_PORT` | 5061 | 80 | Frontend port |
| `SCRAPER_PORT` | 3000 | 3000 | Scraper service port |
| `*_SERVICE_NAME` | `*-dev` suffix | No suffix | Service names for networking |

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

## 📁 Repository Structure

This infrastructure repository contains deployment configuration. The services are in separate repositories:

- `figure-collector-backend` - Express.js API server
- `figure-collector-frontend` - React web application  
- `page-scraper` - Web scraping microservice
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

### Scraping
- `POST /api/figures/scrape-mfc` - Scrape MFC URL
- `POST /scraper/scrape/mfc` - Direct scraper API

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
curl http://localhost:5060/health  # Backend
curl http://localhost:3000/health  # Scraper
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
