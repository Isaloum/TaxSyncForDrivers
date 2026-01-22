/**
 * Ontario Provincial Tax Calculator
 * 2026 tax year
 */

export const ONTARIO_TAX_RATES_2026 = {
  brackets: [
    { limit: 51446, rate: 0.0505 },   // 5.05% up to $51,446
    { limit: 102894, rate: 0.0915 },  // 9.15% $51,447 - $102,894
    { limit: 150000, rate: 0.1116 },  // 11.16% $102,895 - $150,000
    { limit: 220000, rate: 0.1216 },  // 12.16% $150,001 - $220,000
    { limit: Infinity, rate: 0.1316 }, // 13.16% over $220,000
  ],
  
  // Ontario surtax (additional tax on provincial tax)
  surtax: {
    threshold1: 5315,   // 20% surtax on provincial tax over $5,315
    rate1: 0.20,
    threshold2: 6802,   // Additional 36% surtax on provincial tax over $6,802
    rate2: 0.36,
  },
  
  // Basic personal amount
  basicPersonalAmount: 11865, // 2026
  
  // Ontario Health Premium (on taxable income)
  healthPremium: [
    { income: 20000, premium: 0 },
    { income: 25000, premium: 300 },
    { income: 36000, premium: 450 },
    { income: 48000, premium: 600 },
    { income: 72000, premium: 750 },
    { income: 200000, premium: 900 },
    { income: Infinity, premium: 900 },
  ],
};

/**
 * Calculate Ontario provincial tax
 */
export function calculateOntarioTax(taxableIncome) {
  if (taxableIncome <= 0) return { tax: 0, breakdown: {} };
  
  // Calculate tax based on brackets
  let tax = 0;
  let previousLimit = 0;
  
  for (const bracket of ONTARIO_TAX_RATES_2026.brackets) {
    if (taxableIncome > previousLimit) {
      const taxableInBracket = Math.min(taxableIncome, bracket.limit) - previousLimit;
      tax += taxableInBracket * bracket.rate;
      previousLimit = bracket.limit;
    } else {
      break;
    }
  }
  
  // Apply basic personal amount credit (5.05% rate on first bracket)
  const basicCredit = ONTARIO_TAX_RATES_2026.basicPersonalAmount * 0.0505;
  tax = Math.max(0, tax - basicCredit);
  
  // Calculate surtax
  let surtax = 0;
  
  if (tax > ONTARIO_TAX_RATES_2026.surtax.threshold1) {
    const surtaxableAmount1 = tax - ONTARIO_TAX_RATES_2026.surtax.threshold1;
    surtax += surtaxableAmount1 * ONTARIO_TAX_RATES_2026.surtax.rate1;
  }
  
  if (tax > ONTARIO_TAX_RATES_2026.surtax.threshold2) {
    const surtaxableAmount2 = tax - ONTARIO_TAX_RATES_2026.surtax.threshold2;
    surtax += surtaxableAmount2 * ONTARIO_TAX_RATES_2026.surtax.rate2;
  }
  
  // Calculate Ontario Health Premium
  const healthPremium = calculateOntarioHealthPremium(taxableIncome);
  
  const totalTax = tax + surtax + healthPremium;
  
  return {
    provincialTax: Math.round(tax * 100) / 100,
    surtax: Math.round(surtax * 100) / 100,
    healthPremium: Math.round(healthPremium * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
    effectiveRate: taxableIncome > 0 ? (totalTax / taxableIncome) * 100 : 0,
  };
}

/**
 * Calculate Ontario Health Premium
 */
function calculateOntarioHealthPremium(taxableIncome) {
  for (let i = 0; i < ONTARIO_TAX_RATES_2026.healthPremium.length; i++) {
    const tier = ONTARIO_TAX_RATES_2026.healthPremium[i];
    const nextTier = ONTARIO_TAX_RATES_2026.healthPremium[i + 1];
    
    if (!nextTier || taxableIncome <= nextTier.income) {
      // Interpolate between tiers if income falls in between
      if (nextTier && taxableIncome > tier.income) {
        const range = nextTier.income - tier.income;
        const position = taxableIncome - tier.income;
        const premiumDiff = nextTier.premium - tier.premium;
        return tier.premium + (position / range) * premiumDiff;
      }
      return tier.premium;
    }
  }
  
  return 900; // Maximum premium
}
