# Figure Collector Services - Versioning Strategy

## Overview

This document outlines the versioning strategy for the Figure Collector microservices architecture.

## Versioning Approach

### Synchronized Versioning (Current)
All services maintain synchronized major versions for consistency and compatibility:
- **Application Version**: Overall release version (v1.0.0)
- **Service Versions**: Individual service versions (v1.0.0 each)

### Version Types

#### Major Version (X.0.0)
- Breaking API changes
- Database schema changes
- Architectural changes
- All services bump together

#### Minor Version (1.X.0)
- New features (backward compatible)
- New API endpoints
- Can be independent per service

#### Patch Version (1.0.X)
- Bug fixes
- Security patches
- Performance improvements
- Independent per service

## Version Management

### Auto-Initialization for New Services

The version manager automatically handles new services:

```bash
# If service doesn't exist in version.json, it's auto-created with v1.0.0
./scripts/version-manager.sh bump my-new-service minor
# Output: Service 'my-new-service' not found, will initialize with v1.0.0
# Result: my-new-service v1.0.0 → v1.1.0
```

**Default Structure for New Services:**
- Version: `1.0.0`
- Repository: Same as service name
- Docker Image: `service-name:v1.0.0`
- Ownership: `platform` (can be manually changed to `figure-collector`)
- Coupling: `[]` (independent by default)

### Using the Version Manager

```bash
# Show current versions
./scripts/version-manager.sh show

# Bump specific service (independent versioning)
./scripts/version-manager.sh bump backend patch
./scripts/version-manager.sh bump frontend minor

# Bump new service (auto-creates with v1.0.0 default)
./scripts/version-manager.sh bump new-service minor

# Create application release (coordinates current service versions)
./scripts/version-manager.sh app-release 1.1.0

# Sync environment files with current versions
./scripts/version-manager.sh sync

# Check version compatibility
./scripts/version-manager.sh check
```

### Release Process

#### 1. Development Phase
- Work on feature branches
- Use `latest` tags for development builds
- Services can have different patch versions

#### 2. Pre-Release Phase
```bash
# Prepare release candidate
./scripts/version-manager.sh app-release 1.1.0-rc1

# Test in staging environment
./deploy.sh test
```

#### 3. Release Phase
```bash
# Final release preparation
./scripts/version-manager.sh app-release 1.1.0

# Review changes
git diff

# Commit and tag
git add .
git commit -m "Release v1.1.0"
git tag v1.1.0
git push origin main --tags
```

#### 4. Service-Specific Tags
Tag each service repository:
```bash
# In each service repository
git tag v1.1.0
git push origin v1.1.0
```

## Git Flow Integration

### Branch Strategy
```
main (production)
  ↑
develop (integration)
  ↑
feature/xyz (development)
```

### Version Tagging
- **main branch**: Production releases (v1.0.0, v1.1.0)
- **develop branch**: Release candidates (v1.1.0-rc1)
- **feature branches**: Development builds (latest, feature-xyz)

## Environment-Specific Versioning

### Development
```bash
BACKEND_TAG=latest      # or feature-xyz
FRONTEND_TAG=latest     # or feature-xyz  
SCRAPER_TAG=latest      # or feature-xyz
```

### Test/Staging
```bash
BACKEND_TAG=v1.1.0-rc1
FRONTEND_TAG=v1.1.0-rc1
SCRAPER_TAG=v1.1.0-rc1
```

### Production
```bash
BACKEND_TAG=v1.0.0      # Specific stable versions
FRONTEND_TAG=v1.0.0
SCRAPER_TAG=v1.0.0
```

## Docker Image Tagging Strategy

### Image Naming Convention
```
registry/figure-collector-backend:v1.0.0
registry/figure-collector-frontend:v1.0.0
registry/page-scraper:v1.0.0
```

### Multi-Tag Strategy
Each release gets multiple tags:
```bash
# Specific version
docker tag app:build app:v1.0.0

# Latest stable
docker tag app:build app:latest

# Major version latest
docker tag app:build app:v1
```

## API Versioning

### URL Versioning (Recommended)
```
/api/v1/figures
/api/v1/users
/api/v1/scraper
```

### Header Versioning (Alternative)
```
Accept: application/vnd.figure-collector.v1+json
```

## Database Versioning

### Migration Strategy
- **Major versions**: May require data migration
- **Minor versions**: Backward-compatible schema changes
- **Patch versions**: No schema changes

### Environment Databases
- `figure-collector`: Production
- `figure-collector-test`: Testing/staging  
- `figure-collector-dev`: Development

## Compatibility Matrix

### Service Compatibility
| Backend | Frontend | Scraper | Compatible |
|---------|----------|---------|------------|
| v1.0.x  | v1.0.x   | v1.0.x  | ✅ |
| v1.1.x  | v1.0.x   | v1.0.x  | ✅ |
| v2.0.x  | v1.x.x   | v1.x.x  | ❌ |

## Troubleshooting

### Version Conflicts
```bash
# Check current versions and compatibility
./scripts/version-manager.sh show
./scripts/version-manager.sh check

# Sync environment files
./scripts/version-manager.sh sync

# Reset to known good state
git checkout v1.0.0
```

### Adding New Services
```bash
# New services auto-initialize with v1.0.0
./scripts/version-manager.sh bump new-service patch
# Creates: new-service v1.0.0 → v1.0.1

# Manually add to existing application release
./scripts/version-manager.sh app-release 1.2.0
```

### Missing Version Data
If `version.json` is corrupted or missing service data:
```bash
# Services default to v1.0.0 automatically
./scripts/version-manager.sh bump missing-service minor
# Auto-creates with proper structure
```

### Rollback Strategy
```bash
# Rollback to previous version
docker-compose down
# Update .env files to previous version
docker-compose up -d
```

## Best Practices

### DO
- ✅ Use semantic versioning consistently
- ✅ Tag all releases in git
- ✅ Test version compatibility
- ✅ Document breaking changes
- ✅ Use specific versions in production
- ✅ Let new services auto-initialize with v1.0.0
- ✅ Use `app-release` to coordinate service versions

### DON'T  
- ❌ Use `latest` in production
- ❌ Skip version testing
- ❌ Make breaking changes in minor versions
- ❌ Deploy untested version combinations
- ❌ Manually edit version.json (use the script instead)

## Future Considerations

### Independent Service Versioning
As the system grows, consider moving to independent service versioning:
- Each service maintains its own version lifecycle
- API contracts define compatibility
- Service mesh for version routing

### Automated Version Management
- CI/CD integration for version bumping
- Automated compatibility testing
- Semantic release automation