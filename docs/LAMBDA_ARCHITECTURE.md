# Lambda Architecture Documentation

Technical overview of the TaxSync email automation system architecture.

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Email Flow                                  │
└─────────────────────────────────────────────────────────────────────┘

   User sends email                  AWS SES receives email
   with attachments                  (MX record routing)
         │                                    │
         │                                    │
         ▼                                    ▼
   ┌──────────┐                      ┌──────────────┐
   │  Gmail   │                      │   AWS SES    │
   │ Outlook  │ ────────────────────▶│  (Receiving) │
   │  Other   │   notifications@     │              │
   └──────────┘   isaloumapps.com    └──────┬───────┘
                                             │
                    Spam/Virus scanning      │
                    Receipt rule applied     │
                                             ▼
                                    ┌─────────────────┐
                                    │   S3 Bucket     │
                                    │ taxsync-emails  │
                                    │                 │
                                    │ /incoming/      │
                                    │   email-1.eml   │
                                    │   email-2.eml   │
                                    └────────┬────────┘
                                             │
                          S3 ObjectCreated   │
                          event triggers     │
                                             ▼
                                    ┌─────────────────┐
                                    │  Lambda Function│
                                    │ emailProcessor  │
                                    │                 │
                                    │ 1. Parse email  │
                                    │ 2. Extract att. │
                                    │ 3. Process docs │
                                    │ 4. Send response│
                                    └────────┬────────┘
                                             │
                    Uses existing modules    │
                    - document-processor.js  │
                    - pattern-library.js     │
                    - validation-engine.js   │
                                             ▼
                                    ┌─────────────────┐
                                    │   AWS SES       │
                                    │   (Sending)     │
                                    │                 │
                                    │ Sends formatted │
                                    │ response email  │
                                    └────────┬────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │   User Inbox    │
                                    │                 │
                                    │ Processing      │
                                    │ results with    │
                                    │ extracted data  │
                                    └─────────────────┘
```

## 🔧 Component Details

### 1. AWS SES (Simple Email Service)

**Role**: Email receiving and sending

**Receiving Configuration:**
- **MX Record**: Routes emails to SES
- **Receipt Rule Set**: Defines how to handle emails
- **Receipt Rules**:
  - Spam/virus scanning enabled
  - Save to S3 action
  - Recipient filter: notifications@isaloumapps.com

**Sending Configuration:**
- Verified domain/email: isaloumapps.com
- HTML + plain text emails
- Bounce/complaint handling

**Limits:**
- Sandbox: 200 emails/day, verified recipients only
- Production: 50,000+ emails/day (request increase)
- Free tier: 62,000 emails/month (when called from Lambda)

### 2. S3 Bucket

**Name**: `taxsync-incoming-emails-{instanceId}`

**Purpose**: Email storage

**Structure:**
```
taxsync-incoming-emails/
├── incoming/
│   ├── {messageId}-{timestamp}
│   └── ...
```

**Lifecycle Policy:**
- Delete objects after 30 days
- Reduces storage costs
- Complies with data retention policies

**Security:**
- Block public access
- Bucket policy allows SES PutObject
- Lambda has GetObject permission
- Encrypted at rest (SSE-S3)

**Estimated Costs:**
- Storage: ~$0.023/GB/month
- Requests: ~$0.0004 per 1,000 GET requests
- Average email: 100KB
- 1,000 emails/month × 100KB = ~$0.50/month

### 3. Lambda Function

**Name**: `taxsync-email-automation-dev-emailProcessor`

**Runtime**: Node.js 20.x

**Configuration:**
- Memory: 512 MB
- Timeout: 30 seconds
- Region: us-east-2

**Handler**: `lambda/email-processor/index.handler`

**Trigger**: S3 ObjectCreated event

**Environment Variables:**
- `AWS_REGION`: us-east-2
- `FROM_EMAIL`: notifications@isaloumapps.com

**Dependencies:**
- `@aws-sdk/client-s3`: S3 operations
- `@aws-sdk/client-ses`: Email sending
- `mailparser`: Email parsing
- Parent directory modules (bundled):
  - document-processor.js
  - pattern-library.js
  - validation-engine.js

**Execution Flow:**
1. Receive S3 event with email key
2. Download email from S3
3. Parse email with mailparser
4. Extract attachments
5. Process each attachment:
   - Text files → direct processing
   - PDFs → (future: Textract integration)
   - Images → (future: Textract integration)
6. Generate response email
7. Send via SES
8. Return success/error

**Error Handling:**
- Try-catch blocks at each step
- Log all errors to CloudWatch
- Send error email to sender
- Return error response

### 4. IAM Permissions

**Lambda Execution Role:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::taxsync-incoming-emails-*/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

**S3 Bucket Policy:**

```json
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
      "Resource": "arn:aws:s3:::taxsync-incoming-emails-*/*",
      "Condition": {
        "StringEquals": {
          "aws:Referer": "YOUR_ACCOUNT_ID"
        }
      }
    }
  ]
}
```

## 📊 Data Flow

### Incoming Email Processing

```
1. Email arrives at MX record
   └─▶ SES receives email
       └─▶ Scans for spam/viruses
           └─▶ Applies receipt rule
               └─▶ Saves to S3 (raw email)
                   └─▶ Triggers Lambda (S3 event)
                       └─▶ Lambda downloads email
                           └─▶ Parses email structure
                               └─▶ Extracts attachments
                                   └─▶ Processes documents
                                       └─▶ Generates response
                                           └─▶ Sends via SES
```

### Document Processing Pipeline

```
1. Attachment received (Buffer)
   └─▶ Determine file type
       ├─▶ Text file (.txt)
       │   └─▶ Convert to string
       │       └─▶ quickProcess(text)
       │           └─▶ classifyDocument()
       │               └─▶ extractFields()
       │                   └─▶ validateData()
       │
       ├─▶ PDF file (.pdf)
       │   └─▶ [Future] AWS Textract
       │       └─▶ Extract text
       │           └─▶ Continue as text
       │
       └─▶ Image file (.jpg, .png)
           └─▶ [Future] AWS Textract
               └─▶ OCR text extraction
                   └─▶ Continue as text
```

## 🔒 Security Considerations

### Email Security

1. **Spam/Virus Scanning**: Enabled in SES receipt rules
2. **Domain Verification**: Prevents spoofing
3. **DKIM Signing**: Authenticates outgoing emails
4. **SPF Records**: Validates sender

### Data Security

1. **Encryption at Rest**: S3 SSE-S3 encryption
2. **Encryption in Transit**: TLS for all AWS communication
3. **Access Control**: IAM roles with least privilege
4. **No Logging of PII**: Sensitive data not logged

### Lambda Security

1. **VPC Isolation**: Optional VPC deployment
2. **Environment Variables**: Encrypted by AWS
3. **No Hardcoded Secrets**: Use AWS Secrets Manager
4. **Input Validation**: Sanitize all user input

### Best Practices

- ✅ Use SES sandbox for testing
- ✅ Enable CloudTrail for audit logs
- ✅ Rotate AWS credentials regularly
- ✅ Monitor CloudWatch for anomalies
- ✅ Set up billing alerts
- ✅ Regular security updates

## 📈 Scalability

### Current Limits

- **SES Receiving**: No hard limit
- **Lambda Concurrency**: 1,000 concurrent executions (default)
- **S3 Operations**: Unlimited
- **Email Size**: 30 MB (SES limit)

### Scaling Strategies

1. **Horizontal Scaling**:
   - Lambda auto-scales with requests
   - Add multiple receipt rules for load distribution
   - Use SQS for buffering high volume

2. **Vertical Scaling**:
   - Increase Lambda memory (512MB → 1024MB)
   - Increase timeout (30s → 60s)
   - Add provisioned concurrency

3. **Performance Optimization**:
   - Minimize Lambda cold starts
   - Use Lambda layers for dependencies
   - Implement caching (ElastiCache)
   - Batch processing for multiple attachments

### High Volume (>10,000 emails/day)

```
SES → S3 → SQS → Lambda (multiple instances)
                 └─▶ Parallel processing
                     └─▶ DynamoDB for state
                         └─▶ SES for responses
```

## 🔍 Monitoring & Logging

### CloudWatch Metrics

**Lambda Metrics:**
- Invocations
- Errors
- Duration
- Throttles
- Concurrent executions

**SES Metrics:**
- Emails sent
- Delivery failures
- Bounces
- Complaints

**S3 Metrics:**
- Bucket size
- Request count
- Download bandwidth

### CloudWatch Logs

**Log Groups:**
- `/aws/lambda/taxsync-email-automation-dev-emailProcessor`

**Log Events:**
- Lambda invocations
- Email parsing
- Document processing
- Error stack traces

**Log Retention:**
- Default: Never expire
- Recommended: 30 days
- Cost: ~$0.50/GB/month

### Alarms

Set up alarms for:
- Lambda errors > threshold
- Lambda duration > 25 seconds
- SES bounces > 5%
- S3 bucket size > 10 GB

## 💰 Cost Breakdown

### Monthly Estimates (1,000 emails/month)

| Service | Usage | Cost |
|---------|-------|------|
| SES Receiving | 1,000 emails | $0.10 |
| SES Sending | 1,000 emails | Free (within free tier) |
| Lambda | 1,000 invocations × 2s | Free (within free tier) |
| S3 Storage | ~100 MB avg | $0.50 |
| S3 Requests | 2,000 requests | $0.01 |
| CloudWatch Logs | ~500 MB | $0.25 |
| **Total** | | **~$0.86/month** |

### Scaling Costs (10,000 emails/month)

| Service | Usage | Cost |
|---------|-------|------|
| SES Receiving | 10,000 emails | $1.00 |
| SES Sending | 10,000 emails | Free |
| Lambda | 10,000 invocations | Free |
| S3 Storage | ~1 GB | $0.50 |
| S3 Requests | 20,000 requests | $0.01 |
| CloudWatch Logs | ~2 GB | $1.00 |
| **Total** | | **~$2.51/month** |

**Still under $3/month!**

## 🚀 Future Enhancements

1. **AWS Textract Integration**
   - PDF text extraction
   - Image OCR
   - Form/table extraction

2. **DynamoDB Storage**
   - Store processing results
   - Query historical data
   - Analytics dashboard

3. **Step Functions**
   - Complex workflow orchestration
   - Error retry logic
   - Parallel processing

4. **SNS Notifications**
   - Real-time alerts
   - Mobile push notifications
   - Webhook callbacks

5. **API Gateway**
   - REST API for results
   - Webhook endpoints
   - Third-party integrations

## 📚 References

- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [Serverless Framework](https://www.serverless.com/framework/docs)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
