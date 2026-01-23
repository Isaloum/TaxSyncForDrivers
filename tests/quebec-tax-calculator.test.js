import { test } from 'node:test';
import assert from 'node:assert/strict';
import { 
  calculateQuebecTax,
  getQuebecMarginalRate,
  calculateWorkPremium,
  calculateSolidarityCredit,
  calculateQPPContributions,
  calculateQuebecBPA,
  getCombinedMarginalRate,
  QUEBEC_TAX_RATES_2026
} from '../quebec-tax-calculator.js';

// ===== BASIC TAX CALCULATION TESTS =====
test('Quebec: calculateQuebecTax returns correct structure', () => {
  const result = calculateQuebecTax(50000);
  assert.ok(result.provincialTax !== undefined);
  assert.ok(result.totalTax !== undefined);
  assert.ok(result.basicPersonalCredit !== undefined);
  assert.ok(result.effectiveRate !== undefined);
  assert.ok(Array.isArray(result.bracketBreakdown));
});

test('Quebec: zero income returns zero tax', () => {
  const result = calculateQuebecTax(0);
  assert.strictEqual(result.provincialTax, 0);
  assert.strictEqual(result.totalTax, 0);
});

test('Quebec: $50,000 income tax calculation (first bracket)', () => {
  const result = calculateQuebecTax(50000);
  // First bracket: $50,000 * 14% = $7,000
  // Basic credit: $18,952 * 14% = $2,653.28
  // Net tax: $7,000 - $2,653.28 = $4,346.72
  assert.ok(result.provincialTax > 4300 && result.provincialTax < 4400);
});

test('Quebec: $80,000 income tax calculation (second bracket)', () => {
  const result = calculateQuebecTax(80000);
  // First bracket: $54,345 * 14% = $7,608.30
  // Second bracket: $25,655 * 19% = $4,874.45
  // Total: $12,482.75
  // Basic credit: $18,952 * 14% = $2,653.28
  // Net tax: $12,482.75 - $2,653.28 = $9,829.47
  assert.ok(result.provincialTax > 9800 && result.provincialTax < 9900);
});

test('Quebec: $120,000 income tax calculation (third bracket)', () => {
  const result = calculateQuebecTax(120000);
  // First bracket: $54,345 * 14% = $7,608.30
  // Second bracket: ($108,680 - $54,345) * 19% = $54,335 * 19% = $10,323.65
  // Third bracket: ($120,000 - $108,680) * 24% = $11,320 * 24% = $2,716.80
  // Total: $20,648.75
  // Basic credit: $2,653.28
  // Net tax: $20,648.75 - $2,653.28 = $17,995.47
  assert.ok(result.provincialTax > 17900 && result.provincialTax < 18100);
});

test('Quebec: $150,000 income tax calculation (fourth bracket)', () => {
  const result = calculateQuebecTax(150000);
  // First bracket: $54,345 * 14% = $7,608.30
  // Second bracket: $54,335 * 19% = $10,323.65
  // Third bracket: $23,565 * 24% = $5,655.60
  // Fourth bracket: $17,755 * 25.75% = $4,571.91
  // Total: $28,159.46
  // Basic credit: $2,653.28
  // Net tax: $28,159.46 - $2,653.28 = $25,506.18
  assert.ok(result.provincialTax > 25400 && result.provincialTax < 25600);
});

test('Quebec: basic personal credit is applied correctly', () => {
  const result = calculateQuebecTax(20000);
  // Tax on $20,000: $20,000 * 14% = $2,800
  // Basic credit: $18,952 * 14% = $2,653.28
  // Net: $146.72
  assert.ok(result.basicPersonalCredit > 2650 && result.basicPersonalCredit < 2660);
  assert.ok(result.provincialTax < 200); // Very low after credit
});

// ===== MARGINAL RATE TESTS =====
test('Quebec: marginal rate for first bracket', () => {
  const rate = getQuebecMarginalRate(40000);
  assert.ok(Math.abs(rate - 14) < 0.01);
});

test('Quebec: marginal rate for second bracket', () => {
  const rate = getQuebecMarginalRate(80000);
  assert.ok(Math.abs(rate - 19) < 0.01);
});

test('Quebec: marginal rate for third bracket', () => {
  const rate = getQuebecMarginalRate(120000);
  assert.ok(Math.abs(rate - 24) < 0.01);
});

test('Quebec: marginal rate for fourth bracket', () => {
  const rate = getQuebecMarginalRate(200000);
  assert.ok(Math.abs(rate - 25.75) < 0.01);
});

// ===== WORK PREMIUM TESTS =====
test('Quebec Work Premium: below minimum income', () => {
  const result = calculateWorkPremium(5000);
  assert.strictEqual(result, 0);
});

test('Quebec Work Premium: above maximum income', () => {
  const result = calculateWorkPremium(60000);
  assert.strictEqual(result, 0);
});

test('Quebec Work Premium: eligible income for single', () => {
  const result = calculateWorkPremium(25000, true);
  // ($25,000 - $7,200) * 26% = $17,800 * 26% = $4,628
  // But max is $728 for single
  assert.strictEqual(result, 728);
});

test('Quebec Work Premium: eligible income for family', () => {
  const result = calculateWorkPremium(25000, false);
  // Same calculation but max is $1,456 for family
  assert.strictEqual(result, 1456);
});

test('Quebec Work Premium: low income under cap', () => {
  const result = calculateWorkPremium(10000, true);
  // ($10,000 - $7,200) * 26% = $2,800 * 26% = $728
  // Equals max, so should be $728
  assert.strictEqual(result, 728);
});

// ===== SOLIDARITY CREDIT TESTS =====
test('Quebec Solidarity Credit: low income single', () => {
  const result = calculateSolidarityCredit(40000, true);
  // Below phase-out threshold, full credit
  assert.strictEqual(result, 531);
});

test('Quebec Solidarity Credit: low income couple', () => {
  const result = calculateSolidarityCredit(40000, false);
  // Below phase-out threshold, full credit
  assert.strictEqual(result, 1062);
});

test('Quebec Solidarity Credit: phase-out for single', () => {
  const result = calculateSolidarityCredit(61000, true);
  // Between $57,965 and $64,125
  // Excess: $61,000 - $57,965 = $3,035
  // Range: $64,125 - $57,965 = $6,160
  // Reduction: $3,035 / $6,160 = 49.27%
  // Credit: $531 * (1 - 0.4927) = $269.39
  assert.ok(result > 260 && result < 280);
});

test('Quebec Solidarity Credit: above phase-out', () => {
  const result = calculateSolidarityCredit(70000, true);
  assert.strictEqual(result, 0);
});

// ===== QPP CONTRIBUTION TESTS =====
test('Quebec QPP: below basic exemption', () => {
  const result = calculateQPPContributions(3000);
  assert.strictEqual(result.totalContribution, 0);
  assert.strictEqual(result.deductibleAmount, 0);
});

test('Quebec QPP: basic contribution calculation', () => {
  const result = calculateQPPContributions(50000);
  // Pensionable earnings: $50,000
  // Base: ($50,000 - $3,500) * 13.8% = $46,500 * 13.8% = $6,417
  assert.ok(result.baseContribution > 6400 && result.baseContribution < 6450);
  assert.strictEqual(result.qpp2Contribution, 0); // Below QPP2 threshold
  assert.ok(result.totalContribution > 6400 && result.totalContribution < 6450);
  // Employer portion is deductible (half)
  assert.ok(result.deductibleAmount > 3200 && result.deductibleAmount < 3225);
});

test('Quebec QPP: maximum base contribution', () => {
  const result = calculateQPPContributions(73200);
  // Base: ($73,200 - $3,500) * 13.8% = $69,700 * 13.8% = $9,618.60
  assert.ok(result.baseContribution > 9610 && result.baseContribution < 9625);
});

test('Quebec QPP: with QPP2 contribution', () => {
  const result = calculateQPPContributions(80000);
  // Base: ($73,200 - $3,500) * 13.8% = $9,618.60
  // QPP2: ($80,000 - $73,200) * 2% = $6,800 * 2% = $136
  // Total: $9,618.60 + $136 = $9,754.60
  assert.ok(result.baseContribution > 9610 && result.baseContribution < 9625);
  assert.ok(result.qpp2Contribution > 130 && result.qpp2Contribution < 140);
  assert.ok(result.totalContribution > 9750 && result.totalContribution < 9760);
});

test('Quebec QPP: maximum contribution with QPP2', () => {
  const result = calculateQPPContributions(100000);
  // Base: ($73,200 - $3,500) * 13.8% = $9,618.60
  // QPP2: ($86,700 - $73,200) * 2% = $13,500 * 2% = $270
  // Total: $9,618.60 + $270 = $9,888.60
  assert.ok(result.baseContribution > 9610 && result.baseContribution < 9625);
  assert.ok(result.qpp2Contribution > 265 && result.qpp2Contribution < 275);
  assert.ok(result.totalContribution > 9880 && result.totalContribution < 9895);
  assert.ok(result.maxContribution > 9880 && result.maxContribution < 9895);
});

// ===== BASIC PERSONAL AMOUNT TEST =====
test('Quebec BPA: correct calculation', () => {
  const bpa = calculateQuebecBPA();
  // $18,952 * 14% = $2,653.28
  assert.strictEqual(bpa, 2653.28);
});

// ===== COMBINED MARGINAL RATE TESTS =====
test('Quebec Combined Rate: first federal bracket, first Quebec bracket', () => {
  const rate = getCombinedMarginalRate(50000);
  // Federal: 14%, Quebec: 14%
  // Combined: 28%
  assert.ok(Math.abs(rate - 28) < 0.01);
});

test('Quebec Combined Rate: first federal bracket, second Quebec bracket', () => {
  const rate = getCombinedMarginalRate(55000);
  // Federal: 14%, Quebec: 19%
  // Combined: 33%
  assert.ok(Math.abs(rate - 33) < 0.01);
});

test('Quebec Combined Rate: second federal bracket, second Quebec bracket', () => {
  const rate = getCombinedMarginalRate(80000);
  // Federal: 20.5%, Quebec: 19%
  // Combined: 39.5%
  assert.ok(Math.abs(rate - 39.5) < 0.01);
});

test('Quebec Combined Rate: second federal bracket, third Quebec bracket', () => {
  const rate = getCombinedMarginalRate(115000);
  // Federal: 20.5%, Quebec: 24%
  // Combined: 44.5%
  assert.ok(Math.abs(rate - 44.5) < 0.01);
});

test('Quebec Combined Rate: third federal bracket, third Quebec bracket', () => {
  const rate = getCombinedMarginalRate(120000);
  // Federal: 26%, Quebec: 24%
  // Combined: 50%
  assert.ok(Math.abs(rate - 50) < 0.01);
});

test('Quebec Combined Rate: third federal bracket, fourth Quebec bracket', () => {
  const rate = getCombinedMarginalRate(150000);
  // Federal: 26%, Quebec: 25.75%
  // Combined: 51.75%
  assert.ok(Math.abs(rate - 51.75) < 0.01);
});

test('Quebec Combined Rate: fourth federal bracket, fourth Quebec bracket', () => {
  const rate = getCombinedMarginalRate(200000);
  // Federal: 29%, Quebec: 25.75%
  // Combined: 54.75%
  assert.ok(Math.abs(rate - 54.75) < 0.01);
});

test('Quebec Combined Rate: highest bracket', () => {
  const rate = getCombinedMarginalRate(300000);
  // Federal: 33%, Quebec: 25.75%
  // Combined: 58.75%
  assert.ok(Math.abs(rate - 58.75) < 0.01);
});

// ===== TAX CONSTANTS VALIDATION =====
test('Quebec: has highest basic personal amount in Canada', () => {
  assert.strictEqual(QUEBEC_TAX_RATES_2026.basicPersonalAmount, 18952);
});

test('Quebec: second bracket rate reduced to 19% in 2026', () => {
  assert.strictEqual(QUEBEC_TAX_RATES_2026.brackets[1].rate, 0.19);
});

test('Quebec: correct QPP rates for 2026', () => {
  assert.strictEqual(QUEBEC_TAX_RATES_2026.qpp.baseRate, 0.138);
  assert.strictEqual(QUEBEC_TAX_RATES_2026.qpp.qpp2Rate, 0.02);
});

// ===== EDGE CASES =====
test('Quebec: negative income returns zero tax', () => {
  const result = calculateQuebecTax(-1000);
  assert.strictEqual(result.provincialTax, 0);
});

test('Quebec: very high income uses top bracket', () => {
  const result = calculateQuebecTax(500000);
  assert.ok(result.provincialTax > 100000); // Significant tax at this level
  assert.ok(result.effectiveRate > 20); // Effective rate over 20%
});

test('Quebec: bracket breakdown has correct number of entries', () => {
  const result = calculateQuebecTax(150000);
  // Should use all 4 brackets
  assert.strictEqual(result.bracketBreakdown.length, 4);
});
