# Cost Optimization Guide

How to keep TaxSync email automation under $2/month while maintaining functionality.

## 💰 Monthly Budget Target: $2

### Current Cost Breakdown (1,000 emails/month)

| Service | Monthly Usage | Cost | Free Tier | Actual Cost |
|---------|--------------|------|-----------|-------------|
| **SES Receiving** | 1,000 emails | $0.10 | - | $0.10 |
| **SES Sending** | 1,000 emails | $0.10 | 62,000/month | $0.00 |
| **Lambda Invocations** | 1,000 requests | $0.20 | 1M requests | $0.00 |
| **Lambda Compute** | 1,000s × 512MB | $0.08 | 400K GB-sec | $0.00 |
| **S3 Storage** | ~100 MB | $0.02 | 5 GB (12 months) | $0.00 |
| **S3 Requests** | 2,000 GET/PUT | $0.01 | 20K GET, 2K PUT | $0.00 |
| **CloudWatch Logs** | ~500 MB | $0.25 | 5 GB | $0.00 |
| **Data Transfer** | ~100 MB out | $0.01 | 1 GB | $0.00 |
| **Total** | | | | **$0.10** |

✅ **Well under budget!**

### Scaling Costs (5,000 emails/month)

| Service | Monthly Usage | Cost | Free Tier | Actual Cost |
|---------|--------------|------|-----------|-------------|
| **SES Receiving** | 5,000 emails | $0.50 | - | $0.50 |
| **SES Sending** | 5,000 emails | $0.50 | 62,000/month | $0.00 |
| **Lambda** | 5,000 requests | $0.40 | 1M requests | $0.00 |
| **S3 Storage** | ~500 MB avg | $0.50 | 5 GB (limited) | $0.12 |
| **S3 Requests** | 10,000 | $0.05 | Limited | $0.04 |
| **CloudWatch Logs** | ~2 GB | $1.00 | 5 GB | $0.00 |
| **Data Transfer** | ~500 MB | $0.05 | 1 GB | $0.00 |
| **Total** | | | | **$0.66** |

✅ **Still well under budget!**

### Maximum Volume Under $2 Budget

With free tier:
- **~19,000 emails/month** before hitting $2
- **1M+ emails/month** for Lambda (free tier covers it)
- **62,000 emails/month** for SES sending (free tier)

Main cost driver: **SES receiving at $0.10 per 1,000 emails**

## 🎯 Optimization Strategies

### 1. S3 Lifecycle Policies (Currently Implemented)

**What**: Automatically delete old emails after 30 days

**Savings**: ~50% on S3 storage costs

**Configuration** (in `serverless.yml`):
```yaml
LifecycleConfiguration:
  Rules:
    - Id: DeleteOldEmails
      Status: Enabled
      ExpirationInDays: 30
```

**Custom Optimization**:
```yaml
# Delete after 7 days for maximum savings
ExpirationInDays: 7

# Or transition to cheaper storage
Transitions:
  - StorageClass: GLACIER
    TransitionInDays: 7
  - StorageClass: DEEP_ARCHIVE
    TransitionInDays: 30
```

**Monthly Savings**: $0.20-0.40

### 2. Lambda Memory Optimization

**Current**: 512 MB
**Cost**: $0.0000166667 per GB-second

**Strategy**: Right-size memory allocation

```bash
# Test different memory sizes
# Lower memory = lower cost, but slower execution
# Higher memory = faster execution, may reduce total cost

# 256 MB (minimum for our use case)
memorySize: 256  # Saves 50% on compute

# 1024 MB (faster execution)
memorySize: 1024  # Costs 2x, but may finish faster
```

**Recommendation**: Stay at 512 MB (optimal balance)

**Testing**:
```bash
# Deploy with different memory sizes
serverless deploy --config serverless-256.yml
serverless deploy --config serverless-512.yml
serverless deploy --config serverless-1024.yml

# Compare costs
./scripts/get-lambda-metrics.sh
```

**Monthly Savings**: $0.00-0.10

### 3. Lambda Timeout Optimization

**Current**: 30 seconds
**Strategy**: Reduce to minimum needed

Most emails process in <5 seconds:
```yaml
timeout: 15  # Reduced from 30
```

**Benefits**:
- Prevents runaway executions
- Reduces max cost per invocation
- Forces efficient code

**Monthly Savings**: Prevents accidental overruns

### 4. CloudWatch Logs Retention

**Default**: Never expire (costly at scale)
**Recommended**: 30 days

```bash
# Set log retention
aws logs put-retention-policy \
  --log-group-name /aws/lambda/taxsync-email-automation-dev-emailProcessor \
  --retention-in-days 30
```

**Options**:
- 7 days: Debug only ($0.05/month)
- 30 days: Compliance ($0.25/month)
- 90 days: Historical analysis ($0.75/month)

**Monthly Savings**: $0.50-1.00

### 5. Minimize Lambda Cold Starts

**Problem**: Cold starts consume more time/memory

**Solutions**:

```javascript
// 1. Minimize dependencies
// Only import what you need
import { S3Client } from '@aws-sdk/client-s3';  // ✅ Specific
// vs
import AWS from 'aws-sdk';  // ❌ Everything

// 2. Reuse connections
const s3Client = new S3Client();  // Outside handler
export async function handler(event) {
  // Reuse s3Client across invocations
}

// 3. Use provisioned concurrency (if needed)
provisionedConcurrency: 1  // Costs more, but no cold starts
```

**Monthly Impact**: Free tier covers cold starts

### 6. Batch Processing

**Current**: Process emails individually

**Optimization**: Batch multiple emails

```javascript
// Instead of 1 Lambda per email
// Process multiple emails per invocation

// Use SQS between S3 and Lambda
S3 → SQS (batch) → Lambda (process batch)

// Benefits:
// - Fewer Lambda invocations
// - Better resource utilization
// - Lower cost at scale
```

**When to implement**: >5,000 emails/month

**Monthly Savings**: $0.20-0.50

### 7. S3 Request Optimization

**Strategy**: Minimize S3 API calls

```javascript
// ❌ Bad: Multiple small reads
const header = await s3.getObject({ Range: 'bytes=0-100' });
const body = await s3.getObject({ Range: 'bytes=100-1000' });

// ✅ Good: Single read
const email = await s3.getObject({ Key: emailKey });
```

**Monthly Savings**: $0.01-0.05

### 8. SES Sending Optimization

**Already Optimized**: Using SES from Lambda (free tier)

**Alternative** (don't do this):
- SendGrid: $15/month
- Mailgun: $35/month
- SMTP servers: $5-10/month

**Keep using SES**: 62,000 free emails/month

### 9. Monitoring Cost Reduction

**CloudWatch Metrics**: Free (included)
**CloudWatch Logs**: Pay per GB ingested

**Reduce log verbosity**:

```javascript
// ❌ Bad: Log everything
console.log('Processing email:', emailContent);  // Large logs
console.log('Attachment data:', attachmentBuffer);  // Very large

// ✅ Good: Log only metadata
console.log('Processing email:', emailId);  // Small logs
console.log('Attachment size:', attachmentBuffer.length);  // Minimal
```

**Monthly Savings**: $0.10-0.30

### 10. Regional Optimization

**Current**: us-east-2 (Ohio)
**Cost**: Standard pricing

**Alternatives**:
- us-east-1 (Virginia): Slightly cheaper for some services
- us-west-2 (Oregon): Similar pricing

**Recommendation**: Stay in us-east-2
- Already deployed
- Migration cost > savings
- Regional pricing differences: <5%

## 📊 Free Tier Tracking

### AWS Free Tier (12 months after signup)

**Always Free:**
- Lambda: 1M requests + 400K GB-seconds/month ✅
- CloudWatch: 10 custom metrics + 5 GB logs ✅
- SES: 62,000 emails/month (when called from Lambda) ✅

**12 Months Free:**
- S3: 5 GB storage + 20K GET + 2K PUT ✅
- CloudFront: 50 GB data transfer ✅
- Data Transfer: 1 GB/month ✅

### Track Usage

```bash
# Lambda invocations this month
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=taxsync-email-automation-dev-emailProcessor \
  --start-time $(date -u -d '1 month ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 2592000 \
  --statistics Sum

# S3 bucket size
aws cloudwatch get-metric-statistics \
  --namespace AWS/S3 \
  --metric-name BucketSizeBytes \
  --dimensions Name=BucketName,Value=taxsync-incoming-emails-XXX Name=StorageType,Value=StandardStorage \
  --start-time $(date -u -d '1 day ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 86400 \
  --statistics Average

# SES emails sent
aws cloudwatch get-metric-statistics \
  --namespace AWS/SES \
  --metric-name Send \
  --start-time $(date -u -d '1 month ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 2592000 \
  --statistics Sum
```

### Automated Tracking Script

```bash
#!/bin/bash
# check-free-tier-usage.sh

echo "Free Tier Usage Report"
echo "======================"
echo ""

# Lambda requests (limit: 1M)
LAMBDA_REQUESTS=$(aws cloudwatch get-metric-statistics ... | jq '.Datapoints[0].Sum')
echo "Lambda Requests: $LAMBDA_REQUESTS / 1,000,000 ($(echo "scale=2; $LAMBDA_REQUESTS/10000" | bc)%)"

# S3 storage (limit: 5 GB for 12 months)
S3_SIZE_BYTES=$(aws cloudwatch get-metric-statistics ... | jq '.Datapoints[0].Average')
S3_SIZE_GB=$(echo "scale=2; $S3_SIZE_BYTES/1073741824" | bc)
echo "S3 Storage: $S3_SIZE_GB GB / 5 GB ($(echo "scale=2; $S3_SIZE_GB*20" | bc)%)"

# SES emails (limit: 62,000)
SES_SENT=$(aws cloudwatch get-metric-statistics ... | jq '.Datapoints[0].Sum')
echo "SES Emails: $SES_SENT / 62,000 ($(echo "scale=2; $SES_SENT/620" | bc)%)"
```

## 🚨 Budget Alerts

### Set Up Billing Alarm

```bash
# Create SNS topic for alerts
aws sns create-topic --name billing-alerts
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:billing-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com

# Create billing alarm (must be in us-east-1)
aws cloudwatch put-metric-alarm \
  --alarm-name taxsync-budget-alert \
  --alarm-description "Alert when TaxSync costs exceed $2" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --threshold 2.0 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ServiceName,Value=AWSLambda \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:billing-alerts \
  --region us-east-1
```

### AWS Budgets (Recommended)

```bash
# Create budget
aws budgets create-budget \
  --account-id YOUR_ACCOUNT_ID \
  --budget '{
    "BudgetName": "TaxSync-Monthly-Budget",
    "BudgetLimit": {
      "Amount": "2.00",
      "Unit": "USD"
    },
    "TimeUnit": "MONTHLY",
    "BudgetType": "COST"
  }' \
  --notifications-with-subscribers '[
    {
      "Notification": {
        "NotificationType": "ACTUAL",
        "ComparisonOperator": "GREATER_THAN",
        "Threshold": 80
      },
      "Subscribers": [{
        "SubscriptionType": "EMAIL",
        "Address": "your-email@example.com"
      }]
    }
  ]'
```

## 📈 Scaling Without Breaking Budget

### Scenario 1: 10,000 emails/month (~$1.00)

**Actions:**
- ✅ Keep current setup
- ✅ Set 7-day S3 lifecycle
- ✅ Monitor usage weekly

### Scenario 2: 50,000 emails/month (~$5.00)

**Exceeds budget! Optimizations:**

1. **Batch Processing** ($1.00 savings):
   ```yaml
   # Add SQS between S3 and Lambda
   # Process 10 emails per Lambda invocation
   ```

2. **Reduce Log Retention** ($0.50 savings):
   ```bash
   aws logs put-retention-policy --retention-in-days 7
   ```

3. **S3 Glacier Transition** ($0.30 savings):
   ```yaml
   Transitions:
     - StorageClass: GLACIER
       TransitionInDays: 3
   ```

4. **Reserved Capacity** ($0.20 savings):
   ```yaml
   # Lambda provisioned concurrency with savings plan
   ```

**New Cost**: ~$3.00/month

### Scenario 3: 100,000 emails/month (~$10.00)

**Way over budget! Alternative architecture:**

1. **Use SQS + Batch Lambda**: $2.00
2. **DynamoDB instead of S3 for results**: $1.00
3. **CloudFront for static email templates**: Free
4. **Lambda@Edge for regional processing**: $1.00
5. **Savings Plan (1-year commitment)**: -20% = $3.20

**New Cost**: ~$4.00/month (still 60% over)

**Recommendation**: Re-evaluate if this volume is reached

## 🎓 Best Practices Summary

1. ✅ **Use AWS Free Tier** aggressively
2. ✅ **Set S3 lifecycle policies** (30 days or less)
3. ✅ **Monitor costs weekly** with scripts
4. ✅ **Set up billing alerts** at 80% of budget
5. ✅ **Optimize Lambda memory** based on actual usage
6. ✅ **Reduce log verbosity** to save on CloudWatch
7. ✅ **Keep logs retention low** (7-30 days)
8. ✅ **Batch processing** at higher volumes
9. ✅ **Stay in one region** (us-east-2)
10. ✅ **Review monthly** with Cost Explorer

## 📊 Monthly Review Checklist

```markdown
- [ ] Check AWS Cost Explorer
- [ ] Review free tier usage
- [ ] Verify S3 lifecycle working
- [ ] Check Lambda execution time
- [ ] Review CloudWatch log size
- [ ] Validate under $2 budget
- [ ] Optimize if needed
```

## 🔍 Cost Analysis Tools

```bash
# AWS Cost Explorer (web UI)
https://console.aws.amazon.com/cost-management/home

# AWS CLI cost report
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=SERVICE

# Detailed cost by service
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity DAILY \
  --metrics BlendedCost \
  --filter file://filter.json
```

## 💡 Cost-Saving Pro Tips

1. **Delete test resources** after testing
2. **Use CloudWatch Insights** instead of exporting logs
3. **Compress attachments** before processing (if possible)
4. **Cache common responses** (for identical documents)
5. **Use Lambda layers** to reduce deployment size
6. **Enable S3 Intelligent-Tiering** for automatic cost optimization
7. **Review IAM policies** to prevent accidental resource creation
8. **Tag all resources** for better cost tracking

## 🎯 Target Achievement

**Goal**: Stay under $2/month ✅

**Current**: ~$0.10/month (1,000 emails) ✅✅✅

**Headroom**: Can scale to 19,000 emails before budget concern

**Success!** 🎉
