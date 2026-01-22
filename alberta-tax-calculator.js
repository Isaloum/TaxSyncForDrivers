/**
 * Alberta Provincial Tax Calculator
 * 2026 tax year
 * Alberta has the lowest provincial tax rates in Canada
 * 
 * Tax brackets and rates source: Government of Alberta
 * https://www.alberta.ca/personal-income-tax
 */

export const ALBERTA_TAX_RATES_2026 = {
  brackets: [
    { limit: 148269, rate: 0.10 },    // 10% up to $148,269
    { limit: 177922, rate: 0.12 },    // 12% $148,270 - $177,922
    { limit: 237230, rate: 0.13 },    // 13% $177,923 - $237,230
    { limit: 355845, rate: 0.14 },    // 14% $237,231 - $355,845
    { limit: Infinity, rate: 0.15 },  // 15% over $355,845
  ],
  
  // Basic personal amount
  basicPersonalAmount: 21885, // 2026 (highest in Canada!)
  
  // Spouse/common-law partner amount
  spouseAmount: 21885,
  
  // Dependent amount (per eligible dependent)
  dependentAmount: 21885,
  
  // Age amount (65+)
  ageAmount: 5690,
  
  // Pension income amount
  pensionIncomeAmount: 1574,
  
  // Disability amount
  disabilityAmount: 16653,
  
  // Alberta Family Employment Tax Credit (refundable)
  familyEmploymentCredit: {
    enabled: true,
    maxCredit: 2336,
    workingIncomeThreshold: 2760,
  },
  
  // No surtax in Alberta
  // No health premium in Alberta
  // No PST in Alberta (5% GST only)
};

/**
 * Calculate Alberta provincial tax
 * @param {number} taxableIncome - The taxable income amount
 * @param {Object} credits - Optional tax credit parameters
 * @param {boolean} credits.hasSpouse - Whether taxpayer has a spouse
 * @param {number} credits.spouseIncome - Spouse's income (if applicable)
 * @param {number} credits.numberOfDependents - Number of eligible dependents
 * @param {number} credits.age - Taxpayer's age (for age credit if 65+)
 * @param {number} credits.pensionIncome - Pension income amount
 * @param {boolean} credits.hasDisability - Whether taxpayer has a disability
 * @returns {Object} Tax calculation with provincialTax, totalCredits, totalTax, effectiveRate, bracketBreakdown
 */
export function calculateAlbertaTax(taxableIncome, credits = {}) {
  if (taxableIncome <= 0) return { 
    provincialTax: 0, 
    totalCredits: 0, 
    basicPersonalCredit: 0, 
    totalTax: 0, 
    effectiveRate: 0, 
    bracketBreakdown: [] 
  };
  
  const {
    hasSpouse = false,
    spouseIncome = 0,
    numberOfDependents = 0,
    age = 0,
    pensionIncome = 0,
    hasDisability = false,
  } = credits;
  
  // Calculate tax based on brackets
  let tax = 0;
  let previousLimit = 0;
  const bracketBreakdown = [];
  
  for (const bracket of ALBERTA_TAX_RATES_2026.brackets) {
    if (taxableIncome > previousLimit) {
      const taxableInBracket = Math.min(taxableIncome, bracket.limit) - previousLimit;
      const taxInBracket = taxableInBracket * bracket.rate;
      tax += taxInBracket;
      
      bracketBreakdown.push({
        limit: bracket.limit,
        rate: bracket.rate * 100,
        taxableAmount: Math.round(taxableInBracket * 100) / 100,
        taxAmount: Math.round(taxInBracket * 100) / 100,
      });
      
      previousLimit = bracket.limit;
    } else {
      break;
    }
  }
  
  // Calculate non-refundable tax credits (at lowest rate 10%)
  const creditRate = ALBERTA_TAX_RATES_2026.brackets[0].rate;
  let totalCredits = 0;
  
  // Basic personal amount (everyone gets this)
  const basicCredit = ALBERTA_TAX_RATES_2026.basicPersonalAmount * creditRate;
  totalCredits += basicCredit;
  
  // Spouse/common-law partner amount
  if (hasSpouse) {
    const spouseCredit = Math.max(0, ALBERTA_TAX_RATES_2026.spouseAmount - spouseIncome) * creditRate;
    totalCredits += spouseCredit;
  }
  
  // Dependent amount
  const dependentCredit = numberOfDependents * ALBERTA_TAX_RATES_2026.dependentAmount * creditRate;
  totalCredits += dependentCredit;
  
  // Age amount (65+)
  if (age >= 65) {
    const ageCredit = ALBERTA_TAX_RATES_2026.ageAmount * creditRate;
    totalCredits += ageCredit;
  }
  
  // Pension income amount
  if (pensionIncome > 0) {
    const pensionCredit = Math.min(pensionIncome, ALBERTA_TAX_RATES_2026.pensionIncomeAmount) * creditRate;
    totalCredits += pensionCredit;
  }
  
  // Disability amount
  if (hasDisability) {
    const disabilityCredit = ALBERTA_TAX_RATES_2026.disabilityAmount * creditRate;
    totalCredits += disabilityCredit;
  }
  
  // Apply credits
  tax = Math.max(0, tax - totalCredits);
  
  return {
    provincialTax: Math.round(tax * 100) / 100,
    totalCredits: Math.round(totalCredits * 100) / 100,
    basicPersonalCredit: Math.round(basicCredit * 100) / 100,
    totalTax: Math.round(tax * 100) / 100,
    effectiveRate: taxableIncome > 0 ? Math.round((tax / taxableIncome) * 10000) / 100 : 0,
    bracketBreakdown,
  };
}

/**
 * Calculate marginal tax rate for Alberta
 */
export function getAlbertaMarginalRate(taxableIncome) {
  for (const bracket of ALBERTA_TAX_RATES_2026.brackets) {
    if (taxableIncome <= bracket.limit) {
      return bracket.rate * 100;
    }
  }
  return ALBERTA_TAX_RATES_2026.brackets[ALBERTA_TAX_RATES_2026.brackets.length - 1].rate * 100;
}

/**
 * Calculate combined federal + Alberta marginal rate
 */
export function getCombinedMarginalRate(taxableIncome) {
  const albertaRate = getAlbertaMarginalRate(taxableIncome);
  
  // Federal rates 2026
  const federalRates = [
    { limit: 55867, rate: 15 },
    { limit: 111733, rate: 20.5 },
    { limit: 173205, rate: 26 },
    { limit: 246752, rate: 29 },
    { limit: Infinity, rate: 33 },
  ];
  
  let federalRate = 15;
  for (const bracket of federalRates) {
    if (taxableIncome <= bracket.limit) {
      federalRate = bracket.rate;
      break;
    }
  }
  
  return {
    federal: federalRate,
    provincial: albertaRate,
    combined: federalRate + albertaRate,
  };
}
