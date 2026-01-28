/**
 * Capital Gains Calculator
 * For Canadian investors selling stocks, real estate, and other capital property
 * 2026 tax year
 */

export const CAPITAL_GAINS_2026 = {
  inclusionRate: 0.50,  // 50% of capital gains are taxable
  
  // Lifetime Capital Gains Exemption
  lcge: {
    qualifiedSmallBusiness: 1016836,  // Indexed for 2026
    qualifiedFarmFishing: 1016836,
  },
  
  // Principal Residence Exemption
  principalResidenceExemption: true,
  
  // Superficial loss rule
  superficialLossPeriod: 30,  // Days before/after sale
  
  // Capital loss rules
  capitalLoss: {
    currentYearOffset: true,
    carryBack: 3,      // Years
    carryForward: Infinity,  // Unlimited
  },
};

/**
 * Calculate capital gain/loss on sale of property
 * @param {number} salePrice - Selling price
 * @param {number} purchasePrice - Original purchase price (ACB)
 * @param {number} sellingExpenses - Commissions, legal fees, etc.
 * @param {number} purchaseExpenses - Original acquisition costs
 * @param {Object} options - Additional options
 * @param {boolean} options.isPrincipalResidence - Is this primary home?
 * @param {number} options.yearsOwned - Total years owned (for PR exemption)
 * @param {number} options.yearsAsResidence - Years designated as principal residence
 * @param {boolean} options.isQualifiedProperty - Eligible for LCGE?
 * @param {number} options.lcgeUsed - Previously used LCGE amount
 * @returns {Object} Capital gain calculation
 */
export function calculateCapitalGain(
  salePrice,
  purchasePrice,
  sellingExpenses = 0,
  purchaseExpenses = 0,
  options = {}
) {
  // Validate inputs
  if (salePrice < 0 || purchasePrice < 0) {
    throw new Error('Prices must be non-negative');
  }
  
  const {
    isPrincipalResidence = false,
    yearsOwned = 1,
    yearsAsResidence = 1,
    isQualifiedProperty = false,
    lcgeUsed = 0,
  } = options;
  
  // Calculate Adjusted Cost Base (ACB)
  const acb = purchasePrice + purchaseExpenses;
  
  // Calculate proceeds of disposition
  const proceeds = salePrice - sellingExpenses;
  
  // Calculate total capital gain/loss
  const totalGain = proceeds - acb;
  const isGain = totalGain > 0;
  
  // Apply Principal Residence Exemption if applicable
  let exemptAmount = 0;
  if (isPrincipalResidence && isGain && yearsOwned > 0) {
    // Formula: (1 + years designated) / years owned × gain
    const exemptionRatio = Math.min(1, (1 + yearsAsResidence) / yearsOwned);
    exemptAmount = totalGain * exemptionRatio;
  }
  
  // Calculate capital gain after PR exemption
  let capitalGain = Math.max(0, totalGain - exemptAmount);
  
  // Apply Lifetime Capital Gains Exemption if qualified
  let lcgeApplied = 0;
  if (isQualifiedProperty && isGain && capitalGain > 0) {
    const lcgeAvailable = CAPITAL_GAINS_2026.lcge.qualifiedSmallBusiness - lcgeUsed;
    lcgeApplied = Math.min(capitalGain, lcgeAvailable);
    capitalGain = Math.max(0, capitalGain - lcgeApplied);
  }
  
  // Calculate taxable amount (50% inclusion rate)
  const taxableAmount = isGain 
    ? capitalGain * CAPITAL_GAINS_2026.inclusionRate
    : totalGain * CAPITAL_GAINS_2026.inclusionRate; // Capital loss
  
  return {
    salePrice: Math.round(salePrice * 100) / 100,
    purchasePrice: Math.round(purchasePrice * 100) / 100,
    acb: Math.round(acb * 100) / 100,
    proceeds: Math.round(proceeds * 100) / 100,
    totalGain: Math.round(totalGain * 100) / 100,
    isGain,
    exemptAmount: Math.round(exemptAmount * 100) / 100,
    lcgeApplied: Math.round(lcgeApplied * 100) / 100,
    capitalGain: Math.round(capitalGain * 100) / 100,
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    inclusionRate: CAPITAL_GAINS_2026.inclusionRate,
    isPrincipalResidence,
    yearsOwned,
    yearsAsResidence,
  };
}

/**
 * Calculate tax on capital gain given marginal rate
 * @param {number} taxableCapitalGain - Taxable portion (after 50% inclusion)
 * @param {number} marginalRate - Taxpayer's marginal tax rate (e.g., 0.45 for 45%)
 * @returns {Object} Tax calculation
 */
export function calculateCapitalGainTax(taxableCapitalGain, marginalRate) {
  if (marginalRate < 0 || marginalRate > 1) {
    throw new Error('Marginal rate must be between 0 and 1');
  }
  
  const taxOwing = taxableCapitalGain * marginalRate;
  
  return {
    taxableCapitalGain: Math.round(taxableCapitalGain * 100) / 100,
    marginalRate: Math.round(marginalRate * 10000) / 100,
    taxOwing: Math.round(taxOwing * 100) / 100,
  };
}

/**
 * Calculate net capital loss that can be carried forward/back
 * @param {number} capitalLoss - Total capital loss (negative number)
 * @param {number} otherCapitalGains - Other capital gains in same year
 * @returns {Object} Loss calculation
 */
export function calculateCapitalLoss(capitalLoss, otherCapitalGains = 0) {
  if (capitalLoss >= 0) {
    return {
      capitalLoss: 0,
      offsetAmount: 0,
      netLoss: 0,
      carryForwardAmount: 0,
    };
  }
  
  // Convert to positive for easier math
  const lossAmount = Math.abs(capitalLoss);
  
  // Offset against other gains
  const offsetAmount = Math.min(lossAmount, otherCapitalGains);
  const netLoss = lossAmount - offsetAmount;
  
  // 50% of net loss can be carried forward
  const carryForwardAmount = netLoss * CAPITAL_GAINS_2026.inclusionRate;
  
  return {
    capitalLoss: Math.round(lossAmount * 100) / 100,
    offsetAmount: Math.round(offsetAmount * 100) / 100,
    netLoss: Math.round(netLoss * 100) / 100,
    carryForwardAmount: Math.round(carryForwardAmount * 100) / 100,
    canCarryBack: 3,  // years
    canCarryForward: true,  // unlimited
  };
}

/**
 * Check if sale triggers superficial loss (can't claim loss)
 * @param {Date} saleDate - Date of sale
 * @param {Date} repurchaseDate - Date of repurchase (if any)
 * @returns {boolean} True if superficial loss rule applies
 */
export function isSuperficialLoss(saleDate, repurchaseDate) {
  if (!repurchaseDate) return false;
  
  const daysDifference = Math.abs(
    (repurchaseDate.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return daysDifference <= CAPITAL_GAINS_2026.superficialLossPeriod;
}

/**
 * Calculate principal residence exemption
 * @param {number} totalGain - Total capital gain
 * @param {number} yearsOwned - Total years property owned
 * @param {number} yearsAsResidence - Years designated as principal residence
 * @returns {Object} Exemption calculation
 */
export function calculatePrincipalResidenceExemption(totalGain, yearsOwned, yearsAsResidence) {
  if (yearsOwned <= 0) {
    throw new Error('Years owned must be positive');
  }
  
  if (yearsAsResidence > yearsOwned) {
    throw new Error('Years as residence cannot exceed years owned');
  }
  
  // CRA formula: (1 + years designated) / years owned
  const rawRatio = (1 + yearsAsResidence) / yearsOwned;
  const exemptionRatio = Math.min(1, rawRatio);
  const exemptAmount = totalGain * exemptionRatio;
  const taxableGain = Math.max(0, totalGain - exemptAmount);
  
  return {
    totalGain: Math.round(totalGain * 100) / 100,
    yearsOwned,
    yearsAsResidence,
    exemptionRatio: Math.round(rawRatio * 10000) / 100,
    exemptAmount: Math.round(exemptAmount * 100) / 100,
    taxableGain: Math.round(taxableGain * 100) / 100,
  };
}

/**
 * Validate capital gains transaction
 * @param {Object} transaction - Transaction details
 * @returns {Object} Validation result
 */
export function validateCapitalGainTransaction(transaction) {
  const errors = [];
  
  if (!transaction.salePrice || transaction.salePrice <= 0) {
    errors.push('Sale price must be positive');
  }
  
  if (!transaction.purchasePrice || transaction.purchasePrice < 0) {
    errors.push('Purchase price must be non-negative');
  }
  
  if (transaction.salePrice && transaction.purchasePrice && 
      transaction.salePrice < transaction.purchasePrice * 0.1) {
    errors.push('Sale price seems unusually low (potential data entry error)');
  }
  
  if (transaction.yearsOwned && transaction.yearsOwned < 0) {
    errors.push('Years owned cannot be negative');
  }
  
  if (transaction.yearsAsResidence && transaction.yearsOwned &&
      transaction.yearsAsResidence > transaction.yearsOwned) {
    errors.push('Years as residence cannot exceed years owned');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
