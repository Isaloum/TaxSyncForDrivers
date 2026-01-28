import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateCCB, estimateCCBEligibility, calculateAFNI } from '../canada-child-benefit-calculator.js';

test('CCB: Single child under 6, low income - full benefit', () => {
  const result = calculateCCB(30000, [{ age: 3, hasDisability: false }]);
  
  assert.strictEqual(result.totalChildren, 1);
  assert.strictEqual(result.childrenUnder6, 1);
  assert.strictEqual(result.totalAnnualCCB, 7787); // Full amount
  assert.strictEqual(result.monthlyPayment, 648.92);
  assert.strictEqual(result.reductionAmount, 0);
});

test('CCB: Single child 6-17, low income - full benefit', () => {
  const result = calculateCCB(30000, [{ age: 10, hasDisability: false }]);
  
  assert.strictEqual(result.children6to17, 1);
  assert.strictEqual(result.totalAnnualCCB, 6570);
  assert.strictEqual(result.monthlyPayment, 547.5);
});

test('CCB: Two children (one under 6, one 6-17), income $50,000', () => {
  const result = calculateCCB(50000, [
    { age: 4, hasDisability: false },
    { age: 9, hasDisability: false }
  ]);
  
  // Base: $7,787 + $6,570 = $14,357
  // Reduction: ($50,000 - $35,000) * 7% * 2 = $2,100
  // Net: $14,357 - $2,100 = $12,257
  assert.ok(result.totalAnnualCCB > 12200 && result.totalAnnualCCB < 12300);
  assert.strictEqual(result.totalChildren, 2);
});

test('CCB: Child with disability - includes CDB supplement', () => {
  const result = calculateCCB(40000, [{ age: 8, hasDisability: true }]);
  
  // Base: $6,570
  // CDB: $3,322
  // Reduction on base only (income $40k)
  assert.ok(result.disabilitySupplement === 3322);
  assert.ok(result.totalAnnualCCB > 9000); // Base + disability - reduction
});

test('CCB: High income family - reduced benefit', () => {
  const result = calculateCCB(150000, [
    { age: 3, hasDisability: false },
    { age: 7, hasDisability: false }
  ]);
  
  // Significant reduction due to high income
  assert.ok(result.reductionAmount > 10000);
  assert.ok(result.totalAnnualCCB < 5000); // Much reduced
});

test('CCB: Very high income - no benefit', () => {
  const result = calculateCCB(300000, [{ age: 5, hasDisability: false }]);
  
  // At very high income, CCB phases out completely
  assert.strictEqual(result.totalAnnualCCB, 0);
  assert.strictEqual(result.monthlyPayment, 0);
});

test('CCB: Empty children array returns zero', () => {
  const result = calculateCCB(50000, []);
  
  assert.strictEqual(result.totalAnnualCCB, 0);
  assert.strictEqual(result.totalChildren, 0);
});

test('CCB: Three children, mixed ages', () => {
  const result = calculateCCB(60000, [
    { age: 2, hasDisability: false },
    { age: 8, hasDisability: false },
    { age: 15, hasDisability: false }
  ]);
  
  assert.strictEqual(result.totalChildren, 3);
  assert.strictEqual(result.childrenUnder6, 1);
  assert.strictEqual(result.children6to17, 2);
  assert.ok(result.totalAnnualCCB > 15000); // Substantial benefit for 3 kids
});

test('estimateCCBEligibility: Low income - eligible', () => {
  const eligible = estimateCCBEligibility(50000, 2);
  assert.strictEqual(eligible, true);
});

test('estimateCCBEligibility: Very high income - not eligible', () => {
  const eligible = estimateCCBEligibility(400000, 1);
  assert.strictEqual(eligible, false);
});

test('calculateAFNI: Single parent', () => {
  const afni = calculateAFNI(60000);
  assert.strictEqual(afni, 60000);
});

test('calculateAFNI: Two-parent family', () => {
  const afni = calculateAFNI(70000, 40000);
  assert.strictEqual(afni, 110000);
});

test('CCB: Breakdown structure', () => {
  const result = calculateCCB(30000, [
    { age: 3, hasDisability: false },
    { age: 8, hasDisability: true }
  ]);
  
  assert.strictEqual(result.breakdown.length, 2);
  assert.strictEqual(result.breakdown[0].childNumber, 1);
  assert.strictEqual(result.breakdown[0].age, 3);
  assert.strictEqual(result.breakdown[0].ageGroup, 'Under 6');
  assert.strictEqual(result.breakdown[0].baseAmount, 7787);
  assert.strictEqual(result.breakdown[0].hasDisability, false);
  
  assert.strictEqual(result.breakdown[1].childNumber, 2);
  assert.strictEqual(result.breakdown[1].hasDisability, true);
  assert.strictEqual(result.breakdown[1].disabilitySupplement, 3322);
});

test('CCB: Disability reduction at high income', () => {
  const result = calculateCCB(100000, [{ age: 5, hasDisability: true }]);
  
  // Should have disability supplement
  assert.strictEqual(result.disabilitySupplement, 3322);
  
  // Should have disability reduction due to income over $73,000
  assert.ok(result.disabilityReduction > 0);
  
  // Total CCB should account for disability reduction
  const expectedTotal = result.baseAmount - result.reductionAmount + 
                        result.disabilitySupplement - result.disabilityReduction;
  assert.strictEqual(result.totalAnnualCCB, Math.round(expectedTotal * 100) / 100);
});

test('CCB: Phase 1 reduction only (income between $35k-$73k)', () => {
  const result = calculateCCB(50000, [{ age: 5, hasDisability: false }]);
  
  // Income: $50,000
  // Phase 1: ($50,000 - $35,000) * 7% * 1 child = $1,050
  const expectedReduction = (50000 - 35000) * 0.07 * 1;
  assert.strictEqual(result.reductionAmount, expectedReduction);
});

test('CCB: Phase 1 and Phase 2 reduction (income over $73k)', () => {
  const result = calculateCCB(90000, [{ age: 5, hasDisability: false }]);
  
  // Phase 1: ($73,000 - $35,000) * 7% * 1 = $2,660
  // Phase 2: ($90,000 - $73,000) * 3.2% * 1 = $544
  // Total: $3,204
  const phase1 = (73000 - 35000) * 0.07 * 1;
  const phase2 = (90000 - 73000) * 0.032 * 1;
  const expectedReduction = Math.round((phase1 + phase2) * 100) / 100;
  assert.strictEqual(result.reductionAmount, expectedReduction);
});

test('CCB: Returns correct structure for empty children', () => {
  const result = calculateCCB(50000, []);
  
  assert.strictEqual(typeof result, 'object');
  assert.ok('totalAnnualCCB' in result);
  assert.ok('monthlyPayment' in result);
  assert.ok('childrenUnder6' in result);
  assert.ok('children6to17' in result);
  assert.ok('totalChildren' in result);
  assert.ok('baseAmount' in result);
  assert.ok('reductionAmount' in result);
  assert.ok('disabilitySupplement' in result);
  assert.ok('disabilityReduction' in result);
  assert.ok('breakdown' in result);
  assert.strictEqual(Array.isArray(result.breakdown), true);
});

test('CCB: Child at age boundary (age 6)', () => {
  const result = calculateCCB(30000, [{ age: 6, hasDisability: false }]);
  
  // Age 6 should use the 6-17 rate
  assert.strictEqual(result.children6to17, 1);
  assert.strictEqual(result.childrenUnder6, 0);
  assert.strictEqual(result.baseAmount, 6570);
});

test('CCB: Multiple children with disabilities', () => {
  const result = calculateCCB(40000, [
    { age: 5, hasDisability: true },
    { age: 10, hasDisability: true }
  ]);
  
  // Two children with disabilities
  assert.strictEqual(result.disabilitySupplement, 3322 * 2);
  
  // Verify breakdown
  assert.strictEqual(result.breakdown[0].disabilitySupplement, 3322);
  assert.strictEqual(result.breakdown[1].disabilitySupplement, 3322);
});
