# AWS Lambda Email Automation - Setup Guide

Complete guide to deploy and configure the TaxSync email automation system.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [DNS Configuration](#dns-configuration)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)
7. [Monitoring](#monitoring)

## Prerequisites

### Required Software

- **Node.js 18+** - [Download](https://nodejs.org/)
- **npm 8+** - Included with Node.js
- **AWS CLI** - [Installation Guide](https://aws.amazon.com/cli/)
- **AWS Account** with SES and Lambda access

### AWS Permissions Required

Your AWS user/role needs:
- `lambda:*` - Lambda function management
- `s3:*` - S3 bucket operations
- `ses:*` - SES configuration
- `cloudformation:*` - Stack deployment
- `iam:CreateRole`, `iam:AttachRolePolicy` - IAM role creation

### Cost Estimate

**Monthly cost: $1-2** (mostly covered by AWS free tier)

- **SES**: $0.10/1,000 emails (62,000/month free)
- **Lambda**: Free tier covers 1M requests/month
- **S3**: ~$0.50 for 30-day email retention
- **Data Transfer**: Minimal (~$0.10)

## Quick Start

### One-Command Deployment

```bash
./scripts/deploy-lambda.sh
```

This script:
1. ✅ Checks all prerequisites
2. ✅ Installs Lambda dependencies
3. ✅ Deploys infrastructure
4. ✅ Creates S3 bucket
5. ✅ Configures Lambda function
6. ✅ Shows next steps

### Post-Deployment Setup

```bash
# Configure SES receiving
./scripts/setup-ses-receiving.sh

# Test the system
./scripts/test-email-automation.sh

# Monitor logs
./scripts/view-lambda-logs.sh
```

## Detailed Setup

### Step 1: Configure AWS Credentials

```bash
aws configure
```

Enter:
- **Access Key ID**: Your AWS access key
- **Secret Access Key**: Your AWS secret key
- **Region**: `us-east-2` (required)
- **Output format**: `json` (recommended)

Verify:
```bash
aws sts get-caller-identity
```

### Step 2: Install Serverless Framework

```bash
npm install -g serverless
```

Verify:
```bash
serverless --version
```

### Step 3: Install Lambda Dependencies

```bash
cd lambda/email-processor
npm install
cd ../..
```

### Step 4: Deploy Infrastructure

```bash
serverless deploy
```

This creates:
- **S3 Bucket**: `taxsync-incoming-emails-{instanceId}`
- **Lambda Function**: `taxsync-email-automation-dev-emailProcessor`
- **IAM Roles**: Lambda execution role with S3 and SES permissions
- **S3 Lifecycle**: 30-day automatic deletion policy

### Step 5: Configure SES Receiving

```bash
./scripts/setup-ses-receiving.sh
```

This sets up:
- Receipt rule set
- S3 action to save emails
- Spam/virus scanning
- Lambda trigger

### Step 6: Verify Email/Domain in SES

#### Option A: Verify Email Address

1. Go to [SES Console](https://console.aws.amazon.com/ses/)
2. Select region: **us-east-2**
3. Click **Verified identities** → **Create identity**
4. Choose **Email address**
5. Enter: `notifications@isaloumapps.com`
6. Click **Create identity**
7. Check your email and click verification link

#### Option B: Verify Entire Domain (Recommended)

1. Go to [SES Console](https://console.aws.amazon.com/ses/)
2. Click **Verified identities** → **Create identity**
3. Choose **Domain**
4. Enter: `isaloumapps.com`
5. Enable **DKIM** (recommended)
6. Click **Create identity**
7. Add the provided DNS records (TXT, CNAME for DKIM)

## DNS Configuration

### MX Record Setup

Add this MX record to your domain DNS:

```
Type:     MX
Name:     @  (or root/apex)
Priority: 10
Value:    inbound-smtp.us-east-2.amazonaws.com
TTL:      3600
```

### Examples by DNS Provider

#### Route 53
```bash
aws route53 change-resource-record-sets \
  --hosted-zone-id YOUR_ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "isaloumapps.com",
        "Type": "MX",
        "TTL": 3600,
        "ResourceRecords": [{"Value": "10 inbound-smtp.us-east-2.amazonaws.com"}]
      }
    }]
  }'
```

#### Cloudflare
1. Go to DNS settings
2. Add record:
   - Type: MX
   - Name: @
   - Priority: 10
   - Mail server: inbound-smtp.us-east-2.amazonaws.com
   - TTL: Auto

#### GoDaddy
1. DNS Management → Add → MX
2. Priority: 10
3. Points to: inbound-smtp.us-east-2.amazonaws.com

### Verify DNS Propagation

```bash
# Check MX record
dig MX isaloumapps.com
nslookup -type=MX isaloumapps.com

# Expected output:
# isaloumapps.com    MX    10 inbound-smtp.us-east-2.amazonaws.com
```

DNS propagation: 5-60 minutes (sometimes up to 24 hours)

## Testing

### Method 1: Using Test Script

```bash
./scripts/test-email-automation.sh
```

Follow on-screen instructions.

### Method 2: Manual Test

1. Create test file `t4-test.txt`:

```
T4 Statement of Remuneration Paid
Year: 2023

Employer: Test Company Inc
Box 14 Employment Income: 50,000.00
Box 22 Income Tax Deducted: 10,000.00
Box 16 CPP Contributions: 3,000.00
Box 18 EI Premiums: 900.00
```

2. Send email to `notifications@isaloumapps.com`
   - Subject: Test Document
   - Attach: t4-test.txt

3. Watch logs:
```bash
./scripts/view-lambda-logs.sh
```

4. Check your email for automated response

### Expected Results

✅ **Success Email** containing:
- Document type identified (T4)
- Extracted data (income, tax deducted, etc.)
- Confidence score
- Next steps

❌ **Error Email** if:
- No attachments
- Unsupported file format
- Processing failed

## Troubleshooting

### Common Issues

#### 1. Email Not Received

**Check:**
```bash
# MX record configured?
dig MX isaloumapps.com

# Email verified in SES?
aws ses list-verified-email-addresses --region us-east-2

# Receipt rule active?
aws ses describe-active-receipt-rule-set --region us-east-2
```

**Solutions:**
- Wait for DNS propagation (up to 24 hours)
- Verify email/domain in SES
- Check SES is out of sandbox mode

#### 2. Lambda Not Triggered

**Check:**
```bash
# S3 bucket exists?
aws s3 ls | grep taxsync-incoming-emails

# Lambda has S3 trigger?
aws lambda get-function --function-name taxsync-email-automation-dev-emailProcessor
```

**Solutions:**
- Redeploy: `serverless deploy`
- Check CloudWatch logs
- Verify S3 bucket permissions

#### 3. Permission Errors

**Check IAM roles:**
```bash
aws iam get-role --role-name taxsync-email-automation-dev-us-east-2-lambdaRole
```

**Solutions:**
- Redeploy to recreate roles
- Manually add missing permissions

#### 4. SES Sandbox Mode

If you can only send to verified addresses:

```bash
# Check sandbox status
aws ses get-account-sending-enabled --region us-east-2

# Request production access
# Go to SES Console → Account dashboard → Request production access
```

### Viewing Logs

```bash
# Real-time logs
./scripts/view-lambda-logs.sh

# Or directly:
serverless logs -f emailProcessor --tail

# Or AWS CLI:
aws logs tail /aws/lambda/taxsync-email-automation-dev-emailProcessor --follow
```

### Getting Metrics

```bash
./scripts/get-lambda-metrics.sh
```

Shows:
- Invocation count
- Error rate
- Average duration
- Cost estimate

## Monitoring

### CloudWatch Dashboard

Create custom dashboard:

1. Go to [CloudWatch Console](https://console.aws.amazon.com/cloudwatch/)
2. Create dashboard: `TaxSync-Email-Automation`
3. Add widgets:
   - Lambda invocations
   - Lambda errors
   - Lambda duration
   - S3 bucket size

### Alerts

Set up SNS alerts for errors:

```bash
# Create SNS topic
aws sns create-topic --name taxsync-lambda-errors

# Subscribe your email
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-2:ACCOUNT_ID:taxsync-lambda-errors \
  --protocol email \
  --notification-endpoint your-email@example.com

# Create CloudWatch alarm
aws cloudwatch put-metric-alarm \
  --alarm-name taxsync-lambda-errors \
  --alarm-description "Alert on Lambda errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 1 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=taxsync-email-automation-dev-emailProcessor \
  --alarm-actions arn:aws:sns:us-east-2:ACCOUNT_ID:taxsync-lambda-errors
```

### Budget Alerts

Set up billing alert:

```bash
aws budgets create-budget \
  --account-id YOUR_ACCOUNT_ID \
  --budget file://budget.json \
  --notifications-with-subscribers file://notifications.json
```

## Updating/Redeploying

### Update Lambda Code

```bash
# Make changes to lambda/email-processor/index.mjs
# Then redeploy:
serverless deploy
```

### Update Configuration

```bash
# Edit serverless.yml
# Then redeploy:
serverless deploy
```

### Rollback

```bash
# List deployments
serverless deploy list

# Rollback to previous
serverless rollback --timestamp TIMESTAMP
```

## Next Steps

1. ✅ Review [Architecture Documentation](LAMBDA_ARCHITECTURE.md)
2. ✅ Read [Cost Optimization Guide](COST_OPTIMIZATION.md)
3. ✅ Set up monitoring and alerts
4. ✅ Configure backup/disaster recovery
5. ✅ Plan for production scaling

## Support

- **Documentation**: See `docs/` folder
- **Issues**: Create GitHub issue
- **Email**: notifications@isaloumapps.com
- **Logs**: `./scripts/view-lambda-logs.sh`
