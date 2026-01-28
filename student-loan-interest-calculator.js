/**
 * Student Loan Interest Tax Credit Calculator
 * For Canadian government student loans
 * 2026 tax year
 */

export const STUDENT_LOAN_RATES_2026 = {
  federal: {
    creditRate: 0.15,  // 15% federal credit
  },
  
  provincial: {
    QC: 0.20,    // 20% - Highest!
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
  
  carryforward: {
    maxYears: 5,  // Can carry forward for 5 years
  },
  
  // Provincial student loan programs
  provincialPrograms: {
    QC: 'Aide financière aux études (AFE)',
    ON: 'Ontario Student Assistance Program (OSAP)',
    AB: 'Alberta Student Aid',
    BC: 'StudentAid BC',
    MB: 'Manitoba Student Aid',
    SK: 'Saskatchewan Student Loans',
    NS: 'Nova Scotia Student Assistance',
    NB: 'New Brunswick Student Financial Services',
    PE: 'PEI Student Financial Assistance',
    NL: 'Newfoundland Student Aid',
    YT: 'Yukon Student Financial Assistance',
    NT: 'NWT Student Financial Assistance',
    NU: 'Nunavut Student Financial Assistance',
  },
};

/**
 * Calculate student loan interest tax credit
 * @param {number} interestPaid - Interest paid in current year
 * @param {string} province - Province code
 * @returns {Object} Tax credit calculation
 */
export function calculateStudentLoanInterestCredit(interestPaid, province = 'QC') {
  if (interestPaid <= 0) {
    return {
      interestPaid: 0,
      federalCredit: 0,
      provincialCredit: 0,
      totalCredit: 0,
    };
  }
  
  const { federal, provincial } = STUDENT_LOAN_RATES_2026;
  
  // Federal credit
  const federalCredit = interestPaid * federal.creditRate;
  
  // Provincial credit
  const provincialRate = provincial[province] || 0.10;
  const provincialCredit = interestPaid * provincialRate;
  
  const totalCredit = federalCredit + provincialCredit;
  
  return {
    interestPaid: Math.round(interestPaid * 100) / 100,
    federalRate: federal.creditRate * 100,
    federalCredit: Math.round(federalCredit * 100) / 100,
    provincialRate: Math.round(provincialRate * 10000) / 100,
    provincialCredit: Math.round(provincialCredit * 100) / 100,
    totalCredit: Math.round(totalCredit * 100) / 100,
    province,
  };
}

/**
 * Calculate with carryforward amounts
 * @param {number} currentYearInterest - Interest paid this year
 * @param {Array} carryforwardAmounts - Array of {year, amount} objects
 * @param {string} province - Province code
 * @returns {Object} Credit calculation with carryforward
 */
export function calculateWithCarryforward(currentYearInterest, carryforwardAmounts = [], province = 'QC') {
  // Filter valid carryforward (within 5 years)
  const currentYear = 2026;
  const validCarryforward = carryforwardAmounts.filter(cf => {
    const yearDiff = currentYear - cf.year;
    return yearDiff > 0 && yearDiff <= STUDENT_LOAN_RATES_2026.carryforward.maxYears;
  });
  
  // Total available interest
  const carryforwardTotal = validCarryforward.reduce((sum, cf) => sum + cf.amount, 0);
  const totalInterest = currentYearInterest + carryforwardTotal;
  
  // Calculate credit on total
  const creditResult = calculateStudentLoanInterestCredit(totalInterest, province);
  
  return {
    currentYearInterest: Math.round(currentYearInterest * 100) / 100,
    carryforwardInterest: Math.round(carryforwardTotal * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    ...creditResult,
    carryforwardBreakdown: validCarryforward.map(cf => ({
      year: cf.year,
      amount: Math.round(cf.amount * 100) / 100,
    })),
  };
}

/**
 * Strategic claiming optimizer
 * Compare claiming now vs. carrying forward
 * @param {number} interestAmount - Interest to claim
 * @param {number} currentIncome - Current year income
 * @param {number} currentTaxOwing - Tax owing this year
 * @param {number} expectedFutureIncome - Expected income in 1-2 years
 * @param {string} province - Province code
 * @returns {Object} Claiming strategy recommendation
 */
export function optimizeClaimingStrategy(
  interestAmount,
  currentIncome,
  currentTaxOwing,
  expectedFutureIncome = null,
  province = 'QC'
) {
  const creditResult = calculateStudentLoanInterestCredit(interestAmount, province);
  
  // Can only use credit if you have tax owing
  const usableCredit = Math.min(creditResult.totalCredit, currentTaxOwing);
  const wastedCredit = creditResult.totalCredit - usableCredit;
  
  let recommendation = 'claim-now';
  let reasoning = [];
  
  // Low income - might waste credit
  if (currentIncome < 30000) {
    recommendation = 'carry-forward';
    reasoning.push('Income is low - you may not use full credit');
    reasoning.push('Consider carrying forward to year with higher income');
  }
  
  // Tax owing is less than credit
  if (wastedCredit > 0) {
    recommendation = 'carry-forward';
    reasoning.push(`You would waste $${Math.round(wastedCredit)} of credit`);
    reasoning.push('Carry forward to use full benefit');
  }
  
  // Expecting significant income increase
  if (expectedFutureIncome && expectedFutureIncome > currentIncome * 1.3) {
    recommendation = 'carry-forward';
    reasoning.push('Expected income increase of >30%');
    reasoning.push('Save for higher tax bracket year');
  }
  
  // Good income and can use full credit
  if (currentIncome >= 45000 && wastedCredit === 0) {
    recommendation = 'claim-now';
    reasoning.push('Income is sufficient to use full credit');
    reasoning.push('No benefit to waiting');
  }
  
  return {
    recommendation,
    reasoning,
    creditAvailable: creditResult.totalCredit,
    usableNow: Math.round(usableCredit * 100) / 100,
    wastedIfClaimNow: Math.round(wastedCredit * 100) / 100,
    currentIncome: Math.round(currentIncome * 100) / 100,
    currentTaxOwing: Math.round(currentTaxOwing * 100) / 100,
  };
}

/**
 * Validate student loan interest eligibility
 * @param {string} loanType - Type of loan
 * @param {boolean} isGovernmentLoan - Is it a government student loan?
 * @param {number} interestAmount - Interest amount
 * @returns {Object} Validation result
 */
export function validateStudentLoanInterest(loanType, isGovernmentLoan = true, interestAmount = 0) {
  const errors = [];
  
  if (!isGovernmentLoan) {
    errors.push('Only government student loans are eligible (Canada/Provincial Student Loans)');
    errors.push('Bank loans, lines of credit, and private loans do NOT qualify');
  }
  
  if (interestAmount < 0) {
    errors.push('Interest amount cannot be negative');
  }
  
  if (interestAmount === 0) {
    errors.push('No interest paid - no credit available');
  }
  
  const eligibleLoanTypes = [
    'Canada Student Loan',
    'Provincial Student Loan',
    'OSAP',
    'AFE',
    'StudentAid BC',
    'Alberta Student Aid',
    'Canada Apprentice Loan',
  ];
  
  return {
    isValid: errors.length === 0,
    errors,
    eligibleLoanTypes,
  };
}

/**
 * Calculate lifetime savings from student loan interest credit
 * @param {number} totalLoanBalance - Total student loan balance
 * @param {number} interestRate - Annual interest rate (e.g., 0.055 for 5.5%)
 * @param {number} yearsToRepay - Years to repay loan
 * @param {string} province - Province code
 * @returns {Object} Lifetime savings calculation
 */
export function calculateLifetimeSavings(totalLoanBalance, interestRate, yearsToRepay, province = 'QC') {
  // Simplified calculation - assumes level payments
  const monthlyRate = interestRate / 12;
  const numPayments = yearsToRepay * 12;
  
  // Monthly payment formula
  const monthlyPayment = totalLoanBalance * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                         (Math.pow(1 + monthlyRate, numPayments) - 1);
  
  const totalPaid = monthlyPayment * numPayments;
  const totalInterest = totalPaid - totalLoanBalance;
  
  // Calculate average annual interest (declines over time)
  const averageAnnualInterest = totalInterest / yearsToRepay;
  
  // Calculate credits over lifetime
  const creditResult = calculateStudentLoanInterestCredit(averageAnnualInterest, province);
  const lifetimeSavings = creditResult.totalCredit * yearsToRepay;
  
  return {
    loanBalance: Math.round(totalLoanBalance * 100) / 100,
    interestRate: Math.round(interestRate * 10000) / 100,
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    yearsToRepay,
    totalInterestPaid: Math.round(totalInterest * 100) / 100,
    averageAnnualInterest: Math.round(averageAnnualInterest * 100) / 100,
    annualTaxSavings: creditResult.totalCredit,
    lifetimeTaxSavings: Math.round(lifetimeSavings * 100) / 100,
    province,
  };
}

/**
 * Get provincial student loan program information
 * @param {string} province - Province code
 * @returns {Object} Program information
 */
export function getProvincialProgramInfo(province) {
  const { provincialPrograms, provincial } = STUDENT_LOAN_RATES_2026;
  
  return {
    province,
    programName: provincialPrograms[province] || 'Provincial Student Aid',
    provincialCreditRate: (provincial[province] || 0.10) * 100,
    federalCreditRate: 15,
    combinedRate: ((provincial[province] || 0.10) + 0.15) * 100,
  };
}
