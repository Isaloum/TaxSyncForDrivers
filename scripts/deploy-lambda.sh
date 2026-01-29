#!/bin/bash
# deploy-lambda.sh - Automated deployment script for TaxSync Email Automation
# One-command deployment with all prerequisites checked

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored messages
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }

echo ""
echo "=========================================="
echo "  TaxSync Email Automation Deployment"
echo "=========================================="
echo ""

# Check prerequisites
print_info "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version must be 18 or higher (current: $(node -v))"
    exit 1
fi
print_success "Node.js $(node -v) installed"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi
print_success "npm $(npm -v) installed"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed"
    echo "Install with: pip install awscli --upgrade --user"
    echo "Or visit: https://aws.amazon.com/cli/"
    exit 1
fi
print_success "AWS CLI installed"

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured"
    echo "Run: aws configure"
    echo "You'll need:"
    echo "  - AWS Access Key ID"
    echo "  - AWS Secret Access Key"
    echo "  - Default region: us-east-2"
    exit 1
fi
print_success "AWS credentials configured"

# Check/Install Serverless Framework
if ! command -v serverless &> /dev/null; then
    print_warning "Serverless Framework not found. Installing..."
    npm install -g serverless
    if [ $? -ne 0 ]; then
        print_error "Failed to install Serverless Framework"
        echo "Try: sudo npm install -g serverless"
        exit 1
    fi
    print_success "Serverless Framework installed"
else
    print_success "Serverless Framework $(serverless -v | head -n1) installed"
fi

echo ""
print_info "Installing Lambda dependencies..."

# Install Lambda function dependencies
cd lambda/email-processor
if [ ! -f "package.json" ]; then
    print_error "package.json not found in lambda/email-processor/"
    exit 1
fi

npm install
if [ $? -ne 0 ]; then
    print_error "Failed to install Lambda dependencies"
    exit 1
fi
print_success "Lambda dependencies installed"
cd ../..

echo ""
print_info "Deploying infrastructure with Serverless Framework..."

# Deploy with serverless
serverless deploy --verbose

if [ $? -ne 0 ]; then
    print_error "Deployment failed"
    exit 1
fi

print_success "Infrastructure deployed successfully!"

echo ""
echo "=========================================="
echo "  Deployment Summary"
echo "=========================================="
echo ""

# Get stack outputs
STACK_NAME=$(serverless info --verbose | grep "stack:" | awk '{print $2}')
if [ -n "$STACK_NAME" ]; then
    print_info "Stack Name: $STACK_NAME"
fi

# Get S3 bucket name
BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query "Stacks[0].Outputs[?OutputKey=='EmailBucket'].OutputValue" --output text 2>/dev/null || echo "")
if [ -z "$BUCKET_NAME" ]; then
    # Try to extract from serverless info
    BUCKET_NAME=$(serverless info --verbose | grep "bucket:" | awk '{print $2}' || echo "taxsync-incoming-emails")
fi

print_success "S3 Bucket: $BUCKET_NAME"
print_success "Lambda Function: taxsync-email-automation-dev-emailProcessor"

echo ""
echo "=========================================="
echo "  Next Steps"
echo "=========================================="
echo ""

print_info "1. Configure SES Email Receiving:"
echo "   Run: ./scripts/setup-ses-receiving.sh"
echo ""

print_info "2. Verify Domain/Email in SES:"
echo "   - Go to AWS SES Console (us-east-2)"
echo "   - Verify notifications@isaloumapps.com"
echo "   - Or verify entire domain: isaloumapps.com"
echo ""

print_info "3. Configure MX Records:"
echo "   Add this MX record to isaloumapps.com DNS:"
echo "   Priority: 10"
echo "   Value: inbound-smtp.us-east-2.amazonaws.com"
echo ""

print_info "4. Test the System:"
echo "   Run: ./scripts/test-email-automation.sh"
echo "   Or send test email to: notifications@isaloumapps.com"
echo ""

print_info "5. Monitor Logs:"
echo "   Run: ./scripts/view-lambda-logs.sh"
echo ""

echo "=========================================="
echo "  Cost Estimate"
echo "=========================================="
echo ""
print_info "Monthly costs (within free tier):"
echo "  • SES: \$0.10 per 1,000 emails (free tier: 62,000/month)"
echo "  • Lambda: Free tier covers 1M requests/month"
echo "  • S3: ~\$0.50 for 30-day retention"
echo "  • Total: ~\$1-2/month (most usage free)"
echo ""

print_success "Deployment complete! 🚀"
echo ""
