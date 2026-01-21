// home-office-calculator.js — Home Office Expense Calculator
// Based on CRA Form T777 and Quebec TP-78
// 2026 tax year

/**
 * Home office calculation limits and rates
 */
export const HOME_OFFICE_LIMITS = {
  simplifiedMaxDays: 250, // Maximum work-from-home days
  simplifiedRatePerDay: 2, // $2 per day
  simplifiedMaxClaim: 500, // Maximum $500 per year (simplified method)
};

/**
 * Calculate home office expenses using simplified method (temporary flat rate)
 * No receipts required - extended post-COVID
 * @param {number} workDaysAtHome - Number of days worked from home
 * @returns {object} - Calculation result
 */
export function calculateSimplifiedHomeOffice(workDaysAtHome) {
  const days = Math.min(workDaysAtHome, HOME_OFFICE_LIMITS.simplifiedMaxDays);
  const deduction = Math.min(
    days * HOME_OFFICE_LIMITS.simplifiedRatePerDay,
    HOME_OFFICE_LIMITS.simplifiedMaxClaim
  );

  return {
    method: 'simplified',
    deduction,
    workDays: days,
    ratePerDay: HOME_OFFICE_LIMITS.simplifiedRatePerDay,
  };
}

/**
 * Calculate home office expenses using detailed method (T777)
 * Requires receipts and workspace measurement
 * @param {object} workspace - Workspace dimensions
 * @param {object} expenses - Annual home expenses
 * @param {number} netBusinessIncome - Net business income (before home office deduction)
 * @returns {object} - Calculation result
 */
export function calculateDetailedHomeOffice(
  workspace,
  expenses,
  netBusinessIncome = Infinity
) {
  const { workspaceArea, totalHomeArea } = workspace;

  if (!workspaceArea || !totalHomeArea || totalHomeArea === 0) {
    return { deduction: 0, error: 'Workspace dimensions required' };
  }

  // Calculate workspace percentage
  const workspacePercent = (workspaceArea / totalHomeArea) * 100;

  // Eligible expenses
  const {
    rent = 0, // Annual rent OR
    mortgageInterest = 0, // Mortgage interest (not principal!)
    propertyTax = 0,
    homeInsurance = 0,
    utilities = 0, // Heat, electricity, water
    maintenanceRepairs = 0,
    condoFees = 0,
    internet = 0, // Can claim portion
    phone = 0, // Can claim portion
  } = expenses;

  // Rent and mortgage are mutually exclusive
  const housingCost = rent > 0 ? rent : mortgageInterest;

  // Calculate total eligible expenses
  const totalExpenses =
    housingCost +
    propertyTax +
    homeInsurance +
    utilities +
    maintenanceRepairs +
    condoFees +
    internet +
    phone;

  // Apply workspace percentage
  const calculatedDeduction = totalExpenses * (workspacePercent / 100);

  // CRITICAL: Cannot create or increase a business loss
  // Home office deduction cannot exceed net business income
  const deduction = Math.min(calculatedDeduction, netBusinessIncome);

  // If deduction is limited, carry forward the unused amount
  const unusedAmount = Math.max(0, calculatedDeduction - deduction);

  return {
    method: 'detailed',
    deduction: Math.round(deduction * 100) / 100,
    breakdown: {
      workspaceArea,
      totalHomeArea,
      workspacePercent: Math.round(workspacePercent * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      calculatedDeduction: Math.round(calculatedDeduction * 100) / 100,
      limitedByIncome: deduction < calculatedDeduction,
      unusedAmount: Math.round(unusedAmount * 100) / 100,
      breakdown: {
        housing: housingCost,
        propertyTax,
        insurance: homeInsurance,
        utilities,
        maintenance: maintenanceRepairs,
        condoFees,
        internet,
        phone,
      },
    },
  };
}

/**
 * Compare both home office calculation methods
 * @param {number} workDaysAtHome - Days worked from home
 * @param {object} workspace - Workspace dimensions
 * @param {object} expenses - Annual expenses
 * @param {number} netBusinessIncome - Net business income
 * @returns {object} - Comparison result
 */
export function compareHomeOfficeMethods(workDaysAtHome, workspace, expenses, netBusinessIncome) {
  const simplified = calculateSimplifiedHomeOffice(workDaysAtHome);
  const detailed = calculateDetailedHomeOffice(workspace, expenses, netBusinessIncome);

  if (detailed.error) {
    return { simplified, recommended: 'simplified', bestDeduction: simplified.deduction };
  }

  const recommended = simplified.deduction >= detailed.deduction ? 'simplified' : 'detailed';

  return {
    simplified,
    detailed,
    recommended,
    bestDeduction: Math.max(simplified.deduction, detailed.deduction),
    savings: Math.abs(simplified.deduction - detailed.deduction),
  };
}

/**
 * Quebec-specific home office calculation (TP-78)
 * Quebec follows the same rules and eligible expenses as federal T777
 * @param {object} workspace - Workspace dimensions
 * @param {object} expenses - Annual expenses
 * @param {number} netBusinessIncome - Net business income
 * @returns {object} - Calculation result
 */
export function calculateQuebecHomeOffice(workspace, expenses, netBusinessIncome) {
  // Quebec follows same rules as federal T777
  return calculateDetailedHomeOffice(workspace, expenses, netBusinessIncome);
}
