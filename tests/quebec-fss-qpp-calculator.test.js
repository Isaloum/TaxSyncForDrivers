import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QuebecFSSQPPCalculator } from '../quebec-fss-qpp-calculator.js';

// ===== FSS CALCULATION TESTS =====
test('FSS: Tier 1 - Income $50,000 should use 1.00% rate', () => {
  const result = QuebecFSSQPPCalculator.calculateFSS(50000);
  assert.strictEqual(result.tier, 1);
  assert.strictEqual(result.rate, 0.01);
  assert.strictEqual(result.ratePercentage, '1.00%');
  assert.strictEqual(result.amount, 500); // 50000 * 0.01
});

test('FSS: Tier 1 - Income at threshold $100,000 should use 1.00% rate', () => {
  const result = QuebecFSSQPPCalculator.calculateFSS(100000);
  assert.strictEqual(result.tier, 1);
  assert.strictEqual(result.rate, 0.01);
  assert.strictEqual(result.amount, 1000); // 100000 * 0.01
});

test('FSS: Tier 2 - Income $150,000 should use graduated rates', () => {
  const result = QuebecFSSQPPCalculator.calculateFSS(150000);
  assert.strictEqual(result.tier, 2);
  assert.strictEqual(result.rate, 0.0165);
  assert.strictEqual(result.ratePercentage, '1.65%');
  // Tier 1: 100000 * 0.01 = 1000
  // Tier 2: 50000 * 0.0165 = 825
  // Total: 1825
  assert.strictEqual(result.amount, 1825);
});

test('FSS: Tier 2 - Income at threshold $1,000,000', () => {
  const result = QuebecFSSQPPCalculator.calculateFSS(1000000);
  assert.strictEqual(result.tier, 2);
  // Tier 1: 100000 * 0.01 = 1000
  // Tier 2: 900000 * 0.0165 = 14850
  // Total: 15850
  assert.strictEqual(result.amount, 15850);
});

test('FSS: Tier 3 - Income $2,000,000 should use all three tiers', () => {
  const result = QuebecFSSQPPCalculator.calculateFSS(2000000);
  assert.strictEqual(result.tier, 3);
  assert.strictEqual(result.rate, 0.02);
  assert.strictEqual(result.ratePercentage, '2.00%');
  // Tier 1: 100000 * 0.01 = 1000
  // Tier 2: 900000 * 0.0165 = 14850
  // Tier 3: 1000000 * 0.02 = 20000
  // Total: 35850
  assert.strictEqual(result.amount, 35850);
});

test('FSS: Zero income returns zero', () => {
  const result = QuebecFSSQPPCalculator.calculateFSS(0);
  assert.strictEqual(result.amount, 0);
  assert.strictEqual(result.tier, 1);
});

// ===== QPP CALCULATION TESTS =====
test('QPP: Income below exemption $3,000 returns zero', () => {
  const result = QuebecFSSQPPCalculator.calculateQPP(3000);
  assert.strictEqual(result.baseContribution, 0);
  assert.strictEqual(result.additionalContribution, 0);
  assert.strictEqual(result.totalQPP, 0);
});

test('QPP: Income at exemption $3,500 returns zero', () => {
  const result = QuebecFSSQPPCalculator.calculateQPP(3500);
  assert.strictEqual(result.baseContribution, 0);
  assert.strictEqual(result.additionalContribution, 0);
  assert.strictEqual(result.totalQPP, 0);
});

test('QPP: Income $50,000 - base contribution only', () => {
  const result = QuebecFSSQPPCalculator.calculateQPP(50000);
  // Base income: 50000 - 3500 = 46500
  // Base contribution: 46500 * 0.128 = 5952
  assert.strictEqual(result.baseIncome, 46500);
  assert.strictEqual(result.baseContribution, 5952);
  assert.strictEqual(result.additionalContribution, 0);
  assert.strictEqual(result.totalQPP, 5952);
  assert.strictEqual(result.maxReached, false);
});

test('QPP: Income $68,500 - at max base threshold', () => {
  const result = QuebecFSSQPPCalculator.calculateQPP(68500);
  // Base income: 68500 - 3500 = 65000
  // Base contribution: 65000 * 0.128 = 8320
  // But this exceeds max contribution of 8244.60
  assert.strictEqual(result.baseIncome, 65000);
  assert.strictEqual(result.baseContribution, 8320);
  assert.strictEqual(result.additionalContribution, 0);
  assert.strictEqual(result.totalQPP, 8244.60); // Max contribution applied
  assert.strictEqual(result.maxReached, true);
});

test('QPP: Income $70,000 - includes additional contribution', () => {
  const result = QuebecFSSQPPCalculator.calculateQPP(70000);
  // Base income: 68500 - 3500 = 65000
  // Base contribution: 65000 * 0.128 = 8320
  // Additional income: 70000 - 68500 = 1500
  // Additional contribution: 1500 * 0.02 = 30
  // Total before max: 8320 + 30 = 8350
  // Max applied: 8244.60
  assert.strictEqual(result.baseIncome, 65000);
  assert.strictEqual(result.additionalIncome, 1500);
  assert.strictEqual(result.baseContribution, 8320);
  assert.strictEqual(result.additionalContribution, 30);
  assert.strictEqual(result.totalQPP, 8244.60); // Max contribution applied
  assert.strictEqual(result.maxReached, true);
});

test('QPP: Income $73,200 - at max additional threshold', () => {
  const result = QuebecFSSQPPCalculator.calculateQPP(73200);
  // Additional income: min(73200 - 68500, 73200 - 68500) = 4700
  assert.strictEqual(result.additionalIncome, 4700);
  assert.strictEqual(result.additionalContribution, 94); // 4700 * 0.02
  assert.strictEqual(result.totalQPP, 8244.60); // Max contribution
  assert.strictEqual(result.maxReached, true);
});

test('QPP: Income above max additional $100,000', () => {
  const result = QuebecFSSQPPCalculator.calculateQPP(100000);
  // Additional income capped at 73200 - 68500 = 4700
  assert.strictEqual(result.additionalIncome, 4700);
  assert.strictEqual(result.totalQPP, 8244.60); // Max contribution
  assert.strictEqual(result.maxReached, true);
});

// ===== COMBINED CALCULATION TESTS =====
test('Combined: $50,000 income - FSS + QPP', () => {
  const result = QuebecFSSQPPCalculator.calculate(50000);
  // FSS: 500
  // QPP: 5952
  // Total: 6452
  assert.strictEqual(result.fss.amount, 500);
  assert.strictEqual(result.qpp.totalQPP, 5952);
  assert.strictEqual(result.total, 6452);
  assert.strictEqual(result.netBusinessIncome, 50000);
  assert.ok(result.effectiveRate > 12.9 && result.effectiveRate < 12.91); // ~12.904%
});

test('Combined: $150,000 income - FSS tier 2 + QPP max', () => {
  const result = QuebecFSSQPPCalculator.calculate(150000);
  // FSS: 1825
  // QPP: 8244.60 (max)
  // Total: 10069.60
  assert.strictEqual(result.fss.amount, 1825);
  assert.strictEqual(result.qpp.totalQPP, 8244.60);
  assert.strictEqual(result.total, 10069.60);
  assert.ok(result.effectiveRate > 6.71 && result.effectiveRate < 6.72); // ~6.713%
});

test('Combined: $2,000,000 income - FSS tier 3 + QPP max', () => {
  const result = QuebecFSSQPPCalculator.calculate(2000000);
  // FSS: 35850
  // QPP: 8244.60 (max)
  // Total: 44094.60
  assert.strictEqual(result.fss.amount, 35850);
  assert.strictEqual(result.qpp.totalQPP, 8244.60);
  assert.strictEqual(result.total, 44094.60);
  assert.ok(result.effectiveRate > 2.2 && result.effectiveRate < 2.21); // ~2.205%
});

test('Combined: $0 income returns zero', () => {
  const result = QuebecFSSQPPCalculator.calculate(0);
  assert.strictEqual(result.fss.amount, 0);
  assert.strictEqual(result.qpp.totalQPP, 0);
  assert.strictEqual(result.total, 0);
  assert.strictEqual(result.effectiveRate, 0);
});

// ===== PAYMENT INFO TESTS =====
test('Payment info returns correct structure', () => {
  const paymentInfo = QuebecFSSQPPCalculator.getPaymentInfo();
  assert.ok(paymentInfo.fss);
  assert.ok(paymentInfo.qpp);
  assert.strictEqual(paymentInfo.fss.form, 'TP-1');
  assert.strictEqual(paymentInfo.qpp.form, 'TP-1 (Schedule L)');
  assert.ok(paymentInfo.fss.link.includes('revenuquebec.ca'));
  assert.ok(paymentInfo.qpp.link.includes('rrq.gouv.qc.ca'));
});

// ===== EDGE CASES =====
test('Edge case: Very small income $100', () => {
  const result = QuebecFSSQPPCalculator.calculate(100);
  assert.strictEqual(result.fss.amount, 1); // 100 * 0.01
  assert.strictEqual(result.qpp.totalQPP, 0); // Below exemption
  assert.strictEqual(result.total, 1);
});

test('Edge case: Income just above exemption $4,000', () => {
  const result = QuebecFSSQPPCalculator.calculate(4000);
  assert.strictEqual(result.fss.amount, 40); // 4000 * 0.01
  // QPP: (4000 - 3500) * 0.128 = 64
  assert.strictEqual(result.qpp.baseContribution, 64);
  assert.strictEqual(result.total, 104);
});
