import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateMedicalExpenseCredit,
  trackMedicalExpensesByCategory,
  validateMedicalExpense,
} from '../medical-expense-calculator.js';

// Medical Expense Credit Tests
test('calculateMedicalExpenseCredit returns correct structure', () => {
  const result = calculateMedicalExpenseCredit(5000, 50000);
  assert.strictEqual(typeof result, 'object');
  assert.ok('totalExpenses' in result);
  assert.ok('netIncome' in result);
  assert.ok('threshold' in result);
  assert.ok('eligibleAmount' in result);
  assert.ok('federalCredit' in result);
  assert.ok('quebecCredit' in result);
  assert.ok('totalCredit' in result);
});

test('calculateMedicalExpenseCredit: example from problem statement', () => {
  // $5,000 expenses, $50,000 income
  // Threshold: 3% of $50,000 = $1,500
  // Eligible: $5,000 - $1,500 = $3,500
  // Federal: $3,500 × 15% = $525
  // Quebec: $3,500 × 20% = $700
  // Total: $1,225
  const result = calculateMedicalExpenseCredit(5000, 50000);
  assert.strictEqual(result.threshold, 1500);
  assert.strictEqual(result.eligibleAmount, 3500);
  assert.strictEqual(result.federalCredit, 525);
  assert.strictEqual(result.quebecCredit, 700);
  assert.strictEqual(result.totalCredit, 1225);
});

test('calculateMedicalExpenseCredit: threshold capped at $2,635', () => {
  // High income: $100,000, 3% = $3,000 but max is $2,635
  const result = calculateMedicalExpenseCredit(5000, 100000);
  assert.strictEqual(result.threshold, 2635);
  assert.strictEqual(result.eligibleAmount, 2365); // 5000 - 2635
});

test('calculateMedicalExpenseCredit: no credit when expenses below threshold', () => {
  const result = calculateMedicalExpenseCredit(1000, 50000);
  assert.strictEqual(result.eligibleAmount, 0);
  assert.strictEqual(result.federalCredit, 0);
  assert.strictEqual(result.quebecCredit, 0);
  assert.strictEqual(result.totalCredit, 0);
});

test('calculateMedicalExpenseCredit: low income uses percentage threshold', () => {
  // $30,000 income: 3% = $900 (less than $2,635)
  const result = calculateMedicalExpenseCredit(2000, 30000);
  assert.strictEqual(result.threshold, 900);
  assert.strictEqual(result.eligibleAmount, 1100); // 2000 - 900
});

// Track by Category Tests
test('trackMedicalExpensesByCategory groups expenses correctly', () => {
  const expenses = [
    { category: 'prescriptions', amount: 200, description: 'Medication' },
    { category: 'dental', amount: 500, description: 'Filling' },
    { category: 'prescriptions', amount: 150, description: 'More meds' },
    { category: 'vision', amount: 300, description: 'Glasses' },
  ];
  
  const result = trackMedicalExpensesByCategory(expenses);
  assert.strictEqual(result.categories.prescriptions.total, 350);
  assert.strictEqual(result.categories.dental.total, 500);
  assert.strictEqual(result.categories.vision.total, 300);
  assert.strictEqual(result.grandTotal, 1150);
});

test('trackMedicalExpensesByCategory handles unknown categories', () => {
  const expenses = [
    { category: 'unknown', amount: 100, description: 'Test' },
  ];
  
  const result = trackMedicalExpensesByCategory(expenses);
  assert.strictEqual(result.categories.other.total, 100);
});

test('trackMedicalExpensesByCategory handles missing category', () => {
  const expenses = [
    { amount: 100, description: 'No category' },
  ];
  
  const result = trackMedicalExpensesByCategory(expenses);
  assert.strictEqual(result.categories.other.total, 100);
});

// Validation Tests
test('validateMedicalExpense: valid expense passes', () => {
  const result = validateMedicalExpense(100, 'prescriptions', 'Medication');
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.errors.length, 0);
});

test('validateMedicalExpense: negative amount fails', () => {
  const result = validateMedicalExpense(-100, 'prescriptions', 'Medication');
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.length > 0);
});

test('validateMedicalExpense: invalid category fails', () => {
  const result = validateMedicalExpense(100, 'invalid', 'Test');
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.some(e => e.includes('category')));
});

test('validateMedicalExpense: missing description fails', () => {
  const result = validateMedicalExpense(100, 'prescriptions', '');
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.some(e => e.includes('Description')));
});
