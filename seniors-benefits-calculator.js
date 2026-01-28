/**
 * Seniors Benefits Calculator
 * OAS, GIS, Allowance, Pension Splitting, CPP/QPP
 * 2026 tax year
 */

export const SENIORS_BENEFITS_2026 = {
  oas: {
    maxMonthly: 691.67,           // Maximum monthly OAS (Q1 2026)
    maxAnnual: 8300.04,           // Maximum annual OAS
    eligibilityAge: 65,
    fullResidenceYears: 40,       // Years for full OAS
    minResidenceYears: 10,        // Minimum for partial OAS
    
    clawback: {
      thresholdIncome: 90997,     // Income where clawback starts (2026)
      clawbackRate: 0.15,         // 15% recovery tax
      fullClawbackIncome: 148451, // Income where OAS = $0
    },
    
    deferral: {
      minAge: 65,
      maxAge: 70,
      increasePerMonth: 0.006,    // 0.6% per month (7.2% per year)
      maxIncrease: 0.36,          // 36% if defer to 70
    },
  },
  
  gis: {
    // Single person rates (2026)
    single: {
      maxMonthly: 1062.01,
      maxAnnual: 12744.12,
      incomeThreshold: 0,
      fullReductionIncome: 21624, // Income where GIS = $0
      reductionRate: 0.50,        // 50% reduction on income
    },
    
    // Couple rates (both receive OAS)
    coupleOAS: {
      maxMonthlyEach: 639.77,
      maxAnnualEach: 7677.24,
      combinedIncomeThreshold: 0,
      fullReductionIncome: 28560, // Combined income
      reductionRate: 0.25,        // 25% reduction per person
    },
    
    // Couple rates (only one receives OAS)
    coupleOneOAS: {
      maxMonthly: 1062.01,
      maxAnnual: 12744.12,
      incomeThreshold: 0,
      fullReductionIncome: 51648,
      reductionRate: 0.25,
    },
  },
  
  allowance: {
    age60to64: {
      maxMonthly: 1330.44,
      maxAnnual: 15965.28,
      eligibility: 'Spouse/partner of GIS recipient, age 60-64',
    },
    
    survivor: {
      maxMonthly: 1531.67,
      maxAnnual: 18380.04,
      eligibility: 'Widowed, age 60-64, low income',
    },
  },
  
  cpp: {
    maxMonthlyAt65: 1433.00,      // Maximum CPP at 65 (2026)
    averageMonthly: 831.92,       // Average CPP payment
    eligibilityAge: 60,
    normalAge: 65,
    maxAge: 70,
    
    earlyPenalty: 0.006,          // -0.6% per month before 65
    lateBonusAge65to70: 0.007,    // +0.7% per month after 65
    
    maxEarlyReduction: 0.36,      // -36% at age 60
    maxLateIncrease: 0.42,        // +42% at age 70
  },
  
  qpp: {
    maxMonthlyAt65: 1433.33,
    averageMonthly: 834.17,
    // Same penalty/bonus structure as CPP
    earlyPenalty: 0.006,
    lateBonus: 0.007,
  },
};

/**
 * Calculate Old Age Security benefit
 * @param {number} annualIncome - Net income for the year
 * @param {number} residenceYears - Years of Canadian residence after age 18
 * @param {number} age - Current age
 * @param {number} deferralMonths - Months deferred past 65 (0-60)
 * @returns {Object} OAS calculation
 */
export function calculateOAS(annualIncome, residenceYears, age = 65, deferralMonths = 0) {
  const { oas } = SENIORS_BENEFITS_2026;
  
  // Not eligible yet
  if (age < 65) {
    return {
      eligible: false,
      monthlyBenefit: 0,
      annualBenefit: 0,
      clawback: 0,
      netBenefit: 0,
      reason: 'Must be 65 or older',
    };
  }
  
  // Check residence requirement
  if (residenceYears < oas.minResidenceYears) {
    return {
      eligible: false,
      monthlyBenefit: 0,
      annualBenefit: 0,
      reason: `Need minimum ${oas.minResidenceYears} years Canadian residence after age 18`,
    };
  }
  
  // Calculate base benefit (partial if < 40 years)
  let baseBenefit = oas.maxAnnual;
  if (residenceYears < oas.fullResidenceYears) {
    baseBenefit = oas.maxAnnual * (residenceYears / oas.fullResidenceYears);
  }
  
  // Apply deferral increase if applicable
  let benefit = baseBenefit;
  let deferralIncrease = 0;
  if (deferralMonths > 0) {
    const increaseRate = Math.min(deferralMonths * oas.deferral.increasePerMonth, oas.deferral.maxIncrease);
    deferralIncrease = baseBenefit * increaseRate;
    benefit = baseBenefit + deferralIncrease;
  }
  
  // Calculate OAS clawback (recovery tax)
  let clawback = 0;
  if (annualIncome > oas.clawback.thresholdIncome) {
    const excessIncome = annualIncome - oas.clawback.thresholdIncome;
    clawback = Math.min(excessIncome * oas.clawback.clawbackRate, benefit);
  }
  
  const netBenefit = Math.max(0, benefit - clawback);
  
  return {
    eligible: true,
    residenceYears,
    isPartialBenefit: residenceYears < oas.fullResidenceYears,
    baseBenefit: Math.round(baseBenefit * 100) / 100,
    deferralMonths,
    deferralIncrease: Math.round(deferralIncrease * 100) / 100,
    grossBenefit: Math.round(benefit * 100) / 100,
    clawbackThreshold: oas.clawback.thresholdIncome,
    clawback: Math.round(clawback * 100) / 100,
    netBenefit: Math.round(netBenefit * 100) / 100,
    monthlyBenefit: Math.round((netBenefit / 12) * 100) / 100,
    annualIncome,
  };
}

/**
 * Calculate Guaranteed Income Supplement
 * @param {number} annualIncome - Annual income (excluding OAS/GIS)
 * @param {boolean} isSingle - Is single person?
 * @param {boolean} partnerReceivesOAS - Does partner receive OAS?
 * @param {number} partnerIncome - Partner's income (if applicable)
 * @returns {Object} GIS calculation
 */
export function calculateGIS(annualIncome, isSingle = true, partnerReceivesOAS = false, partnerIncome = 0) {
  const { gis } = SENIORS_BENEFITS_2026;
  
  let config;
  let combinedIncome = annualIncome;
  let maxMonthly, maxAnnual;
  
  if (isSingle) {
    config = gis.single;
    maxMonthly = config.maxMonthly;
    maxAnnual = config.maxAnnual;
  } else if (partnerReceivesOAS) {
    config = gis.coupleOAS;
    combinedIncome = annualIncome + partnerIncome;
    maxMonthly = config.maxMonthlyEach;
    maxAnnual = config.maxAnnualEach;
  } else {
    config = gis.coupleOneOAS;
    combinedIncome = annualIncome + partnerIncome;
    maxMonthly = config.maxMonthly;
    maxAnnual = config.maxAnnual;
  }
  
  // Calculate GIS reduction
  let monthlyGIS = maxMonthly;
  
  if (combinedIncome > (config.incomeThreshold || config.combinedIncomeThreshold || 0)) {
    const threshold = config.incomeThreshold || config.combinedIncomeThreshold || 0;
    const excessIncome = combinedIncome - threshold;
    const annualReduction = excessIncome * config.reductionRate;
    const monthlyReduction = annualReduction / 12;
    monthlyGIS = Math.max(0, maxMonthly - monthlyReduction);
  }
  
  const annualGIS = monthlyGIS * 12;
  const roundedAnnual = Math.round(annualGIS * 100) / 100;
  const roundedMonthly = Math.round(monthlyGIS * 100) / 100;
  
  return {
    eligible: roundedMonthly > 0,
    isSingle,
    partnerReceivesOAS,
    annualIncome: Math.round(annualIncome * 100) / 100,
    combinedIncome: Math.round(combinedIncome * 100) / 100,
    maxBenefit: Math.round(maxAnnual * 100) / 100,
    monthlyBenefit: roundedMonthly,
    annualBenefit: roundedAnnual,
    reductionRate: config.reductionRate * 100,
    fullReductionIncome: config.fullReductionIncome,
  };
}

/**
 * Calculate CPP/QPP retirement pension
 * @param {number} averageMonthlyEarnings - Average monthly pensionable earnings
 * @param {number} startAge - Age to start receiving (60-70)
 * @param {string} province - QC for QPP, others for CPP
 * @returns {Object} CPP/QPP calculation
 */
export function calculateCPPRetirement(averageMonthlyEarnings, startAge = 65, province = 'ON') {
  const isQPP = province === 'QC';
  const config = isQPP ? SENIORS_BENEFITS_2026.qpp : SENIORS_BENEFITS_2026.cpp;
  
  // Base calculation: 25% of average earnings (simplified - actual is more complex)
  // For accurate calculation, would need full contribution history
  const baseMonthly = Math.min(averageMonthlyEarnings * 0.25, config.maxMonthlyAt65);
  
  // Apply early/late adjustment
  let adjustmentRate = 0;
  let monthsFromNormal = (startAge - 65) * 12;
  
  if (startAge < 65) {
    // Early penalty
    adjustmentRate = monthsFromNormal * config.earlyPenalty; // Negative
  } else if (startAge > 65) {
    // Late bonus - use correct property name
    const lateBonusRate = isQPP ? config.lateBonus : config.lateBonusAge65to70;
    adjustmentRate = monthsFromNormal * lateBonusRate; // Positive
  }
  
  const adjustedMonthly = baseMonthly * (1 + adjustmentRate);
  
  return {
    type: isQPP ? 'QPP' : 'CPP',
    startAge,
    baseMonthlyAt65: Math.round(baseMonthly * 100) / 100,
    adjustmentRate: Math.round(adjustmentRate * 10000) / 100,
    adjustedMonthly: Math.round(adjustedMonthly * 100) / 100,
    annualBenefit: Math.round(adjustedMonthly * 12 * 100) / 100,
    maxPossible: Math.round(config.maxMonthlyAt65 * 100) / 100,
    average: config.averageMonthly,
  };
}

/**
 * Calculate optimal pension income splitting for couples
 * @param {number} spouse1Income - Spouse 1 total income
 * @param {number} spouse1PensionIncome - Spouse 1 eligible pension income
 * @param {number} spouse2Income - Spouse 2 total income
 * @param {number} spouse2PensionIncome - Spouse 2 eligible pension income
 * @param {number} spouse1Age - Spouse 1 age
 * @param {number} spouse2Age - Spouse 2 age
 * @param {string} province - Province code
 * @returns {Object} Pension splitting optimization
 */
export function calculatePensionSplitting(
  spouse1Income,
  spouse1PensionIncome,
  spouse2Income,
  spouse2PensionIncome,
  spouse1Age,
  spouse2Age,
  province = 'QC'
) {
  // Must be 65+ to split pension income
  const spouse1Eligible = spouse1Age >= 65 && spouse1PensionIncome > 0;
  const spouse2Eligible = spouse2Age >= 65 && spouse2PensionIncome > 0;
  
  if (!spouse1Eligible && !spouse2Eligible) {
    return {
      eligible: false,
      reason: 'At least one spouse must be 65+ with eligible pension income',
      taxSavings: 0,
    };
  }
  
  // Calculate optimal split (simplified - full optimization requires tax brackets)
  // Generally optimal to equalize incomes
  const totalIncome = spouse1Income + spouse2Income;
  const targetIncome = totalIncome / 2;
  
  // Calculate how much to transfer
  let spouse1Transfer = 0;
  let spouse2Transfer = 0;
  
  if (spouse1Eligible && spouse1Income > spouse2Income) {
    // Spouse 1 has higher income, transfer pension to spouse 2
    const desiredTransfer = (spouse1Income - targetIncome);
    spouse1Transfer = Math.min(desiredTransfer, spouse1PensionIncome * 0.5); // Max 50%
  }
  
  if (spouse2Eligible && spouse2Income > spouse1Income) {
    // Spouse 2 has higher income
    const desiredTransfer = (spouse2Income - targetIncome);
    spouse2Transfer = Math.min(desiredTransfer, spouse2PensionIncome * 0.5);
  }
  
  const newSpouse1Income = spouse1Income - spouse1Transfer + spouse2Transfer;
  const newSpouse2Income = spouse2Income - spouse2Transfer + spouse1Transfer;
  
  return {
    eligible: true,
    beforeSplitting: {
      spouse1Income: Math.round(spouse1Income * 100) / 100,
      spouse2Income: Math.round(spouse2Income * 100) / 100,
      totalIncome: Math.round(totalIncome * 100) / 100,
    },
    afterSplitting: {
      spouse1Income: Math.round(newSpouse1Income * 100) / 100,
      spouse2Income: Math.round(newSpouse2Income * 100) / 100,
      totalIncome: Math.round(totalIncome * 100) / 100,
    },
    transfers: {
      spouse1ToSpouse2: Math.round(spouse1Transfer * 100) / 100,
      spouse2ToSpouse1: Math.round(spouse2Transfer * 100) / 100,
    },
    // Note: Actual tax savings would require full tax calculation
    estimatedTaxSavings: 'Calculate with full tax calculator',
  };
}

/**
 * Calculate combined OAS + GIS benefits
 * @param {number} age - Current age
 * @param {number} annualIncome - Annual income (excluding OAS/GIS)
 * @param {number} residenceYears - Years of residence
 * @param {boolean} isSingle - Is single?
 * @param {Object} spouse - Spouse information (if applicable)
 * @returns {Object} Combined benefits
 */
export function calculateCombinedSeniorBenefits(
  age,
  annualIncome,
  residenceYears,
  isSingle = true,
  spouse = null
) {
  const oasResult = calculateOAS(annualIncome, residenceYears, age);
  
  if (!oasResult.eligible) {
    return {
      oas: oasResult,
      gis: { eligible: false },
      totalMonthly: 0,
      totalAnnual: 0,
    };
  }
  
  // For GIS, income excludes OAS/GIS
  const gisResult = calculateGIS(
    annualIncome,
    isSingle,
    spouse?.receivesOAS || false,
    spouse?.income || 0
  );
  
  const totalMonthly = oasResult.monthlyBenefit + gisResult.monthlyBenefit;
  const totalAnnual = oasResult.netBenefit + gisResult.annualBenefit;
  
  return {
    oas: oasResult,
    gis: gisResult,
    totalMonthly: Math.round(totalMonthly * 100) / 100,
    totalAnnual: Math.round(totalAnnual * 100) / 100,
    effectiveIncome: Math.round((annualIncome + totalAnnual) * 100) / 100,
  };
}

/**
 * Validate senior benefit inputs
 */
export function validateSeniorBenefitInputs(age, annualIncome, residenceYears) {
  const errors = [];
  
  if (age < 60) {
    errors.push('Must be at least 60 years old for any senior benefits');
  }
  
  if (age > 120) {
    errors.push('Invalid age');
  }
  
  if (annualIncome < 0) {
    errors.push('Annual income cannot be negative');
  }
  
  if (residenceYears < 0 || residenceYears > 100) {
    errors.push('Invalid residence years');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
