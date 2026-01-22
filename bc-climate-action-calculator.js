/**
 * BC Climate Action Tax Credit Calculator
 * Quarterly payment to help with carbon tax costs
 * 2026 tax year (amounts indexed annually)
 */

export const BC_CLIMATE_ACTION_2026 = {
  // Quarterly payment amounts (paid July, Oct, Jan, April)
  adult: 193.50,        // Per adult ($774/year)
  child: 56.50,         // Per child under 19 ($226/year)
  
  // Income thresholds for reduction
  singleThreshold: 41235,
  familyThreshold: 51121,
  
  // Reduction rate
  reductionRate: 0.02,  // 2% of net family income over threshold
};

/**
 * Calculate BC Climate Action Tax Credit
 */
export function calculateBCClimateAction(household) {
  const {
    netIncome,
    familyNetIncome,
    numberOfAdults = 1,
    numberOfChildren = 0,
    maritalStatus = 'single', // 'single', 'married', 'common-law'
  } = household;
  
  const isCouple = maritalStatus === 'married' || maritalStatus === 'common-law';
  const income = familyNetIncome || netIncome;
  
  // Calculate base credit
  const adultCredit = numberOfAdults * BC_CLIMATE_ACTION_2026.adult * 4; // Annual (4 quarters)
  const childCredit = numberOfChildren * BC_CLIMATE_ACTION_2026.child * 4;
  const baseCredit = adultCredit + childCredit;
  
  // Determine threshold
  const threshold = isCouple 
    ? BC_CLIMATE_ACTION_2026.familyThreshold 
    : BC_CLIMATE_ACTION_2026.singleThreshold;
  
  // Calculate reduction
  let credit = baseCredit;
  if (income > threshold) {
    const excessIncome = income - threshold;
    const reduction = excessIncome * BC_CLIMATE_ACTION_2026.reductionRate;
    credit = Math.max(0, baseCredit - reduction);
  }
  
  const quarterlyPayment = credit / 4;
  
  return {
    annualCredit: Math.round(credit * 100) / 100,
    quarterlyPayment: Math.round(quarterlyPayment * 100) / 100,
    baseCredit: Math.round(baseCredit * 100) / 100,
    reduction: Math.round((baseCredit - credit) * 100) / 100,
    paymentMonths: ['July', 'October', 'January', 'April'],
  };
}

/**
 * BC Affordability Credit
 * One-time payment introduced 2023, ongoing program
 * Combines former BCCREB (renters) with broader support
 */

export const BC_AFFORDABILITY_2026 = {
  // Annual amounts
  individual: 164,
  couple: 246,  // For married/common-law couples
  perChild: 41,
  
  // Income thresholds
  singleThreshold: 38000,
  familyThreshold: 52000,
  
  // Phase-out rate
  reductionRate: 0.02,
};

/**
 * Calculate BC Affordability Credit
 */
export function calculateBCAffordability(household) {
  const {
    netIncome,
    familyNetIncome,
    numberOfChildren = 0,
    maritalStatus = 'single',
  } = household;
  
  const isCouple = maritalStatus === 'married' || maritalStatus === 'common-law';
  const income = familyNetIncome || netIncome;
  
  // Base credit
  let baseCredit = isCouple 
    ? BC_AFFORDABILITY_2026.couple 
    : BC_AFFORDABILITY_2026.individual;
  
  baseCredit += numberOfChildren * BC_AFFORDABILITY_2026.perChild;
  
  // Threshold and reduction
  const threshold = isCouple 
    ? BC_AFFORDABILITY_2026.familyThreshold 
    : BC_AFFORDABILITY_2026.singleThreshold;
  
  let credit = baseCredit;
  if (income > threshold) {
    const excessIncome = income - threshold;
    const reduction = excessIncome * BC_AFFORDABILITY_2026.reductionRate;
    credit = Math.max(0, baseCredit - reduction);
  }
  
  return {
    annualCredit: Math.round(credit * 100) / 100,
    baseCredit: Math.round(baseCredit * 100) / 100,
    reduction: Math.round((baseCredit - credit) * 100) / 100,
  };
}
