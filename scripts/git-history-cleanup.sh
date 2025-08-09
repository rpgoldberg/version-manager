#!/bin/bash

# Git History Cleanup Script for Figure Collector Services
# Safely reorganizes feature/mfcdata commits with preserved timestamps

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICES_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
BACKUP_DIR="$SERVICES_DIR/git-backups-$(date +%Y%m%d_%H%M%S)"

# Service repositories
SERVICES=("figure-collector-backend" "figure-collector-frontend" "page-scraper" "figure-collector-infra")

usage() {
    echo -e "${BLUE}Git History Cleanup Script${NC}"
    echo -e "${CYAN}Safely reorganize feature/mfcdata commits with preserved timestamps${NC}"
    echo ""
    echo "Usage: $0 <command> [service]"
    echo ""
    echo "Commands:"
    echo "  analyze [service]     Analyze current commit history"
    echo "  backup               Create safety backups of all services"
    echo "  extract [service]     Extract commit data for reorganization"
    echo "  cleanup [service]     Interactive cleanup with preserved dates"
    echo "  rollback             Restore from backups"
    echo "  verify [service]      Verify branch integrity"
    echo ""
    echo "Services: backend, frontend, scraper, infra (or 'all')"
    echo ""
    echo "Examples:"
    echo "  $0 backup                    # Create safety backups first"
    echo "  $0 analyze all               # Analyze all services"
    echo "  $0 extract backend           # Extract backend commit data"
    echo "  $0 cleanup backend           # Clean up backend history"
    echo ""
}

get_service_path() {
    local service=$1
    case $service in
        "backend") echo "$SERVICES_DIR/figure-collector-backend" ;;
        "frontend") echo "$SERVICES_DIR/figure-collector-frontend" ;;
        "scraper") echo "$SERVICES_DIR/page-scraper" ;;
        "infra") echo "$SERVICES_DIR/figure-collector-infra" ;;
        *) echo "" ;;
    esac
}

create_backups() {
    echo -e "${YELLOW}Creating safety backups...${NC}"
    mkdir -p "$BACKUP_DIR"
    
    for service_name in "${SERVICES[@]}"; do
        service_short=$(basename "$service_name" | sed 's/figure-collector-//; s/page-scraper/scraper/')
        service_path=$(get_service_path "$service_short")
        
        if [ -d "$service_path" ]; then
            echo -e "  ${CYAN}Backing up $service_name...${NC}"
            
            cd "$service_path"
            # Create bundle backup (complete repo backup)
            git bundle create "$BACKUP_DIR/${service_name}-backup.bundle" --all
            
            # Also create a simple branch backup
            if git rev-parse --verify feature/mfcdata >/dev/null 2>&1; then
                git branch feature/mfcdata-backup-$(date +%Y%m%d_%H%M%S) feature/mfcdata
                echo -e "    ${GREEN}✓${NC} Created branch backup"
            fi
            
            echo -e "    ${GREEN}✓${NC} Created bundle backup: $BACKUP_DIR/${service_name}-backup.bundle"
        else
            echo -e "    ${RED}✗${NC} Service path not found: $service_path"
        fi
    done
    
    echo -e "${GREEN}✓ All backups created in: $BACKUP_DIR${NC}"
    echo -e "${YELLOW}IMPORTANT: Keep this backup directory until you're satisfied with the cleanup!${NC}"
}

analyze_history() {
    local service=$1
    local service_path=$(get_service_path "$service")
    
    if [ ! -d "$service_path" ]; then
        echo -e "${RED}Service path not found: $service_path${NC}"
        return 1
    fi
    
    cd "$service_path"
    
    echo -e "${BLUE}=== Analyzing $service history ===${NC}"
    
    # Check if feature/mfcdata branch exists
    if ! git rev-parse --verify feature/mfcdata >/dev/null 2>&1; then
        echo -e "${YELLOW}No feature/mfcdata branch found in $service${NC}"
        return 0
    fi
    
    # Get merge base with main
    local merge_base
    if git rev-parse --verify main >/dev/null 2>&1; then
        merge_base=$(git merge-base main feature/mfcdata 2>/dev/null || echo "")
    else
        # Try master if main doesn't exist
        merge_base=$(git merge-base master feature/mfcdata 2>/dev/null || echo "")
    fi
    
    if [ -z "$merge_base" ]; then
        echo -e "${YELLOW}Could not find merge base, showing all feature/mfcdata commits${NC}"
        merge_base=$(git rev-list feature/mfcdata | tail -1)
    fi
    
    # Show commit analysis
    local commit_count=$(git rev-list ${merge_base}..feature/mfcdata | wc -l)
    echo -e "${CYAN}Commits on feature/mfcdata: $commit_count${NC}"
    echo ""
    
    echo -e "${YELLOW}Commit Timeline:${NC}"
    git log --pretty=format:"  %C(cyan)%h%C(reset) %C(green)%ai%C(reset) %s" ${merge_base}..feature/mfcdata --reverse
    echo ""
    echo ""
    
    echo -e "${YELLOW}File Changes Summary:${NC}"
    git diff --name-status ${merge_base}..feature/mfcdata | sort | uniq -c | sort -rn
    echo ""
    
    echo -e "${YELLOW}Suggested Logical Groupings:${NC}"
    echo -e "  ${GREEN}1. Version Management & Service Registration${NC}"
    echo "     - Version service integration"
    echo "     - Frontend self-registration"
    echo "     - Backend orchestration"
    echo ""
    echo -e "  ${GREEN}2. MFC Scraping Integration${NC}"
    echo "     - Page scraper service"
    echo "     - Backend proxy endpoints"
    echo "     - Frontend URL processing"
    echo ""
    echo -e "  ${GREEN}3. Infrastructure & Configuration${NC}"
    echo "     - Nginx upstream configuration"
    echo "     - Environment variables"
    echo "     - Docker configurations"
    echo ""
    echo -e "  ${GREEN}4. Documentation & Cleanup${NC}"
    echo "     - README updates"
    echo "     - Configuration cleanup"
    echo "     - Remove duplicates"
    echo ""
}

extract_commit_data() {
    local service=$1
    local service_path=$(get_service_path "$service")
    local output_file="$BACKUP_DIR/${service}-commit-data.txt"
    
    if [ ! -d "$service_path" ]; then
        echo -e "${RED}Service path not found: $service_path${NC}"
        return 1
    fi
    
    cd "$service_path"
    
    if ! git rev-parse --verify feature/mfcdata >/dev/null 2>&1; then
        echo -e "${YELLOW}No feature/mfcdata branch found in $service${NC}"
        return 0
    fi
    
    echo -e "${YELLOW}Extracting commit data for $service...${NC}"
    
    # Get merge base
    local merge_base
    if git rev-parse --verify main >/dev/null 2>&1; then
        merge_base=$(git merge-base main feature/mfcdata 2>/dev/null || echo "")
    else
        merge_base=$(git merge-base master feature/mfcdata 2>/dev/null || echo "")
    fi
    
    if [ -z "$merge_base" ]; then
        merge_base=$(git rev-list feature/mfcdata | tail -1)
    fi
    
    # Extract detailed commit information
    {
        echo "# Commit Data for $service"
        echo "# Generated: $(date)"
        echo "# Merge base: $merge_base"
        echo ""
        echo "# Format: HASH|AUTHOR_DATE|COMMIT_DATE|AUTHOR|SUBJECT"
        echo "# Use this data to reconstruct commits with preserved timestamps"
        echo ""
        
        git log --pretty=format:"%H|%ai|%ci|%an <%ae>|%s" ${merge_base}..feature/mfcdata --reverse
        
        echo ""
        echo ""
        echo "# Detailed file changes per commit:"
        
        git rev-list ${merge_base}..feature/mfcdata --reverse | while read commit; do
            echo ""
            echo "## Commit: $commit"
            echo "## Message: $(git log -1 --pretty=format:'%s' $commit)"
            echo "## Date: $(git log -1 --pretty=format:'%ai' $commit)"
            echo "## Files:"
            git diff --name-status ${commit}^..$commit | sed 's/^/    /'
        done
        
    } > "$output_file"
    
    echo -e "${GREEN}✓ Commit data extracted to: $output_file${NC}"
    echo -e "${CYAN}Use this file to plan your commit reorganization${NC}"
}

interactive_cleanup() {
    local service=$1
    local service_path=$(get_service_path "$service")
    
    if [ ! -d "$service_path" ]; then
        echo -e "${RED}Service path not found: $service_path${NC}"
        return 1
    fi
    
    cd "$service_path"
    
    if ! git rev-parse --verify feature/mfcdata >/dev/null 2>&1; then
        echo -e "${YELLOW}No feature/mfcdata branch found in $service${NC}"
        return 0
    fi
    
    echo -e "${BLUE}=== Interactive Cleanup for $service ===${NC}"
    echo -e "${YELLOW}This will create a new clean branch: feature/mfcdata-clean${NC}"
    echo ""
    
    # Get merge base
    local base_branch="main"
    if ! git rev-parse --verify main >/dev/null 2>&1; then
        base_branch="master"
    fi
    
    local merge_base=$(git merge-base $base_branch feature/mfcdata 2>/dev/null || echo "")
    if [ -z "$merge_base" ]; then
        echo -e "${RED}Could not find merge base with $base_branch${NC}"
        return 1
    fi
    
    # Show current commits
    echo -e "${CYAN}Current commits to reorganize:${NC}"
    git log --oneline ${merge_base}..feature/mfcdata --reverse
    echo ""
    
    read -p "Continue with interactive cleanup? (y/N): " -r
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cleanup cancelled."
        return 0
    fi
    
    # Create clean branch
    echo -e "${YELLOW}Creating clean branch...${NC}"
    git checkout -b feature/mfcdata-clean $base_branch
    
    # Get original commit data
    local commit_data=$(mktemp)
    git log --pretty=format:"%H|%ai|%ci|%an <%ae>|%s" ${merge_base}..feature/mfcdata --reverse > "$commit_data"
    
    echo ""
    echo -e "${YELLOW}Now you have several options:${NC}"
    echo -e "  ${GREEN}1.${NC} Use interactive rebase: git rebase -i $merge_base"
    echo -e "  ${GREEN}2.${NC} Manually reconstruct commits using the extracted dates"
    echo -e "  ${GREEN}3.${NC} Use the commit data file: $commit_data"
    echo ""
    echo -e "${CYAN}Example manual reconstruction:${NC}"
    echo "  # Cherry-pick changes you want"
    echo "  git cherry-pick --no-commit <commit-hash>"
    echo "  # Stage the changes you want for this logical commit"
    echo "  git add <specific-files>"
    echo "  # Commit with original date"
    echo "  GIT_COMMITTER_DATE=\"2025-08-02 14:30:00\" \\"
    echo "    git commit --date=\"2025-08-02 14:30:00\" -m \"Logical commit message\""
    echo ""
    echo -e "${YELLOW}Commit data available in: $commit_data${NC}"
    echo -e "${YELLOW}Original branch backed up as: feature/mfcdata${NC}"
    echo ""
    echo -e "${GREEN}When finished:${NC}"
    echo "  1. Verify your new branch: git log --oneline"
    echo "  2. Test the changes work: run tests, check functionality"
    echo "  3. Replace old branch: git branch -D feature/mfcdata && git branch -m feature/mfcdata-clean feature/mfcdata"
    echo ""
}

rollback_changes() {
    echo -e "${YELLOW}Available backups:${NC}"
    if [ ! -d "$BACKUP_DIR" ]; then
        echo -e "${RED}No backup directory found!${NC}"
        echo "Please specify backup directory manually."
        return 1
    fi
    
    ls -la "$BACKUP_DIR"/*.bundle 2>/dev/null || {
        echo -e "${RED}No bundle backups found in $BACKUP_DIR${NC}"
        return 1
    }
    
    echo ""
    read -p "Enter service to rollback (backend/frontend/scraper/infra) or 'all': " -r service_input
    
    local services_to_rollback=()
    if [ "$service_input" = "all" ]; then
        services_to_rollback=("backend" "frontend" "scraper" "infra")
    else
        services_to_rollback=("$service_input")
    fi
    
    for service in "${services_to_rollback[@]}"; do
        local service_path=$(get_service_path "$service")
        local bundle_name="figure-collector-${service}"
        [ "$service" = "scraper" ] && bundle_name="page-scraper"
        [ "$service" = "infra" ] && bundle_name="figure-collector-infra"
        
        local bundle_file="$BACKUP_DIR/${bundle_name}-backup.bundle"
        
        if [ ! -f "$bundle_file" ]; then
            echo -e "${RED}Backup bundle not found: $bundle_file${NC}"
            continue
        fi
        
        if [ ! -d "$service_path" ]; then
            echo -e "${YELLOW}Service directory doesn't exist, cloning from backup...${NC}"
            git clone "$bundle_file" "$service_path"
        else
            cd "$service_path"
            echo -e "${YELLOW}Restoring $service from backup...${NC}"
            git fetch "$bundle_file" "+refs/*:refs/*"
        fi
        
        echo -e "${GREEN}✓ $service restored from backup${NC}"
    done
}

verify_branch() {
    local service=$1
    local service_path=$(get_service_path "$service")
    
    if [ ! -d "$service_path" ]; then
        echo -e "${RED}Service path not found: $service_path${NC}"
        return 1
    fi
    
    cd "$service_path"
    
    echo -e "${BLUE}=== Verifying $service branch ===${NC}"
    
    # Check current branch
    local current_branch=$(git branch --show-current)
    echo -e "${CYAN}Current branch: $current_branch${NC}"
    
    # Check if feature/mfcdata exists
    if git rev-parse --verify feature/mfcdata >/dev/null 2>&1; then
        echo -e "${GREEN}✓ feature/mfcdata branch exists${NC}"
        
        # Show commit count and recent commits
        local base_branch="main"
        if ! git rev-parse --verify main >/dev/null 2>&1; then
            base_branch="master"
        fi
        
        local merge_base=$(git merge-base $base_branch feature/mfcdata 2>/dev/null || echo "")
        if [ -n "$merge_base" ]; then
            local commit_count=$(git rev-list ${merge_base}..feature/mfcdata | wc -l)
            echo -e "${CYAN}Commits ahead of $base_branch: $commit_count${NC}"
            
            echo -e "${YELLOW}Recent commits:${NC}"
            git log --oneline ${merge_base}..feature/mfcdata | head -5
        fi
    else
        echo -e "${RED}✗ feature/mfcdata branch not found${NC}"
    fi
    
    # Check for any uncommitted changes
    if ! git diff --quiet; then
        echo -e "${YELLOW}⚠ Uncommitted changes detected${NC}"
        git status --porcelain
    else
        echo -e "${GREEN}✓ Working directory clean${NC}"
    fi
}

# Main script logic
case $1 in
    backup)
        create_backups
        ;;
    analyze)
        if [ "$2" = "all" ]; then
            for service in backend frontend scraper infra; do
                analyze_history "$service"
                echo ""
            done
        elif [ -n "$2" ]; then
            analyze_history "$2"
        else
            echo -e "${RED}Service required${NC}"
            usage
        fi
        ;;
    extract)
        if [ "$2" = "all" ]; then
            mkdir -p "$BACKUP_DIR"
            for service in backend frontend scraper infra; do
                extract_commit_data "$service"
            done
        elif [ -n "$2" ]; then
            mkdir -p "$BACKUP_DIR"
            extract_commit_data "$2"
        else
            echo -e "${RED}Service required${NC}"
            usage
        fi
        ;;
    cleanup)
        if [ -n "$2" ]; then
            interactive_cleanup "$2"
        else
            echo -e "${RED}Service required${NC}"
            usage
        fi
        ;;
    rollback)
        rollback_changes
        ;;
    verify)
        if [ "$2" = "all" ]; then
            for service in backend frontend scraper infra; do
                verify_branch "$service"
                echo ""
            done
        elif [ -n "$2" ]; then
            verify_branch "$2"
        else
            echo -e "${RED}Service required${NC}"
            usage
        fi
        ;;
    *)
        usage
        exit 1
        ;;
esac