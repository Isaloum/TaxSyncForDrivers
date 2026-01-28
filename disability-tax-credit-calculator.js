// disability-tax-credit-calculator.js — Disability Tax Credit (DTC) calculator for 2026

/**
 * 2026 Disability Tax Credit amounts and provincial rates
 * Base federal amount: $9,428 × 15% = $1,414
 * Child supplement: +$5,500 for children under 18
 */
export const DTC_AMOUNTS_2026 = {
  FEDERAL_BASE: 9428,
  FEDERAL_RATE: 0.15,
  CHILD_SUPPLEMENT: 5500,
  PROVINCIAL_RATES: {
    QC: 0.14,    // Quebec
    ON: 0.0505,  // Ontario
    AB: 0.10,    // Alberta
    BC: 0.0506,  // British Columbia
    MB: 0.108,   // Manitoba
    SK: 0.105,   // Saskatchewan
    NS: 0.0879,  // Nova Scotia
    NB: 0.094,   // New Brunswick
    PE: 0.098,   // Prince Edward Island
    NL: 0.087,   // Newfoundland and Labrador
    YT: 0.064,   // Yukon
    NT: 0.059,   // Northwest Territories
    NU: 0.04,    // Nunavut
  },
};

/**
 * Medical Expense Supplement (MES) parameters for 2026
 */
export const MES_PARAMETERS_2026 = {
  MAX_SUPPLEMENT: 1403,
  MIN_WORK_INCOME: 4010,
  PHASE_OUT_START: 30769,
  PHASE_OUT_RATE: 0.25,
};

/**
 * Child Disability Benefit (CDB) parameters for 2026
 */
export const CDB_PARAMETERS_2026 = {
  MAX_BENEFIT_PER_CHILD: 3173,
  INCOME_THRESHOLD: 35000,
  PHASE_OUT_RATE: 0.03,
};

/**
 * RDSP Grant matching rates for 2026
 */
export const RDSP_GRANT_PARAMETERS_2026 = {
  LOW_INCOME_THRESHOLD: 106717,
  LOW_INCOME_MATCH_RATE: 3, // 300% match
  LOW_INCOME_MAX_CONTRIBUTION: 500,
  MID_INCOME_MATCH_RATE_1: 2, // 200% match on first $500
  MID_INCOME_MATCH_RATE_2: 1, // 100% match on next $1000
  LIFETIME_GRANT_LIMIT: 70000,
  ANNUAL_GRANT_LIMIT: 3500,
};

/**
 * Calculate basic Disability Tax Credit
 * 
 * @param {number} age - Age of person with disability
 * @param {string} province - Province code (e.g., 'ON', 'QC', 'BC')
 * @param {boolean} isChild - Whether person is under 18
 * @returns {Object} DTC breakdown with federal and provincial amounts
 */
export function calculateDisabilityTaxCredit(age, province, isChild = null) {
  // Determine child status
  const childStatus = isChild !== null ? isChild : age < 18;
  
  // Calculate federal credit
  let federalBaseAmount = DTC_AMOUNTS_2026.FEDERAL_BASE;
  if (childStatus) {
    federalBaseAmount += DTC_AMOUNTS_2026.CHILD_SUPPLEMENT;
  }
  const federalCredit = federalBaseAmount * DTC_AMOUNTS_2026.FEDERAL_RATE;
  
  // Calculate provincial credit
  const provincialRate = DTC_AMOUNTS_2026.PROVINCIAL_RATES[province.toUpperCase()] || 0;
  const provincialCredit = DTC_AMOUNTS_2026.FEDERAL_BASE * provincialRate;
  
  // Total annual credit
  const totalAnnualCredit = federalCredit + provincialCredit;
  
  return {
    age,
    province: province.toUpperCase(),
    isChild: childStatus,
    federalBaseAmount: Math.round(federalBaseAmount * 100) / 100,
    federalCredit: Math.round(federalCredit * 100) / 100,
    provincialCredit: Math.round(provincialCredit * 100) / 100,
    totalAnnualCredit: Math.round(totalAnnualCredit * 100) / 100,
  };
}

/**
 * Calculate retroactive DTC claims (up to 10 years)
 * 
 * @param {number} currentYear - Current year (e.g., 2026)
 * @param {number} approvalYear - Year DTC was approved
 * @param {number} age - Current age of person
 * @param {string} province - Province code
 * @returns {Object} Retroactive claim breakdown with interest
 */
export function calculateRetroactiveDTC(currentYear, approvalYear, age, province) {
  // Calculate years to claim (max 10 years)
  const yearsSinceApproval = currentYear - approvalYear;
  const yearsToClaimCount = Math.min(yearsSinceApproval, 10);
  
  if (yearsToClaimCount <= 0) {
    return {
      currentYear,
      approvalYear,
      yearsClaimed: 0,
      yearlyBreakdown: [],
      totalRetroactive: 0,
      estimatedInterest: 0,
      totalRefund: 0,
    };
  }
  
  // Calculate credit for each year
  const yearlyBreakdown = [];
  let totalRetroactive = 0;
  
  for (let i = 0; i < yearsToClaimCount; i++) {
    const year = approvalYear + i;
    const ageInYear = age - (currentYear - year);
    const wasChild = ageInYear < 18;
    
    const yearCredit = calculateDisabilityTaxCredit(ageInYear, province, wasChild);
    
    yearlyBreakdown.push({
      year,
      age: ageInYear,
      isChild: wasChild,
      credit: yearCredit.totalAnnualCredit,
    });
    
    totalRetroactive += yearCredit.totalAnnualCredit;
  }
  
  // Estimate interest (simplified at ~1% per year average)
  const averageYearsBack = yearsToClaimCount / 2;
  const estimatedInterest = totalRetroactive * 0.01 * averageYearsBack;
  const totalRefund = totalRetroactive + estimatedInterest;
  
  return {
    currentYear,
    approvalYear,
    yearsClaimed: yearsToClaimCount,
    yearlyBreakdown,
    totalRetroactive: Math.round(totalRetroactive * 100) / 100,
    estimatedInterest: Math.round(estimatedInterest * 100) / 100,
    totalRefund: Math.round(totalRefund * 100) / 100,
  };
}

/**
 * Calculate DTC transfer to supporting person (spouse/parent)
 * 
 * @param {number} disabledIncome - Income of person with disability
 * @param {number} disabledTax - Tax payable by person with disability
 * @param {number} dtc - DTC amount available
 * @param {number} supportIncome - Income of supporting person
 * @param {number} supportTax - Tax payable by supporting person
 * @returns {Object} Transfer optimization recommendation
 */
export function calculateDTCTransfer(disabledIncome, disabledTax, dtc, supportIncome, supportTax) {
  // Calculate how much DTC can be used by disabled person
  const usedByDisabled = Math.min(dtc, disabledTax);
  
  // Calculate unused DTC that can be transferred
  const availableForTransfer = dtc - usedByDisabled;
  
  // Calculate how much supporting person can use
  const usedBySupport = Math.min(availableForTransfer, supportTax);
  
  // Calculate unused credit (lost)
  const unusedCredit = availableForTransfer - usedBySupport;
  
  // Recommendation
  const shouldTransfer = availableForTransfer > 0 && usedBySupport > 0;
  
  return {
    disabledIncome: Math.round(disabledIncome * 100) / 100,
    disabledTax: Math.round(disabledTax * 100) / 100,
    totalDTC: Math.round(dtc * 100) / 100,
    usedByDisabled: Math.round(usedByDisabled * 100) / 100,
    availableForTransfer: Math.round(availableForTransfer * 100) / 100,
    usedBySupport: Math.round(usedBySupport * 100) / 100,
    unusedCredit: Math.round(unusedCredit * 100) / 100,
    shouldTransfer,
    totalTaxSavings: Math.round((usedByDisabled + usedBySupport) * 100) / 100,
  };
}

/**
 * Calculate Medical Expense Supplement (MES) refundable credit
 * 
 * @param {number} workIncome - Employment/self-employment income
 * @param {number} netIncome - Net income for the year
 * @returns {Object} MES calculation with phase-out details
 */
export function calculateMedicalExpenseSupplement(workIncome, netIncome) {
  const { MAX_SUPPLEMENT, MIN_WORK_INCOME, PHASE_OUT_START, PHASE_OUT_RATE } = MES_PARAMETERS_2026;
  
  // Check minimum work income requirement
  if (workIncome < MIN_WORK_INCOME) {
    return {
      workIncome: Math.round(workIncome * 100) / 100,
      netIncome: Math.round(netIncome * 100) / 100,
      eligible: false,
      reason: 'Work income below minimum threshold',
      minWorkIncome: MIN_WORK_INCOME,
      supplement: 0,
    };
  }
  
  // Calculate base supplement (25% of work income over threshold)
  const baseAmount = (workIncome - MIN_WORK_INCOME) * 0.25;
  const beforePhaseOut = Math.min(baseAmount, MAX_SUPPLEMENT);
  
  // Calculate phase-out reduction if income exceeds threshold
  let phaseOutReduction = 0;
  if (netIncome > PHASE_OUT_START) {
    const excessIncome = netIncome - PHASE_OUT_START;
    phaseOutReduction = excessIncome * PHASE_OUT_RATE;
  }
  
  // Final supplement amount
  const supplement = Math.max(0, beforePhaseOut - phaseOutReduction);
  
  return {
    workIncome: Math.round(workIncome * 100) / 100,
    netIncome: Math.round(netIncome * 100) / 100,
    eligible: true,
    beforePhaseOut: Math.round(beforePhaseOut * 100) / 100,
    phaseOutReduction: Math.round(phaseOutReduction * 100) / 100,
    supplement: Math.round(supplement * 100) / 100,
  };
}

/**
 * Calculate Child Disability Benefit (CDB)
 * 
 * @param {number} familyIncome - Adjusted family net income
 * @param {number} numChildren - Number of children eligible for DTC
 * @returns {Object} CDB calculation with monthly and annual amounts
 */
export function calculateChildDisabilityBenefit(familyIncome, numChildren) {
  const { MAX_BENEFIT_PER_CHILD, INCOME_THRESHOLD, PHASE_OUT_RATE } = CDB_PARAMETERS_2026;
  
  if (numChildren <= 0) {
    return {
      familyIncome: Math.round(familyIncome * 100) / 100,
      numChildren,
      benefitPerChild: 0,
      annualBenefit: 0,
      monthlyBenefit: 0,
    };
  }
  
  // Calculate phase-out reduction if income exceeds threshold
  let benefitPerChild = MAX_BENEFIT_PER_CHILD;
  
  if (familyIncome > INCOME_THRESHOLD) {
    const excessIncome = familyIncome - INCOME_THRESHOLD;
    const reduction = excessIncome * PHASE_OUT_RATE;
    benefitPerChild = Math.max(0, MAX_BENEFIT_PER_CHILD - reduction);
  }
  
  const annualBenefit = benefitPerChild * numChildren;
  const monthlyBenefit = annualBenefit / 12;
  
  return {
    familyIncome: Math.round(familyIncome * 100) / 100,
    numChildren,
    benefitPerChild: Math.round(benefitPerChild * 100) / 100,
    annualBenefit: Math.round(annualBenefit * 100) / 100,
    monthlyBenefit: Math.round(monthlyBenefit * 100) / 100,
  };
}

/**
 * Calculate RDSP government grants (300% match up to $70k lifetime)
 * 
 * @param {number} contribution - Annual contribution amount
 * @param {number} familyIncome - Adjusted family net income
 * @param {number} age - Age of beneficiary
 * @returns {Object} RDSP grant calculation
 */
export function calculateRDSPGrants(contribution, familyIncome, age) {
  const {
    LOW_INCOME_THRESHOLD,
    LOW_INCOME_MATCH_RATE,
    LOW_INCOME_MAX_CONTRIBUTION,
    MID_INCOME_MATCH_RATE_1,
    MID_INCOME_MATCH_RATE_2,
    LIFETIME_GRANT_LIMIT,
    ANNUAL_GRANT_LIMIT,
  } = RDSP_GRANT_PARAMETERS_2026;
  
  // RDSP grants only available until end of age 49 (stop at age 50)
  if (age > 49) {
    return {
      contribution: Math.round(contribution * 100) / 100,
      familyIncome: Math.round(familyIncome * 100) / 100,
      age,
      eligible: false,
      reason: 'RDSP grants only available until end of age 49',
      grant: 0,
      matchRate: 0,
      lifetimeLimit: LIFETIME_GRANT_LIMIT,
    };
  }
  
  let grant = 0;
  let matchRate = 0;
  
  if (familyIncome <= LOW_INCOME_THRESHOLD) {
    // Low income: 300% match on first $500
    const eligibleContribution = Math.min(contribution, LOW_INCOME_MAX_CONTRIBUTION);
    grant = eligibleContribution * LOW_INCOME_MATCH_RATE;
    
    // Additional 100% match on next $1000
    if (contribution > LOW_INCOME_MAX_CONTRIBUTION) {
      const additionalContribution = Math.min(contribution - LOW_INCOME_MAX_CONTRIBUTION, 1000);
      grant += additionalContribution * MID_INCOME_MATCH_RATE_2;
    }
    
    matchRate = grant / contribution;
  } else {
    // Higher income: 100% match on first $1000
    const eligibleContribution = Math.min(contribution, 1000);
    grant = eligibleContribution * MID_INCOME_MATCH_RATE_2;
    matchRate = MID_INCOME_MATCH_RATE_2;
  }
  
  // Apply annual grant limit
  grant = Math.min(grant, ANNUAL_GRANT_LIMIT);
  
  return {
    contribution: Math.round(contribution * 100) / 100,
    familyIncome: Math.round(familyIncome * 100) / 100,
    age,
    eligible: true,
    grant: Math.round(grant * 100) / 100,
    matchRate: Math.round(matchRate * 100) / 100,
    annualGrantLimit: ANNUAL_GRANT_LIMIT,
    lifetimeLimit: LIFETIME_GRANT_LIMIT,
  };
}

/**
 * Validate DTC eligibility requirements
 * 
 * @param {boolean} hasT2201 - Whether Form T2201 is approved
 * @param {number} impairmentMonths - Duration of impairment in months
 * @returns {Object} Eligibility validation result
 */
export function validateDTCEligibility(hasT2201, impairmentMonths) {
  const errors = [];
  
  if (!hasT2201) {
    errors.push('Form T2201 (Disability Tax Credit Certificate) must be approved by CRA');
  }
  
  if (impairmentMonths < 12) {
    errors.push('Impairment must last at least 12 consecutive months');
  }
  
  const eligible = errors.length === 0;
  
  return {
    eligible,
    hasT2201,
    impairmentMonths,
    errors,
    guidance: !eligible ? 'Complete Form T2201 with a medical practitioner and submit to CRA for approval' : null,
  };
}

/**
 * Calculate combined DTC benefits (all programs)
 * 
 * @param {Object} params - All input parameters
 * @returns {Object} Comprehensive benefits summary
 */
export function calculateCombinedDTCBenefits(params) {
  const {
    age,
    province,
    currentYear = 2026,
    approvalYear,
    workIncome = 0,
    netIncome = 0,
    familyIncome = 0,
    numChildren = 0,
    rdspContribution = 0,
    hasT2201 = false,
    impairmentMonths = 0,
    disabledIncome = 0,
    disabledTax = 0,
    supportIncome = 0,
    supportTax = 0,
  } = params;
  
  // Validate eligibility
  const validation = validateDTCEligibility(hasT2201, impairmentMonths);
  
  if (!validation.eligible) {
    return {
      eligible: false,
      errors: validation.errors,
      guidance: validation.guidance,
    };
  }
  
  // Calculate basic DTC
  const dtc = calculateDisabilityTaxCredit(age, province);
  
  // Calculate retroactive claims if applicable
  let retroactive = null;
  if (approvalYear && approvalYear < currentYear) {
    retroactive = calculateRetroactiveDTC(currentYear, approvalYear, age, province);
  }
  
  // Calculate transfer if supporting person data provided
  let transfer = null;
  if (supportIncome > 0 || supportTax > 0) {
    transfer = calculateDTCTransfer(
      disabledIncome || netIncome,
      disabledTax,
      dtc.totalAnnualCredit,
      supportIncome,
      supportTax
    );
  }
  
  // Calculate Medical Expense Supplement
  let mes = null;
  if (workIncome > 0) {
    mes = calculateMedicalExpenseSupplement(workIncome, netIncome || workIncome);
  }
  
  // Calculate Child Disability Benefit (for children with disabilities)
  let cdb = null;
  if (numChildren > 0) {
    cdb = calculateChildDisabilityBenefit(familyIncome || netIncome, numChildren);
  }
  
  // Calculate RDSP grants
  let rdsp = null;
  if (rdspContribution > 0) {
    rdsp = calculateRDSPGrants(rdspContribution, familyIncome || netIncome, age);
  }
  
  // Calculate total benefits
  const annualDTC = dtc.totalAnnualCredit;
  const retroactiveTotal = retroactive ? retroactive.totalRefund : 0;
  const mesAmount = mes && mes.eligible ? mes.supplement : 0;
  const cdbAmount = cdb ? cdb.annualBenefit : 0;
  const rdspGrant = rdsp && rdsp.eligible ? rdsp.grant : 0;
  
  const totalAnnualBenefits = annualDTC + mesAmount + cdbAmount + rdspGrant;
  const totalWithRetroactive = totalAnnualBenefits + retroactiveTotal;
  
  return {
    eligible: true,
    age,
    province,
    dtc,
    retroactive,
    transfer,
    mes,
    cdb,
    rdsp,
    summary: {
      annualDTC: Math.round(annualDTC * 100) / 100,
      retroactiveTotal: Math.round(retroactiveTotal * 100) / 100,
      mesAmount: Math.round(mesAmount * 100) / 100,
      cdbAmount: Math.round(cdbAmount * 100) / 100,
      rdspGrant: Math.round(rdspGrant * 100) / 100,
      totalAnnualBenefits: Math.round(totalAnnualBenefits * 100) / 100,
      totalWithRetroactive: Math.round(totalWithRetroactive * 100) / 100,
    },
  };
}
