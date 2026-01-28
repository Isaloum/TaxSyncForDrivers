import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateUnionDuesCredit,
  calculateHomeBuyersAmount,
  validateUnionDues,
  validateHomeBuyersEligibility,
  calculateHBPRepayment,
  extractUnionDuesFromT4,
} from '../employment-credits-calculator.js';

// UNION DUES TESTS
test('Union dues: $800 in Quebec', () => {
  const result = calculateUnionDuesCredit(800, 'QC');
  
  assert.strictEqual(result.duesPaid, 800);
  
  // Federal: $800 × 15% = $120
  assert.strictEqual(result.federalCredit, 120);
  
  // Quebec: $800 × 14% = $112
  assert.strictEqual(result.provincialCredit, 112);
  
  // Total: $232
  assert.strictEqual(result.totalCredit, 232);
});

test('Union dues: $1,200 in Ontario', () => {
  const result = calculateUnionDuesCredit(1200, 'ON');
  
  // Federal: $1,200 × 15% = $180
  assert.strictEqual(result.federalCredit, 180);
  
  // Ontario: $1,200 × 5.05% = $60.60
  assert.strictEqual(result.provincialCredit, 60.6);
  
  // Total: $240.60
  assert.strictEqual(result.totalCredit, 240.6);
});

test('Union dues: $500 in Alberta', () => {
  const result = calculateUnionDuesCredit(500, 'AB');
  
  // Federal: $75
  assert.strictEqual(result.federalCredit, 75);
  
  // Alberta: $500 × 10% = $50
  assert.strictEqual(result.provincialCredit, 50);
  
  // Total: $125
  assert.strictEqual(result.totalCredit, 125);
});

test('Union dues: zero dues returns zero credits', () => {
  const result = calculateUnionDuesCredit(0, 'QC');
  
  assert.strictEqual(result.duesPaid, 0);
  assert.strictEqual(result.federalCredit, 0);
  assert.strictEqual(result.totalCredit, 0);
});

test('Union dues: all provinces have rates defined', () => {
  const provinces = ['QC', 'ON', 'AB', 'BC', 'MB', 'SK', 'NS', 'NB', 'PE', 'NL', 'YT', 'NT', 'NU'];
  
  for (const province of provinces) {
    const result = calculateUnionDuesCredit(1000, province);
    assert.ok(result.provincialCredit > 0);
    assert.strictEqual(result.province, province);
  }
});

test('Validate union dues: valid dues pass', () => {
  const result = validateUnionDues(800, true, false);
  
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.errors.length, 0);
});

test('Validate union dues: reimbursed dues fail', () => {
  const result = validateUnionDues(800, true, true);
  
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.some(e => e.includes('Reimbursed')));
});

test('Validate union dues: not required for employment fails', () => {
  const result = validateUnionDues(800, false, false);
  
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.some(e => e.includes('required for employment')));
});

test('Extract union dues from T4 slip', () => {
  const t4Slip = {
    box44_union_dues: '850.00',
  };
  
  const result = extractUnionDuesFromT4(t4Slip);
  assert.strictEqual(result, 850);
});

// HOME BUYERS' AMOUNT TESTS
test('Home buyers: First-time buyer in Ontario', () => {
  const result = calculateHomeBuyersAmount(true, 'ON', false, false);
  
  assert.strictEqual(result.eligible, true);
  assert.strictEqual(result.federalCredit, 1500);
  assert.strictEqual(result.provincialRebate, 4000);
  assert.strictEqual(result.totalBenefit, 5500);
  assert.strictEqual(result.province, 'ON');
});

test('Home buyers: First-time buyer in BC', () => {
  const result = calculateHomeBuyersAmount(true, 'BC', false, false);
  
  assert.strictEqual(result.federalCredit, 1500);
  assert.strictEqual(result.provincialRebate, 8000);
  assert.strictEqual(result.totalBenefit, 9500);
});

test('Home buyers: First-time buyer in Quebec (federal only)', () => {
  const result = calculateHomeBuyersAmount(true, 'QC', false, false);
  
  assert.strictEqual(result.federalCredit, 1500);
  assert.strictEqual(result.provincialRebate, 0);
  assert.strictEqual(result.totalBenefit, 1500);
});

test('Home buyers: Not first-time buyer', () => {
  const result = calculateHomeBuyersAmount(false, 'ON', false, false);
  
  assert.strictEqual(result.eligible, false);
  assert.ok(result.reason.includes('Not a first-time'));
  assert.strictEqual(result.federalCredit, 0);
});

test('Home buyers: Using RRSP HBP (single)', () => {
  const result = calculateHomeBuyersAmount(true, 'ON', true, false);
  
  assert.strictEqual(result.eligible, true);
  assert.ok(result.rrspHBP);
  assert.strictEqual(result.rrspHBP.maxWithdrawal, 60000);
  assert.strictEqual(result.rrspHBP.repaymentPeriod, 15);
});

test('Home buyers: Using RRSP HBP (couple)', () => {
  const result = calculateHomeBuyersAmount(true, 'ON', true, true);
  
  assert.strictEqual(result.rrspHBP.maxWithdrawal, 120000); // Both can withdraw
});

test('Validate home buyers: eligible first-time buyer', () => {
  const result = validateHomeBuyersEligibility(false, false, true, true);
  
  assert.strictEqual(result.isEligible, true);
  assert.strictEqual(result.errors.length, 0);
  assert.strictEqual(result.eligibilityType, 'first-time-buyer');
});

test('Validate home buyers: owned in past 4 years', () => {
  const result = validateHomeBuyersEligibility(true, false, true, true);
  
  assert.strictEqual(result.isEligible, false);
  assert.ok(result.errors.some(e => e.includes('past 4 years')));
});

test('Validate home buyers: spouse owned in past 4 years', () => {
  const result = validateHomeBuyersEligibility(false, true, true, true);
  
  assert.strictEqual(result.isEligible, false);
  assert.ok(result.errors.some(e => e.includes('spouse')));
});

test('Validate home buyers: home not in Canada', () => {
  const result = validateHomeBuyersEligibility(false, false, false, true);
  
  assert.strictEqual(result.isEligible, false);
  assert.ok(result.errors.some(e => e.includes('Canada')));
});

test('RRSP HBP repayment: $60,000 withdrawal', () => {
  const result = calculateHBPRepayment(60000);
  
  assert.strictEqual(result.withdrawalAmount, 60000);
  assert.strictEqual(result.repaymentPeriod, 15);
  assert.strictEqual(result.annualRepayment, 4000);
  assert.strictEqual(result.monthlyRepayment, 333.33);
  assert.strictEqual(result.interestCost, 0); // Interest-free!
});

test('RRSP HBP repayment: $35,000 withdrawal', () => {
  const result = calculateHBPRepayment(35000);
  
  assert.strictEqual(result.annualRepayment, 2333.33);
  assert.strictEqual(result.totalRepayment, 35000);
});
