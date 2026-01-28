import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SENIORS_BENEFITS_2026,
  calculateOAS,
  calculateGIS,
  calculateCPPRetirement,
  calculatePensionSplitting,
  calculateCombinedSeniorBenefits,
  validateSeniorBenefitInputs,
} from '../seniors-benefits-calculator.js';

// ===== OAS Tests =====

test('OAS: full benefit with 40 years residence', () => {
  const result = calculateOAS(50000, 40, 65, 0);
  assert.strictEqual(result.eligible, true);
  assert.strictEqual(result.baseBenefit, 8300.04);
  assert.strictEqual(result.isPartialBenefit, false);
  assert.strictEqual(result.residenceYears, 40);
});

test('OAS: partial benefit with 20 years residence', () => {
  const result = calculateOAS(50000, 20, 65, 0);
  assert.strictEqual(result.eligible, true);
  assert.strictEqual(result.isPartialBenefit, true);
  // 20/40 = 50% of max benefit
  assert.strictEqual(result.baseBenefit, 4150.02);
});

test('OAS: partial benefit with 10 years residence (minimum)', () => {
  const result = calculateOAS(50000, 10, 65, 0);
  assert.strictEqual(result.eligible, true);
  assert.strictEqual(result.isPartialBenefit, true);
  // 10/40 = 25% of max benefit
  assert.strictEqual(result.baseBenefit, 2075.01);
});

test('OAS: not eligible with less than 10 years residence', () => {
  const result = calculateOAS(50000, 9, 65, 0);
  assert.strictEqual(result.eligible, false);
  assert.ok(result.reason.includes('minimum'));
});

test('OAS: not eligible under age 65', () => {
  const result = calculateOAS(50000, 40, 64, 0);
  assert.strictEqual(result.eligible, false);
  assert.strictEqual(result.reason, 'Must be 65 or older');
});

test('OAS: no clawback below threshold income', () => {
  const result = calculateOAS(80000, 40, 65, 0);
  assert.strictEqual(result.eligible, true);
  assert.strictEqual(result.clawback, 0);
  assert.strictEqual(result.netBenefit, result.grossBenefit);
});

test('OAS: clawback at income above threshold', () => {
  const result = calculateOAS(100000, 40, 65, 0);
  assert.strictEqual(result.eligible, true);
  // Income 100000, threshold 90997, excess = 9003
  // Clawback = 9003 * 0.15 = 1350.45
  assert.strictEqual(result.clawback, 1350.45);
  assert.ok(result.netBenefit < result.grossBenefit);
});

test('OAS: full clawback at very high income', () => {
  const result = calculateOAS(150000, 40, 65, 0);
  assert.strictEqual(result.eligible, true);
  assert.ok(result.clawback > 0);
  // Should be fully clawed back
  assert.strictEqual(result.netBenefit, 0);
});

test('OAS: deferral to age 66 (12 months)', () => {
  const result = calculateOAS(50000, 40, 66, 12);
  assert.strictEqual(result.eligible, true);
  assert.strictEqual(result.deferralMonths, 12);
  // 12 months * 0.6% = 7.2% increase
  const expectedIncrease = Math.round(8300.04 * 0.072 * 100) / 100;
  assert.strictEqual(result.deferralIncrease, expectedIncrease);
  assert.ok(result.grossBenefit > result.baseBenefit);
});

test('OAS: deferral to age 70 (60 months)', () => {
  const result = calculateOAS(50000, 40, 70, 60);
  assert.strictEqual(result.eligible, true);
  assert.strictEqual(result.deferralMonths, 60);
  // 60 months * 0.6% = 36% increase (max)
  const expectedIncrease = Math.round(8300.04 * 0.36 * 100) / 100;
  assert.strictEqual(result.deferralIncrease, expectedIncrease);
});

test('OAS: deferral with partial benefit', () => {
  const result = calculateOAS(50000, 20, 67, 24);
  assert.strictEqual(result.eligible, true);
  assert.strictEqual(result.isPartialBenefit, true);
  // Deferral applies to base benefit (partial)
  assert.ok(result.deferralIncrease > 0);
  assert.ok(result.grossBenefit > result.baseBenefit);
});

// ===== GIS Tests =====

test('GIS: single person with no income gets maximum', () => {
  const result = calculateGIS(0, true, false, 0);
  assert.strictEqual(result.eligible, true);
  assert.strictEqual(result.isSingle, true);
  assert.strictEqual(result.monthlyBenefit, 1062.01);
  assert.strictEqual(result.annualBenefit, 12744.12);
});

test('GIS: single person with low income', () => {
  const result = calculateGIS(5000, true, false, 0);
  assert.strictEqual(result.eligible, true);
  assert.strictEqual(result.isSingle, true);
  // Reduction: 5000 * 0.5 = 2500 annual, 208.33 monthly
  // Monthly GIS = 1062.01 - 208.33 = 853.68
  assert.strictEqual(result.monthlyBenefit, 853.68);
});

test('GIS: single person income at phase-out threshold', () => {
  const result = calculateGIS(21624, true, false, 0);
  // At this income level, there's still some GIS left
  assert.ok(result.monthlyBenefit > 0);
  assert.ok(result.monthlyBenefit < 200); // But it's very low
});

test('GIS: single person income above phase-out threshold', () => {
  const result = calculateGIS(30000, true, false, 0);
  // At very high income, GIS should be zero or nearly zero
  assert.ok(result.monthlyBenefit >= 0);
  assert.ok(result.monthlyBenefit < 100);
});

test('GIS: couple both receive OAS with no income', () => {
  const result = calculateGIS(0, false, true, 0);
  assert.strictEqual(result.eligible, true);
  assert.strictEqual(result.isSingle, false);
  assert.strictEqual(result.partnerReceivesOAS, true);
  assert.strictEqual(result.monthlyBenefit, 639.77);
  assert.strictEqual(result.annualBenefit, 7677.24);
});

test('GIS: couple both receive OAS with low combined income', () => {
  const result = calculateGIS(5000, false, true, 3000);
  assert.strictEqual(result.eligible, true);
  assert.strictEqual(result.combinedIncome, 8000);
  // Reduction: 8000 * 0.25 = 2000 annual, 166.67 monthly per person
  // Monthly GIS = 639.77 - 166.67 = 473.10
  assert.strictEqual(result.monthlyBenefit, 473.1);
});

test('GIS: couple only one receives OAS with no income', () => {
  const result = calculateGIS(0, false, false, 0);
  assert.strictEqual(result.eligible, true);
  assert.strictEqual(result.partnerReceivesOAS, false);
  assert.strictEqual(result.monthlyBenefit, 1062.01);
  assert.strictEqual(result.annualBenefit, 12744.12);
});

test('GIS: couple only one receives OAS with income', () => {
  const result = calculateGIS(10000, false, false, 5000);
  assert.strictEqual(result.eligible, true);
  assert.strictEqual(result.combinedIncome, 15000);
  // Reduction: 15000 * 0.25 = 3750 annual, 312.5 monthly
  // Monthly GIS = 1062.01 - 312.5 = 749.51
  assert.strictEqual(result.monthlyBenefit, 749.51);
});

// ===== CPP/QPP Tests =====

test('CPP: basic calculation at age 65', () => {
  const result = calculateCPPRetirement(5000, 65, 'ON');
  assert.strictEqual(result.type, 'CPP');
  assert.strictEqual(result.startAge, 65);
  assert.strictEqual(result.adjustmentRate, 0);
  // 25% of 5000 = 1250
  assert.strictEqual(result.baseMonthlyAt65, 1250);
  assert.strictEqual(result.adjustedMonthly, 1250);
});

test('CPP: early start at age 60 with penalty', () => {
  const result = calculateCPPRetirement(5000, 60, 'ON');
  assert.strictEqual(result.type, 'CPP');
  assert.strictEqual(result.startAge, 60);
  // 60 months early * -0.6% = -36%
  assert.strictEqual(result.adjustmentRate, -36);
  // Base 1250, adjusted = 1250 * 0.64 = 800
  assert.strictEqual(result.adjustedMonthly, 800);
});

test('CPP: early start at age 62 with penalty', () => {
  const result = calculateCPPRetirement(5000, 62, 'ON');
  assert.strictEqual(result.type, 'CPP');
  // 36 months early * -0.6% = -21.6%
  assert.strictEqual(result.adjustmentRate, -21.6);
  assert.ok(result.adjustedMonthly < result.baseMonthlyAt65);
});

test('CPP: late start at age 70 with bonus', () => {
  const result = calculateCPPRetirement(5000, 70, 'ON');
  assert.strictEqual(result.type, 'CPP');
  assert.strictEqual(result.startAge, 70);
  // 60 months late * +0.7% = +42%
  assert.strictEqual(result.adjustmentRate, 42);
  // Base 1250, adjusted = 1250 * 1.42 = 1775
  assert.strictEqual(result.adjustedMonthly, 1775);
});

test('CPP: late start at age 67 with bonus', () => {
  const result = calculateCPPRetirement(5000, 67, 'ON');
  assert.strictEqual(result.type, 'CPP');
  // 24 months late * +0.7% = +16.8%
  assert.strictEqual(result.adjustmentRate, 16.8);
  assert.ok(result.adjustedMonthly > result.baseMonthlyAt65);
});

test('CPP: maximum benefit capped', () => {
  const result = calculateCPPRetirement(10000, 65, 'ON');
  assert.strictEqual(result.type, 'CPP');
  // 25% of 10000 = 2500, but capped at max 1433
  assert.strictEqual(result.baseMonthlyAt65, 1433);
});

test('QPP: basic calculation at age 65', () => {
  const result = calculateCPPRetirement(5000, 65, 'QC');
  assert.strictEqual(result.type, 'QPP');
  assert.strictEqual(result.startAge, 65);
  assert.strictEqual(result.baseMonthlyAt65, 1250);
});

test('QPP: has different maximum than CPP', () => {
  const result = calculateCPPRetirement(10000, 65, 'QC');
  assert.strictEqual(result.type, 'QPP');
  assert.strictEqual(result.maxPossible, 1433.33);
});

// ===== Pension Splitting Tests =====

test('Pension splitting: not eligible if both under 65', () => {
  const result = calculatePensionSplitting(80000, 30000, 50000, 20000, 64, 64, 'QC');
  assert.strictEqual(result.eligible, false);
  assert.ok(result.reason.includes('65+'));
});

test('Pension splitting: eligible with one spouse 65+ and pension income', () => {
  const result = calculatePensionSplitting(80000, 30000, 50000, 0, 65, 64, 'QC');
  assert.strictEqual(result.eligible, true);
});

test('Pension splitting: transfers from higher to lower income spouse', () => {
  const result = calculatePensionSplitting(80000, 30000, 40000, 0, 65, 60, 'QC');
  assert.strictEqual(result.eligible, true);
  // Spouse 1 has higher income, should transfer to spouse 2
  assert.ok(result.transfers.spouse1ToSpouse2 > 0);
  assert.strictEqual(result.transfers.spouse2ToSpouse1, 0);
  // After splitting, incomes should be closer
  assert.ok(result.afterSplitting.spouse1Income < result.beforeSplitting.spouse1Income);
  assert.ok(result.afterSplitting.spouse2Income > result.beforeSplitting.spouse2Income);
});

test('Pension splitting: maximum 50% transfer', () => {
  const result = calculatePensionSplitting(100000, 20000, 30000, 0, 65, 60, 'QC');
  assert.strictEqual(result.eligible, true);
  // Max transfer is 50% of pension income
  assert.ok(result.transfers.spouse1ToSpouse2 <= 10000);
});

test('Pension splitting: total income remains same', () => {
  const result = calculatePensionSplitting(80000, 30000, 40000, 10000, 65, 65, 'QC');
  assert.strictEqual(result.eligible, true);
  assert.strictEqual(result.beforeSplitting.totalIncome, result.afterSplitting.totalIncome);
});

test('Pension splitting: both spouses can transfer', () => {
  const result = calculatePensionSplitting(60000, 20000, 80000, 30000, 65, 65, 'QC');
  assert.strictEqual(result.eligible, true);
  // Spouse 2 has higher income, should transfer to spouse 1
  assert.strictEqual(result.transfers.spouse1ToSpouse2, 0);
  assert.ok(result.transfers.spouse2ToSpouse1 > 0);
});

// ===== Combined Benefits Tests =====

test('Combined benefits: OAS + GIS for low-income senior', () => {
  const result = calculateCombinedSeniorBenefits(65, 5000, 40, true, null);
  assert.strictEqual(result.oas.eligible, true);
  assert.strictEqual(result.gis.eligible, true);
  assert.ok(result.totalMonthly > 0);
  assert.ok(result.totalAnnual > 0);
  assert.ok(result.effectiveIncome > 5000);
});

test('Combined benefits: OAS only for high-income senior', () => {
  const result = calculateCombinedSeniorBenefits(65, 50000, 40, true, null);
  assert.strictEqual(result.oas.eligible, true);
  assert.strictEqual(result.gis.eligible, false);
  // Only OAS, no GIS
  assert.strictEqual(result.totalMonthly, result.oas.monthlyBenefit);
});

test('Combined benefits: not eligible under age 65', () => {
  const result = calculateCombinedSeniorBenefits(64, 30000, 40, true, null);
  assert.strictEqual(result.oas.eligible, false);
  assert.strictEqual(result.gis.eligible, false);
  assert.strictEqual(result.totalMonthly, 0);
  assert.strictEqual(result.totalAnnual, 0);
});

test('Combined benefits: couple with both receiving OAS', () => {
  const result = calculateCombinedSeniorBenefits(
    65,
    8000,
    40,
    false,
    { receivesOAS: true, income: 6000 }
  );
  assert.strictEqual(result.oas.eligible, true);
  assert.strictEqual(result.gis.eligible, true);
  assert.ok(result.totalAnnual > 0);
});

test('Combined benefits: partial OAS with GIS', () => {
  const result = calculateCombinedSeniorBenefits(65, 3000, 20, true, null);
  assert.strictEqual(result.oas.eligible, true);
  assert.strictEqual(result.oas.isPartialBenefit, true);
  assert.strictEqual(result.gis.eligible, true);
});

// ===== Validation Tests =====

test('Validation: valid inputs pass', () => {
  const result = validateSeniorBenefitInputs(65, 50000, 40);
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.errors.length, 0);
});

test('Validation: age under 60 fails', () => {
  const result = validateSeniorBenefitInputs(59, 50000, 40);
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.some(e => e.includes('60 years old')));
});

test('Validation: age over 120 fails', () => {
  const result = validateSeniorBenefitInputs(121, 50000, 40);
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.some(e => e.includes('Invalid age')));
});

test('Validation: negative income fails', () => {
  const result = validateSeniorBenefitInputs(65, -1000, 40);
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.some(e => e.includes('cannot be negative')));
});

test('Validation: negative residence years fails', () => {
  const result = validateSeniorBenefitInputs(65, 50000, -5);
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.some(e => e.includes('Invalid residence')));
});

test('Validation: residence years over 100 fails', () => {
  const result = validateSeniorBenefitInputs(65, 50000, 101);
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.some(e => e.includes('Invalid residence')));
});

// ===== Edge Cases =====

test('Edge case: zero income maximizes GIS', () => {
  const result = calculateGIS(0, true, false, 0);
  assert.strictEqual(result.monthlyBenefit, 1062.01);
});

test('Edge case: exactly at clawback threshold', () => {
  const result = calculateOAS(90997, 40, 65, 0);
  assert.strictEqual(result.clawback, 0);
  assert.strictEqual(result.netBenefit, result.grossBenefit);
});

test('Edge case: one dollar over clawback threshold', () => {
  const result = calculateOAS(90998, 40, 65, 0);
  assert.ok(result.clawback > 0);
  // Clawback = 1 * 0.15 = 0.15
  assert.strictEqual(result.clawback, 0.15);
});

test('Constants: OAS max annual matches monthly * 12', () => {
  const { oas } = SENIORS_BENEFITS_2026;
  assert.strictEqual(Math.round(oas.maxMonthly * 12 * 100) / 100, oas.maxAnnual);
});

test('Constants: GIS single max annual matches monthly * 12', () => {
  const { gis } = SENIORS_BENEFITS_2026;
  assert.strictEqual(Math.round(gis.single.maxMonthly * 12 * 100) / 100, gis.single.maxAnnual);
});
