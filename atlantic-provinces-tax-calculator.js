/**
 * Atlantic Provinces Tax Calculators
 * Nova Scotia, New Brunswick, PEI, Newfoundland and Labrador
 * 2026 tax year
 */

// NOVA SCOTIA
export const NOVA_SCOTIA_TAX_RATES_2026 = {
  brackets: [
    { limit: 29590, rate: 0.0879 },   // 8.79%
    { limit: 59180, rate: 0.1495 },   // 14.95%
    { limit: 93000, rate: 0.1667 },   // 16.67%
    { limit: 150000, rate: 0.175 },   // 17.5%
    { limit: Infinity, rate: 0.21 },  // 21% (highest in Canada)
  ],
  basicPersonalAmount: 11481,
};

export function calculateNovaScotiaTax(taxableIncome) {
  if (taxableIncome <= 0) return { tax: 0 };
  
  let tax = 0;
  let previousLimit = 0;
  
  for (const bracket of NOVA_SCOTIA_TAX_RATES_2026.brackets) {
    if (taxableIncome > previousLimit) {
      const taxableInBracket = Math.min(taxableIncome, bracket.limit) - previousLimit;
      tax += taxableInBracket * bracket.rate;
      previousLimit = bracket.limit;
    } else {
      break;
    }
  }
  
  const basicCredit = NOVA_SCOTIA_TAX_RATES_2026.basicPersonalAmount * NOVA_SCOTIA_TAX_RATES_2026.brackets[0].rate;
  tax = Math.max(0, tax - basicCredit);
  
  return { provincialTax: Math.round(tax * 100) / 100, totalTax: Math.round(tax * 100) / 100 };
}

// NEW BRUNSWICK
export const NEW_BRUNSWICK_TAX_RATES_2026 = {
  brackets: [
    { limit: 49958, rate: 0.094 },    // 9.4%
    { limit: 99916, rate: 0.14 },     // 14%
    { limit: 185064, rate: 0.16 },    // 16%
    { limit: Infinity, rate: 0.195 }, // 19.5%
  ],
  basicPersonalAmount: 13044,
};

export function calculateNewBrunswickTax(taxableIncome) {
  if (taxableIncome <= 0) return { tax: 0 };
  
  let tax = 0;
  let previousLimit = 0;
  
  for (const bracket of NEW_BRUNSWICK_TAX_RATES_2026.brackets) {
    if (taxableIncome > previousLimit) {
      const taxableInBracket = Math.min(taxableIncome, bracket.limit) - previousLimit;
      tax += taxableInBracket * bracket.rate;
      previousLimit = bracket.limit;
    } else {
      break;
    }
  }
  
  const basicCredit = NEW_BRUNSWICK_TAX_RATES_2026.basicPersonalAmount * NEW_BRUNSWICK_TAX_RATES_2026.brackets[0].rate;
  tax = Math.max(0, tax - basicCredit);
  
  return { provincialTax: Math.round(tax * 100) / 100, totalTax: Math.round(tax * 100) / 100 };
}

// PRINCE EDWARD ISLAND
export const PEI_TAX_RATES_2026 = {
  brackets: [
    { limit: 32656, rate: 0.098 },    // 9.8%
    { limit: 64313, rate: 0.138 },    // 13.8%
    { limit: 105000, rate: 0.167 },   // 16.7%
    { limit: Infinity, rate: 0.167 }, // 16.7%
  ],
  basicPersonalAmount: 13500,
  
  // PEI has a surtax
  surtax: {
    threshold: 12500,
    rate: 0.10, // 10% surtax on provincial tax over $12,500
  },
};

export function calculatePEITax(taxableIncome) {
  if (taxableIncome <= 0) return { tax: 0 };
  
  let tax = 0;
  let previousLimit = 0;
  
  for (const bracket of PEI_TAX_RATES_2026.brackets) {
    if (taxableIncome > previousLimit) {
      const taxableInBracket = Math.min(taxableIncome, bracket.limit) - previousLimit;
      tax += taxableInBracket * bracket.rate;
      previousLimit = bracket.limit;
    } else {
      break;
    }
  }
  
  const basicCredit = PEI_TAX_RATES_2026.basicPersonalAmount * PEI_TAX_RATES_2026.brackets[0].rate;
  tax = Math.max(0, tax - basicCredit);
  
  // Apply surtax
  let surtax = 0;
  if (tax > PEI_TAX_RATES_2026.surtax.threshold) {
    surtax = (tax - PEI_TAX_RATES_2026.surtax.threshold) * PEI_TAX_RATES_2026.surtax.rate;
  }
  
  const totalTax = tax + surtax;
  
  return { provincialTax: Math.round(tax * 100) / 100, surtax: Math.round(surtax * 100) / 100, totalTax: Math.round(totalTax * 100) / 100 };
}

// NEWFOUNDLAND AND LABRADOR
export const NEWFOUNDLAND_TAX_RATES_2026 = {
  brackets: [
    { limit: 43198, rate: 0.087 },    // 8.7%
    { limit: 86395, rate: 0.145 },    // 14.5%
    { limit: 154244, rate: 0.158 },   // 15.8%
    { limit: 215943, rate: 0.178 },   // 17.8%
    { limit: Infinity, rate: 0.218 }, // 21.8% (tied for highest)
  ],
  basicPersonalAmount: 10382,
};

export function calculateNewfoundlandTax(taxableIncome) {
  if (taxableIncome <= 0) return { tax: 0 };
  
  let tax = 0;
  let previousLimit = 0;
  
  for (const bracket of NEWFOUNDLAND_TAX_RATES_2026.brackets) {
    if (taxableIncome > previousLimit) {
      const taxableInBracket = Math.min(taxableIncome, bracket.limit) - previousLimit;
      tax += taxableInBracket * bracket.rate;
      previousLimit = bracket.limit;
    } else {
      break;
    }
  }
  
  const basicCredit = NEWFOUNDLAND_TAX_RATES_2026.basicPersonalAmount * NEWFOUNDLAND_TAX_RATES_2026.brackets[0].rate;
  tax = Math.max(0, tax - basicCredit);
  
  return { provincialTax: Math.round(tax * 100) / 100, totalTax: Math.round(tax * 100) / 100 };
}
