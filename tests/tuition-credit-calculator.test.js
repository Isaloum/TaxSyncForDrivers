import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTuitionCredit,
  validateT2202,
  calculateFamilyTransfer,
  getProvincialTuitionInfo,
} from '../tuition-credit-calculator.js';

// Basic Tuition Credit Calculation Tests
test('calculateTuitionCredit returns correct structure', () => {
  const result = calculateTuitionCredit(5000, 'QC');
  assert.strictEqual(typeof result, 'object');
  assert.ok('tuitionFees' in result);
  assert.ok('federalCredit' in result);
  assert.ok('provincialCredit' in result);
  assert.ok('currentYearCredit' in result);
  assert.ok('totalAvailableCredit' in result);
  assert.ok('creditUsedByStudent' in result);
  assert.ok('transferredCredit' in result);
  assert.ok('newCarryForward' in result);
});

test('calculateTuitionCredit: Quebec full-time student', () => {
  // $10,000 tuition, full-time Quebec student
  // Federal: $10,000 × 15% = $1,500
  // Quebec: $10,000 × 28% (8% + 20% full-time) = $2,800
  // Total: $4,300
  const result = calculateTuitionCredit(10000, 'QC', { isFullTime: true });
  assert.strictEqual(result.tuitionFees, 10000);
  assert.strictEqual(result.federalCredit, 1500);
  assert.strictEqual(result.provincialCredit, 2800);
  assert.strictEqual(result.currentYearCredit, 4300);
});

test('calculateTuitionCredit: Quebec part-time student', () => {
  // $10,000 tuition, part-time Quebec student
  // Federal: $10,000 × 15% = $1,500
  // Quebec: $10,000 × 8% (no full-time bonus) = $800
  // Total: $2,300
  const result = calculateTuitionCredit(10000, 'QC', { isFullTime: false });
  assert.strictEqual(result.tuitionFees, 10000);
  assert.strictEqual(result.federalCredit, 1500);
  assert.strictEqual(result.provincialCredit, 800);
  assert.strictEqual(result.currentYearCredit, 2300);
});

test('calculateTuitionCredit: Ontario (no provincial credit)', () => {
  // $10,000 tuition, Ontario student
  // Federal: $10,000 × 15% = $1,500
  // Ontario: $0 (closed after 2017)
  const result = calculateTuitionCredit(10000, 'ON');
  assert.strictEqual(result.federalCredit, 1500);
  assert.strictEqual(result.provincialCredit, 0);
  assert.strictEqual(result.currentYearCredit, 1500);
});

test('calculateTuitionCredit: Alberta (no provincial credit)', () => {
  // $10,000 tuition, Alberta student
  // Federal: $10,000 × 15% = $1,500
  // Alberta: $0 (no provincial credit)
  const result = calculateTuitionCredit(10000, 'AB');
  assert.strictEqual(result.federalCredit, 1500);
  assert.strictEqual(result.provincialCredit, 0);
  assert.strictEqual(result.currentYearCredit, 1500);
});

test('calculateTuitionCredit: BC (no provincial credit)', () => {
  const result = calculateTuitionCredit(10000, 'BC');
  assert.strictEqual(result.federalCredit, 1500);
  assert.strictEqual(result.provincialCredit, 0);
});

test('calculateTuitionCredit: Saskatchewan tiered rates', () => {
  // $15,000 tuition, Saskatchewan
  // Federal: $15,000 × 15% = $2,250
  // Saskatchewan: $9,000 × 10% + $6,000 × 15% = $900 + $900 = $1,800
  const result = calculateTuitionCredit(15000, 'SK');
  assert.strictEqual(result.federalCredit, 2250);
  assert.strictEqual(result.provincialCredit, 1800);
  assert.strictEqual(result.currentYearCredit, 4050);
});

test('calculateTuitionCredit: Saskatchewan below tier threshold', () => {
  // $5,000 tuition (below $9,000 threshold)
  // Saskatchewan: $5,000 × 10% = $500
  const result = calculateTuitionCredit(5000, 'SK');
  assert.strictEqual(result.provincialCredit, 500);
});

test('calculateTuitionCredit: Manitoba', () => {
  // $10,000 tuition, Manitoba
  // Federal: $10,000 × 15% = $1,500
  // Manitoba: $10,000 × 10.8% = $1,080
  const result = calculateTuitionCredit(10000, 'MB');
  assert.strictEqual(result.federalCredit, 1500);
  assert.strictEqual(result.provincialCredit, 1080);
});

test('calculateTuitionCredit: Atlantic provinces', () => {
  // Test New Brunswick
  const nbResult = calculateTuitionCredit(10000, 'NB');
  assert.strictEqual(nbResult.federalCredit, 1500);
  assert.strictEqual(nbResult.provincialCredit, 1000); // 10%

  // Test Nova Scotia
  const nsResult = calculateTuitionCredit(10000, 'NS');
  assert.strictEqual(nsResult.provincialCredit, 879); // 8.79%

  // Test PEI
  const peResult = calculateTuitionCredit(10000, 'PE');
  assert.strictEqual(peResult.provincialCredit, 983); // 9.83%

  // Test Newfoundland
  const nlResult = calculateTuitionCredit(10000, 'NL');
  assert.strictEqual(nlResult.provincialCredit, 875); // 8.75%
});

test('calculateTuitionCredit: Territories match federal rate', () => {
  // Yukon
  const ytResult = calculateTuitionCredit(10000, 'YT');
  assert.strictEqual(ytResult.federalCredit, 1500);
  assert.strictEqual(ytResult.provincialCredit, 1500); // 15% matches federal

  // Northwest Territories
  const ntResult = calculateTuitionCredit(10000, 'NT');
  assert.strictEqual(ntResult.provincialCredit, 1500);

  // Nunavut
  const nuResult = calculateTuitionCredit(10000, 'NU');
  assert.strictEqual(nuResult.provincialCredit, 1500);
});

test('calculateTuitionCredit: zero tuition', () => {
  const result = calculateTuitionCredit(0, 'QC');
  assert.strictEqual(result.tuitionFees, 0);
  assert.strictEqual(result.federalCredit, 0);
  assert.strictEqual(result.provincialCredit, 0);
  assert.strictEqual(result.currentYearCredit, 0);
});

test('calculateTuitionCredit: negative tuition treated as zero', () => {
  const result = calculateTuitionCredit(-1000, 'QC');
  assert.strictEqual(result.tuitionFees, 0);
  assert.strictEqual(result.federalCredit, 0);
});

// Carryforward Tests
test('calculateTuitionCredit: with carryforward amount', () => {
  // $5,000 tuition + $2,000 carryforward
  // Federal: $750
  // QC full-time: $1,400
  // Current year: $2,150
  // Total available: $2,150 + $2,000 = $4,150
  const result = calculateTuitionCredit(5000, 'QC', {
    isFullTime: true,
    carryForwardAmount: 2000,
    taxOwing: 1000,
  });
  
  assert.strictEqual(result.currentYearCredit, 2150);
  assert.strictEqual(result.totalAvailableCredit, 4150);
  assert.strictEqual(result.creditUsedByStudent, 1000); // Limited by tax owing
  assert.strictEqual(result.newCarryForward, 3150); // Unused credit carries forward
});

test('calculateTuitionCredit: carryforward used against tax', () => {
  // Student owes $3,000 in tax
  // Has $2,000 carryforward + $1,500 current year federal = $3,500 total
  // Should use $3,000 against tax, carry forward $500
  const result = calculateTuitionCredit(10000, 'ON', {
    carryForwardAmount: 2000,
    taxOwing: 3000,
  });
  
  assert.strictEqual(result.currentYearCredit, 1500); // Federal only for ON
  assert.strictEqual(result.totalAvailableCredit, 3500);
  assert.strictEqual(result.creditUsedByStudent, 3000);
  assert.strictEqual(result.newCarryForward, 500);
});

// Transfer to Family Tests
test('calculateTuitionCredit: transfer to family member', () => {
  // $10,000 tuition, student owes $500 tax
  // Federal credit: $1,500
  // QC credit (full-time): $2,800
  // Total: $4,300
  // Uses $500, can transfer max $750 (federal limit), carries forward rest
  const result = calculateTuitionCredit(10000, 'QC', {
    isFullTime: true,
    taxOwing: 500,
    transferToFamily: true,
  });
  
  assert.strictEqual(result.currentYearCredit, 4300);
  assert.strictEqual(result.creditUsedByStudent, 500);
  assert.strictEqual(result.transferredCredit, 750); // Max transfer
  assert.strictEqual(result.newCarryForward, 3050); // Remainder
});

test('calculateTuitionCredit: transfer limited to unused amount', () => {
  // Student owes $4,000 tax, credit is $4,300
  // Uses $4,000, only $300 unused
  // Transfer limited to $300 (less than max $750)
  const result = calculateTuitionCredit(10000, 'QC', {
    isFullTime: true,
    taxOwing: 4000,
    transferToFamily: true,
  });
  
  assert.strictEqual(result.creditUsedByStudent, 4000);
  assert.strictEqual(result.transferredCredit, 300); // Limited by unused amount
  assert.strictEqual(result.newCarryForward, 0);
});

test('calculateTuitionCredit: no transfer when not requested', () => {
  // Even with unused credit, if transfer not requested, all goes to carryforward
  const result = calculateTuitionCredit(10000, 'QC', {
    isFullTime: true,
    taxOwing: 500,
    transferToFamily: false,
  });
  
  assert.strictEqual(result.transferredCredit, 0);
  assert.strictEqual(result.newCarryForward, 3800); // All unused credit
});

test('calculateTuitionCredit: transfer limited to federal credit', () => {
  // $10,000 tuition generates $1,500 federal credit
  // Even though max transfer is $750, can't transfer more than federal credit
  // Student owes $0, so all credit is unused
  const result = calculateTuitionCredit(10000, 'QC', {
    isFullTime: true,
    taxOwing: 0,
    transferToFamily: true,
  });
  
  // Can transfer max $750 (limit), rest carries forward
  assert.strictEqual(result.transferredCredit, 750);
  assert.strictEqual(result.newCarryForward, 3550);
});

// T2202 Validation Tests
test('validateT2202: valid slip passes', () => {
  const slipData = {
    tuitionFees: 8000,
    studentName: 'John Smith',
    institutionName: 'University of Montreal',
    fullTimeMonths: 8,
    partTimeMonths: 0,
    year: '2026',
  };
  
  const result = validateT2202(slipData);
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.errors.length, 0);
});

test('validateT2202: missing required fields', () => {
  const slipData = {
    tuitionFees: 8000,
    studentName: '',
    institutionName: '',
  };
  
  const result = validateT2202(slipData);
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.some(e => e.includes('Student name')));
  assert.ok(result.errors.some(e => e.includes('Institution name')));
});

test('validateT2202: negative tuition fails', () => {
  const slipData = {
    tuitionFees: -1000,
    studentName: 'John Smith',
    institutionName: 'University',
  };
  
  const result = validateT2202(slipData);
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.some(e => e.includes('positive number')));
});

test('validateT2202: zero tuition warning', () => {
  const slipData = {
    tuitionFees: 0,
    studentName: 'John Smith',
    institutionName: 'University',
    year: '2026',
  };
  
  const result = validateT2202(slipData);
  assert.strictEqual(result.isValid, true);
  assert.ok(result.warnings.some(w => w.includes('$0')));
});

test('validateT2202: high tuition warning', () => {
  const slipData = {
    tuitionFees: 60000,
    studentName: 'John Smith',
    institutionName: 'University',
    year: '2026',
  };
  
  const result = validateT2202(slipData);
  assert.strictEqual(result.isValid, true);
  assert.ok(result.warnings.some(w => w.includes('$50,000')));
});

test('validateT2202: invalid months', () => {
  const slipData1 = {
    tuitionFees: 5000,
    studentName: 'John Smith',
    institutionName: 'University',
    fullTimeMonths: 15, // Invalid: > 12
    year: '2026',
  };
  
  const result1 = validateT2202(slipData1);
  assert.strictEqual(result1.isValid, false);
  assert.ok(result1.errors.some(e => e.includes('0 and 12')));

  const slipData2 = {
    tuitionFees: 5000,
    studentName: 'John Smith',
    institutionName: 'University',
    fullTimeMonths: 8,
    partTimeMonths: 6, // Total exceeds 12
    year: '2026',
  };
  
  const result2 = validateT2202(slipData2);
  assert.strictEqual(result2.isValid, false);
  assert.ok(result2.errors.some(e => e.includes('cannot exceed 12')));
});

test('validateT2202: no months warning', () => {
  const slipData = {
    tuitionFees: 5000,
    studentName: 'John Smith',
    institutionName: 'University',
    fullTimeMonths: 0,
    partTimeMonths: 0,
    year: '2026',
  };
  
  const result = validateT2202(slipData);
  assert.strictEqual(result.isValid, true);
  assert.ok(result.warnings.some(w => w.includes('enrollment months')));
});

test('validateT2202: invalid year', () => {
  const slipData = {
    tuitionFees: 5000,
    studentName: 'John Smith',
    institutionName: 'University',
    year: '1999', // Too old
  };
  
  const result = validateT2202(slipData);
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.some(e => e.includes('Invalid tax year')));
});

test('validateT2202: null data', () => {
  const result = validateT2202(null);
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.some(e => e.includes('required')));
});

// Family Transfer Calculation Tests
test('calculateFamilyTransfer: basic transfer', () => {
  // Student has $2,000 credit, owes $500 tax
  // Uses $500, can transfer up to $750 of remaining $1,500
  const result = calculateFamilyTransfer(2000, 500);
  
  assert.strictEqual(result.totalCredit, 2000);
  assert.strictEqual(result.taxOwing, 500);
  assert.strictEqual(result.creditUsedByStudent, 500);
  assert.strictEqual(result.unusedCredit, 1500);
  assert.strictEqual(result.transferAmount, 750); // Max transfer
  assert.strictEqual(result.remainingCarryForward, 750);
});

test('calculateFamilyTransfer: transfer limited by unused amount', () => {
  // Student has $1,000 credit, owes $700 tax
  // Uses $700, only $300 remaining
  // Transfer limited to $300 (less than max $750)
  const result = calculateFamilyTransfer(1000, 700);
  
  assert.strictEqual(result.creditUsedByStudent, 700);
  assert.strictEqual(result.unusedCredit, 300);
  assert.strictEqual(result.transferAmount, 300);
  assert.strictEqual(result.remainingCarryForward, 0);
});

test('calculateFamilyTransfer: all credit used by student', () => {
  // Student has $1,000 credit, owes $1,500 tax
  // Uses all $1,000, nothing to transfer
  const result = calculateFamilyTransfer(1000, 1500);
  
  assert.strictEqual(result.creditUsedByStudent, 1000);
  assert.strictEqual(result.unusedCredit, 0);
  assert.strictEqual(result.transferAmount, 0);
  assert.strictEqual(result.remainingCarryForward, 0);
});

test('calculateFamilyTransfer: no tax owing', () => {
  // Student has $2,000 credit, owes $0 tax
  // All credit unused, can transfer max $750
  const result = calculateFamilyTransfer(2000, 0);
  
  assert.strictEqual(result.creditUsedByStudent, 0);
  assert.strictEqual(result.unusedCredit, 2000);
  assert.strictEqual(result.transferAmount, 750);
  assert.strictEqual(result.remainingCarryForward, 1250);
});

test('calculateFamilyTransfer: handles negative inputs', () => {
  const result = calculateFamilyTransfer(-100, -50);
  assert.strictEqual(result.totalCredit, 0);
  assert.strictEqual(result.taxOwing, 0);
});

test('calculateFamilyTransfer: maximum transfer is $750', () => {
  const result = calculateFamilyTransfer(5000, 0);
  assert.strictEqual(result.maxTransferable, 750);
  assert.strictEqual(result.transferAmount, 750);
});

// Provincial Info Tests
test('getProvincialTuitionInfo: Quebec', () => {
  const info = getProvincialTuitionInfo('QC');
  assert.strictEqual(info.province, 'QC');
  assert.strictEqual(info.hasProvincialCredit, true);
  assert.strictEqual(info.rate, 0.08);
  assert.ok(info.description.includes('8%'));
  assert.ok(info.specialRules.includes('Full-time'));
});

test('getProvincialTuitionInfo: Ontario', () => {
  const info = getProvincialTuitionInfo('ON');
  assert.strictEqual(info.hasProvincialCredit, false);
  assert.strictEqual(info.rate, 0);
  assert.ok(info.description.includes('No provincial'));
});

test('getProvincialTuitionInfo: Saskatchewan', () => {
  const info = getProvincialTuitionInfo('SK');
  assert.strictEqual(info.hasProvincialCredit, true);
  assert.ok(info.description.includes('10%'));
  assert.ok(info.description.includes('15%'));
  assert.ok(info.specialRules.includes('Tiered'));
});

test('getProvincialTuitionInfo: Manitoba', () => {
  const info = getProvincialTuitionInfo('MB');
  assert.strictEqual(info.hasProvincialCredit, true);
  assert.strictEqual(info.rate, 0.108);
});

test('getProvincialTuitionInfo: default to Quebec for unknown province', () => {
  const info = getProvincialTuitionInfo('XX');
  assert.strictEqual(info.province, 'XX');
  assert.strictEqual(info.hasProvincialCredit, true);
  assert.strictEqual(info.rate, 0.08);
});
