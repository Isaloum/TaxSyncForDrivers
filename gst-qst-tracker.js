// gst-qst-tracker.js — GST/QST Sales Tax Tracker for Rideshare Drivers
// Track registration threshold and calculate net tax owing

/**
 * Constants for 2026 tax year
 */
export const GST_RATE = 0.05;
export const QST_RATE = 0.09975;
export const REGISTRATION_THRESHOLD = 30000;

/**
 * Track quarterly revenue for registration threshold
 * 
 * @param {Array} quarters - Array of quarterly revenue {quarter, year, revenue}
 * @returns {Object} Registration threshold analysis
 */
export function trackQuarterlyRevenue(quarters) {
  if (!Array.isArray(quarters)) {
    throw new Error('Invalid quarters: must be an array');
  }

  if (quarters.length === 0) {
    return {
      totalRevenue: 0,
      quarterCount: 0,
      rollingFourQuarterRevenue: 0,
      registrationRequired: false,
      approachingThreshold: false,
      remainingBeforeThreshold: REGISTRATION_THRESHOLD
    };
  }

  // Sort quarters by year and quarter
  const sortedQuarters = [...quarters].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.quarter - b.quarter;
  });

  // Calculate rolling 4-quarter revenue (last 4 consecutive quarters)
  let rollingRevenue = 0;
  if (sortedQuarters.length >= 4) {
    // Take last 4 quarters
    rollingRevenue = sortedQuarters
      .slice(-4)
      .reduce((sum, q) => sum + (Number(q.revenue) || 0), 0);
  } else {
    // If less than 4 quarters, sum all available
    rollingRevenue = sortedQuarters
      .reduce((sum, q) => sum + (Number(q.revenue) || 0), 0);
  }

  const totalRevenue = sortedQuarters.reduce((sum, q) => sum + (Number(q.revenue) || 0), 0);
  const registrationRequired = rollingRevenue > REGISTRATION_THRESHOLD;
  const approachingThreshold = rollingRevenue >= 25000 && rollingRevenue <= REGISTRATION_THRESHOLD;
  const remainingBeforeThreshold = Math.max(0, REGISTRATION_THRESHOLD - rollingRevenue);

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    quarterCount: sortedQuarters.length,
    rollingFourQuarterRevenue: Math.round(rollingRevenue * 100) / 100,
    registrationRequired,
    approachingThreshold,
    remainingBeforeThreshold: Math.round(remainingBeforeThreshold * 100) / 100
  };
}

/**
 * Calculate Input Tax Credits (ITC) on business expenses
 * 
 * @param {Object} expenses - Business expense breakdown
 * @param {number} expenses.fuel - Fuel costs
 * @param {number} expenses.maintenance - Maintenance costs
 * @param {number} expenses.insurance - Insurance costs
 * @param {number} expenses.supplies - Supply costs
 * @param {number} expenses.office - Office supply costs
 * @param {number} expenses.telephone - Phone/data costs
 * @param {number} expenses.advertising - Advertising costs
 * @param {string} province - Province code (for QST in Quebec)
 * @returns {Object} ITC calculation
 */
export function calculateITC(expenses, province = 'QC') {
  if (!expenses || typeof expenses !== 'object') {
    throw new Error('Invalid expenses: must be an object');
  }

  const eligibleExpenses = {
    fuel: Number(expenses.fuel) || 0,
    maintenance: Number(expenses.maintenance) || 0,
    insurance: Number(expenses.insurance) || 0,
    supplies: Number(expenses.supplies) || 0,
    office: Number(expenses.office) || 0,
    telephone: Number(expenses.telephone) || 0,
    advertising: Number(expenses.advertising) || 0
  };

  const totalEligibleExpenses = Object.values(eligibleExpenses).reduce((sum, val) => sum + val, 0);

  // Calculate ITC (GST paid on expenses)
  const gstITC = totalEligibleExpenses * GST_RATE;
  
  // QST ITC only applies in Quebec
  let qstITC = 0;
  if (province.toUpperCase() === 'QC') {
    qstITC = totalEligibleExpenses * QST_RATE;
  }

  return {
    eligibleExpenses: Math.round(totalEligibleExpenses * 100) / 100,
    gstITC: Math.round(gstITC * 100) / 100,
    qstITC: Math.round(qstITC * 100) / 100,
    totalITC: Math.round((gstITC + qstITC) * 100) / 100,
    province: province.toUpperCase()
  };
}

/**
 * Calculate GST/QST collected, ITC, and net tax owing
 * 
 * @param {number} income - Total business income
 * @param {Object} expenses - Business expenses for ITC calculation
 * @param {string} province - Province code
 * @returns {Object} Complete GST/QST calculation
 */
export function calculateGSTQST(income, expenses, province = 'QC') {
  if (typeof income !== 'number' || income < 0) {
    throw new Error('Invalid income: must be a non-negative number');
  }

  // Calculate tax collected on income
  const gstCollected = income * GST_RATE;
  
  let qstCollected = 0;
  if (province.toUpperCase() === 'QC') {
    qstCollected = income * QST_RATE;
  }

  const totalTaxCollected = gstCollected + qstCollected;

  // Calculate ITC on expenses
  const itc = calculateITC(expenses, province);

  // Net tax owing = collected - ITC
  const gstOwing = Math.max(0, gstCollected - itc.gstITC);
  const qstOwing = Math.max(0, qstCollected - itc.qstITC);
  const netTaxOwing = gstOwing + qstOwing;

  // ITC refund if expenses > income
  const gstRefund = Math.max(0, itc.gstITC - gstCollected);
  const qstRefund = Math.max(0, itc.qstITC - qstCollected);
  const totalRefund = gstRefund + qstRefund;

  return {
    income: Math.round(income * 100) / 100,
    gstCollected: Math.round(gstCollected * 100) / 100,
    qstCollected: Math.round(qstCollected * 100) / 100,
    totalTaxCollected: Math.round(totalTaxCollected * 100) / 100,
    itc: itc,
    gstOwing: Math.round(gstOwing * 100) / 100,
    qstOwing: Math.round(qstOwing * 100) / 100,
    netTaxOwing: Math.round(netTaxOwing * 100) / 100,
    gstRefund: Math.round(gstRefund * 100) / 100,
    qstRefund: Math.round(qstRefund * 100) / 100,
    totalRefund: Math.round(totalRefund * 100) / 100,
    province: province.toUpperCase()
  };
}

/**
 * Check if GST/QST registration is required based on revenue history
 * 
 * @param {Array} revenueHistory - Array of quarterly revenue
 * @returns {Object} Registration requirement analysis
 */
export function isRegistrationRequired(revenueHistory) {
  const analysis = trackQuarterlyRevenue(revenueHistory);
  
  return {
    required: analysis.registrationRequired,
    rollingRevenue: analysis.rollingFourQuarterRevenue,
    threshold: REGISTRATION_THRESHOLD,
    remainingBeforeThreshold: analysis.remainingBeforeThreshold,
    approachingThreshold: analysis.approachingThreshold,
    message: analysis.registrationRequired
      ? 'GST/QST registration required - revenue exceeds $30,000 in last 4 quarters'
      : analysis.approachingThreshold
      ? 'Warning: Approaching registration threshold ($25,000+)'
      : 'GST/QST registration not required'
  };
}

/**
 * Get filing deadlines for GST/QST
 * 
 * @param {number} year - Tax year
 * @param {string} filingFrequency - 'quarterly' or 'annual'
 * @returns {Array} Filing deadlines
 */
export function getFilingDeadlines(year, filingFrequency = 'quarterly') {
  if (typeof year !== 'number' || year < 2000 || year > 2100) {
    throw new Error('Invalid year: must be between 2000 and 2100');
  }

  if (!['quarterly', 'annual'].includes(filingFrequency)) {
    throw new Error('Invalid filing frequency: must be "quarterly" or "annual"');
  }

  if (filingFrequency === 'annual') {
    // Annual filers: June 15 of following year (or next business day)
    return [
      {
        period: `${year} Annual`,
        deadline: `${year + 1}-06-15`,
        description: 'Annual GST/QST return'
      }
    ];
  }

  // Quarterly filers: One month after quarter end
  return [
    {
      period: 'Q1 (Jan-Mar)',
      quarter: 1,
      year: year,
      deadline: `${year}-04-30`,
      description: 'Q1 GST/QST return'
    },
    {
      period: 'Q2 (Apr-Jun)',
      quarter: 2,
      year: year,
      deadline: `${year}-07-31`,
      description: 'Q2 GST/QST return'
    },
    {
      period: 'Q3 (Jul-Sep)',
      quarter: 3,
      year: year,
      deadline: `${year}-10-31`,
      description: 'Q3 GST/QST return'
    },
    {
      period: 'Q4 (Oct-Dec)',
      quarter: 4,
      year: year,
      deadline: `${year + 1}-01-31`,
      description: 'Q4 GST/QST return'
    }
  ];
}

/**
 * Calculate combined GST+QST rate
 * 
 * @param {string} province - Province code
 * @returns {Object} Combined rate information
 */
export function getCombinedRate(province = 'QC') {
  const provinceCode = province.toUpperCase();
  
  let provincialRate = 0;
  let provincialName = 'No provincial sales tax';
  
  if (provinceCode === 'QC') {
    provincialRate = QST_RATE;
    provincialName = 'QST';
  }
  
  const combinedRate = GST_RATE + provincialRate;
  
  return {
    province: provinceCode,
    gstRate: GST_RATE,
    gstPercentage: (GST_RATE * 100).toFixed(2) + '%',
    provincialRate: provincialRate,
    provincialPercentage: (provincialRate * 100).toFixed(3) + '%',
    provincialName: provincialName,
    combinedRate: Math.round(combinedRate * 10000) / 10000,
    combinedPercentage: (combinedRate * 100).toFixed(3) + '%'
  };
}
