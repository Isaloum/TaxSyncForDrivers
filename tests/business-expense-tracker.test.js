// tests/business-expense-tracker.test.js — Tests for business expense tracking
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { BusinessExpenseTracker, EXPENSE_CATEGORIES } from '../business-expense-tracker.js';

describe('Business Expense Tracker Tests', () => {
  describe('EXPENSE_CATEGORIES', () => {
    it('should have valid T2125 line codes', () => {
      assert.ok(EXPENSE_CATEGORIES.ADVERTISING);
      assert.strictEqual(EXPENSE_CATEGORIES.ADVERTISING.code, '8521');
      assert.strictEqual(EXPENSE_CATEGORIES.ADVERTISING.deductionRate, 1.0);
    });

    it('should have 50% deduction for meals and entertainment', () => {
      assert.strictEqual(EXPENSE_CATEGORIES.MEALS_ENTERTAINMENT.deductionRate, 0.5);
    });
  });

  describe('BusinessExpenseTracker', () => {
    it('should initialize with empty expenses', () => {
      const tracker = new BusinessExpenseTracker();
      assert.strictEqual(tracker.expenses.length, 0);
      assert.strictEqual(tracker.getTotalDeductions(), 0);
    });

    it('should add expense and categorize correctly', () => {
      const tracker = new BusinessExpenseTracker();
      const receipt = {
        date: '2024-01-15',
        vendor: 'Staples',
        amount: 100.00,
        rawText: 'Staples office supplies paper pens',
      };

      const expense = tracker.addExpense(receipt);
      
      assert.strictEqual(expense.category, 'SUPPLIES');
      assert.strictEqual(expense.amount, 100);
      assert.strictEqual(expense.deductibleAmount, 100);
      assert.strictEqual(tracker.expenses.length, 1);
    });

    it('should apply 50% deduction for meals', () => {
      const tracker = new BusinessExpenseTracker();
      const receipt = {
        date: '2024-01-15',
        vendor: 'Restaurant ABC',
        amount: 100.00,
        rawText: 'restaurant dinner client meeting',
      };

      const expense = tracker.addExpense(receipt);
      
      assert.strictEqual(expense.category, 'MEALS_ENTERTAINMENT');
      assert.strictEqual(expense.amount, 100);
      assert.strictEqual(expense.deductibleAmount, 50);
    });

    it('should categorize software expenses as OFFICE', () => {
      const tracker = new BusinessExpenseTracker();
      const receipt = {
        date: '2024-01-15',
        vendor: 'Adobe Inc',
        amount: 52.99,
        rawText: 'adobe creative cloud subscription monthly',
      };

      const expense = tracker.addExpense(receipt);
      
      assert.strictEqual(expense.category, 'OFFICE');
      assert.strictEqual(expense.deductibleAmount, 52.99);
    });

    it('should categorize professional fees correctly', () => {
      const tracker = new BusinessExpenseTracker();
      const receipt = {
        date: '2024-01-15',
        vendor: 'Smith & Associates CPA',
        amount: 500.00,
        rawText: 'accountant professional fee tax preparation',
      };

      const expense = tracker.addExpense(receipt);
      
      assert.strictEqual(expense.category, 'FEES');
    });

    it('should categorize advertising expenses', () => {
      const tracker = new BusinessExpenseTracker();
      const receipt = {
        date: '2024-01-15',
        vendor: 'Google Ads',
        amount: 250.00,
        rawText: 'google ads advertising campaign',
      };

      const expense = tracker.addExpense(receipt);
      
      assert.strictEqual(expense.category, 'ADVERTISING');
    });

    it('should calculate total deductions correctly', () => {
      const tracker = new BusinessExpenseTracker();
      
      tracker.addExpense({ amount: 100, vendor: 'Staples', rawText: 'office supplies' });
      tracker.addExpense({ amount: 50, vendor: 'Restaurant', rawText: 'restaurant dinner' });
      tracker.addExpense({ amount: 200, vendor: 'Adobe', rawText: 'adobe subscription' });
      
      // First expense: 100 (SUPPLIES, 100% deductible)
      // Second expense: 50 (MEALS, 50% deductible = 25)
      // Third expense: 200 (OFFICE, 100% deductible)
      const total = tracker.getTotalDeductions();
      assert.strictEqual(total, 325);
    });

    it('should generate category breakdown', () => {
      const tracker = new BusinessExpenseTracker();
      
      tracker.addExpense({ amount: 100, vendor: 'Staples', rawText: 'office' });
      tracker.addExpense({ amount: 50, vendor: 'Staples', rawText: 'office' });
      tracker.addExpense({ amount: 200, vendor: 'Adobe', rawText: 'adobe' });
      
      const breakdown = tracker.getCategoryBreakdown();
      
      assert.ok(breakdown.length > 0);
      const suppliesCategory = breakdown.find(c => c.category === 'Supplies');
      assert.ok(suppliesCategory);
      assert.strictEqual(suppliesCategory.count, 2);
      assert.strictEqual(suppliesCategory.total, 150);
    });

    it('should generate T2125 summary', () => {
      const tracker = new BusinessExpenseTracker();
      
      tracker.addExpense({ amount: 100, vendor: 'Staples', rawText: 'office' });
      tracker.addExpense({ amount: 50, vendor: 'Restaurant', rawText: 'restaurant' });
      
      const summary = tracker.generateT2125Summary(10000);
      
      assert.strictEqual(summary.grossIncome, 10000);
      assert.strictEqual(summary.totalExpenses, 125); // 100 + (50 * 0.5)
      assert.strictEqual(summary.netIncome, 9875);
      assert.strictEqual(summary.expenseCount, 2);
    });

    it('should export data for tax filing', () => {
      const tracker = new BusinessExpenseTracker();
      
      tracker.addExpense({ amount: 100, vendor: 'Staples', rawText: 'office' });
      
      const exportData = tracker.exportForTaxFiling();
      
      assert.ok(exportData.t2125);
      assert.ok(exportData.expenses);
      assert.ok(exportData.categoryTotals);
      assert.strictEqual(exportData.expenses.length, 1);
    });

    it('should remove expense by ID', () => {
      const tracker = new BusinessExpenseTracker();
      
      const expense1 = tracker.addExpense({ amount: 100, vendor: 'Staples', rawText: 'office' });
      const expense2 = tracker.addExpense({ amount: 50, vendor: 'Adobe', rawText: 'adobe' });
      
      assert.strictEqual(tracker.expenses.length, 2);
      
      const removed = tracker.removeExpense(expense1.id);
      assert.strictEqual(removed, true);
      assert.strictEqual(tracker.expenses.length, 1);
      assert.strictEqual(tracker.expenses[0].id, expense2.id);
    });

    it('should clear all expenses', () => {
      const tracker = new BusinessExpenseTracker();
      
      tracker.addExpense({ amount: 100, vendor: 'Staples', rawText: 'office' });
      tracker.addExpense({ amount: 50, vendor: 'Adobe', rawText: 'adobe' });
      
      assert.strictEqual(tracker.expenses.length, 2);
      
      tracker.clearExpenses();
      
      assert.strictEqual(tracker.expenses.length, 0);
      assert.strictEqual(tracker.getTotalDeductions(), 0);
    });

    it('should handle manual category assignment', () => {
      const tracker = new BusinessExpenseTracker();
      const receipt = {
        date: '2024-01-15',
        vendor: 'Some Vendor',
        amount: 100.00,
        category: 'ADVERTISING', // Manually specified
        rawText: 'some text',
      };

      const expense = tracker.addExpense(receipt);
      
      assert.strictEqual(expense.category, 'ADVERTISING');
    });
  });
});
