/**
 * Ontario Trillium Benefit (OTB) Calculator
 * Combines three credits:
 * 1. Ontario Energy and Property Tax Credit (OEPTC)
 * 2. Northern Ontario Energy Credit (NOEC)
 * 3. Ontario Sales Tax Credit (OSTC)
 * 2026 tax year
 */

export const ONTARIO_TRILLIUM_2026 = {
  // Energy and Property Tax Credit
  energyPropertyTax: {
    baseAmount: 1095,              // Maximum for single/couple
    additionalPerChild: 0,         // No longer additional for children
    propertyTaxMaxClaim: 500,      // Maximum property tax credit
    energyComponent: 185,          // Energy component
    seniorBonus: 217,              // Additional for seniors 64+
    
    // Reduction thresholds
    reductionThreshold: 23000,     // Single/couple
    reductionRate: 0.02,           // 2% reduction per dollar over threshold
  },
  
  // Northern Ontario Energy Credit
  northernCredit: {
    baseAmount: 195,               // Base amount
    additionalPerChild: 80,        // Per child
    reductionThreshold: 50000,     // Household income
    reductionRate: 0.05,           // 5% reduction
  },
  
  // Ontario Sales Tax Credit (OSTC)
  salesTaxCredit: {
    single: 345,                   // Single individual
    couple: 345,                   // Couple (same as single)
    perChild: 115,                 // Per child
    reductionThreshold: 27000,     // Single
    reductionThresholdCouple: 27000, // Couple
    reductionRate: 0.04,           // 4% reduction
  },
};

/**
 * Calculate Ontario Trillium Benefit
 */
export function calculateOntarioTrilliumBenefit(household) {
  const {
    netIncome,
    familyNetIncome,
    numberOfChildren = 0,
    isSenior = false,
    isNorthernOntario = false,
    propertyTaxPaid = 0,
    rentPaid = 0,
    maritalStatus = 'single', // 'single', 'married', 'common-law'
  } = household;
  
  // 1. Energy and Property Tax Credit (OEPTC)
  const energyPropertyCredit = calculateEnergyPropertyTaxCredit({
    netIncome: familyNetIncome || netIncome,
    propertyTaxPaid,
    rentPaid,
    isSenior,
    maritalStatus,
  });
  
  // 2. Northern Ontario Energy Credit (NOEC)
  const northernCredit = isNorthernOntario 
    ? calculateNorthernOntarioCredit(familyNetIncome || netIncome, numberOfChildren)
    : 0;
  
  // 3. Ontario Sales Tax Credit (OSTC)
  const salesTaxCredit = calculateOntarioSalesTaxCredit({
    netIncome: familyNetIncome || netIncome,
    numberOfChildren,
    maritalStatus,
  });
  
  const totalBenefit = energyPropertyCredit + northernCredit + salesTaxCredit;
  const monthlyPayment = totalBenefit / 12; // Paid monthly
  
  return {
    energyPropertyCredit: Math.round(energyPropertyCredit * 100) / 100,
    northernCredit: Math.round(northernCredit * 100) / 100,
    salesTaxCredit: Math.round(salesTaxCredit * 100) / 100,
    totalAnnualBenefit: Math.round(totalBenefit * 100) / 100,
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
  };
}

/**
 * Calculate Energy and Property Tax Credit
 */
function calculateEnergyPropertyTaxCredit({ netIncome, propertyTaxPaid, rentPaid, isSenior }) {
  let credit = 0;
  
  // Base energy component
  credit += ONTARIO_TRILLIUM_2026.energyPropertyTax.energyComponent;
  
  // Property tax or rent component (20% of property tax or 20% of rent)
  if (propertyTaxPaid > 0) {
    const propertyTaxCredit = Math.min(
      propertyTaxPaid * 0.20,
      ONTARIO_TRILLIUM_2026.energyPropertyTax.propertyTaxMaxClaim
    );
    credit += propertyTaxCredit;
  } else if (rentPaid > 0) {
    // Rent credit is 20% of annual rent
    const rentCredit = Math.min(
      rentPaid * 0.20,
      ONTARIO_TRILLIUM_2026.energyPropertyTax.propertyTaxMaxClaim
    );
    credit += rentCredit;
  }
  
  // Senior bonus (64+)
  if (isSenior) {
    credit += ONTARIO_TRILLIUM_2026.energyPropertyTax.seniorBonus;
  }
  
  // Income reduction
  if (netIncome > ONTARIO_TRILLIUM_2026.energyPropertyTax.reductionThreshold) {
    const excessIncome = netIncome - ONTARIO_TRILLIUM_2026.energyPropertyTax.reductionThreshold;
    const reduction = excessIncome * ONTARIO_TRILLIUM_2026.energyPropertyTax.reductionRate;
    credit = Math.max(0, credit - reduction);
  }
  
  return credit;
}

/**
 * Calculate Northern Ontario Energy Credit
 */
function calculateNorthernOntarioCredit(netIncome, numberOfChildren) {
  let credit = ONTARIO_TRILLIUM_2026.northernCredit.baseAmount;
  credit += numberOfChildren * ONTARIO_TRILLIUM_2026.northernCredit.additionalPerChild;
  
  // Income reduction
  if (netIncome > ONTARIO_TRILLIUM_2026.northernCredit.reductionThreshold) {
    const excessIncome = netIncome - ONTARIO_TRILLIUM_2026.northernCredit.reductionThreshold;
    const reduction = excessIncome * ONTARIO_TRILLIUM_2026.northernCredit.reductionRate;
    credit = Math.max(0, credit - reduction);
  }
  
  return credit;
}

/**
 * Calculate Ontario Sales Tax Credit
 */
function calculateOntarioSalesTaxCredit({ netIncome, numberOfChildren, maritalStatus }) {
  const isCouple = maritalStatus === 'married' || maritalStatus === 'common-law';
  
  let credit = isCouple 
    ? ONTARIO_TRILLIUM_2026.salesTaxCredit.couple
    : ONTARIO_TRILLIUM_2026.salesTaxCredit.single;
  
  credit += numberOfChildren * ONTARIO_TRILLIUM_2026.salesTaxCredit.perChild;
  
  // Income reduction
  const threshold = isCouple 
    ? ONTARIO_TRILLIUM_2026.salesTaxCredit.reductionThresholdCouple
    : ONTARIO_TRILLIUM_2026.salesTaxCredit.reductionThreshold;
  
  if (netIncome > threshold) {
    const excessIncome = netIncome - threshold;
    const reduction = excessIncome * ONTARIO_TRILLIUM_2026.salesTaxCredit.reductionRate;
    credit = Math.max(0, credit - reduction);
  }
  
  return credit;
}

/**
 * Check if address is in Northern Ontario
 */
export function isNorthernOntario(postalCode) {
  // Northern Ontario postal code prefixes
  const northernPrefixes = ['P0', 'P1', 'P2', 'P3', 'P5', 'P6', 'P7', 'P8', 'P9'];
  const prefix = postalCode.substring(0, 2).toUpperCase();
  return northernPrefixes.includes(prefix);
}
