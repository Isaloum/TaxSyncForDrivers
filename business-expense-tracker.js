// business-expense-tracker.js — Business Expense Tracker for T2125
// Categorizes and aggregates business expenses for self-employed individuals

import { BUSINESS_EXPENSE_PATTERNS } from './pattern-library.js';

/**
 * Business expense categories mapped to T2125 line codes
 */
export const EXPENSE_CATEGORIES = {
  ADVERTISING: { label: 'Advertising', code: '8521', deductionRate: 1.0 },
  MEALS_ENTERTAINMENT: { label: 'Meals & Entertainment', code: '8523', deductionRate: 0.5 },
  BAD_DEBTS: { label: 'Bad Debts', code: '8590', deductionRate: 1.0 },
  INSURANCE: { label: 'Insurance', code: '9804', deductionRate: 1.0 },
  INTEREST: { label: 'Interest & Bank Charges', code: '8710', deductionRate: 1.0 },
  FEES: { label: 'Professional Fees', code: '8862', deductionRate: 1.0 },
  OFFICE: { label: 'Office Expenses', code: '8810', deductionRate: 1.0 },
  SUPPLIES: { label: 'Supplies', code: '8811', deductionRate: 1.0 },
  PHONE_UTILITIES: { label: 'Phone & Utilities', code: '9220', deductionRate: 1.0 },
  RENT: { label: 'Rent', code: '8960', deductionRate: 1.0 },
  REPAIRS: { label: 'Repairs & Maintenance', code: '9270', deductionRate: 1.0 },
  TRAVEL: { label: 'Travel', code: '9200', deductionRate: 1.0 },
  VEHICLE: { label: 'Vehicle Expenses', code: '9281', deductionRate: 1.0 },
  HOME_OFFICE: { label: 'Home Office', code: '9945', deductionRate: 1.0 },
  OTHER: { label: 'Other Expenses', code: '9270', deductionRate: 1.0 },
};

/**
 * Global expense tracker class
 */
export class BusinessExpenseTracker {
  constructor() {
    this.expenses = [];
    this.categoryTotals = {};
    this.receipts = [];
    
    // Initialize category totals
    Object.keys(EXPENSE_CATEGORIES).forEach(key => {
      this.categoryTotals[key] = 0;
    });
  }
  
  /**
   * Add expense from extracted receipt
   * @param {object} receiptData - Receipt data with fields like date, vendor, amount, etc.
   * @returns {object} - The created expense object
   */
  addExpense(receiptData) {
    const category = receiptData.category || this.categorizeExpense(receiptData);
    const amount = receiptData.total || receiptData.amount || 0;
    const deductionRate = EXPENSE_CATEGORIES[category]?.deductionRate || 1.0;
    const deductibleAmount = amount * deductionRate;
    
    const expense = {
      id: Date.now() + Math.random(),
      date: receiptData.date || new Date().toISOString().split('T')[0],
      vendor: receiptData.vendor || '',
      category,
      amount,
      deductionRate,
      deductibleAmount,
      description: receiptData.description || '',
      receiptImage: receiptData.imageUrl || null,
    };
    
    this.expenses.push(expense);
    this.categoryTotals[category] = (this.categoryTotals[category] || 0) + deductibleAmount;
    
    return expense;
  }
  
  /**
   * Categorize expense based on receipt data
   * @param {object} receiptData - Receipt data with rawText, vendor, etc.
   * @returns {string} - Category key from EXPENSE_CATEGORIES
   */
  categorizeExpense(receiptData) {
    const text = (receiptData.rawText || '').toLowerCase();
    const vendor = (receiptData.vendor || '').toLowerCase();
    
    // Check software/subscriptions
    if (BUSINESS_EXPENSE_PATTERNS.software.keywords.some(kw => text.includes(kw) || vendor.includes(kw))) {
      return 'OFFICE';
    }
    
    // Check professional fees
    if (BUSINESS_EXPENSE_PATTERNS.professionalFees.keywords.some(kw => text.includes(kw))) {
      return 'FEES';
    }
    
    // Check advertising
    if (BUSINESS_EXPENSE_PATTERNS.advertising.keywords.some(kw => text.includes(kw))) {
      return 'ADVERTISING';
    }
    
    // Check meals/entertainment
    if (BUSINESS_EXPENSE_PATTERNS.mealsEntertainment.keywords.some(kw => text.includes(kw))) {
      return 'MEALS_ENTERTAINMENT';
    }
    
    // Check bank fees
    if (BUSINESS_EXPENSE_PATTERNS.bankFees.keywords.some(kw => text.includes(kw))) {
      return 'INTEREST';
    }
    
    // Check office supplies
    if (BUSINESS_EXPENSE_PATTERNS.officeSupplies.keywords.some(kw => vendor.includes(kw))) {
      return 'SUPPLIES';
    }
    
    // Check business insurance
    if (BUSINESS_EXPENSE_PATTERNS.businessInsurance.keywords.some(kw => text.includes(kw))) {
      return 'INSURANCE';
    }
    
    // Check training/professional development
    if (BUSINESS_EXPENSE_PATTERNS.training.keywords.some(kw => text.includes(kw))) {
      return 'FEES';
    }
    
    // Default
    return 'OTHER';
  }
  
  /**
   * Get total deductible expenses
   * @returns {number} - Total deductible amount
   */
  getTotalDeductions() {
    return Object.values(this.categoryTotals).reduce((sum, amt) => sum + amt, 0);
  }
  
  /**
   * Get breakdown by category
   * @returns {Array} - Array of category summaries
   */
  getCategoryBreakdown() {
    return Object.keys(EXPENSE_CATEGORIES).map(key => ({
      category: EXPENSE_CATEGORIES[key].label,
      code: EXPENSE_CATEGORIES[key].code,
      total: this.categoryTotals[key] || 0,
      count: this.expenses.filter(e => e.category === key).length,
    })).filter(cat => cat.total > 0);
  }
  
  /**
   * Generate T2125 summary
   * @param {number} grossIncome - Gross self-employment income
   * @returns {object} - T2125 summary with income, expenses, net income
   */
  generateT2125Summary(grossIncome) {
    const totalExpenses = this.getTotalDeductions();
    const netIncome = grossIncome - totalExpenses;
    
    return {
      grossIncome,
      totalExpenses,
      netIncome,
      categoryBreakdown: this.getCategoryBreakdown(),
      expenseCount: this.expenses.length,
    };
  }
  
  /**
   * Export for tax filing
   * @returns {object} - Complete expense data for export
   */
  exportForTaxFiling() {
    return {
      t2125: this.generateT2125Summary(0),
      expenses: this.expenses,
      categoryTotals: this.categoryTotals,
    };
  }
  
  /**
   * Clear all expenses
   */
  clearExpenses() {
    this.expenses = [];
    this.receipts = [];
    Object.keys(EXPENSE_CATEGORIES).forEach(key => {
      this.categoryTotals[key] = 0;
    });
  }
  
  /**
   * Remove an expense by ID
   * @param {string|number} id - Expense ID
   * @returns {boolean} - True if removed, false if not found
   */
  removeExpense(id) {
    const index = this.expenses.findIndex(e => e.id === id);
    if (index === -1) return false;
    
    const expense = this.expenses[index];
    this.categoryTotals[expense.category] -= expense.deductibleAmount;
    this.expenses.splice(index, 1);
    return true;
  }
}

// Create global instance
export const expenseTracker = new BusinessExpenseTracker();
