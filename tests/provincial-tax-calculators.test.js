import { test } from 'node:test';
import assert from 'node:assert/strict';
import { 
  calculateManitobaTax, 
  calculateManitobaEducationCredit,
  MANITOBA_TAX_RATES_2026 
} from '../manitoba-tax-calculator.js';
import { 
  calculateSaskatchewanTax,
  calculateSaskatchewanLowIncomeCredit,
  calculateGraduateRetentionCredit,
  SASKATCHEWAN_TAX_RATES_2026
} from '../saskatchewan-tax-calculator.js';
import {
  calculateNovaScotiaTax,
  calculateNewBrunswickTax,
  calculatePEITax,
  calculateNewfoundlandTax,
  NOVA_SCOTIA_TAX_RATES_2026,
  NEW_BRUNSWICK_TAX_RATES_2026,
  PEI_TAX_RATES_2026,
  NEWFOUNDLAND_TAX_RATES_2026
} from '../atlantic-provinces-tax-calculator.js';
import {
  calculateYukonTax,
  calculateNWTTax,
  calculateNunavutTax,
  calculateNorthernResidentsDeduction,
  getNorthernZone,
  YUKON_TAX_RATES_2026,
  NWT_TAX_RATES_2026,
  NUNAVUT_TAX_RATES_2026
} from '../territories-tax-calculator.js';

// ===== MANITOBA TESTS =====
test('Manitoba: calculateManitobaTax returns correct structure', () => {
  const result = calculateManitobaTax(50000);
  assert.ok(result.provincialTax !== undefined);
  assert.ok(result.totalTax !== undefined);
});

test('Manitoba: $50,000 income tax calculation', () => {
  const result = calculateManitobaTax(50000);
  // First bracket: $47,000 * 10.8% = $5,076
  // Second bracket: $3,000 * 12.75% = $382.50
  // Total: $5,458.50
  // Basic credit: $15,780 * 10.8% = $1,704.24
  // Net tax: $5,458.50 - $1,704.24 = $3,754.26
  assert.ok(result.provincialTax > 3700 && result.provincialTax < 3800);
});

test('Manitoba: zero income returns zero tax', () => {
  const result = calculateManitobaTax(0);
  assert.strictEqual(result.tax, 0);
});

test('Manitoba: Education Property Tax Credit for homeowners', () => {
  const result = calculateManitobaEducationCredit({ schoolTaxPaid: 500 });
  // 80% of $500 = $400
  assert.strictEqual(result, 400);
});

test('Manitoba: Education Property Tax Credit max limit', () => {
  const result = calculateManitobaEducationCredit({ schoolTaxPaid: 1000 });
  // 80% of $1,000 = $800, but max is $700
  assert.strictEqual(result, 700);
});

test('Manitoba: Education Property Tax Credit for renters', () => {
  const result = calculateManitobaEducationCredit({ rentPaid: 12000 });
  // Deemed school tax: 20% of $12,000 = $2,400
  // Credit: 80% of $2,400 = $1,920, but max is $700
  assert.strictEqual(result, 700);
});

// ===== SASKATCHEWAN TESTS =====
test('Saskatchewan: calculateSaskatchewanTax returns correct structure', () => {
  const result = calculateSaskatchewanTax(50000);
  assert.ok(result.provincialTax !== undefined);
  assert.ok(result.totalTax !== undefined);
});

test('Saskatchewan: $50,000 income tax calculation', () => {
  const result = calculateSaskatchewanTax(50000);
  // First bracket: $50,000 * 10.5% = $5,250
  // Basic credit: $17,661 * 10.5% = $1,854.41
  // Net tax: $5,250 - $1,854.41 = $3,395.59
  assert.ok(result.provincialTax > 3350 && result.provincialTax < 3450);
});

test('Saskatchewan: Low-Income Tax Credit at low income', () => {
  const result = calculateSaskatchewanLowIncomeCredit(15000);
  // Below phase-out threshold, full credit
  assert.strictEqual(result, 575);
});

test('Saskatchewan: Low-Income Tax Credit phase-out', () => {
  const result = calculateSaskatchewanLowIncomeCredit(25000);
  // Excess: $25,000 - $19,396 = $5,604
  // Reduction: $5,604 * 4% = $224.16
  // Credit: $575 - $224.16 = $350.84
  assert.ok(result > 340 && result < 360);
});

test('Saskatchewan: Graduate Retention Credit calculation', () => {
  const result = calculateGraduateRetentionCredit({
    tuitionPaidInSask: 5000,
    yearsInSask: 2
  });
  // Yearly max: $20,000 / 7 = ~$2,857.14
  // Remaining years: 7 - 2 = 5
  // Total remaining: 5 * $2,857.14 = $14,285.71
  // Credit: min($5,000, $14,285.71) = $5,000
  assert.ok(result > 4900 && result < 5100);
});

// ===== NOVA SCOTIA TESTS =====
test('Nova Scotia: $100,000 income with high tax rate', () => {
  const result = calculateNovaScotiaTax(100000);
  // Uses 5 different brackets
  assert.ok(result.provincialTax !== undefined);
  assert.ok(result.provincialTax > 10000); // Nova Scotia has high rates
});

test('Nova Scotia: zero income returns zero tax', () => {
  const result = calculateNovaScotiaTax(0);
  assert.strictEqual(result.tax, 0);
});

test('Nova Scotia: basic personal amount applied', () => {
  const result = calculateNovaScotiaTax(15000);
  // Basic credit: $11,481 * 8.79% = $1,009.18
  assert.ok(result.provincialTax < 500); // Should be low due to basic credit
});

// ===== NEW BRUNSWICK TESTS =====
test('New Brunswick: $80,000 income tax calculation', () => {
  const result = calculateNewBrunswickTax(80000);
  // First bracket: $49,958 * 9.4% = $4,696.05
  // Second bracket: $30,042 * 14% = $4,205.88
  // Total: $8,901.93
  // Basic credit: $13,044 * 9.4% = $1,226.14
  // Net: $7,675.79
  assert.ok(result.provincialTax > 7600 && result.provincialTax < 7750);
});

test('New Brunswick: zero income returns zero tax', () => {
  const result = calculateNewBrunswickTax(0);
  assert.strictEqual(result.tax, 0);
});

// ===== PRINCE EDWARD ISLAND TESTS =====
test('PEI: $80,000 income with surtax calculation', () => {
  const result = calculatePEITax(80000);
  assert.ok(result.provincialTax !== undefined);
  assert.ok(result.totalTax !== undefined);
  // Should have surtax for this income level
  assert.ok(result.surtax !== undefined);
});

test('PEI: low income has no surtax', () => {
  const result = calculatePEITax(30000);
  assert.ok(result.surtax === 0 || result.surtax === undefined);
});

test('PEI: zero income returns zero tax', () => {
  const result = calculatePEITax(0);
  assert.strictEqual(result.tax, 0);
});

// ===== NEWFOUNDLAND TESTS =====
test('Newfoundland: $100,000 income with high top rate', () => {
  const result = calculateNewfoundlandTax(100000);
  // Uses multiple brackets, has 21.8% top rate
  assert.ok(result.provincialTax !== undefined);
  assert.ok(result.provincialTax > 10000);
});

test('Newfoundland: zero income returns zero tax', () => {
  const result = calculateNewfoundlandTax(0);
  assert.strictEqual(result.tax, 0);
});

// ===== YUKON TESTS =====
test('Yukon: $60,000 income tax calculation', () => {
  const result = calculateYukonTax(60000);
  // First bracket: $55,867 * 6.4% = $3,575.49
  // Second bracket: $4,133 * 9% = $371.97
  // Total: $3,947.46
  // Basic credit: $15,705 * 6.4% = $1,005.12
  // Net: $2,942.34
  assert.ok(result.provincialTax > 2900 && result.provincialTax < 3000);
});

test('Yukon: zero income returns zero tax', () => {
  const result = calculateYukonTax(0);
  assert.strictEqual(result.tax, 0);
});

// ===== NORTHWEST TERRITORIES TESTS =====
test('NWT: $70,000 income tax calculation', () => {
  const result = calculateNWTTax(70000);
  // First bracket: $50,597 * 5.9% = $2,985.22
  // Second bracket: $19,403 * 8.6% = $1,668.66
  // Total: $4,653.88
  // Basic credit: $16,593 * 5.9% = $978.99
  // Net: $3,674.89
  assert.ok(result.provincialTax > 3600 && result.provincialTax < 3750);
});

test('NWT: zero income returns zero tax', () => {
  const result = calculateNWTTax(0);
  assert.strictEqual(result.tax, 0);
});

// ===== NUNAVUT TESTS =====
test('Nunavut: $60,000 income with lowest rate', () => {
  const result = calculateNunavutTax(60000);
  // First bracket: $53,268 * 4% = $2,130.72
  // Second bracket: $6,732 * 7% = $471.24
  // Total: $2,601.96
  // Basic credit: $17,925 * 4% = $717
  // Net: $1,884.96
  assert.ok(result.provincialTax > 1850 && result.provincialTax < 1950);
});

test('Nunavut: has lowest first bracket rate in Canada (4%)', () => {
  assert.strictEqual(NUNAVUT_TAX_RATES_2026.brackets[0].rate, 0.04);
});

test('Nunavut: zero income returns zero tax', () => {
  const result = calculateNunavutTax(0);
  assert.strictEqual(result.tax, 0);
});

// ===== NORTHERN RESIDENTS DEDUCTION TESTS =====
test('Northern Residents Deduction: Zone A full year', () => {
  const result = calculateNorthernResidentsDeduction({
    zone: 'A',
    daysInZone: 365,
    numberOfTrips: 0,
    travelCosts: 0
  });
  // 365 days * $22/day = $8,030
  assert.strictEqual(result.residencyDeduction, 8030);
  assert.strictEqual(result.travelDeduction, 0);
  assert.strictEqual(result.totalDeduction, 8030);
});

test('Northern Residents Deduction: Zone B full year', () => {
  const result = calculateNorthernResidentsDeduction({
    zone: 'B',
    daysInZone: 365,
    numberOfTrips: 0,
    travelCosts: 0
  });
  // 365 days * $11/day = $4,015
  assert.strictEqual(result.residencyDeduction, 4015);
});

test('Northern Residents Deduction: with travel costs', () => {
  const result = calculateNorthernResidentsDeduction({
    zone: 'A',
    daysInZone: 365,
    numberOfTrips: 2,
    travelCosts: 2000
  });
  // Residency: $8,030
  // Travel: min($2,000, $2,400) = $2,000
  // Total: $10,030
  assert.strictEqual(result.residencyDeduction, 8030);
  assert.strictEqual(result.travelDeduction, 2000);
  assert.strictEqual(result.totalDeduction, 10030);
});

test('Northern Residents Deduction: travel costs capped', () => {
  const result = calculateNorthernResidentsDeduction({
    zone: 'A',
    daysInZone: 365,
    numberOfTrips: 2,
    travelCosts: 5000
  });
  // Travel capped at 2 trips * $1,200 = $2,400
  assert.strictEqual(result.travelDeduction, 2400);
});

test('getNorthernZone: territories are Zone A', () => {
  assert.strictEqual(getNorthernZone('YT'), 'A');
  assert.strictEqual(getNorthernZone('NT'), 'A');
  assert.strictEqual(getNorthernZone('NU'), 'A');
});

test('getNorthernZone: provinces are Zone B', () => {
  assert.strictEqual(getNorthernZone('ON'), 'B');
  assert.strictEqual(getNorthernZone('QC'), 'B');
});
