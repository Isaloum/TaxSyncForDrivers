/**
 * Canada Child Benefit (CCB) Calculator
 * Federal tax-free monthly payment for families with children under 18
 * 2026 tax year
 */

export const CCB_RATES_2026 = {
  // Base amounts per child
  baseAmountUnder6: 7787,      // Per child under 6 years
  baseAmount6to17: 6570,        // Per child 6-17 years
  
  // Phase-out thresholds
  phaseOut1Start: 35000,        // Income where reduction begins
  phaseOut1Rate: 0.07,          // 7% reduction on income over $35,000
  phaseOut1Limit: 73000,        // Income where phase 2 begins
  
  phaseOut2Rate: 0.032,         // 3.2% additional reduction over $73,000
  
  // Disability supplement
  childDisabilityBenefit: 3322, // Annual CDB amount per eligible child
  cdbPhaseOutStart: 73000,
  cdbPhaseOutRate: 0.032,
};

/**
 * Calculate Canada Child Benefit for a family
 * @param {number} familyNetIncome - Adjusted family net income
 * @param {Array} children - Array of child objects
 * @param {number} children[].age - Child's age
 * @param {boolean} children[].hasDisability - Whether child is eligible for CDB
 * @returns {Object} CCB calculation
 */
export function calculateCCB(familyNetIncome, children) {
  // Validate inputs
  if (!Array.isArray(children) || children.length === 0) {
    return {
      totalAnnualCCB: 0,
      monthlyPayment: 0,
      childrenUnder6: 0,
      children6to17: 0,
      totalChildren: 0,
      baseAmount: 0,
      reductionAmount: 0,
      disabilitySupplement: 0,
      disabilityReduction: 0,
      breakdown: [],
    };
  }
  
  let baseAmount = 0;
  let disabilitySupplement = 0;
  const breakdown = [];
  
  // Calculate base amounts per child
  children.forEach((child, index) => {
    const childBase = child.age < 6 
      ? CCB_RATES_2026.baseAmountUnder6 
      : CCB_RATES_2026.baseAmount6to17;
    
    baseAmount += childBase;
    
    // Add disability supplement if eligible
    if (child.hasDisability) {
      disabilitySupplement += CCB_RATES_2026.childDisabilityBenefit;
    }
    
    breakdown.push({
      childNumber: index + 1,
      age: child.age,
      ageGroup: child.age < 6 ? 'Under 6' : '6-17',
      baseAmount: childBase,
      hasDisability: child.hasDisability || false,
      disabilitySupplement: child.hasDisability ? CCB_RATES_2026.childDisabilityBenefit : 0,
    });
  });
  
  // Calculate income-tested reduction
  let reductionAmount = 0;
  
  if (familyNetIncome > CCB_RATES_2026.phaseOut1Start) {
    const phase1Income = Math.min(
      familyNetIncome - CCB_RATES_2026.phaseOut1Start,
      CCB_RATES_2026.phaseOut1Limit - CCB_RATES_2026.phaseOut1Start
    );
    reductionAmount += phase1Income * CCB_RATES_2026.phaseOut1Rate * children.length;
  }
  
  if (familyNetIncome > CCB_RATES_2026.phaseOut1Limit) {
    const phase2Income = familyNetIncome - CCB_RATES_2026.phaseOut1Limit;
    reductionAmount += phase2Income * CCB_RATES_2026.phaseOut2Rate * children.length;
  }
  
  // Reduce disability supplement separately
  let disabilityReduction = 0;
  if (familyNetIncome > CCB_RATES_2026.cdbPhaseOutStart && disabilitySupplement > 0) {
    const excessIncome = familyNetIncome - CCB_RATES_2026.cdbPhaseOutStart;
    const childrenWithDisability = children.filter(c => c.hasDisability).length;
    disabilityReduction = Math.min(
      excessIncome * CCB_RATES_2026.cdbPhaseOutRate * childrenWithDisability,
      disabilitySupplement
    );
  }
  
  // Calculate final amounts
  const totalAnnualCCB = Math.max(0, baseAmount - reductionAmount + disabilitySupplement - disabilityReduction);
  const monthlyPayment = totalAnnualCCB / 12;
  
  return {
    totalAnnualCCB: Math.round(totalAnnualCCB * 100) / 100,
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    childrenUnder6: children.filter(c => c.age < 6).length,
    children6to17: children.filter(c => c.age >= 6 && c.age <= 17).length,
    totalChildren: children.length,
    baseAmount: Math.round(baseAmount * 100) / 100,
    reductionAmount: Math.round(reductionAmount * 100) / 100,
    disabilitySupplement: Math.round(disabilitySupplement * 100) / 100,
    disabilityReduction: Math.round(disabilityReduction * 100) / 100,
    breakdown,
  };
}

/**
 * Estimate CCB eligibility based on income
 */
export function estimateCCBEligibility(familyNetIncome, numberOfChildren = 1) {
  // Rough estimate: CCB available up to ~$250,000 for families with multiple children
  const maxIncome = 200000 + (numberOfChildren * 25000);
  return familyNetIncome < maxIncome;
}

/**
 * Calculate AFNI (Adjusted Family Net Income) for CCB
 * Includes both spouses' net income
 */
export function calculateAFNI(spouse1NetIncome, spouse2NetIncome = 0) {
  return spouse1NetIncome + spouse2NetIncome;
}
