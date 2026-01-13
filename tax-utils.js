// tax-utils.js — Shared utility functions for tax calculations

/**
 * Vehicle deduction rate constants (CRA 2025)
 */
export const VEHICLE_RATE_FIRST_5000 = 0.7; // $0.70/km
export const VEHICLE_RATE_AFTER_5000 = 0.64; // $0.64/km

/**
 * Business use percentage constants
 */
export const BUSINESS_USE_PERCENTAGE = 0.85; // 85% for most expenses
export const PHONE_BUSINESS_PERCENTAGE = 0.5; // 50% for phone
export const PARKING_BUSINESS_PERCENTAGE = 1.0; // 100% for parking while working

/**
 * Tax calculation constants
 */
export const AVERAGE_MARGINAL_TAX_RATE = 0.275; // 27.5%

/**
 * Calculate vehicle deduction based on distance
 * Uses CRA simplified method rates for 2025
 * @param {number} distanceKm - Distance in kilometers
 * @returns {number} - Deduction amount in dollars
 */
export function calculateVehicleDeduction(distanceKm) {
  if (distanceKm <= 5000) {
    return distanceKm * VEHICLE_RATE_FIRST_5000;
  } else {
    return 5000 * VEHICLE_RATE_FIRST_5000 + (distanceKm - 5000) * VEHICLE_RATE_AFTER_5000;
  }
}

/**
 * Calculate business portion of expense
 * @param {number} amount - Total expense amount
 * @param {number} businessPercentage - Business use percentage (0-1)
 * @returns {number} - Business portion amount
 */
export function calculateBusinessPortion(amount, businessPercentage = BUSINESS_USE_PERCENTAGE) {
  return amount * businessPercentage;
}

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @param {string} locale - Locale string (default: 'en-US')
 * @returns {string} - Formatted currency
 */
export function formatCurrency(amount, locale = 'en-US') {
  return amount.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Round to 2 decimal places
 * @param {number} value - Value to round
 * @returns {number} - Rounded value
 */
export function roundToTwoDecimals(value) {
  return Math.round(value * 100) / 100;
}
