## Version Manager Service Primer Command

**IMPORTANT**: This is the version-manager service - a lightweight Node.js/JavaScript service for version coordination across the Figure Collector application.

### Step 1: Service Configuration
1. Read `CLAUDE.md` for service-specific configuration and agent instructions
2. Understand this service's role in the overall Figure Collector ecosystem

### Step 2: Service Structure Analysis

**Core Files Analysis**:
- Read `package.json` to understand dependencies and npm scripts
- Read `app.js` for Express server setup and API endpoints
- Read `index.js` for server startup and configuration
- Read `service-registry.js` for service discovery functionality
- Read `version.json` for version configuration data

**Testing Structure**:
- Examine `tests/` directory to understand current test coverage
- Review existing test patterns and conventions
- Check test scripts in `package.json`

**Configuration Files**:
- Review `Dockerfile` and `Dockerfile.test` for containerization setup
- Check WSL-specific configuration in `WSL_TEST_FIX_SOLUTION.md`

### Step 3: Service Understanding

**API Endpoints**:
- Identify all HTTP endpoints and their purposes
- Understand version validation and compatibility checking logic
- Map service registry functionality

**Dependencies and Configuration**:
- Review external dependencies and their usage
- Understand configuration loading mechanisms
- Identify environment-specific settings

**Service Integration**:
- Understand how this service communicates with other Figure Collector services
- Identify service discovery patterns
- Map version coordination workflows

### Step 4: Available Tools and Agents

**Available Sub-Agents**:
- `test-generator-version-manager` (Haiku) - Jest + Supertest test generation
- `documentation-manager` (Haiku) - Documentation synchronization
- `validation-gates` - Testing and validation specialist

**Development Commands**:
- `npm run dev` - Development server
- `npm run test` - Test execution
- `npm run lint` - JavaScript linting
- `npm run build` - Docker build validation

### Step 5: Summary Report

After analysis, provide:
- **Service Purpose**: Role in Figure Collector ecosystem
- **Technology Stack**: Node.js, Express, JavaScript specifics
- **Key Functionality**: Version management, service registry, compatibility checking
- **API Surface**: All endpoints and their responsibilities
- **Test Coverage**: Current testing approach and coverage
- **Integration Points**: How it connects to other services
- **Development Workflow**: Setup, testing, and deployment processes

**Remember**: This is a standalone service - treat it as an independent codebase while understanding its role in the larger Figure Collector application.