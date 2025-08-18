#!/bin/bash

# Figure Collector Services - Simple Containerized Test Runner with Coverage
# Runs existing working tests in containers and collects coverage reports

set -e

echo "🐳 Running all services with coverage extraction..."
echo "================================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

BASE_DIR="/home/rgoldberg/projects/figure-collector-services"
RESULTS_DIR="$BASE_DIR/consolidated-test-results"

# Create consolidated results directory
echo "📁 Creating results directory: $RESULTS_DIR"
mkdir -p "$RESULTS_DIR"

# Function to run existing tests in container
run_service_tests() {
    local service_name=$1
    local service_path=$2
    local node_version=$3
    local test_command=$4
    
    echo ""
    echo -e "${BLUE}Testing $service_name...${NC}"
    echo "----------------------------------------"
    
    if [ -d "$service_path" ]; then
        cd "$service_path"
        
        echo "🔬 Running tests in container..."
        if docker run --rm \
           -v $(pwd):/app \
           -v "$RESULTS_DIR/$service_name":/app/coverage \
           -w /app \
           "$node_version" bash -c "$test_command"; then
            echo -e "${GREEN}✅ $service_name tests passed with coverage${NC}"
            return 0
        else
            echo -e "${RED}❌ $service_name tests failed${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ Service directory not found: $service_path${NC}"
        return 1
    fi
}

# Store the original directory
ORIGINAL_DIR=$(pwd)

# Initialize counters
TOTAL_SERVICES=0
PASSED_SERVICES=0
FAILED_SERVICES=0
FAILED_LIST=()

echo "Base directory: $BASE_DIR"
echo "Results directory: $RESULTS_DIR"
echo ""

# Backend Tests
TOTAL_SERVICES=$((TOTAL_SERVICES + 1))
if run_service_tests "backend" "$BASE_DIR/figure-collector-backend" "node:20" "npm install && npm run test:coverage"; then
    PASSED_SERVICES=$((PASSED_SERVICES + 1))
else
    FAILED_SERVICES=$((FAILED_SERVICES + 1))
    FAILED_LIST+=("Backend")
fi
cd "$ORIGINAL_DIR"

# Frontend Tests  
TOTAL_SERVICES=$((TOTAL_SERVICES + 1))
if run_service_tests "frontend" "$BASE_DIR/figure-collector-frontend" "node:24" "npm install && npm test -- --coverage --watchAll=false"; then
    PASSED_SERVICES=$((PASSED_SERVICES + 1))
else
    FAILED_SERVICES=$((FAILED_SERVICES + 1))
    FAILED_LIST+=("Frontend")
fi
cd "$ORIGINAL_DIR"

# Page Scraper Tests
TOTAL_SERVICES=$((TOTAL_SERVICES + 1))
if run_service_tests "scraper" "$BASE_DIR/page-scraper" "node:20" "npm install && npm run test:coverage"; then
    PASSED_SERVICES=$((PASSED_SERVICES + 1))
else
    FAILED_SERVICES=$((FAILED_SERVICES + 1))
    FAILED_LIST+=("Scraper")
fi
cd "$ORIGINAL_DIR"

# Version Service Tests
TOTAL_SERVICES=$((TOTAL_SERVICES + 1))
if run_service_tests "version-service" "$BASE_DIR/figure-collector-infra/version-service" "node:18" "npm install && npm run test:coverage"; then
    PASSED_SERVICES=$((PASSED_SERVICES + 1))
else
    FAILED_SERVICES=$((FAILED_SERVICES + 1))
    FAILED_LIST+=("Version Service")
fi
cd "$ORIGINAL_DIR"

# Print final summary
echo ""
echo "================================================================="
echo "🏁 Containerized Test Suite Summary"
echo "================================================================="
echo -e "Total Services Tested: ${BLUE}$TOTAL_SERVICES${NC}"
echo -e "Passed: ${GREEN}$PASSED_SERVICES${NC}"
echo -e "Failed: ${RED}$FAILED_SERVICES${NC}"
echo ""

if [ $FAILED_SERVICES -eq 0 ]; then
    echo -e "${GREEN}🎉 All test suites passed successfully!${NC}"
    echo -e "${GREEN}✅ Figure Collector Services is ready for deployment${NC}"
    echo ""
    echo -e "${CYAN}📊 Coverage Reports Available:${NC}"
    echo "  Backend:         $RESULTS_DIR/backend/lcov-report/index.html"
    echo "  Frontend:        $RESULTS_DIR/frontend/lcov-report/index.html"
    echo "  Scraper:         $RESULTS_DIR/scraper/lcov-report/index.html"
    echo "  Version Service: $RESULTS_DIR/version-service/lcov-report/index.html"
    echo ""
    
    # Try to open all coverage reports if in desktop environment
    if command -v xdg-open &> /dev/null && [ -n "$DISPLAY" ]; then
        echo "🔗 Opening all coverage reports..."
        xdg-open "$RESULTS_DIR/backend/lcov-report/index.html" 2>/dev/null || true
        sleep 1
        xdg-open "$RESULTS_DIR/frontend/lcov-report/index.html" 2>/dev/null || true
        sleep 1
        xdg-open "$RESULTS_DIR/scraper/lcov-report/index.html" 2>/dev/null || true
        sleep 1
        xdg-open "$RESULTS_DIR/version-service/lcov-report/index.html" 2>/dev/null || true
    fi
    
    exit 0
else
    echo -e "${RED}❌ Some test suites failed:${NC}"
    for service in "${FAILED_LIST[@]}"; do
        echo -e "${RED}  - $service${NC}"
    done
    echo ""
    echo -e "${YELLOW}Please fix the failing tests before deploying${NC}"
    exit 1
fi