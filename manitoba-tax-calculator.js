/**
 * Manitoba Provincial Tax Calculator
 * 2026 tax year
 */

export const MANITOBA_TAX_RATES_2026 = {
  brackets: [
    { limit: 47000, rate: 0.108 },    // 10.8% up to $47,000
    { limit: 100000, rate: 0.1275 },  // 12.75% $47,001 - $100,000
    { limit: Infinity, rate: 0.174 }, // 17.4% over $100,000
  ],
  
  basicPersonalAmount: 15780,
  spouseAmount: 15780,
  
  // Education Property Tax Credit (unique to MB)
  educationPropertyTaxCredit: {
    maxCredit: 700,
    schoolTaxPercentage: 0.80, // 80% of school tax portion
  },
};

/**
 * Calculate Manitoba Education Property Tax Credit
 */
export function calculateManitobaEducationCredit(property) {
  const {
    schoolTaxPaid = 0,
    rentPaid = 0,
    netIncome = 0,
  } = property;
  
  let credit = 0;
  
  // Homeowners: 80% of school tax
  if (schoolTaxPaid > 0) {
    credit = Math.min(
      schoolTaxPaid * MANITOBA_TAX_RATES_2026.educationPropertyTaxCredit.schoolTaxPercentage,
      MANITOBA_TAX_RATES_2026.educationPropertyTaxCredit.maxCredit
    );
  }
  // Renters: 20% of rent (deemed school tax)
  else if (rentPaid > 0) {
    const deemedSchoolTax = rentPaid * 0.20;
    credit = Math.min(
      deemedSchoolTax * 0.80,
      MANITOBA_TAX_RATES_2026.educationPropertyTaxCredit.maxCredit
    );
  }
  
  return Math.round(credit * 100) / 100;
}

export function calculateManitobaTax(taxableIncome, credits = {}) {
  if (taxableIncome <= 0) return { tax: 0 };
  
  let tax = 0;
  let previousLimit = 0;
  
  for (const bracket of MANITOBA_TAX_RATES_2026.brackets) {
    if (taxableIncome > previousLimit) {
      const taxableInBracket = Math.min(taxableIncome, bracket.limit) - previousLimit;
      tax += taxableInBracket * bracket.rate;
      previousLimit = bracket.limit;
    } else {
      break;
    }
  }
  
  // Apply basic personal amount
  const basicCredit = MANITOBA_TAX_RATES_2026.basicPersonalAmount * MANITOBA_TAX_RATES_2026.brackets[0].rate;
  tax = Math.max(0, tax - basicCredit);
  
  return {
    provincialTax: Math.round(tax * 100) / 100,
    totalTax: Math.round(tax * 100) / 100,
  };
}
