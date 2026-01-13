// tax-integration.js — Tax calculator integration for email processing
// Updates user tax profiles based on processed documents

import { DOCUMENT_TYPES } from './pattern-library.js';

/**
 * In-memory user profile storage
 * In production, this would use a database
 */
const userProfiles = new Map();

/**
 * Calculate vehicle deduction based on distance
 * @param {number} distanceKm - Distance in kilometers
 * @returns {number} - Deduction amount
 */
function calculateVehicleDeduction(distanceKm) {
  const RATE_FIRST_5000 = 0.7; // $0.70/km
  const RATE_AFTER_5000 = 0.64; // $0.64/km

  if (distanceKm <= 5000) {
    return distanceKm * RATE_FIRST_5000;
  } else {
    return 5000 * RATE_FIRST_5000 + (distanceKm - 5000) * RATE_AFTER_5000;
  }
}

/**
 * Calculate estimated taxes
 * @param {object} profile - User profile
 * @returns {object} - Tax calculation
 */
function calculateTaxes(profile) {
  const totalIncome = profile.income + profile.employmentIncome;
  const totalDeductions =
    profile.vehicleExpenses +
    profile.fuelExpenses +
    profile.maintenanceExpenses +
    profile.insuranceExpenses +
    profile.phoneExpenses +
    profile.parkingExpenses;

  const netIncome = Math.max(0, totalIncome - totalDeductions);

  // Simplified tax calculation (Quebec + Federal)
  // Federal tax brackets 2025 (simplified)
  let federalTax = 0;
  if (netIncome > 165430) {
    federalTax = 165430 * 0.29 + (netIncome - 165430) * 0.33;
  } else if (netIncome > 114750) {
    federalTax = 114750 * 0.26 + (netIncome - 114750) * 0.29;
  } else if (netIncome > 58015) {
    federalTax = 58015 * 0.205 + (netIncome - 58015) * 0.26;
  } else if (netIncome > 55867) {
    federalTax = 55867 * 0.15 + (netIncome - 55867) * 0.205;
  } else {
    federalTax = netIncome * 0.15;
  }

  // Quebec tax brackets 2025 (simplified)
  let quebecTax = 0;
  if (netIncome > 136270) {
    quebecTax = 136270 * 0.2575 + (netIncome - 136270) * 0.2575;
  } else if (netIncome > 102040) {
    quebecTax = 102040 * 0.24 + (netIncome - 102040) * 0.2575;
  } else if (netIncome > 51780) {
    quebecTax = 51780 * 0.2 + (netIncome - 51780) * 0.24;
  } else if (netIncome > 19355) {
    quebecTax = 19355 * 0.14 + (netIncome - 19355) * 0.2;
  } else {
    quebecTax = netIncome * 0.14;
  }

  const totalTax = federalTax + quebecTax;
  const taxSavings = totalDeductions * 0.275; // Average marginal rate
  const effectiveTaxRate = totalIncome > 0 ? (totalTax / totalIncome) * 100 : 0;

  return {
    totalIncome,
    totalDeductions,
    netIncome,
    federalTax: Math.round(federalTax * 100) / 100,
    quebecTax: Math.round(quebecTax * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
    taxSavings: Math.round(taxSavings * 100) / 100,
    effectiveTaxRate: Math.round(effectiveTaxRate * 100) / 100,
    quarterlyPayment: Math.round((totalTax / 4) * 100) / 100,
  };
}

/**
 * Get user profile by email
 * @param {string} userEmail - User's email
 * @returns {object|null} - User profile or null
 */
export function getUserProfile(userEmail) {
  return userProfiles.get(userEmail.toLowerCase());
}

/**
 * Create new user profile
 * @param {string} userEmail - User's email
 * @returns {object} - New user profile
 */
export function createUserProfile(userEmail) {
  const profile = {
    email: userEmail.toLowerCase(),
    createdAt: new Date(),
    updatedAt: new Date(),
    income: 0, // Self-employment income (Uber, Lyft, etc.)
    employmentIncome: 0, // T4/RL-1 income
    vehicleExpenses: 0,
    fuelExpenses: 0,
    maintenanceExpenses: 0,
    insuranceExpenses: 0,
    phoneExpenses: 0,
    parkingExpenses: 0,
    taxDeducted: 0, // Tax already deducted at source
    lastCalculation: null,
    documentCount: 0,
  };

  userProfiles.set(userEmail.toLowerCase(), profile);
  return profile;
}

/**
 * Save user profile
 * @param {object} profile - User profile
 */
export function saveUserProfile(profile) {
  profile.updatedAt = new Date();
  userProfiles.set(profile.email, profile);
}

/**
 * Update user tax data based on processed document
 * @param {string} userEmail - User's email
 * @param {object} documentResult - Processed document result
 * @returns {object} - Updated tax calculation
 */
export async function updateUserTaxData(userEmail, documentResult) {
  const { documentType, extractedData } = documentResult;

  // Get or create user profile
  let userProfile = getUserProfile(userEmail) || createUserProfile(userEmail);

  userProfile.documentCount++;

  switch (documentType) {
    case DOCUMENT_TYPES.UBER_SUMMARY:
    case DOCUMENT_TYPES.LYFT_SUMMARY:
    case DOCUMENT_TYPES.TAXI_STATEMENT:
      // Add to income
      if (extractedData.grossFares || extractedData.grossIncome) {
        const income = extractedData.grossFares || extractedData.grossIncome || 0;
        userProfile.income += income;
      }

      // Add tips to income
      if (extractedData.tips) {
        userProfile.income += extractedData.tips;
      }

      // Add vehicle expenses based on mileage
      if (extractedData.distance) {
        const vehicleDeduction = calculateVehicleDeduction(extractedData.distance);
        userProfile.vehicleExpenses += vehicleDeduction;
      }
      break;

    case DOCUMENT_TYPES.GAS_RECEIPT:
      // Add fuel expense (calculate business portion)
      if (extractedData.total) {
        const businessPortion = extractedData.total * 0.85; // 85% business use
        userProfile.fuelExpenses += businessPortion;
      }
      break;

    case DOCUMENT_TYPES.MAINTENANCE_RECEIPT:
      // Add maintenance expense (85% business use)
      if (extractedData.total) {
        const businessPortion = extractedData.total * 0.85;
        userProfile.maintenanceExpenses += businessPortion;
      }
      break;

    case DOCUMENT_TYPES.T4:
    case DOCUMENT_TYPES.RL1:
      // Update employment income
      if (extractedData.employmentIncome) {
        userProfile.employmentIncome = extractedData.employmentIncome;
      }

      // Update tax deducted
      if (extractedData.incomeTax) {
        userProfile.taxDeducted = extractedData.incomeTax;
      }
      break;

    case DOCUMENT_TYPES.INSURANCE_DOC:
      // Add insurance expense (85% business use)
      if (extractedData.premium) {
        const businessPortion = extractedData.premium * 0.85;
        userProfile.insuranceExpenses += businessPortion;
      }
      break;

    case DOCUMENT_TYPES.PHONE_BILL:
      // Add phone expense (50% business use for drivers)
      if (extractedData.total) {
        const businessPortion = extractedData.total * 0.5;
        userProfile.phoneExpenses += businessPortion;
      }
      break;

    case DOCUMENT_TYPES.PARKING_RECEIPT:
      // Add parking expense (100% business use when working)
      if (extractedData.amount) {
        userProfile.parkingExpenses += extractedData.amount;
      }
      break;
  }

  // Recalculate taxes
  const taxCalculation = calculateTaxes(userProfile);
  userProfile.lastCalculation = taxCalculation;

  // Save updated profile
  saveUserProfile(userProfile);

  return {
    userEmail: userProfile.email,
    documentType,
    taxCalculation,
    updatedAt: userProfile.updatedAt,
    totalDocuments: userProfile.documentCount,
  };
}

/**
 * Get tax summary for a user
 * @param {string} userEmail - User's email
 * @returns {object|null} - Tax summary or null
 */
export function getTaxSummary(userEmail) {
  const profile = getUserProfile(userEmail);
  if (!profile) return null;

  return {
    email: profile.email,
    income: {
      selfEmployment: profile.income,
      employment: profile.employmentIncome,
      total: profile.income + profile.employmentIncome,
    },
    expenses: {
      vehicle: profile.vehicleExpenses,
      fuel: profile.fuelExpenses,
      maintenance: profile.maintenanceExpenses,
      insurance: profile.insuranceExpenses,
      phone: profile.phoneExpenses,
      parking: profile.parkingExpenses,
      total:
        profile.vehicleExpenses +
        profile.fuelExpenses +
        profile.maintenanceExpenses +
        profile.insuranceExpenses +
        profile.phoneExpenses +
        profile.parkingExpenses,
    },
    taxCalculation: profile.lastCalculation,
    documentCount: profile.documentCount,
    lastUpdated: profile.updatedAt,
  };
}

/**
 * Reset user profile (for testing or user request)
 * @param {string} userEmail - User's email
 * @returns {boolean} - Success status
 */
export function resetUserProfile(userEmail) {
  const deleted = userProfiles.delete(userEmail.toLowerCase());
  return deleted;
}

/**
 * Export all user profiles (for admin/backup)
 * @returns {Array} - All user profiles
 */
export function exportAllProfiles() {
  return Array.from(userProfiles.values());
}
