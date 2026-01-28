import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateEligibleDividendCredit,
  calculateNonEligibleDividendCredit,
  calculateNetTaxOnDividend,
  compareDividendVsInterest,
  validateT5DividendData,
  extractT5Dividends,
} from '../dividend-tax-credit-calculator.js';

test('Eligible dividend: $10,000 in Quebec', () => {
  const result = calculateEligibleDividendCredit(10000, 'QC');
  
  assert.strictEqual(result.actualDividend, 10000);
  assert.strictEqual(result.grossedUpDividend, 13800); // 138%
  assert.strictEqual(result.grossUpAmount, 3800);
  assert.strictEqual(result.type, 'eligible');
  
  // Federal credit: $13,800 × 15.0198% = $2,072.73
  assert.ok(result.federalCredit > 2070 && result.federalCredit < 2075);
  
  // Quebec credit: $13,800 × 11.7% = $1,614.60
  assert.ok(result.provincialCredit > 1610 && result.provincialCredit < 1620);
  
  // Total credit: ~$3,687
  assert.ok(result.totalCredit > 3680 && result.totalCredit < 3690);
});

test('Non-eligible dividend: $10,000 in Quebec', () => {
  const result = calculateNonEligibleDividendCredit(10000, 'QC');
  
  assert.strictEqual(result.actualDividend, 10000);
  assert.strictEqual(result.grossedUpDividend, 11500); // 115%
  assert.strictEqual(result.grossUpAmount, 1500);
  assert.strictEqual(result.type, 'nonEligible');
  
  // Federal credit: $11,500 × 9.0301% = $1,038.46
  assert.ok(result.federalCredit > 1035 && result.federalCredit < 1040);
  
  // Quebec credit: $11,500 × 4.77% = $548.55
  assert.ok(result.provincialCredit > 545 && result.provincialCredit < 550);
  
  // Total credit: ~$1,587
  assert.ok(result.totalCredit > 1580 && result.totalCredit < 1590);
});

test('Eligible dividend in Ontario: different provincial rate', () => {
  const result = calculateEligibleDividendCredit(10000, 'ON');
  
  // Ontario has 10% DTC on eligible dividends
  // Provincial credit: $13,800 × 10% = $1,380
  assert.ok(result.provincialCredit > 1375 && result.provincialCredit < 1385);
  assert.strictEqual(result.province, 'ON');
});

test('Net tax on eligible dividend: 50% marginal rate, Quebec', () => {
  const result = calculateNetTaxOnDividend(10000, true, 0.50, 'QC');
  
  // Grossed-up: $13,800
  // Tax at 50%: $6,900
  // DTC: ~$3,687
  // Net tax: $6,900 - $3,687 = ~$3,213
  assert.ok(result.netTax > 3200 && result.netTax < 3220);
  
  // Effective rate: $3,213 / $10,000 = 32.13%
  assert.ok(result.effectiveRate > 32 && result.effectiveRate < 33);
});

test('Net tax on non-eligible dividend: 50% marginal rate, Quebec', () => {
  const result = calculateNetTaxOnDividend(10000, false, 0.50, 'QC');
  
  // Grossed-up: $11,500
  // Tax at 50%: $5,750
  // DTC: ~$1,587
  // Net tax: $5,750 - $1,587 = ~$4,163
  assert.ok(result.netTax > 4150 && result.netTax < 4170);
  
  // Effective rate: ~41.63%
  assert.ok(result.effectiveRate > 41 && result.effectiveRate < 42);
});

test('Compare dividend vs interest: eligible dividend saves tax', () => {
  const result = compareDividendVsInterest(10000, true, 0.50, 'QC');
  
  // Interest tax at 50%: $5,000
  assert.strictEqual(result.interestTax, 5000);
  
  // Dividend tax: ~$3,213
  assert.ok(result.dividendTax > 3200 && result.dividendTax < 3220);
  
  // Tax savings: ~$1,787
  assert.ok(result.taxSavings > 1780 && result.taxSavings < 1800);
  
  // Savings percentage: ~17.87%
  assert.ok(result.savingsPercentage > 17 && result.savingsPercentage < 18);
});

test('Compare dividend vs interest: non-eligible dividend still saves tax', () => {
  const result = compareDividendVsInterest(10000, false, 0.50, 'QC');
  
  // Interest tax: $5,000
  // Dividend tax: ~$4,163
  // Savings: ~$837
  assert.ok(result.taxSavings > 830 && result.taxSavings < 850);
});

test('Low marginal rate: eligible dividend may have negative effective rate', () => {
  const result = calculateNetTaxOnDividend(10000, true, 0.20, 'QC');
  
  // At low marginal rates, DTC can exceed tax owing
  // This tests edge case handling
  assert.ok(result.netTax >= 0); // Should not go negative
});

test('Alberta: lower provincial DTC rates', () => {
  const result = calculateEligibleDividendCredit(10000, 'AB');
  
  // Alberta has 8.12% DTC on eligible dividends
  // Provincial credit: $13,800 × 8.12% = $1,120.56
  assert.ok(result.provincialCredit > 1115 && result.provincialCredit < 1125);
});

test('Zero dividend returns zero credits', () => {
  const result = calculateEligibleDividendCredit(0, 'QC');
  
  assert.strictEqual(result.actualDividend, 0);
  assert.strictEqual(result.grossedUpDividend, 0);
  assert.strictEqual(result.totalCredit, 0);
});

test('Validate T5: valid data passes', () => {
  const result = validateT5DividendData({
    eligibleDividends: 5000,
    nonEligibleDividends: 0,
    actualDividend: 5000,
    taxableDividend: 6900, // 5000 × 1.38
  });
  
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.errors.length, 0);
});

test('Validate T5: negative dividends fail', () => {
  const result = validateT5DividendData({
    eligibleDividends: -1000,
    nonEligibleDividends: 0,
  });
  
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.some(e => e.includes('cannot be negative')));
});

test('Validate T5: grossup mismatch detected', () => {
  const result = validateT5DividendData({
    eligibleDividends: 5000,
    actualDividend: 5000,
    taxableDividend: 8000, // Wrong gross-up (should be 6900)
  });
  
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.some(e => e.includes('does not match expected gross-up')));
});

test('Extract T5 dividends from slip data', () => {
  const t5Slip = {
    box24_eligible_dividends: '5000.00',
    box25_taxable_eligible_dividends: '6900.00',
    box10_actual_dividends: '2000.00',
    box11_taxable_dividends: '2300.00',
    box13_interest: '500.00',
  };
  
  const result = extractT5Dividends(t5Slip);
  
  assert.strictEqual(result.eligibleDividends, 5000);
  assert.strictEqual(result.eligibleDividendsGrossUp, 6900);
  assert.strictEqual(result.nonEligibleDividends, 2000);
  assert.strictEqual(result.interest, 500);
});

test('All provinces have DTC rates defined', () => {
  const provinces = ['QC', 'ON', 'AB', 'BC', 'MB', 'SK', 'NS', 'NB', 'PE', 'NL', 'YT', 'NT', 'NU'];
  
  for (const province of provinces) {
    const result = calculateEligibleDividendCredit(10000, province);
    assert.ok(result.provincialCredit > 0);
    assert.strictEqual(result.province, province);
  }
});
