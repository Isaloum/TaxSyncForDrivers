import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CHILDCARE_LIMITS_2026,
  calculateChildcareDeduction,
  validateChildcareProvider,
  validateChild,
  calculateMaximumDeduction,
} from '../childcare-expense-calculator.js';

// Childcare Deduction Tests
test('calculateChildcareDeduction returns correct structure', () => {
  const children = [{ age: 5, disabled: false }];
  const result = calculateChildcareDeduction(children, 5000, 40000);
  assert.strictEqual(typeof result, 'object');
  assert.ok('totalExpenses' in result);
  assert.ok('earnedIncome' in result);
  assert.ok('numberOfChildren' in result);
  assert.ok('perChildLimit' in result);
  assert.ok('earnedIncomeLimit' in result);
  assert.ok('eligibleDeduction' in result);
});

test('calculateChildcareDeduction: example from problem statement', () => {
  // 2 kids (ages 5, 9), $10,000 expenses
  // Limits: $8,000 (under 7) + $5,000 (7-16) = $13,000
  // Expenses: $10,000 (within limits)
  // Deduction: $10,000
  const children = [
    { age: 5, disabled: false },
    { age: 9, disabled: false },
  ];
  const result = calculateChildcareDeduction(children, 10000, 50000);
  assert.strictEqual(result.numberOfChildren, 2);
  assert.strictEqual(result.perChildLimit, 13000);
  assert.strictEqual(result.eligibleDeduction, 10000);
});

test('calculateChildcareDeduction: limited by per-child limit', () => {
  const children = [{ age: 5, disabled: false }];
  // Child under 7: $8,000 limit
  // Expenses: $10,000
  // Should be limited to $8,000
  const result = calculateChildcareDeduction(children, 10000, 50000);
  assert.strictEqual(result.perChildLimit, 8000);
  assert.strictEqual(result.eligibleDeduction, 8000);
  assert.strictEqual(result.limitingFactor, 'per_child');
});

test('calculateChildcareDeduction: limited by earned income', () => {
  const children = [{ age: 5, disabled: false }];
  // Earned income: $10,000
  // 2/3 of earned income: $6,666.67
  // Per-child limit: $8,000
  // Should be limited to $6,666.67
  const result = calculateChildcareDeduction(children, 8000, 10000);
  assert.strictEqual(result.earnedIncomeLimit, 6666.67);
  assert.strictEqual(result.eligibleDeduction, 6666.67);
  assert.strictEqual(result.limitingFactor, 'earned_income');
});

test('calculateChildcareDeduction: disabled child has higher limit', () => {
  const children = [{ age: 8, disabled: true }];
  const result = calculateChildcareDeduction(children, 11000, 50000);
  assert.strictEqual(result.perChildLimit, 11000);
  assert.strictEqual(result.childLimits[0].limit, 11000);
});

test('calculateChildcareDeduction: age-based limits', () => {
  const children = [
    { age: 5, disabled: false },  // Under 7: $8,000
    { age: 10, disabled: false }, // 7-16: $5,000
  ];
  const result = calculateChildcareDeduction(children, 15000, 50000);
  assert.strictEqual(result.perChildLimit, 13000);
  assert.strictEqual(result.childLimits[0].limit, 8000);
  assert.strictEqual(result.childLimits[1].limit, 5000);
});

test('calculateChildcareDeduction: limited by actual expenses', () => {
  const children = [{ age: 5, disabled: false }];
  // Per-child limit: $8,000
  // Actual expenses: $5,000
  // Should use actual expenses
  const result = calculateChildcareDeduction(children, 5000, 50000);
  assert.strictEqual(result.eligibleDeduction, 5000);
  assert.strictEqual(result.limitingFactor, 'expenses');
});

// Provider Validation Tests
test('validateChildcareProvider: valid SIN passes', () => {
  const result = validateChildcareProvider('123456789', 'Jane Doe');
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.errors.length, 0);
});

test('validateChildcareProvider: valid BN passes', () => {
  const result = validateChildcareProvider('123456789RC0001', 'ABC Daycare');
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.errors.length, 0);
});

test('validateChildcareProvider: SIN with spaces/hyphens passes', () => {
  const result = validateChildcareProvider('123-456-789', 'Jane Doe');
  assert.strictEqual(result.isValid, true);
});

test('validateChildcareProvider: invalid format fails', () => {
  const result = validateChildcareProvider('12345', 'Jane Doe');
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.some(e => e.includes('Invalid')));
});

test('validateChildcareProvider: missing name fails', () => {
  const result = validateChildcareProvider('123456789', '');
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.some(e => e.includes('name')));
});

test('validateChildcareProvider: missing SIN/BN fails', () => {
  const result = validateChildcareProvider('', 'Jane Doe');
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.some(e => e.includes('SIN')));
});

// Child Validation Tests
test('validateChild: valid child passes', () => {
  const result = validateChild(5, false);
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.errors.length, 0);
});

test('validateChild: disabled child over 16 passes', () => {
  const result = validateChild(17, true);
  assert.strictEqual(result.isValid, true);
});

test('validateChild: child over 16 without disability fails', () => {
  const result = validateChild(17, false);
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.length > 0);
});

test('validateChild: negative age fails', () => {
  const result = validateChild(-1, false);
  assert.strictEqual(result.isValid, false);
});

// Maximum Deduction Tests
test('calculateMaximumDeduction: returns correct maximum', () => {
  const children = [{ age: 5, disabled: false }];
  const result = calculateMaximumDeduction(children, 50000);
  assert.strictEqual(result.maxDeduction, 8000);
  assert.strictEqual(result.limitedBy, 'per_child');
});

test('calculateMaximumDeduction: limited by earned income', () => {
  const children = [{ age: 5, disabled: false }];
  const result = calculateMaximumDeduction(children, 10000);
  // 2/3 of $10,000 = $6,666.67
  assert.strictEqual(result.maxDeduction, 6666.67);
  assert.strictEqual(result.limitedBy, 'earned_income');
});

// Constants Tests
test('CHILDCARE_LIMITS_2026: has correct values', () => {
  assert.strictEqual(CHILDCARE_LIMITS_2026.UNDER_7, 8000);
  assert.strictEqual(CHILDCARE_LIMITS_2026.AGE_7_TO_16, 5000);
  assert.strictEqual(CHILDCARE_LIMITS_2026.DISABLED, 11000);
});
