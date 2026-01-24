// t2125-generator.js — T2125 Statement of Business Activities Generator
// Federal form for self-employed rideshare/taxi drivers

/**
 * Constants for 2026 tax year
 */
export const BUSINESS_CODE_RIDESHARE = '485310';

/**
 * T2125 expense line codes
 */
export const T2125_LINE_CODES = {
  ADVERTISING: '8521',
  INSURANCE: '8690',
  MAINTENANCE: '8960',
  OFFICE: '8810',
  SUPPLIES: '8811',
  TELEPHONE: '9220',
  FUEL: '9281',
  VEHICLE: '9281',
  LICENSES: '8760',
  CCA: '9936'
};

/**
 * Calculate T2125 form data from business income and expenses
 * 
 * @param {Object} businessData - Business income and expense data
 * @param {number} businessData.grossFares - Total fares from rideshare/taxi
 * @param {number} businessData.commissions - Platform commissions (negative)
 * @param {number} businessData.otherIncome - Other business income
 * @param {Object} businessData.expenses - Expense breakdown
 * @param {number} businessData.expenses.advertising - Advertising expenses
 * @param {number} businessData.expenses.insurance - Vehicle insurance
 * @param {number} businessData.expenses.maintenance - Vehicle maintenance
 * @param {number} businessData.expenses.office - Office supplies
 * @param {number} businessData.expenses.supplies - General supplies
 * @param {number} businessData.expenses.telephone - Phone/data expenses
 * @param {number} businessData.expenses.fuel - Fuel costs
 * @param {number} businessData.expenses.vehicle - Other vehicle expenses
 * @param {number} businessData.expenses.licenses - License and permit fees
 * @param {number} businessData.expenses.cca - Capital Cost Allowance
 * @returns {Object} T2125 calculation object
 */
export function calculateT2125(businessData) {
  // Validate input
  if (!businessData || typeof businessData !== 'object') {
    throw new Error('Invalid business data: must be an object');
  }

  // Extract income
  const grossFares = Number(businessData.grossFares) || 0;
  const commissions = Number(businessData.commissions) || 0;
  const otherIncome = Number(businessData.otherIncome) || 0;

  // Validate income values
  if (grossFares < 0) {
    throw new Error('Invalid gross fares: must be non-negative');
  }

  // Calculate gross income
  const grossIncome = Math.round((grossFares + commissions + otherIncome) * 100) / 100;

  // Extract and validate expenses
  const expenses = businessData.expenses || {};
  const expenseBreakdown = {
    advertising: Math.max(0, Number(expenses.advertising) || 0),
    insurance: Math.max(0, Number(expenses.insurance) || 0),
    maintenance: Math.max(0, Number(expenses.maintenance) || 0),
    office: Math.max(0, Number(expenses.office) || 0),
    supplies: Math.max(0, Number(expenses.supplies) || 0),
    telephone: Math.max(0, Number(expenses.telephone) || 0),
    fuel: Math.max(0, Number(expenses.fuel) || 0),
    vehicle: Math.max(0, Number(expenses.vehicle) || 0),
    licenses: Math.max(0, Number(expenses.licenses) || 0),
    cca: Math.max(0, Number(expenses.cca) || 0)
  };

  // Calculate total expenses
  const totalExpenses = Math.round(
    Object.values(expenseBreakdown).reduce((sum, expense) => sum + expense, 0) * 100
  ) / 100;

  // Calculate net income
  const netIncome = Math.round((grossIncome - totalExpenses) * 100) / 100;

  return {
    income: {
      grossFares: Math.round(grossFares * 100) / 100,
      commissions: Math.round(commissions * 100) / 100,
      otherIncome: Math.round(otherIncome * 100) / 100,
      grossIncome
    },
    expenses: {
      advertising: Math.round(expenseBreakdown.advertising * 100) / 100,
      insurance: Math.round(expenseBreakdown.insurance * 100) / 100,
      maintenance: Math.round(expenseBreakdown.maintenance * 100) / 100,
      office: Math.round(expenseBreakdown.office * 100) / 100,
      supplies: Math.round(expenseBreakdown.supplies * 100) / 100,
      telephone: Math.round(expenseBreakdown.telephone * 100) / 100,
      fuel: Math.round(expenseBreakdown.fuel * 100) / 100,
      vehicle: Math.round(expenseBreakdown.vehicle * 100) / 100,
      licenses: Math.round(expenseBreakdown.licenses * 100) / 100,
      cca: Math.round(expenseBreakdown.cca * 100) / 100,
      totalExpenses
    },
    netIncome
  };
}

/**
 * Generate complete T2125 form with driver information
 * 
 * @param {Object} driverInfo - Driver personal information
 * @param {string} driverInfo.name - Driver's full name
 * @param {string} driverInfo.sin - Social Insurance Number
 * @param {string} driverInfo.address - Business address
 * @param {number} driverInfo.fiscalYear - Tax year (e.g., 2026)
 * @param {Object} businessData - Business income and expense data
 * @returns {Object} Complete T2125 form data
 */
export function generateT2125Form(driverInfo, businessData) {
  // Validate driver info
  if (!driverInfo || typeof driverInfo !== 'object') {
    throw new Error('Invalid driver info: must be an object');
  }

  if (!driverInfo.name || typeof driverInfo.name !== 'string') {
    throw new Error('Invalid driver name: required string');
  }

  // Calculate T2125 values
  const calculation = calculateT2125(businessData);

  // Generate form
  return {
    formType: 'T2125',
    businessCode: BUSINESS_CODE_RIDESHARE,
    driverInfo: {
      name: driverInfo.name,
      sin: driverInfo.sin || '',
      address: driverInfo.address || '',
      fiscalYear: driverInfo.fiscalYear || new Date().getFullYear()
    },
    businessActivity: 'Rideshare/Taxi Driver',
    ...calculation,
    generatedDate: new Date().toISOString()
  };
}

/**
 * Export T2125 form as printable text format
 * 
 * @param {Object} formData - Complete T2125 form data
 * @returns {string} Printable text representation
 */
export function exportT2125AsText(formData) {
  if (!formData || typeof formData !== 'object') {
    throw new Error('Invalid form data');
  }

  const lines = [];
  
  lines.push('='.repeat(70));
  lines.push('CANADA REVENUE AGENCY');
  lines.push('T2125 - STATEMENT OF BUSINESS ACTIVITIES');
  lines.push('='.repeat(70));
  lines.push('');
  
  // Driver information
  lines.push('DRIVER INFORMATION:');
  lines.push(`Name: ${formData.driverInfo?.name || 'N/A'}`);
  lines.push(`SIN: ${formData.driverInfo?.sin || 'N/A'}`);
  lines.push(`Address: ${formData.driverInfo?.address || 'N/A'}`);
  lines.push(`Fiscal Year: ${formData.driverInfo?.fiscalYear || 'N/A'}`);
  lines.push(`Business Code: ${formData.businessCode || BUSINESS_CODE_RIDESHARE}`);
  lines.push(`Business Activity: ${formData.businessActivity || 'Rideshare/Taxi Driver'}`);
  lines.push('');
  
  // Income section
  lines.push('-'.repeat(70));
  lines.push('INCOME:');
  lines.push('-'.repeat(70));
  lines.push(`Gross Fares:                                      $${(formData.income?.grossFares || 0).toFixed(2).padStart(12)}`);
  lines.push(`Platform Commissions:                             $${(formData.income?.commissions || 0).toFixed(2).padStart(12)}`);
  lines.push(`Other Income:                                     $${(formData.income?.otherIncome || 0).toFixed(2).padStart(12)}`);
  lines.push(`${''.padStart(58, '-')}`);
  lines.push(`GROSS INCOME:                                     $${(formData.income?.grossIncome || 0).toFixed(2).padStart(12)}`);
  lines.push('');
  
  // Expenses section
  lines.push('-'.repeat(70));
  lines.push('EXPENSES:');
  lines.push('-'.repeat(70));
  lines.push(`Advertising (${T2125_LINE_CODES.ADVERTISING}):                                 $${(formData.expenses?.advertising || 0).toFixed(2).padStart(12)}`);
  lines.push(`Insurance (${T2125_LINE_CODES.INSURANCE}):                                   $${(formData.expenses?.insurance || 0).toFixed(2).padStart(12)}`);
  lines.push(`Maintenance (${T2125_LINE_CODES.MAINTENANCE}):                                 $${(formData.expenses?.maintenance || 0).toFixed(2).padStart(12)}`);
  lines.push(`Office Expenses (${T2125_LINE_CODES.OFFICE}):                            $${(formData.expenses?.office || 0).toFixed(2).padStart(12)}`);
  lines.push(`Supplies (${T2125_LINE_CODES.SUPPLIES}):                                   $${(formData.expenses?.supplies || 0).toFixed(2).padStart(12)}`);
  lines.push(`Telephone (${T2125_LINE_CODES.TELEPHONE}):                                   $${(formData.expenses?.telephone || 0).toFixed(2).padStart(12)}`);
  lines.push(`Fuel (${T2125_LINE_CODES.FUEL}):                                        $${(formData.expenses?.fuel || 0).toFixed(2).padStart(12)}`);
  lines.push(`Vehicle Expenses (${T2125_LINE_CODES.VEHICLE}):                          $${(formData.expenses?.vehicle || 0).toFixed(2).padStart(12)}`);
  lines.push(`Licenses (${T2125_LINE_CODES.LICENSES}):                                   $${(formData.expenses?.licenses || 0).toFixed(2).padStart(12)}`);
  lines.push(`Capital Cost Allowance (${T2125_LINE_CODES.CCA}):                    $${(formData.expenses?.cca || 0).toFixed(2).padStart(12)}`);
  lines.push(`${''.padStart(58, '-')}`);
  lines.push(`TOTAL EXPENSES:                                   $${(formData.expenses?.totalExpenses || 0).toFixed(2).padStart(12)}`);
  lines.push('');
  
  // Net income
  lines.push('='.repeat(70));
  lines.push(`NET BUSINESS INCOME (LOSS):                       $${(formData.netIncome || 0).toFixed(2).padStart(12)}`);
  lines.push('='.repeat(70));
  lines.push('');
  lines.push(`Generated: ${formData.generatedDate || new Date().toISOString()}`);
  
  return lines.join('\n');
}
