/**
 * Investment Income Tax Calculator
 * Handles dividends (eligible/non-eligible), interest, and capital gains
 * 2026 tax rates
 */

export const DIVIDEND_RATES_2026 = {
  // Eligible dividends (large public corporations)
  eligible: {
    grossUpRate: 1.38,          // 38% gross-up
    federalCreditRate: 0.150198, // 15.0198% federal credit
    quebecCreditRate: 0.1119,    // 11.19% Quebec credit
  },
  
  // Non-eligible dividends (small business corporations)
  nonEligible: {
    grossUpRate: 1.15,          // 15% gross-up
    federalCreditRate: 0.090301, // 9.0301% federal credit
    quebecCreditRate: 0.04991,   // 4.991% Quebec credit
  },
};

export const CAPITAL_GAINS_RATES = {
  inclusionRate: 0.50,  // 50% of capital gain is taxable
};

/**
 * Calculate eligible dividend tax treatment
 */
export function calculateEligibleDividend(actualDividend) {
  const grossUp = actualDividend * DIVIDEND_RATES_2026.eligible.grossUpRate;
  const taxableAmount = grossUp;
  
  const federalCredit = grossUp * DIVIDEND_RATES_2026.eligible.federalCreditRate;
  const quebecCredit = grossUp * DIVIDEND_RATES_2026.eligible.quebecCreditRate;
  const totalCredit = federalCredit + quebecCredit;
  
  return {
    actualDividend,
    grossUp,
    taxableAmount,
    federalCredit: Math.round(federalCredit * 100) / 100,
    quebecCredit: Math.round(quebecCredit * 100) / 100,
    totalCredit: Math.round(totalCredit * 100) / 100,
    type: 'eligible',
  };
}

/**
 * Calculate non-eligible dividend tax treatment
 */
export function calculateNonEligibleDividend(actualDividend) {
  const grossUp = actualDividend * DIVIDEND_RATES_2026.nonEligible.grossUpRate;
  const taxableAmount = grossUp;
  
  const federalCredit = grossUp * DIVIDEND_RATES_2026.nonEligible.federalCreditRate;
  const quebecCredit = grossUp * DIVIDEND_RATES_2026.nonEligible.quebecCreditRate;
  const totalCredit = federalCredit + quebecCredit;
  
  return {
    actualDividend,
    grossUp,
    taxableAmount,
    federalCredit: Math.round(federalCredit * 100) / 100,
    quebecCredit: Math.round(quebecCredit * 100) / 100,
    totalCredit: Math.round(totalCredit * 100) / 100,
    type: 'non-eligible',
  };
}

/**
 * Calculate capital gains/losses
 */
export function calculateCapitalGain(proceeds, adjustedCostBase, expenses = 0) {
  const capitalGainLoss = proceeds - adjustedCostBase - expenses;
  const taxableAmount = capitalGainLoss * CAPITAL_GAINS_RATES.inclusionRate;
  
  return {
    proceeds,
    adjustedCostBase,
    expenses,
    capitalGainLoss: Math.round(capitalGainLoss * 100) / 100,
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    isGain: capitalGainLoss > 0,
    isLoss: capitalGainLoss < 0,
  };
}

/**
 * Calculate foreign tax credit
 * Prevents double taxation on foreign income
 */
export function calculateForeignTaxCredit(foreignIncome, foreignTaxPaid, canadianTaxRate = 0.44) {
  // Lesser of foreign tax paid OR Canadian tax on foreign income
  const canadianTaxOnForeign = foreignIncome * canadianTaxRate;
  const credit = Math.min(foreignTaxPaid, canadianTaxOnForeign);
  
  return {
    foreignIncome,
    foreignTaxPaid,
    foreignTaxCredit: Math.round(credit * 100) / 100,
    netForeignTax: Math.round((foreignTaxPaid - credit) * 100) / 100,
  };
}

/**
 * Calculate total investment income summary
 */
export function calculateInvestmentIncomeSummary(investments) {
  const {
    interestIncome = 0,
    eligibleDividends = 0,
    nonEligibleDividends = 0,
    capitalGains = 0,
    capitalLosses = 0,
    foreignIncome = 0,
    foreignTaxPaid = 0,
  } = investments;
  
  // Calculate dividend credits
  const eligibleDiv = calculateEligibleDividend(eligibleDividends);
  const nonEligibleDiv = calculateNonEligibleDividend(nonEligibleDividends);
  
  // Calculate net capital gain/loss
  const netCapitalGain = capitalGains - capitalLosses;
  const taxableCapitalGain = Math.max(0, netCapitalGain) * CAPITAL_GAINS_RATES.inclusionRate;
  
  // Calculate foreign tax credit
  const foreignCredit = calculateForeignTaxCredit(foreignIncome, foreignTaxPaid);
  
  // Total taxable investment income
  const totalTaxableIncome = 
    interestIncome +
    eligibleDiv.taxableAmount +
    nonEligibleDiv.taxableAmount +
    taxableCapitalGain +
    foreignIncome;
  
  // Total credits
  const totalCredits = 
    eligibleDiv.totalCredit +
    nonEligibleDiv.totalCredit +
    foreignCredit.foreignTaxCredit;
  
  return {
    interestIncome,
    eligibleDividends: eligibleDiv,
    nonEligibleDividends: nonEligibleDiv,
    capitalGains: {
      gross: capitalGains,
      losses: capitalLosses,
      net: netCapitalGain,
      taxable: taxableCapitalGain,
    },
    foreignIncome: foreignCredit,
    totalTaxableIncome: Math.round(totalTaxableIncome * 100) / 100,
    totalCredits: Math.round(totalCredits * 100) / 100,
  };
}
