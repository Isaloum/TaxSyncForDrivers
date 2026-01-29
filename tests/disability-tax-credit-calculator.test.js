import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DTC_AMOUNTS_2026,
  MES_PARAMETERS_2026,
  CDB_PARAMETERS_2026,
  RDSP_GRANT_PARAMETERS_2026,
  calculateDisabilityTaxCredit,
  calculateRetroactiveDTC,
  calculateDTCTransfer,
  calculateMedicalExpenseSupplement,
  calculateChildDisabilityBenefit,
  calculateRDSPGrants,
  validateDTCEligibility,
  calculateCombinedDTCBenefits,
} from '../disability-tax-credit-calculator.js';

// ===== Basic DTC Calculation Tests =====

test('calculateDisabilityTaxCredit: adult in Ontario', () => {
  const result = calculateDisabilityTaxCredit(35, 'ON');
  
  assert.strictEqual(result.age, 35);
  assert.strictEqual(result.province, 'ON');
  assert.strictEqual(result.isChild, false);
  assert.strictEqual(result.federalBaseAmount, 9428);
  assert.strictEqual(result.federalCredit, 1414.2);
  assert.strictEqual(result.provincialCredit, 476.11);
  assert.strictEqual(result.totalAnnualCredit, 1890.31);
});

test('calculateDisabilityTaxCredit: adult in Quebec', () => {
  const result = calculateDisabilityTaxCredit(35, 'QC');
  
  assert.strictEqual(result.province, 'QC');
  assert.strictEqual(result.federalCredit, 1414.2);
  assert.strictEqual(result.provincialCredit, 1319.92);
  assert.strictEqual(result.totalAnnualCredit, 2734.12);
});

test('calculateDisabilityTaxCredit: child under 18 with supplement', () => {
  const result = calculateDisabilityTaxCredit(10, 'ON');
  
  assert.strictEqual(result.isChild, true);
  // Federal base: $9,428 + $5,500 = $14,928
  assert.strictEqual(result.federalBaseAmount, 14928);
  // Federal credit: $14,928 × 15% = $2,239.20
  assert.strictEqual(result.federalCredit, 2239.2);
  // Provincial credit is still based on $9,428
  assert.strictEqual(result.provincialCredit, 476.11);
  assert.strictEqual(result.totalAnnualCredit, 2715.31);
});

test('calculateDisabilityTaxCredit: all provinces calculation', () => {
  const provinces = ['QC', 'ON', 'AB', 'BC', 'MB', 'SK', 'NS', 'NB', 'PE', 'NL', 'YT', 'NT', 'NU'];
  const expectedProvincialCredits = {
    QC: 1319.92,  // 9428 × 0.14
    ON: 476.11,   // 9428 × 0.0505
    AB: 942.8,    // 9428 × 0.10
    BC: 477.06,   // 9428 × 0.0506
    MB: 1018.22,  // 9428 × 0.108
    SK: 989.94,   // 9428 × 0.105
    NS: 828.72,   // 9428 × 0.0879
    NB: 886.23,   // 9428 × 0.094
    PE: 923.94,   // 9428 × 0.098
    NL: 820.24,   // 9428 × 0.087
    YT: 603.39,   // 9428 × 0.064
    NT: 556.25,   // 9428 × 0.059
    NU: 377.12,   // 9428 × 0.04
  };
  
  for (const province of provinces) {
    const result = calculateDisabilityTaxCredit(30, province);
    assert.strictEqual(result.province, province);
    assert.strictEqual(result.federalCredit, 1414.2);
    assert.strictEqual(result.provincialCredit, expectedProvincialCredits[province]);
  }
});

test('calculateDisabilityTaxCredit: explicit isChild parameter', () => {
  // Test explicit isChild=true for age 20
  const resultChild = calculateDisabilityTaxCredit(20, 'ON', true);
  assert.strictEqual(resultChild.isChild, true);
  assert.strictEqual(resultChild.federalBaseAmount, 14928);
  
  // Test explicit isChild=false for age 15
  const resultAdult = calculateDisabilityTaxCredit(15, 'ON', false);
  assert.strictEqual(resultAdult.isChild, false);
  assert.strictEqual(resultAdult.federalBaseAmount, 9428);
});

// ===== Retroactive DTC Tests =====

test('calculateRetroactiveDTC: 10 year claim (2016-2026)', () => {
  const result = calculateRetroactiveDTC(2026, 2016, 35, 'QC');
  
  assert.strictEqual(result.currentYear, 2026);
  assert.strictEqual(result.approvalYear, 2016);
  assert.strictEqual(result.yearsClaimed, 10);
  assert.strictEqual(result.yearlyBreakdown.length, 10);
  
  // Each year should have credit of $2,734.12 (Quebec adult)
  const expectedAnnual = 2734.12;
  const totalExpected = expectedAnnual * 10;
  
  assert.strictEqual(result.totalRetroactive, Math.round(totalExpected * 100) / 100);
  
  // Interest should be approximately 1% per year average (5 years avg)
  const expectedInterest = Math.round(totalExpected * 0.01 * 5 * 100) / 100;
  assert.strictEqual(result.estimatedInterest, expectedInterest);
  
  // Total refund
  assert.strictEqual(result.totalRefund, Math.round((totalExpected + expectedInterest) * 100) / 100);
});

test('calculateRetroactiveDTC: 5 year claim', () => {
  const result = calculateRetroactiveDTC(2026, 2021, 30, 'ON');
  
  assert.strictEqual(result.yearsClaimed, 5);
  assert.strictEqual(result.yearlyBreakdown.length, 5);
  
  // Each year: adult credit $1,890.31
  const expectedTotal = 1890.31 * 5;
  assert.strictEqual(result.totalRetroactive, Math.round(expectedTotal * 100) / 100);
});

test('calculateRetroactiveDTC: child aging to adult during retroactive period', () => {
  // Current age 20 in 2026, approval in 2016 (age 10)
  const result = calculateRetroactiveDTC(2026, 2016, 20, 'ON');
  
  assert.strictEqual(result.yearsClaimed, 10);
  
  // Years 2016-2023 (age 10-17): child credit
  // Years 2024-2025 (age 18-19): adult credit
  
  // Check first year (age 10, child)
  assert.strictEqual(result.yearlyBreakdown[0].age, 10);
  assert.strictEqual(result.yearlyBreakdown[0].isChild, true);
  
  // Check last year (age 19, adult)
  assert.strictEqual(result.yearlyBreakdown[9].age, 19);
  assert.strictEqual(result.yearlyBreakdown[9].isChild, false);
});

test('calculateRetroactiveDTC: no retroactive claims (same year approval)', () => {
  const result = calculateRetroactiveDTC(2026, 2026, 30, 'ON');
  
  assert.strictEqual(result.yearsClaimed, 0);
  assert.strictEqual(result.yearlyBreakdown.length, 0);
  assert.strictEqual(result.totalRetroactive, 0);
  assert.strictEqual(result.estimatedInterest, 0);
  assert.strictEqual(result.totalRefund, 0);
});

test('calculateRetroactiveDTC: capped at 10 years maximum', () => {
  // Try to claim 15 years (should cap at 10)
  const result = calculateRetroactiveDTC(2026, 2011, 40, 'AB');
  
  assert.strictEqual(result.yearsClaimed, 10);
  assert.strictEqual(result.yearlyBreakdown.length, 10);
  
  // First claimed year should be 2011, last should be 2020
  assert.strictEqual(result.yearlyBreakdown[0].year, 2011);
  assert.strictEqual(result.yearlyBreakdown[9].year, 2020);
});

// ===== DTC Transfer Tests =====

test('calculateDTCTransfer: full transfer to spouse', () => {
  // Disabled person has no taxable income
  const result = calculateDTCTransfer(
    10000,  // disabled income
    0,      // disabled tax (no tax owing)
    1890,   // DTC available
    60000,  // spouse income
    8000    // spouse tax
  );
  
  assert.strictEqual(result.usedByDisabled, 0);
  assert.strictEqual(result.availableForTransfer, 1890);
  assert.strictEqual(result.usedBySupport, 1890);
  assert.strictEqual(result.unusedCredit, 0);
  assert.strictEqual(result.shouldTransfer, true);
  assert.strictEqual(result.totalTaxSavings, 1890);
});

test('calculateDTCTransfer: partial transfer', () => {
  // Disabled person uses part of DTC
  const result = calculateDTCTransfer(
    25000,  // disabled income
    500,    // disabled tax
    1890,   // DTC available
    50000,  // spouse income
    5000    // spouse tax
  );
  
  assert.strictEqual(result.usedByDisabled, 500);
  assert.strictEqual(result.availableForTransfer, 1390);
  assert.strictEqual(result.usedBySupport, 1390);
  assert.strictEqual(result.shouldTransfer, true);
  assert.strictEqual(result.totalTaxSavings, 1890);
});

test('calculateDTCTransfer: no transfer needed (disabled person uses all)', () => {
  // Disabled person has sufficient tax to use full credit
  const result = calculateDTCTransfer(
    50000,  // disabled income
    3000,   // disabled tax
    1890,   // DTC available
    60000,  // spouse income
    8000    // spouse tax
  );
  
  assert.strictEqual(result.usedByDisabled, 1890);
  assert.strictEqual(result.availableForTransfer, 0);
  assert.strictEqual(result.usedBySupport, 0);
  assert.strictEqual(result.shouldTransfer, false);
  assert.strictEqual(result.totalTaxSavings, 1890);
});

test('calculateDTCTransfer: some credit lost (spouse low tax)', () => {
  // Supporting person can't use all transferred credit
  const result = calculateDTCTransfer(
    8000,   // disabled income
    0,      // disabled tax
    1890,   // DTC available
    30000,  // spouse income
    500     // spouse tax (low)
  );
  
  assert.strictEqual(result.usedByDisabled, 0);
  assert.strictEqual(result.availableForTransfer, 1890);
  assert.strictEqual(result.usedBySupport, 500);
  assert.strictEqual(result.unusedCredit, 1390);
  assert.strictEqual(result.shouldTransfer, true);
  assert.strictEqual(result.totalTaxSavings, 500);
});

// ===== Medical Expense Supplement Tests =====

test('calculateMedicalExpenseSupplement: eligible, no phase-out', () => {
  const result = calculateMedicalExpenseSupplement(15000, 20000);
  
  assert.strictEqual(result.eligible, true);
  // (15000 - 4010) × 25% = 2747.50, capped at $1,403
  assert.strictEqual(result.beforePhaseOut, 1403);
  assert.strictEqual(result.phaseOutReduction, 0);
  assert.strictEqual(result.supplement, 1403);
});

test('calculateMedicalExpenseSupplement: below minimum work income', () => {
  const result = calculateMedicalExpenseSupplement(3000, 10000);
  
  assert.strictEqual(result.eligible, false);
  assert.strictEqual(result.reason, 'Work income below minimum threshold');
  assert.strictEqual(result.supplement, 0);
});

test('calculateMedicalExpenseSupplement: with phase-out', () => {
  const result = calculateMedicalExpenseSupplement(15000, 35000);
  
  assert.strictEqual(result.eligible, true);
  assert.strictEqual(result.beforePhaseOut, 1403);
  
  // Phase-out: (35000 - 30769) × 25% = 1057.75
  const expectedReduction = Math.round((35000 - 30769) * 0.25 * 100) / 100;
  assert.strictEqual(result.phaseOutReduction, expectedReduction);
  
  // Supplement: 1403 - 1057.75 = 345.25
  const expectedSupplement = Math.round((1403 - expectedReduction) * 100) / 100;
  assert.strictEqual(result.supplement, expectedSupplement);
});

test('calculateMedicalExpenseSupplement: fully phased out', () => {
  const result = calculateMedicalExpenseSupplement(15000, 50000);
  
  assert.strictEqual(result.eligible, true);
  // Phase-out should eliminate entire supplement
  assert.strictEqual(result.supplement, 0);
});

test('calculateMedicalExpenseSupplement: low work income eligible amount', () => {
  const result = calculateMedicalExpenseSupplement(6000, 10000);
  
  assert.strictEqual(result.eligible, true);
  // (6000 - 4010) × 25% = 497.50
  assert.strictEqual(result.beforePhaseOut, 497.5);
  assert.strictEqual(result.supplement, 497.5);
});

// ===== Child Disability Benefit Tests =====

test('calculateChildDisabilityBenefit: one child, low income', () => {
  const result = calculateChildDisabilityBenefit(30000, 1);
  
  assert.strictEqual(result.familyIncome, 30000);
  assert.strictEqual(result.numChildren, 1);
  assert.strictEqual(result.benefitPerChild, 3173);
  assert.strictEqual(result.annualBenefit, 3173);
  assert.strictEqual(result.monthlyBenefit, Math.round(3173 / 12 * 100) / 100);
});

test('calculateChildDisabilityBenefit: multiple children', () => {
  const result = calculateChildDisabilityBenefit(30000, 3);
  
  assert.strictEqual(result.numChildren, 3);
  assert.strictEqual(result.annualBenefit, 3173 * 3);
});

test('calculateChildDisabilityBenefit: with income phase-out', () => {
  const result = calculateChildDisabilityBenefit(50000, 1);
  
  // Phase-out: (50000 - 35000) × 3% = 450
  const expectedReduction = (50000 - 35000) * 0.03;
  const expectedBenefit = Math.round((3173 - expectedReduction) * 100) / 100;
  
  assert.strictEqual(result.benefitPerChild, expectedBenefit);
  assert.strictEqual(result.annualBenefit, expectedBenefit);
});

test('calculateChildDisabilityBenefit: fully phased out', () => {
  // High income that eliminates benefit
  const result = calculateChildDisabilityBenefit(150000, 1);
  
  assert.strictEqual(result.benefitPerChild, 0);
  assert.strictEqual(result.annualBenefit, 0);
});

test('calculateChildDisabilityBenefit: no children', () => {
  const result = calculateChildDisabilityBenefit(30000, 0);
  
  assert.strictEqual(result.numChildren, 0);
  assert.strictEqual(result.annualBenefit, 0);
});

// ===== RDSP Grant Tests =====

test('calculateRDSPGrants: low income, $500 contribution', () => {
  const result = calculateRDSPGrants(500, 50000, 30);
  
  assert.strictEqual(result.eligible, true);
  assert.strictEqual(result.grant, 1500); // 500 × 300%
  assert.strictEqual(result.matchRate, 3);
});

test('calculateRDSPGrants: low income, $1500 contribution', () => {
  const result = calculateRDSPGrants(1500, 50000, 30);
  
  assert.strictEqual(result.eligible, true);
  // First $500 at 300% = $1500, next $1000 at 100% = $1000, total = $2500
  assert.strictEqual(result.grant, 2500);
});

test('calculateRDSPGrants: high income, $1000 contribution', () => {
  const result = calculateRDSPGrants(1000, 120000, 30);
  
  assert.strictEqual(result.eligible, true);
  // 100% match on first $1000
  assert.strictEqual(result.grant, 1000);
  assert.strictEqual(result.matchRate, 1);
});

test('calculateRDSPGrants: annual grant limit', () => {
  // Low income with large contribution
  const result = calculateRDSPGrants(2000, 50000, 30);
  
  assert.strictEqual(result.eligible, true);
  // Would be $1500 (first $500 at 300%) + $1000 (next $1000 at 100%) = $2500
  // Under the annual limit of $3500, so full amount granted
  assert.strictEqual(result.grant, 2500);
  assert.strictEqual(result.annualGrantLimit, 3500);
});

test('calculateRDSPGrants: age limit (over 49)', () => {
  const result = calculateRDSPGrants(1000, 50000, 50);
  
  assert.strictEqual(result.eligible, false);
  assert.strictEqual(result.reason, 'RDSP grants only available until end of age 49');
  assert.strictEqual(result.grant, 0);
});

test('calculateRDSPGrants: age 49 still eligible', () => {
  const result = calculateRDSPGrants(500, 50000, 49);
  
  assert.strictEqual(result.eligible, true);
  assert.strictEqual(result.grant, 1500);
});

// ===== Validation Tests =====

test('validateDTCEligibility: valid', () => {
  const result = validateDTCEligibility(true, 24);
  
  assert.strictEqual(result.eligible, true);
  assert.strictEqual(result.hasT2201, true);
  assert.strictEqual(result.impairmentMonths, 24);
  assert.strictEqual(result.errors.length, 0);
  assert.strictEqual(result.guidance, null);
});

test('validateDTCEligibility: missing T2201', () => {
  const result = validateDTCEligibility(false, 24);
  
  assert.strictEqual(result.eligible, false);
  assert.strictEqual(result.errors.length, 1);
  assert.ok(result.errors[0].includes('T2201'));
  assert.ok(result.guidance.includes('T2201'));
});

test('validateDTCEligibility: impairment too short', () => {
  const result = validateDTCEligibility(true, 6);
  
  assert.strictEqual(result.eligible, false);
  assert.strictEqual(result.errors.length, 1);
  assert.ok(result.errors[0].includes('12 consecutive months'));
});

test('validateDTCEligibility: multiple errors', () => {
  const result = validateDTCEligibility(false, 8);
  
  assert.strictEqual(result.eligible, false);
  assert.strictEqual(result.errors.length, 2);
});

test('validateDTCEligibility: exactly 12 months', () => {
  const result = validateDTCEligibility(true, 12);
  
  assert.strictEqual(result.eligible, true);
});

// ===== Combined Benefits Tests =====

test('calculateCombinedDTCBenefits: comprehensive example', () => {
  const result = calculateCombinedDTCBenefits({
    age: 35,
    province: 'QC',
    currentYear: 2026,
    approvalYear: 2016,
    workIncome: 15000,
    netIncome: 25000,
    rdspContribution: 1500,
    hasT2201: true,
    impairmentMonths: 24,
  });
  
  assert.strictEqual(result.eligible, true);
  assert.ok(result.dtc);
  assert.ok(result.retroactive);
  assert.ok(result.mes);
  assert.ok(result.rdsp);
  assert.ok(result.summary);
  
  // Verify summary totals
  assert.ok(result.summary.annualDTC > 0);
  assert.ok(result.summary.retroactiveTotal > 0);
  assert.ok(result.summary.mesAmount > 0);
  assert.ok(result.summary.rdspGrant > 0);
  assert.ok(result.summary.totalAnnualBenefits > 0);
  assert.ok(result.summary.totalWithRetroactive > 0);
});

test('calculateCombinedDTCBenefits: not eligible (no T2201)', () => {
  const result = calculateCombinedDTCBenefits({
    age: 30,
    province: 'ON',
    hasT2201: false,
    impairmentMonths: 6,
  });
  
  assert.strictEqual(result.eligible, false);
  assert.ok(result.errors.length > 0);
  assert.ok(result.guidance);
});

test('calculateCombinedDTCBenefits: with child and CDB', () => {
  const result = calculateCombinedDTCBenefits({
    age: 10,
    province: 'ON',
    hasT2201: true,
    impairmentMonths: 36,
    familyIncome: 30000,
    numChildren: 1,
  });
  
  assert.strictEqual(result.eligible, true);
  assert.ok(result.dtc.isChild);
  assert.ok(result.cdb);
  assert.ok(result.summary.cdbAmount > 0);
});

test('calculateCombinedDTCBenefits: with transfer to supporting person', () => {
  const result = calculateCombinedDTCBenefits({
    age: 25,
    province: 'BC',
    hasT2201: true,
    impairmentMonths: 24,
    disabledIncome: 10000,
    disabledTax: 0,
    supportIncome: 60000,
    supportTax: 8000,
  });
  
  assert.strictEqual(result.eligible, true);
  assert.ok(result.transfer);
  assert.strictEqual(result.transfer.shouldTransfer, true);
});

test('calculateCombinedDTCBenefits: minimal params (just DTC)', () => {
  const result = calculateCombinedDTCBenefits({
    age: 40,
    province: 'AB',
    hasT2201: true,
    impairmentMonths: 60,
  });
  
  assert.strictEqual(result.eligible, true);
  assert.ok(result.dtc);
  assert.strictEqual(result.retroactive, null);
  assert.strictEqual(result.mes, null);
  assert.strictEqual(result.cdb, null);
  assert.strictEqual(result.rdsp, null);
  
  // Summary should only include DTC
  assert.ok(result.summary.annualDTC > 0);
  assert.strictEqual(result.summary.retroactiveTotal, 0);
  assert.strictEqual(result.summary.mesAmount, 0);
});

// ===== Edge Cases =====

test('edge case: age boundary (17 vs 18)', () => {
  const child17 = calculateDisabilityTaxCredit(17, 'ON');
  const adult18 = calculateDisabilityTaxCredit(18, 'ON');
  
  assert.strictEqual(child17.isChild, true);
  assert.strictEqual(child17.federalBaseAmount, 14928);
  
  assert.strictEqual(adult18.isChild, false);
  assert.strictEqual(adult18.federalBaseAmount, 9428);
});

test('edge case: zero contribution RDSP', () => {
  const result = calculateRDSPGrants(0, 50000, 30);
  
  assert.strictEqual(result.grant, 0);
});

test('edge case: negative values handled', () => {
  // MES with negative work income should return not eligible
  const mes = calculateMedicalExpenseSupplement(-1000, 20000);
  assert.strictEqual(mes.eligible, false);
});

test('edge case: province code case insensitivity', () => {
  const lower = calculateDisabilityTaxCredit(30, 'on');
  const upper = calculateDisabilityTaxCredit(30, 'ON');
  
  assert.strictEqual(lower.province, 'ON');
  assert.strictEqual(upper.province, 'ON');
  assert.strictEqual(lower.totalAnnualCredit, upper.totalAnnualCredit);
});

test('edge case: unknown province defaults to no provincial credit', () => {
  const result = calculateDisabilityTaxCredit(30, 'XX');
  
  assert.strictEqual(result.provincialCredit, 0);
  assert.strictEqual(result.totalAnnualCredit, result.federalCredit);
});
