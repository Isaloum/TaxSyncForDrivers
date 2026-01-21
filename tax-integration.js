// tax-integration.js — Tax calculator integration for email processing
// Updates user tax profiles based on processed documents

import { DOCUMENT_TYPES } from './pattern-library.js';
import {
  calculateVehicleDeduction,
  calculateBusinessPortion,
  BUSINESS_USE_PERCENTAGE,
  PHONE_BUSINESS_PERCENTAGE,
  PARKING_BUSINESS_PERCENTAGE,
  AVERAGE_MARGINAL_TAX_RATE,
  roundToTwoDecimals,
} from './tax-utils.js';
/**
 * In-memory user profile storage
 * In production, this would use a database
 */
const userProfiles = new Map();

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
  // Federal tax brackets 2026 (indexed 2%, lowest rate reduced to 14%)
  let federalTax = 0;
  if (netIncome > 258482) {
    federalTax = 258482 * 0.29 + (netIncome - 258482) * 0.33;
  } else if (netIncome > 181440) {
    federalTax = 181440 * 0.26 + (netIncome - 181440) * 0.29;
  } else if (netIncome > 117045) {
    federalTax = 117045 * 0.205 + (netIncome - 117045) * 0.26;
  } else if (netIncome > 58523) {
    federalTax = 58523 * 0.14 + (netIncome - 58523) * 0.205;
  } else {
    federalTax = netIncome * 0.14; // REDUCED from 15% to 14%
  }

  // Quebec tax brackets 2026 (indexed 2.05%)
  let quebecTax = 0;
  if (netIncome > 132245) {
    quebecTax = 132245 * 0.2575 + (netIncome - 132245) * 0.2575;
  } else if (netIncome > 108680) {
    quebecTax = 108680 * 0.24 + (netIncome - 108680) * 0.2575;
  } else if (netIncome > 54345) {
    quebecTax = 54345 * 0.19 + (netIncome - 54345) * 0.24;
  } else {
    quebecTax = netIncome * 0.14;
  }

  const totalTax = federalTax + quebecTax;
  const taxSavings = totalDeductions * AVERAGE_MARGINAL_TAX_RATE;
  const effectiveTaxRate = totalIncome > 0 ? (totalTax / totalIncome) * 100 : 0;

  return {
    totalIncome,
    totalDeductions,
    netIncome,
    federalTax: roundToTwoDecimals(federalTax),
    quebecTax: roundToTwoDecimals(quebecTax),
    totalTax: roundToTwoDecimals(totalTax),
    taxSavings: roundToTwoDecimals(taxSavings),
    effectiveTaxRate: roundToTwoDecimals(effectiveTaxRate),
    quarterlyPayment: roundToTwoDecimals(totalTax / 4),
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
        const businessPortion = calculateBusinessPortion(
          extractedData.total,
          BUSINESS_USE_PERCENTAGE
        );
        userProfile.fuelExpenses += businessPortion;
      }
      break;

    case DOCUMENT_TYPES.MAINTENANCE_RECEIPT:
      // Add maintenance expense
      if (extractedData.total) {
        const businessPortion = calculateBusinessPortion(
          extractedData.total,
          BUSINESS_USE_PERCENTAGE
        );
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
      // Add insurance expense
      if (extractedData.premium) {
        const businessPortion = calculateBusinessPortion(
          extractedData.premium,
          BUSINESS_USE_PERCENTAGE
        );
        userProfile.insuranceExpenses += businessPortion;
      }
      break;

    case DOCUMENT_TYPES.PHONE_BILL:
      // Add phone expense
      if (extractedData.total) {
        const businessPortion = calculateBusinessPortion(
          extractedData.total,
          PHONE_BUSINESS_PERCENTAGE
        );
        userProfile.phoneExpenses += businessPortion;
      }
      break;

    case DOCUMENT_TYPES.PARKING_RECEIPT:
      // Add parking expense (100% business use when working)
      if (extractedData.amount) {
        userProfile.parkingExpenses += extractedData.amount * PARKING_BUSINESS_PERCENTAGE;
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
