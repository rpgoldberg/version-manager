#!/bin/bash

# Figure Collector Services Version Manager
# Handles version bumping across microservices

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION_FILE="$SCRIPT_DIR/../version.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

usage() {
    echo -e "${BLUE}Figure Collector Services Version Manager${NC}"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  show                     Show current versions"
    echo "  bump <type> [service]    Bump version (major|minor|patch)"
    echo "  release <version>        Prepare release with version"
    echo "  sync                     Sync environment files with versions"
    echo ""
    echo "Examples:"
    echo "  $0 show                  # Show all versions"
    echo "  $0 bump patch backend    # Bump backend patch version"
    echo "  $0 bump minor            # Bump all services minor version"
    echo "  $0 release 1.1.0         # Prepare v1.1.0 release"
    echo "  $0 sync                  # Update .env files with current versions"
    echo ""
}

get_version() {
    local service=$1
    if [ "$service" = "app" ]; then
        jq -r '.application.version' "$VERSION_FILE"
    else
        jq -r ".services.$service.version" "$VERSION_FILE"
    fi
}

bump_version() {
    local current_version=$1
    local bump_type=$2
    
    IFS='.' read -ra VERSION_PARTS <<< "$current_version"
    local major=${VERSION_PARTS[0]}
    local minor=${VERSION_PARTS[1]}
    local patch=${VERSION_PARTS[2]}
    
    case $bump_type in
        major)
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        minor)
            minor=$((minor + 1))
            patch=0
            ;;
        patch)
            patch=$((patch + 1))
            ;;
        *)
            echo -e "${RED}Error: Invalid bump type. Use major, minor, or patch${NC}"
            exit 1
            ;;
    esac
    
    echo "$major.$minor.$patch"
}

show_versions() {
    echo -e "${BLUE}=== Figure Collector Services Versions ===${NC}"
    echo ""
    echo -e "${YELLOW}Application:${NC}"
    echo "  figure-collector-services: v$(get_version app)"
    echo ""
    echo -e "${YELLOW}Services:${NC}"
    echo "  backend:        v$(get_version backend)"
    echo "  frontend:       v$(get_version frontend)"
    echo "  scraper:        v$(get_version scraper)"
    echo "  infrastructure: v$(get_version infrastructure)"
    echo ""
}

update_version_file() {
    local service=$1
    local new_version=$2
    local temp_file=$(mktemp)
    
    if [ "$service" = "app" ]; then
        jq ".application.version = \"$new_version\" | .application.releaseDate = \"$(date +%Y-%m-%d)\"" "$VERSION_FILE" > "$temp_file"
    else
        jq ".services.$service.version = \"$new_version\" | .services.$service.dockerImage = \"$service:v$new_version\"" "$VERSION_FILE" > "$temp_file"
    fi
    
    mv "$temp_file" "$VERSION_FILE"
}

bump_service_version() {
    local bump_type=$1
    local service=$2
    
    if [ -z "$service" ]; then
        # Bump all services
        echo -e "${YELLOW}Bumping all services ($bump_type)...${NC}"
        
        local app_version=$(get_version app)
        local new_app_version=$(bump_version "$app_version" "$bump_type")
        
        update_version_file "app" "$new_app_version"
        
        for svc in backend frontend scraper infrastructure; do
            local current_version=$(get_version "$svc")
            local new_version=$(bump_version "$current_version" "$bump_type")
            update_version_file "$svc" "$new_version"
            echo -e "  ${GREEN}$svc: v$current_version → v$new_version${NC}"
        done
        
        echo -e "  ${GREEN}Application: v$app_version → v$new_app_version${NC}"
    else
        # Bump specific service
        echo -e "${YELLOW}Bumping $service ($bump_type)...${NC}"
        
        local current_version=$(get_version "$service")
        local new_version=$(bump_version "$current_version" "$bump_type")
        
        update_version_file "$service" "$new_version"
        echo -e "  ${GREEN}$service: v$current_version → v$new_version${NC}"
    fi
}

sync_env_files() {
    echo -e "${YELLOW}Syncing environment files with current versions...${NC}"
    
    local backend_version=$(get_version backend)
    local frontend_version=$(get_version frontend)  
    local scraper_version=$(get_version scraper)
    
    for env_file in .env.dev .env.test .env.prod; do
        if [ -f "$env_file" ]; then
            sed -i "s/BACKEND_TAG=.*/BACKEND_TAG=v$backend_version/" "$env_file"
            sed -i "s/FRONTEND_TAG=.*/FRONTEND_TAG=v$frontend_version/" "$env_file"
            sed -i "s/SCRAPER_TAG=.*/SCRAPER_TAG=v$scraper_version/" "$env_file"
            echo -e "  ${GREEN}Updated $env_file${NC}"
        fi
    done
    
    # Update example file
    if [ -f ".env.example" ]; then
        sed -i "s/BACKEND_TAG=.*/BACKEND_TAG=v$backend_version/" ".env.example"
        sed -i "s/FRONTEND_TAG=.*/FRONTEND_TAG=v$frontend_version/" ".env.example"
        sed -i "s/SCRAPER_TAG=.*/SCRAPER_TAG=v$scraper_version/" ".env.example"
        echo -e "  ${GREEN}Updated .env.example${NC}"
    fi
}

prepare_release() {
    local target_version=$1
    
    echo -e "${YELLOW}Preparing release v$target_version...${NC}"
    
    # Update application version
    update_version_file "app" "$target_version"
    
    # Update all services to target version
    for svc in backend frontend scraper infrastructure; do
        update_version_file "$svc" "$target_version"
    done
    
    # Sync environment files
    sync_env_files
    
    echo -e "${GREEN}Release v$target_version prepared!${NC}"
    echo -e "${BLUE}Next steps:${NC}"
    echo "  1. Review changes: git diff"
    echo "  2. Commit: git add . && git commit -m 'Release v$target_version'"
    echo "  3. Tag: git tag v$target_version"
    echo "  4. Push: git push origin main --tags"
}

# Main script logic
case $1 in
    show)
        show_versions
        ;;
    bump)
        if [ $# -lt 2 ]; then
            echo -e "${RED}Error: Bump type required${NC}"
            usage
            exit 1
        fi
        bump_service_version "$2" "$3"
        sync_env_files
        ;;
    release)
        if [ $# -lt 2 ]; then
            echo -e "${RED}Error: Target version required${NC}"
            usage
            exit 1
        fi
        prepare_release "$2"
        ;;
    sync)
        sync_env_files
        ;;
    *)
        usage
        exit 1
        ;;
esac