/**
 * Quebec Provincial Tax Calculator
 * 2026 tax year
 * 
 * Tax brackets and rates source: Revenu Québec
 * https://www.revenuquebec.ca/en/citizens/income-tax-return/
 */

// Import credit calculation functions to avoid duplication
import { 
  calculateWorkPremium as workPremiumCalc,
  calculateSolidarityCredit as solidarityCreditCalc,
  calculateQuebecBPA as quebecBPACalc
} from './credit-calculator.js';

export const QUEBEC_TAX_RATES_2026 = {
  brackets: [
    { limit: 54345, rate: 0.14 },     // 14% up to $54,345
    { limit: 108680, rate: 0.19 },    // 19% $54,345 - $108,680 (reduced from 20% in 2025)
    { limit: 132245, rate: 0.24 },    // 24% $108,680 - $132,245
    { limit: Infinity, rate: 0.2575 }, // 25.75% over $132,245
  ],
  
  // Basic personal amount
  basicPersonalAmount: 18952, // 2026 (highest in Canada!)
  
  // Spouse/common-law partner amount
  spouseAmount: 18952,
  
  // Quebec-specific credits
  workPremium: {
    enabled: true,
    minIncome: 7200,
    maxIncome: 57965,
    rate: 0.26,
    maxCreditSingle: 728,
    maxCreditFamily: 1456,
  },
  
  solidarityCredit: {
    enabled: true,
    baseSingle: 531,
    baseCouple: 1062,
    phaseoutStart: 57965,
    phaseoutEnd: 64125,
  },
  
  // Quebec Pension Plan (QPP) - 2026
  qpp: {
    baseRate: 0.138,              // 13.8% (6.9% employee + 6.9% employer for self-employed)
    maxPensionableEarnings: 73200,
    basicExemption: 3500,
    qpp2Rate: 0.02,               // 2% second additional contribution
    qpp2MaxEarnings: 86700,
  },
  
  // No provincial surtax in Quebec (unlike Ontario)
  // Quebec has its own separate tax system (not integrated with federal)
};

/**
 * Calculate Quebec provincial tax
 */
export function calculateQuebecTax(taxableIncome) {
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
  
  for (const bracket of QUEBEC_TAX_RATES_2026.brackets) {
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
  const basicCredit = QUEBEC_TAX_RATES_2026.basicPersonalAmount * QUEBEC_TAX_RATES_2026.brackets[0].rate;
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
 * Calculate Quebec marginal tax rate
 */
export function getQuebecMarginalRate(taxableIncome) {
  for (const bracket of QUEBEC_TAX_RATES_2026.brackets) {
    if (taxableIncome <= bracket.limit) {
      return bracket.rate * 100;
    }
  }
  return QUEBEC_TAX_RATES_2026.brackets[QUEBEC_TAX_RATES_2026.brackets.length - 1].rate * 100;
}

/**
 * Calculate Quebec Work Premium (Prime au travail)
 * Re-exports from credit-calculator.js to avoid duplication
 *
 * @param {number} income - Annual work income in CAD
 * @param {boolean} [isSingle=true] - Whether the person is single or has dependents
 * @returns {number} Credit amount in CAD (max $728 single, $1,456 with dependents)
 */
export function calculateWorkPremium(income, isSingle = true) {
  return workPremiumCalc(income, isSingle);
}

/**
 * Calculate the Quebec Solidarity Tax Credit (Crédit pour la solidarité)
 * Re-exports from credit-calculator.js to avoid duplication
 *
 * @param {number} income - Annual net income in CAD
 * @param {boolean} [isSingle=true] - Whether the person is single (true) or has a spouse (false)
 * @returns {number} Credit amount in CAD (rounded to 2 decimal places)
 */
export function calculateSolidarityCredit(income, isSingle = true) {
  return solidarityCreditCalc(income, isSingle);
}

/**
 * Calculate basic personal amount credit for Quebec
 * Re-exports from credit-calculator.js to avoid duplication
 * @returns {number} Tax credit value
 */
export function calculateQuebecBPA() {
  return quebecBPACalc();
}

/**
 * Calculate Quebec Pension Plan (QPP) contributions for self-employed
 * Self-employed individuals pay both employee and employer portions
 *
 * @param {number} selfEmploymentIncome - Net self-employment income
 * @returns {Object} QPP contribution breakdown
 */
export function calculateQPPContributions(selfEmploymentIncome) {
  const { qpp } = QUEBEC_TAX_RATES_2026;
  
  if (selfEmploymentIncome <= qpp.basicExemption) {
    return {
      baseContribution: 0,
      qpp2Contribution: 0,
      totalContribution: 0,
      deductibleAmount: 0, // Employer portion is deductible
    };
  }
  
  // Base QPP contribution
  const pensionableEarnings = Math.min(selfEmploymentIncome, qpp.maxPensionableEarnings);
  const baseContribution = (pensionableEarnings - qpp.basicExemption) * qpp.baseRate;
  
  // QPP2 (second additional contribution) applies on earnings above maxPensionableEarnings
  let qpp2Contribution = 0;
  if (selfEmploymentIncome > qpp.maxPensionableEarnings) {
    const qpp2Earnings = Math.min(selfEmploymentIncome, qpp.qpp2MaxEarnings) - qpp.maxPensionableEarnings;
    qpp2Contribution = qpp2Earnings * qpp.qpp2Rate;
  }
  
  const totalContribution = baseContribution + qpp2Contribution;
  
  // Employer portion (half of total) is deductible
  const deductibleAmount = totalContribution / 2;
  
  return {
    baseContribution: Math.round(baseContribution * 100) / 100,
    qpp2Contribution: Math.round(qpp2Contribution * 100) / 100,
    totalContribution: Math.round(totalContribution * 100) / 100,
    deductibleAmount: Math.round(deductibleAmount * 100) / 100,
    maxContribution: Math.round(((qpp.maxPensionableEarnings - qpp.basicExemption) * qpp.baseRate + 
                                (qpp.qpp2MaxEarnings - qpp.maxPensionableEarnings) * qpp.qpp2Rate) * 100) / 100,
  };
}

/**
 * Calculate combined federal + Quebec marginal tax rate
 * Useful for RRSP and other deduction planning
 * 
 * @param {number} taxableIncome - Taxable income
 * @returns {number} Combined marginal rate as percentage
 */
export function getCombinedMarginalRate(taxableIncome) {
  // Federal rates 2026
  const federalRates = [
    { limit: 58523, rate: 14 },
    { limit: 117045, rate: 20.5 },
    { limit: 181440, rate: 26 },
    { limit: 258482, rate: 29 },
    { limit: Infinity, rate: 33 },
  ];
  
  let federalRate = 33;
  for (const bracket of federalRates) {
    if (taxableIncome <= bracket.limit) {
      federalRate = bracket.rate;
      break;
    }
  }
  
  const quebecRate = getQuebecMarginalRate(taxableIncome);
  
  return federalRate + quebecRate;
}
