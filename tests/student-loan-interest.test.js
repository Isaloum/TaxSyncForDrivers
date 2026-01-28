import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateStudentLoanInterestCredit,
  calculateWithCarryforward,
  optimizeClaimingStrategy,
  validateStudentLoanInterest,
  calculateLifetimeSavings,
  getProvincialProgramInfo,
} from '../student-loan-interest-calculator.js';

test('Student loan interest: $2,500 in Quebec', () => {
  const result = calculateStudentLoanInterestCredit(2500, 'QC');
  
  assert.strictEqual(result.interestPaid, 2500);
  
  // Federal: $2,500 × 15% = $375
  assert.strictEqual(result.federalCredit, 375);
  
  // Quebec: $2,500 × 20% = $500
  assert.strictEqual(result.provincialCredit, 500);
  
  // Total: $875
  assert.strictEqual(result.totalCredit, 875);
});

test('Student loan interest: $1,900 in Ontario', () => {
  const result = calculateStudentLoanInterestCredit(1900, 'ON');
  
  // Federal: $1,900 × 15% = $285
  assert.strictEqual(result.federalCredit, 285);
  
  // Ontario: $1,900 × 5.05% = $95.95
  assert.strictEqual(result.provincialCredit, 95.95);
  
  // Total: $380.95
  assert.strictEqual(result.totalCredit, 380.95);
});

test('Student loan interest: $3,000 in Alberta', () => {
  const result = calculateStudentLoanInterestCredit(3000, 'AB');
  
  // Federal: $450
  assert.strictEqual(result.federalCredit, 450);
  
  // Alberta: $3,000 × 10% = $300
  assert.strictEqual(result.provincialCredit, 300);
  
  // Total: $750
  assert.strictEqual(result.totalCredit, 750);
});

test('Student loan interest: Quebec has highest provincial rate', () => {
  const qcResult = calculateStudentLoanInterestCredit(1000, 'QC');
  const onResult = calculateStudentLoanInterestCredit(1000, 'ON');
  
  // Quebec 20% vs Ontario 5.05%
  assert.ok(qcResult.provincialCredit > onResult.provincialCredit);
  assert.strictEqual(qcResult.provincialCredit, 200);
});

test('Student loan interest: zero interest returns zero credits', () => {
  const result = calculateStudentLoanInterestCredit(0, 'QC');
  
  assert.strictEqual(result.interestPaid, 0);
  assert.strictEqual(result.federalCredit, 0);
  assert.strictEqual(result.totalCredit, 0);
});

test('Student loan interest: all provinces have rates', () => {
  const provinces = ['QC', 'ON', 'AB', 'BC', 'MB', 'SK', 'NS', 'NB', 'PE', 'NL', 'YT', 'NT', 'NU'];
  
  for (const province of provinces) {
    const result = calculateStudentLoanInterestCredit(1000, province);
    assert.ok(result.provincialCredit > 0);
    assert.strictEqual(result.province, province);
  }
});

test('Carryforward: current year + 2 previous years', () => {
  const carryforward = [
    { year: 2025, amount: 500 },
    { year: 2024, amount: 300 },
  ];
  
  const result = calculateWithCarryforward(2000, carryforward, 'QC');
  
  assert.strictEqual(result.currentYearInterest, 2000);
  assert.strictEqual(result.carryforwardInterest, 800);
  assert.strictEqual(result.totalInterest, 2800);
  
  // Total credit on $2,800 in Quebec
  // Federal: $2,800 × 15% = $420
  // Quebec: $2,800 × 20% = $560
  // Total: $980
  assert.strictEqual(result.totalCredit, 980);
});

test('Carryforward: filters out amounts older than 5 years', () => {
  const carryforward = [
    { year: 2025, amount: 500 },   // Valid (1 year old)
    { year: 2021, amount: 1000 },  // Valid (5 years old)
    { year: 2020, amount: 300 },   // Invalid (6 years old - expired!)
  ];
  
  const result = calculateWithCarryforward(2000, carryforward, 'QC');
  
  // Should only include 2025 and 2021
  assert.strictEqual(result.carryforwardInterest, 1500);
  assert.strictEqual(result.totalInterest, 3500);
  assert.strictEqual(result.carryforwardBreakdown.length, 2);
});

test('Optimize strategy: low income - carry forward', () => {
  const result = optimizeClaimingStrategy(2000, 28000, 500, 50000, 'QC');
  
  assert.strictEqual(result.recommendation, 'carry-forward');
  assert.ok(result.reasoning.some(r => r.includes('low')));
});

test('Optimize strategy: good income - claim now', () => {
  const result = optimizeClaimingStrategy(2000, 55000, 8000, null, 'QC');
  
  assert.strictEqual(result.recommendation, 'claim-now');
  assert.ok(result.reasoning.some(r => r.includes('sufficient')));
});

test('Optimize strategy: tax owing less than credit - carry forward', () => {
  const result = optimizeClaimingStrategy(5000, 40000, 500, null, 'QC');
  
  // Credit would be ~$1,750, but tax owing only $500
  assert.strictEqual(result.recommendation, 'carry-forward');
  assert.ok(result.wastedIfClaimNow > 0);
});

test('Optimize strategy: expecting income increase - carry forward', () => {
  const result = optimizeClaimingStrategy(2000, 35000, 2000, 60000, 'QC');
  
  // 60k is >30% higher than 35k
  assert.strictEqual(result.recommendation, 'carry-forward');
  assert.ok(result.reasoning.some(r => r.includes('increase')));
});

test('Validate: government loan is valid', () => {
  const result = validateStudentLoanInterest('Canada Student Loan', true, 2000);
  
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.errors.length, 0);
});

test('Validate: bank loan is NOT valid', () => {
  const result = validateStudentLoanInterest('Bank Loan', false, 2000);
  
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.some(e => e.includes('government')));
});

test('Validate: negative interest fails', () => {
  const result = validateStudentLoanInterest('Canada Student Loan', true, -100);
  
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.some(e => e.includes('negative')));
});

test('Lifetime savings: $35,000 loan at 5.5% over 10 years (Quebec)', () => {
  const result = calculateLifetimeSavings(35000, 0.055, 10, 'QC');
  
  assert.strictEqual(result.loanBalance, 35000);
  assert.strictEqual(result.yearsToRepay, 10);
  assert.ok(result.monthlyPayment > 375 && result.monthlyPayment < 385);
  assert.ok(result.totalInterestPaid > 10000 && result.totalInterestPaid < 12000);
  assert.ok(result.lifetimeTaxSavings > 3500 && result.lifetimeTaxSavings < 4500);
});

test('Lifetime savings: $120,000 medical school loan (Ontario)', () => {
  const result = calculateLifetimeSavings(120000, 0.055, 10, 'ON');
  
  assert.strictEqual(result.loanBalance, 120000);
  assert.ok(result.totalInterestPaid > 35000);
  assert.ok(result.lifetimeTaxSavings > 7000); // Significant savings!
});

test('Provincial program info: Quebec has AFE', () => {
  const result = getProvincialProgramInfo('QC');
  
  assert.strictEqual(result.province, 'QC');
  assert.ok(result.programName.includes('AFE'));
  assert.strictEqual(result.provincialCreditRate, 20);
  assert.strictEqual(result.federalCreditRate, 15);
  assert.strictEqual(result.combinedRate, 35);
});

test('Provincial program info: Ontario has OSAP', () => {
  const result = getProvincialProgramInfo('ON');
  
  assert.ok(result.programName.includes('OSAP'));
  // Use approximate equality for floating point
  assert.ok(Math.abs(result.provincialCreditRate - 5.05) < 0.01);
});

test('Provincial program info: all provinces have programs', () => {
  const provinces = ['QC', 'ON', 'AB', 'BC', 'MB', 'SK', 'NS', 'NB', 'PE', 'NL', 'YT', 'NT', 'NU'];
  
  for (const province of provinces) {
    const result = getProvincialProgramInfo(province);
    assert.ok(result.programName.length > 0);
    assert.ok(result.combinedRate > 15);
  }
});
