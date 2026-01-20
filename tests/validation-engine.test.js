// tests/validation-engine.test.js — Tests for data validation
import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  isValidAmount,
  isValidDate,
  validateT4,
  validateRL1,
  validatePlatformSummary,
  validateExpenseReceipt,
  isDuplicate,
  categorizeExpense,
  getQuarter,
} from '../validation-engine.js';
import { DOCUMENT_TYPES } from '../pattern-library.js';

describe('Validation Engine Tests', () => {
  describe('isValidAmount', () => {
    it('should validate amounts within range', () => {
      assert.strictEqual(isValidAmount(100, 0, 1000), true);
      assert.strictEqual(isValidAmount(0, 0, 1000), true);
      assert.strictEqual(isValidAmount(1000, 0, 1000), true);
    });

    it('should reject amounts outside range', () => {
      assert.strictEqual(isValidAmount(-1, 0, 1000), false);
      assert.strictEqual(isValidAmount(1001, 0, 1000), false);
    });

    it('should reject non-numeric values', () => {
      assert.strictEqual(isValidAmount('100', 0, 1000), false);
      assert.strictEqual(isValidAmount(NaN, 0, 1000), false);
      assert.strictEqual(isValidAmount(null, 0, 1000), false);
    });
  });

  describe('isValidDate', () => {
    it('should validate dates in current year', () => {
      const currentYear = new Date().getFullYear();
      assert.strictEqual(isValidDate(`01/15/${currentYear}`), true);
      assert.strictEqual(isValidDate(`12/31/${currentYear}`), true);
    });

    it('should validate dates in recent years', () => {
      const currentYear = new Date().getFullYear();
      assert.strictEqual(isValidDate(`01/15/${currentYear - 1}`), true);
      assert.strictEqual(isValidDate(`01/15/${currentYear - 2}`), true);
    });

    it('should reject dates too far in the past', () => {
      const currentYear = new Date().getFullYear();
      // Default is 5 years back, so 6 years should be rejected
      assert.strictEqual(isValidDate(`01/15/${currentYear - 6}`), false);
    });

    it('should accept dates within 5 years for tax documents', () => {
      const currentYear = new Date().getFullYear();
      // Tax documents from 5 years ago should be accepted
      assert.strictEqual(isValidDate(`01/15/${currentYear - 5}`), true);
      assert.strictEqual(isValidDate(`01/15/${currentYear - 3}`), true);
    });

    it('should handle various date formats', () => {
      const currentYear = new Date().getFullYear();
      assert.strictEqual(isValidDate(`${currentYear}-01-15`), true);
      assert.strictEqual(isValidDate(`1/15/${currentYear}`), true);
    });

    it('should reject invalid dates', () => {
      assert.strictEqual(isValidDate('not-a-date'), false);
      assert.strictEqual(isValidDate(''), false);
      assert.strictEqual(isValidDate(null), false);
    });
  });

  describe('validateT4', () => {
    it('should validate correct T4 data', () => {
      const data = {
        employmentIncome: 52000,
        cpp: 2898,
        ei: 815,
        incomeTax: 9500,
        year: new Date().getFullYear(),
      };
      const result = validateT4(data);
      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it('should reject T4 with no employment income', () => {
      const data = {
        cpp: 2898,
        ei: 815,
      };
      const result = validateT4(data);
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.length > 0);
    });

    it('should warn on unusually high deductions', () => {
      const data = {
        employmentIncome: 50000,
        cpp: 25000, // Unrealistically high
        ei: 815,
      };
      const result = validateT4(data);
      assert.ok(result.warnings.length > 0);
    });

    it('should have lower confidence score with warnings', () => {
      const data = {
        employmentIncome: 600000, // Very high
        cpp: 2898,
      };
      const result = validateT4(data);
      assert.ok(result.confidenceScore < 100);
    });
  });

  describe('validateRL1', () => {
    it('should validate correct RL-1 data', () => {
      const data = {
        employmentIncome: 48000,
        qpp: 2750,
        ei: 755,
        ppip: 250,
        incomeTax: 8200,
      };
      const result = validateRL1(data);
      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it('should reject RL-1 with no employment income', () => {
      const data = {
        qpp: 2750,
      };
      const result = validateRL1(data);
      assert.strictEqual(result.isValid, false);
    });
  });

  describe('validatePlatformSummary', () => {
    it('should validate Uber summary data', () => {
      const data = {
        grossFares: 1250,
        tips: 150,
        distance: 350,
        netEarnings: 1075,
        period: 'Jan 15 - Jan 21, 2025',
      };
      const result = validatePlatformSummary(data);
      assert.strictEqual(result.isValid, true);
    });

    it('should allow zero amounts for inactive periods', () => {
      const data = {
        grossFares: 0,
        tips: 0,
        distance: 6,
        period: '2024',
      };
      const result = validatePlatformSummary(data);
      assert.strictEqual(result.isValid, true);
      // Should NOT warn about all fields being zero since distance is 6
      const hasAllZeroWarning = result.warnings.some((w) => w.includes('All fields are zero'));
      assert.strictEqual(hasAllZeroWarning, false);
    });

    it('should warn when all fields are truly zero', () => {
      const data = {
        grossFares: 0,
        tips: 0,
        distance: 0,
        netEarnings: 0,
        period: '2024',
      };
      const result = validatePlatformSummary(data);
      assert.strictEqual(result.isValid, true);
      assert.ok(result.warnings.some((w) => w.includes('All fields are zero')));
    });

    it('should validate year range (2020-2030)', () => {
      const data = {
        grossFares: 1250,
        period: '2024',
      };
      const result = validatePlatformSummary(data);
      assert.strictEqual(result.isValid, true);
      // Year 2024 should be valid, no warnings about year
      const hasYearWarning = result.warnings.some((w) => w.includes('Year'));
      assert.strictEqual(hasYearWarning, false);
    });

    it('should warn on year outside reasonable range', () => {
      const data = {
        grossFares: 1250,
        period: '2035',
      };
      const result = validatePlatformSummary(data);
      assert.ok(result.warnings.some((w) => w.includes('Year') && w.includes('2035')));
    });

    it('should reject when net exceeds gross', () => {
      const data = {
        grossFares: 1000,
        netEarnings: 1500, // More than gross
      };
      const result = validatePlatformSummary(data);
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some((e) => e.includes('Net earnings cannot exceed')));
    });

    it('should warn on missing period', () => {
      const data = {
        grossFares: 1250,
      };
      const result = validatePlatformSummary(data);
      assert.ok(result.warnings.some((w) => w.includes('period')));
    });
  });

  describe('validateExpenseReceipt', () => {
    it('should validate gas receipt', () => {
      const data = {
        total: 65.98,
        liters: 45.5,
        date: '01/15/2025',
        station: 'Shell',
      };
      const result = validateExpenseReceipt(data, DOCUMENT_TYPES.GAS_RECEIPT);
      assert.strictEqual(result.isValid, true);
    });

    it('should warn on unusual gas amount', () => {
      const data = {
        total: 1000, // Very high for gas
        date: '01/15/2025',
      };
      const result = validateExpenseReceipt(data, DOCUMENT_TYPES.GAS_RECEIPT);
      assert.ok(result.warnings.length > 0);
    });

    it('should reject receipt with no amount', () => {
      const data = {
        date: '01/15/2025',
      };
      const result = validateExpenseReceipt(data, DOCUMENT_TYPES.GAS_RECEIPT);
      assert.strictEqual(result.isValid, false);
    });
  });

  describe('isDuplicate', () => {
    it('should detect duplicate T4', () => {
      const newData = {
        employmentIncome: 52000,
        year: 2025,
        employerName: 'Acme Corp',
      };
      const existing = [
        {
          employmentIncome: 52000,
          year: 2025,
          employerName: 'Acme Corp',
        },
      ];
      const result = isDuplicate(newData, existing, DOCUMENT_TYPES.T4);
      assert.strictEqual(result, true);
    });

    it('should not flag different T4s as duplicate', () => {
      const newData = {
        employmentIncome: 52000,
        year: 2025,
        employerName: 'Acme Corp',
      };
      const existing = [
        {
          employmentIncome: 48000,
          year: 2025,
          employerName: 'Different Corp',
        },
      ];
      const result = isDuplicate(newData, existing, DOCUMENT_TYPES.T4);
      assert.strictEqual(result, false);
    });
  });

  describe('categorizeExpense', () => {
    it('should categorize gas as business', () => {
      const category = categorizeExpense(DOCUMENT_TYPES.GAS_RECEIPT, {});
      assert.strictEqual(category, 'business');
    });

    it('should categorize phone as mixed', () => {
      const category = categorizeExpense(DOCUMENT_TYPES.PHONE_BILL, {});
      assert.strictEqual(category, 'mixed');
    });

    it('should categorize meal as business', () => {
      const category = categorizeExpense(DOCUMENT_TYPES.MEAL_RECEIPT, {});
      assert.strictEqual(category, 'business');
    });
  });

  describe('getQuarter', () => {
    it('should return Q1 for Jan-Mar', () => {
      assert.strictEqual(getQuarter('2025-01-15'), 1);
      assert.strictEqual(getQuarter('2025-02-15'), 1);
      assert.strictEqual(getQuarter('2025-03-15'), 1);
    });

    it('should return Q2 for Apr-Jun', () => {
      assert.strictEqual(getQuarter('2025-04-15'), 2);
      assert.strictEqual(getQuarter('2025-05-15'), 2);
      assert.strictEqual(getQuarter('2025-06-15'), 2);
    });

    it('should return Q3 for Jul-Sep', () => {
      assert.strictEqual(getQuarter('2025-07-15'), 3);
      assert.strictEqual(getQuarter('2025-08-15'), 3);
      assert.strictEqual(getQuarter('2025-09-15'), 3);
    });

    it('should return Q4 for Oct-Dec', () => {
      assert.strictEqual(getQuarter('2025-10-15'), 4);
      assert.strictEqual(getQuarter('2025-11-15'), 4);
      assert.strictEqual(getQuarter('2025-12-15'), 4);
    });
  });
});
