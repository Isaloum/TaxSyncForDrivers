/**
 * Employment-Related Tax Credits
 * Union Dues, Professional Dues, Home Buyers' Amount
 * 2026 tax year
 */

export const EMPLOYMENT_CREDITS_2026 = {
  // Union & Professional Dues Credit Rates
  unionDues: {
    federal: {
      rate: 0.15,  // 15% federal credit
    },
    
    provincial: {
      QC: 0.14,    // 14% (lowest QC bracket)
      ON: 0.0505,  // 5.05%
      AB: 0.10,    // 10%
      BC: 0.0506,  // 5.06%
      MB: 0.108,   // 10.8%
      SK: 0.105,   // 10.5%
      NS: 0.0879,  // 8.79%
      NB: 0.094,   // 9.4%
      PE: 0.098,   // 9.8%
      NL: 0.087,   // 8.7%
      YT: 0.064,   // 6.4%
      NT: 0.059,   // 5.9%
      NU: 0.04,    // 4%
    },
  },
  
  // First-Time Home Buyers' Amount
  homeBuyersAmount: {
    federal: {
      amount: 10000,
      creditRate: 0.15,
      credit: 1500,
    },
    
    // Provincial land transfer tax rebates
    provincial: {
      ON: {
        maxRebate: 4000,
        description: 'Ontario Land Transfer Tax Rebate',
      },
      BC: {
        maxRebate: 8000,
        description: 'BC Property Transfer Tax Exemption',
      },
      PE: {
        maxRebate: 5500,
        description: 'PEI First-Time Home Buyer Incentive',
      },
      // Other provinces: federal only
    },
    
    // RRSP Home Buyers' Plan
    rrspHBP: {
      maxWithdrawal: 60000,  // Per person
      repaymentPeriod: 15,   // Years
      description: 'RRSP Home Buyers\' Plan - withdraw up to $60,000 tax-free',
    },
  },
};

/**
 * Calculate union/professional dues tax credit
 * @param {number} duesPaid - Annual dues paid
 * @param {string} province - Province code
 * @returns {Object} Tax credit calculation
 */
export function calculateUnionDuesCredit(duesPaid, province = 'QC') {
  if (duesPaid <= 0) {
    return {
      duesPaid: 0,
      federalCredit: 0,
      provincialCredit: 0,
      totalCredit: 0,
    };
  }
  
  const { unionDues } = EMPLOYMENT_CREDITS_2026;
  
  // Federal credit
  const federalCredit = duesPaid * unionDues.federal.rate;
  
  // Provincial credit
  const provincialRate = unionDues.provincial[province] || 0.10;
  const provincialCredit = duesPaid * provincialRate;
  
  const totalCredit = federalCredit + provincialCredit;
  
  return {
    duesPaid: Math.round(duesPaid * 100) / 100,
    federalRate: unionDues.federal.rate * 100,
    federalCredit: Math.round(federalCredit * 100) / 100,
    provincialRate: Math.round(provincialRate * 10000) / 100,
    provincialCredit: Math.round(provincialCredit * 100) / 100,
    totalCredit: Math.round(totalCredit * 100) / 100,
    province,
  };
}

/**
 * Calculate first-time home buyers' amount
 * @param {boolean} isFirstTimeBuyer - Is this a first-time purchase?
 * @param {string} province - Province code
 * @param {boolean} usingRRSPHBP - Planning to use RRSP Home Buyers' Plan?
 * @param {boolean} hasSpouse - Does buyer have spouse/partner?
 * @returns {Object} Home buyers' benefits
 */
export function calculateHomeBuyersAmount(
  isFirstTimeBuyer = true,
  province = 'ON',
  usingRRSPHBP = false,
  hasSpouse = false
) {
  const { homeBuyersAmount } = EMPLOYMENT_CREDITS_2026;
  
  if (!isFirstTimeBuyer) {
    return {
      eligible: false,
      reason: 'Not a first-time home buyer',
      federalCredit: 0,
      provincialRebate: 0,
      totalBenefit: 0,
    };
  }
  
  // Federal credit
  const federalCredit = homeBuyersAmount.federal.credit;
  
  // Provincial rebate/credit
  const provincialInfo = homeBuyersAmount.provincial[province];
  const provincialRebate = provincialInfo?.maxRebate || 0;
  const provincialDescription = provincialInfo?.description || 'No provincial benefit';
  
  // RRSP HBP
  let rrspHBPAmount = 0;
  if (usingRRSPHBP) {
    rrspHBPAmount = homeBuyersAmount.rrspHBP.maxWithdrawal;
    if (hasSpouse) {
      rrspHBPAmount *= 2; // Both can withdraw
    }
  }
  
  const totalBenefit = federalCredit + provincialRebate;
  
  return {
    eligible: true,
    federalCredit,
    provincialRebate,
    provincialDescription,
    totalBenefit: Math.round(totalBenefit * 100) / 100,
    rrspHBP: usingRRSPHBP ? {
      maxWithdrawal: rrspHBPAmount,
      repaymentPeriod: homeBuyersAmount.rrspHBP.repaymentPeriod,
      description: homeBuyersAmount.rrspHBP.description,
    } : null,
    province,
  };
}

/**
 * Validate union dues inputs
 * @param {number} duesPaid - Dues paid
 * @param {boolean} requiredForEmployment - Required for job?
 * @param {boolean} reimbursed - Reimbursed by employer?
 * @returns {Object} Validation result
 */
export function validateUnionDues(duesPaid, requiredForEmployment = true, reimbursed = false) {
  const errors = [];
  
  if (duesPaid < 0) {
    errors.push('Dues paid cannot be negative');
  }
  
  if (!requiredForEmployment) {
    errors.push('Dues must be required for employment to be eligible for credit');
  }
  
  if (reimbursed) {
    errors.push('Reimbursed dues are not eligible for tax credit');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate home buyers' eligibility
 * @param {boolean} ownedInPast4Years - Owned home in past 4 years?
 * @param {boolean} spouseOwnedInPast4Years - Spouse owned in past 4 years?
 * @param {boolean} homeInCanada - Is home in Canada?
 * @param {boolean} intentToOccupy - Intent to occupy within 1 year?
 * @returns {Object} Validation result
 */
export function validateHomeBuyersEligibility(
  ownedInPast4Years = false,
  spouseOwnedInPast4Years = false,
  homeInCanada = true,
  intentToOccupy = true
) {
  const errors = [];
  
  if (ownedInPast4Years) {
    errors.push('You owned a home in the past 4 years - not a first-time buyer');
  }
  
  if (spouseOwnedInPast4Years) {
    errors.push('Your spouse owned a home in the past 4 years - not eligible');
  }
  
  if (!homeInCanada) {
    errors.push('Home must be located in Canada');
  }
  
  if (!intentToOccupy) {
    errors.push('You must intend to occupy the home within 1 year');
  }
  
  const isEligible = errors.length === 0;
  
  return {
    isEligible,
    errors,
    eligibilityType: isEligible ? 'first-time-buyer' : 'not-eligible',
  };
}

/**
 * Calculate RRSP Home Buyers' Plan repayment schedule
 * @param {number} withdrawalAmount - Amount withdrawn
 * @returns {Object} Repayment schedule
 */
export function calculateHBPRepayment(withdrawalAmount) {
  const repaymentPeriod = 15; // years
  const annualRepayment = withdrawalAmount / repaymentPeriod;
  
  return {
    withdrawalAmount: Math.round(withdrawalAmount * 100) / 100,
    repaymentPeriod,
    annualRepayment: Math.round(annualRepayment * 100) / 100,
    monthlyRepayment: Math.round((annualRepayment / 12) * 100) / 100,
    totalRepayment: Math.round(withdrawalAmount * 100) / 100,
    interestCost: 0, // HBP is interest-free!
  };
}

/**
 * Extract union dues from T4 slip
 * @param {Object} t4Slip - T4 slip data
 * @returns {number} Union dues amount
 */
export function extractUnionDuesFromT4(t4Slip) {
  // Box 44 on T4 slip
  return parseFloat(t4Slip.box44_union_dues) || 0;
}
