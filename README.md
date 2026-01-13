# 🚗 TaxSyncForDrivers

**Smart Tax Planning for Quebec Rideshare & Taxi Drivers**

> Maximize deductions • Track expenses • Plan quarterly taxes • **NEW: Automated document processing**

[![Tests](https://img.shields.io/badge/tests-229%20passing-brightgreen)](https://github.com/Isaloum/TaxSyncForDrivers)
[![Coverage](https://img.shields.io/badge/coverage-83%25-brightgreen)](https://github.com/Isaloum/TaxSyncForDrivers)

## 💡 Why TaxSyncForDrivers?

**Uber/Lyft/Taxi drivers lose $3,000-$5,000/year on taxes**

Why?

- ❌ Don't track vehicle expenses
- ❌ Miss mileage deduction ($0.70/km!)
- ❌ No quarterly tax planning
- ❌ Manual self-employment tax
- ❌ **Manual data entry from tax documents**

**We solve this.**

## 🚀 Features

### 1. 🚙 Vehicle Expense Optimizer

- Simplified: $0.70/km first 5,000km, $0.64/km after
- Detailed: Fuel, insurance, maintenance, CCA
- **We pick the best method for you**

### 2. 📱 Platform Income Parser

- Auto-parse Uber/Lyft statements
- Extract fares, tips, fees
- One-click import

### 3. 💰 Quarterly Tax Planner

- Weekly savings targets
- Payment calendar (Mar/Jun/Sep/Dec)
- Late penalty calculator

### 4. 💼 Self-Employment Tax

- QPP/CPP automatic calculation
- Employer portion deductible

### 5. 📧 **NEW: Email Automation System**

**Forward tax documents to `docs@taxsyncfordrivers.com` for instant processing!**

#### How it works:
1. 📧 **Forward or email** your tax documents and receipts
2. 🤖 **AI processes** - Extracts data automatically
3. 💰 **Tax updated** - Your profile is updated with income/expenses
4. ✉️ **Get results** - Receive detailed summary email

#### Email Features:
- **Mailgun Integration** - Enterprise-grade email processing
- **Webhook Security** - HMAC signature verification
- **Multi-Document Support** - Process multiple attachments at once
- **Beautiful HTML Emails** - Professional response templates
- **Tax Impact Summary** - Instant calculations in your inbox

📚 **[Complete Email Setup Guide](EMAIL_INTEGRATION_GUIDE.md)**

### 6. 📄 **Document Upload & Processing**

**Upload tax documents and receipts for instant data extraction!**

![Document Upload Interface](https://github.com/user-attachments/assets/70b6a20a-26d2-4b0a-897e-e697a0bb2928)

#### Supported Documents:
- **T4 / T4A** - Canadian employment slips
- **RL-1 / RL-2** - Quebec employment slips
- **Uber / Lyft** - Weekly/monthly earnings summaries
- **Gas receipts** - Shell, Esso, Petro-Canada, etc.
- **Vehicle maintenance** - Repairs, tires, oil changes
- **Insurance** - Annual premiums
- **Parking / Tolls** - Receipts
- **Phone bills** - Monthly statements

#### How it works:
1. **📁 Upload** - Drag & drop PDFs, images, or paste text
2. **🔍 Process** - AI identifies document type and extracts data
3. **✅ Validate** - Automatic validation with confidence scores
4. **📊 Review** - See extracted fields with warnings for unusual values

![Document Processing Results](https://github.com/user-attachments/assets/4bd2d050-7248-4ee1-b2a5-80189022776b)

#### Features:
- **100% client-side processing** - Your data never leaves your browser
- **Smart validation** - Detects unusual amounts and missing data
- **Confidence scoring** - Know how reliable the extraction is
- **Multi-format support** - Text, PDF, and images (OCR coming soon)
- **Bilingual** - Full English and French support

## 📊 Example: Marie (Uber Driver)

| Category           | Amount      |
| ------------------ | ----------- |
| Uber Fares         | $72,000     |
| Vehicle Expenses   | -$22,400    |
| **Tax Owed**       | **$10,230** |
| **Weekly Savings** | **$197**    |

## 🧪 Testing

✅ 229 tests | ✅ 83% coverage

Run tests:
```bash
npm test              # Unit tests
npm run test:e2e      # End-to-end tests
npm run test:all      # All tests
```

## 🚀 Quick Start

### Run Locally

```bash
# Install dependencies
npm install

# Run tests
npm test

# Start email server (optional)
npm run server
```

### Email Integration Setup

See the **[Complete Email Integration Guide](EMAIL_INTEGRATION_GUIDE.md)** for:
- Mailgun configuration
- Webhook setup
- Environment variables
- Production deployment
- Testing & monitoring

## 🏗️ Architecture

### Email Integration System
- **Email Server** (`email-server.js`) - Express server with Mailgun webhooks
- **Email Handler** (`email-handler.js`) - Email processing and document extraction
- **Email Sender** (`email-sender.js`) - Automated response generation
- **Tax Integration** (`tax-integration.js`) - User profile and tax calculations

### Document Processing Engine
- **Pattern Library** (`pattern-library.js`) - Document type recognition and field extraction
- **Validation Engine** (`validation-engine.js`) - Data validation and anomaly detection
- **Document Processor** (`document-processor.js`) - Core processing logic

### Technology Stack
- **Pure JavaScript** - No dependencies, runs entirely in your browser
- **Client-side processing** - 100% private, zero data transmission
- **Modular design** - Easy to extend with new document types
- **Comprehensive tests** - 168 test cases covering all features

## 🔒 Privacy & Security

- ✅ **100% client-side** - All calculations happen in your browser
- ✅ **No data transmission** - Nothing sent to servers
- ✅ **No tracking** - No analytics, no cookies
- ✅ **Open source** - Audit the code yourself

## ⭐ Star This Repo!

Help other drivers save money!

---

**For Quebec's rideshare & taxi drivers** 🚗

_Consult a tax professional for advice_
