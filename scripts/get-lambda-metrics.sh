#!/bin/bash
# get-lambda-metrics.sh - Get Lambda function metrics and cost estimates

set -e

REGION=${AWS_REGION:-us-east-2}
FUNCTION_NAME="taxsync-email-automation-dev-emailProcessor"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }

echo ""
echo "=========================================="
echo "  Lambda Function Metrics"
echo "=========================================="
echo ""

print_info "Function: $FUNCTION_NAME"
print_info "Region: $REGION"
echo ""

# Get last 7 days of metrics
END_TIME=$(date -u +"%Y-%m-%dT%H:%M:%S")
START_TIME=$(date -u -d '7 days ago' +"%Y-%m-%dT%H:%M:%S" 2>/dev/null || date -u -v-7d +"%Y-%m-%dT%H:%M:%S")

# Invocations
print_info "Getting invocation count (last 7 days)..."
INVOCATIONS=$(aws cloudwatch get-metric-statistics \
    --namespace AWS/Lambda \
    --metric-name Invocations \
    --dimensions Name=FunctionName,Value=$FUNCTION_NAME \
    --statistics Sum \
    --start-time "$START_TIME" \
    --end-time "$END_TIME" \
    --period 604800 \
    --region "$REGION" \
    --query 'Datapoints[0].Sum' \
    --output text 2>/dev/null || echo "0")

if [ "$INVOCATIONS" = "None" ] || [ -z "$INVOCATIONS" ]; then
    INVOCATIONS=0
fi

print_success "Invocations: $INVOCATIONS"

# Errors
print_info "Getting error count..."
ERRORS=$(aws cloudwatch get-metric-statistics \
    --namespace AWS/Lambda \
    --metric-name Errors \
    --dimensions Name=FunctionName,Value=$FUNCTION_NAME \
    --statistics Sum \
    --start-time "$START_TIME" \
    --end-time "$END_TIME" \
    --period 604800 \
    --region "$REGION" \
    --query 'Datapoints[0].Sum' \
    --output text 2>/dev/null || echo "0")

if [ "$ERRORS" = "None" ] || [ -z "$ERRORS" ]; then
    ERRORS=0
fi

ERROR_RATE=0
if [ "$INVOCATIONS" -gt 0 ]; then
    ERROR_RATE=$(echo "scale=2; ($ERRORS / $INVOCATIONS) * 100" | bc 2>/dev/null || echo "0")
fi

if [ "$ERRORS" -eq 0 ]; then
    print_success "Errors: $ERRORS (${ERROR_RATE}%)"
else
    print_warning "Errors: $ERRORS (${ERROR_RATE}%)"
fi

# Average Duration
print_info "Getting average duration..."
AVG_DURATION=$(aws cloudwatch get-metric-statistics \
    --namespace AWS/Lambda \
    --metric-name Duration \
    --dimensions Name=FunctionName,Value=$FUNCTION_NAME \
    --statistics Average \
    --start-time "$START_TIME" \
    --end-time "$END_TIME" \
    --period 604800 \
    --region "$REGION" \
    --query 'Datapoints[0].Average' \
    --output text 2>/dev/null || echo "0")

if [ "$AVG_DURATION" = "None" ] || [ -z "$AVG_DURATION" ]; then
    AVG_DURATION=0
fi

AVG_DURATION_SEC=$(echo "scale=2; $AVG_DURATION / 1000" | bc 2>/dev/null || echo "0")
print_success "Average Duration: ${AVG_DURATION_SEC}s"

echo ""
echo "=========================================="
echo "  Cost Estimate"
echo "=========================================="
echo ""

# Lambda pricing (us-east-2)
# $0.20 per 1M requests
# $0.0000166667 per GB-second

MEMORY_GB=$(echo "scale=4; 512 / 1024" | bc)
GB_SECONDS=$(echo "scale=2; $INVOCATIONS * $AVG_DURATION_SEC * $MEMORY_GB" | bc 2>/dev/null || echo "0")
COMPUTE_COST=$(echo "scale=4; $GB_SECONDS * 0.0000166667" | bc 2>/dev/null || echo "0")
REQUEST_COST=$(echo "scale=4; $INVOCATIONS * 0.0000002" | bc 2>/dev/null || echo "0")
TOTAL_COST=$(echo "scale=2; $COMPUTE_COST + $REQUEST_COST" | bc 2>/dev/null || echo "0")

# Monthly estimate
MONTHLY_INVOCATIONS=$(echo "scale=0; $INVOCATIONS * 4.33" | bc 2>/dev/null || echo "0")
MONTHLY_COST=$(echo "scale=2; $TOTAL_COST * 4.33" | bc 2>/dev/null || echo "0")

print_info "Cost (last 7 days):"
echo "  • Request cost: \$${REQUEST_COST}"
echo "  • Compute cost: \$${COMPUTE_COST}"
echo "  • Total: \$${TOTAL_COST}"
echo ""

print_info "Estimated monthly cost:"
echo "  • Projected invocations: ~$MONTHLY_INVOCATIONS"
echo "  • Projected cost: ~\$${MONTHLY_COST}"
echo ""

FREE_TIER_REQUESTS=1000000
FREE_TIER_GB_SECONDS=400000

if [ "$MONTHLY_INVOCATIONS" -lt "$FREE_TIER_REQUESTS" ]; then
    print_success "Within Lambda free tier! (1M requests/month)"
else
    print_warning "Exceeds free tier request limit"
fi

if [ "$(echo "$GB_SECONDS * 4.33 < $FREE_TIER_GB_SECONDS" | bc)" -eq 1 ]; then
    print_success "Within Lambda compute free tier! (400,000 GB-seconds/month)"
else
    print_warning "Exceeds free tier compute limit"
fi

echo ""
print_info "Note: This doesn't include S3 and SES costs"
echo "  • S3: ~\$0.50/month for email storage"
echo "  • SES: Free tier covers 62,000 emails/month"
echo ""
