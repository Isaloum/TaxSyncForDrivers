// tuition-credit-calculator.js — Tuition tax credit calculator for Canadian students (2026)

/**
 * Provincial tuition credit rates for 2026
 * Some provinces have closed their programs, others match federal or have unique rates
 */
const PROVINCIAL_TUITION_RATES = {
  QC: { rate: 0.08, fullTimeBonus: 0.20, hasProvincialCredit: true }, // Quebec: 8% base + 20% for full-time
  ON: { rate: 0, hasProvincialCredit: false }, // Ontario: Closed to new students after 2017
  AB: { rate: 0, hasProvincialCredit: false }, // Alberta: No provincial credit
  BC: { rate: 0, hasProvincialCredit: false }, // BC: No provincial credit
  SK: { rate: 0.10, tierThreshold: 9000, higherRate: 0.15, hasProvincialCredit: true }, // Saskatchewan: 10% on first $9,000, 15% above
  MB: { rate: 0.108, hasProvincialCredit: true }, // Manitoba: 10.8%
  NB: { rate: 0.10, hasProvincialCredit: true }, // New Brunswick: 10%
  NS: { rate: 0.0879, hasProvincialCredit: true }, // Nova Scotia: 8.79%
  PE: { rate: 0.0983, hasProvincialCredit: true }, // PEI: 9.83%
  NL: { rate: 0.0875, hasProvincialCredit: true }, // Newfoundland: 8.75%
  YT: { rate: 0.15, hasProvincialCredit: true }, // Yukon: Matches federal (15%)
  NT: { rate: 0.15, hasProvincialCredit: true }, // NWT: Matches federal (15%)
  NU: { rate: 0.15, hasProvincialCredit: true }, // Nunavut: Matches federal (15%)
};

const FEDERAL_TUITION_RATE = 0.15; // 15% federal tax credit
const MAX_TRANSFER_AMOUNT = 5000; // Maximum tuition amount that can be transferred
const MAX_TRANSFER_CREDIT = 750; // Maximum credit value transferable ($5,000 × 15%)

/**
 * Calculate tuition tax credit for 2026
 * 
 * @param {number} tuitionFees - Total eligible tuition fees paid
 * @param {string} province - Province code (QC, ON, AB, BC, etc.)
 * @param {Object} options - Additional options
 * @param {boolean} options.isFullTime - Whether student is full-time (for Quebec)
 * @param {number} options.carryForwardAmount - Unused credits from previous years
 * @param {boolean} options.transferToFamily - Whether to transfer unused portion to family member
 * @param {number} options.taxOwing - Student's tax owing (needed for transfer calculation)
 * @returns {Object} Credit calculation with federal, provincial, transfer, and carryforward amounts
 */
export function calculateTuitionCredit(tuitionFees, province = 'QC', options = {}) {
  const {
    isFullTime = true,
    carryForwardAmount = 0,
    transferToFamily = false,
    taxOwing = 0,
  } = options;

  // Validate inputs
  if (typeof tuitionFees !== 'number' || tuitionFees < 0) {
    tuitionFees = 0;
  }
  if (typeof carryForwardAmount !== 'number' || carryForwardAmount < 0) {
    options.carryForwardAmount = 0;
  }
  if (typeof taxOwing !== 'number' || taxOwing < 0) {
    options.taxOwing = 0;
  }

  // Calculate federal credit
  const federalCredit = tuitionFees * FEDERAL_TUITION_RATE;

  // Calculate provincial credit
  let provincialCredit = 0;
  const provinceConfig = PROVINCIAL_TUITION_RATES[province] || PROVINCIAL_TUITION_RATES.QC;

  if (provinceConfig.hasProvincialCredit) {
    if (province === 'QC' && isFullTime) {
      // Quebec: 8% base + 20% bonus for full-time students = 28% total
      provincialCredit = tuitionFees * (provinceConfig.rate + provinceConfig.fullTimeBonus);
    } else if (province === 'SK' && tuitionFees > 0) {
      // Saskatchewan: Tiered rates
      const firstTier = Math.min(tuitionFees, provinceConfig.tierThreshold);
      const secondTier = Math.max(0, tuitionFees - provinceConfig.tierThreshold);
      provincialCredit = (firstTier * provinceConfig.rate) + (secondTier * provinceConfig.higherRate);
    } else {
      // All other provinces: Flat rate
      provincialCredit = tuitionFees * provinceConfig.rate;
    }
  }

  // Total current year credit
  const currentYearCredit = federalCredit + provincialCredit;
  
  // Total available credit including carryforward
  const totalAvailableCredit = currentYearCredit + carryForwardAmount;

  // Calculate how much credit is used against tax owing
  const creditUsedByStudent = Math.min(totalAvailableCredit, taxOwing);

  // Calculate unused credit after student uses what they can
  const unusedCredit = totalAvailableCredit - creditUsedByStudent;

  // Calculate transfer if requested
  let transferredCredit = 0;
  let newCarryForward = 0;

  if (transferToFamily && unusedCredit > 0) {
    // Can only transfer current year federal credit, up to max
    const transferableAmount = Math.min(federalCredit, MAX_TRANSFER_CREDIT);
    transferredCredit = Math.min(unusedCredit, transferableAmount);
    
    // Remaining unused goes to carryforward
    newCarryForward = unusedCredit - transferredCredit;
  } else {
    // All unused credit carries forward
    newCarryForward = unusedCredit;
  }

  return {
    tuitionFees: Math.round(tuitionFees * 100) / 100,
    federalCredit: Math.round(federalCredit * 100) / 100,
    provincialCredit: Math.round(provincialCredit * 100) / 100,
    currentYearCredit: Math.round(currentYearCredit * 100) / 100,
    carryForwardUsed: Math.round((carryForwardAmount - Math.max(0, carryForwardAmount - taxOwing)) * 100) / 100,
    totalAvailableCredit: Math.round(totalAvailableCredit * 100) / 100,
    creditUsedByStudent: Math.round(creditUsedByStudent * 100) / 100,
    transferredCredit: Math.round(transferredCredit * 100) / 100,
    newCarryForward: Math.round(newCarryForward * 100) / 100,
    province,
    isFullTime,
  };
}

/**
 * Validate T2202 slip data (Tuition and Enrolment Certificate)
 * 
 * @param {Object} slipData - Extracted T2202 data
 * @param {number} slipData.tuitionFees - Tuition fees paid
 * @param {string} slipData.studentName - Student name
 * @param {string} slipData.institutionName - Educational institution name
 * @param {number} slipData.fullTimeMonths - Number of full-time months
 * @param {number} slipData.partTimeMonths - Number of part-time months
 * @param {string} slipData.year - Tax year
 * @returns {Object} Validation result
 */
export function validateT2202(slipData) {
  const errors = [];
  const warnings = [];

  if (!slipData || typeof slipData !== 'object') {
    return {
      isValid: false,
      errors: ['T2202 slip data is required'],
      warnings: [],
    };
  }

  // Validate tuition fees
  if (typeof slipData.tuitionFees !== 'number' || slipData.tuitionFees < 0) {
    errors.push('Tuition fees must be a positive number');
  } else if (slipData.tuitionFees === 0) {
    warnings.push('Tuition fees are $0 - no credit will be calculated');
  } else if (slipData.tuitionFees > 50000) {
    warnings.push('Tuition fees exceed $50,000 - please verify amount');
  }

  // Validate student name
  if (!slipData.studentName || slipData.studentName.trim().length === 0) {
    errors.push('Student name is required');
  }

  // Validate institution name
  if (!slipData.institutionName || slipData.institutionName.trim().length === 0) {
    errors.push('Institution name is required');
  }

  // Validate months
  const fullTimeMonths = slipData.fullTimeMonths || 0;
  const partTimeMonths = slipData.partTimeMonths || 0;

  if (fullTimeMonths < 0 || fullTimeMonths > 12) {
    errors.push('Full-time months must be between 0 and 12');
  }
  if (partTimeMonths < 0 || partTimeMonths > 12) {
    errors.push('Part-time months must be between 0 and 12');
  }
  if (fullTimeMonths + partTimeMonths > 12) {
    errors.push('Total months cannot exceed 12');
  }
  if (fullTimeMonths === 0 && partTimeMonths === 0) {
    warnings.push('No enrollment months reported - this may affect other credits');
  }

  // Validate year
  const currentYear = new Date().getFullYear();
  const year = parseInt(slipData.year);
  if (!year || year < 2000 || year > currentYear + 1) {
    errors.push(`Invalid tax year: ${slipData.year}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Calculate maximum transfer to family member
 * Federal rules: max $750 credit ($5,000 × 15%)
 * Only current year federal credit can be transferred
 * 
 * @param {number} totalCredit - Total available credit
 * @param {number} taxOwing - Student's tax owing
 * @returns {Object} Transfer calculation
 */
export function calculateFamilyTransfer(totalCredit, taxOwing) {
  // Validate inputs
  if (typeof totalCredit !== 'number' || totalCredit < 0) {
    totalCredit = 0;
  }
  if (typeof taxOwing !== 'number' || taxOwing < 0) {
    taxOwing = 0;
  }

  // Credit used by student first
  const creditUsedByStudent = Math.min(totalCredit, taxOwing);
  
  // Unused credit
  const unusedCredit = totalCredit - creditUsedByStudent;

  // Maximum transferable
  const maxTransferable = MAX_TRANSFER_CREDIT;

  // Actual transfer amount (lesser of unused and max)
  const transferAmount = Math.min(unusedCredit, maxTransferable);

  // Remaining to carry forward
  const remainingCarryForward = unusedCredit - transferAmount;

  return {
    totalCredit: Math.round(totalCredit * 100) / 100,
    taxOwing: Math.round(taxOwing * 100) / 100,
    creditUsedByStudent: Math.round(creditUsedByStudent * 100) / 100,
    unusedCredit: Math.round(unusedCredit * 100) / 100,
    maxTransferable: Math.round(maxTransferable * 100) / 100,
    transferAmount: Math.round(transferAmount * 100) / 100,
    remainingCarryForward: Math.round(remainingCarryForward * 100) / 100,
  };
}

/**
 * Get provincial tuition credit information
 * 
 * @param {string} province - Province code
 * @returns {Object} Provincial credit info
 */
export function getProvincialTuitionInfo(province) {
  const config = PROVINCIAL_TUITION_RATES[province] || PROVINCIAL_TUITION_RATES.QC;
  
  let description = '';
  if (!config.hasProvincialCredit) {
    description = 'No provincial tuition credit available. Use federal credit only.';
  } else if (province === 'QC') {
    description = '8% base credit + 20% bonus for full-time students = 28% total for full-time';
  } else if (province === 'SK') {
    description = '10% on first $9,000, then 15% on remainder';
  } else if (province === 'ON') {
    description = 'Closed to new students after 2017. Existing credits can be carried forward.';
  } else {
    description = `${(config.rate * 100).toFixed(2)}% provincial credit`;
  }

  return {
    province,
    hasProvincialCredit: config.hasProvincialCredit,
    rate: config.rate || 0,
    description,
    specialRules: province === 'QC' ? 'Full-time students get additional 20% credit' : 
                   province === 'SK' ? 'Tiered rates based on tuition amount' :
                   province === 'ON' ? 'Program closed to new students (2017+)' : null,
  };
}
