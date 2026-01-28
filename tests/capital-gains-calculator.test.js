import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCapitalGain,
  calculateCapitalGainTax,
  calculateCapitalLoss,
  isSuperficialLoss,
  calculatePrincipalResidenceExemption,
  validateCapitalGainTransaction,
} from '../capital-gains-calculator.js';

test('Capital Gain: Simple stock sale with profit', () => {
  const result = calculateCapitalGain(15000, 10000);
  
  assert.strictEqual(result.totalGain, 5000);
  assert.strictEqual(result.capitalGain, 5000);
  assert.strictEqual(result.taxableAmount, 2500); // 50% inclusion
  assert.strictEqual(result.isGain, true);
});

test('Capital Gain: Stock sale with loss', () => {
  const result = calculateCapitalGain(8000, 10000);
  
  assert.strictEqual(result.totalGain, -2000);
  assert.strictEqual(result.isGain, false);
  assert.strictEqual(result.taxableAmount, -1000); // 50% of loss
});

test('Capital Gain: Real estate with selling expenses', () => {
  const result = calculateCapitalGain(500000, 300000, 25000, 5000);
  
  // Proceeds: $500,000 - $25,000 = $475,000
  // ACB: $300,000 + $5,000 = $305,000
  // Gain: $475,000 - $305,000 = $170,000
  assert.strictEqual(result.proceeds, 475000);
  assert.strictEqual(result.acb, 305000);
  assert.strictEqual(result.totalGain, 170000);
  assert.strictEqual(result.taxableAmount, 85000); // 50%
});

test('Capital Gain: Principal residence - full exemption', () => {
  const result = calculateCapitalGain(600000, 400000, 0, 0, {
    isPrincipalResidence: true,
    yearsOwned: 10,
    yearsAsResidence: 10,
  });
  
  // Full exemption: (1+10)/10 = 110% (capped at 100%)
  assert.strictEqual(result.totalGain, 200000);
  assert.strictEqual(result.exemptAmount, 200000);
  assert.strictEqual(result.taxableAmount, 0);
});

test('Capital Gain: Principal residence - partial exemption', () => {
  const result = calculateCapitalGain(500000, 300000, 0, 0, {
    isPrincipalResidence: true,
    yearsOwned: 10,
    yearsAsResidence: 5,
  });
  
  // Partial exemption: (1+5)/10 = 60%
  // Gain: $200,000
  // Exempt: $200,000 × 60% = $120,000
  // Taxable gain: $80,000
  // Taxable amount: $40,000 (50% inclusion)
  assert.strictEqual(result.totalGain, 200000);
  assert.strictEqual(result.exemptAmount, 120000);
  assert.strictEqual(result.capitalGain, 80000);
  assert.strictEqual(result.taxableAmount, 40000);
});

test('Capital Gain: Qualified small business - LCGE applies', () => {
  const result = calculateCapitalGain(1500000, 500000, 0, 0, {
    isQualifiedProperty: true,
    lcgeUsed: 0,
  });
  
  // Gain: $1,000,000
  // LCGE limit 2026: $1,016,836
  // Full exemption on this gain
  assert.strictEqual(result.totalGain, 1000000);
  assert.strictEqual(result.lcgeApplied, 1000000);
  assert.strictEqual(result.taxableAmount, 0);
});

test('Capital Gain: LCGE partially used', () => {
  const result = calculateCapitalGain(1200000, 400000, 0, 0, {
    isQualifiedProperty: true,
    lcgeUsed: 500000,
  });
  
  // Gain: $800,000
  // LCGE available: $1,016,836 - $500,000 = $516,836
  // LCGE applied: $516,836
  // Remaining taxable: $800,000 - $516,836 = $283,164
  // Taxable amount: $141,582 (50%)
  assert.strictEqual(result.totalGain, 800000);
  assert.strictEqual(result.lcgeApplied, 516836);
  assert.ok(result.taxableAmount > 141500 && result.taxableAmount < 142000);
});

test('Capital Gain Tax: 45% marginal rate', () => {
  const result = calculateCapitalGainTax(50000, 0.45);
  
  assert.strictEqual(result.taxableCapitalGain, 50000);
  assert.strictEqual(result.marginalRate, 45);
  assert.strictEqual(result.taxOwing, 22500);
});

test('Capital Loss: Offset against other gains', () => {
  const result = calculateCapitalLoss(-10000, 15000);
  
  // Loss: $10,000
  // Offset: $10,000 (against $15,000 gains)
  // Net loss: $0
  assert.strictEqual(result.capitalLoss, 10000);
  assert.strictEqual(result.offsetAmount, 10000);
  assert.strictEqual(result.netLoss, 0);
  assert.strictEqual(result.carryForwardAmount, 0);
});

test('Capital Loss: Carry forward excess', () => {
  const result = calculateCapitalLoss(-20000, 5000);
  
  // Loss: $20,000
  // Offset: $5,000
  // Net loss: $15,000
  // Carry forward: $7,500 (50%)
  assert.strictEqual(result.capitalLoss, 20000);
  assert.strictEqual(result.offsetAmount, 5000);
  assert.strictEqual(result.netLoss, 15000);
  assert.strictEqual(result.carryForwardAmount, 7500);
  assert.strictEqual(result.canCarryBack, 3);
  assert.strictEqual(result.canCarryForward, true);
});

test('Superficial Loss: Repurchase within 30 days', () => {
  const saleDate = new Date('2026-06-01');
  const repurchaseDate = new Date('2026-06-15');
  
  const isSuperficial = isSuperficialLoss(saleDate, repurchaseDate);
  assert.strictEqual(isSuperficial, true);
});

test('Superficial Loss: Repurchase after 30 days - valid loss', () => {
  const saleDate = new Date('2026-06-01');
  const repurchaseDate = new Date('2026-07-15');
  
  const isSuperficial = isSuperficialLoss(saleDate, repurchaseDate);
  assert.strictEqual(isSuperficial, false);
});

test('Principal Residence Exemption: Full designation', () => {
  const result = calculatePrincipalResidenceExemption(300000, 15, 15);
  
  // (1+15)/15 = 1.0667 → capped at 100%
  assert.strictEqual(result.totalGain, 300000);
  assert.strictEqual(result.exemptionRatio, 106.67);
  assert.strictEqual(result.exemptAmount, 300000);
  assert.strictEqual(result.taxableGain, 0);
});

test('Principal Residence Exemption: Partial designation', () => {
  const result = calculatePrincipalResidenceExemption(200000, 20, 10);
  
  // (1+10)/20 = 55%
  assert.strictEqual(result.exemptionRatio, 55);
  assert.strictEqual(result.exemptAmount, 110000);
  assert.strictEqual(result.taxableGain, 90000);
});

test('Validation: Valid transaction', () => {
  const result = validateCapitalGainTransaction({
    salePrice: 100000,
    purchasePrice: 80000,
    yearsOwned: 5,
    yearsAsResidence: 5,
  });
  
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.errors.length, 0);
});

test('Validation: Invalid - years as residence exceeds years owned', () => {
  const result = validateCapitalGainTransaction({
    salePrice: 100000,
    purchasePrice: 80000,
    yearsOwned: 5,
    yearsAsResidence: 7,
  });
  
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.some(e => e.includes('cannot exceed years owned')));
});

test('Validation: Invalid - negative sale price', () => {
  const result = validateCapitalGainTransaction({
    salePrice: -1000,
    purchasePrice: 80000,
  });
  
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.length > 0);
});

test('Error: Negative prices throw error', () => {
  assert.throws(() => {
    calculateCapitalGain(-100000, 50000);
  }, /Prices must be non-negative/);
});

test('Error: Invalid marginal rate', () => {
  assert.throws(() => {
    calculateCapitalGainTax(10000, 1.5);
  }, /Marginal rate must be between 0 and 1/);
});
