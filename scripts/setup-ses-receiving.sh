#!/bin/bash
# setup-ses-receiving.sh - Configure SES to receive emails and save to S3

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }

echo ""
echo "=========================================="
echo "  SES Email Receiving Configuration"
echo "=========================================="
echo ""

# Get region and bucket from serverless config or use defaults
REGION=${AWS_REGION:-us-east-2}
BUCKET_NAME=${SES_BUCKET:-taxsync-incoming-emails}
RULE_SET_NAME="taxsync-receipt-rule-set"
RULE_NAME="taxsync-save-to-s3"

print_info "Region: $REGION"
print_info "S3 Bucket: $BUCKET_NAME"

# Check if rule set exists
print_info "Checking for existing receipt rule set..."
EXISTING_RULE_SET=$(aws ses describe-receipt-rule-set --rule-set-name "$RULE_SET_NAME" --region "$REGION" 2>/dev/null || echo "")

if [ -z "$EXISTING_RULE_SET" ]; then
    print_info "Creating receipt rule set: $RULE_SET_NAME"
    aws ses create-receipt-rule-set \
        --rule-set-name "$RULE_SET_NAME" \
        --region "$REGION"
    print_success "Receipt rule set created"
else
    print_success "Receipt rule set already exists"
fi

# Set as active rule set
print_info "Setting as active rule set..."
aws ses set-active-receipt-rule-set \
    --rule-set-name "$RULE_SET_NAME" \
    --region "$REGION" 2>/dev/null || print_warning "Could not set as active (may already be active)"

print_success "Active rule set configured"

# Create S3 bucket policy to allow SES to write
print_info "Configuring S3 bucket policy for SES..."

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

BUCKET_POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowSESPuts",
      "Effect": "Allow",
      "Principal": {
        "Service": "ses.amazonaws.com"
      },
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::${BUCKET_NAME}/*",
      "Condition": {
        "StringEquals": {
          "aws:Referer": "${ACCOUNT_ID}"
        }
      }
    }
  ]
}
EOF
)

echo "$BUCKET_POLICY" > /tmp/ses-bucket-policy.json
aws s3api put-bucket-policy \
    --bucket "$BUCKET_NAME" \
    --policy file:///tmp/ses-bucket-policy.json \
    --region "$REGION"
rm /tmp/ses-bucket-policy.json

print_success "S3 bucket policy configured"

# Create receipt rule
print_info "Creating receipt rule..."

RECEIPT_RULE=$(cat <<EOF
{
  "Name": "$RULE_NAME",
  "Enabled": true,
  "TlsPolicy": "Optional",
  "Recipients": [
    "notifications@isaloumapps.com"
  ],
  "Actions": [
    {
      "S3Action": {
        "BucketName": "$BUCKET_NAME",
        "ObjectKeyPrefix": "incoming/"
      }
    }
  ],
  "ScanEnabled": true
}
EOF
)

# Delete existing rule if it exists
aws ses delete-receipt-rule \
    --rule-set-name "$RULE_SET_NAME" \
    --rule-name "$RULE_NAME" \
    --region "$REGION" 2>/dev/null || true

# Create new rule
echo "$RECEIPT_RULE" > /tmp/receipt-rule.json
aws ses create-receipt-rule \
    --rule-set-name "$RULE_SET_NAME" \
    --rule file:///tmp/receipt-rule.json \
    --region "$REGION"
rm /tmp/receipt-rule.json

print_success "Receipt rule created"

echo ""
echo "=========================================="
echo "  Configuration Complete!"
echo "=========================================="
echo ""

print_success "SES is now configured to:"
echo "  1. Receive emails at notifications@isaloumapps.com"
echo "  2. Scan for spam and viruses"
echo "  3. Save emails to S3 bucket: $BUCKET_NAME"
echo "  4. Trigger Lambda function for processing"
echo ""

echo "=========================================="
echo "  DNS Configuration Required"
echo "=========================================="
echo ""

print_warning "You must add this MX record to isaloumapps.com:"
echo ""
echo "  Type:     MX"
echo "  Priority: 10"
echo "  Value:    inbound-smtp.$REGION.amazonaws.com"
echo ""
print_info "In your DNS provider (e.g., Route 53, Cloudflare, GoDaddy):"
echo "  1. Go to DNS settings for isaloumapps.com"
echo "  2. Add new MX record with above values"
echo "  3. Wait 5-60 minutes for DNS propagation"
echo ""

print_info "To verify DNS propagation:"
echo "  dig MX isaloumapps.com"
echo "  nslookup -type=MX isaloumapps.com"
echo ""

echo "=========================================="
echo "  Email Verification"
echo "=========================================="
echo ""

print_warning "Verify notifications@isaloumapps.com in SES:"
echo "  1. Go to AWS SES Console: https://console.aws.amazon.com/ses/"
echo "  2. Choose region: $REGION"
echo "  3. Go to 'Verified identities'"
echo "  4. Click 'Create identity'"
echo "  5. Choose 'Email address'"
echo "  6. Enter: notifications@isaloumapps.com"
echo "  7. Click verification link in email"
echo ""
print_info "OR verify entire domain: isaloumapps.com"
echo ""

print_success "Setup complete! Test by sending email to notifications@isaloumapps.com"
echo ""
