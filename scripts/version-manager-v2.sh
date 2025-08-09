#!/bin/bash

# Figure Collector Services Version Manager v2
# Independent service versioning with dependency management

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION_FILE="$SCRIPT_DIR/../version.json"
VERSION_SERVICE_FILE="$SCRIPT_DIR/../version-service/version.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

usage() {
    echo -e "${BLUE}Figure Collector Services Version Manager v2${NC}"
    echo -e "${CYAN}Independent Service Versioning${NC}"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  show                     Show current versions and dependencies"
    echo "  bump <service> <type>    Bump specific service version"
    echo "  app-release <version>    Create new application release"
    echo "  sync                     Sync environment files with versions"
    echo "  sync-version             Sync version.json to version-service directory"
    echo "  check                    Check version compatibility"
    echo ""
    echo "Services: backend, frontend, scraper, infrastructure, app"
    echo "Types: major, minor, patch"
    echo ""
    echo "Examples:"
    echo "  $0 show                        # Show all versions"
    echo "  $0 bump backend patch          # Bump backend patch version only"
    echo "  $0 bump scraper minor          # Bump scraper minor (independent)"
    echo "  $0 app-release 1.1.0           # Create app v1.1.0 with current services"
    echo "  $0 sync                        # Update .env files"
    echo "  $0 sync-version                # Sync version.json to version-service"
    echo ""
}

get_version() {
    local service=$1
    local version
    if [ "$service" = "app" ]; then
        version=$(jq -r '.application.version' "$VERSION_FILE")
    else
        version=$(jq -r ".services.$service.version" "$VERSION_FILE")
    fi
    
    # Default to 1.0.0 if version is null or empty
    if [ "$version" = "null" ] || [ -z "$version" ]; then
        echo "1.0.0"
    else
        echo "$version"
    fi
}

get_date() {
    date '+%d-%b-%Y'
}

sync_version_file() {
    if [ -f "$VERSION_FILE" ]; then
        cp "$VERSION_FILE" "$VERSION_SERVICE_FILE"
        echo -e "${GREEN}✓${NC} Synced version.json to version-service directory"
    else
        echo -e "${RED}✗${NC} Main version.json not found at $VERSION_FILE"
        return 1
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
    echo -e "${YELLOW}Application Release:${NC}"
    local app_version=$(get_version app)
    local app_date=$(jq -r '.application.releaseDate' "$VERSION_FILE")
    echo "  figure-collector-services: v$app_version ($app_date)"
    echo ""
    
    echo -e "${YELLOW}Service Versions:${NC}"
    echo "  backend:        v$(get_version backend)   (coupled with frontend)"
    echo "  frontend:       v$(get_version frontend)  (coupled with backend)"
    echo "  scraper:        v$(get_version scraper)   (standalone platform service)"
    echo "  infrastructure: v$(get_version infrastructure)"
    echo ""
    
    echo -e "${YELLOW}Service Dependencies:${NC}"
    echo "  backend depends on:"
    echo "    scraper: $(jq -r '.dependencies.backend.scraper' "$VERSION_FILE")"
    echo "  frontend depends on:"
    echo "    backend: $(jq -r '.dependencies.frontend.backend' "$VERSION_FILE")"
    echo ""
    
    echo -e "${YELLOW}Last Tested Combination:${NC}"
    local last_combo=$(jq -r '.compatibility.testedCombinations[-1]' "$VERSION_FILE")
    echo "  backend: v$(echo "$last_combo" | jq -r '.backend')"
    echo "  frontend: v$(echo "$last_combo" | jq -r '.frontend')"
    echo "  scraper: v$(echo "$last_combo" | jq -r '.scraper')"
    echo "  verified: $(echo "$last_combo" | jq -r '.verified')"
}

update_service_version() {
    local service=$1
    local new_version=$2
    local temp_file=$(mktemp)
    local old_version=$(get_version "$service")
    
    # Check if service exists, if not create it with default structure
    local service_exists=$(jq -r ".services.$service" "$VERSION_FILE")
    if [ "$service_exists" = "null" ]; then
        # Create new service entry
        jq ".services.$service = {
            \"name\": \"$service\",
            \"version\": \"$new_version\",
            \"repository\": \"$service\",
            \"dockerImage\": \"$service:v$new_version\",
            \"ownedBy\": \"platform\",
            \"coupledWith\": []
        }" "$VERSION_FILE" > "$temp_file"
    else
        # Update existing service version and docker image
        jq ".services.$service.version = \"$new_version\" | .services.$service.dockerImage = \"$service:v$new_version\"" "$VERSION_FILE" > "$temp_file"
    fi
    
    mv "$temp_file" "$VERSION_FILE"
    sync_version_file
    echo -e "  ${GREEN}$service: v$old_version → v$new_version${NC}"
}

bump_service_version() {
    local service=$1
    local bump_type=$2
    
    if [ "$service" = "app" ]; then
        echo -e "${RED}Error: Use 'app-release' command for application versions${NC}"
        exit 1
    fi
    
    if [ -z "$service" ] || [ -z "$bump_type" ]; then
        echo -e "${RED}Error: Service and bump type required${NC}"
        usage
        exit 1
    fi
    
    # Check if service exists, default to 1.0.0 if not found
    local current_version=$(get_version "$service")
    local service_exists=$(jq -r ".services.$service" "$VERSION_FILE")
    
    if [ "$service_exists" = "null" ]; then
        echo -e "${YELLOW}Service '$service' not found in version.json, will initialize with v1.0.0${NC}"
        current_version="1.0.0"
        # Note: The service will be added to version.json when update_service_version is called
    fi
    
    echo -e "${YELLOW}Bumping $service ($bump_type)...${NC}"
    local new_version=$(bump_version "$current_version" "$bump_type")
    update_service_version "$service" "$new_version"
    
    # Update dependencies that reference this service
    if [ "$service" = "backend" ]; then
        local temp_file=$(mktemp)
        jq ".dependencies.frontend.backend = \"^$new_version\"" "$VERSION_FILE" > "$temp_file"
        mv "$temp_file" "$VERSION_FILE"
    sync_version_file
        echo -e "  ${CYAN}Updated frontend dependency: backend ^$new_version${NC}"
    fi
    
    if [ "$service" = "scraper" ]; then
        local temp_file=$(mktemp)
        jq ".dependencies.backend.scraper = \"^$new_version\"" "$VERSION_FILE" > "$temp_file"
        mv "$temp_file" "$VERSION_FILE"
    sync_version_file
        echo -e "  ${CYAN}Updated backend dependency: scraper ^$new_version${NC}"
    fi
}

create_app_release() {
    local target_version=$1
    
    if [ -z "$target_version" ]; then
        echo -e "${RED}Error: Target version required${NC}"
        usage
        exit 1
    fi
    
    echo -e "${YELLOW}Creating application release v$target_version...${NC}"
    
    # Update application version and date
    local temp_file=$(mktemp)
    local current_date=$(get_date)
    jq ".application.version = \"$target_version\" | .application.releaseDate = \"$current_date\"" "$VERSION_FILE" > "$temp_file"
    mv "$temp_file" "$VERSION_FILE"
    sync_version_file
    
    # Add tested combination
    local backend_ver=$(get_version backend)
    local frontend_ver=$(get_version frontend)
    local scraper_ver=$(get_version scraper)
    
    temp_file=$(mktemp)
    jq ".compatibility.testedCombinations += [{\"backend\": \"$backend_ver\", \"frontend\": \"$frontend_ver\", \"scraper\": \"$scraper_ver\", \"verified\": \"$current_date\"}]" "$VERSION_FILE" > "$temp_file"
    mv "$temp_file" "$VERSION_FILE"
    sync_version_file
    
    echo -e "${GREEN}Application release v$target_version created with:${NC}"
    echo -e "  backend: v$backend_ver"
    echo -e "  frontend: v$frontend_ver"
    echo -e "  scraper: v$scraper_ver"
    echo -e "  date: $current_date"
    
    # Sync environment files
    sync_env_files
    
    echo -e "${BLUE}Next steps:${NC}"
    echo "  1. Review changes: git diff"
    echo "  2. Commit: git add . && git commit -m 'Application release v$target_version'"
    echo "  3. Tag on develop: git tag v$target_version"
    echo "  4. Push: git push origin develop --tags"
    echo "  5. Merge develop → main for production"
}

sync_env_files() {
    echo -e "${YELLOW}Syncing environment files with current versions...${NC}"
    
    local backend_version=$(get_version backend)
    local frontend_version=$(get_version frontend)  
    local scraper_version=$(get_version scraper)
    
    for env_file in .env.dev .env.test .env.prod .env.example; do
        if [ -f "$env_file" ]; then
            sed -i "s/BACKEND_TAG=.*/BACKEND_TAG=v$backend_version/" "$env_file"
            sed -i "s/FRONTEND_TAG=.*/FRONTEND_TAG=v$frontend_version/" "$env_file"
            sed -i "s/SCRAPER_TAG=.*/SCRAPER_TAG=v$scraper_version/" "$env_file"
            echo -e "  ${GREEN}Updated $env_file${NC}"
        fi
    done
}

check_compatibility() {
    echo -e "${YELLOW}Checking version compatibility...${NC}"
    
    local backend_version=$(get_version backend)
    local frontend_version=$(get_version frontend)
    local scraper_version=$(get_version scraper)
    
    echo "Current versions:"
    echo "  backend: v$backend_version"
    echo "  frontend: v$frontend_version"
    echo "  scraper: v$scraper_version"
    echo ""
    
    # Check if this combination has been tested
    local tested=$(jq -r ".compatibility.testedCombinations[] | select(.backend == \"$backend_version\" and .frontend == \"$frontend_version\" and .scraper == \"$scraper_version\") | .verified" "$VERSION_FILE")
    
    if [ "$tested" != "" ] && [ "$tested" != "null" ]; then
        echo -e "${GREEN}✅ This combination was tested on: $tested${NC}"
    else
        echo -e "${YELLOW}⚠️  This combination has not been tested together${NC}"
        echo -e "${CYAN}Consider running integration tests before deployment${NC}"
    fi
}

# Main script logic
case $1 in
    show)
        show_versions
        ;;
    bump)
        if [ $# -lt 3 ]; then
            echo -e "${RED}Error: Service and bump type required${NC}"
            usage
            exit 1
        fi
        bump_service_version "$2" "$3"
        sync_env_files
        ;;
    app-release)
        if [ $# -lt 2 ]; then
            echo -e "${RED}Error: Target version required${NC}"
            usage
            exit 1
        fi
        create_app_release "$2"
        ;;
    sync)
        sync_env_files
        ;;
    sync-version)
        sync_version_file
        ;;
    check)
        check_compatibility
        ;;
    *)
        usage
        exit 1
        ;;
esac