// tests/receipt-manager.test.js — Tests for Receipt Manager
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { ReceiptManager } from '../receipt-manager.js';

// Mock localStorage for Node.js testing
global.localStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  },
  removeItem(key) {
    delete this.data[key];
  },
  clear() {
    this.data = {};
  }
};

// Mock File and FileReader for Node.js
global.File = class File {
  constructor(content, name, options = {}) {
    this.content = content;
    this.name = name;
    this.size = content.length;
    this.type = options.type || 'application/octet-stream';
  }
};

global.FileReader = class FileReader {
  readAsDataURL(file) {
    // Simulate async file reading
    setTimeout(() => {
      if (file.size > 5 * 1024 * 1024) {
        this.onerror(new Error('File too large'));
      } else {
        // Create a mock base64 string
        const base64 = Buffer.from(file.content).toString('base64');
        this.result = `data:${file.type};base64,${base64}`;
        this.onload();
      }
    }, 0);
  }
};

describe('ReceiptManager Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('calculateRetentionDate', () => {
    it('should calculate retention date correctly (6 years from tax year)', () => {
      const retentionDate = ReceiptManager.calculateRetentionDate('2025-06-15');
      assert.strictEqual(retentionDate, '2031-12-31'); // 6 years from 2025
    });

    it('should handle different dates in the same year', () => {
      assert.strictEqual(ReceiptManager.calculateRetentionDate('2025-01-01'), '2031-12-31');
      assert.strictEqual(ReceiptManager.calculateRetentionDate('2025-12-31'), '2031-12-31');
    });

    it('should handle different years', () => {
      assert.strictEqual(ReceiptManager.calculateRetentionDate('2020-06-15'), '2026-12-31');
      assert.strictEqual(ReceiptManager.calculateRetentionDate('2024-06-15'), '2030-12-31');
    });
  });

  describe('validateReceiptRequired', () => {
    it('should return false for expenses <= $75', () => {
      assert.strictEqual(ReceiptManager.validateReceiptRequired(50), false);
      assert.strictEqual(ReceiptManager.validateReceiptRequired(75), false);
      assert.strictEqual(ReceiptManager.validateReceiptRequired(74.99), false);
    });

    it('should return true for expenses > $75', () => {
      assert.strictEqual(ReceiptManager.validateReceiptRequired(75.01), true);
      assert.strictEqual(ReceiptManager.validateReceiptRequired(100), true);
      assert.strictEqual(ReceiptManager.validateReceiptRequired(1000), true);
    });
  });

  describe('fileToBase64', () => {
    it('should reject files over 5MB', async () => {
      const largeContent = 'x'.repeat(6 * 1024 * 1024);
      const largeFile = new File(largeContent, 'large.jpg', { type: 'image/jpeg' });
      
      await assert.rejects(
        async () => await ReceiptManager.fileToBase64(largeFile),
        /File too large/
      );
    });

    it('should accept files under 5MB', async () => {
      const smallContent = 'test data';
      const smallFile = new File(smallContent, 'small.jpg', { type: 'image/jpeg' });
      
      const result = await ReceiptManager.fileToBase64(smallFile);
      assert.ok(result.startsWith('data:image/jpeg;base64,'));
    });
  });

  describe('saveReceipt and getReceipt', () => {
    it('should save and retrieve receipt', async () => {
      const expense = {
        date: '2025-01-20',
        amount: 85.50,
        vendor: 'Shell Gas Station',
        category: 'fuel',
        description: 'Premium fuel - Montreal'
      };
      
      const file = new File('receipt data', 'shell-jan20-2026.jpg', { type: 'image/jpeg' });
      
      const receiptId = await ReceiptManager.saveReceipt(expense, file);
      assert.ok(receiptId.startsWith('receipt-'));
      
      const receipt = ReceiptManager.getReceipt(receiptId);
      assert.ok(receipt);
      assert.strictEqual(receipt.id, receiptId);
      assert.strictEqual(receipt.expense.amount, 85.50);
      assert.strictEqual(receipt.expense.vendor, 'Shell Gas Station');
      assert.strictEqual(receipt.metadata.auditStatus, 'active');
    });
  });

  describe('getAllReceipts', () => {
    it('should return empty array when no receipts exist', () => {
      const receipts = ReceiptManager.getAllReceipts();
      assert.strictEqual(Array.isArray(receipts), true);
      assert.strictEqual(receipts.length, 0);
    });

    it('should return all saved receipts', async () => {
      const expense1 = { date: '2025-01-20', amount: 85.50, vendor: 'Shell', category: 'fuel' };
      const expense2 = { date: '2025-02-15', amount: 120.00, vendor: 'Mechanic', category: 'maintenance' };
      
      const file1 = new File('data1', 'receipt1.jpg', { type: 'image/jpeg' });
      const file2 = new File('data2', 'receipt2.jpg', { type: 'image/jpeg' });
      
      await ReceiptManager.saveReceipt(expense1, file1);
      await ReceiptManager.saveReceipt(expense2, file2);
      
      const receipts = ReceiptManager.getAllReceipts();
      assert.strictEqual(receipts.length, 2);
    });
  });

  describe('deleteReceipt', () => {
    it('should delete receipt by ID', async () => {
      const expense = { date: '2025-01-20', amount: 85.50, vendor: 'Shell', category: 'fuel' };
      const file = new File('data', 'receipt.jpg', { type: 'image/jpeg' });
      
      const receiptId = await ReceiptManager.saveReceipt(expense, file);
      assert.strictEqual(ReceiptManager.getAllReceipts().length, 1);
      
      const deleted = ReceiptManager.deleteReceipt(receiptId);
      assert.strictEqual(deleted, true);
      assert.strictEqual(ReceiptManager.getAllReceipts().length, 0);
    });

    it('should return false when deleting non-existent receipt', () => {
      const deleted = ReceiptManager.deleteReceipt('non-existent-id');
      assert.strictEqual(deleted, false);
    });
  });

  describe('getReceiptsByYear', () => {
    it('should filter receipts by year', async () => {
      const expense2024 = { date: '2024-06-15', amount: 50, vendor: 'Vendor A', category: 'fuel' };
      const expense2025_1 = { date: '2025-01-20', amount: 85, vendor: 'Vendor B', category: 'fuel' };
      const expense2025_2 = { date: '2025-12-31', amount: 100, vendor: 'Vendor C', category: 'maintenance' };
      
      const file = new File('data', 'receipt.jpg', { type: 'image/jpeg' });
      
      await ReceiptManager.saveReceipt(expense2024, file);
      await ReceiptManager.saveReceipt(expense2025_1, file);
      await ReceiptManager.saveReceipt(expense2025_2, file);
      
      const receipts2025 = ReceiptManager.getReceiptsByYear(2025);
      assert.strictEqual(receipts2025.length, 2);
      
      const receipts2024 = ReceiptManager.getReceiptsByYear(2024);
      assert.strictEqual(receipts2024.length, 1);
    });
  });

  describe('getReceiptsByCategory', () => {
    it('should filter receipts by category', async () => {
      const expenseFuel = { date: '2025-01-20', amount: 85, vendor: 'Shell', category: 'fuel' };
      const expenseMaintenance = { date: '2025-02-15', amount: 120, vendor: 'Mechanic', category: 'maintenance' };
      
      const file = new File('data', 'receipt.jpg', { type: 'image/jpeg' });
      
      await ReceiptManager.saveReceipt(expenseFuel, file);
      await ReceiptManager.saveReceipt(expenseMaintenance, file);
      
      const fuelReceipts = ReceiptManager.getReceiptsByCategory('fuel');
      assert.strictEqual(fuelReceipts.length, 1);
      assert.strictEqual(fuelReceipts[0].expense.category, 'fuel');
    });
  });

  describe('getReceiptsOverAmount', () => {
    it('should filter receipts by amount threshold', async () => {
      const expense1 = { date: '2025-01-20', amount: 50, vendor: 'Vendor A', category: 'fuel' };
      const expense2 = { date: '2025-02-15', amount: 85, vendor: 'Vendor B', category: 'fuel' };
      const expense3 = { date: '2025-03-10', amount: 150, vendor: 'Vendor C', category: 'maintenance' };
      
      const file = new File('data', 'receipt.jpg', { type: 'image/jpeg' });
      
      await ReceiptManager.saveReceipt(expense1, file);
      await ReceiptManager.saveReceipt(expense2, file);
      await ReceiptManager.saveReceipt(expense3, file);
      
      const receiptsOver75 = ReceiptManager.getReceiptsOverAmount(75);
      assert.strictEqual(receiptsOver75.length, 2);
    });
  });

  describe('checkRetentionStatus', () => {
    it('should return retention status for receipt', async () => {
      const expense = { date: '2025-01-20', amount: 85, vendor: 'Shell', category: 'fuel' };
      const file = new File('data', 'receipt.jpg', { type: 'image/jpeg' });
      
      const receiptId = await ReceiptManager.saveReceipt(expense, file);
      const status = ReceiptManager.checkRetentionStatus(receiptId);
      
      assert.ok(status);
      assert.strictEqual(status.retainUntil, '2031-12-31');
      assert.strictEqual(status.status, 'active');
      assert.strictEqual(status.isExpired, false);
      assert.ok(status.daysUntilExpiry > 0);
    });

    it('should return null for non-existent receipt', () => {
      const status = ReceiptManager.checkRetentionStatus('non-existent-id');
      assert.strictEqual(status, null);
    });
  });

  describe('generateReceiptReport', () => {
    it('should generate CSV report for receipts', async () => {
      const expense = { date: '2025-01-20', amount: 85.50, vendor: 'Shell', category: 'fuel' };
      const file = new File('data', 'receipt.jpg', { type: 'image/jpeg' });
      
      await ReceiptManager.saveReceipt(expense, file);
      
      const report = ReceiptManager.generateReceiptReport(2025);
      assert.ok(report.includes('Receipt ID,Date,Vendor,Category,Amount'));
      assert.ok(report.includes('Shell'));
      assert.ok(report.includes('85.5'));
    });
  });
});
