/**
 * Comprehensive test suite for receipt-storage.js
 * Tests CRA compliance, validation, categorization, and audit trails
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  addReceipt,
  getReceiptsByCategory,
  getReceiptsByYear,
  getTotalByCategory,
  checkThirtyDollarRule,
  exportAuditTrail,
  validateReceipt,
  clearReceipts,
  getAllReceipts,
  getValidCategories,
  getRetentionPeriod,
  getReceiptThreshold
} from '../receipt-storage.js';

describe('Receipt Storage Module', () => {
  beforeEach(() => {
    clearReceipts();
  });

  describe('addReceipt', () => {
    it('should add a valid receipt with all fields', () => {
      const receipt = addReceipt(
        '2024-01-15',
        45.99,
        'Shell Gas Station',
        'fuel',
        'https://example.com/receipt1.jpg'
      );

      assert.ok(receipt.id);
      assert.strictEqual(receipt.amount, 45.99);
      assert.strictEqual(receipt.vendor, 'Shell Gas Station');
      assert.strictEqual(receipt.category, 'fuel');
      assert.strictEqual(receipt.imageUrl, 'https://example.com/receipt1.jpg');
      assert.strictEqual(receipt.meetsThreshold, true);
    });

    it('should add a receipt without imageUrl', () => {
      const receipt = addReceipt('2024-01-15', 25.50, 'Auto Parts Store', 'maintenance');

      assert.strictEqual(receipt.imageUrl, null);
      assert.strictEqual(receipt.amount, 25.50);
      assert.strictEqual(receipt.meetsThreshold, false);
    });

    it('should round amount to 2 decimals', () => {
      const receipt = addReceipt('2024-01-15', 45.999, 'Test Vendor', 'fuel');

      assert.strictEqual(receipt.amount, 46.00);
    });

    it('should trim vendor name', () => {
      const receipt = addReceipt('2024-01-15', 25.50, '  Auto Parts  ', 'maintenance');

      assert.strictEqual(receipt.vendor, 'Auto Parts');
    });

    it('should throw error for invalid category', () => {
      assert.throws(() => {
        addReceipt('2024-01-15', 45.99, 'Vendor', 'invalid-category');
      }, /Invalid category/);
    });

    it('should throw error for missing date', () => {
      assert.throws(() => {
        addReceipt(null, 45.99, 'Vendor', 'fuel');
      }, /Date is required/);
    });

    it('should throw error for missing amount', () => {
      assert.throws(() => {
        addReceipt('2024-01-15', null, 'Vendor', 'fuel');
      }, /Amount is required/);
    });

    it('should throw error for negative amount', () => {
      assert.throws(() => {
        addReceipt('2024-01-15', -10, 'Vendor', 'fuel');
      }, /Amount must be non-negative/);
    });

    it('should throw error for missing vendor', () => {
      assert.throws(() => {
        addReceipt('2024-01-15', 45.99, '', 'fuel');
      }, /Vendor/);
    });

    it('should accept Date object for date parameter', () => {
      const date = new Date('2024-01-15');
      const receipt = addReceipt(date, 45.99, 'Vendor', 'fuel');

      assert.ok(receipt.date instanceof Date);
    });
  });

  describe('validateReceipt', () => {
    it('should validate a correct receipt', () => {
      const receipt = {
        date: '2024-01-15',
        amount: 45.99,
        vendor: 'Shell',
        category: 'fuel',
        imageUrl: 'https://example.com/receipt.jpg'
      };

      const result = validateReceipt(receipt);

      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it('should return errors for invalid receipt', () => {
      const receipt = {
        date: 'invalid-date',
        amount: -10,
        vendor: '',
        category: 'invalid'
      };

      const result = validateReceipt(receipt);

      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.length > 0);
    });

    it('should handle null receipt', () => {
      const result = validateReceipt(null);

      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.includes('Receipt object is required'));
    });
  });

  describe('getReceiptsByCategory', () => {
    beforeEach(() => {
      addReceipt('2024-01-15', 45.99, 'Shell', 'fuel');
      addReceipt('2024-02-20', 150.00, 'Mechanic', 'maintenance');
      addReceipt('2024-03-10', 35.50, 'Shell', 'fuel');
      addReceipt('2023-12-01', 50.00, 'Petro-Canada', 'fuel');
    });

    it('should get all receipts for a category', () => {
      const fuelReceipts = getReceiptsByCategory('fuel');

      assert.strictEqual(fuelReceipts.length, 3);
      assert.ok(fuelReceipts.every(r => r.category === 'fuel'));
    });

    it('should get receipts by category and year', () => {
      const fuel2024 = getReceiptsByCategory('fuel', 2024);

      assert.strictEqual(fuel2024.length, 2);
      assert.ok(fuel2024.every(r => r.category === 'fuel'));
      assert.ok(fuel2024.every(r => r.date.getFullYear() === 2024));
    });

    it('should return empty array for category with no receipts', () => {
      const advertising = getReceiptsByCategory('advertising');

      assert.strictEqual(advertising.length, 0);
    });

    it('should throw error for invalid category', () => {
      assert.throws(() => {
        getReceiptsByCategory('invalid');
      }, /Invalid category/);
    });

    it('should throw error for invalid year', () => {
      assert.throws(() => {
        getReceiptsByCategory('fuel', 'invalid');
      }, /Invalid year/);
    });
  });

  describe('getReceiptsByYear', () => {
    beforeEach(() => {
      addReceipt('2024-01-15', 45.99, 'Shell', 'fuel');
      addReceipt('2023-06-20', 150.00, 'Mechanic', 'maintenance');
      addReceipt('2024-03-10', 35.50, 'Office Depot', 'office');
    });

    it('should get all receipts for a year', () => {
      const receipts2024 = getReceiptsByYear(2024);

      assert.strictEqual(receipts2024.length, 2);
      assert.ok(receipts2024.every(r => r.date.getFullYear() === 2024));
    });

    it('should return empty array for year with no receipts', () => {
      const receipts2020 = getReceiptsByYear(2020);

      assert.strictEqual(receipts2020.length, 0);
    });

    it('should throw error for invalid year', () => {
      assert.throws(() => {
        getReceiptsByYear('2024');
      }, /Invalid year/);
    });
  });

  describe('getTotalByCategory', () => {
    beforeEach(() => {
      addReceipt('2024-01-15', 45.99, 'Shell', 'fuel');
      addReceipt('2024-02-20', 150.00, 'Mechanic', 'maintenance');
      addReceipt('2024-03-10', 35.50, 'Shell', 'fuel');
      addReceipt('2023-12-01', 50.00, 'Petro-Canada', 'fuel');
    });

    it('should calculate total for category across all years', () => {
      const fuelTotal = getTotalByCategory('fuel');

      assert.strictEqual(fuelTotal, 131.49);
    });

    it('should calculate total for category in specific year', () => {
      const fuel2024 = getTotalByCategory('fuel', 2024);

      assert.strictEqual(fuel2024, 81.49);
    });

    it('should return 0 for category with no receipts', () => {
      const advertisingTotal = getTotalByCategory('advertising');

      assert.strictEqual(advertisingTotal, 0);
    });

    it('should round total to 2 decimals', () => {
      clearReceipts();
      addReceipt('2024-01-15', 10.333, 'Vendor1', 'fuel');
      addReceipt('2024-01-16', 20.666, 'Vendor2', 'fuel');

      const total = getTotalByCategory('fuel');

      assert.strictEqual(total, 31.00);
    });
  });

  describe('checkThirtyDollarRule', () => {
    it('should pass when all receipts over $30 have images', () => {
      const receipts = [
        { id: 1, amount: 45.99, imageUrl: 'https://example.com/receipt1.jpg' },
        { id: 2, amount: 25.00, imageUrl: null },
        { id: 3, amount: 150.00, imageUrl: 'https://example.com/receipt2.jpg' }
      ];

      const result = checkThirtyDollarRule(receipts);

      assert.strictEqual(result.compliant, true);
      assert.strictEqual(result.receiptsOverThreshold, 2);
      assert.strictEqual(result.receiptsWithImages, 2);
      assert.strictEqual(result.receiptsWithoutImages, 0);
      assert.strictEqual(result.missingReceipts.length, 0);
    });

    it('should fail when receipts over $30 lack images', () => {
      const receipts = [
        { id: 1, amount: 45.99, imageUrl: null, vendor: 'Shell', category: 'fuel', date: new Date() },
        { id: 2, amount: 25.00, imageUrl: null, vendor: 'Store', category: 'supplies', date: new Date() }
      ];

      const result = checkThirtyDollarRule(receipts);

      assert.strictEqual(result.compliant, false);
      assert.strictEqual(result.receiptsWithoutImages, 1);
      assert.strictEqual(result.missingReceipts.length, 1);
      assert.strictEqual(result.missingReceipts[0].id, 1);
    });

    it('should handle receipts exactly at $30 threshold', () => {
      const receipts = [
        { id: 1, amount: 30.00, imageUrl: null },
        { id: 2, amount: 30.01, imageUrl: null, vendor: 'Test', category: 'fuel', date: new Date() }
      ];

      const result = checkThirtyDollarRule(receipts);

      assert.strictEqual(result.receiptsOverThreshold, 1);
      assert.strictEqual(result.compliant, false);
    });

    it('should throw error for non-array input', () => {
      assert.throws(() => {
        checkThirtyDollarRule('not an array');
      }, /Receipts must be an array/);
    });

    it('should handle empty array', () => {
      const result = checkThirtyDollarRule([]);

      assert.strictEqual(result.compliant, true);
      assert.strictEqual(result.totalReceipts, 0);
    });
  });

  describe('exportAuditTrail', () => {
    beforeEach(() => {
      addReceipt('2024-01-15', 45.99, 'Shell', 'fuel', 'https://example.com/r1.jpg');
      addReceipt('2024-02-20', 150.00, 'Mechanic', 'maintenance', 'https://example.com/r2.jpg');
      addReceipt('2024-03-10', 35.50, 'Shell', 'fuel', 'https://example.com/r3.jpg');
      addReceipt('2023-12-01', 50.00, 'Petro-Canada', 'fuel');
    });

    it('should generate audit trail for a year', () => {
      const audit = exportAuditTrail(2024);

      assert.strictEqual(audit.year, 2024);
      assert.strictEqual(audit.summary.totalReceipts, 3);
      assert.strictEqual(audit.summary.totalAmount, 231.49);
      assert.strictEqual(audit.receipts.length, 3);
    });

    it('should include retention status', () => {
      const audit = exportAuditTrail(2024);

      assert.ok(audit.retentionStatus);
      assert.strictEqual(audit.retentionStatus.withinRetentionPeriod, true);
      assert.strictEqual(audit.retentionStatus.retentionPeriodYears, 6);
      assert.strictEqual(audit.retentionStatus.expiryYear, 2030);
    });

    it('should calculate category totals', () => {
      const audit = exportAuditTrail(2024);

      assert.strictEqual(audit.summary.categoryTotals.fuel, 81.49);
      assert.strictEqual(audit.summary.categoryTotals.maintenance, 150.00);
      assert.strictEqual(audit.summary.categoryTotals.advertising, 0);
    });

    it('should include compliance information', () => {
      const audit = exportAuditTrail(2024);

      assert.ok(audit.compliance);
      assert.strictEqual(audit.compliance.meetsThirtyDollarRule, true);
      assert.strictEqual(audit.compliance.receiptsOverThreshold, 3);
    });

    it('should identify old receipts outside retention period', () => {
      const currentYear = new Date().getFullYear();
      const oldYear = currentYear - 7;

      const audit = exportAuditTrail(oldYear);

      assert.strictEqual(audit.retentionStatus.withinRetentionPeriod, false);
      assert.strictEqual(audit.retentionStatus.yearsRetained, 7);
    });

    it('should throw error for invalid year', () => {
      assert.throws(() => {
        exportAuditTrail('invalid');
      }, /Invalid year/);
    });

    it('should group receipts by category', () => {
      const audit = exportAuditTrail(2024);

      assert.ok(audit.byCategory);
      assert.strictEqual(audit.byCategory.fuel.length, 2);
      assert.strictEqual(audit.byCategory.maintenance.length, 1);
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle a typical driver month of receipts', () => {
      // Fuel receipts
      addReceipt('2024-01-05', 65.00, 'Shell', 'fuel', 'https://example.com/f1.jpg');
      addReceipt('2024-01-12', 58.50, 'Esso', 'fuel', 'https://example.com/f2.jpg');
      addReceipt('2024-01-20', 72.25, 'Petro-Canada', 'fuel', 'https://example.com/f3.jpg');
      addReceipt('2024-01-28', 61.75, 'Shell', 'fuel', 'https://example.com/f4.jpg');

      // Maintenance
      addReceipt('2024-01-15', 89.99, 'Oil Change', 'maintenance', 'https://example.com/m1.jpg');

      // Insurance
      addReceipt('2024-01-01', 250.00, 'Insurance Co', 'insurance', 'https://example.com/i1.jpg');

      // Supplies
      addReceipt('2024-01-10', 15.99, 'Car Wash', 'supplies');

      const audit = exportAuditTrail(2024);

      assert.strictEqual(audit.summary.totalReceipts, 7);
      assert.strictEqual(audit.summary.categoryTotals.fuel, 257.50);
      assert.strictEqual(audit.compliance.meetsThirtyDollarRule, true);
    });

    it('should identify compliance issues in mixed receipt set', () => {
      addReceipt('2024-01-05', 65.00, 'Shell', 'fuel'); // Missing image
      addReceipt('2024-01-12', 25.00, 'Car Wash', 'supplies'); // Under threshold, ok
      addReceipt('2024-01-20', 150.00, 'Mechanic', 'maintenance', 'https://example.com/m1.jpg');

      const audit = exportAuditTrail(2024);

      assert.strictEqual(audit.compliance.meetsThirtyDollarRule, false);
      assert.strictEqual(audit.compliance.missingReceipts.length, 1);
      assert.strictEqual(audit.compliance.missingReceipts[0].amount, 65.00);
    });

    it('should handle year-end tax preparation', () => {
      // Add receipts across multiple categories
      for (let month = 1; month <= 12; month++) {
        addReceipt(`2024-${String(month).padStart(2, '0')}-15`, 60.00, 'Shell', 'fuel', 'https://example.com/f.jpg');
      }
      addReceipt('2024-06-01', 500.00, 'Insurance', 'insurance', 'https://example.com/i.jpg');
      addReceipt('2024-08-15', 300.00, 'Mechanic', 'maintenance', 'https://example.com/m.jpg');

      const audit = exportAuditTrail(2024);

      assert.strictEqual(audit.summary.totalReceipts, 14);
      assert.strictEqual(audit.summary.categoryTotals.fuel, 720.00);
      assert.strictEqual(audit.summary.categoryTotals.insurance, 500.00);
      assert.strictEqual(audit.summary.categoryTotals.maintenance, 300.00);
      assert.strictEqual(audit.summary.totalAmount, 1520.00);
    });
  });

  describe('Edge cases', () => {
    it('should handle zero amount receipt', () => {
      const receipt = addReceipt('2024-01-15', 0, 'Vendor', 'fuel');

      assert.strictEqual(receipt.amount, 0);
      assert.strictEqual(receipt.meetsThreshold, false);
    });

    it('should handle very large amounts', () => {
      const receipt = addReceipt('2024-01-15', 9999.99, 'Expensive Repair', 'maintenance', 'https://example.com/r.jpg');

      assert.strictEqual(receipt.amount, 9999.99);
      assert.strictEqual(receipt.meetsThreshold, true);
    });

    it('should handle receipts on leap year date', () => {
      const receipt = addReceipt('2024-02-29', 45.99, 'Shell', 'fuel');

      assert.strictEqual(receipt.date.getDate(), 29);
      assert.strictEqual(receipt.date.getMonth(), 1); // February
    });

    it('should handle vendor names with special characters', () => {
      const receipt = addReceipt('2024-01-15', 45.99, "Joe's Auto & Repair Co.", 'maintenance');

      assert.strictEqual(receipt.vendor, "Joe's Auto & Repair Co.");
    });

    it('should handle all valid categories', () => {
      const categories = getValidCategories();

      categories.forEach((cat, index) => {
        const receipt = addReceipt('2024-01-15', 10.00, `Vendor ${index}`, cat);
        assert.strictEqual(receipt.category, cat);
      });

      assert.strictEqual(getAllReceipts().length, categories.length);
    });
  });

  describe('Utility functions', () => {
    it('should return valid categories', () => {
      const categories = getValidCategories();

      assert.ok(categories.includes('fuel'));
      assert.ok(categories.includes('maintenance'));
      assert.ok(categories.includes('insurance'));
      assert.strictEqual(categories.length, 8);
    });

    it('should return retention period', () => {
      assert.strictEqual(getRetentionPeriod(), 6);
    });

    it('should return receipt threshold', () => {
      assert.strictEqual(getReceiptThreshold(), 30);
    });

    it('should clear all receipts', () => {
      addReceipt('2024-01-15', 45.99, 'Shell', 'fuel');
      addReceipt('2024-02-20', 150.00, 'Mechanic', 'maintenance');

      clearReceipts();

      assert.strictEqual(getAllReceipts().length, 0);
    });

    it('should get all receipts', () => {
      addReceipt('2024-01-15', 45.99, 'Shell', 'fuel');
      addReceipt('2024-02-20', 150.00, 'Mechanic', 'maintenance');

      const all = getAllReceipts();

      assert.strictEqual(all.length, 2);
    });
  });
});
