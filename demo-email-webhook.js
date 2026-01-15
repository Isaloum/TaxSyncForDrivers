#!/usr/bin/env node
// demo-email-webhook.js — Demonstration script for email integration
// Shows how the email webhook processes different document types

import { handleEmailWebhook } from './email-handler.js';
import { updateUserTaxData, getTaxSummary, resetUserProfile } from './tax-integration.js';

console.log('🚗 TaxSync Email Integration Demo\n');
console.log('='.repeat(60));

const DEMO_EMAIL = 'demo@taxsyncfordrivers.com';

// Reset demo user profile
resetUserProfile(DEMO_EMAIL);

async function simulateEmail(subject, text, description) {
  console.log(`\n📧 ${description}`);
  console.log('-'.repeat(60));

  const result = await handleEmailWebhook({
    from: DEMO_EMAIL,
    subject: subject,
    text: text,
    attachments: [],
    receivedAt: new Date().toISOString(),
  });

  if (result.success) {
    console.log(`✅ Processed ${result.processingResult.processedDocuments.length} document(s)`);

    // Update tax data
    for (const doc of result.processingResult.processedDocuments) {
      await updateUserTaxData(DEMO_EMAIL, doc);
      console.log(`   📄 ${doc.documentType}`);
      console.log(`   🎯 Confidence: ${doc.validation.confidenceScore}%`);

      if (doc.extractedData) {
        const fields = Object.keys(doc.extractedData).filter((k) => doc.extractedData[k] != null);
        console.log(`   📊 Extracted: ${fields.join(', ')}`);
      }
    }
  } else {
    console.log(`❌ Failed: ${result.error}`);
  }
}

async function runDemo() {
  // Demo 1: Uber Weekly Summary
  await simulateEmail(
    'Uber Weekly Summary',
    `
    Uber Driver Partner Weekly Summary
    Week of January 1-7, 2025
    
    Gross Fares: $1,250.00
    Tips: $180.00
    Distance: 450 km
    Total Trips: 65
    
    Service Fee: $312.50
    Net Earnings: $1,117.50
    `,
    'Demo 1: Uber Weekly Summary'
  );

  // Demo 2: Gas Receipt
  await simulateEmail(
    'Gas Receipt',
    `
    Shell Gas Station
    123 Main Street, Montreal, QC
    
    Date: 01/15/2025
    
    Regular Unleaded
    Liters: 45.5
    Price per L: $1.45
    
    Total: $65.98
    `,
    'Demo 2: Gas Station Receipt'
  );

  // Demo 3: Lyft Summary
  await simulateEmail(
    'Lyft Summary',
    `
    Lyft Driver Earnings Summary
    January 8-14, 2025
    
    Total Rides: 52
    Gross Earnings: $980.00
    Tips: $120.00
    Distance: 320 miles
    
    Platform Fees: $196.00
    Total Payout: $904.00
    `,
    'Demo 3: Lyft Weekly Summary'
  );

  // Demo 4: Maintenance Receipt
  await simulateEmail(
    'Oil Change Receipt',
    `
    Quick Lube Auto Service
    
    Date: 01/16/2025
    Invoice #45678
    
    Oil Change - Synthetic
    Labor: $30.00
    Parts: $45.00
    
    Subtotal: $75.00
    Tax (QST+GST): $11.24
    Total: $86.24
    `,
    'Demo 4: Vehicle Maintenance'
  );

  // Demo 5: T4 Slip
  await simulateEmail(
    'T4 Tax Slip',
    `
    Statement of Remuneration Paid (T4)
    Tax Year: 2024
    
    Employer: ABC Corporation Inc.
    
    Box 14: Employment Income      $42,000.00
    Box 16: CPP Contributions       $2,343.00
    Box 18: EI Premiums              $660.60
    Box 22: Income Tax Deducted    $6,720.00
    `,
    'Demo 5: T4 Employment Income Slip'
  );

  // Show final tax summary
  console.log('\n' + '='.repeat(60));
  console.log('💰 FINAL TAX SUMMARY');
  console.log('='.repeat(60));

  const summary = getTaxSummary(DEMO_EMAIL);

  if (summary) {
    console.log(`\n📊 Income:`);
    console.log(`   Self-Employment: $${summary.income.selfEmployment.toLocaleString()}`);
    console.log(`   Employment (T4): $${summary.income.employment.toLocaleString()}`);
    console.log(`   TOTAL INCOME:    $${summary.income.total.toLocaleString()}`);

    console.log(`\n💸 Deductions:`);
    console.log(`   Vehicle:         $${summary.expenses.vehicle.toFixed(2)}`);
    console.log(`   Fuel:            $${summary.expenses.fuel.toFixed(2)}`);
    console.log(`   Maintenance:     $${summary.expenses.maintenance.toFixed(2)}`);
    console.log(`   TOTAL EXPENSES:  $${summary.expenses.total.toFixed(2)}`);

    if (summary.taxCalculation) {
      console.log(`\n🧮 Tax Calculation:`);
      console.log(`   Net Income:      $${summary.taxCalculation.netIncome.toLocaleString()}`);
      console.log(`   Federal Tax:     $${summary.taxCalculation.federalTax.toLocaleString()}`);
      console.log(`   Quebec Tax:      $${summary.taxCalculation.quebecTax.toLocaleString()}`);
      console.log(`   TOTAL TAX:       $${summary.taxCalculation.totalTax.toLocaleString()}`);
      console.log(`   Tax Savings:     $${summary.taxCalculation.taxSavings.toLocaleString()}`);
      console.log(
        `   Quarterly:       $${summary.taxCalculation.quarterlyPayment.toLocaleString()}`
      );
    }

    console.log(`\n📈 Documents Processed: ${summary.documentCount}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Demo Complete!');
  console.log('='.repeat(60));
  console.log('\n💡 Try it yourself:');
  console.log('   1. Start the server: npm run server');
  console.log('   2. Configure Mailgun webhook');
  console.log('   3. Forward documents to notifications@isaloumapps.com');
  console.log('   4. Get instant tax calculations!\n');
}

runDemo().catch(console.error);
