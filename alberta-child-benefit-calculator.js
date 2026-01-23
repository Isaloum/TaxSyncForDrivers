/**
 * Alberta Child & Family Benefit (ACFB) Calculator
 * Supports families with children under 18
 * 2026 tax year
 */

export const ALBERTA_CHILD_BENEFIT_2026 = {
  // Per child amounts (annual)
  firstChild: 1330,
  secondChild: 665,
  thirdChild: 665,
  fourthPlusChild: 665,
  
  // Income thresholds
  phaseOutThreshold: 23490,  // Family net income where benefit starts reducing
  
  // Reduction rate
  reductionRate: 0.04,  // 4% of family income over threshold
  
  // Maximum family size considered
  maxChildren: 6,
};

/**
 * Calculate Alberta Child & Family Benefit
 */
export function calculateAlbertaChildBenefit(household) {
  const {
    familyNetIncome,
    numberOfChildren = 0,
  } = household;
  
  if (numberOfChildren === 0) {
    return {
      annualBenefit: 0,
      monthlyPayment: 0,
      reduction: 0,
    };
  }
  
  // Calculate base benefit
  let baseBenefit = 0;
  
  for (let i = 0; i < Math.min(numberOfChildren, ALBERTA_CHILD_BENEFIT_2026.maxChildren); i++) {
    if (i === 0) {
      baseBenefit += ALBERTA_CHILD_BENEFIT_2026.firstChild;
    } else if (i === 1) {
      baseBenefit += ALBERTA_CHILD_BENEFIT_2026.secondChild;
    } else if (i === 2) {
      baseBenefit += ALBERTA_CHILD_BENEFIT_2026.thirdChild;
    } else {
      baseBenefit += ALBERTA_CHILD_BENEFIT_2026.fourthPlusChild;
    }
  }
  
  // Calculate reduction
  let benefit = baseBenefit;
  let reduction = 0;
  
  if (familyNetIncome > ALBERTA_CHILD_BENEFIT_2026.phaseOutThreshold) {
    const excessIncome = familyNetIncome - ALBERTA_CHILD_BENEFIT_2026.phaseOutThreshold;
    reduction = excessIncome * ALBERTA_CHILD_BENEFIT_2026.reductionRate;
    benefit = Math.max(0, baseBenefit - reduction);
  }
  
  const monthlyPayment = benefit / 12;
  
  return {
    annualBenefit: Math.round(benefit * 100) / 100,
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    baseBenefit: Math.round(baseBenefit * 100) / 100,
    reduction: Math.round(reduction * 100) / 100,
    breakdown: {
      firstChild: numberOfChildren >= 1 ? ALBERTA_CHILD_BENEFIT_2026.firstChild : 0,
      secondChild: numberOfChildren >= 2 ? ALBERTA_CHILD_BENEFIT_2026.secondChild : 0,
      thirdChild: numberOfChildren >= 3 ? ALBERTA_CHILD_BENEFIT_2026.thirdChild : 0,
      additionalChildren: Math.max(0, numberOfChildren - 3) * ALBERTA_CHILD_BENEFIT_2026.fourthPlusChild,
    },
  };
}

/**
 * Alberta Seniors Benefit
 * Monthly benefit for low-income seniors 65+
 * 2026 tax year
 */

export const ALBERTA_SENIORS_BENEFIT_2026 = {
  // Monthly maximum amounts
  single: 3522,     // Annual: $3,522
  couple: 5283,     // Annual: $5,283 (combined for both)
  
  // Income thresholds (annual)
  singleThreshold: 32285,
  coupleThreshold: 53760,
  
  // Reduction rate
  reductionRate: 0.20,  // 20% of income over threshold
};

/**
 * Calculate Alberta Seniors Benefit
 */
export function calculateAlbertaSeniorsBenefit(senior) {
  const {
    age,
    netIncome,
    maritalStatus = 'single',
    spouseAge = 0,
    spouseIncome = 0,
  } = senior;
  
  // Must be 65+
  if (age < 65) {
    return {
      annualBenefit: 0,
      monthlyPayment: 0,
      eligible: false,
      reason: 'Must be 65 or older',
    };
  }
  
  const isCouple = (maritalStatus === 'married' || maritalStatus === 'common-law') && spouseAge >= 65;
  const combinedIncome = isCouple ? netIncome + spouseIncome : netIncome;
  
  // Determine maximum benefit
  const maxBenefit = isCouple 
    ? ALBERTA_SENIORS_BENEFIT_2026.couple 
    : ALBERTA_SENIORS_BENEFIT_2026.single;
  
  // Determine threshold
  const threshold = isCouple 
    ? ALBERTA_SENIORS_BENEFIT_2026.coupleThreshold 
    : ALBERTA_SENIORS_BENEFIT_2026.singleThreshold;
  
  // Calculate benefit
  let benefit = maxBenefit;
  let reduction = 0;
  
  if (combinedIncome > threshold) {
    const excessIncome = combinedIncome - threshold;
    reduction = excessIncome * ALBERTA_SENIORS_BENEFIT_2026.reductionRate;
    benefit = Math.max(0, maxBenefit - reduction);
  }
  
  const monthlyPayment = benefit / 12;
  
  return {
    annualBenefit: Math.round(benefit * 100) / 100,
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    maxBenefit: Math.round(maxBenefit * 100) / 100,
    reduction: Math.round(reduction * 100) / 100,
    eligible: true,
    seniorType: isCouple ? 'couple' : 'single',
  };
}

/**
 * Alberta Family Employment Tax Credit (AFETC)
 * Refundable credit for working families with children
 * 2026 tax year
 */

export const ALBERTA_FAMILY_EMPLOYMENT_CREDIT_2026 = {
  // Maximum credit per family
  maxCredit: 2336,
  
  // Working income thresholds
  workingIncomeThreshold: 2760,   // Minimum working income to qualify
  
  // Phase-in
  phaseInRate: 0.11,  // 11% of working income over threshold
  phaseInMax: 23490,  // Income where maximum credit reached
  
  // Phase-out
  phaseOutThreshold: 41775,
  phaseOutRate: 0.04,  // 4% reduction
};

/**
 * Calculate Alberta Family Employment Tax Credit
 */
export function calculateAlbertaFamilyEmploymentCredit(household) {
  const {
    workingIncome,
    familyNetIncome,
    numberOfChildren = 0,
  } = household;
  
  // Must have children
  if (numberOfChildren === 0) {
    return {
      credit: 0,
      eligible: false,
      reason: 'No children',
    };
  }
  
  // Must have working income over threshold
  if (workingIncome < ALBERTA_FAMILY_EMPLOYMENT_CREDIT_2026.workingIncomeThreshold) {
    return {
      credit: 0,
      eligible: false,
      reason: 'Working income below threshold',
    };
  }
  
  // Calculate phase-in
  const excessWorking = workingIncome - ALBERTA_FAMILY_EMPLOYMENT_CREDIT_2026.workingIncomeThreshold;
  let credit = Math.min(
    excessWorking * ALBERTA_FAMILY_EMPLOYMENT_CREDIT_2026.phaseInRate,
    ALBERTA_FAMILY_EMPLOYMENT_CREDIT_2026.maxCredit
  );
  
  // Calculate phase-out
  if (familyNetIncome > ALBERTA_FAMILY_EMPLOYMENT_CREDIT_2026.phaseOutThreshold) {
    const excessIncome = familyNetIncome - ALBERTA_FAMILY_EMPLOYMENT_CREDIT_2026.phaseOutThreshold;
    const reduction = excessIncome * ALBERTA_FAMILY_EMPLOYMENT_CREDIT_2026.phaseOutRate;
    credit = Math.max(0, credit - reduction);
  }
  
  return {
    credit: Math.round(credit * 100) / 100,
    eligible: true,
    maxCredit: ALBERTA_FAMILY_EMPLOYMENT_CREDIT_2026.maxCredit,
  };
}
