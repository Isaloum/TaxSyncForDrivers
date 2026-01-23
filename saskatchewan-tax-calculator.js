/**
 * Saskatchewan Provincial Tax Calculator
 * 2026 tax year
 */

export const SASKATCHEWAN_TAX_RATES_2026 = {
  brackets: [
    { limit: 52057, rate: 0.105 },    // 10.5% up to $52,057
    { limit: 148734, rate: 0.125 },   // 12.5% $52,058 - $148,734
    { limit: Infinity, rate: 0.145 }, // 14.5% over $148,734
  ],
  
  basicPersonalAmount: 17661,
  
  // Saskatchewan Low-Income Tax Credit
  lowIncomeCredit: {
    maxCredit: 575,
    phaseOutStart: 19396,
    phaseOutRate: 0.04,
  },
  
  // Graduate Retention Program
  graduateRetention: {
    maxCredit: 20000,  // Over 7 years ($3,000/yr avg)
    tuitionPaidThreshold: 1000,
  },
};

/**
 * Calculate Saskatchewan Low-Income Tax Credit
 */
export function calculateSaskatchewanLowIncomeCredit(netIncome) {
  let credit = SASKATCHEWAN_TAX_RATES_2026.lowIncomeCredit.maxCredit;
  
  if (netIncome > SASKATCHEWAN_TAX_RATES_2026.lowIncomeCredit.phaseOutStart) {
    const excess = netIncome - SASKATCHEWAN_TAX_RATES_2026.lowIncomeCredit.phaseOutStart;
    const reduction = excess * SASKATCHEWAN_TAX_RATES_2026.lowIncomeCredit.phaseOutRate;
    credit = Math.max(0, credit - reduction);
  }
  
  return Math.round(credit * 100) / 100;
}

/**
 * Calculate Graduate Retention Program Credit
 */
export function calculateGraduateRetentionCredit(graduate) {
  const {
    tuitionPaidInSask = 0,
    yearsInSask = 0,
  } = graduate;
  
  if (tuitionPaidInSask < SASKATCHEWAN_TAX_RATES_2026.graduateRetention.tuitionPaidThreshold) {
    return 0;
  }
  
  // Max $20,000 over 7 years
  const yearlyMax = SASKATCHEWAN_TAX_RATES_2026.graduateRetention.maxCredit / 7;
  const remainingYears = Math.max(0, 7 - yearsInSask);
  const totalRemaining = yearlyMax * remainingYears;
  
  return Math.min(tuitionPaidInSask, totalRemaining);
}

export function calculateSaskatchewanTax(taxableIncome) {
  if (taxableIncome <= 0) return { tax: 0 };
  
  let tax = 0;
  let previousLimit = 0;
  
  for (const bracket of SASKATCHEWAN_TAX_RATES_2026.brackets) {
    if (taxableIncome > previousLimit) {
      const taxableInBracket = Math.min(taxableIncome, bracket.limit) - previousLimit;
      tax += taxableInBracket * bracket.rate;
      previousLimit = bracket.limit;
    } else {
      break;
    }
  }
  
  const basicCredit = SASKATCHEWAN_TAX_RATES_2026.basicPersonalAmount * SASKATCHEWAN_TAX_RATES_2026.brackets[0].rate;
  tax = Math.max(0, tax - basicCredit);
  
  return {
    provincialTax: Math.round(tax * 100) / 100,
    totalTax: Math.round(tax * 100) / 100,
  };
}
