// medical-expense-calculator.js — Medical expense tax credit calculator for 2026

/**
 * Calculate medical expense tax credit
 * Federal: 15% on expenses exceeding 3% of net income (max $2,635 threshold)
 * Quebec: 20% on same eligible amount
 * 
 * @param {number} totalExpenses - Total medical expenses
 * @param {number} netIncome - Net income for the year
 * @returns {Object} Credit breakdown with federal and Quebec amounts
 */
export function calculateMedicalExpenseCredit(totalExpenses, netIncome) {
  // Calculate threshold: lesser of 3% of net income or $2,635
  const thresholdPercentage = netIncome * 0.03;
  const MAX_THRESHOLD = 2635;
  const threshold = Math.min(thresholdPercentage, MAX_THRESHOLD);
  
  // Calculate eligible amount (expenses above threshold)
  const eligibleAmount = Math.max(0, totalExpenses - threshold);
  
  // Calculate credits
  const federalCredit = eligibleAmount * 0.15; // 15% federal rate
  const quebecCredit = eligibleAmount * 0.20; // 20% Quebec rate
  const totalCredit = federalCredit + quebecCredit;
  
  return {
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    netIncome: Math.round(netIncome * 100) / 100,
    threshold: Math.round(threshold * 100) / 100,
    eligibleAmount: Math.round(eligibleAmount * 100) / 100,
    federalCredit: Math.round(federalCredit * 100) / 100,
    quebecCredit: Math.round(quebecCredit * 100) / 100,
    totalCredit: Math.round(totalCredit * 100) / 100,
  };
}

/**
 * Track medical expenses by category
 * Categories: prescriptions, dental, vision, practitioners
 * 
 * @param {Array} expenses - Array of expense objects with category, amount, description
 * @returns {Object} Expenses grouped by category with totals
 */
export function trackMedicalExpensesByCategory(expenses) {
  const categories = {
    prescriptions: { items: [], total: 0 },
    dental: { items: [], total: 0 },
    vision: { items: [], total: 0 },
    practitioners: { items: [], total: 0 },
    other: { items: [], total: 0 },
  };
  
  for (const expense of expenses) {
    const category = expense.category || 'other';
    if (categories[category]) {
      categories[category].items.push(expense);
      categories[category].total += expense.amount;
    } else {
      categories.other.items.push(expense);
      categories.other.total += expense.amount;
    }
  }
  
  // Round totals
  for (const category in categories) {
    categories[category].total = Math.round(categories[category].total * 100) / 100;
  }
  
  // Calculate grand total
  const grandTotal = Object.values(categories).reduce((sum, cat) => sum + cat.total, 0);
  
  return {
    categories,
    grandTotal: Math.round(grandTotal * 100) / 100,
  };
}

/**
 * Validate medical expense data
 * 
 * @param {number} amount - Expense amount
 * @param {string} category - Expense category
 * @param {string} description - Expense description
 * @returns {Object} Validation result with isValid and errors
 */
export function validateMedicalExpense(amount, category, description) {
  const errors = [];
  
  if (typeof amount !== 'number' || amount <= 0) {
    errors.push('Amount must be a positive number');
  }
  
  const validCategories = ['prescriptions', 'dental', 'vision', 'practitioners', 'other'];
  if (!validCategories.includes(category)) {
    errors.push('Invalid category. Must be one of: prescriptions, dental, vision, practitioners, other');
  }
  
  if (!description || description.trim().length === 0) {
    errors.push('Description is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
