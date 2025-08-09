# Git Flow & Versioning Workflow Reference

## Overview

This document provides the exact command sequences for managing git flow and versioning across the Figure Collector microservices architecture.

## Repository Structure

- `figure-collector-backend/` - Backend service repository
- `figure-collector-frontend/` - Frontend service repository  
- `page-scraper/` - Standalone scraping service repository
- `figure-collector-infra/` - Infrastructure and deployment repository

## Core Principles

1. **Never bump versions on feature branches** - only on develop
2. **Always tag on develop** after version bump and merge
3. **Main branch** gets merges from develop when ready for production
4. **Version bumping happens AFTER** the PR is merged into develop
5. **Each service versions independently**
6. **Application releases coordinate service versions**

## Complete Workflow Example

### Scenario: Adding new backend API endpoint

```bash
# === PHASE 1: Feature Development ===
cd figure-collector-backend
git checkout develop
git pull origin develop
git checkout -b feature/add-endpoint

# ... code the feature ...
git add .
git commit -m "Add new user stats API endpoint"
git commit -m "Add validation for stats endpoint"  
git commit -m "Add tests for user stats"
git push origin feature/add-endpoint

# === PHASE 2: PR and Review ===
# Create PR: feature/add-endpoint → develop (via GitHub/GitLab UI)
# Review, approve, merge

# === PHASE 3: Version Bumping (ON DEVELOP) ===
git checkout develop
git pull origin develop  # Gets the merged changes

# NOW bump the version on develop branch
./scripts/version-manager.sh bump backend minor  # 1.0.0 → 1.1.0

# Commit the version bump
git add .
git commit -m "Bump backend version to v1.1.0"

# Tag the version on develop
git tag v1.1.0
git push origin develop --tags

# === PHASE 4: Application Release (INFRA REPO) ===
cd ../figure-collector-infra
git checkout develop
git pull origin develop

# Create application release with current service versions
./scripts/version-manager.sh app-release 1.2.0  # App v1.2.0 with backend v1.1.0

git add .
git commit -m "Application release v1.2.0"
git tag v1.2.0  
git push origin develop --tags

# === PHASE 5: Production Deployment (MAIN BRANCH) ===
# When ready for production:
git checkout main
git pull origin main
git merge develop  # Fast-forward merge
git push origin main

# Deploy to production
./deploy.sh prod  # Uses the tagged versions from .env.prod
```

## Multi-Version Development Support

### Concurrent Feature Development

```bash
# Developer A: Working on v1.1.0 feature
git checkout develop
git checkout -b feature/user-stats
# ... develop feature ...

# Developer B: Working on v1.2.0 feature  
git checkout develop  # Start from latest
git checkout -b feature/new-auth-system
# ... develop feature ...

# Developer C: Critical v1.0.1 patch needed
git checkout v1.0.0  # Start from production tag
git checkout -b hotfix/security-patch
# ... fix critical bug ...
```

### Different Merge Strategies

```bash
# Feature A merges first:
# feature/user-stats → develop → bump to v1.1.0 → tag v1.1.0

# Feature B merges later:
# feature/new-auth-system → develop → bump to v1.2.0 → tag v1.2.0

# Hotfix goes directly to main:
# hotfix/security-patch → main → bump to v1.0.1 → tag v1.0.1 → merge back to develop
```

## Version Management Commands

### Show Current Versions
```bash
cd figure-collector-infra
./scripts/version-manager.sh show
```

### Bump Individual Service Version
```bash
# Patch version (bug fixes)
./scripts/version-manager.sh bump backend patch

# Minor version (new features)
./scripts/version-manager.sh bump backend minor

# Major version (breaking changes)
./scripts/version-manager.sh bump backend major
```

### Create Application Release
```bash
# Captures current versions of all services
./scripts/version-manager.sh app-release 1.2.0
```

### Sync Environment Files
```bash
# Update .env files with current service versions
./scripts/version-manager.sh sync
```

### Check Version Compatibility
```bash
# Check if current service combination has been tested
./scripts/version-manager.sh check
```

## Multi-Service Coordination

### When Multiple Services Need Updates

```bash
# 1. Backend changes first
cd figure-collector-backend
# ... merge feature → develop → bump → tag v1.1.0 ...

# 2. Frontend changes second  
cd figure-collector-frontend
# ... merge feature → develop → bump → tag v1.0.1 ...

# 3. Application release coordinates them
cd figure-collector-infra
./scripts/version-manager.sh app-release 1.2.0
# Captures: backend v1.1.0, frontend v1.0.1, scraper v1.0.0
```

## Production Release Strategies

### Option A: Regular Release Cycles
```bash
# Weekly/monthly: merge develop → main
git checkout main
git merge develop
./deploy.sh prod
```

### Option B: Feature-Based Releases  
```bash
# After each major feature is tested:
git checkout main  
git merge develop
git tag production-v1.2.0  # Optional production-specific tag
./deploy.sh prod
```

## Branch Strategy

```
main (production)
  ↑
develop (integration)
  ↑
feature/xyz (development)
```

### Version Tagging by Branch
- **main branch**: Production releases (v1.0.0, v1.1.0)
- **develop branch**: All service tags and application releases
- **feature branches**: No versioning/tagging

## Environment-Specific Versioning

### Development Environment
```bash
# Can use latest or specific versions
BACKEND_TAG=latest      # or v1.1.0-dev
FRONTEND_TAG=latest     # or v1.0.1-dev
SCRAPER_TAG=latest      # or v1.0.0-dev
```

### Test/Staging Environment
```bash
# Use release candidates or specific versions
BACKEND_TAG=v1.1.0
FRONTEND_TAG=v1.0.1
SCRAPER_TAG=v1.0.0
```

### Production Environment
```bash
# Always use specific stable versions
BACKEND_TAG=v1.1.0
FRONTEND_TAG=v1.0.1
SCRAPER_TAG=v1.0.0
```

## Independent Service Versioning

### page-scraper (Standalone Service)
```bash
# Scraper is completely independent
cd page-scraper
git checkout develop
# ... make changes ...
./scripts/version-manager.sh bump scraper minor  # Independent versioning
git tag v1.2.0  # Independent of other services
git push origin develop --tags
```

### figure-collector services (Coupled)
```bash
# Backend and frontend are often coordinated
# But can still version independently when changes don't affect each other
```

## Rollback Strategy

### Service Rollback
```bash
# Rollback to previous service version
cd figure-collector-backend
git checkout v1.0.0  # Previous stable version
# Build and deploy specific version
```

### Application Rollback
```bash
# Rollback entire application to previous tested combination
cd figure-collector-infra
git checkout v1.1.0  # Previous app version
./deploy.sh prod      # Deploys with previous service versions
```

## Troubleshooting Commands

### Check Current State
```bash
# Show all versions
./scripts/version-manager.sh show

# Check what would be deployed
./scripts/version-manager.sh check

# Sync environment files if needed
./scripts/version-manager.sh sync
```

### Fix Version Conflicts
```bash
# Reset to known good state
git checkout v1.0.0
./scripts/version-manager.sh sync

# Or fix specific service version
./scripts/version-manager.sh bump backend patch
```

## Best Practices Checklist

### DO ✅
- Use semantic versioning consistently
- Tag all releases on develop branch  
- Test version compatibility before production
- Document breaking changes in commit messages
- Use specific versions in production environment
- Keep scraper service versioning independent
- Merge develop → main for production releases

### DON'T ❌
- Tag or version on feature branches
- Use `latest` tags in production
- Skip integration testing of version combinations
- Make breaking changes in minor versions
- Deploy untested service version combinations
- Force version bumps without actual changes

## Date Formats

- **Version files**: DD-MMM-YYYY (e.g., "08-Jan-2025")
- **Git commits**: Standard git format
- **React app display**: "v1.0.0 • 08-Jan-2025"

## Future Considerations

### As the system grows:
- Consider automated version bumping in CI/CD
- Implement automated compatibility testing
- Add service mesh for version routing
- Expand to full independent service versioning if needed