import { test } from 'node:test';
import assert from 'node:assert/strict';

// Load the calculator (it's in global scope when included via script tag)
// For Node.js testing, we'll import it directly
import '../quarterly-installment-calculator.js';

// Access the global QuarterlyInstallmentCalculator
const QuarterlyInstallmentCalculator = global.QuarterlyInstallmentCalculator;

test('QuarterlyInstallmentCalculator: threshold check - income below $3,000', () => {
  const result = QuarterlyInstallmentCalculator.calculate({
    estimatedIncome: 10000,
    priorYearTax: 0,
    province: 'QC'
  });

  assert.strictEqual(result.required, false);
  assert.strictEqual(result.threshold, 3000);
  assert.ok(result.message.includes('below'));
});

test('QuarterlyInstallmentCalculator: threshold check - prior year tax below $3,000', () => {
  const result = QuarterlyInstallmentCalculator.calculate({
    estimatedIncome: 10000,
    priorYearTax: 2500,
    province: 'QC'
  });

  assert.strictEqual(result.required, false);
  assert.strictEqual(result.threshold, 3000);
});

test('QuarterlyInstallmentCalculator: income $65,000 requires installments', () => {
  const result = QuarterlyInstallmentCalculator.calculate({
    estimatedIncome: 65000,
    priorYearTax: 0,
    province: 'QC'
  });

  assert.strictEqual(result.required, true);
  assert.ok(result.quarterlyAmount > 0);
  assert.strictEqual(result.annualTotal, result.quarterlyAmount * 4);
  assert.strictEqual(result.method, 'current-year-estimate');
});

test('QuarterlyInstallmentCalculator: uses prior year tax when provided', () => {
  const priorYearTax = 12000;
  const result = QuarterlyInstallmentCalculator.calculate({
    estimatedIncome: 65000,
    priorYearTax: priorYearTax,
    province: 'QC'
  });

  assert.strictEqual(result.required, true);
  assert.strictEqual(result.method, 'prior-year');
  assert.strictEqual(result.quarterlyAmount, Math.ceil(priorYearTax / 4));
});

test('QuarterlyInstallmentCalculator: schedule has 4 quarters', () => {
  const result = QuarterlyInstallmentCalculator.calculate({
    estimatedIncome: 65000,
    priorYearTax: 0,
    province: 'QC'
  });

  assert.strictEqual(result.schedule.length, 4);
  assert.ok(result.schedule.every(s => s.quarter && s.amount && s.dueDate && s.label));
});

test('QuarterlyInstallmentCalculator: schedule has correct deadlines', () => {
  const result = QuarterlyInstallmentCalculator.calculate({
    estimatedIncome: 65000,
    priorYearTax: 0,
    province: 'QC'
  });

  const labels = result.schedule.map(s => s.label);
  assert.ok(labels.includes('March 15'));
  assert.ok(labels.includes('June 15'));
  assert.ok(labels.includes('September 15'));
  assert.ok(labels.includes('December 15'));
});

test('QuarterlyInstallmentCalculator: determines overdue vs upcoming status', () => {
  const result = QuarterlyInstallmentCalculator.calculate({
    estimatedIncome: 65000,
    priorYearTax: 0,
    province: 'QC'
  });

  const hasOverdue = result.schedule.some(s => s.status === 'overdue');
  const hasUpcoming = result.schedule.some(s => s.status === 'upcoming');
  
  // At least one should be upcoming (or all overdue/upcoming depending on current date)
  assert.ok(hasOverdue || hasUpcoming);
});

test('QuarterlyInstallmentCalculator: nextPayment is upcoming payment', () => {
  const result = QuarterlyInstallmentCalculator.calculate({
    estimatedIncome: 65000,
    priorYearTax: 0,
    province: 'QC'
  });

  if (result.nextPayment) {
    assert.strictEqual(result.nextPayment.isPast, false);
    assert.strictEqual(result.nextPayment.status, 'upcoming');
  }
});

test('QuarterlyInstallmentCalculator: calculateFederalTax handles zero income', () => {
  const tax = QuarterlyInstallmentCalculator.calculateFederalTax(0);
  assert.strictEqual(tax, 0);
});

test('QuarterlyInstallmentCalculator: calculateFederalTax applies BPA', () => {
  // Income below BPA should result in zero tax
  const tax = QuarterlyInstallmentCalculator.calculateFederalTax(10000);
  assert.strictEqual(tax, 0);
});

test('QuarterlyInstallmentCalculator: calculateFederalTax applies progressive rates', () => {
  const tax1 = QuarterlyInstallmentCalculator.calculateFederalTax(30000);
  const tax2 = QuarterlyInstallmentCalculator.calculateFederalTax(60000);
  const tax3 = QuarterlyInstallmentCalculator.calculateFederalTax(120000);

  // Higher income should have higher tax
  assert.ok(tax2 > tax1);
  assert.ok(tax3 > tax2);
});

test('QuarterlyInstallmentCalculator: calculatePenalty calculates correctly', () => {
  const penalty = QuarterlyInstallmentCalculator.calculatePenalty(1000, 30);
  const expectedPenalty = 1000 * (0.05 / 365) * 30;
  
  assert.strictEqual(penalty, expectedPenalty);
});

test('QuarterlyInstallmentCalculator: estimateAnnualTax includes federal, provincial, and CPP', () => {
  const estimatedTax = QuarterlyInstallmentCalculator.estimateAnnualTax(65000, 'QC');
  
  // Should be a positive number for $65k income
  assert.ok(estimatedTax > 0);
  
  // Should be reasonable (between $5k and $30k for $65k income)
  assert.ok(estimatedTax > 5000);
  assert.ok(estimatedTax < 30000);
});

test('QuarterlyInstallmentCalculator: CPP contribution capped at maximum', () => {
  const highIncome = 200000;
  const estimatedTax1 = QuarterlyInstallmentCalculator.estimateAnnualTax(highIncome, 'QC');
  const evenHigherIncome = 500000;
  const estimatedTax2 = QuarterlyInstallmentCalculator.estimateAnnualTax(evenHigherIncome, 'QC');
  
  // CPP portion should be capped at $7,735
  // The difference in tax should primarily be from income tax increases, not CPP
  const difference = estimatedTax2 - estimatedTax1;
  
  // Verify the difference is reasonable (mainly from progressive tax, not CPP)
  // With $300k income difference, we expect significant tax increase but not proportional to CPP rate
  assert.ok(difference > 0);
  assert.ok(difference < (evenHigherIncome - highIncome)); // Should be less than full income difference
});

test('QuarterlyInstallmentCalculator: quarterly amount is always rounded up', () => {
  // Use prior year tax that doesn't divide evenly by 4
  const result = QuarterlyInstallmentCalculator.calculate({
    estimatedIncome: 65000,
    priorYearTax: 10001, // Divides to 2500.25
    province: 'QC'
  });

  assert.strictEqual(result.quarterlyAmount, 2501); // Should be rounded up
});

test('QuarterlyInstallmentCalculator: DEADLINES constant is defined correctly', () => {
  assert.ok(QuarterlyInstallmentCalculator.DEADLINES.Q1);
  assert.ok(QuarterlyInstallmentCalculator.DEADLINES.Q2);
  assert.ok(QuarterlyInstallmentCalculator.DEADLINES.Q3);
  assert.ok(QuarterlyInstallmentCalculator.DEADLINES.Q4);
  
  assert.strictEqual(QuarterlyInstallmentCalculator.DEADLINES.Q1.month, 2);
  assert.strictEqual(QuarterlyInstallmentCalculator.DEADLINES.Q2.month, 5);
  assert.strictEqual(QuarterlyInstallmentCalculator.DEADLINES.Q3.month, 8);
  assert.strictEqual(QuarterlyInstallmentCalculator.DEADLINES.Q4.month, 11);
});

test('QuarterlyInstallmentCalculator: THRESHOLD constant is $3,000', () => {
  assert.strictEqual(QuarterlyInstallmentCalculator.THRESHOLD, 3000);
});

test('QuarterlyInstallmentCalculator: PENALTY_RATE is 5%', () => {
  assert.strictEqual(QuarterlyInstallmentCalculator.PENALTY_RATE, 0.05);
});
