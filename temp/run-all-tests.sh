#!/bin/bash

# Figure Collector Services - Comprehensive Test Runner
# Runs all test suites across all services

set -e  # Exit on any error

echo "🧪 Running comprehensive test suite for Figure Collector Services..."
echo "================================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to run tests for a service
run_service_tests() {
    local service_name=$1
    local service_path=$2
    local test_command=$3
    
    echo ""
    echo -e "${BLUE}Testing $service_name...${NC}"
    echo "----------------------------------------"
    
    if [ -d "$service_path" ]; then
        cd "$service_path"
        if [ -f "package.json" ]; then
            echo "Installing dependencies..."
            npm install > /dev/null 2>&1 || { echo -e "${RED}❌ Failed to install dependencies for $service_name${NC}"; return 1; }
            
            echo "Running tests..."
            if eval "$test_command"; then
                echo -e "${GREEN}✅ $service_name tests passed${NC}"
                return 0
            else
                echo -e "${RED}❌ $service_name tests failed${NC}"
                return 1
            fi
        else
            echo -e "${YELLOW}⚠️  No package.json found in $service_path${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ Service directory not found: $service_path${NC}"
        return 1
    fi
}

# Store the original directory
ORIGINAL_DIR=$(pwd)
BASE_DIR="/home/rgoldberg/projects/figure-collector-services"

# Initialize counters
TOTAL_SERVICES=0
PASSED_SERVICES=0
FAILED_SERVICES=0

# Array to store failed services
FAILED_LIST=()

echo "Base directory: $BASE_DIR"
echo ""

# Test Backend API
TOTAL_SERVICES=$((TOTAL_SERVICES + 1))
if run_service_tests "Backend API" "$BASE_DIR/figure-collector-backend" "npm test"; then
    PASSED_SERVICES=$((PASSED_SERVICES + 1))
else
    FAILED_SERVICES=$((FAILED_SERVICES + 1))
    FAILED_LIST+=("Backend API")
fi
cd "$ORIGINAL_DIR"

# Test Frontend
TOTAL_SERVICES=$((TOTAL_SERVICES + 1))
if run_service_tests "Frontend" "$BASE_DIR/figure-collector-frontend" "npm test -- --coverage --watchAll=false"; then
    PASSED_SERVICES=$((PASSED_SERVICES + 1))
else
    FAILED_SERVICES=$((FAILED_SERVICES + 1))
    FAILED_LIST+=("Frontend")
fi
cd "$ORIGINAL_DIR"

# Test Page Scraper
TOTAL_SERVICES=$((TOTAL_SERVICES + 1))
if run_service_tests "Page Scraper" "$BASE_DIR/page-scraper" "npm run test:ci"; then
    PASSED_SERVICES=$((PASSED_SERVICES + 1))
else
    FAILED_SERVICES=$((FAILED_SERVICES + 1))
    FAILED_LIST+=("Page Scraper")
fi
cd "$ORIGINAL_DIR"

# Test Version Service
TOTAL_SERVICES=$((TOTAL_SERVICES + 1))
if run_service_tests "Version Service" "$BASE_DIR/figure-collector-infra/version-service" "npm test"; then
    PASSED_SERVICES=$((PASSED_SERVICES + 1))
else
    FAILED_SERVICES=$((FAILED_SERVICES + 1))
    FAILED_LIST+=("Version Service")
fi
cd "$ORIGINAL_DIR"

# Print final summary
echo ""
echo "================================================================="
echo "🏁 Test Suite Summary"
echo "================================================================="
echo -e "Total Services Tested: ${BLUE}$TOTAL_SERVICES${NC}"
echo -e "Passed: ${GREEN}$PASSED_SERVICES${NC}"
echo -e "Failed: ${RED}$FAILED_SERVICES${NC}"

if [ $FAILED_SERVICES -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All test suites passed successfully!${NC}"
    echo -e "${GREEN}✅ Figure Collector Services is ready for deployment${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}❌ Some test suites failed:${NC}"
    for service in "${FAILED_LIST[@]}"; do
        echo -e "${RED}  - $service${NC}"
    done
    echo ""
    echo -e "${YELLOW}Please fix the failing tests before deploying${NC}"
    exit 1
fi