#!/bin/bash
# test-email-automation.sh - Test the email automation system

set -e

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
echo "  TaxSync Email Automation Test"
echo "=========================================="
echo ""

print_info "This script will help you test the email automation system."
echo ""

# Check if serverless is available
if ! command -v serverless &> /dev/null; then
    print_warning "Serverless Framework not found. Install with: npm install -g serverless"
    echo ""
fi

echo "=========================================="
echo "  Testing Instructions"
echo "=========================================="
echo ""

print_info "Step 1: Prepare a test document"
echo ""
echo "Create a text file with sample T4 content:"
echo ""
cat << 'EOF'
Example T4 content (save as t4-sample.txt):
-------------------------------------------
T4 Statement of Remuneration Paid
Year: 2023

Employer: Acme Corporation
Box 14 Employment Income: 65,000.00
Box 22 Income Tax Deducted: 12,500.00
Box 16 CPP Contributions: 3,499.80
Box 18 EI Premiums: 1,002.45
-------------------------------------------
EOF
echo ""

print_info "Step 2: Send test email"
echo ""
echo "Send an email to: notifications@isaloumapps.com"
echo "Subject: Test Tax Document"
echo "Attach: t4-sample.txt (or any supported file)"
echo ""

print_warning "Make sure:"
echo "  • MX record is configured and propagated"
echo "  • SES receiving is set up (./scripts/setup-ses-receiving.sh)"
echo "  • Email address is verified in SES"
echo ""

print_info "Step 3: Watch Lambda logs in real-time"
echo ""

read -p "Press ENTER to start watching logs (Ctrl+C to stop)..."
echo ""

if command -v serverless &> /dev/null; then
    print_success "Watching Lambda logs..."
    echo ""
    serverless logs -f emailProcessor --tail
else
    print_warning "Install Serverless to watch logs: npm install -g serverless"
    echo ""
    print_info "Alternative: View logs in AWS Console"
    echo "https://console.aws.amazon.com/cloudwatch/home?region=us-east-2#logsV2:log-groups"
fi
