# Version Service

Centralized version management and validation service for the Figure Collector application. Provides application version information and validates service version combinations.

## Features

- **Application Version Management**: Centralized storage of app version, release date, and metadata
- **Service Combination Validation**: Validates that service versions are tested/compatible together
- **Lightweight Architecture**: Minimal Node.js service with JSON-based configuration
- **Health Monitoring**: Built-in health check endpoint

## API Endpoints

### GET /health
Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "healthy",
  "service": "version-service",
  "timestamp": "2025-08-09T00:00:00.000Z"
}
```

### GET /app-version
Get application version information.

**Response:**
```json
{
  "name": "Figure Collector Services",
  "version": "1.0.0",
  "releaseDate": "2025-08-08",
  "description": "Comprehensive figure collection management platform"
}
```

### GET /validate-versions
Validate service version combinations.

**Query Parameters:**
- `backend` - Backend service version
- `frontend` - Frontend service version  
- `scraper` - Scraper service version

**Example:**
```bash
curl "http://localhost:3001/validate-versions?backend=1.0.0&frontend=0.1.0&scraper=1.0.0"
```

**Response:**
```json
{
  "valid": true,
  "status": "tested",
  "message": "All service versions have been tested together",
  "combination": {
    "backend": "1.0.0",
    "frontend": "0.1.0", 
    "scraper": "1.0.0"
  }
}
```

**Validation Statuses:**
- `tested` - This exact combination has been validated
- `compatible` - Versions should work together based on compatibility rules
- `warning` - May work but not explicitly tested
- `invalid` - Known incompatible combination

## Configuration

The service reads from `version.json` for version data and validation rules:

```json
{
  "application": {
    "name": "Figure Collector Services",
    "version": "1.0.0",
    "releaseDate": "2025-08-08",
    "description": "Comprehensive figure collection management platform"
  },
  "validCombinations": [
    {
      "backend": "1.0.0",
      "frontend": "0.1.0",
      "scraper": "1.0.0",
      "status": "tested"
    }
  ]
}
```

## Environment Variables

- `PORT`: Server port (default: 3020)
  - Development: 3011
  - Test: 3006
  - Production: 3001
- `NODE_ENV`: Environment (development/production)

## Deployment

### Docker
```bash
docker build -t version-service .

# Development
docker run -p 3011:3011 -e PORT=3011 version-service

# Production  
docker run -p 3001:3001 -e PORT=3001 version-service
```

### Health Check
The container includes built-in health checks:
```bash
curl http://localhost:3001/health
```

## Integration

This service is called by the backend to:
1. Get application version information for display
2. Validate service version combinations for compatibility checking

**Backend Integration Example:**
```javascript
// Get app version
const response = await fetch(`${VERSION_SERVICE_URL}/app-version`);
const appInfo = await response.json();

// Validate combination
const validation = await fetch(`${VERSION_SERVICE_URL}/validate-versions?backend=${backendVer}&frontend=${frontendVer}&scraper=${scraperVer}`);
const validationResult = await validation.json();
```

## Architecture

The version service is designed to be:
- **Stateless**: All configuration is file-based
- **Lightweight**: Minimal dependencies and resource usage  
- **Independent**: Can be updated without affecting other services
- **Extensible**: Easy to add new validation rules and combinations

This service eliminates the need for each service to manage version compatibility matrices independently, centralizing this critical information in one place.