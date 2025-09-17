# Version Manager API Documentation

## Overview
The Version Manager service is responsible for tracking service versions, compatibility, and health across the Figure Collector microservices architecture. It acts as the central registry for all running services.

## Authentication
Service registration endpoints require authentication via the `SERVICE_AUTH_TOKEN` environment variable.

```bash
Authorization: Bearer ${SERVICE_AUTH_TOKEN}
```

## Endpoints

### Service Registration

#### `POST /services/register`
Register or update a service with the Version Manager.

**Authentication Required:** Yes (Bearer token)

**Request Body:**
```json
{
  "serviceId": "backend",
  "name": "Figure Collector Backend",
  "version": "2.0.0",
  "endpoints": {
    "health": "http://backend:5050/health",
    "version": "http://backend:5050/version",
    "api": "http://backend:5050"
  },
  "dependencies": {
    "database": "mongodb",
    "scraper": "page-scraper"
  }
}
```

**Response (200 OK):**
```json
{
  "status": "registered",
  "serviceId": "backend",
  "version": "2.0.0",
  "message": "Service registered successfully"
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid SERVICE_AUTH_TOKEN
- `503 Service Unavailable`: Service registration not configured (no SERVICE_AUTH_TOKEN set)

### Service Discovery

#### `GET /services`
Get all registered services and their current status.

**Authentication Required:** No

**Response (200 OK):**
```json
{
  "services": {
    "backend": {
      "name": "Figure Collector Backend",
      "version": "2.0.0",
      "status": "healthy",
      "lastSeen": "2025-09-16T10:30:00Z",
      "endpoints": {
        "health": "http://backend:5050/health",
        "version": "http://backend:5050/version",
        "api": "http://backend:5050"
      }
    },
    "frontend": {
      "name": "Figure Collector Frontend",
      "version": "2.0.0",
      "status": "healthy",
      "lastSeen": "2025-09-16T10:31:00Z"
    },
    "page-scraper": {
      "name": "Page Scraper Service",
      "version": "2.0.0",
      "status": "healthy",
      "lastSeen": "2025-09-16T10:29:00Z"
    },
    "version-manager": {
      "name": "Version Manager",
      "version": "1.1.0",
      "status": "healthy",
      "lastSeen": "2025-09-16T10:32:00Z"
    }
  }
}
```

### Version Compatibility

#### `GET /compatibility`
Check compatibility between current service versions.

**Authentication Required:** No

**Response (200 OK):**
```json
{
  "status": "compatible",
  "tested": true,
  "combinations": [
    {
      "backend": "2.0.0",
      "frontend": "2.0.0",
      "scraper": "2.0.0",
      "status": "tested",
      "testDate": "2025-08-09"
    }
  ],
  "warnings": []
}
```

#### `POST /compatibility/check`
Check if a specific version combination is compatible.

**Authentication Required:** No

**Request Body:**
```json
{
  "backend": "2.0.0",
  "frontend": "2.0.0",
  "scraper": "2.0.0"
}
```

**Response (200 OK):**
```json
{
  "compatible": true,
  "tested": true,
  "message": "Version combination is tested and compatible"
}
```

### Health Check

#### `GET /health`
Get Version Manager service health status.

**Authentication Required:** No

**Response (200 OK):**
```json
{
  "status": "healthy",
  "service": "version-manager",
  "version": "1.1.0",
  "uptime": 3600,
  "timestamp": "2025-09-16T10:00:00Z"
}
```

## Service Registration Flow

### Direct Registration (Backend, Page-Scraper, Version-Manager)
Services with access to `SERVICE_AUTH_TOKEN` register directly:

```javascript
// Example: Backend registration
const registerWithVersionManager = async () => {
  const response = await fetch('http://version-manager:3001/services/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SERVICE_AUTH_TOKEN}`
    },
    body: JSON.stringify({
      serviceId: 'backend',
      name: 'Figure Collector Backend',
      version: packageJson.version,
      endpoints: {
        health: `http://backend:${PORT}/health`,
        version: `http://backend:${PORT}/version`,
        api: `http://backend:${PORT}`
      }
    })
  });

  if (!response.ok) {
    console.warn('Failed to register with Version Manager');
  }
};
```

### Proxy Registration (Frontend)
The Frontend cannot hold `SERVICE_AUTH_TOKEN` (browser-based), so it registers via Backend proxy:

```javascript
// Frontend calls Backend proxy endpoint
const registerFrontend = async () => {
  const response = await fetch('/register-frontend', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      serviceName: 'frontend',
      version: packageJson.version,
      name: packageJson.name
    })
  });
};

// Backend proxies to Version Manager with auth token
app.post('/register-frontend', async (req, res) => {
  const response = await fetch(`${VERSION_MANAGER_URL}/services/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SERVICE_AUTH_TOKEN}`
    },
    body: JSON.stringify({
      serviceId: 'frontend',
      name: 'Figure Collector Frontend',
      version: req.body.version
    })
  });

  res.json(await response.json());
});
```

## Environment Variables

### Required for Service Registration
- `SERVICE_AUTH_TOKEN`: Shared secret for authenticating service registrations

### Optional Configuration
- `PORT`: Port to run Version Manager on (default: 3001)
- `NODE_ENV`: Environment (development/production/test)

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "status": 400
}
```

Common error codes:
- `400 Bad Request`: Invalid request body or parameters
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Requested resource not found
- `500 Internal Server Error`: Server-side error
- `503 Service Unavailable`: Service not configured properly

## Testing

Test the registration endpoint with curl:

```bash
# Register a service
curl -X POST http://localhost:3001/services/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-service-auth-token" \
  -d '{
    "serviceId": "test-service",
    "name": "Test Service",
    "version": "1.0.0"
  }'

# Get all services
curl http://localhost:3001/services

# Check health
curl http://localhost:3001/health
```