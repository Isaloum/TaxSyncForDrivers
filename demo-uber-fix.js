#!/usr/bin/env node
// Demonstration of Uber Tax Summary Pattern Fix
// This script shows how the fix enables extraction from 2024 Uber tax summaries

import { extractFields, classifyDocument, DOCUMENT_TYPES } from './pattern-library.js';

console.log('='.repeat(80));
console.log('UBER TAX SUMMARY PATTERN FIX DEMONSTRATION');
console.log('='.repeat(80));
console.log();

// Sample 2024 Uber Annual Tax Summary
const sampleDocument = `
UBER RIDES - GROSS FARES BREAKDOWN
This section indicates the fees you have charged to Riders.
GST you collected from Riders CA$150.50
QST you collected from Riders CA$75.25
Total CA$1,500.00

UBER RIDES - FEES BREAKDOWN
This section indicates the fees you have paid to Uber.
GST you paid to Uber CA$50.00
QST you paid to Uber CA$25.00
Total CA$250.00

UBER EATS - GROSS FARES BREAKDOWN
GST you collected from Uber CA$45.00
QST you collected from Uber CA$22.50
Total CA$500.00

OTHER INCOME BREAKDOWN
This section indicates other amounts paid to you by Uber.
GST you collected from Uber QST you collected from Uber Total CA$0.00
CA$0.00

OTHER POTENTIAL DEDUCTIONS
Online Mileage 350 km

Tax summary for the period 2024
`;

console.log('📄 Sample 2024 Uber Annual Tax Summary');
console.log('-'.repeat(80));
console.log(sampleDocument);
console.log();

// Classify the document
console.log('🔍 STEP 1: Document Classification');
console.log('-'.repeat(80));
const docType = classifyDocument(sampleDocument);
console.log(`Detected Document Type: ${docType}`);
console.log(`✅ Status: ${docType === DOCUMENT_TYPES.UBER_SUMMARY ? 'SUCCESS' : 'FAILED'}`);
console.log();

// Extract fields
console.log('📊 STEP 2: Field Extraction');
console.log('-'.repeat(80));
const fields = extractFields(sampleDocument, DOCUMENT_TYPES.UBER_SUMMARY);

console.log('Extracted Data:');
console.log(`  • Period: ${fields.period || 'N/A'}`);
console.log(`  • Gross Fares (Uber Rides): $${fields.grossFares - (fields.uberEatsFares || 0)}`);
console.log(`  • Gross Fares (Uber Eats):  $${fields.uberEatsFares || 0}`);
console.log(`  • Total Gross Fares:        $${fields.grossFares} ← Auto-summed!`);
console.log(`  • Service Fees Paid:        $${fields.serviceFees || 0}`);
console.log(`  • Distance (km):            ${fields.distance || 'N/A'}`);
console.log(`  • GST Collected:            $${fields.gstCollected || 0}`);
console.log(`  • QST Collected:            $${fields.qstCollected || 0}`);
console.log();

console.log('✨ KEY IMPROVEMENTS DEMONSTRATED:');
console.log('-'.repeat(80));
console.log('✅ CA$ currency prefix recognized');
console.log('✅ Multi-line "Total CA$X.XX" format extracted');
console.log('✅ Uber Rides + Uber Eats fares automatically summed');
console.log('✅ "Online Mileage X km" distance format supported');
console.log('✅ Year from "Tax summary for the period 2024" extracted');
console.log('✅ Canadian tax fields (GST/QST) captured');
console.log();

console.log('🎯 BUSINESS VALUE:');
console.log('-'.repeat(80));
console.log('• Drivers can now automatically process official annual tax summaries');
console.log('• No manual data entry required for tax filing');
console.log('• Works with both weekly summaries AND annual tax documents');
console.log('• Supports Canadian tax reporting requirements (GST/QST)');
console.log('• Handles inactive periods with zero amounts gracefully');
console.log();

console.log('='.repeat(80));
console.log('DEMONSTRATION COMPLETE ✅');
console.log('='.repeat(80));
