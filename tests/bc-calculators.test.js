import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateBCTax, getBCMarginalRate } from '../bc-tax-calculator.js';
import { calculateBCClimateAction, calculateBCAffordability } from '../bc-climate-action-calculator.js';
import { calculateBCHomeOwnerGrant } from '../bc-home-owner-grant.js';

// BC Tax Calculator Tests
test('calculateBCTax returns correct structure', () => {
  const result = calculateBCTax(50000);
  assert.ok(result.provincialTax !== undefined);
  assert.ok(result.totalTax !== undefined);
  assert.ok(result.effectiveRate !== undefined);
  assert.ok(result.basicPersonalCredit !== undefined);
});

test('calculateBCTax: income $50,000 uses 5.06% and 7.7% brackets', () => {
  const result = calculateBCTax(50000);
  // First bracket: $47,937 * 5.06% = $2,425.61
  // Second bracket: ($50,000 - $47,937) * 7.7% = $2,063 * 7.7% = $158.85
  // Total before credit: $2,425.61 + $158.85 = $2,584.46
  // Basic credit: $12,580 * 5.06% = $636.55
  // Net tax: $2,584.46 - $636.55 = $1,947.91
  assert.ok(result.provincialTax > 1900 && result.provincialTax < 2000);
});

test('calculateBCTax: income $150,000 has 14.7% marginal rate', () => {
  const marginalRate = getBCMarginalRate(150000);
  assert.strictEqual(marginalRate, 14.7);
});

test('calculateBCTax: zero income returns zero tax', () => {
  const result = calculateBCTax(0);
  assert.strictEqual(result.totalTax, 0);
});

test('calculateBCTax: negative income returns zero tax', () => {
  const result = calculateBCTax(-5000);
  assert.strictEqual(result.totalTax, 0);
});

test('calculateBCTax: basic personal amount creates credit', () => {
  const result = calculateBCTax(15000);
  assert.ok(result.basicPersonalCredit > 600);
  assert.ok(result.basicPersonalCredit < 650);
});

test('getBCMarginalRate: $30,000 in first bracket', () => {
  const rate = getBCMarginalRate(30000);
  assert.strictEqual(rate, 5.06);
});

test('getBCMarginalRate: $100,000 in third bracket', () => {
  const rate = getBCMarginalRate(100000);
  assert.strictEqual(rate, 10.5);
});

test('getBCMarginalRate: high income in top bracket', () => {
  const rate = getBCMarginalRate(300000);
  assert.strictEqual(rate, 20.5);
});

// BC Climate Action Tax Credit Tests
test('calculateBCClimateAction: single, low income gets full credit', () => {
  const household = {
    netIncome: 30000,
    numberOfAdults: 1,
    numberOfChildren: 0,
    maritalStatus: 'single',
  };
  const result = calculateBCClimateAction(household);
  // $193.50 * 4 = $774
  assert.strictEqual(result.annualCredit, 774);
  assert.strictEqual(result.quarterlyPayment, 193.50);
});

test('calculateBCClimateAction: family with 2 adults and 2 kids', () => {
  const household = {
    netIncome: 45000,
    numberOfAdults: 2,
    numberOfChildren: 2,
    maritalStatus: 'married',
  };
  const result = calculateBCClimateAction(household);
  // Base: (2 * $193.50 * 4) + (2 * $56.50 * 4) = $1,548 + $452 = $2,000
  assert.strictEqual(result.baseCredit, 2000);
});

test('calculateBCClimateAction: reduction applies over threshold', () => {
  const household = {
    netIncome: 60000,
    familyNetIncome: 60000,
    numberOfAdults: 2,
    numberOfChildren: 2,
    maritalStatus: 'married',
  };
  const result = calculateBCClimateAction(household);
  // Threshold: $51,121
  // Excess: $60,000 - $51,121 = $8,879
  // Reduction: $8,879 * 2% = $177.58
  // Credit: $2,000 - $177.58 = $1,822.42
  assert.ok(result.reduction > 175 && result.reduction < 180);
  assert.ok(result.annualCredit > 1820 && result.annualCredit < 1825);
});

test('calculateBCClimateAction: returns payment months', () => {
  const household = {
    netIncome: 30000,
    numberOfAdults: 1,
    numberOfChildren: 0,
    maritalStatus: 'single',
  };
  const result = calculateBCClimateAction(household);
  assert.deepStrictEqual(result.paymentMonths, ['July', 'October', 'January', 'April']);
});

// BC Affordability Credit Tests
test('calculateBCAffordability: single individual below threshold', () => {
  const household = {
    netIncome: 30000,
    numberOfChildren: 0,
    maritalStatus: 'single',
  };
  const result = calculateBCAffordability(household);
  assert.strictEqual(result.annualCredit, 164);
  assert.strictEqual(result.reduction, 0);
});

test('calculateBCAffordability: couple with 1 child below threshold', () => {
  const household = {
    netIncome: 40000,
    numberOfChildren: 1,
    maritalStatus: 'married',
  };
  const result = calculateBCAffordability(household);
  // $246 + $41 = $287
  assert.strictEqual(result.annualCredit, 287);
});

test('calculateBCAffordability: reduction applies over threshold', () => {
  const household = {
    netIncome: 60000,
    familyNetIncome: 60000,
    numberOfChildren: 1,
    maritalStatus: 'married',
  };
  const result = calculateBCAffordability(household);
  // Base: $246 + $41 = $287
  // Threshold: $52,000
  // Excess: $60,000 - $52,000 = $8,000
  // Reduction: $8,000 * 2% = $160
  // Credit: $287 - $160 = $127
  assert.strictEqual(result.reduction, 160);
  assert.strictEqual(result.annualCredit, 127);
});

test('calculateBCAffordability: credit cannot go below zero', () => {
  const household = {
    netIncome: 100000,
    numberOfChildren: 0,
    maritalStatus: 'single',
  };
  const result = calculateBCAffordability(household);
  assert.ok(result.annualCredit >= 0);
});

// BC Home Owner Grant Tests
test('calculateBCHomeOwnerGrant: regular area, basic grant', () => {
  const property = {
    assessedValue: 800000,
    ownerAge: 45,
    isDisabled: false,
    isVeteran: false,
    isNorthern: false,
    municipality: 'Vancouver',
  };
  const result = calculateBCHomeOwnerGrant(property);
  assert.strictEqual(result.grant, 570);
  assert.strictEqual(result.qualifiesForNorthern, false);
  assert.strictEqual(result.seniorBonus, false);
});

test('calculateBCHomeOwnerGrant: senior 65+ gets additional grant', () => {
  const property = {
    assessedValue: 900000,
    ownerAge: 68,
    isDisabled: false,
    isVeteran: false,
    isNorthern: false,
    municipality: 'Victoria',
  };
  const result = calculateBCHomeOwnerGrant(property);
  assert.strictEqual(result.grant, 845);
  assert.strictEqual(result.seniorBonus, true);
});

test('calculateBCHomeOwnerGrant: northern area gets higher grant', () => {
  const property = {
    assessedValue: 500000,
    ownerAge: 45,
    isDisabled: false,
    isVeteran: false,
    isNorthern: true,
    municipality: 'Fort Nelson',
  };
  const result = calculateBCHomeOwnerGrant(property);
  assert.strictEqual(result.grant, 770);
  assert.strictEqual(result.qualifiesForNorthern, true);
});

test('calculateBCHomeOwnerGrant: northern senior gets highest grant', () => {
  const property = {
    assessedValue: 600000,
    ownerAge: 70,
    isDisabled: false,
    isVeteran: false,
    isNorthern: false,
    municipality: 'Peace River',
  };
  const result = calculateBCHomeOwnerGrant(property);
  assert.strictEqual(result.grant, 1045);
  assert.strictEqual(result.qualifiesForNorthern, true);
  assert.strictEqual(result.seniorBonus, true);
});

test('calculateBCHomeOwnerGrant: high-value property reduces grant', () => {
  const property = {
    assessedValue: 3000000,
    ownerAge: 50,
    isDisabled: false,
    isVeteran: false,
    isNorthern: false,
    municipality: 'West Vancouver',
  };
  const result = calculateBCHomeOwnerGrant(property);
  // Excess: $3,000,000 - $2,200,000 = $800,000
  // Reduction: ($800,000 / 1000) * $0.50 = 800 * $0.50 = $400
  // Grant: $570 - $400 = $170
  assert.strictEqual(result.grant, 170);
});

test('calculateBCHomeOwnerGrant: disabled person gets senior bonus', () => {
  const property = {
    assessedValue: 750000,
    ownerAge: 40,
    isDisabled: true,
    isVeteran: false,
    isNorthern: false,
    municipality: 'Burnaby',
  };
  const result = calculateBCHomeOwnerGrant(property);
  assert.strictEqual(result.grant, 845);
  assert.strictEqual(result.seniorBonus, true);
});

test('calculateBCHomeOwnerGrant: veteran gets bonus', () => {
  const property = {
    assessedValue: 700000,
    ownerAge: 55,
    isDisabled: false,
    isVeteran: true,
    isNorthern: false,
    municipality: 'Surrey',
  };
  const result = calculateBCHomeOwnerGrant(property);
  assert.strictEqual(result.grant, 845);
});
