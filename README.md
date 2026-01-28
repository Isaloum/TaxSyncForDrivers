# 🇨🇦 TaxSyncForDrivers

**Comprehensive Canadian Tax Calculator & Expense Tracker for All Provinces & Territories**

> **For everyone:** Drivers • Employees • Students • Self-employed • Retirees • Mixed income
> 
> Maximize deductions • Track expenses • AI-powered document processing • 100% client-side

[![Tests](https://img.shields.io/badge/tests-477%20passing-brightgreen)](https://github.com/Isaloum/TaxSyncForDrivers)
[![Coverage](https://img.shields.io/badge/coverage-83%25-brightgreen)](https://github.com/Isaloum/TaxSyncForDrivers)
[![Provinces](https://img.shields.io/badge/provinces-10%2F10%20%E2%9C%93-success)](PROVINCE_COVERAGE.md)
[![Territories](https://img.shields.io/badge/territories-3%2F3%20%E2%9C%93-success)](PROVINCE_COVERAGE.md)

**✨ 2026 Tax Rates:** Now updated with official CRA and provincial 2026 rates, including the federal tax rate reduction to 14%. See [TAX_RATES_2026.md](TAX_RATES_2026.md) for details.

**🍁 Complete Canada Coverage:** All 10 provinces and 3 territories supported! See [PROVINCE_COVERAGE.md](PROVINCE_COVERAGE.md) for full details.

## 💡 Why TaxSyncForDrivers?

**Canadians leave thousands on the table every tax year**

Common issues across all taxpayers:

- ❌ Miss eligible deductions and credits
- ❌ Manual data entry from tax documents
- ❌ Unclear province-specific benefits
- ❌ No tax planning throughout the year
- ❌ Complicated forms and calculations

**We solve this for everyone.**

## 👥 Who is TaxSyncForDrivers For?

### 🚗 Rideshare & Taxi Drivers
- Vehicle expense optimization (simplified vs. detailed method)
- Uber/Lyft statement parsing
- Quarterly tax planning
- GST/QST tracking

### 💼 Self-Employed Workers
- Business expense tracking with CRA-compliant categories
- Home office deduction calculator
- Capital Cost Allowance (CCA) automation
- T2125/TP-80-V form generation

### 👔 Employees
- T4 income slip parsing
- RRSP contribution optimizer
- Union dues and employment expenses
- Tax refund estimator

### 🎓 Students
- **NEW:** Tuition tax credit calculator (T2202)
- Student loan interest deduction
- Part-time income optimization
- Moving expense calculator (for work/study)

### 🏡 Retirees
- **Old Age Security (OAS)** - Monthly benefits for 65+, clawback calculator
- **Guaranteed Income Supplement (GIS)** - Low-income senior support
- **CPP/QPP Retirement** - Pension estimates, early/late start analysis
- **Pension Income Splitting** - Optimize couples' tax burden
- **Allowance & Survivor Benefits** - Ages 60-64
- Comprehensive retirement planning for all Canadian provinces/territories
- Age amount and pension income credits
- Medical expense tracking
- OAS/GIS benefit calculator

### 🔀 Mixed Income
- Multiple income stream optimization
- Self-employment + employment tax planning
- Investment income integration (T5)

## 🚀 Features

### ✅ All Income Types
- **Employment (T4)** - Parse and calculate federal/provincial tax
- **Self-employment** - Business income and expenses (T2125/TP-80-V)
- **Investment (T5)** - Dividend and interest income with tax-efficient planning
- **Pension** - Retirement income with splitting optimization
- **Platform income** - Uber/Lyft/DoorDash automated parsing

### ✅ Investment Income Calculators
- **Dividend Tax Credit** - Eligible & non-eligible dividends, all provinces/territories
- **Dividend vs. Interest Comparison** - Tax-efficient income planning
- **T5 slip processing** - Automatic dividend extraction and validation

### ✅ Universal Deductions & Credits
- **RRSP** - Contribution optimizer and carry-forward tracking
- **Charitable donations** - Federal and provincial credit calculation
- **Medical expenses** - Family claim optimization
- **Childcare** - Eligible expense tracking
- **Canada Child Benefit (CCB)** - Tax-free monthly payments for children under 18
- **Tuition** - T2202 processing with provincial variations
- **Home office** - For employees and self-employed
- **Moving expenses** - Work/study relocation

### ✅ All Provinces & Territories
- **Complete coverage** - 10 provinces + 3 territories
- **Province-specific credits** - Climate action, child benefits, seniors benefits
- **Accurate 2026 rates** - Federal tax rate reduction to 14%
- **Provincial variations** - Quebec (RL-1, QPP), Ontario (Trillium), BC (Climate Action), etc.

### ✅ Multiple User Profiles
- **Smart UI** - Shows only relevant sections for your situation
- **Profile types** - Driver, Employee, Self-employed, Student, Retiree, Mixed income
- **Optimized workflows** - Tailored guidance for each user type

### ✅ AI Document Processing
- **T4, T5, RL-1, T2202** - Tax slips
- **Uber/Lyft statements** - Platform earnings
- **Receipts** - Gas, maintenance, insurance
- **100% client-side** - Your data stays private

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

**Forward tax documents to `notifications@isaloumapps.com` for instant processing!**

#### How it works:
1. 📧 **Forward or email** your tax documents and receipts
2. 🤖 **AI processes** - Extracts data automatically (< 30 seconds)
3. 💰 **Tax updated** - Your profile is updated with income/expenses
4. ✉️ **Get results** - Receive detailed summary email

#### Email Features:
- **AWS SES Integration** - Enterprise-grade email processing
- **Webhook Security** - Secure email handling
- **Multi-Document Support** - Process multiple attachments at once
- **Beautiful HTML Emails** - Professional response templates
- **Tax Impact Summary** - Instant calculations in your inbox
- **Production Ready** - Deployed and operational for demos

#### 🚀 Deployment Options:
- **Vercel** (Serverless) - Recommended for easy deployment
- **Railway** - Persistent server with always-on capability
- **Render** - Alternative hosting with Docker support
- **Docker** - Self-hosted deployment for full control

📚 **Documentation:**
- **[Deployment Guide](DEPLOYMENT.md)** - Complete deployment instructions
- **[AWS SES Setup](MAILGUN_SETUP.md)** - Email service configuration
- **[Demo Guide](DEMO_GUIDE.md)** - Client demonstration preparation
- **[Email Integration Guide](EMAIL_INTEGRATION_GUIDE.md)** - Technical details

### 6. 📄 **Document Upload & Processing**

**Upload tax documents and receipts for instant data extraction!**

![Document Upload Interface](https://github.com/user-attachments/assets/70b6a20a-26d2-4b0a-897e-e697a0bb2928)

#### Supported Documents:
- **T4 / T4A** - Canadian employment slips
- **T5** - Investment income slips
- **RL-1 / RL-2** - Quebec employment slips
- **T2202** - Tuition and Enrolment Certificate
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

**For all Canadians** 🇨🇦

_While this tool provides accurate calculations based on 2026 CRA rates, always consult a tax professional for personalized advice._
