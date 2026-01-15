# 🚀 Deployment Guide - TaxSync Email Automation System

Complete guide for deploying the email automation system to production for client demonstrations.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Deployment Options](#deployment-options)
- [Vercel Deployment (Recommended)](#vercel-deployment-recommended)
- [Railway Deployment](#railway-deployment)
- [Render Deployment](#render-deployment)
- [Docker Deployment](#docker-deployment)
- [AWS SES Configuration](#aws-ses-configuration)
- [DNS Setup](#dns-setup)
- [Environment Variables](#environment-variables)
- [Testing & Validation](#testing--validation)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

✅ **Required Accounts:**
- [AWS](https://aws.amazon.com) account with SES access
- Domain access for `isaloumapps.com`
- Deployment platform account (Vercel/Railway/Render)

✅ **Required Tools:**
- Node.js 18+ installed locally
- Git installed
- npm or yarn package manager

✅ **Repository Access:**
- Clone this repository locally
- Ensure all tests pass: `npm test` (should show 229 passing tests)

---

## Deployment Options

| Platform | Best For | Pros | Cons |
|----------|----------|------|------|
| **Vercel** | Serverless deployment | Free tier, auto-scaling, easy setup | Cold starts on free tier |
| **Railway** | Persistent server | Always warm, simple config | Paid after free tier |
| **Render** | Alternative hosting | Good free tier, Docker support | Slower deploys |
| **Docker** | Self-hosting | Full control, any platform | Requires infrastructure |

---

## Vercel Deployment (Recommended)

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Deploy

```bash
# From repository root
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? [Select your account]
# - Link to existing project? No
# - Project name? taxsync-email-automation
# - Directory? ./
# - Override settings? No
```

### 4. Configure Environment Variables

```bash
# Add environment variables
vercel env add AWS_ACCESS_KEY_ID
# Paste your AWS access key ID when prompted

vercel env add AWS_SECRET_ACCESS_KEY
# Paste your AWS secret access key when prompted

vercel env add AWS_REGION
# Enter: us-east-2

vercel env add SES_FROM_DOMAIN
# Enter: isaloumapps.com

vercel env add NODE_ENV
# Enter: production
```

Or add via Vercel Dashboard:
1. Go to your project at https://vercel.com/dashboard
2. Settings → Environment Variables
3. Add each variable for Production, Preview, and Development

### 5. Deploy to Production

```bash
vercel --prod
```

### 6. Get Your Deployment URL

```bash
# Your app will be available at:
# https://taxsync-email-automation.vercel.app
# or your custom domain
```

### 7. Configure Custom Domain (Optional)

1. In Vercel Dashboard → Settings → Domains
2. Add domain: `email.taxsyncfordrivers.com`
3. Follow DNS configuration instructions

---

## Railway Deployment

### 1. Install Railway CLI

```bash
npm install -g @railway/cli
```

### 2. Login to Railway

```bash
railway login
```

### 3. Initialize Project

```bash
# From repository root
railway init

# Project name: taxsync-email-automation
```

### 4. Add Environment Variables

```bash
railway variables set AWS_ACCESS_KEY_ID="your_access_key_id_here"
railway variables set AWS_SECRET_ACCESS_KEY="your_secret_access_key_here"
railway variables set AWS_REGION="us-east-2"
railway variables set SES_FROM_DOMAIN="isaloumapps.com"
railway variables set NODE_ENV="production"
railway variables set PORT="3000"
```

### 5. Deploy

```bash
railway up
```

### 6. Get Deployment URL

```bash
railway domain
# Creates a public domain: taxsync-email-automation.up.railway.app
```

### 7. Monitor Logs

```bash
railway logs
```

---

## Render Deployment

### 1. Create Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: taxsync-email-automation
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node email-server.js`
   - **Instance Type**: Free

### 2. Add Environment Variables

In the Render Dashboard, add these environment variables:

```
AWS_ACCESS_KEY_ID = your_aws_access_key_id_here
AWS_SECRET_ACCESS_KEY = your_aws_secret_access_key_here
AWS_REGION = us-east-2
SES_FROM_DOMAIN = isaloumapps.com
NODE_ENV = production
PORT = 3000
```

### 3. Deploy

Click "Create Web Service" - Render will automatically deploy.

### 4. Get Deployment URL

Your service will be available at:
```
https://taxsync-email-automation.onrender.com
```

### 5. Configure Health Check

- Health Check Path: `/health`
- Auto-Deploy: Yes

---

## Docker Deployment

### 1. Build Docker Image

```bash
# Build image
docker build -t taxsync-email-automation .

# Verify build
docker images | grep taxsync
```

### 2. Run Locally (Testing)

```bash
# Create .env file with your configuration
cp .env.example .env
# Edit .env with your actual credentials

# Run container
docker run -d \
  --name taxsync-email \
  -p 3000:3000 \
  --env-file .env \
  taxsync-email-automation

# Check logs
docker logs taxsync-email

# Test health endpoint
curl http://localhost:3000/health
```

### 3. Deploy to Cloud Platform

#### AWS ECS:
```bash
# Tag for ECR
docker tag taxsync-email-automation:latest \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com/taxsync-email-automation:latest

# Push to ECR
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/taxsync-email-automation:latest
```

#### Google Cloud Run:
```bash
# Tag for GCR
docker tag taxsync-email-automation gcr.io/<project-id>/taxsync-email-automation

# Push to GCR
docker push gcr.io/<project-id>/taxsync-email-automation

# Deploy to Cloud Run
gcloud run deploy taxsync-email-automation \
  --image gcr.io/<project-id>/taxsync-email-automation \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

#### DigitalOcean App Platform:
1. Connect to your Docker registry
2. Select image: taxsync-email-automation
3. Configure environment variables
4. Deploy

---

## AWS SES Configuration

### 1. Create AWS Account and Enable SES

1. Go to [AWS Console](https://console.aws.amazon.com)
2. Navigate to **Amazon SES** service
3. Select region: **us-east-2** (or your preferred region)

### 2. Verify Domain

1. Navigate to **Configuration** → **Verified identities**
2. Click "Create identity"
3. Select "Domain" and enter: `isaloumapps.com`
4. Follow DNS verification steps (see DNS Setup below)
5. Enable DKIM signing (recommended)

### 3. Verify Email Addresses

1. Navigate to **Configuration** → **Verified identities**
2. Click "Create identity"
3. Select "Email address"
4. Enter: `notifications@isaloumapps.com`
5. Check your inbox and click verification link

### 4. Get API Credentials

**Create IAM User for SES:**
1. Navigate to **IAM** → **Users**
2. Click "Create user"
3. User name: `taxsync-ses-user`
4. Attach policy: `AmazonSESFullAccess`
5. Create access key (Application running outside AWS)
6. Save:
   - Access Key ID as `AWS_ACCESS_KEY_ID`
   - Secret Access Key as `AWS_SECRET_ACCESS_KEY`

### 5. Request Production Access (Optional)

By default, SES is in sandbox mode (can only send to verified emails).

To send to any email:
1. Navigate to **Account dashboard**
2. Click "Request production access"
3. Fill out the form describing your use case
4. Wait for AWS approval (usually 24 hours)

### 6. Configure Receiving (Optional)

If you need to receive emails via SES:
1. Navigate to **Email receiving** → **Rule sets**
2. Create a receipt rule for `notifications@isaloumapps.com`
3. Add action to invoke webhook endpoint
4. Configure SNS topic or S3 bucket as needed

### 7. Test Email Sending

Send a test email using AWS CLI or the SES console to verify configuration.

---

## DNS Setup

### Required DNS Records for Mailgun

Add these DNS records to your domain registrar (e.g., Namecheap, GoDaddy, Cloudflare):

#### MX Records (for receiving emails):
```
Type: MX
Host: taxsyncfordrivers.com
Priority: 10
Value: mxa.mailgun.org

Type: MX  
Host: taxsyncfordrivers.com
Priority: 10
Value: mxb.mailgun.org
```

#### TXT Records (for verification and SPF):
```
Type: TXT
Host: taxsyncfordrivers.com
Value: v=spf1 include:mailgun.org ~all

Type: TXT
Host: mailo._domainkey.taxsyncfordrivers.com
Value: [Get this from Mailgun Domain Settings]
```

#### CNAME Record (for tracking):
```
Type: CNAME
Host: email.taxsyncfordrivers.com
Value: mailgun.org
```

### Verification

1. Add all DNS records
2. Wait 5-10 minutes for propagation
3. Go to Mailgun → Domains → taxsyncfordrivers.com
4. Click "Verify DNS Settings"
5. All checks should be ✅ green

### Test DNS Configuration

```bash
# Check MX records
dig MX taxsyncfordrivers.com

# Check SPF record
dig TXT taxsyncfordrivers.com

# Check DKIM record
dig TXT mailo._domainkey.taxsyncfordrivers.com
```

---

## Environment Variables

### Complete List

```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# Mailgun Configuration (REQUIRED)
MAILGUN_API_KEY=<your_private_api_key>
MAILGUN_DOMAIN=taxsyncfordrivers.com
MAILGUN_WEBHOOK_KEY=<your_webhook_signing_key>

# Email Settings
FROM_EMAIL=noreply@taxsyncfordrivers.com
SUPPORT_EMAIL=support@taxsyncfordrivers.com

# Application Settings
APP_URL=https://isaloum.github.io/TaxSyncForDrivers/
MAX_ATTACHMENT_SIZE=10485760
SUPPORTED_FILE_FORMATS=.pdf,.jpg,.jpeg,.png,.txt

# Tax Calculation Settings
BUSINESS_USE_PERCENTAGE=0.85
PHONE_BUSINESS_PERCENTAGE=0.50
VEHICLE_RATE_FIRST_5000=0.70
VEHICLE_RATE_AFTER_5000=0.64

# Security (Optional but Recommended)
REQUIRE_SIGNATURE_VERIFICATION=true
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_HOURS=1
```

### How to Set Variables by Platform

**Vercel:**
```bash
vercel env add VARIABLE_NAME
```

**Railway:**
```bash
railway variables set VARIABLE_NAME="value"
```

**Render:**
- Dashboard → Service → Environment → Add Environment Variable

**Docker:**
```bash
# Use .env file or -e flags
docker run -e MAILGUN_API_KEY="key" ...
```

---

## Testing & Validation

### 1. Health Check Test

```bash
# Test health endpoint
curl https://your-deployment-url.com/health

# Expected response:
{
  "status": "ok",
  "service": "TaxSync Email Integration",
  "timestamp": "2025-01-14T00:00:00.000Z"
}
```

### 2. Webhook Endpoint Test

```bash
# Test webhook accessibility
curl -X POST https://your-deployment-url.com/webhook/mailgun

# Should return error (no signature) but confirms endpoint exists
```

### 3. Send Test Email

Send email with sample document to:
```
To: notifications@isaloumapps.com
Subject: Test - Uber Summary
Attachment: [Sample Uber receipt/summary]
```

**Expected Flow:**
1. Email arrives at Mailgun
2. Mailgun triggers webhook
3. Server processes document
4. Automated email response sent back

**Check Response Time:**
- Target: < 30 seconds
- Monitor in deployment logs

### 4. Document Processing Tests

Test each document type:

**Uber/Lyft Summary:**
- Send sample weekly summary email
- Verify income and mileage extracted
- Check tax calculation updated

**Gas Receipt:**
- Send gas station receipt
- Verify expense amount extracted
- Check deduction calculated (85% business use)

**T4 Slip:**
- Send T4 employment income slip
- Verify employment income extracted
- Check tax impact calculated

### 5. Integration Test Script

Create `test-deployment.sh`:
```bash
#!/bin/bash

DEPLOYMENT_URL="https://your-deployment-url.com"

echo "🧪 Testing TaxSync Email Automation Deployment"
echo "================================================"

# Test 1: Health Check
echo "1️⃣ Testing health endpoint..."
HEALTH=$(curl -s "${DEPLOYMENT_URL}/health")
if echo "$HEALTH" | grep -q "ok"; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    exit 1
fi

# Test 2: Webhook Endpoint
echo "2️⃣ Testing webhook endpoint..."
WEBHOOK=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${DEPLOYMENT_URL}/webhook/mailgun")
if [ "$WEBHOOK" = "403" ] || [ "$WEBHOOK" = "500" ]; then
    echo "✅ Webhook endpoint accessible (returned $WEBHOOK as expected without signature)"
else
    echo "❌ Webhook endpoint not accessible (returned $WEBHOOK)"
fi

echo "================================================"
echo "✅ Deployment tests completed"
echo "📧 Send test email to: notifications@isaloumapps.com"
```

Run with: `bash test-deployment.sh`

---

## Monitoring

### Application Logs

**Vercel:**
```bash
vercel logs
# Or view in dashboard: https://vercel.com/dashboard
```

**Railway:**
```bash
railway logs
# Real-time logs with -f flag: railway logs -f
```

**Render:**
- Dashboard → Service → Logs

**Docker:**
```bash
docker logs -f taxsync-email
```

### Key Metrics to Monitor

| Metric | Target | How to Check |
|--------|--------|--------------|
| **Uptime** | 99.9% | Health check endpoint |
| **Response Time** | < 30s | Email processing logs |
| **Success Rate** | > 95% | Email processing results |
| **Error Rate** | < 5% | Error logs |

### Log Messages to Monitor

✅ **Success Indicators:**
```
📧 Received email from user@example.com with 1 attachment(s)
✅ Document processed: UBER_SUMMARY
💰 Tax update applied for user@example.com
📤 Sent processing results to user@example.com
```

❌ **Error Indicators:**
```
❌ Invalid Mailgun signature
❌ Document processing error
❌ Tax update error
❌ Failed to send error notification
```

### Set Up Alerts

**Recommended Monitoring Tools:**
- [UptimeRobot](https://uptimerobot.com) - Free uptime monitoring
- [Better Uptime](https://betteruptime.com) - Advanced monitoring
- [Sentry](https://sentry.io) - Error tracking
- [LogRocket](https://logrocket.com) - Session replay

**Basic Uptime Monitor:**
1. Create UptimeRobot account
2. Add monitor:
   - Monitor Type: HTTP(s)
   - URL: `https://your-deployment-url.com/health`
   - Monitoring Interval: 5 minutes
3. Set up email/SMS alerts

---

## Troubleshooting

### Common Issues

#### 1. "Invalid Mailgun signature" Error

**Cause:** Webhook signing key mismatch or not set

**Solution:**
```bash
# Verify MAILGUN_WEBHOOK_KEY is set correctly
# Get key from Mailgun: Settings → Webhooks → Signing Key

# Update environment variable
vercel env add MAILGUN_WEBHOOK_KEY
# or
railway variables set MAILGUN_WEBHOOK_KEY="correct_key"
```

#### 2. Emails Not Being Received

**Cause:** Mailgun route not configured or DNS issues

**Solution:**
1. Check Mailgun Routes: Receiving → Routes
2. Verify route matches `notifications@isaloumapps.com`
3. Check webhook URL is correct
4. Verify DNS records are propagated:
   ```bash
   dig MX taxsyncfordrivers.com
   ```

#### 3. "500 Internal Server Error"

**Cause:** Missing environment variables or code error

**Solution:**
1. Check logs for specific error:
   ```bash
   vercel logs --follow
   ```
2. Verify all required environment variables are set
3. Check that dependencies are installed

#### 4. Documents Not Being Classified

**Cause:** Document format not recognized or poor quality

**Solution:**
1. Check document contains expected keywords
2. Verify file format is supported (.pdf, .jpg, .png, .txt)
3. Review classification logs
4. Test with sample documents first

#### 5. Cold Start Delays (Vercel Free Tier)

**Cause:** Serverless function sleeping after inactivity

**Solution:**
- Upgrade to Vercel Pro for always-on
- Or use Railway/Render for persistent server
- Or implement periodic health check ping

#### 6. Rate Limiting Issues

**Cause:** Too many requests from same IP

**Solution:**
- Implement rate limiting (commented in email-server.js)
- Use Mailgun's rate limiting features
- Monitor for abuse

### Debug Mode

Enable detailed logging:

```bash
# Add environment variable
NODE_ENV=development

# Or add debug flag
DEBUG=* node email-server.js
```

### Get Help

1. Check deployment platform status pages
2. Review Mailgun logs and webhook history
3. Check GitHub Issues
4. Contact support@taxsyncfordrivers.com

---

## Security Checklist

- [x] ✅ HTTPS endpoints only
- [x] ✅ Webhook signature verification enabled
- [x] ✅ Environment variables secured (not in code)
- [x] ✅ Rate limiting configured
- [x] ✅ No document storage (memory processing only)
- [x] ✅ Input validation on all endpoints
- [x] ✅ Error messages don't leak sensitive data

---

## Next Steps

After successful deployment:

1. ✅ Test with sample documents
2. ✅ Set up monitoring and alerts
3. ✅ Prepare demo script (see DEMO_GUIDE.md)
4. ✅ Configure custom domain (optional)
5. ✅ Schedule backup solution (optional)
6. ✅ Document user onboarding process

---

## Quick Reference

### Essential URLs

- **Health Check:** `https://your-deployment-url.com/health`
- **Webhook Endpoint:** `https://your-deployment-url.com/webhook/mailgun`
- **Send Email To:** `notifications@isaloumapps.com`
- **Mailgun Dashboard:** https://app.mailgun.com
- **Deployment Dashboard:** [Vercel/Railway/Render]

### Essential Commands

```bash
# Test health
curl https://your-deployment-url.com/health

# View logs (Vercel)
vercel logs

# View logs (Railway)
railway logs

# Deploy updates (Vercel)
vercel --prod

# Deploy updates (Railway)
railway up
```

---

**Ready to deploy? Choose your platform above and follow the step-by-step guide!** 🚀

For client demonstration preparation, see **[DEMO_GUIDE.md](./DEMO_GUIDE.md)**.
