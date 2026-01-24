// cca-calculator.js — Capital Cost Allowance Calculator for Class 10 Vehicles
// For rideshare/taxi drivers using detailed vehicle expense method

/**
 * Constants for 2026 tax year
 */
export const LUXURY_VEHICLE_LIMIT_2026 = 37000;
export const CCA_CLASS_10_RATE = 0.30;
export const HALF_YEAR_RULE_RATE = 0.15;

/**
 * Calculate first year CCA with half-year rule
 * 
 * @param {number} vehicleCost - Purchase price of vehicle
 * @param {number} businessUsePercentage - Business use percentage (0-100)
 * @returns {Object} First year CCA calculation
 */
export function calculateFirstYearCCA(vehicleCost, businessUsePercentage = 100) {
  // Validate inputs
  if (typeof vehicleCost !== 'number' || vehicleCost < 0) {
    throw new Error('Invalid vehicle cost: must be a non-negative number');
  }

  if (typeof businessUsePercentage !== 'number' || businessUsePercentage < 0 || businessUsePercentage > 100) {
    throw new Error('Invalid business use percentage: must be between 0 and 100');
  }

  // Apply luxury vehicle limit
  const depreciableAmount = Math.min(vehicleCost, LUXURY_VEHICLE_LIMIT_2026);
  
  // Calculate CCA with half-year rule (15% first year)
  const ccaBeforeBusinessUse = depreciableAmount * HALF_YEAR_RULE_RATE;
  const cca = ccaBeforeBusinessUse * (businessUsePercentage / 100);
  
  // Calculate UCC ending
  const uccEnding = depreciableAmount - ccaBeforeBusinessUse;

  return {
    vehicleCost: Math.round(vehicleCost * 100) / 100,
    depreciableAmount: Math.round(depreciableAmount * 100) / 100,
    luxuryLimitApplied: vehicleCost > LUXURY_VEHICLE_LIMIT_2026,
    ccaRate: HALF_YEAR_RULE_RATE,
    ccaBeforeBusinessUse: Math.round(ccaBeforeBusinessUse * 100) / 100,
    businessUsePercentage: Math.round(businessUsePercentage * 100) / 100,
    cca: Math.round(cca * 100) / 100,
    uccEnding: Math.round(uccEnding * 100) / 100
  };
}

/**
 * Calculate subsequent year CCA
 * 
 * @param {number} uccBeginning - Undepreciated Capital Cost at start of year
 * @param {number} additions - Cost of vehicles added during year
 * @param {number} disposals - Proceeds from vehicles sold during year
 * @param {number} businessUsePercentage - Business use percentage (0-100)
 * @returns {Object} Subsequent year CCA calculation
 */
export function calculateSubsequentYearCCA(uccBeginning, additions = 0, disposals = 0, businessUsePercentage = 100) {
  // Validate inputs
  if (typeof uccBeginning !== 'number' || uccBeginning < 0) {
    throw new Error('Invalid UCC beginning: must be a non-negative number');
  }

  if (typeof additions !== 'number' || additions < 0) {
    throw new Error('Invalid additions: must be a non-negative number');
  }

  if (typeof disposals !== 'number' || disposals < 0) {
    throw new Error('Invalid disposals: must be a non-negative number');
  }

  if (typeof businessUsePercentage !== 'number' || businessUsePercentage < 0 || businessUsePercentage > 100) {
    throw new Error('Invalid business use percentage: must be between 0 and 100');
  }

  // Apply luxury limit to additions
  const depreciableAdditions = additions > 0 ? Math.min(additions, LUXURY_VEHICLE_LIMIT_2026) : 0;

  // Calculate UCC before CCA
  let uccBeforeCCA = uccBeginning + depreciableAdditions - disposals;
  
  // Check for recapture or terminal loss
  let recapture = 0;
  let terminalLoss = 0;
  
  if (uccBeforeCCA < 0) {
    recapture = Math.abs(uccBeforeCCA);
    uccBeforeCCA = 0;
  }

  // Apply half-year rule to net additions only
  const netAdditions = depreciableAdditions - Math.min(disposals, depreciableAdditions);
  const halfYearRuleAdjustment = netAdditions > 0 ? netAdditions * 0.5 : 0;

  // Calculate CCA base (UCC - half of net additions)
  const ccaBase = Math.max(0, uccBeforeCCA - halfYearRuleAdjustment);
  
  // Calculate CCA
  const ccaBeforeBusinessUse = ccaBase * CCA_CLASS_10_RATE;
  const cca = ccaBeforeBusinessUse * (businessUsePercentage / 100);
  
  // Calculate UCC ending
  let uccEnding = uccBeforeCCA - ccaBeforeBusinessUse;

  // If this is the last vehicle and sold, check for terminal loss
  if (disposals > 0 && uccEnding > 0 && uccBeginning + depreciableAdditions <= disposals) {
    terminalLoss = uccEnding;
    uccEnding = 0;
  }

  return {
    uccBeginning: Math.round(uccBeginning * 100) / 100,
    additions: Math.round(additions * 100) / 100,
    depreciableAdditions: Math.round(depreciableAdditions * 100) / 100,
    disposals: Math.round(disposals * 100) / 100,
    uccBeforeCCA: Math.round(uccBeforeCCA * 100) / 100,
    halfYearRuleAdjustment: Math.round(halfYearRuleAdjustment * 100) / 100,
    ccaBase: Math.round(ccaBase * 100) / 100,
    ccaRate: CCA_CLASS_10_RATE,
    ccaBeforeBusinessUse: Math.round(ccaBeforeBusinessUse * 100) / 100,
    businessUsePercentage: Math.round(businessUsePercentage * 100) / 100,
    cca: Math.round(cca * 100) / 100,
    uccEnding: Math.round(uccEnding * 100) / 100,
    recapture: Math.round(recapture * 100) / 100,
    terminalLoss: Math.round(terminalLoss * 100) / 100
  };
}

/**
 * Calculate multi-year CCA schedule
 * 
 * @param {number} vehicleCost - Initial vehicle purchase price
 * @param {number} years - Number of years to project
 * @param {number} businessUsePercentage - Business use percentage (0-100)
 * @param {Array} transactions - Array of vehicle additions/disposals {year, type, amount}
 * @returns {Array} Year-by-year CCA schedule
 */
export function calculateCCASchedule(vehicleCost, years, businessUsePercentage = 100, transactions = []) {
  // Validate inputs
  if (typeof vehicleCost !== 'number' || vehicleCost < 0) {
    throw new Error('Invalid vehicle cost: must be a non-negative number');
  }

  if (typeof years !== 'number' || years < 1 || years > 20) {
    throw new Error('Invalid years: must be between 1 and 20');
  }

  if (typeof businessUsePercentage !== 'number' || businessUsePercentage < 0 || businessUsePercentage > 100) {
    throw new Error('Invalid business use percentage: must be between 0 and 100');
  }

  if (!Array.isArray(transactions)) {
    throw new Error('Invalid transactions: must be an array');
  }

  const schedule = [];
  
  // Year 1
  const year1 = calculateFirstYearCCA(vehicleCost, businessUsePercentage);
  schedule.push({
    year: 1,
    ...year1
  });

  // Subsequent years
  for (let year = 2; year <= years; year++) {
    const previousYear = schedule[year - 2];
    
    // Check for transactions in this year
    const yearTransactions = transactions.filter(t => t.year === year);
    const additions = yearTransactions
      .filter(t => t.type === 'addition')
      .reduce((sum, t) => sum + t.amount, 0);
    const disposals = yearTransactions
      .filter(t => t.type === 'disposal')
      .reduce((sum, t) => sum + t.amount, 0);

    const yearCalc = calculateSubsequentYearCCA(
      previousYear.uccEnding,
      additions,
      disposals,
      businessUsePercentage
    );

    schedule.push({
      year,
      ...yearCalc
    });
  }

  return schedule;
}

/**
 * Calculate total CCA claimed over a schedule
 * 
 * @param {Array} schedule - CCA schedule from calculateCCASchedule
 * @returns {Object} Summary of total CCA and final UCC
 */
export function calculateTotalCCA(schedule) {
  if (!Array.isArray(schedule) || schedule.length === 0) {
    throw new Error('Invalid schedule: must be a non-empty array');
  }

  const totalCCA = schedule.reduce((sum, year) => sum + (year.cca || 0), 0);
  const totalRecapture = schedule.reduce((sum, year) => sum + (year.recapture || 0), 0);
  const totalTerminalLoss = schedule.reduce((sum, year) => sum + (year.terminalLoss || 0), 0);
  const finalUCC = schedule[schedule.length - 1].uccEnding || 0;

  return {
    totalCCA: Math.round(totalCCA * 100) / 100,
    totalRecapture: Math.round(totalRecapture * 100) / 100,
    totalTerminalLoss: Math.round(totalTerminalLoss * 100) / 100,
    finalUCC: Math.round(finalUCC * 100) / 100,
    years: schedule.length
  };
}

/**
 * Export CCA schedule as printable text format
 * 
 * @param {Array} schedule - CCA schedule from calculateCCASchedule
 * @returns {string} Printable text representation
 */
export function exportCCAScheduleAsText(schedule) {
  if (!Array.isArray(schedule) || schedule.length === 0) {
    throw new Error('Invalid schedule: must be a non-empty array');
  }

  const lines = [];
  
  lines.push('='.repeat(100));
  lines.push('CAPITAL COST ALLOWANCE (CCA) SCHEDULE - CLASS 10 VEHICLES (30%)');
  lines.push('='.repeat(100));
  lines.push('');
  
  // Header
  lines.push('Year | UCC Start  | Additions  | Disposals  | UCC Before | CCA Rate | CCA Amount | UCC End    | Recapture  | Term Loss');
  lines.push('-'.repeat(100));
  
  // Each year
  schedule.forEach(year => {
    const uccStart = year.uccBeginning !== undefined ? year.uccBeginning : year.depreciableAmount;
    const additions = year.additions || year.depreciableAdditions || 0;
    const disposals = year.disposals || 0;
    const uccBefore = year.uccBeforeCCA !== undefined ? year.uccBeforeCCA : year.depreciableAmount;
    const rate = year.ccaRate || 0;
    const cca = year.cca || 0;
    const uccEnd = year.uccEnding || 0;
    const recapture = year.recapture || 0;
    const termLoss = year.terminalLoss || 0;

    lines.push(
      `${String(year.year).padStart(4)} | ` +
      `$${uccStart.toFixed(2).padStart(9)} | ` +
      `$${additions.toFixed(2).padStart(9)} | ` +
      `$${disposals.toFixed(2).padStart(9)} | ` +
      `$${uccBefore.toFixed(2).padStart(9)} | ` +
      `${(rate * 100).toFixed(0)}%      | ` +
      `$${cca.toFixed(2).padStart(9)} | ` +
      `$${uccEnd.toFixed(2).padStart(9)} | ` +
      `$${recapture.toFixed(2).padStart(9)} | ` +
      `$${termLoss.toFixed(2).padStart(9)}`
    );
  });
  
  lines.push('-'.repeat(100));
  
  // Summary
  const summary = calculateTotalCCA(schedule);
  lines.push('');
  lines.push('SUMMARY:');
  lines.push(`Total CCA Claimed: $${summary.totalCCA.toFixed(2)}`);
  lines.push(`Total Recapture: $${summary.totalRecapture.toFixed(2)}`);
  lines.push(`Total Terminal Loss: $${summary.totalTerminalLoss.toFixed(2)}`);
  lines.push(`Final UCC: $${summary.finalUCC.toFixed(2)}`);
  lines.push('');
  lines.push('Note: Half-year rule applies to net additions in each year');
  lines.push(`Luxury vehicle limit: $${LUXURY_VEHICLE_LIMIT_2026.toFixed(2)}`);
  lines.push('');
  lines.push('='.repeat(100));
  
  return lines.join('\n');
}
