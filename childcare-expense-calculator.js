// childcare-expense-calculator.js — Childcare expense deduction calculator for 2026

/**
 * 2026 childcare expense limits by age
 */
export const CHILDCARE_LIMITS_2026 = {
  UNDER_7: 8000,      // Children under 7 years old
  AGE_7_TO_16: 5000,  // Children 7-16 years old
  DISABLED: 11000,    // Children with disabilities (any age)
};

/**
 * Calculate childcare expense deduction
 * Limited by per-child limits and 2/3 of earned income
 * 
 * @param {Array} children - Array of child objects with age and disabled status
 * @param {number} totalExpenses - Total childcare expenses for the year
 * @param {number} earnedIncome - Earned income for the year
 * @returns {Object} Deduction breakdown with limits and eligible amount
 */
export function calculateChildcareDeduction(children, totalExpenses, earnedIncome) {
  // Calculate per-child limit
  let perChildLimit = 0;
  const childLimits = [];
  
  for (const child of children) {
    let limit = 0;
    
    if (child.disabled) {
      limit = CHILDCARE_LIMITS_2026.DISABLED;
    } else if (child.age < 7) {
      limit = CHILDCARE_LIMITS_2026.UNDER_7;
    } else if (child.age <= 16) {
      limit = CHILDCARE_LIMITS_2026.AGE_7_TO_16;
    }
    
    childLimits.push({
      age: child.age,
      disabled: child.disabled || false,
      limit,
    });
    
    perChildLimit += limit;
  }
  
  // Calculate 2/3 earned income limit
  const earnedIncomeLimit = Math.round((earnedIncome * 2 / 3) * 100) / 100;
  
  // Determine eligible deduction (minimum of: total expenses, per-child limit, 2/3 earned income)
  const eligibleDeduction = Math.min(
    totalExpenses,
    perChildLimit,
    earnedIncomeLimit
  );
  
  return {
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    earnedIncome: Math.round(earnedIncome * 100) / 100,
    numberOfChildren: children.length,
    childLimits,
    perChildLimit: Math.round(perChildLimit * 100) / 100,
    earnedIncomeLimit,
    eligibleDeduction: Math.round(eligibleDeduction * 100) / 100,
    limitingFactor: determineLimit(totalExpenses, perChildLimit, earnedIncomeLimit),
  };
}

/**
 * Helper function to determine which limit is the restricting factor
 */
function determineLimit(expenses, perChildLimit, earnedIncomeLimit) {
  const min = Math.min(expenses, perChildLimit, earnedIncomeLimit);
  
  if (min === earnedIncomeLimit) {
    return 'earned_income';
  } else if (min === perChildLimit) {
    return 'per_child';
  } else {
    return 'expenses';
  }
}

/**
 * Validate childcare provider information
 * Provider must have a valid SIN or Business Number (BN)
 * 
 * @param {string} providerSinBn - Provider's SIN or BN
 * @param {string} providerName - Provider's name
 * @returns {Object} Validation result
 */
export function validateChildcareProvider(providerSinBn, providerName) {
  const errors = [];
  
  if (!providerName || providerName.trim().length === 0) {
    errors.push('Provider name is required');
  }
  
  if (!providerSinBn || providerSinBn.trim().length === 0) {
    errors.push('Provider SIN or Business Number is required');
  } else {
    // Remove spaces and hyphens for validation
    const cleaned = providerSinBn.replace(/[\s-]/g, '');
    
    // Check if it's a valid SIN (9 digits) or BN (9 digits + 2 letters + 4 digits)
    const sinPattern = /^\d{9}$/;
    const bnPattern = /^\d{9}[A-Z]{2}\d{4}$/;
    
    if (!sinPattern.test(cleaned) && !bnPattern.test(cleaned)) {
      errors.push('Invalid SIN or Business Number format');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate child information
 * 
 * @param {number} age - Child's age
 * @param {boolean} disabled - Whether child has a disability
 * @returns {Object} Validation result
 */
export function validateChild(age, disabled = false) {
  const errors = [];
  
  if (typeof age !== 'number' || age < 0 || age > 16) {
    if (!disabled || age > 18) {
      errors.push('Child must be under 17 (or under 18 if disabled)');
    }
  }
  
  if (typeof disabled !== 'boolean') {
    errors.push('Disabled status must be true or false');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate maximum possible deduction for a given scenario
 * Useful for planning purposes
 * 
 * @param {Array} children - Array of child objects
 * @param {number} earnedIncome - Earned income
 * @returns {Object} Maximum deduction and required expenses to reach it
 */
export function calculateMaximumDeduction(children, earnedIncome) {
  let perChildLimit = 0;
  
  for (const child of children) {
    if (child.disabled) {
      perChildLimit += CHILDCARE_LIMITS_2026.DISABLED;
    } else if (child.age < 7) {
      perChildLimit += CHILDCARE_LIMITS_2026.UNDER_7;
    } else if (child.age <= 16) {
      perChildLimit += CHILDCARE_LIMITS_2026.AGE_7_TO_16;
    }
  }
  
  const earnedIncomeLimit = Math.round((earnedIncome * 2 / 3) * 100) / 100;
  const maxDeduction = Math.min(perChildLimit, earnedIncomeLimit);
  
  return {
    maxDeduction: Math.round(maxDeduction * 100) / 100,
    requiredExpenses: Math.round(maxDeduction * 100) / 100,
    limitedBy: maxDeduction === earnedIncomeLimit ? 'earned_income' : 'per_child',
  };
}
