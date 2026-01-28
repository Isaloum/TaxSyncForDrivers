/**
 * Dividend Tax Credit Calculator
 * For Canadian investors receiving dividend income
 * 2026 tax year
 */

export const DIVIDEND_RATES_2026 = {
  eligible: {
    grossUpRate: 1.38,           // 138% gross-up
    federalDTC: 0.150198,        // 15.0198% of grossed-up amount
    grossUpFactor: 0.38,         // 38% addition
  },
  
  nonEligible: {
    grossUpRate: 1.15,           // 115% gross-up
    federalDTC: 0.090301,        // 9.0301% of grossed-up amount
    grossUpFactor: 0.15,         // 15% addition
  },
  
  // Provincial Dividend Tax Credits (% of grossed-up amount)
  provincial: {
    QC: {
      eligible: 0.117,           // 11.7%
      nonEligible: 0.0477,       // 4.77%
    },
    ON: {
      eligible: 0.10,            // 10%
      nonEligible: 0.0299,       // 2.99%
    },
    AB: {
      eligible: 0.0812,          // 8.12%
      nonEligible: 0.0196,       // 1.96%
    },
    BC: {
      eligible: 0.12,            // 12%
      nonEligible: 0.0196,       // 1.96%
    },
    MB: {
      eligible: 0.08,            // 8%
      nonEligible: 0.0008,       // 0.08%
    },
    SK: {
      eligible: 0.11,            // 11%
      nonEligible: 0.0325,       // 3.25%
    },
    NS: {
      eligible: 0.0885,          // 8.85%
      nonEligible: 0.0299,       // 2.99%
    },
    NB: {
      eligible: 0.14,            // 14%
      nonEligible: 0.0275,       // 2.75%
    },
    PE: {
      eligible: 0.105,           // 10.5%
      nonEligible: 0.0275,       // 2.75%
    },
    NL: {
      eligible: 0.0535,          // 5.35%
      nonEligible: 0.035,        // 3.5%
    },
    YT: {
      eligible: 0.1202,          // 12.02%
      nonEligible: 0.0232,       // 2.32%
    },
    NT: {
      eligible: 0.115,           // 11.5%
      nonEligible: 0.06,         // 6%
    },
    NU: {
      eligible: 0.0551,          // 5.51%
      nonEligible: 0.0261,       // 2.61%
    },
  },
};

/**
 * Calculate dividend tax credit for eligible dividends
 * @param {number} actualDividend - Actual dividend received
 * @param {string} province - Province code (QC, ON, AB, etc.)
 * @returns {Object} Dividend tax calculation
 */
export function calculateEligibleDividendCredit(actualDividend, province = 'QC') {
  if (actualDividend <= 0) {
    return {
      actualDividend: 0,
      grossedUpDividend: 0,
      taxableAmount: 0,
      federalCredit: 0,
      provincialCredit: 0,
      totalCredit: 0,
      netTaxOnDividend: 0,
      effectiveRate: 0,
    };
  }
  
  const { eligible } = DIVIDEND_RATES_2026;
  
  // Step 1: Gross up the dividend
  const grossedUpDividend = actualDividend * eligible.grossUpRate;
  
  // Step 2: This is the taxable amount (added to income)
  const taxableAmount = grossedUpDividend;
  
  // Step 3: Calculate federal dividend tax credit
  const federalCredit = grossedUpDividend * eligible.federalDTC;
  
  // Step 4: Calculate provincial dividend tax credit
  const provincialRate = DIVIDEND_RATES_2026.provincial[province]?.eligible || 0.10;
  const provincialCredit = grossedUpDividend * provincialRate;
  
  // Step 5: Total credit
  const totalCredit = federalCredit + provincialCredit;
  
  return {
    type: 'eligible',
    actualDividend: Math.round(actualDividend * 100) / 100,
    grossUpAmount: Math.round((grossedUpDividend - actualDividend) * 100) / 100,
    grossedUpDividend: Math.round(grossedUpDividend * 100) / 100,
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    federalCredit: Math.round(federalCredit * 100) / 100,
    provincialCredit: Math.round(provincialCredit * 100) / 100,
    totalCredit: Math.round(totalCredit * 100) / 100,
    province,
  };
}

/**
 * Calculate dividend tax credit for non-eligible dividends
 * @param {number} actualDividend - Actual dividend received
 * @param {string} province - Province code
 * @returns {Object} Dividend tax calculation
 */
export function calculateNonEligibleDividendCredit(actualDividend, province = 'QC') {
  if (actualDividend <= 0) {
    return {
      actualDividend: 0,
      grossedUpDividend: 0,
      taxableAmount: 0,
      federalCredit: 0,
      provincialCredit: 0,
      totalCredit: 0,
      netTaxOnDividend: 0,
      effectiveRate: 0,
    };
  }
  
  const { nonEligible } = DIVIDEND_RATES_2026;
  
  // Step 1: Gross up the dividend
  const grossedUpDividend = actualDividend * nonEligible.grossUpRate;
  
  // Step 2: This is the taxable amount
  const taxableAmount = grossedUpDividend;
  
  // Step 3: Calculate federal dividend tax credit
  const federalCredit = grossedUpDividend * nonEligible.federalDTC;
  
  // Step 4: Calculate provincial dividend tax credit
  const provincialRate = DIVIDEND_RATES_2026.provincial[province]?.nonEligible || 0.0299;
  const provincialCredit = grossedUpDividend * provincialRate;
  
  // Step 5: Total credit
  const totalCredit = federalCredit + provincialCredit;
  
  return {
    type: 'nonEligible',
    actualDividend: Math.round(actualDividend * 100) / 100,
    grossUpAmount: Math.round((grossedUpDividend - actualDividend) * 100) / 100,
    grossedUpDividend: Math.round(grossedUpDividend * 100) / 100,
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    federalCredit: Math.round(federalCredit * 100) / 100,
    provincialCredit: Math.round(provincialCredit * 100) / 100,
    totalCredit: Math.round(totalCredit * 100) / 100,
    province,
  };
}

/**
 * Calculate net tax on dividend income given marginal rate
 * @param {number} actualDividend - Actual dividend received
 * @param {boolean} isEligible - Is this an eligible dividend?
 * @param {number} marginalRate - Combined federal + provincial marginal rate (e.g., 0.50 for 50%)
 * @param {string} province - Province code
 * @returns {Object} Net tax calculation
 */
export function calculateNetTaxOnDividend(actualDividend, isEligible, marginalRate, province = 'QC') {
  const dividendCalc = isEligible 
    ? calculateEligibleDividendCredit(actualDividend, province)
    : calculateNonEligibleDividendCredit(actualDividend, province);
  
  // Tax on grossed-up amount
  const taxOnGrossedUp = dividendCalc.grossedUpDividend * marginalRate;
  
  // Net tax = Tax on grossed-up - dividend tax credit
  const netTax = Math.max(0, taxOnGrossedUp - dividendCalc.totalCredit);
  
  // Effective tax rate on actual dividend
  const effectiveRate = actualDividend > 0 ? (netTax / actualDividend) : 0;
  
  return {
    ...dividendCalc,
    marginalRate: Math.round(marginalRate * 10000) / 100,
    taxOnGrossedUp: Math.round(taxOnGrossedUp * 100) / 100,
    netTax: Math.round(netTax * 100) / 100,
    effectiveRate: Math.round(effectiveRate * 10000) / 100,
  };
}

/**
 * Compare tax on dividend vs. interest income
 * @param {number} amount - Amount of income
 * @param {boolean} isEligibleDividend - Is dividend eligible?
 * @param {number} marginalRate - Marginal tax rate
 * @param {string} province - Province code
 * @returns {Object} Comparison
 */
export function compareDividendVsInterest(amount, isEligibleDividend, marginalRate, province = 'QC') {
  // Interest income (fully taxable)
  const interestTax = amount * marginalRate;
  
  // Dividend income
  const dividendResult = calculateNetTaxOnDividend(amount, isEligibleDividend, marginalRate, province);
  
  // Tax savings by receiving dividends instead of interest
  const taxSavings = interestTax - dividendResult.netTax;
  const savingsPercentage = amount > 0 ? (taxSavings / amount) : 0;
  
  return {
    amount: Math.round(amount * 100) / 100,
    dividendType: isEligibleDividend ? 'eligible' : 'nonEligible',
    interestTax: Math.round(interestTax * 100) / 100,
    dividendTax: dividendResult.netTax,
    taxSavings: Math.round(taxSavings * 100) / 100,
    savingsPercentage: Math.round(savingsPercentage * 10000) / 100,
    marginalRate: Math.round(marginalRate * 10000) / 100,
    province,
  };
}

/**
 * Validate T5 slip dividend data
 * @param {Object} t5Data - T5 slip data
 * @returns {Object} Validation result
 */
export function validateT5DividendData(t5Data) {
  const errors = [];
  
  if (!t5Data.eligibleDividends && !t5Data.nonEligibleDividends) {
    errors.push('At least one dividend type must be provided');
  }
  
  if (t5Data.eligibleDividends < 0) {
    errors.push('Eligible dividends cannot be negative');
  }
  
  if (t5Data.nonEligibleDividends < 0) {
    errors.push('Non-eligible dividends cannot be negative');
  }
  
  if (t5Data.actualDividend && t5Data.taxableDividend) {
    const expectedGrossUp = t5Data.eligibleDividends 
      ? t5Data.actualDividend * 1.38 
      : t5Data.actualDividend * 1.15;
    
    const difference = Math.abs(t5Data.taxableDividend - expectedGrossUp);
    if (difference > 1) { // Allow $1 rounding difference
      errors.push('Taxable dividend does not match expected gross-up amount');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Extract dividend information from T5 slip
 * @param {Object} t5Slip - T5 slip data
 * @returns {Object} Extracted dividend info
 */
export function extractT5Dividends(t5Slip) {
  return {
    eligibleDividends: parseFloat(t5Slip.box24_eligible_dividends) || 0,
    eligibleDividendsGrossUp: parseFloat(t5Slip.box25_taxable_eligible_dividends) || 0,
    nonEligibleDividends: parseFloat(t5Slip.box10_actual_dividends) || 0,
    nonEligibleDividendsGrossUp: parseFloat(t5Slip.box11_taxable_dividends) || 0,
    interest: parseFloat(t5Slip.box13_interest) || 0,
    foreignIncome: parseFloat(t5Slip.box15_foreign_income) || 0,
    capitalGains: parseFloat(t5Slip.box18_capital_gains) || 0,
  };
}
