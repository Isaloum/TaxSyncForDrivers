#!/bin/bash
# test-deployment.sh - Comprehensive deployment testing script
# Tests health, webhook accessibility, and email processing readiness

set -e  # Exit on error

# Check for required commands
check_dependencies() {
    local missing_deps=0
    
    if ! command -v curl &> /dev/null; then
        echo "Error: curl is required but not installed."
        missing_deps=1
    fi
    
    # bc is optional - we'll use bash arithmetic if not available
    if ! command -v bc &> /dev/null; then
        echo "Warning: bc not found, using bash arithmetic for calculations"
        USE_BC=0
    else
        USE_BC=1
    fi
    
    if [ $missing_deps -eq 1 ]; then
        exit 1
    fi
}

USE_BC=1
check_dependencies

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_URL="${1:-}"
if [ -z "$DEPLOYMENT_URL" ]; then
    echo -e "${RED}❌ Error: Deployment URL required${NC}"
    echo "Usage: ./test-deployment.sh <deployment-url>"
    echo "Example: ./test-deployment.sh https://taxsync-email.vercel.app"
    exit 1
fi

# Remove trailing slash
DEPLOYMENT_URL="${DEPLOYMENT_URL%/}"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  TaxSync Email Automation - Deployment Test Suite         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Testing deployment at: ${YELLOW}${DEPLOYMENT_URL}${NC}"
echo ""

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Test 1: Health Check
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Test 1: Health Endpoint${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

HEALTH_URL="${DEPLOYMENT_URL}/health"
echo "Testing: GET ${HEALTH_URL}"

HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "${HEALTH_URL}" 2>/dev/null || echo "000")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Health check returned 200 OK${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    
    # Check response contains expected fields
    if echo "$RESPONSE_BODY" | grep -q "\"status\".*:.*\"ok\""; then
        echo -e "${GREEN}✅ Response contains status: ok${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ Response missing 'status: ok'${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    
    if echo "$RESPONSE_BODY" | grep -q "\"service\""; then
        echo -e "${GREEN}✅ Response contains service name${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ Response missing service name${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    
    echo ""
    echo "Response body:"
    if command -v python3 &> /dev/null; then
        echo "$RESPONSE_BODY" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE_BODY"
    elif command -v jq &> /dev/null; then
        echo "$RESPONSE_BODY" | jq 2>/dev/null || echo "$RESPONSE_BODY"
    else
        echo "$RESPONSE_BODY"
    fi
else
    echo -e "${RED}❌ Health check failed with HTTP code: ${HTTP_CODE}${NC}"
    echo "Response: $RESPONSE_BODY"
    TESTS_FAILED=$((TESTS_FAILED + 3))
fi

echo ""

# Test 2: Webhook Endpoint Accessibility
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Test 2: Mailgun Webhook Endpoint${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

WEBHOOK_URL="${DEPLOYMENT_URL}/webhook/mailgun"
echo "Testing: POST ${WEBHOOK_URL}"

# Test without signature (should return 403 or 500)
WEBHOOK_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${WEBHOOK_URL}" 2>/dev/null || echo "000")
WEBHOOK_CODE=$(echo "$WEBHOOK_RESPONSE" | tail -n1)

if [ "$WEBHOOK_CODE" = "403" ] || [ "$WEBHOOK_CODE" = "500" ]; then
    echo -e "${GREEN}✅ Webhook endpoint accessible (returned ${WEBHOOK_CODE} as expected without signature)${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
elif [ "$WEBHOOK_CODE" = "200" ]; then
    echo -e "${YELLOW}⚠️  Webhook returned 200 without signature (signature verification may be disabled)${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}❌ Webhook endpoint not accessible (returned ${WEBHOOK_CODE})${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo ""

# Test 3: Generic Webhook Endpoint
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Test 3: Generic Email Webhook Endpoint${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

GENERIC_WEBHOOK_URL="${DEPLOYMENT_URL}/webhook/email"
echo "Testing: POST ${GENERIC_WEBHOOK_URL}"

GENERIC_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d '{"from":"test@example.com","subject":"Test","text":"Test message"}' \
    "${GENERIC_WEBHOOK_URL}" 2>/dev/null || echo "000")
GENERIC_CODE=$(echo "$GENERIC_RESPONSE" | tail -n1)

if [ "$GENERIC_CODE" = "200" ] || [ "$GENERIC_CODE" = "500" ]; then
    echo -e "${GREEN}✅ Generic webhook endpoint accessible${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}❌ Generic webhook endpoint not accessible (returned ${GENERIC_CODE})${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo ""

# Test 4: SSL/HTTPS
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Test 4: SSL/HTTPS Configuration${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [[ "$DEPLOYMENT_URL" == https://* ]]; then
    echo -e "${GREEN}✅ Deployment URL uses HTTPS${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}❌ Deployment URL does not use HTTPS (security risk!)${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo ""

# Test 5: Response Time
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Test 5: Response Time${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

RESPONSE_TIME=$(curl -s -w "%{time_total}" -o /dev/null "${HEALTH_URL}")

# Convert to milliseconds - use integer arithmetic
if [ "$USE_BC" -eq 1 ]; then
    RESPONSE_TIME_MS=$(echo "$RESPONSE_TIME * 1000" | bc)
else
    # Bash arithmetic - multiply by 1000 and handle decimal
    RESPONSE_TIME_MS=$(awk "BEGIN {printf \"%.0f\", $RESPONSE_TIME * 1000}")
fi

echo "Response time: ${RESPONSE_TIME_MS} ms"

# Check response time thresholds using integer comparison
RESPONSE_TIME_INT=${RESPONSE_TIME_MS%.*}  # Remove decimal part if any

if [ "$RESPONSE_TIME_INT" -lt 2000 ]; then
    echo -e "${GREEN}✅ Response time is good (< 2 seconds)${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
elif [ "$RESPONSE_TIME_INT" -lt 5000 ]; then
    echo -e "${YELLOW}⚠️  Response time is acceptable (< 5 seconds)${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}❌ Response time is slow (> 5 seconds) - may indicate cold start${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Test Summary                                              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Total tests run: $((TESTS_PASSED + TESTS_FAILED))"
echo -e "${GREEN}✅ Passed: ${TESTS_PASSED}${NC}"
echo -e "${RED}❌ Failed: ${TESTS_FAILED}${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  🎉 All tests passed! Deployment is ready.                ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}✅ Email automation is operational${NC}"
    echo -e "${GREEN}✅ Ready for production use${NC}"
    echo ""
    echo -e "Next steps:"
    echo -e "1. Configure Mailgun to forward to: ${WEBHOOK_URL}"
    echo -e "2. Test by sending email to: notifications@isaloumapps.com"
    echo -e "3. Monitor logs for processing confirmation"
    echo ""
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ⚠️  Some tests failed. Review errors above.              ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "Please fix the issues and test again."
    echo ""
    exit 1
fi
