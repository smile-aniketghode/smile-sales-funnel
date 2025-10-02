#!/bin/bash

# End-to-End Test Script for SMILe Sales Funnel with OpenRouter
# Tests all 5 sample emails with real LLM extraction (NO MOCKS!)

set -e  # Exit on error

WORKER_URL="http://localhost:8000"
SAMPLES_DIR="./samples"

echo "============================================"
echo "SMILe Sales Funnel - E2E Test with OpenRouter"
echo "============================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check worker is running
echo "Checking worker API..."
if ! curl -s "$WORKER_URL/health" > /dev/null 2>&1; then
    echo -e "${RED}❌ Worker API not running at $WORKER_URL${NC}"
    echo "Start it with: cd worker && source .env.local && ./venv/bin/python -m uvicorn src.main:app --host 0.0.0.0 --port 8000"
    exit 1
fi
echo -e "${GREEN}✅ Worker API is running${NC}"
echo ""

# Test counters
TOTAL_TESTS=5
PASSED_TESTS=0
FAILED_TESTS=0

# Function to test email processing
test_email() {
    local file=$1
    local filename=$(basename "$file")
    local expected_type=$2  # "tasks", "deals", or "mixed"

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Testing: $filename"
    echo "Expected: $expected_type"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Send request
    response=$(curl -s -w "\n%{time_total}" -X POST "$WORKER_URL/ingestEmail" -F "file=@$file")

    # Extract time and response
    time_total=$(echo "$response" | tail -1)
    json_response=$(echo "$response" | head -n -1)

    # Parse JSON
    status=$(echo "$json_response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    tasks_count=$(echo "$json_response" | grep -o '"high_confidence_tasks":[0-9]*' | cut -d':' -f2)
    deals_count=$(echo "$json_response" | grep -o '"high_confidence_deals":[0-9]*' | cut -d':' -f2)
    processing_time=$(echo "$json_response" | grep -o '"processing_time_ms":[0-9]*' | cut -d':' -f2)

    # Validate results
    if [ "$status" = "success" ]; then
        echo -e "${GREEN}✅ Status: $status${NC}"
        echo "⏱️  Processing time: ${processing_time}ms (API), ${time_total}s (total)"
        echo "📋 High confidence tasks: $tasks_count"
        echo "💰 High confidence deals: $deals_count"

        # Validate expectations
        case "$expected_type" in
            "tasks")
                if [ "$tasks_count" -gt 0 ]; then
                    echo -e "${GREEN}✅ Tasks extracted as expected${NC}"
                    PASSED_TESTS=$((PASSED_TESTS + 1))
                else
                    echo -e "${YELLOW}⚠️  Expected tasks but got $tasks_count${NC}"
                    FAILED_TESTS=$((FAILED_TESTS + 1))
                fi
                ;;
            "deals")
                if [ "$deals_count" -gt 0 ]; then
                    echo -e "${GREEN}✅ Deals extracted as expected${NC}"
                    PASSED_TESTS=$((PASSED_TESTS + 1))
                else
                    echo -e "${YELLOW}⚠️  Expected deals but got $deals_count${NC}"
                    FAILED_TESTS=$((FAILED_TESTS + 1))
                fi
                ;;
            "mixed")
                if [ "$tasks_count" -gt 0 ] || [ "$deals_count" -gt 0 ]; then
                    echo -e "${GREEN}✅ Extracted content as expected${NC}"
                    PASSED_TESTS=$((PASSED_TESTS + 1))
                else
                    echo -e "${YELLOW}⚠️  Expected tasks/deals but got 0${NC}"
                    FAILED_TESTS=$((FAILED_TESTS + 1))
                fi
                ;;
        esac
    else
        echo -e "${RED}❌ Status: $status${NC}"
        echo "Response: $json_response"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi

    echo ""
}

# Test all 5 sample emails
echo "Running E2E tests on 5 sample emails..."
echo ""

test_email "$SAMPLES_DIR/deal-high-value.txt" "mixed"
test_email "$SAMPLES_DIR/deal-interest.txt" "deals"
test_email "$SAMPLES_DIR/task-followup.txt" "tasks"
test_email "$SAMPLES_DIR/task-meeting.txt" "tasks"
test_email "$SAMPLES_DIR/mixed.txt" "mixed"

# Summary
echo "============================================"
echo "Test Summary"
echo "============================================"
echo "Total tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "${RED}Failed: $FAILED_TESTS${NC}"
else
    echo -e "${GREEN}Failed: $FAILED_TESTS${NC}"
fi
echo ""

# Exit with error if any tests failed
if [ $FAILED_TESTS -gt 0 ]; then
    exit 1
else
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
fi
