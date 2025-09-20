# Version Service - Standalone Microservice

Centralized version management and validation service for the Figure Collector application. Provides application version information and validates service version combinations through a standalone microservice architecture. Critically synchronized with figure-collector-infra version management and featuring comprehensive test coverage with 120 test cases.

## Features

- **Application Version Management**: Centralized storage of app version, release date, and metadata
- **Service Combination Validation**: Validates that service versions are tested/compatible together
- **Lightweight Architecture**: Minimal Node.js service with JSON-based configuration
- **Health Monitoring**: Built-in health check endpoint
- **Comprehensive Testing**: 120 test cases with Jest and Supertest
- **Enhanced Version Compatibility**: Detailed compatibility checking across services

## API Endpoints

### GET /
Health check endpoint serving as root and basic health monitor.

**Response:**
```json
{
  "status": "healthy",
  "service": "version-manager",
  "timestamp": "2025-08-09T00:00:00.000Z"
}
```

### GET /health
Detailed health check endpoint with service status.

**Response:**
```json
{
  "status": "healthy", 
  "service": "version-manager",
  "timestamp": "2025-08-09T00:00:00.000Z",
  "versionData": "loaded"
}
```

### GET /app-version
Get application version information.

**Response:**
```json
{
  "name": "figure-collector-version-manager",
  "version": "1.1.0",
  "releaseDate": "01-Sep-2025",
  "description": "Standalone version management microservice for Figure Collector",
  "architectureStatus": "Standalone Microservice"
}
```

### GET /version-info
Comprehensive version data retrieval.

**Response Fields:**
- `application`: App metadata
- `services`: Registered service versions
- `dependencies`: Service dependencies
- `compatibility`: Version compatibility information

### GET /validate-versions
Validate service version combinations.

**Query Parameters:**
- `backend` - Backend service version
- `frontend` - Frontend service version  
- `scraper` - Scraper service version

**Possible Statuses:**
- `tested` - Exact combination validated
- `compatible` - Likely to work together
- `warning` - Potential compatibility issues
- `invalid` - Known incompatible combination

**Example Validation Request:**
```bash
curl "http://localhost:3001/validate-versions?backend=1.0.0&frontend=1.0.0&scraper=1.0.0"
```

**Response Example:**
```json
{
  "valid": true,
  "status": "tested", 
  "verified": "19-Aug-2024",
  "message": "This service combination has been tested and verified"
}
```

## Version Compatibility Strategy

### Semver-based Validation
- Major version differences require explicit testing
- Minor and patch version differences allowed with warnings
- Pre-release and build metadata intelligently handled

### Compatibility Validation Rules
- Exact tested combinations preferred
- Compatible versions with minimal conflict tolerance
- Detailed warning system for potential mismatches

## Configuration

The service uses `version.json` for configuration:

```json
{
  "application": {
    "name": "Figure Collector Services",
    "version": "1.0.0",
    "releaseDate": "19-Aug-2024"
  },
  "validCombinations": [
    {
      "backend": "1.0.0",
      "frontend": "1.0.0", 
      "scraper": "1.0.0",
      "status": "tested"
    }
  ]
}
```

## Testing

### Coverage
- **Total Test Suites**: 6
- **Total Tests**: 120
- **Test Coverage**: 94.88%
- **Framework**: Jest + Supertest

### Test Categories
- Application startup and configuration
- Health check endpoints
- Version information retrieval
- Version combination validation
- Error handling scenarios
- Signal termination testing

### Running Tests
```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Environment Variables

- `PORT`: Server port
  - Development: 3006
  - Test: 3011
  - Production: 3001
- `NODE_ENV`: Environment mode

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
```

## Docker Deployment

### Production Container
```bash
# Build Docker image
docker build -t version-manager .

# Run containers
docker run -p 3006:3006 -e PORT=3006 version-manager  # Development
docker run -p 3011:3011 -e PORT=3011 version-manager  # Testing
docker run -p 3001:3001 -e PORT=3001 version-manager  # Production
```

### Test Container (Toggleable)
The test container (`Dockerfile.test`) can run in two modes:

```bash
# Build test image
docker build -f Dockerfile.test -t version-manager:test .

# Mode 1: Run tests (default)
docker run version-manager:test

# Mode 2: Run as service (for integration testing)
docker run -e RUN_SERVER=1 -p 3011:3011 version-manager:test
```

**Features:**
- Default mode runs test suite with coverage
- Setting `RUN_SERVER=1` starts the service instead
- Useful for integration testing scenarios
- Consistent across all services in the stack

## Integration

Provides version and compatibility information for:
1. Application version display
2. Service version compatibility checking

**Backend Integration Example:**
```javascript
// Get app version
const appInfo = await fetch(`${VERSION_SERVICE_URL}/app-version`).json();

// Validate service combination
const validation = await fetch(
  `${VERSION_SERVICE_URL}/validate-versions?backend=${backendVer}&frontend=${frontendVer}&scraper=${scraperVer}`
).json();
```

## Architecture Principles

- **Stateless**: File-based configuration
- **Lightweight**: Minimal dependencies
- **Independent**: Standalone microservice
- **Centralized**: Cross-service version management
- **Extensible**: Simple rule addition
- **Infrastructure Synchronized**: Dynamic version tracking from figure-collector-infra

### Infrastructure Synchronization
This service is now a standalone microservice, dynamically synchronized with the figure-collector-infra version management system. Key synchronization features:
- Real-time version tracking
- Cross-service compatibility validation
- Centralized version configuration management

Centralizes version compatibility management across the entire Figure Collector service ecosystem.