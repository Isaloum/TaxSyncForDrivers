import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSolidarityCredit,
  calculateWorkPremium,
  calculateCWB,
  calculateFederalBPA,
  calculateQuebecBPA,
} from '../credit-calculator.js';

// Solidarity Credit Tests
test('calculateSolidarityCredit returns number', () => {
  const s = calculateSolidarityCredit(30000);
  assert.strictEqual(typeof s, 'number');
});

test('calculateSolidarityCredit: full credit below phaseout', () => {
  const credit = calculateSolidarityCredit(50000, true);
  assert.strictEqual(credit, 531);
});

test('calculateSolidarityCredit: zero credit above phaseout', () => {
  const credit = calculateSolidarityCredit(65000, true);
  assert.strictEqual(credit, 0);
});

test('calculateSolidarityCredit: partial credit during phaseout', () => {
  const credit = calculateSolidarityCredit(61000, true);
  assert.ok(credit > 0 && credit < 531);
});

test('calculateSolidarityCredit: couple gets double base', () => {
  const single = calculateSolidarityCredit(40000, true);
  const couple = calculateSolidarityCredit(40000, false);
  assert.strictEqual(couple, single * 2);
});

// Work Premium Tests
test('calculateWorkPremium returns number', () => {
  const w = calculateWorkPremium(25000);
  assert.strictEqual(typeof w, 'number');
});

test('calculateWorkPremium: zero below threshold', () => {
  const credit = calculateWorkPremium(5000);
  assert.strictEqual(credit, 0);
});

test('calculateWorkPremium: zero above income limit', () => {
  const credit = calculateWorkPremium(60000);
  assert.strictEqual(credit, 0);
});

test('calculateWorkPremium: capped at max for single', () => {
  const credit = calculateWorkPremium(50000, true);
  assert.strictEqual(credit, 728);
});

test('calculateWorkPremium: higher max with dependents', () => {
  const single = calculateWorkPremium(50000, true);
  const family = calculateWorkPremium(50000, false);
  assert.ok(family > single);
});

// Canada Workers Benefit Tests
test('calculateCWB returns number', () => {
  const c = calculateCWB(20000);
  assert.strictEqual(typeof c, 'number');
});

test('calculateCWB: phase-in below base threshold', () => {
  const credit = calculateCWB(5000, false);
  // 27% of 5000 = 1350, which is less than max 1549
  assert.ok(credit > 0 && credit < 1549);
});

test('calculateCWB: full benefit in plateau range', () => {
  const credit = calculateCWB(20000, false);
  assert.strictEqual(credit, 1549);
});

test('calculateCWB: phase-out reduces benefit', () => {
  const credit = calculateCWB(30000, false);
  assert.ok(credit > 0 && credit < 1549);
});

test('calculateCWB: zero above phaseout', () => {
  const credit = calculateCWB(40000, false);
  assert.strictEqual(credit, 0);
});

test('calculateCWB: higher max with dependents', () => {
  const single = calculateCWB(20000, false);
  const family = calculateCWB(20000, true);
  assert.ok(family > single);
});

// Federal BPA Tests
test('calculateFederalBPA returns number', () => {
  const bpa = calculateFederalBPA(50000);
  assert.strictEqual(typeof bpa, 'number');
});

test('calculateFederalBPA: full credit for low income', () => {
  const credit = calculateFederalBPA(50000);
  // Should be max BPA × 14% = 16452 × 0.14 = 2303.28
  assert.strictEqual(credit, 2303.28);
});

test('calculateFederalBPA: reduced credit for high income', () => {
  const lowIncome = calculateFederalBPA(50000);
  const highIncome = calculateFederalBPA(200000);
  assert.ok(highIncome < lowIncome);
});

test('calculateFederalBPA: minimum credit above phaseout end', () => {
  const credit = calculateFederalBPA(300000);
  // Should be min BPA × 14% = 14829 × 0.14 = 2076.06
  assert.strictEqual(credit, 2076.06);
});

// Quebec BPA Tests
test('calculateQuebecBPA returns number', () => {
  const bpa = calculateQuebecBPA();
  assert.strictEqual(typeof bpa, 'number');
});

test('calculateQuebecBPA: returns correct amount', () => {
  const credit = calculateQuebecBPA();
  // 18952 × 0.14 = 2653.28
  assert.strictEqual(credit, 2653.28);
});
