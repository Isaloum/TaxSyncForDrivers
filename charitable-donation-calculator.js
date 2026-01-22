// charitable-donation-calculator.js — Charitable donation tax credit calculator for 2026

/**
 * Calculate charitable donation tax credit
 * Federal: 15% on first $200, 29% on remainder
 * Quebec: flat 25%
 * 
 * @param {number} totalDonations - Total charitable donations for the year
 * @returns {Object} Credit breakdown with federal and Quebec amounts
 */
export function calculateCharitableCredit(totalDonations) {
  const FIRST_TIER_LIMIT = 200;
  const FEDERAL_FIRST_RATE = 0.15;  // 15% on first $200
  const FEDERAL_SECOND_RATE = 0.29; // 29% on remainder
  const QUEBEC_RATE = 0.25;         // 25% flat rate
  
  let federalCredit = 0;
  
  if (totalDonations <= 0) {
    return {
      totalDonations: 0,
      federalCredit: 0,
      quebecCredit: 0,
      totalCredit: 0,
      firstTierAmount: 0,
      secondTierAmount: 0,
    };
  }
  
  // Calculate federal credit (tiered)
  if (totalDonations <= FIRST_TIER_LIMIT) {
    // All donations in first tier
    federalCredit = totalDonations * FEDERAL_FIRST_RATE;
  } else {
    // Split between first and second tier
    const firstTierCredit = FIRST_TIER_LIMIT * FEDERAL_FIRST_RATE;
    const secondTierAmount = totalDonations - FIRST_TIER_LIMIT;
    const secondTierCredit = secondTierAmount * FEDERAL_SECOND_RATE;
    federalCredit = firstTierCredit + secondTierCredit;
  }
  
  // Calculate Quebec credit (flat rate)
  const quebecCredit = totalDonations * QUEBEC_RATE;
  
  // Total credit
  const totalCredit = federalCredit + quebecCredit;
  
  // Determine tier amounts
  const firstTierAmount = Math.min(totalDonations, FIRST_TIER_LIMIT);
  const secondTierAmount = Math.max(0, totalDonations - FIRST_TIER_LIMIT);
  
  return {
    totalDonations: Math.round(totalDonations * 100) / 100,
    federalCredit: Math.round(federalCredit * 100) / 100,
    quebecCredit: Math.round(quebecCredit * 100) / 100,
    totalCredit: Math.round(totalCredit * 100) / 100,
    firstTierAmount: Math.round(firstTierAmount * 100) / 100,
    secondTierAmount: Math.round(secondTierAmount * 100) / 100,
  };
}

/**
 * Verify charity registration number (BN/RR format)
 * Valid format: 9 digits + RR + 4 digits (e.g., 123456789RR0001)
 * 
 * @param {string} registrationNumber - Charity registration number
 * @returns {Object} Validation result
 */
export function verifyCharityRegistration(registrationNumber) {
  const errors = [];
  
  if (!registrationNumber || registrationNumber.trim().length === 0) {
    errors.push('Registration number is required');
    return {
      isValid: false,
      errors,
      format: null,
    };
  }
  
  // Remove spaces and hyphens
  const cleaned = registrationNumber.replace(/[\s-]/g, '').toUpperCase();
  
  // Valid format: 9 digits + RR + 4 digits
  const rrPattern = /^(\d{9})(RR)(\d{4})$/;
  const match = cleaned.match(rrPattern);
  
  if (!match) {
    errors.push('Invalid registration number format. Expected: 123456789RR0001');
    return {
      isValid: false,
      errors,
      format: null,
    };
  }
  
  return {
    isValid: true,
    errors: [],
    format: {
      businessNumber: match[1],
      type: match[2],
      reference: match[3],
      formatted: `${match[1]}-${match[2]}-${match[3]}`,
    },
  };
}

/**
 * Track donations by charity
 * 
 * @param {Array} donations - Array of donation objects with charity name, amount, and registration number
 * @returns {Object} Donations grouped by charity with totals
 */
export function trackDonationsByCharity(donations) {
  const charities = {};
  let grandTotal = 0;
  
  for (const donation of donations) {
    const charityName = donation.charityName || 'Unknown';
    
    if (!charities[charityName]) {
      charities[charityName] = {
        charityName,
        registrationNumber: donation.registrationNumber || '',
        donations: [],
        total: 0,
      };
    }
    
    charities[charityName].donations.push({
      amount: donation.amount,
      date: donation.date || null,
      receiptNumber: donation.receiptNumber || null,
    });
    
    charities[charityName].total += donation.amount;
    grandTotal += donation.amount;
  }
  
  // Round totals
  for (const charity in charities) {
    charities[charity].total = Math.round(charities[charity].total * 100) / 100;
  }
  
  return {
    charities,
    grandTotal: Math.round(grandTotal * 100) / 100,
    numberOfCharities: Object.keys(charities).length,
  };
}

/**
 * Validate donation data
 * 
 * @param {number} amount - Donation amount
 * @param {string} charityName - Name of charity
 * @param {string} registrationNumber - Charity registration number
 * @returns {Object} Validation result
 */
export function validateDonation(amount, charityName, registrationNumber) {
  const errors = [];
  
  if (typeof amount !== 'number' || amount <= 0) {
    errors.push('Amount must be a positive number');
  }
  
  if (!charityName || charityName.trim().length === 0) {
    errors.push('Charity name is required');
  }
  
  // Validate registration number if provided
  if (registrationNumber && registrationNumber.trim().length > 0) {
    const regValidation = verifyCharityRegistration(registrationNumber);
    if (!regValidation.isValid) {
      errors.push(...regValidation.errors);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate total tax savings from donations
 * Combines federal and Quebec credits into total savings
 * 
 * @param {number} totalDonations - Total donations
 * @returns {Object} Tax savings breakdown
 */
export function calculateDonationTaxSavings(totalDonations) {
  const credits = calculateCharitableCredit(totalDonations);
  const effectiveRate = totalDonations > 0 ? (credits.totalCredit / totalDonations) * 100 : 0;
  
  return {
    ...credits,
    effectiveRate: Math.round(effectiveRate * 100) / 100,
    netCost: Math.round((totalDonations - credits.totalCredit) * 100) / 100,
  };
}
