import { test } from 'node:test';
import assert from 'node:assert/strict';
import DocumentAutomation from '../document-automation.js';

// Document Classification Tests
test('classifyDocument: detects T4 format', () => {
  const text = 'Statement of Remuneration Paid T4 Employment Income Box 14';
  const result = DocumentAutomation.classifyDocument(text);
  assert.strictEqual(result.type, 'T4');
  assert.ok(result.confidence > 0);
});

test('classifyDocument: detects RL-1 format', () => {
  const text = 'RL-1 Relevé 1 Box A Employment income QPP';
  const result = DocumentAutomation.classifyDocument(text);
  assert.strictEqual(result.type, 'RL1');
  assert.ok(result.confidence > 0);
});

test('classifyDocument: detects Uber summary', () => {
  const text = 'Uber Weekly Summary Driver Partner Trip Earnings';
  const result = DocumentAutomation.classifyDocument(text);
  assert.strictEqual(result.type, 'UBER_SUMMARY');
  assert.ok(result.confidence > 0);
});

test('classifyDocument: detects gas receipt', () => {
  const text = 'Shell Gasoline Fuel Total $45.67';
  const result = DocumentAutomation.classifyDocument(text);
  assert.strictEqual(result.type, 'GAS_RECEIPT');
});

test('classifyDocument: returns UNKNOWN for unrecognizable text', () => {
  const text = 'Random text with no patterns';
  const result = DocumentAutomation.classifyDocument(text);
  assert.strictEqual(result.type, 'UNKNOWN');
  assert.strictEqual(result.confidence, 0);
});

test('classifyDocument: handles empty text', () => {
  const result = DocumentAutomation.classifyDocument('');
  assert.strictEqual(result.type, 'UNKNOWN');
  assert.strictEqual(result.confidence, 0);
});

// Data Extraction Tests - T4
test('extractDocumentData: extracts T4 employment income', () => {
  const text = 'Box 14: Employment income $50,000.00';
  const result = DocumentAutomation.extractDocumentData(text, 'T4');
  assert.ok(result.success);
  assert.strictEqual(result.data.income, 50000);
});

test('extractDocumentData: extracts T4 tax deducted', () => {
  const text = 'Box 22: Income tax deducted $8,500.00';
  const result = DocumentAutomation.extractDocumentData(text, 'T4');
  assert.ok(result.success);
  assert.strictEqual(result.data.taxDeducted, 8500);
});

test('extractDocumentData: extracts T4 employer name', () => {
  const text = 'Employer: ABC Transportation Inc.';
  const result = DocumentAutomation.extractDocumentData(text, 'T4');
  assert.ok(result.success);
  assert.ok(result.data.employer.includes('ABC Transportation'));
});

// Data Extraction Tests - RL-1
test('extractDocumentData: extracts RL-1 employment income', () => {
  const text = 'Case A: $45,000.00';
  const result = DocumentAutomation.extractDocumentData(text, 'RL1');
  assert.ok(result.success);
  assert.strictEqual(result.data.income, 45000);
});

test('extractDocumentData: extracts RL-1 QPP contributions', () => {
  const text = 'Box B.A: QPP $3,500.00';
  const result = DocumentAutomation.extractDocumentData(text, 'RL1');
  assert.ok(result.success);
  assert.strictEqual(result.data.qpp, 3500);
});

test('extractDocumentData: extracts RL-1 EI premiums', () => {
  const text = 'Box C: EI $950.00';
  const result = DocumentAutomation.extractDocumentData(text, 'RL1');
  assert.ok(result.success);
  assert.strictEqual(result.data.ei, 950);
});

// Data Extraction Tests - Uber/Lyft
test('extractDocumentData: extracts Uber gross earnings', () => {
  const text = 'Gross earnings: $1,250.50';
  const result = DocumentAutomation.extractDocumentData(text, 'UBER_SUMMARY');
  assert.ok(result.success);
  assert.strictEqual(result.data.grossEarnings, 1250.5);
});

test('extractDocumentData: extracts Uber trips count', () => {
  const text = '78 trips completed this week';
  const result = DocumentAutomation.extractDocumentData(text, 'UBER_SUMMARY');
  assert.ok(result.success);
  assert.strictEqual(result.data.trips, 78);
});

test('extractDocumentData: extracts Lyft distance', () => {
  const text = 'Distance driven: 450.5 km';
  const result = DocumentAutomation.extractDocumentData(text, 'LYFT_SUMMARY');
  assert.ok(result.success);
  assert.ok(result.data.distance);
});

// Data Extraction Tests - Gas Receipt
test('extractDocumentData: extracts gas receipt amount', () => {
  const text = 'Total: $67.45';
  const result = DocumentAutomation.extractDocumentData(text, 'GAS_RECEIPT');
  assert.ok(result.success);
  assert.strictEqual(result.data.amount, 67.45);
});

test('extractDocumentData: extracts gas station name', () => {
  const text = 'Shell Canada Total: $45.00';
  const result = DocumentAutomation.extractDocumentData(text, 'GAS_RECEIPT');
  assert.ok(result.success);
  assert.ok(result.data.station.includes('Shell'));
});

test('extractDocumentData: extracts date from receipt', () => {
  const text = 'Date: 01/15/2025 Total: $50.00';
  const result = DocumentAutomation.extractDocumentData(text, 'GAS_RECEIPT');
  assert.ok(result.success);
  assert.ok(result.data.date);
});

// Data Extraction Tests - Maintenance
test('extractDocumentData: extracts maintenance service type', () => {
  const text = 'Oil Change Total: $89.99';
  const result = DocumentAutomation.extractDocumentData(text, 'MAINTENANCE');
  assert.ok(result.success);
  assert.ok(result.data.serviceType.includes('Oil Change'));
});

test('extractDocumentData: extracts maintenance amount', () => {
  const text = 'Brake Service Total: $450.00';
  const result = DocumentAutomation.extractDocumentData(text, 'MAINTENANCE');
  assert.ok(result.success);
  assert.strictEqual(result.data.amount, 450);
});

// Categorization Tests
test('categorizeExpense: categorizes gas receipt correctly', () => {
  const documentData = {
    type: 'GAS_RECEIPT',
    data: { amount: 50, station: 'Shell', date: '2025-01-15' },
  };
  const result = DocumentAutomation.categorizeExpense(documentData);
  assert.strictEqual(result.category, 'vehicle_fuel');
  assert.strictEqual(result.type, 'expense');
  assert.strictEqual(result.businessPercent, 80);
  assert.strictEqual(result.deductibleAmount, 40); // 50 * 0.8
  assert.ok(result.description.includes('Shell'));
});

test('categorizeExpense: categorizes maintenance with 100% business use', () => {
  const documentData = {
    type: 'MAINTENANCE',
    data: { amount: 200, serviceType: 'Oil Change', date: '2025-01-15' },
  };
  const result = DocumentAutomation.categorizeExpense(documentData);
  assert.strictEqual(result.category, 'vehicle_maintenance');
  assert.strictEqual(result.businessPercent, 100);
  assert.strictEqual(result.deductibleAmount, 200);
  assert.ok(result.description.includes('Oil Change'));
});

test('categorizeExpense: categorizes phone bill with 30% business use', () => {
  const documentData = {
    type: 'PHONE_BILL',
    data: { monthlyCost: 100 },
  };
  const result = DocumentAutomation.categorizeExpense(documentData);
  assert.strictEqual(result.category, 'communication');
  assert.strictEqual(result.businessPercent, 30);
  assert.strictEqual(result.deductibleAmount, 30); // 100 * 0.3
});

test('categorizeExpense: categorizes Uber income', () => {
  const documentData = {
    type: 'UBER_SUMMARY',
    data: { grossEarnings: 1000, tips: 150, fees: 200, trips: 50 },
  };
  const result = DocumentAutomation.categorizeExpense(documentData);
  assert.strictEqual(result.category, 'rideshare_income');
  assert.strictEqual(result.type, 'income');
  assert.strictEqual(result.source, 'Uber');
  assert.strictEqual(result.amount, 1150); // Total income: grossEarnings + tips + tolls
  assert.strictEqual(result.grossFares, 1000);
  assert.strictEqual(result.tips, 150);
  assert.strictEqual(result.fees, 200);
  assert.strictEqual(result.serviceFees, 200);
  assert.strictEqual(result.netIncome, 950); // 1000 + 150 + 0 - 200
});

test('categorizeExpense: categorizes T4 employment income', () => {
  const documentData = {
    type: 'T4',
    data: { income: 50000, taxDeducted: 8500, employer: 'ABC Corp' },
  };
  const result = DocumentAutomation.categorizeExpense(documentData);
  assert.strictEqual(result.category, 'employment_income');
  assert.strictEqual(result.type, 'income');
  assert.strictEqual(result.amount, 50000);
  assert.strictEqual(result.taxDeducted, 8500);
  assert.ok(result.description.includes('ABC Corp'));
});

// Validation Tests
test('validateExtractedData: warns on large gas expense', () => {
  const data = { amount: 1500 };
  const warnings = DocumentAutomation.validateExtractedData(data, 'GAS_RECEIPT');
  assert.ok(warnings.length > 0);
  assert.ok(warnings[0].includes('Large expense'));
});

test('validateExtractedData: warns on very large maintenance', () => {
  const data = { amount: 15000 };
  const warnings = DocumentAutomation.validateExtractedData(data, 'MAINTENANCE');
  assert.ok(warnings.length > 0);
  assert.ok(warnings[0].includes('Very large'));
});

test('validateExtractedData: warns on missing amount', () => {
  const data = { station: 'Shell' };
  const warnings = DocumentAutomation.validateExtractedData(data, 'GAS_RECEIPT');
  assert.ok(warnings.length > 0);
  assert.ok(warnings.some((w) => w.includes('No amount')));
});

test('validateExtractedData: no warnings for valid data', () => {
  const data = { amount: 50, date: '2025-01-01' };
  const warnings = DocumentAutomation.validateExtractedData(data, 'GAS_RECEIPT');
  assert.strictEqual(warnings.length, 0);
});

// End-to-end Process Tests
test('processDocument: successfully processes T4 document', () => {
  const text = `
    Statement of Remuneration Paid
    T4 - 2024
    Employer: ABC Transportation Inc.
    Box 14: Employment income $52,000.00
    Box 22: Income tax deducted $9,500.00
  `;
  const result = DocumentAutomation.processDocument(text);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.type, 'T4');
  assert.ok(result.confidence > 0);
  assert.strictEqual(result.data.income, 52000);
  assert.strictEqual(result.data.taxDeducted, 9500);
  assert.strictEqual(result.category.type, 'income');
});

test('processDocument: successfully processes Uber summary', () => {
  const text = `
    Uber Weekly Summary
    Driver Partner
    Gross earnings: $1,450.00
    Tips: $220.00
    Uber fee: $290.00
    78 trips completed
  `;
  const result = DocumentAutomation.processDocument(text);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.type, 'UBER_SUMMARY');
  assert.strictEqual(result.data.grossEarnings, 1450);
  assert.strictEqual(result.data.tips, 220);
  assert.strictEqual(result.category.source, 'Uber');
});

test('processDocument: successfully processes gas receipt', () => {
  const text = `
    Shell
    Gasoline - Regular
    Total: $67.45
    Date: 01/15/2025
  `;
  const result = DocumentAutomation.processDocument(text);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.type, 'GAS_RECEIPT');
  assert.strictEqual(result.data.amount, 67.45);
  assert.strictEqual(result.category.category, 'vehicle_fuel');
  assert.ok(result.category.taxSavings);
});

test('processDocument: fails on empty text', () => {
  const result = DocumentAutomation.processDocument('');
  assert.strictEqual(result.success, false);
  assert.ok(result.error);
});

test('processDocument: fails on unrecognizable document', () => {
  const result = DocumentAutomation.processDocument('Random text with no meaningful content');
  assert.strictEqual(result.success, false);
  assert.ok(result.error.includes('classify'));
});

// Confidence Calculation Tests
test('calculateConfidence: returns proper confidence score', () => {
  const extractedData = {
    data: { amount: 50, station: 'Shell', date: '2025-01-15' },
    totalFields: 5,
  };
  const confidence = DocumentAutomation.calculateConfidence(extractedData);
  assert.ok(confidence > 0);
  assert.ok(confidence <= 100);
});

test('calculateConfidence: returns 0 for empty data', () => {
  const extractedData = { data: {}, totalFields: 5 };
  const confidence = DocumentAutomation.calculateConfidence(extractedData);
  assert.strictEqual(confidence, 0);
});

// Edge Cases
test('processDocument: handles documents with special characters', () => {
  const text = 'Shell™ Total: $45.67 @ 123 Main St.';
  const result = DocumentAutomation.processDocument(text);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.type, 'GAS_RECEIPT');
});

test('processDocument: handles RL-1 with French text', () => {
  const text = `
    RL-1 Relevé 1
    Case A: Revenu d'emploi $48,000.00
    Case B.A: RRQ $3,200.00
  `;
  const result = DocumentAutomation.processDocument(text);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.type, 'RL1');
  assert.strictEqual(result.data.income, 48000);
});

test('categorizeExpense: handles insurance with custom business use', () => {
  const documentData = {
    type: 'INSURANCE',
    data: { amount: 2000, businessUse: 75 },
  };
  const result = DocumentAutomation.categorizeExpense(documentData);
  assert.strictEqual(result.category, 'vehicle_insurance');
  assert.strictEqual(result.businessPercent, 75);
  assert.strictEqual(result.deductibleAmount, 1500); // 2000 * 0.75
});

test('processDocument: handles Lyft summary', () => {
  const text = `
    Lyft Weekly Summary
    Ride Earnings: $980.00
    Tips: $145.00
    Service fee: $196.00
    52 rides completed
  `;
  const result = DocumentAutomation.processDocument(text);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.type, 'LYFT_SUMMARY');
  assert.strictEqual(result.category.source, 'Lyft');
});

test('processDocument: handles taxi statement', () => {
  const text = `
    Taxi Company Statement
    Gross income: $3,500.00
    Lease fee: $800.00
    Driver payment: $2,700.00
  `;
  const result = DocumentAutomation.processDocument(text);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.type, 'TAXI_STATEMENT');
  assert.strictEqual(result.data.grossIncome, 3500);
});

test('processDocument: extracts Uber document with "Gross fares" pattern', () => {
  const text = `
UBER RIDES – GROSS FARES BREAKDOWN
This section indicates the fees you have charged to Riders. 
Gross fares:  $1,250.00
Rider fees and surcharges (tolls, airport fees, etc.): $0.00
Total GROSS FARES: $1,250.00
Online Mileage: 450 km
Trip count: 75 trips
  `;
  const result = DocumentAutomation.processDocument(text);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.type, 'UBER_SUMMARY');
  assert.ok(result.data.grossFares, 'grossFares should be extracted');
  assert.strictEqual(result.data.grossFares, 1250);
  assert.strictEqual(result.data.distance, 450);
  assert.strictEqual(result.data.trips, 75);
  assert.strictEqual(result.category.amount, 1250);
  assert.strictEqual(result.category.type, 'income');
  assert.strictEqual(result.category.category, 'rideshare_income');
  assert.strictEqual(result.warnings.length, 0, 'Should have no warnings');
});
