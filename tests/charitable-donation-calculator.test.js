import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCharitableCredit,
  verifyCharityRegistration,
  trackDonationsByCharity,
  validateDonation,
  calculateDonationTaxSavings,
} from '../charitable-donation-calculator.js';

// Charitable Credit Tests
test('calculateCharitableCredit returns correct structure', () => {
  const result = calculateCharitableCredit(1000);
  assert.strictEqual(typeof result, 'object');
  assert.ok('totalDonations' in result);
  assert.ok('federalCredit' in result);
  assert.ok('quebecCredit' in result);
  assert.ok('totalCredit' in result);
  assert.ok('firstTierAmount' in result);
  assert.ok('secondTierAmount' in result);
});

test('calculateCharitableCredit: example from problem statement', () => {
  // $1,000 donation
  // Federal: $200 × 15% + $800 × 29% = $30 + $232 = $262
  // Quebec: $1,000 × 25% = $250
  // Total: $512
  const result = calculateCharitableCredit(1000);
  assert.strictEqual(result.firstTierAmount, 200);
  assert.strictEqual(result.secondTierAmount, 800);
  assert.strictEqual(result.federalCredit, 262);
  assert.strictEqual(result.quebecCredit, 250);
  assert.strictEqual(result.totalCredit, 512);
});

test('calculateCharitableCredit: small donation under $200', () => {
  // $100 donation
  // Federal: $100 × 15% = $15
  // Quebec: $100 × 25% = $25
  // Total: $40
  const result = calculateCharitableCredit(100);
  assert.strictEqual(result.firstTierAmount, 100);
  assert.strictEqual(result.secondTierAmount, 0);
  assert.strictEqual(result.federalCredit, 15);
  assert.strictEqual(result.quebecCredit, 25);
  assert.strictEqual(result.totalCredit, 40);
});

test('calculateCharitableCredit: exactly $200', () => {
  const result = calculateCharitableCredit(200);
  assert.strictEqual(result.firstTierAmount, 200);
  assert.strictEqual(result.secondTierAmount, 0);
  assert.strictEqual(result.federalCredit, 30); // 200 × 15%
  assert.strictEqual(result.quebecCredit, 50); // 200 × 25%
});

test('calculateCharitableCredit: large donation', () => {
  // $5,000 donation
  // Federal: $200 × 15% + $4,800 × 29% = $30 + $1,392 = $1,422
  // Quebec: $5,000 × 25% = $1,250
  const result = calculateCharitableCredit(5000);
  assert.strictEqual(result.firstTierAmount, 200);
  assert.strictEqual(result.secondTierAmount, 4800);
  assert.strictEqual(result.federalCredit, 1422);
  assert.strictEqual(result.quebecCredit, 1250);
  assert.strictEqual(result.totalCredit, 2672);
});

test('calculateCharitableCredit: zero donation', () => {
  const result = calculateCharitableCredit(0);
  assert.strictEqual(result.totalDonations, 0);
  assert.strictEqual(result.federalCredit, 0);
  assert.strictEqual(result.quebecCredit, 0);
  assert.strictEqual(result.totalCredit, 0);
});

test('calculateCharitableCredit: negative donation treated as zero', () => {
  const result = calculateCharitableCredit(-100);
  assert.strictEqual(result.totalCredit, 0);
});

// Charity Registration Verification Tests
test('verifyCharityRegistration: valid RR number passes', () => {
  const result = verifyCharityRegistration('123456789RR0001');
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.errors.length, 0);
  assert.strictEqual(result.format.businessNumber, '123456789');
  assert.strictEqual(result.format.type, 'RR');
  assert.strictEqual(result.format.reference, '0001');
  assert.strictEqual(result.format.formatted, '123456789-RR-0001');
});

test('verifyCharityRegistration: lowercase rr converted to uppercase', () => {
  const result = verifyCharityRegistration('123456789rr0001');
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.format.type, 'RR');
});

test('verifyCharityRegistration: with spaces and hyphens', () => {
  const result = verifyCharityRegistration('123456789-RR-0001');
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.format.formatted, '123456789-RR-0001');
});

test('verifyCharityRegistration: invalid format fails', () => {
  const result = verifyCharityRegistration('123456789');
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.some(e => e.includes('Invalid')));
});

test('verifyCharityRegistration: wrong suffix fails', () => {
  const result = verifyCharityRegistration('123456789XX0001');
  assert.strictEqual(result.isValid, false);
});

test('verifyCharityRegistration: empty string fails', () => {
  const result = verifyCharityRegistration('');
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.some(e => e.includes('required')));
});

// Track by Charity Tests
test('trackDonationsByCharity groups donations correctly', () => {
  const donations = [
    { charityName: 'Red Cross', amount: 200, registrationNumber: '123456789RR0001' },
    { charityName: 'United Way', amount: 300, registrationNumber: '987654321RR0001' },
    { charityName: 'Red Cross', amount: 150, registrationNumber: '123456789RR0001' },
  ];
  
  const result = trackDonationsByCharity(donations);
  assert.strictEqual(result.charities['Red Cross'].total, 350);
  assert.strictEqual(result.charities['United Way'].total, 300);
  assert.strictEqual(result.grandTotal, 650);
  assert.strictEqual(result.numberOfCharities, 2);
});

test('trackDonationsByCharity handles unknown charity', () => {
  const donations = [
    { amount: 100 },
  ];
  
  const result = trackDonationsByCharity(donations);
  assert.ok('Unknown' in result.charities);
});

test('trackDonationsByCharity includes donation metadata', () => {
  const donations = [
    { 
      charityName: 'Red Cross', 
      amount: 200, 
      registrationNumber: '123456789RR0001',
      date: '2026-01-15',
      receiptNumber: 'RC-12345',
    },
  ];
  
  const result = trackDonationsByCharity(donations);
  const donation = result.charities['Red Cross'].donations[0];
  assert.strictEqual(donation.amount, 200);
  assert.strictEqual(donation.date, '2026-01-15');
  assert.strictEqual(donation.receiptNumber, 'RC-12345');
});

// Validation Tests
test('validateDonation: valid donation passes', () => {
  const result = validateDonation(100, 'Red Cross', '123456789RR0001');
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.errors.length, 0);
});

test('validateDonation: negative amount fails', () => {
  const result = validateDonation(-100, 'Red Cross', '123456789RR0001');
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.some(e => e.includes('positive')));
});

test('validateDonation: missing charity name fails', () => {
  const result = validateDonation(100, '', '123456789RR0001');
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.some(e => e.includes('name')));
});

test('validateDonation: invalid registration number fails', () => {
  const result = validateDonation(100, 'Red Cross', 'invalid');
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.length > 0);
});

test('validateDonation: registration number optional', () => {
  const result = validateDonation(100, 'Red Cross', '');
  assert.strictEqual(result.isValid, true);
});

// Tax Savings Tests
test('calculateDonationTaxSavings: includes effective rate', () => {
  const result = calculateDonationTaxSavings(1000);
  assert.strictEqual(result.totalDonations, 1000);
  assert.strictEqual(result.totalCredit, 512);
  assert.strictEqual(result.effectiveRate, 51.2); // (512/1000) × 100
  assert.strictEqual(result.netCost, 488); // 1000 - 512
});

test('calculateDonationTaxSavings: zero donation', () => {
  const result = calculateDonationTaxSavings(0);
  assert.strictEqual(result.effectiveRate, 0);
  assert.strictEqual(result.netCost, 0);
});
