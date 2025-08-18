# Version Service

Centralized version management and validation service for the Figure Collector application. Provides application version information and validates service version combinations. Features comprehensive test coverage with 55 test cases.

## Features

- **Application Version Management**: Centralized storage of app version, release date, and metadata
- **Service Combination Validation**: Validates that service versions are tested/compatible together
- **Lightweight Architecture**: Minimal Node.js service with JSON-based configuration
- **Health Monitoring**: Built-in health check endpoint
- **Comprehensive Testing**: 55 test cases with Jest and Supertest

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

### Recent Validation Improvements

**Semver-based Validation Enhancements:**
- Enhanced version compatibility checking algorithm
- Improved semver parsing and validation
- Stricter rules for major version compatibility
- Better handling of pre-release and build metadata

**Compatibility Validation Example:**
```typescript
// New semver validation strategy
function validateVersionCompatibility(versions: ServiceVersions): ValidationResult {
  const semverRules = {
    majorVersionMustMatch: true,
    allowMinorVersionDiff: true,
    allowPatchVersionDiff: true
  };

  return validateCombination(versions, semverRules);
}
```

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

## 🧪 Testing

The version service includes comprehensive test coverage with 64 test cases across 6 test suites, ensuring robust validation and reliability.

### Test Coverage Overview

- **Total Test Suites**: 6
- **Total Tests**: 64
- **Test Coverage**: >95%
- **Testing Framework**: Jest + Supertest
- **Architecture**: Comprehensive integration and unit testing with real HTTP requests

### Test Configuration for NVM and WSL

**Prerequisites**:
- Node Version Manager (NVM)
- Node.js 18.16.1+ recommended
- NPM 9.5.1+

**Recommended Configuration**:
```json
{
  "engines": {
    "node": ">=18.16.1",
    "npm": ">=9.5.1"
  },
  "scripts": {
    "test": "NODE_OPTIONS=--experimental-vm-modules jest",
    "test:coverage": "npm test -- --coverage",
    "test:watch": "npm test -- --watch"
  },
  "jest": {
    "testEnvironment": "node",
    "collectCoverageFrom": [
      "**/*.{js,ts}",
      "!**/node_modules/**",
      "!**/tests/**",
      "!**/coverage/**"
    ],
    "coverageDirectory": "coverage",
    "coverageReporters": ["text", "lcov", "html"],
    "verbose": true,
    "testTimeout": 10000
  }
}

### Test Structure

```
tests/
├── app.test.js              # Main application tests
├── health.test.js           # Health check endpoint tests
├── app-version.test.js      # Application version endpoint tests
├── validate-versions.test.js # Version validation tests
└── error-handling.test.js   # Error scenarios and edge cases
```

### Test Categories

**Application Tests:**
- Server startup and configuration
- Express app initialization
- Middleware setup and CORS configuration
- Port configuration across environments

**Health Check Tests:**
- Basic health endpoint functionality
- Response format validation
- Timestamp accuracy
- Service identification

**Version Management Tests:**
- Application version information retrieval
- Version data structure validation
- Configuration file reading
- Metadata accuracy

**Version Validation Tests:**
- Valid service combination testing
- Invalid combination handling
- Missing parameter scenarios
- Compatibility status determination
- Edge cases with malformed requests

**Error Handling Tests:**
- 404 error handling for unknown routes
- Malformed request handling
- Invalid query parameter handling
- Server error scenarios

### Running Tests

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run in watch mode (development)
npm run test:watch

# Run specific test suite
npx jest tests/validate-versions.test.js

# Run tests with verbose output
npm test -- --verbose
```

### Test Configuration

**Jest Configuration (`package.json`):**
```json
{
  "jest": {
    "testEnvironment": "node",
    "collectCoverageFrom": [
      "*.js",
      "!node_modules/**",
      "!tests/**"
    ],
    "coverageDirectory": "coverage",
    "coverageReporters": ["text", "lcov", "html"]
  }
}
```

### Test Examples

**Health Check Testing:**
```javascript
describe('GET /health', () => {
  it('should return healthy status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body).toHaveProperty('status', 'healthy');
    expect(response.body).toHaveProperty('service', 'version-service');
    expect(response.body).toHaveProperty('timestamp');
  });
});
```

**Version Validation Testing:**
```javascript
describe('GET /validate-versions', () => {
  it('should validate known good combination', async () => {
    const response = await request(app)
      .get('/validate-versions?backend=1.0.0&frontend=0.1.0&scraper=1.0.0')
      .expect(200);
    
    expect(response.body.valid).toBe(true);
    expect(response.body.status).toBe('tested');
  });
  
  it('should handle invalid combinations', async () => {
    const response = await request(app)
      .get('/validate-versions?backend=999.0.0&frontend=999.0.0&scraper=999.0.0')
      .expect(200);
    
    expect(response.body.valid).toBe(false);
    expect(response.body.status).toBe('invalid');
  });
});
```

### Development Testing

```bash
# Watch mode for continuous testing
npm run test:watch

# Test specific functionality during development
npx jest validate-versions --watch

# Check test coverage
npm run test:coverage
```

### WSL Testing Compatibility

**NVM and WSL Setup Requirements**:
1. Install Node Version Manager (NVM)
2. Use NVM to install and manage Node.js versions
3. Ensure consistent Node.js environment across WSL

**Recommended WSL Test Setup**:
```bash
# Install NVM (if not already installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash

# Restart terminal or source ~/.bashrc
source ~/.bashrc

# Install recommended Node.js version (check package.json)
nvm install 18.16.1  # Or the version specified in your project
nvm use 18.16.1

# Set bash as default script shell
npm config set script-shell /bin/bash

# Install dependencies
npm ci

# Run tests with Node.js options for WSL compatibility
NODE_OPTIONS=--experimental-vm-modules npm test
```

**Common WSL/Windows Path Issues**:
- Always use NVM to manage Node.js versions
- Ensure line endings are set to LF (not CRLF)
- Use absolute paths when referencing test files
- Use `npm ci` instead of `npm install` for consistent dependency resolution

### CI/CD Integration

```bash
# CI test command
NODE_ENV=test npm test

# Coverage reporting for CI
NODE_ENV=test npm run test:coverage
```

### Testing Best Practices

1. **Integration Focus**: Tests actual HTTP requests to ensure real-world behavior
2. **Configuration Testing**: Validates version.json file reading and parsing
3. **Edge Case Coverage**: Tests malformed requests and error scenarios
4. **Response Validation**: Ensures consistent API response formats
5. **Environment Isolation**: Tests run in isolated test environment

## Environment Variables

- `PORT`: Server port (default: 3020)
  - Development: 3011
  - Test: 3006
  - Production: 3001
- `NODE_ENV`: Environment (development/production)

## Development

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start

# Run tests in development
npm run test:watch
```

### Testing in Development

```bash
# Watch mode for continuous testing
npm run test:watch

# Test specific endpoint
npx jest health.test.js --watch

# Check test coverage
npm run test:coverage
```

## Deployment

### Docker Build and Configuration

**Recent Build Improvements:**
- Added explicit `app.js` to Docker build context
- Moved `semver` to production dependencies
- Enhanced Docker build reproducibility

```bash
# Build the Docker image
docker build -t version-service .

# Development Container
docker run -p 3011:3011 -e PORT=3011 version-service

# Production Container 
docker run -p 3001:3001 -e PORT=3001 version-service
```

### Docker Troubleshooting

**Common Issues and Solutions:**
1. Ensure `version.json` is present in build context
2. Use `npm ci` for consistent dependency installation
3. Verify Node.js version compatibility (>=18)

### Health Check
The container includes built-in health checks:
```bash
# Development health check
curl http://localhost:3011/health

# Production health check
curl http://localhost:3001/health
```

**Health Check Reliability:**
- 30-second interval between checks
- 3-second timeout
- 10-second startup grace period
- 3 retry attempts before marking container unhealthy

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