#!/bin/bash

# Reorganize commits script for figure-collector-services
# Creates clean logical commits with preserved timestamps

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

reorganize_backend() {
    echo -e "${BLUE}=== Reorganizing Backend History ===${NC}"
    
    cd /home/rgoldberg/projects/figure-collector-services/figure-collector-backend
    
    # Ensure we're on the right branch and it's clean
    git checkout feature/mfcdata
    git status --porcelain | grep -q . && {
        echo -e "${RED}Working directory not clean. Please commit or stash changes.${NC}"
        return 1
    }
    
    # Create clean branch from main
    git checkout -B feature/mfcdata-clean main
    
    echo -e "${YELLOW}Creating logical commits with preserved dates...${NC}"
    
    # Commit 1: Schema and Model Changes (Aug 1-2)
    echo -e "${CYAN}1/4: Schema and model improvements${NC}"
    git cherry-pick --no-commit 5d079fc cd3934a
    
    GIT_COMMITTER_DATE="2025-08-01 17:30:00 -0500" \
    git commit --date="2025-08-01 17:30:00 -0500" -m "Improve figure schema flexibility

- Make location, boxNumber, and scale fields optional
- Enhance data model to support incomplete figure information
- Improve user experience for figure data entry"
    
    # Commit 2: MFC Scraping Integration (Aug 2-3)
    echo -e "${CYAN}2/4: MFC scraping integration and external service migration${NC}"
    git cherry-pick --no-commit 7e2e1b7 892be3c d8f0567 a9506d7 121d09e efc0816 9d5feed 5ede291 0034665 8de2aac f913761
    
    GIT_COMMITTER_DATE="2025-08-03 15:00:00 -0500" \
    git commit --date="2025-08-03 15:00:00 -0500" -m "Integrate MFC scraping with dedicated service

- Add MFC link field and optional processing
- Implement external page-scraper service integration
- Remove inline Puppeteer dependencies for better separation
- Add robust error handling for scraping operations
- Handle Cloudflare protection with dedicated service"
    
    # Commit 3: Version Management and Service Registration (Aug 8-9)
    echo -e "${CYAN}3/4: Version management and service orchestration${NC}"
    git cherry-pick --no-commit 1dbcb88 cfc5f39 fc863f1 0c2ed9e ff64d69 4b7dd71 51afd07 55bf4b0 b6d6d95 aea3a7a
    
    GIT_COMMITTER_DATE="2025-08-09 02:00:00 -0500" \
    git commit --date="2025-08-09 02:00:00 -0500" -m "Add comprehensive version management system

- Implement service version orchestration and aggregation
- Add service registration endpoint for frontend self-registration
- Integrate with version-service for compatibility validation
- Add health check and version endpoints
- Remove circular dependencies with self-registration pattern"
    
    # Commit 4: Configuration and Documentation Updates
    echo -e "${CYAN}4/4: Configuration updates and cleanup${NC}"
    git cherry-pick --no-commit 773ef83 d82774f e6bb2fb 4dd29c2 d77d92d 7f06579 226f74f 3ea08fb
    
    GIT_COMMITTER_DATE="2025-08-09 10:30:00 -0500" \
    git commit --date="2025-08-09 10:30:00 -0500" -m "Update configuration and documentation

- Update Docker configuration for production deployment
- Enhance environment variable configuration
- Update API documentation for new infrastructure endpoints
- Clean up debug logging and test code
- Improve session handling and timeout configuration"
    
    echo -e "${GREEN}✓ Backend reorganization complete!${NC}"
    echo -e "${CYAN}New commit structure:${NC}"
    git log --oneline -4
}

reorganize_frontend() {
    echo -e "${BLUE}=== Reorganizing Frontend History ===${NC}"
    
    cd /home/rgoldberg/projects/figure-collector-services/figure-collector-frontend
    
    # Ensure we're on the right branch and it's clean
    git checkout feature/mfcdata
    git status --porcelain | grep -q . && {
        echo -e "${RED}Working directory not clean. Please commit or stash changes.${NC}"
        return 1
    }
    
    # Create clean branch from main
    git checkout -B feature/mfcdata-clean main
    
    echo -e "${YELLOW}Creating logical commits with preserved dates...${NC}"
    
    # Commit 1: UI Schema and Form Improvements (Aug 1-2)
    echo -e "${CYAN}1/4: UI improvements and form enhancements${NC}"
    git cherry-pick --no-commit 745a9d9 86d5ac9
    
    GIT_COMMITTER_DATE="2025-08-01 18:00:00 -0500" \
    git commit --date="2025-08-01 18:00:00 -0500" -m "Enhance figure forms and UI components

- Make location, boxNumber, and scale fields optional in forms
- Improve image display and resizing on figure cards
- Enhance figure input form layouts
- Better user experience for incomplete figure data"
    
    # Commit 2: MFC Scraping Integration (Aug 2-3)
    echo -e "${CYAN}2/4: MFC scraping integration and real-time processing${NC}"
    git cherry-pick --no-commit 3e94b5f 5358ce8 a50d806 a5925fa f8b4819 eb5bba3 8b0aefa c09611f 7d40f42 d67f1ee a0835a0 e0fa738 2ba30ca
    
    GIT_COMMITTER_DATE="2025-08-03 15:30:00 -0500" \
    git commit --date="2025-08-03 15:30:00 -0500" -m "Implement real-time MFC scraping in forms

- Add MFC link field with real-time scraping on blur
- Integrate with external scraper service
- Add loading spinners and user feedback
- Handle scraping errors gracefully
- Improve form validation and data population"
    
    # Commit 3: Version Management and Self-Registration (Aug 8-9)
    echo -e "${CYAN}3/4: Version management and self-registration system${NC}"
    git cherry-pick --no-commit b31b5a6 8aab029 b0902b0 ffb182f 2dbfec4 8e0d923 9232fc3
    
    GIT_COMMITTER_DATE="2025-08-09 01:00:00 -0500" \
    git commit --date="2025-08-09 01:00:00 -0500" -m "Add version display and self-registration

- Implement frontend self-registration with backend
- Add version information display in footer with hover popup
- Show service versions and validation status
- Integrate with version-service for compatibility checking
- Add cache busting for version updates"
    
    # Commit 4: Infrastructure and Configuration Updates
    echo -e "${CYAN}4/4: Nginx configuration and infrastructure updates${NC}"
    git cherry-pick --no-commit 327fbc6 e8c09e1 3932420 7c2d7a2 3117893 fd89001 a3bfe6c f50edf3 0ce556d 0b36243 08a04af 7dada44 582ea84 3042f03 570bbdf dc675ea
    
    GIT_COMMITTER_DATE="2025-08-09 11:00:00 -0500" \
    git commit --date="2025-08-09 11:00:00 -0500" -m "Update nginx configuration and infrastructure

- Implement nginx upstream configuration for reliable service communication
- Add proper environment variable configuration
- Update Docker configuration for multi-environment deployment
- Add nginx template system for dynamic configuration
- Fix proxy routing and API endpoint configuration
- Resolve nginx variable resolution issues"
    
    echo -e "${GREEN}✓ Frontend reorganization complete!${NC}"
    echo -e "${CYAN}New commit structure:${NC}"
    git log --oneline -4
}

reorganize_scraper() {
    echo -e "${BLUE}=== Reorganizing Scraper History ===${NC}"
    
    cd /home/rgoldberg/projects/figure-collector-services/page-scraper
    
    # Check if feature/mfcdata branch exists
    if ! git rev-parse --verify feature/mfcdata >/dev/null 2>&1; then
        echo -e "${YELLOW}No feature/mfcdata branch found in scraper service${NC}"
        return 0
    fi
    
    # Ensure we're on the right branch and it's clean
    git checkout feature/mfcdata
    git status --porcelain | grep -q . && {
        echo -e "${RED}Working directory not clean. Please commit or stash changes.${NC}"
        return 1
    }
    
    # Create clean branch from main
    git checkout -B feature/mfcdata-clean main
    
    echo -e "${YELLOW}Creating logical commits with preserved dates...${NC}"
    
    # Get all commits and create logical groupings
    local commits=$(git rev-list $(git merge-base main feature/mfcdata)..feature/mfcdata --reverse)
    
    if [ -n "$commits" ]; then
        # Commit 1: Core scraper service implementation
        echo -e "${CYAN}1/2: Core scraper service implementation${NC}"
        echo "$commits" | head -n $(($(echo "$commits" | wc -l) / 2)) | xargs git cherry-pick --no-commit
        
        GIT_COMMITTER_DATE="2025-08-03 14:30:00 -0500" \
        git commit --date="2025-08-03 14:30:00 -0500" -m "Implement generic web scraping service

- Add browser pool for performance optimization (3-5 second responses)
- Implement generic scraping engine with configurable selectors
- Add MFC-specific configuration and endpoints
- Include Cloudflare bypass capabilities
- Add health check and monitoring endpoints"
        
        # Commit 2: Configuration and deployment updates
        echo -e "${CYAN}2/2: Configuration and deployment improvements${NC}"
        echo "$commits" | tail -n +$(($(echo "$commits" | wc -l) / 2 + 1)) | xargs git cherry-pick --no-commit
        
        GIT_COMMITTER_DATE="2025-08-08 16:00:00 -0500" \
        git commit --date="2025-08-08 16:00:00 -0500" -m "Add version management and deployment configuration

- Add version endpoint for service registration
- Update Docker configuration for production
- Add comprehensive documentation
- Improve error handling and logging"
        
        echo -e "${GREEN}✓ Scraper reorganization complete!${NC}"
        echo -e "${CYAN}New commit structure:${NC}"
        git log --oneline -2
    else
        echo -e "${YELLOW}No commits found to reorganize in scraper service${NC}"
    fi
}

reorganize_infra() {
    echo -e "${BLUE}=== Reorganizing Infrastructure History ===${NC}"
    
    cd /home/rgoldberg/projects/figure-collector-services/figure-collector-infra
    
    # Check if feature/mfcdata branch exists
    if ! git rev-parse --verify feature/mfcdata >/dev/null 2>&1; then
        echo -e "${YELLOW}No feature/mfcdata branch found in infrastructure${NC}"
        return 0
    fi
    
    # Ensure we're on the right branch and it's clean
    git checkout feature/mfcdata
    git status --porcelain | grep -q . && {
        echo -e "${RED}Working directory not clean. Please commit or stash changes.${NC}"
        return 1
    }
    
    # Create clean branch from main
    git checkout -B feature/mfcdata-clean main
    
    echo -e "${YELLOW}Creating logical commits with preserved dates...${NC}"
    
    # Get all commits and create logical groupings
    local commits=$(git rev-list $(git merge-base main feature/mfcdata)..feature/mfcdata --reverse)
    
    if [ -n "$commits" ]; then
        # Commit 1: Version service implementation
        echo -e "${CYAN}1/3: Version service implementation${NC}"
        local version_commits=$(echo "$commits" | head -n $(($(echo "$commits" | wc -l) / 3)))
        if [ -n "$version_commits" ]; then
            echo "$version_commits" | xargs git cherry-pick --no-commit
        fi
        
        GIT_COMMITTER_DATE="2025-08-08 18:00:00 -0500" \
        git commit --date="2025-08-08 18:00:00 -0500" -m "Add centralized version management service

- Implement version-service with validation capabilities
- Add application version tracking and compatibility matrix
- Create service combination validation endpoints
- Add comprehensive version management scripts"
        
        # Commit 2: Deployment configuration updates
        echo -e "${CYAN}2/3: Multi-environment deployment configuration${NC}"
        local deploy_commits=$(echo "$commits" | sed -n "$(($(echo "$commits" | wc -l) / 3 + 1)),$(($(echo "$commits" | wc -l) * 2 / 3))p")
        if [ -n "$deploy_commits" ]; then
            echo "$deploy_commits" | xargs git cherry-pick --no-commit
        fi
        
        GIT_COMMITTER_DATE="2025-08-08 20:00:00 -0500" \
        git commit --date="2025-08-08 20:00:00 -0500" -m "Add multi-environment deployment configuration

- Add environment-specific configuration files (.env.dev, .env.prod)
- Update Docker Compose for multi-environment support
- Add deployment scripts and automation
- Configure service networking and environment variables"
        
        # Commit 3: Documentation and cleanup
        echo -e "${CYAN}3/3: Documentation and deployment guides${NC}"
        local doc_commits=$(echo "$commits" | tail -n +$(($(echo "$commits" | wc -l) * 2 / 3 + 1)))
        if [ -n "$doc_commits" ]; then
            echo "$doc_commits" | xargs git cherry-pick --no-commit
        fi
        
        GIT_COMMITTER_DATE="2025-08-09 12:00:00 -0500" \
        git commit --date="2025-08-09 12:00:00 -0500" -m "Add comprehensive documentation and setup guides

- Add Coolify deployment instructions
- Update README with architecture documentation
- Add troubleshooting guides and best practices
- Clean up configuration files and version management"
        
        echo -e "${GREEN}✓ Infrastructure reorganization complete!${NC}"
        echo -e "${CYAN}New commit structure:${NC}"
        git log --oneline -3
    else
        echo -e "${YELLOW}No commits found to reorganize in infrastructure${NC}"
    fi
}

# Main execution
case $1 in
    backend)
        reorganize_backend
        ;;
    frontend)  
        reorganize_frontend
        ;;
    scraper)
        reorganize_scraper
        ;;
    infra)
        reorganize_infra
        ;;
    all)
        reorganize_backend
        echo ""
        reorganize_frontend  
        echo ""
        reorganize_scraper
        echo ""
        reorganize_infra
        ;;
    *)
        echo "Usage: $0 {backend|frontend|scraper|infra|all}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 Reorganization complete!${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Review the new commit history: git log --oneline"
echo "2. Test each service to ensure functionality"
echo "3. Replace old branches: git branch -D feature/mfcdata && git branch -m feature/mfcdata-clean feature/mfcdata"
echo "4. Create pull requests with clean, logical commits"
echo ""
echo -e "${CYAN}Backup available at: /home/rgoldberg/projects/figure-collector-services/git-backups-20250809_110949${NC}"