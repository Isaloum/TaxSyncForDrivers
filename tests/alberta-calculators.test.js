import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateAlbertaTax, getAlbertaMarginalRate, getCombinedMarginalRate } from '../alberta-tax-calculator.js';
import { 
  calculateAlbertaChildBenefit, 
  calculateAlbertaSeniorsBenefit,
  calculateAlbertaFamilyEmploymentCredit 
} from '../alberta-child-benefit-calculator.js';

// Alberta Tax Calculator Tests
test('calculateAlbertaTax returns correct structure', () => {
  const result = calculateAlbertaTax(50000);
  assert.ok(result.provincialTax !== undefined);
  assert.ok(result.totalTax !== undefined);
  assert.ok(result.effectiveRate !== undefined);
  assert.ok(result.basicPersonalCredit !== undefined);
  assert.ok(result.totalCredits !== undefined);
  assert.ok(Array.isArray(result.bracketBreakdown));
});

test('calculateAlbertaTax: income $50,000 uses 10% bracket', () => {
  const result = calculateAlbertaTax(50000);
  // First bracket only: $50,000 * 10% = $5,000
  // Basic credit: $21,885 * 10% = $2,188.50
  // Net tax: $5,000 - $2,188.50 = $2,811.50
  assert.ok(result.provincialTax > 2800 && result.provincialTax < 2820);
});

test('calculateAlbertaTax: income $200,000 uses 13-14% brackets', () => {
  const result = calculateAlbertaTax(200000);
  // Should be in the 13% bracket (up to $237,230)
  assert.ok(result.provincialTax > 15000);
  const marginalRate = getAlbertaMarginalRate(200000);
  assert.strictEqual(marginalRate, 13);
});

test('calculateAlbertaTax: basic personal amount is $21,885 (highest in Canada)', () => {
  const result = calculateAlbertaTax(50000);
  // Basic credit: $21,885 * 10% = $2,188.50
  assert.ok(result.basicPersonalCredit > 2188 && result.basicPersonalCredit < 2189);
});

test('calculateAlbertaTax: zero income returns zero tax', () => {
  const result = calculateAlbertaTax(0);
  assert.strictEqual(result.totalTax, 0);
});

test('calculateAlbertaTax: negative income returns zero tax', () => {
  const result = calculateAlbertaTax(-5000);
  assert.strictEqual(result.totalTax, 0);
});

test('calculateAlbertaTax: with spouse credit', () => {
  const result = calculateAlbertaTax(50000, { hasSpouse: true, spouseIncome: 0 });
  // Should get spouse credit: $21,885 * 10% = $2,188.50
  assert.ok(result.totalCredits > 4300); // Basic + spouse
});

test('calculateAlbertaTax: with dependent credits', () => {
  const result = calculateAlbertaTax(80000, { numberOfDependents: 2 });
  // Each dependent: $21,885 * 10% = $2,188.50
  // Total additional: 2 * $2,188.50 = $4,377
  assert.ok(result.totalCredits > 6500); // Basic + 2 dependents
});

test('calculateAlbertaTax: senior age credit (65+)', () => {
  const result = calculateAlbertaTax(40000, { age: 65 });
  // Age credit: $5,690 * 10% = $569
  assert.ok(result.totalCredits > 2700); // Basic + age
});

test('calculateAlbertaTax: pension income credit', () => {
  const result = calculateAlbertaTax(40000, { pensionIncome: 2000 });
  // Pension credit: min($2,000, $1,574) * 10% = $157.40
  assert.ok(result.totalCredits > 2300); // Basic + pension
});

test('calculateAlbertaTax: disability credit', () => {
  const result = calculateAlbertaTax(40000, { hasDisability: true });
  // Disability credit: $16,653 * 10% = $1,665.30
  assert.ok(result.totalCredits > 3800); // Basic + disability
});

test('getAlbertaMarginalRate: $30,000 in first bracket (10%)', () => {
  const rate = getAlbertaMarginalRate(30000);
  assert.strictEqual(rate, 10);
});

test('getAlbertaMarginalRate: $150,000 in second bracket (12%)', () => {
  const rate = getAlbertaMarginalRate(150000);
  assert.strictEqual(rate, 12);
});

test('getAlbertaMarginalRate: $400,000 in highest bracket (15%)', () => {
  const rate = getAlbertaMarginalRate(400000);
  assert.strictEqual(rate, 15);
});

test('getCombinedMarginalRate: $50,000 income', () => {
  const result = getCombinedMarginalRate(50000);
  assert.strictEqual(result.provincial, 10);
  assert.strictEqual(result.federal, 15);
  assert.strictEqual(result.combined, 25);
});

test('getCombinedMarginalRate: $100,000 income', () => {
  const result = getCombinedMarginalRate(100000);
  assert.strictEqual(result.provincial, 10);
  assert.strictEqual(result.federal, 20.5);
  assert.strictEqual(result.combined, 30.5);
});

// Alberta Child & Family Benefit Tests
test('calculateAlbertaChildBenefit: no children returns zero', () => {
  const result = calculateAlbertaChildBenefit({ familyNetIncome: 30000, numberOfChildren: 0 });
  assert.strictEqual(result.annualBenefit, 0);
  assert.strictEqual(result.monthlyPayment, 0);
});

test('calculateAlbertaChildBenefit: 1 child, $20,000 income', () => {
  const result = calculateAlbertaChildBenefit({ familyNetIncome: 20000, numberOfChildren: 1 });
  // Below threshold, full benefit
  assert.strictEqual(result.annualBenefit, 1330);
  assert.ok(result.monthlyPayment > 110 && result.monthlyPayment < 111);
});

test('calculateAlbertaChildBenefit: 3 children, $30,000 income (with reduction)', () => {
  const result = calculateAlbertaChildBenefit({ familyNetIncome: 30000, numberOfChildren: 3 });
  // Base benefit: $1,330 + $665 + $665 = $2,660
  // Reduction: ($30,000 - $23,490) * 4% = $6,510 * 4% = $260.40
  // Net benefit: $2,660 - $260.40 = $2,399.60
  assert.ok(result.annualBenefit > 2399 && result.annualBenefit < 2400);
  assert.ok(result.reduction > 260 && result.reduction < 261);
});

test('calculateAlbertaChildBenefit: breakdown by child', () => {
  const result = calculateAlbertaChildBenefit({ familyNetIncome: 20000, numberOfChildren: 4 });
  assert.strictEqual(result.breakdown.firstChild, 1330);
  assert.strictEqual(result.breakdown.secondChild, 665);
  assert.strictEqual(result.breakdown.thirdChild, 665);
  assert.strictEqual(result.breakdown.additionalChildren, 665); // 4th child
});

test('calculateAlbertaChildBenefit: max 6 children considered', () => {
  const result1 = calculateAlbertaChildBenefit({ familyNetIncome: 20000, numberOfChildren: 6 });
  const result2 = calculateAlbertaChildBenefit({ familyNetIncome: 20000, numberOfChildren: 10 });
  assert.strictEqual(result1.baseBenefit, result2.baseBenefit); // Same for 6 and 10
});

// Alberta Seniors Benefit Tests
test('calculateAlbertaSeniorsBenefit: under 65 not eligible', () => {
  const result = calculateAlbertaSeniorsBenefit({ age: 64, netIncome: 25000 });
  assert.strictEqual(result.eligible, false);
  assert.strictEqual(result.reason, 'Must be 65 or older');
});

test('calculateAlbertaSeniorsBenefit: single senior, $25,000 income (max benefit)', () => {
  const result = calculateAlbertaSeniorsBenefit({ 
    age: 67, 
    netIncome: 25000,
    maritalStatus: 'single' 
  });
  assert.strictEqual(result.eligible, true);
  assert.strictEqual(result.annualBenefit, 3522); // Max for single
  assert.ok(result.monthlyPayment > 293 && result.monthlyPayment < 294);
});

test('calculateAlbertaSeniorsBenefit: single senior, $40,000 income (with reduction)', () => {
  const result = calculateAlbertaSeniorsBenefit({ 
    age: 70, 
    netIncome: 40000,
    maritalStatus: 'single' 
  });
  // Reduction: ($40,000 - $32,285) * 20% = $7,715 * 20% = $1,543
  // Benefit: $3,522 - $1,543 = $1,979
  assert.ok(result.annualBenefit > 1978 && result.annualBenefit < 1980);
  assert.ok(result.reduction > 1542 && result.reduction < 1544);
});

test('calculateAlbertaSeniorsBenefit: couple, $50,000 combined income', () => {
  const result = calculateAlbertaSeniorsBenefit({ 
    age: 68, 
    netIncome: 30000,
    maritalStatus: 'married',
    spouseAge: 67,
    spouseIncome: 20000
  });
  // Below threshold ($53,760), full benefit
  assert.strictEqual(result.annualBenefit, 5283); // Max for couple
  assert.strictEqual(result.seniorType, 'couple');
});

test('calculateAlbertaSeniorsBenefit: couple, $60,000 combined (with reduction)', () => {
  const result = calculateAlbertaSeniorsBenefit({ 
    age: 68, 
    netIncome: 35000,
    maritalStatus: 'married',
    spouseAge: 67,
    spouseIncome: 25000
  });
  // Combined income: $60,000
  // Reduction: ($60,000 - $53,760) * 20% = $6,240 * 20% = $1,248
  // Benefit: $5,283 - $1,248 = $4,035
  assert.ok(result.annualBenefit > 4034 && result.annualBenefit < 4036);
});

test('calculateAlbertaSeniorsBenefit: married but spouse under 65 treated as single', () => {
  const result = calculateAlbertaSeniorsBenefit({ 
    age: 68, 
    netIncome: 30000,
    maritalStatus: 'married',
    spouseAge: 60,
    spouseIncome: 20000
  });
  // Spouse not 65+, so treated as single
  assert.strictEqual(result.seniorType, 'single');
  assert.strictEqual(result.maxBenefit, 3522);
});

// Alberta Family Employment Tax Credit Tests
test('calculateAlbertaFamilyEmploymentCredit: no children not eligible', () => {
  const result = calculateAlbertaFamilyEmploymentCredit({ 
    workingIncome: 35000, 
    familyNetIncome: 35000,
    numberOfChildren: 0 
  });
  assert.strictEqual(result.eligible, false);
  assert.strictEqual(result.reason, 'No children');
});

test('calculateAlbertaFamilyEmploymentCredit: working income below threshold', () => {
  const result = calculateAlbertaFamilyEmploymentCredit({ 
    workingIncome: 2000, 
    familyNetIncome: 2000,
    numberOfChildren: 2 
  });
  assert.strictEqual(result.eligible, false);
  assert.strictEqual(result.reason, 'Working income below threshold');
});

test('calculateAlbertaFamilyEmploymentCredit: $35,000 working income, 2 kids', () => {
  const result = calculateAlbertaFamilyEmploymentCredit({ 
    workingIncome: 35000, 
    familyNetIncome: 35000,
    numberOfChildren: 2 
  });
  // Phase-in: ($35,000 - $2,760) * 11% = $32,240 * 11% = $3,546.40
  // But capped at $2,336
  assert.strictEqual(result.credit, 2336);
  assert.strictEqual(result.eligible, true);
});

test('calculateAlbertaFamilyEmploymentCredit: phase-in calculation', () => {
  const result = calculateAlbertaFamilyEmploymentCredit({ 
    workingIncome: 15000, 
    familyNetIncome: 15000,
    numberOfChildren: 1 
  });
  // Phase-in: ($15,000 - $2,760) * 11% = $12,240 * 11% = $1,346.40
  assert.ok(result.credit > 1346 && result.credit < 1347);
});

test('calculateAlbertaFamilyEmploymentCredit: phase-out over $41,775', () => {
  const result = calculateAlbertaFamilyEmploymentCredit({ 
    workingIncome: 35000, 
    familyNetIncome: 50000,
    numberOfChildren: 2 
  });
  // Phase-in: max $2,336
  // Phase-out reduction: ($50,000 - $41,775) * 4% = $8,225 * 4% = $329
  // Credit: $2,336 - $329 = $2,007
  assert.ok(result.credit > 2006 && result.credit < 2008);
});

test('calculateAlbertaFamilyEmploymentCredit: high income phases out completely', () => {
  const result = calculateAlbertaFamilyEmploymentCredit({ 
    workingIncome: 35000, 
    familyNetIncome: 100000,
    numberOfChildren: 2 
  });
  // Phase-out reduction: ($100,000 - $41,775) * 4% = $58,225 * 4% = $2,329
  // Credit: max(0, $2,336 - $2,329) = $7
  assert.ok(result.credit >= 0 && result.credit < 10);
});
