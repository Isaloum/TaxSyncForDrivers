// validation-engine.js — Data validation and verification for extracted document data

import { DOCUMENT_TYPES } from './pattern-library.js';

// Tax year constants (update annually)
const CURRENT_TAX_YEAR = new Date().getFullYear();
const CPP_QPP_MAX_2025 = 4000; // Approximate max for 2025
const EI_MAX_2025 = 1200; // Approximate max for 2025
const PPIP_MAX_2025 = 600; // Approximate max for 2025

/**
 * Validation result structure
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether the data is valid
 * @property {string[]} errors - Array of error messages
 * @property {string[]} warnings - Array of warning messages
 * @property {number} confidenceScore - Confidence score (0-100)
 */

/**
 * Validate a date string
 * @param {string} dateStr - Date string to validate
 * @param {number} currentYear - Current tax year
 * @param {number} yearRange - Number of years back to accept (default: 5 for tax documents)
 * @returns {boolean} - Whether the date is valid
 */
export function isValidDate(dateStr, currentYear = CURRENT_TAX_YEAR, yearRange = 5) {
  if (!dateStr) return false;

  // Try to parse various date formats
  const slashPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/; // MM/DD/YYYY or DD/MM/YYYY
  const dashPattern = /^(\d{4})-(\d{2})-(\d{2})$/; // YYYY-MM-DD

  let match = dateStr.match(slashPattern);
  if (match) {
    let year = parseInt(match[3]);
    if (year < 100) year += 2000; // Handle 2-digit years

    // Check if year is within reasonable range for tax documents
    if (year >= currentYear - yearRange && year <= currentYear + 1) {
      return true;
    }
  }

  match = dateStr.match(dashPattern);
  if (match) {
    const year = parseInt(match[1]); // Year is first in YYYY-MM-DD format

    // Check if year is within reasonable range for tax documents
    if (year >= currentYear - yearRange && year <= currentYear + 1) {
      return true;
    }
  }

  return false;
}

/**
 * Validate a monetary amount
 * @param {number} amount - Amount to validate
 * @param {number} min - Minimum valid amount
 * @param {number} max - Maximum valid amount
 * @returns {boolean} - Whether the amount is valid
 */
export function isValidAmount(amount, min = 0, max = 1000000) {
  if (typeof amount !== 'number' || isNaN(amount)) return false;
  return amount >= min && amount <= max;
}

/**
 * Validate T4 slip data
 * @param {object} data - Extracted T4 data
 * @returns {ValidationResult}
 */
export function validateT4(data) {
  const errors = [];
  const warnings = [];
  let confidenceScore = 100;

  // Required field: employment income
  if (!data.employmentIncome || data.employmentIncome <= 0) {
    errors.push('Employment income (Box 14) is required and must be positive');
    confidenceScore -= 50;
  } else if (!isValidAmount(data.employmentIncome, 0, 500000)) {
    warnings.push('Employment income seems unusually high');
    confidenceScore -= 10;
  }

  // Validate deductions don't exceed income
  const totalDeductions =
    (data.cpp || 0) + (data.qpp || 0) + (data.ei || 0) + (data.incomeTax || 0);
  if (totalDeductions > data.employmentIncome * 0.5) {
    warnings.push('Total deductions exceed 50% of employment income');
    confidenceScore -= 15;
  }

  // Check for reasonable CPP/QPP (max ~$4,000 for 2025)
  if (data.cpp && data.cpp > CPP_QPP_MAX_2025) {
    warnings.push('CPP contribution seems high');
    confidenceScore -= 5;
  }
  if (data.qpp && data.qpp > CPP_QPP_MAX_2025) {
    warnings.push('QPP contribution seems high');
    confidenceScore -= 5;
  }

  // Check for reasonable EI (max ~$1,200 for 2025)
  if (data.ei && data.ei > EI_MAX_2025) {
    warnings.push('EI premium seems high');
    confidenceScore -= 5;
  }

  // Validate year
  if (data.year && (data.year < CURRENT_TAX_YEAR - 3 || data.year > CURRENT_TAX_YEAR)) {
    warnings.push(`Tax year ${data.year} is outside expected range`);
    confidenceScore -= 10;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    confidenceScore: Math.max(0, confidenceScore),
  };
}

/**
 * Validate T4A slip data (contractor/freelancer income)
 * @param {object} data - Extracted T4A data
 * @returns {ValidationResult}
 */
export function validateT4A(data) {
  const errors = [];
  const warnings = [];
  let confidenceScore = 100;

  // Calculate total income from various T4A boxes
  const totalIncome = (data.feesForServices || 0) + 
                      (data.commissions || 0) + 
                      (data.pension || 0) + 
                      (data.lumpSum || 0) + 
                      (data.otherIncome || 0);

  // At least one income field should be present and positive
  if (totalIncome <= 0) {
    errors.push('At least one income field (Box 048, 020, 016, 024, or 028) is required');
    confidenceScore -= 50;
  } else if (!isValidAmount(totalIncome, 0, 1000000)) {
    warnings.push('Total T4A income seems unusually high');
    confidenceScore -= 10;
  }

  // Check for reasonable income tax deducted
  if (data.incomeTaxDeducted && data.incomeTaxDeducted > totalIncome * 0.5) {
    warnings.push('Income tax deducted exceeds 50% of total income');
    confidenceScore -= 15;
  }

  // Validate year if present
  const currentYear = CURRENT_TAX_YEAR;
  if (data.year && (data.year < currentYear - 3 || data.year > currentYear)) {
    warnings.push(`Tax year ${data.year} is outside expected range`);
    confidenceScore -= 10;
  }

  // Check for payer information
  if (!data.payerName || data.payerName.length === 0) {
    warnings.push('Payer name not found');
    confidenceScore -= 10;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    confidenceScore: Math.max(0, confidenceScore),
  };
}

/**
 * Validate RL-1 slip data
 * @param {object} data - Extracted RL-1 data
 * @returns {ValidationResult}
 */
export function validateRL1(data) {
  const errors = [];
  const warnings = [];
  let confidenceScore = 100;

  // Required field: employment income (Box A)
  if (!data.employmentIncome || data.employmentIncome <= 0) {
    errors.push('Employment income (Box A) is required and must be positive');
    confidenceScore -= 50;
  } else if (!isValidAmount(data.employmentIncome, 0, 500000)) {
    warnings.push('Employment income seems unusually high');
    confidenceScore -= 10;
  }

  // Validate deductions
  const totalDeductions =
    (data.qpp || 0) + (data.ei || 0) + (data.ppip || 0) + (data.incomeTax || 0);
  if (totalDeductions > data.employmentIncome * 0.5) {
    warnings.push('Total deductions exceed 50% of employment income');
    confidenceScore -= 15;
  }

  // Check for reasonable QPP
  if (data.qpp && data.qpp > CPP_QPP_MAX_2025) {
    warnings.push('QPP contribution seems high');
    confidenceScore -= 5;
  }

  // Check for reasonable PPIP (max ~$600 for 2025)
  if (data.ppip && data.ppip > PPIP_MAX_2025) {
    warnings.push('PPIP premium seems high');
    confidenceScore -= 5;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    confidenceScore: Math.max(0, confidenceScore),
  };
}

/**
 * Check if a period represents an annual time frame
 * @param {string|number} period - Period string or year number
 * @returns {boolean} - Whether this is an annual period
 */
export function isAnnualPeriod(period) {
  if (!period) return false;
  const periodStr = period.toString().toLowerCase();
  return (
    periodStr.match(/^\d{4}$/) ||  // Just a year like "2023"
    periodStr.includes('annual') ||
    periodStr.includes('year')
  );
}

/**
 * Validate Uber/Lyft summary data
 * @param {object} data - Extracted platform summary data
 * @returns {ValidationResult}
 */
export function validatePlatformSummary(data) {
  const errors = [];
  const warnings = [];
  let confidenceScore = 100;

  // Required: gross fares/earnings
  const grossAmount = data.grossFares || data.grossEarnings || 0;
  
  // Check if this is an annual period
  const isAnnual = isAnnualPeriod(data.period);
  
  // Allow zero amounts for inactive periods, but warn if ALL fields are zero
  const allFieldsZero = grossAmount === 0 && 
    (data.tips === 0 || !data.tips) && 
    (data.distance === 0 || !data.distance) && 
    (data.netEarnings === 0 || !data.netEarnings);
  
  if (allFieldsZero) {
    warnings.push('All fields are zero - this might be an inactive period or incomplete document');
    confidenceScore -= 30;
  } else {
    // Use different thresholds based on period type
    const maxAmount = isAnnual ? 200000 : 50000;  // Annual vs weekly/monthly
    if (!isValidAmount(grossAmount, 0, maxAmount)) {
      if (isAnnual) {
        warnings.push('Annual earnings seem unusually high (over $200,000)');
      } else {
        warnings.push('Weekly/monthly earnings seem unusually high');
      }
      confidenceScore -= 10;
    }
  }

  // Check if net earnings are less than gross
  if (data.netEarnings && data.netEarnings > grossAmount && grossAmount > 0) {
    errors.push('Net earnings cannot exceed gross earnings');
    confidenceScore -= 30;
  }

  // Validate distance (if present) - different thresholds for annual vs weekly/monthly
  const maxDistance = isAnnual ? 100000 : 10000;  // Annual vs weekly/monthly
  if (data.distance && (data.distance < 0 || data.distance > maxDistance)) {
    if (isAnnual) {
      warnings.push('Distance seems unreasonable for an annual period (over 100,000 km)');
    } else {
      warnings.push('Distance seems unreasonable for a weekly/monthly period');
    }
    confidenceScore -= 10;
  }

  // Check for date fields
  if (!data.period && !data.startDate) {
    warnings.push('No time period information found');
    confidenceScore -= 20;
  }
  
  // Validate year if present (should be reasonable: 2020-2030)
  if (data.period) {
    const yearMatch = data.period.toString().match(/\d{4}/);
    if (yearMatch) {
      const year = parseInt(yearMatch[0]);
      if (year < 2020 || year > 2030) {
        warnings.push(`Year ${year} seems outside reasonable range (2020-2030)`);
        confidenceScore -= 15;
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    confidenceScore: Math.max(0, confidenceScore),
  };
}

/**
 * Validate expense receipt data
 * @param {object} data - Extracted receipt data
 * @param {string} expenseType - Type of expense
 * @returns {ValidationResult}
 */
export function validateExpenseReceipt(data, expenseType) {
  const errors = [];
  const warnings = [];
  let confidenceScore = 100;

  // Required: total/amount
  const amount = data.total || data.amount || 0;
  if (amount <= 0) {
    errors.push('Receipt amount is required and must be positive');
    confidenceScore -= 50;
  }

  // Expense-specific validation
  switch (expenseType) {
    case DOCUMENT_TYPES.GAS_RECEIPT:
      if (!isValidAmount(amount, 5, 500)) {
        warnings.push('Gas receipt amount seems unusual (expected $5-$500)');
        confidenceScore -= 10;
      }
      if (data.liters && (data.liters < 5 || data.liters > 200)) {
        warnings.push('Fuel volume seems unusual');
        confidenceScore -= 5;
      }
      break;

    case DOCUMENT_TYPES.MAINTENANCE_RECEIPT:
      if (!isValidAmount(amount, 20, 5000)) {
        warnings.push('Maintenance cost seems unusual (expected $20-$5000)');
        confidenceScore -= 10;
      }
      break;

    case DOCUMENT_TYPES.INSURANCE_DOC:
      if (!isValidAmount(amount, 500, 10000)) {
        warnings.push('Insurance premium seems unusual (expected $500-$10000)');
        confidenceScore -= 10;
      }
      break;

    case DOCUMENT_TYPES.PARKING_RECEIPT:
      if (!isValidAmount(amount, 1, 100)) {
        warnings.push('Parking fee seems unusual (expected $1-$100)');
        confidenceScore -= 10;
      }
      break;

    case DOCUMENT_TYPES.PHONE_BILL:
      if (!isValidAmount(amount, 20, 300)) {
        warnings.push('Phone bill seems unusual (expected $20-$300)');
        confidenceScore -= 10;
      }
      break;

    case DOCUMENT_TYPES.MEAL_RECEIPT:
      if (!isValidAmount(amount, 5, 100)) {
        warnings.push('Meal cost seems unusual (expected $5-$100)');
        confidenceScore -= 10;
      }
      break;
  }

  // Check for date
  if (!data.date) {
    warnings.push('No date found on receipt');
    confidenceScore -= 20;
  } else if (!isValidDate(data.date)) {
    warnings.push('Receipt date seems invalid or outside current tax year');
    confidenceScore -= 15;
  }

  // Check for vendor
  if (!data.vendor && !data.restaurant && !data.station && !data.insurer) {
    warnings.push('No vendor information found');
    confidenceScore -= 10;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    confidenceScore: Math.max(0, confidenceScore),
  };
}

/**
 * Validate T5 slip data (Investment Income)
 * @param {object} data - Extracted T5 data
 * @returns {ValidationResult}
 */
export function validateT5(data) {
  const errors = [];
  const warnings = [];
  let confidenceScore = 100;

  // At least one income field should be present
  const hasIncome =
    (data.interestIncome && data.interestIncome > 0) ||
    (data.eligibleDividends && data.eligibleDividends > 0) ||
    (data.otherDividends && data.otherDividends > 0) ||
    (data.capitalGainsDividends && data.capitalGainsDividends > 0);

  if (!hasIncome) {
    errors.push('No investment income found in T5 slip');
    confidenceScore -= 50;
  }

  // Validate amounts are reasonable
  if (data.interestIncome && !isValidAmount(data.interestIncome, 0, 1000000)) {
    warnings.push('Interest income seems unusually high');
    confidenceScore -= 10;
  }

  if (data.eligibleDividends && !isValidAmount(data.eligibleDividends, 0, 1000000)) {
    warnings.push('Eligible dividends amount seems unusually high');
    confidenceScore -= 10;
  }

  // Check for foreign tax credit logic
  if (data.foreignTaxPaid && data.foreignTaxPaid > 0 && (!data.foreignIncome || data.foreignIncome <= 0)) {
    warnings.push('Foreign tax paid but no foreign income reported');
    confidenceScore -= 15;
  }

  // Validate year if present
  if (data.year && (parseInt(data.year) < CURRENT_TAX_YEAR - 5 || parseInt(data.year) > CURRENT_TAX_YEAR)) {
    warnings.push('Tax year is outside expected range');
    confidenceScore -= 10;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    confidenceScore: Math.max(0, confidenceScore),
  };
}

/**
 * Validate T3 slip data (Trust Income)
 * @param {object} data - Extracted T3 data
 * @returns {ValidationResult}
 */
export function validateT3(data) {
  const errors = [];
  const warnings = [];
  let confidenceScore = 100;

  // At least one income field should be present
  const hasIncome =
    (data.eligibleDividends && data.eligibleDividends > 0) ||
    (data.otherDividends && data.otherDividends > 0) ||
    (data.foreignIncome && data.foreignIncome > 0);

  if (!hasIncome) {
    errors.push('No trust income found in T3 slip');
    confidenceScore -= 50;
  }

  // Validate amounts are reasonable
  if (data.eligibleDividends && !isValidAmount(data.eligibleDividends, 0, 1000000)) {
    warnings.push('Eligible dividends amount seems unusually high');
    confidenceScore -= 10;
  }

  // Check for foreign tax credit logic
  if (data.foreignTaxPaid && data.foreignTaxPaid > 0 && (!data.foreignIncome || data.foreignIncome <= 0)) {
    warnings.push('Foreign tax paid but no foreign income reported');
    confidenceScore -= 15;
  }

  // Validate year if present
  if (data.year && (parseInt(data.year) < CURRENT_TAX_YEAR - 5 || parseInt(data.year) > CURRENT_TAX_YEAR)) {
    warnings.push('Tax year is outside expected range');
    confidenceScore -= 10;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    confidenceScore: Math.max(0, confidenceScore),
  };
}

/**
 * Validate T5008 slip data (Securities Transactions)
 * @param {object} data - Extracted T5008 data
 * @returns {ValidationResult}
 */
export function validateT5008(data) {
  const errors = [];
  const warnings = [];
  let confidenceScore = 100;

  // Required fields: proceeds and cost base
  if (!data.proceeds || data.proceeds <= 0) {
    errors.push('Proceeds of disposition (Box 20) is required');
    confidenceScore -= 40;
  }

  if (!data.costBase || data.costBase < 0) {
    errors.push('Adjusted cost base (Box 21) is required');
    confidenceScore -= 40;
  }

  // Validate amounts are reasonable
  if (data.proceeds && !isValidAmount(data.proceeds, 0, 10000000)) {
    warnings.push('Proceeds amount seems unusually high');
    confidenceScore -= 10;
  }

  if (data.costBase && !isValidAmount(data.costBase, 0, 10000000)) {
    warnings.push('Cost base amount seems unusually high');
    confidenceScore -= 10;
  }

  // Check if capital gain is calculated correctly
  if (data.proceeds && data.costBase) {
    const expectedGain = Math.round((data.proceeds - data.costBase) * 100) / 100;
    if (data.capitalGain && Math.abs(data.capitalGain - expectedGain) > 0.01) {
      warnings.push('Capital gain calculation may be incorrect');
      confidenceScore -= 15;
    }
  }

  // Validate year if present
  if (data.year && (parseInt(data.year) < CURRENT_TAX_YEAR - 5 || parseInt(data.year) > CURRENT_TAX_YEAR)) {
    warnings.push('Tax year is outside expected range');
    confidenceScore -= 10;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    confidenceScore: Math.max(0, confidenceScore),
  };
}

/**
 * Validate extracted data based on document type
 * @param {object} data - Extracted data
 * @param {string} docType - Document type
 * @returns {ValidationResult}
 */
export function validateData(data, docType) {
  switch (docType) {
    case DOCUMENT_TYPES.T4:
      return validateT4(data);

    case DOCUMENT_TYPES.T4A:
      return validateT4A(data);

    case DOCUMENT_TYPES.T5:
      return validateT5(data);

    case DOCUMENT_TYPES.T3:
      return validateT3(data);

    case DOCUMENT_TYPES.T5008:
      return validateT5008(data);

    case DOCUMENT_TYPES.RL1:
    case DOCUMENT_TYPES.RL2:
      return validateRL1(data);

    case DOCUMENT_TYPES.UBER_SUMMARY:
    case DOCUMENT_TYPES.LYFT_SUMMARY:
    case DOCUMENT_TYPES.TAXI_STATEMENT:
      return validatePlatformSummary(data);

    case DOCUMENT_TYPES.GAS_RECEIPT:
    case DOCUMENT_TYPES.MAINTENANCE_RECEIPT:
    case DOCUMENT_TYPES.INSURANCE_DOC:
    case DOCUMENT_TYPES.INSURANCE_RECEIPT: // INSURANCE_RECEIPT is for provider-specific receipts (Intact, Desjardins, etc.), INSURANCE_DOC is for generic insurance documents
    case DOCUMENT_TYPES.PARKING_RECEIPT:
    case DOCUMENT_TYPES.PHONE_BILL:
    case DOCUMENT_TYPES.MEAL_RECEIPT:
    case DOCUMENT_TYPES.BUSINESS_RECEIPT:
      return validateExpenseReceipt(data, docType);

    default:
      return {
        isValid: false,
        errors: ['Unknown document type'],
        warnings: [],
        confidenceScore: 0,
      };
  }
}

/**
 * Check for duplicate entries based on key fields
 * @param {object} newData - New data to check
 * @param {Array} existingEntries - Array of existing entries
 * @param {string} docType - Document type
 * @returns {boolean} - Whether this appears to be a duplicate
 */
export function isDuplicate(newData, existingEntries, docType) {
  if (!existingEntries || existingEntries.length === 0) return false;

  for (const entry of existingEntries) {
    // Different checks based on document type
    switch (docType) {
      case DOCUMENT_TYPES.T4:
      case DOCUMENT_TYPES.T4A:
      case DOCUMENT_TYPES.RL1:
      case DOCUMENT_TYPES.RL2:
        // Check if same employer, year, and amount
        if (
          entry.employmentIncome === newData.employmentIncome &&
          entry.year === newData.year &&
          entry.employerName === newData.employerName
        ) {
          return true;
        }
        break;

      case DOCUMENT_TYPES.UBER_SUMMARY:
      case DOCUMENT_TYPES.LYFT_SUMMARY:
        // Check if same period or same amount on same dates
        if (
          entry.period === newData.period ||
          (entry.startDate === newData.startDate &&
            entry.endDate === newData.endDate &&
            entry.grossFares === newData.grossFares)
        ) {
          return true;
        }
        break;

      default:
        // For receipts, check if same amount on same date from same vendor
        if (
          entry.date === newData.date &&
          (entry.total === newData.total || entry.amount === newData.amount) &&
          (entry.vendor === newData.vendor || entry.station === newData.station)
        ) {
          return true;
        }
    }
  }

  return false;
}

/**
 * Calculate business use percentage for mixed-use expenses
 * @param {number} businessKm - Business kilometers
 * @param {number} totalKm - Total kilometers
 * @returns {number} - Business use percentage (0-100)
 */
export function calculateBusinessUsePercentage(businessKm, totalKm) {
  if (!businessKm || businessKm <= 0) return 0; // No business use
  if (!totalKm || totalKm === 0) return 0; // Invalid total
  const percentage = (businessKm / totalKm) * 100;
  return Math.min(100, Math.max(0, Math.round(percentage * 100) / 100));
}

/**
 * Categorize expense as business or personal
 * @param {string} docType - Document type
 * @param {object} data - Extracted data
 * @returns {string} - 'business', 'personal', or 'mixed'
 */
export function categorizeExpense(docType, data) {
  // Driver-specific expenses are typically business
  const businessTypes = [
    DOCUMENT_TYPES.GAS_RECEIPT,
    DOCUMENT_TYPES.MAINTENANCE_RECEIPT,
    DOCUMENT_TYPES.PARKING_RECEIPT,
  ];

  if (businessTypes.includes(docType)) {
    return 'business';
  }

  // These are typically mixed use
  const mixedTypes = [DOCUMENT_TYPES.PHONE_BILL, DOCUMENT_TYPES.INSURANCE_DOC];

  if (mixedTypes.includes(docType)) {
    return 'mixed';
  }

  // Meal receipts need manual review (only 50% deductible)
  if (docType === DOCUMENT_TYPES.MEAL_RECEIPT) {
    return 'business'; // But note: only 50% is deductible for tax purposes
  }

  return 'personal';
}

/**
 * Get the appropriate tax year quarter for a date
 * @param {string} dateStr - Date string
 * @returns {number} - Quarter number (1-4) or null
 */
export function getQuarter(dateStr) {
  if (!dateStr) return null;

  const date = new Date(dateStr);
  const month = date.getMonth() + 1; // JavaScript months are 0-indexed

  if (month >= 1 && month <= 3) return 1; // Q1: Jan-Mar
  if (month >= 4 && month <= 6) return 2; // Q2: Apr-Jun
  if (month >= 7 && month <= 9) return 3; // Q3: Jul-Sep
  if (month >= 10 && month <= 12) return 4; // Q4: Oct-Dec

  return null;
}
