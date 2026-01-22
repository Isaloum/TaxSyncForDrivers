/**
 * Territories Tax Calculators
 * Yukon, Northwest Territories, Nunavut
 * 2026 tax year
 * Includes Northern Residents Deduction
 */

// YUKON
export const YUKON_TAX_RATES_2026 = {
  brackets: [
    { limit: 55867, rate: 0.064 },    // 6.4%
    { limit: 111733, rate: 0.09 },    // 9%
    { limit: 173205, rate: 0.109 },   // 10.9%
    { limit: 500000, rate: 0.128 },   // 12.8%
    { limit: Infinity, rate: 0.15 },  // 15%
  ],
  basicPersonalAmount: 15705,
};

export function calculateYukonTax(taxableIncome) {
  if (taxableIncome <= 0) return { tax: 0 };
  
  let tax = 0;
  let previousLimit = 0;
  
  for (const bracket of YUKON_TAX_RATES_2026.brackets) {
    if (taxableIncome > previousLimit) {
      const taxableInBracket = Math.min(taxableIncome, bracket.limit) - previousLimit;
      tax += taxableInBracket * bracket.rate;
      previousLimit = bracket.limit;
    } else {
      break;
    }
  }
  
  const basicCredit = YUKON_TAX_RATES_2026.basicPersonalAmount * YUKON_TAX_RATES_2026.brackets[0].rate;
  tax = Math.max(0, tax - basicCredit);
  
  return { provincialTax: Math.round(tax * 100) / 100, totalTax: Math.round(tax * 100) / 100 };
}

// NORTHWEST TERRITORIES
export const NWT_TAX_RATES_2026 = {
  brackets: [
    { limit: 50597, rate: 0.059 },    // 5.9%
    { limit: 101198, rate: 0.086 },   // 8.6%
    { limit: 164525, rate: 0.122 },   // 12.2%
    { limit: Infinity, rate: 0.1405 }, // 14.05%
  ],
  basicPersonalAmount: 16593,
};

export function calculateNWTTax(taxableIncome) {
  if (taxableIncome <= 0) return { tax: 0 };
  
  let tax = 0;
  let previousLimit = 0;
  
  for (const bracket of NWT_TAX_RATES_2026.brackets) {
    if (taxableIncome > previousLimit) {
      const taxableInBracket = Math.min(taxableIncome, bracket.limit) - previousLimit;
      tax += taxableInBracket * bracket.rate;
      previousLimit = bracket.limit;
    } else {
      break;
    }
  }
  
  const basicCredit = NWT_TAX_RATES_2026.basicPersonalAmount * NWT_TAX_RATES_2026.brackets[0].rate;
  tax = Math.max(0, tax - basicCredit);
  
  return { provincialTax: Math.round(tax * 100) / 100, totalTax: Math.round(tax * 100) / 100 };
}

// NUNAVUT
export const NUNAVUT_TAX_RATES_2026 = {
  brackets: [
    { limit: 53268, rate: 0.04 },     // 4% (lowest in Canada!)
    { limit: 106537, rate: 0.07 },    // 7%
    { limit: 173205, rate: 0.09 },    // 9%
    { limit: Infinity, rate: 0.115 }, // 11.5%
  ],
  basicPersonalAmount: 17925,
};

export function calculateNunavutTax(taxableIncome) {
  if (taxableIncome <= 0) return { tax: 0 };
  
  let tax = 0;
  let previousLimit = 0;
  
  for (const bracket of NUNAVUT_TAX_RATES_2026.brackets) {
    if (taxableIncome > previousLimit) {
      const taxableInBracket = Math.min(taxableIncome, bracket.limit) - previousLimit;
      tax += taxableInBracket * bracket.rate;
      previousLimit = bracket.limit;
    } else {
      break;
    }
  }
  
  const basicCredit = NUNAVUT_TAX_RATES_2026.basicPersonalAmount * NUNAVUT_TAX_RATES_2026.brackets[0].rate;
  tax = Math.max(0, tax - basicCredit);
  
  return { provincialTax: Math.round(tax * 100) / 100, totalTax: Math.round(tax * 100) / 100 };
}

/**
 * Northern Residents Deduction (Federal)
 * Available to residents of prescribed northern zones
 */
export const NORTHERN_RESIDENTS_DEDUCTION_2026 = {
  // Residency deduction (per day lived in northern zone)
  zoneA: {
    dailyRate: 22.00,    // $22/day
    annualMax: 8030,     // 365 days × $22
  },
  zoneB: {
    dailyRate: 11.00,    // $11/day
    annualMax: 4015,     // 365 days × $11
  },
  
  // Travel deduction (for trips outside prescribed zone)
  travelDeduction: {
    maxTrips: 2,         // Per person per year
    maxPerTrip: 1200,    // Maximum $1,200 per trip
  },
};

/**
 * Calculate Northern Residents Deduction
 */
export function calculateNorthernResidentsDeduction(residency) {
  const {
    zone = 'A',          // 'A' or 'B'
    daysInZone = 365,
    numberOfTrips = 0,
    travelCosts = 0,
  } = residency;
  
  // Residency deduction
  const zoneRates = zone === 'A' 
    ? NORTHERN_RESIDENTS_DEDUCTION_2026.zoneA 
    : NORTHERN_RESIDENTS_DEDUCTION_2026.zoneB;
  
  const residencyDeduction = Math.min(
    daysInZone * zoneRates.dailyRate,
    zoneRates.annualMax
  );
  
  // Travel deduction
  const maxTravelDeduction = NORTHERN_RESIDENTS_DEDUCTION_2026.travelDeduction.maxTrips * 
                            NORTHERN_RESIDENTS_DEDUCTION_2026.travelDeduction.maxPerTrip;
  const travelDeduction = Math.min(travelCosts, maxTravelDeduction);
  
  return {
    residencyDeduction: Math.round(residencyDeduction * 100) / 100,
    travelDeduction: Math.round(travelDeduction * 100) / 100,
    totalDeduction: Math.round((residencyDeduction + travelDeduction) * 100) / 100,
    zone,
  };
}

/**
 * Determine if location is Zone A or Zone B
 */
export function getNorthernZone(territory) {
  // All Yukon, NWT, Nunavut are Zone A
  // Some northern parts of provinces are Zone B
  const zoneALocations = ['YT', 'NT', 'NU'];
  return zoneALocations.includes(territory) ? 'A' : 'B';
}
