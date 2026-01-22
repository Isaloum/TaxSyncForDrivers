/**
 * British Columbia Provincial Tax Calculator
 * 2026 tax year
 */

export const BC_TAX_RATES_2026 = {
  brackets: [
    { limit: 47937, rate: 0.0506 },    // 5.06% up to $47,937
    { limit: 95875, rate: 0.077 },     // 7.7% $47,938 - $95,875
    { limit: 110076, rate: 0.105 },    // 10.5% $95,876 - $110,076
    { limit: 133664, rate: 0.1229 },   // 12.29% $110,077 - $133,664
    { limit: 181232, rate: 0.147 },    // 14.7% $133,665 - $181,232
    { limit: 252752, rate: 0.168 },    // 16.8% $181,233 - $252,752
    { limit: Infinity, rate: 0.205 },  // 20.5% over $252,752
  ],
  
  // Basic personal amount
  basicPersonalAmount: 12580, // 2026 (indexed annually)
  
  // No provincial surtax in BC (unlike Ontario)
  // No health premium (MSP eliminated Jan 1, 2020)
};

/**
 * Calculate BC provincial tax
 */
export function calculateBCTax(taxableIncome) {
  if (taxableIncome <= 0) return { 
    provincialTax: 0, 
    basicPersonalCredit: 0, 
    totalTax: 0, 
    effectiveRate: 0, 
    bracketBreakdown: [] 
  };
  
  // Calculate tax based on brackets
  let tax = 0;
  let previousLimit = 0;
  const bracketBreakdown = [];
  
  for (const bracket of BC_TAX_RATES_2026.brackets) {
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
  
  // Apply basic personal amount credit (lowest bracket rate)
  const basicCredit = BC_TAX_RATES_2026.basicPersonalAmount * BC_TAX_RATES_2026.brackets[0].rate;
  tax = Math.max(0, tax - basicCredit);
  
  return {
    provincialTax: Math.round(tax * 100) / 100,
    basicPersonalCredit: Math.round(basicCredit * 100) / 100,
    totalTax: Math.round(tax * 100) / 100,
    effectiveRate: taxableIncome > 0 ? Math.round((tax / taxableIncome) * 10000) / 100 : 0,
    bracketBreakdown,
  };
}

/**
 * Calculate marginal tax rate for BC
 */
export function getBCMarginalRate(taxableIncome) {
  for (const bracket of BC_TAX_RATES_2026.brackets) {
    if (taxableIncome <= bracket.limit) {
      return bracket.rate * 100;
    }
  }
  return BC_TAX_RATES_2026.brackets[BC_TAX_RATES_2026.brackets.length - 1].rate * 100;
}
