// vehicle-expense-calculator.js — Vehicle expense calculation with both simplified and detailed methods
// Based on CRA T777 Statement of Employment Expenses

/**
 * Vehicle expense rates for 2026 tax year
 */
export const VEHICLE_RATES_2026 = {
  first5000km: 0.70,
  after5000km: 0.64,
  territories: 0.04, // Yukon, NWT, Nunavut
};

/**
 * Capital Cost Allowance (CCA) rates and limits
 */
export const CCA_RATES = {
  class10: 0.30, // Passenger vehicles
  class10_1: 0.30, // Passenger vehicles > $37,000 (separate class)
  maxDepreciableAmount: 37000, // 2026 limit
  firstYearRule: 0.5, // Half-year rule
};

/**
 * Calculate vehicle expenses using simplified method
 * @param {number} totalKm - Total kilometers driven (annual)
 * @param {number} businessKm - Business kilometers driven
 * @param {boolean} isNorthernTerritory - Whether driver is in Yukon, NWT, or Nunavut
 * @returns {object} - Calculation result with deduction and breakdown
 */
export function calculateSimplifiedMethod(totalKm, businessKm, isNorthernTerritory = false) {
  if (businessKm <= 0) return { deduction: 0, breakdown: {} };

  const first5000 = Math.min(businessKm, 5000);
  const after5000 = Math.max(0, businessKm - 5000);

  let deduction =
    first5000 * VEHICLE_RATES_2026.first5000km + after5000 * VEHICLE_RATES_2026.after5000km;

  if (isNorthernTerritory) {
    deduction += businessKm * VEHICLE_RATES_2026.territories;
  }

  return {
    method: 'simplified',
    deduction: Math.round(deduction * 100) / 100,
    breakdown: {
      first5000km: first5000,
      first5000Amount: Math.round(first5000 * VEHICLE_RATES_2026.first5000km * 100) / 100,
      after5000km: after5000,
      after5000Amount: Math.round(after5000 * VEHICLE_RATES_2026.after5000km * 100) / 100,
      territoryAddition: isNorthernTerritory
        ? Math.round(businessKm * VEHICLE_RATES_2026.territories * 100) / 100
        : 0,
    },
  };
}

/**
 * Calculate vehicle expenses using detailed method
 * @param {object} expenses - Object containing all vehicle expenses
 * @param {number} totalKm - Total kilometers driven (annual)
 * @param {number} businessKm - Business kilometers driven
 * @param {number} vehicleCost - Purchase price of vehicle (for CCA calculation)
 * @param {boolean} isFirstYear - Whether this is the first year of vehicle ownership
 * @returns {object} - Calculation result with deduction and breakdown
 */
export function calculateDetailedMethod(
  expenses,
  totalKm,
  businessKm,
  vehicleCost = 0,
  isFirstYear = false
) {
  if (totalKm <= 0 || businessKm <= 0) return { deduction: 0, breakdown: {} };

  const businessUsePercent = (businessKm / totalKm) * 100;

  // Operating expenses
  const {
    gas = 0,
    insurance = 0,
    maintenance = 0,
    repairs = 0,
    registration = 0,
    carWash = 0,
    parking = 0,
    tolls = 0,
  } = expenses;

  const operatingExpenses =
    gas + insurance + maintenance + repairs + registration + carWash + parking + tolls;

  // Financing costs
  const { leasePayments = 0, loanInterest = 0 } = expenses;

  const financingCosts = leasePayments + loanInterest;

  // Capital Cost Allowance (CCA)
  let cca = 0;
  if (vehicleCost > 0) {
    const depreciableAmount = Math.min(vehicleCost, CCA_RATES.maxDepreciableAmount);
    const ccaRate = CCA_RATES.class10;

    if (isFirstYear) {
      // Half-year rule applies
      cca = depreciableAmount * ccaRate * CCA_RATES.firstYearRule;
    } else {
      cca = depreciableAmount * ccaRate;
    }
  }

  // Total before business use percentage
  const totalBeforeBusinessUse = operatingExpenses + financingCosts + cca;

  // Apply business use percentage
  const deduction = totalBeforeBusinessUse * (businessUsePercent / 100);

  return {
    method: 'detailed',
    deduction: Math.round(deduction * 100) / 100,
    breakdown: {
      operatingExpenses: Math.round(operatingExpenses * 100) / 100,
      financingCosts: Math.round(financingCosts * 100) / 100,
      cca: Math.round(cca * 100) / 100,
      totalBeforeBusinessUse: Math.round(totalBeforeBusinessUse * 100) / 100,
      businessUsePercent: Math.round(businessUsePercent * 100) / 100,
      businessKm,
      totalKm,
    },
  };
}

/**
 * Compare both methods and recommend the best option
 * @param {number} totalKm - Total kilometers driven
 * @param {number} businessKm - Business kilometers driven
 * @param {object} expenses - Vehicle expenses for detailed method
 * @param {number} vehicleCost - Vehicle purchase price
 * @param {boolean} isFirstYear - First year of ownership
 * @returns {object} - Comparison result with recommendation
 */
export function compareVehicleMethods(
  totalKm,
  businessKm,
  expenses = {},
  vehicleCost = 0,
  isFirstYear = false
) {
  const simplified = calculateSimplifiedMethod(totalKm, businessKm);
  const detailed = calculateDetailedMethod(expenses, totalKm, businessKm, vehicleCost, isFirstYear);

  const recommended = simplified.deduction >= detailed.deduction ? 'simplified' : 'detailed';
  const savings = Math.abs(simplified.deduction - detailed.deduction);

  return {
    simplified,
    detailed,
    recommended,
    savings: Math.round(savings * 100) / 100,
    bestDeduction: Math.max(simplified.deduction, detailed.deduction),
  };
}
