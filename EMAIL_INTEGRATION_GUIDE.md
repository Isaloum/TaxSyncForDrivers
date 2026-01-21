# 📧 Email Integration System - Setup Guide

## Overview

The TaxSyncForDrivers email integration system allows users to forward tax documents to `notifications@isaloumapps.com` and receive automated processing with OCR, AI extraction, and real-time tax calculations.

## Features

✅ **Email Webhook Processing** - Receives emails via AWS SES webhooks  
✅ **Multi-Format Support** - PDF, JPG, PNG, TXT attachments  
✅ **AI Document Classification** - Automatically identifies document types  
✅ **Smart Data Extraction** - Extracts tax-relevant data using pattern matching  
✅ **Tax Calculator Integration** - Updates user tax profiles automatically  
✅ **Automated Email Responses** - Sends beautiful HTML emails with processing results via AWS SES  
✅ **Security Features** - Secure webhook handling  
✅ **Multi-Document Support** - Process multiple attachments per email  

## Supported Document Types

- 📊 **Uber/Lyft Weekly Summaries** - Income and mileage tracking
- ⛽ **Gas Receipts** - Fuel expense deductions
- 🔧 **Maintenance Receipts** - Vehicle repair costs
- 📄 **T4/RL-1 Tax Slips** - Employment income
- 📱 **Phone Bills** - Business use percentage
- 🅿️ **Parking Receipts** - Business parking expenses
- 🏥 **Insurance Documents** - Vehicle insurance premiums

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your AWS SES credentials:

```env
AWS_ACCESS_KEY_ID=your_aws_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here
AWS_REGION=us-east-2
SES_FROM_DOMAIN=isaloumapps.com
PORT=3000
```

### 3. Start the Server

```bash
npm run server
```

Or for development with auto-reload:

```bash
npm run server:dev
```

The server will start on `http://localhost:3000`

### 4. Configure AWS SES Webhooks (Optional)

For receiving emails via AWS SES:

1. Set up SES receiving rules (see [AWS_SES_SETUP.md](./AWS_SES_SETUP.md))
2. Configure SNS topic for incoming email notifications
3. Point SNS webhook to: `https://your-domain.com/webhook/ses`
4. Or use the generic webhook endpoint for manual testing

## API Endpoints

### Health Check

```http
GET /health
```

Returns server status.

**Response:**
```json
{
  "status": "ok",
  "service": "TaxSync Email Integration",
  "timestamp": "2025-01-13T20:00:00.000Z"
}
```

### Mailgun Webhook

```http
POST /webhook/mailgun
```

### AWS SES Webhook

```http
POST /webhook/ses
```

Receives incoming emails from AWS SES. Processes documents and sends automated responses.

### Generic Email Webhook

```http
POST /webhook/email
```

Generic webhook for testing and custom integrations.

**Request Body:**
```json
{
  "from": "user@example.com",
  "subject": "Tax Documents",
  "text": "Email body text",
  "html": "<p>Email HTML</p>",
  "attachments": []
}
```

## Email Processing Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. User forwards email to notifications@isaloumapps.com      │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  2. AWS SES receives email and triggers webhook             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Server processes email securely                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Extract attachments and email body text                 │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Classify documents using AI pattern matching            │
│     - Uber/Lyft summaries                                   │
│     - Gas receipts                                          │
│     - Tax slips (T4, RL-1)                                  │
│     - Maintenance receipts                                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  6. Extract structured data                                 │
│     - Income amounts                                        │
│     - Distances/mileage                                     │
│     - Expense amounts                                       │
│     - Dates and periods                                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  7. Update user tax profile                                 │
│     - Add income                                            │
│     - Calculate deductions                                  │
│     - Update expense tracking                               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  8. Calculate tax impact                                    │
│     - Total income                                          │
│     - Total deductions                                      │
│     - Estimated tax savings                                 │
│     - Quarterly payment amounts                             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  9. Send confirmation email with results                    │
│     - Beautiful HTML email                                  │
│     - Processing summary                                    │
│     - Tax impact breakdown                                  │
│     - Link to tax calculator                                │
└─────────────────────────────────────────────────────────────┘
```

## Tax Calculation Logic

### Income Categories

- **Self-Employment Income**: Uber/Lyft/Taxi earnings
- **Employment Income**: T4/RL-1 reported income
- **Tips**: Gratuities from rideshare platforms

### Deduction Calculations

| Expense Type | Business Use % | Calculation |
|-------------|----------------|-------------|
| Vehicle (Mileage) | 100% | $0.70/km (first 5,000km)<br>$0.64/km (after 5,000km) |
| Fuel | 85% | Receipt total × 0.85 |
| Maintenance | 85% | Receipt total × 0.85 |
| Insurance | 85% | Premium × 0.85 |
| Phone | 50% | Bill total × 0.50 |
| Parking | 100% | Receipt total × 1.00 |

### Tax Rates (Quebec + Federal, 2026)

**Federal Tax Brackets (2026):**
- Up to $58,523: **14%** *(reduced from 15%)*
- $58,523 - $117,045: 20.5%
- $117,045 - $181,440: 26%
- $181,440 - $258,482: 29%
- Over $258,482: 33%

**Quebec Tax Brackets (2026):**
- Up to $54,345: 14%
- $54,345 - $108,680: 19%
- $108,680 - $132,245: 24%
- Over $132,245: 25.75%

**Key 2026 Updates:**
- Federal lowest tax rate reduced from 15% to 14%
- All brackets indexed ~2% for inflation
- QPP contribution rate: 13.8% for self-employed (up from 12.8%)
- QPP maximum pensionable earnings: $73,200
- Canada Workers Benefit: Max $1,549 single / $2,578 family

## Testing

Run the test suite:

```bash
npm test
```

Run only email integration tests:

```bash
npm test -- --grep "Email Integration"
```

**Test Coverage:**
- 229 passing tests
- 82.67% code coverage
- Covers all email processing scenarios

## Security Features

### Secure Email Handling

AWS SES provides enterprise-grade security for email processing:

- TLS encryption for email transmission
- DKIM signing for email authentication
- SPF and DMARC support for domain verification
- Secure credential management via AWS IAM

### Data Privacy

- Documents are processed in memory and **NOT stored permanently**
- Only extracted metadata is kept (no original document content)
- User profiles are stored in-memory (easily migratable to database)
- All communications use HTTPS

## Production Deployment

### Using Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Add environment variables in Vercel dashboard

### Using Heroku

1. Create Heroku app:
```bash
heroku create taxsync-email
```

2. Set environment variables:
```bash
heroku config:set MAILGUN_API_KEY=your_key
heroku config:set MAILGUN_DOMAIN=your_domain
heroku config:set MAILGUN_WEBHOOK_KEY=your_webhook_key
```

3. Deploy:
```bash
git push heroku main
```

### Using Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["node", "email-server.js"]
```

Build and run:
```bash
docker build -t taxsync-email .
docker run -p 3000:3000 --env-file .env taxsync-email
```

## Monitoring & Logs

The server logs all important events:

- 📧 Email received
- ✅ Document processed successfully
- ❌ Processing errors
- 📤 Email sent
- 🔒 Signature verification failures

## Troubleshooting

### Webhook not receiving emails

1. Check Mailgun route configuration
2. Verify webhook URL is accessible from internet
3. Check webhook signature verification settings
4. Review Mailgun logs for delivery errors

### Documents not being classified

1. Verify document contains expected keywords
2. Check pattern library for document type
3. Review classification confidence scores
3. Add debug logging to see classification results

### Tax calculations incorrect

1. Verify extracted data is correct
2. Check business use percentages in configuration
3. Review tax bracket calculations
4. Test with known sample data

## Development

### Project Structure

```
TaxSyncForDrivers/
├── email-server.js          # Express server with webhooks
├── email-handler.js         # Email processing logic
├── email-sender.js          # Email response generation
├── tax-integration.js       # Tax calculation integration
├── document-processor.js    # OCR and text extraction
├── pattern-library.js       # Document classification patterns
├── validation-engine.js     # Data validation
├── tests/
│   ├── email-integration.test.js
│   └── ...
└── .env.example            # Environment variables template
```

### Adding New Document Types

1. Add pattern to `pattern-library.js`:
```javascript
export const MY_DOCUMENT_PATTERNS = {
  field1: /pattern1/i,
  field2: /pattern2/i,
};
```

2. Add classification pattern:
```javascript
CLASSIFICATION_PATTERNS.MY_DOC = /my.*pattern/is;
```

3. Add extraction logic to `extractFields()` function

4. Add tax integration logic in `tax-integration.js`

5. Add tests in `tests/email-integration.test.js`

## Support

For issues or questions:
- 📧 Email: support@taxsyncfordrivers.com
- 🐛 Issues: [GitHub Issues](https://github.com/Isaloum/TaxSyncForDrivers/issues)
- 📚 Documentation: [GitHub Wiki](https://github.com/Isaloum/TaxSyncForDrivers/wiki)

## License

MIT License - See LICENSE file for details

---

Made with ❤️ for rideshare drivers in Quebec
