#!/bin/bash

# Coordinate tagging across all repositories
# Only tags repos that have actual changes

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION_FILE="$SCRIPT_DIR/../version.json"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

usage() {
    echo -e "${BLUE}Release Tagger${NC}"
    echo "Tags service repositories based on changes"
    echo ""
    echo "Usage: $0 [--dry-run] [--force-all]"
    echo ""
    echo "Options:"
    echo "  --dry-run     Show what would be tagged without doing it"
    echo "  --force-all   Tag all repos even without changes"
    echo ""
}

get_service_version() {
    local service=$1
    jq -r ".services.$service.version" "$VERSION_FILE"
}

check_repo_changes() {
    local repo_path=$1
    local last_tag=$2
    
    if [ ! -d "$repo_path" ]; then
        echo "skip" # Repo not available locally
        return
    fi
    
    cd "$repo_path"
    
    # Check if there are commits since last tag
    if git tag | grep -q "$last_tag"; then
        local commits_since=$(git rev-list "${last_tag}..HEAD" --count 2>/dev/null || echo "0")
        if [ "$commits_since" -gt 0 ]; then
            echo "changed"
        else
            echo "unchanged"
        fi
    else
        echo "new" # First tag
    fi
}

tag_repository() {
    local repo_path=$1
    local service=$2
    local version=$3
    local dry_run=$4
    
    if [ ! -d "$repo_path" ]; then
        echo -e "${YELLOW}  Skipping $service (repo not found locally)${NC}"
        return
    fi
    
    cd "$repo_path"
    local tag="v$version"
    
    if [ "$dry_run" = "true" ]; then
        echo -e "${CYAN}  Would tag $service: $tag${NC}"
    else
        # Check if tag already exists
        if git tag | grep -q "^$tag$"; then
            echo -e "${YELLOW}  Tag $tag already exists in $service${NC}"
        else
            git tag "$tag"
            echo -e "${GREEN}  Tagged $service: $tag${NC}"
            
            # Ask about pushing
            read -p "Push tag $tag to origin? (y/n): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                git push origin develop --tags
                echo -e "${GREEN}  Pushed $service tags${NC}"
            fi
        fi
    fi
}

main() {
    local dry_run=false
    local force_all=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                dry_run=true
                shift
                ;;
            --force-all)
                force_all=true
                shift
                ;;
            --help)
                usage
                exit 0
                ;;
            *)
                echo -e "${RED}Unknown option: $1${NC}"
                usage
                exit 1
                ;;
        esac
    done
    
    echo -e "${BLUE}=== Release Tagging ===${NC}"
    echo ""
    
    # Repository paths (relative to infra)
    local backend_path="../figure-collector-backend"
    local frontend_path="../figure-collector-frontend"  
    local scraper_path="../page-scraper"
    
    # Get versions
    local backend_version=$(get_service_version backend)
    local frontend_version=$(get_service_version frontend)
    local scraper_version=$(get_service_version scraper)
    
    echo -e "${YELLOW}Service Versions:${NC}"
    echo "  backend: v$backend_version"
    echo "  frontend: v$frontend_version"
    echo "  scraper: v$scraper_version"
    echo ""
    
    # Check each repository
    if [ "$force_all" = "true" ]; then
        echo -e "${YELLOW}Force tagging all repositories...${NC}"
        tag_repository "$backend_path" "backend" "$backend_version" "$dry_run"
        tag_repository "$frontend_path" "frontend" "$frontend_version" "$dry_run"
        tag_repository "$scraper_path" "scraper" "$scraper_version" "$dry_run"
    else
        echo -e "${YELLOW}Checking repositories for changes...${NC}"
        
        # Backend
        local backend_status=$(check_repo_changes "$backend_path" "v$backend_version")
        case $backend_status in
            "changed"|"new")
                echo -e "${GREEN}  backend: Has changes, will tag${NC}"
                tag_repository "$backend_path" "backend" "$backend_version" "$dry_run"
                ;;
            "unchanged")
                echo -e "${CYAN}  backend: No changes since v$backend_version${NC}"
                ;;
            "skip")
                echo -e "${YELLOW}  backend: Repository not available locally${NC}"
                ;;
        esac
        
        # Frontend  
        local frontend_status=$(check_repo_changes "$frontend_path" "v$frontend_version")
        case $frontend_status in
            "changed"|"new")
                echo -e "${GREEN}  frontend: Has changes, will tag${NC}"
                tag_repository "$frontend_path" "frontend" "$frontend_version" "$dry_run"
                ;;
            "unchanged")
                echo -e "${CYAN}  frontend: No changes since v$frontend_version${NC}"
                ;;
            "skip")
                echo -e "${YELLOW}  frontend: Repository not available locally${NC}"
                ;;
        esac
        
        # Scraper
        local scraper_status=$(check_repo_changes "$scraper_path" "v$scraper_version") 
        case $scraper_status in
            "changed"|"new")
                echo -e "${GREEN}  scraper: Has changes, will tag${NC}"
                tag_repository "$scraper_path" "scraper" "$scraper_version" "$dry_run"
                ;;
            "unchanged")
                echo -e "${CYAN}  scraper: No changes since v$scraper_version${NC}"
                ;;
            "skip")
                echo -e "${YELLOW}  scraper: Repository not available locally${NC}"
                ;;
        esac
    fi
    
    echo ""
    echo -e "${BLUE}Tagging complete!${NC}"
}

main "$@"