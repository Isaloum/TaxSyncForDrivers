/**
 * Tax Forms Integration Module
 * Connects all compliance modules for complete tax package generation
 * Integrates: T2125, TP-80-V, CCA, GST/QST, Mileage Log, Receipt Storage
 * @module tax-forms-integration
 */

import { generateT2125Form, calculateT2125 } from './t2125-generator.js';
import { calculateFirstYearCCA, calculateSubsequentYearCCA } from './cca-calculator.js';
import { generateTP80VForm, calculateTP80V } from './tp80v-generator.js';
import { calculateGSTQST, isRegistrationRequired } from './gst-qst-tracker.js';
import { getAnnualSummary, calculateBusinessPercentage } from './mileage-log.js';
import { getTotalByCategory, exportAuditTrail } from './receipt-storage.js';

/**
 * Generate complete tax package with all forms and schedules
 * 
 * @param {Object} driverData - Complete driver information and business data
 * @param {Object} driverData.driverInfo - Personal information
 * @param {string} driverData.driverInfo.name - Full name
 * @param {string} driverData.driverInfo.sin - SIN (or NAS for Quebec)
 * @param {string} driverData.driverInfo.address - Business address
 * @param {number} driverData.driverInfo.fiscalYear - Tax year
 * @param {string} driverData.driverInfo.province - Province code (e.g., 'QC', 'ON')
 * @param {Object} driverData.income - Income data
 * @param {number} driverData.income.grossFares - Total fares
 * @param {number} driverData.income.commissions - Platform commissions
 * @param {number} driverData.income.otherIncome - Other business income
 * @param {Array} driverData.trips - Mileage log trips
 * @param {Array} driverData.receipts - Receipt objects
 * @param {Object} [driverData.vehicle] - Vehicle information (optional)
 * @param {number} driverData.vehicle.cost - Vehicle purchase price
 * @param {number} driverData.vehicle.businessUsePercentage - Business use percentage
 * @param {number} driverData.vehicle.years - Years owned (1 for first year)
 * @param {number} [driverData.vehicle.uccBeginning] - UCC at start of year (for subsequent years)
 * @param {string} [driverData.language] - Language for Quebec forms ('fr' or 'en')
 * @param {boolean} [driverData.gstRegistered] - Whether driver is GST/QST registered
 * @param {Array} [driverData.quarterlyRevenue] - Quarterly revenue for GST registration check
 * @returns {Object} Complete tax package
 */
export function generateCompleteTaxPackage(driverData) {
  // Validate input
  if (!driverData || typeof driverData !== 'object') {
    throw new Error('Invalid driver data: must be an object');
  }

  if (!driverData.driverInfo || typeof driverData.driverInfo !== 'object') {
    throw new Error('Invalid driver info: must be an object');
  }

  if (!driverData.income || typeof driverData.income !== 'object') {
    throw new Error('Invalid income data: must be an object');
  }

  const { driverInfo, income, trips = [], receipts = [], vehicle, language = 'en', gstRegistered = false, quarterlyRevenue = [] } = driverData;
  const isQuebec = driverInfo.province?.toUpperCase() === 'QC';
  const fiscalYear = driverInfo.fiscalYear || new Date().getFullYear();

  // Auto-populate expenses from receipts
  const expenses = autoPopulateExpensesFromReceipts(receipts, fiscalYear);

  // Calculate business use percentage from trips if provided
  let businessUsePercentage = vehicle?.businessUsePercentage || 100;
  let mileageSummary = null;
  
  if (trips.length > 0) {
    businessUsePercentage = calculateBusinessPercentage(trips);
    mileageSummary = getAnnualSummary(trips);
  }

  // Calculate CCA if vehicle provided
  let ccaSchedule = null;
  if (vehicle) {
    if (vehicle.years === 1 || !vehicle.uccBeginning) {
      // First year - half-year rule
      ccaSchedule = calculateFirstYearCCA(vehicle.cost, businessUsePercentage);
    } else {
      // Subsequent years
      ccaSchedule = calculateSubsequentYearCCA(
        vehicle.uccBeginning,
        0, // additions
        0, // disposals
        businessUsePercentage
      );
    }
    // Update expenses with CCA
    expenses.cca = ccaSchedule.cca;
  }

  // Build business data for forms
  const businessData = {
    grossFares: income.grossFares,
    commissions: income.commissions,
    otherIncome: income.otherIncome,
    expenses
  };

  // Generate T2125 (Federal)
  const t2125 = generateT2125Form(driverInfo, businessData);

  // Generate TP-80-V if Quebec
  let tp80v = null;
  if (isQuebec) {
    tp80v = generateTP80VForm(driverInfo, businessData, language);
  }

  // Calculate GST/QST if registered
  let gstQstAnalysis = null;
  if (gstRegistered) {
    gstQstAnalysis = calculateGSTQST(
      income.grossFares + income.commissions + income.otherIncome,
      expenses,
      driverInfo.province
    );
  } else if (quarterlyRevenue.length > 0) {
    // Check if registration required
    gstQstAnalysis = {
      registrationCheck: isRegistrationRequired(quarterlyRevenue)
    };
  }

  // Generate receipt summary
  const receiptSummary = generateReceiptSummary(receipts, fiscalYear);

  // Validate completeness
  const validation = validateTaxPackage({
    driverInfo,
    income,
    expenses,
    trips,
    receipts,
    vehicle,
    isQuebec,
    gstRegistered
  });

  // Build complete package
  return {
    packageType: 'Complete Tax Package',
    fiscalYear,
    province: driverInfo.province,
    generatedDate: new Date().toISOString(),
    driverInfo: {
      name: driverInfo.name,
      sin: driverInfo.sin,
      address: driverInfo.address,
      province: driverInfo.province
    },
    forms: {
      t2125,
      ...(tp80v && { tp80v })
    },
    schedules: {
      ...(ccaSchedule && { cca: ccaSchedule }),
      ...(mileageSummary && { mileage: mileageSummary }),
      receipts: receiptSummary,
      ...(gstQstAnalysis && { gstQst: gstQstAnalysis })
    },
    validation,
    summary: {
      totalIncome: t2125.income.grossIncome,
      totalExpenses: t2125.expenses.totalExpenses,
      netIncome: t2125.netIncome,
      businessUsePercentage,
      ...(ccaSchedule && { cca: ccaSchedule.cca }),
      ...(gstQstAnalysis?.netTaxOwing && { gstQstOwing: gstQstAnalysis.netTaxOwing }),
      ...(tp80v && { 
        fss: tp80v.fss.totalFSS,
        qpp: tp80v.qpp.totalContributions 
      })
    }
  };
}

/**
 * Auto-populate form expenses from tracked receipts and mileage
 * 
 * @param {Array} receipts - Receipt objects
 * @param {number} year - Tax year
 * @returns {Object} Expense breakdown
 */
function autoPopulateExpensesFromReceipts(receipts, year) {
  const categories = ['fuel', 'maintenance', 'insurance', 'supplies', 'office', 'telephone', 'advertising'];
  const expenses = {
    advertising: 0,
    insurance: 0,
    maintenance: 0,
    office: 0,
    supplies: 0,
    telephone: 0,
    fuel: 0,
    vehicle: 0,
    licenses: 0,
    cca: 0
  };

  // Sum receipts by category for the year
  const yearReceipts = receipts.filter(r => {
    const receiptDate = new Date(r.date);
    return receiptDate.getFullYear() === year;
  });

  categories.forEach(category => {
    expenses[category] = yearReceipts
      .filter(r => r.category === category)
      .reduce((sum, r) => sum + r.amount, 0);
  });

  // Add 'other' category to vehicle expenses
  expenses.vehicle = yearReceipts
    .filter(r => r.category === 'other')
    .reduce((sum, r) => sum + r.amount, 0);

  return expenses;
}

/**
 * Auto-populate forms from mileage log, receipts, and income
 * 
 * @param {Array} mileageLog - Trip entries
 * @param {Array} receipts - Receipt objects
 * @param {Object} income - Income data
 * @param {number} year - Tax year
 * @returns {Object} Auto-populated form data
 */
export function autoPopulateForms(mileageLog, receipts, income, year = new Date().getFullYear()) {
  // Validate inputs
  if (!Array.isArray(mileageLog)) {
    throw new Error('Invalid mileage log: must be an array');
  }

  if (!Array.isArray(receipts)) {
    throw new Error('Invalid receipts: must be an array');
  }

  if (!income || typeof income !== 'object') {
    throw new Error('Invalid income: must be an object');
  }

  // Calculate business use from mileage log
  const businessUsePercentage = mileageLog.length > 0 ? calculateBusinessPercentage(mileageLog) : 100;
  const mileageSummary = mileageLog.length > 0 ? getAnnualSummary(mileageLog) : null;

  // Auto-populate expenses from receipts
  const expenses = autoPopulateExpensesFromReceipts(receipts, year);

  // Build form data
  return {
    income: {
      grossFares: income.grossFares || 0,
      commissions: income.commissions || 0,
      otherIncome: income.otherIncome || 0
    },
    expenses,
    businessUsePercentage,
    mileageSummary,
    year
  };
}

/**
 * Validate tax package completeness and compliance
 * 
 * @param {Object} packageData - Tax package data to validate
 * @returns {Object} Validation report
 */
export function validateTaxPackage(packageData) {
  const errors = [];
  const warnings = [];
  const info = [];

  // Validate driver info
  if (!packageData.driverInfo?.name) {
    errors.push('Driver name is required');
  }
  if (!packageData.driverInfo?.sin) {
    warnings.push('SIN/NAS not provided');
  }
  if (!packageData.driverInfo?.address) {
    warnings.push('Business address not provided');
  }

  // Validate income
  if (!packageData.income || typeof packageData.income !== 'object') {
    errors.push('Income data is required');
  } else {
    const totalIncome = (packageData.income.grossFares || 0) + 
                       (packageData.income.commissions || 0) + 
                       (packageData.income.otherIncome || 0);
    
    if (totalIncome === 0) {
      warnings.push('Total income is zero');
    }

    if (packageData.income.grossFares < 0) {
      errors.push('Gross fares cannot be negative');
    }
  }

  // Validate expenses
  if (!packageData.expenses || typeof packageData.expenses !== 'object') {
    warnings.push('No expense data provided');
  } else {
    const totalExpenses = Object.values(packageData.expenses).reduce((sum, val) => sum + (val || 0), 0);
    
    if (totalExpenses === 0) {
      info.push('No expenses claimed');
    }
  }

  // Validate mileage log
  if (!packageData.trips || packageData.trips.length === 0) {
    warnings.push('No mileage log entries - business use percentage cannot be verified');
  } else {
    const businessPct = calculateBusinessPercentage(packageData.trips);
    if (businessPct < 50) {
      warnings.push(`Business use is only ${businessPct}% - may not qualify as business use`);
    }
    if (businessPct >= 90) {
      info.push(`Business use is ${businessPct}% - qualifies for 100% ITC claim`);
    }
  }

  // Validate receipts
  if (!packageData.receipts || packageData.receipts.length === 0) {
    warnings.push('No receipts stored - CRA may require proof of expenses');
  } else {
    // Check for receipts over $30 without images
    const receiptsOver30 = packageData.receipts.filter(r => r.amount > 30);
    const missingImages = receiptsOver30.filter(r => !r.imageUrl);
    
    if (missingImages.length > 0) {
      warnings.push(`${missingImages.length} receipt(s) over $30 missing images - CRA compliance risk`);
    }
  }

  // Validate vehicle
  if (packageData.vehicle) {
    if (!packageData.vehicle.cost || packageData.vehicle.cost <= 0) {
      errors.push('Vehicle cost must be positive');
    }
    if (packageData.vehicle.businessUsePercentage < 0 || packageData.vehicle.businessUsePercentage > 100) {
      errors.push('Business use percentage must be between 0 and 100');
    }
  }

  // Quebec-specific validation
  if (packageData.isQuebec) {
    info.push('Quebec driver - TP-80-V form required in addition to T2125');
    info.push('Quebec driver - FSS and QPP calculations apply');
  }

  // GST/QST validation
  if (packageData.gstRegistered) {
    info.push('Driver is GST/QST registered - must file GST/QST returns');
  }

  const isValid = errors.length === 0;
  const hasWarnings = warnings.length > 0;

  return {
    isValid,
    hasWarnings,
    errors,
    warnings,
    info,
    completeness: {
      hasDriverInfo: !!packageData.driverInfo?.name,
      hasIncome: !!packageData.income,
      hasExpenses: !!packageData.expenses && Object.values(packageData.expenses).some(v => v > 0),
      hasMileageLog: !!packageData.trips && packageData.trips.length > 0,
      hasReceipts: !!packageData.receipts && packageData.receipts.length > 0,
      hasVehicle: !!packageData.vehicle,
      hasQuebecForms: packageData.isQuebec
    }
  };
}

/**
 * Generate receipt summary by category
 * 
 * @param {Array} receipts - Receipt objects
 * @param {number} year - Tax year
 * @returns {Object} Receipt summary
 */
function generateReceiptSummary(receipts, year) {
  const categories = ['fuel', 'maintenance', 'insurance', 'supplies', 'office', 'telephone', 'advertising', 'other'];
  const summary = {
    year,
    totalReceipts: 0,
    totalAmount: 0,
    byCategory: {}
  };

  // Filter receipts by year
  const yearReceipts = receipts.filter(r => {
    const receiptDate = new Date(r.date);
    return receiptDate.getFullYear() === year;
  });

  summary.totalReceipts = yearReceipts.length;

  // Summarize by category
  categories.forEach(category => {
    const categoryReceipts = yearReceipts.filter(r => r.category === category);
    const categoryTotal = categoryReceipts.reduce((sum, r) => sum + r.amount, 0);
    
    summary.byCategory[category] = {
      count: categoryReceipts.length,
      total: Math.round(categoryTotal * 100) / 100
    };
    
    summary.totalAmount += categoryTotal;
  });

  summary.totalAmount = Math.round(summary.totalAmount * 100) / 100;

  // Check compliance
  const receiptsOver30 = yearReceipts.filter(r => r.amount > 30);
  const missingImages = receiptsOver30.filter(r => !r.imageUrl);

  summary.compliance = {
    receiptsOver30: receiptsOver30.length,
    withImages: receiptsOver30.length - missingImages.length,
    missingImages: missingImages.length,
    compliant: missingImages.length === 0
  };

  return summary;
}

/**
 * Get package summary for quick review
 * 
 * @param {Object} taxPackage - Complete tax package
 * @returns {string} Human-readable summary
 */
export function getPackageSummary(taxPackage) {
  if (!taxPackage || typeof taxPackage !== 'object') {
    throw new Error('Invalid tax package');
  }

  const lines = [];
  
  lines.push('='.repeat(70));
  lines.push('TAX PACKAGE SUMMARY');
  lines.push('='.repeat(70));
  lines.push(`Fiscal Year: ${taxPackage.fiscalYear}`);
  lines.push(`Province: ${taxPackage.province}`);
  lines.push(`Generated: ${new Date(taxPackage.generatedDate).toLocaleDateString()}`);
  lines.push('');
  
  lines.push('FINANCIAL SUMMARY:');
  lines.push(`  Total Income:    $${taxPackage.summary.totalIncome.toFixed(2)}`);
  lines.push(`  Total Expenses:  $${taxPackage.summary.totalExpenses.toFixed(2)}`);
  lines.push(`  Net Income:      $${taxPackage.summary.netIncome.toFixed(2)}`);
  
  if (taxPackage.summary.businessUsePercentage) {
    lines.push(`  Business Use:    ${taxPackage.summary.businessUsePercentage}%`);
  }
  
  if (taxPackage.summary.cca) {
    lines.push(`  CCA Claimed:     $${taxPackage.summary.cca.toFixed(2)}`);
  }
  
  if (taxPackage.summary.fss) {
    lines.push(`  FSS (Quebec):    $${taxPackage.summary.fss.toFixed(2)}`);
  }
  
  if (taxPackage.summary.qpp) {
    lines.push(`  QPP (Quebec):    $${taxPackage.summary.qpp.toFixed(2)}`);
  }
  
  lines.push('');
  lines.push('FORMS INCLUDED:');
  lines.push(`  ✓ T2125 (Federal Business Statement)`);
  
  if (taxPackage.forms.tp80v) {
    lines.push(`  ✓ TP-80-V (Quebec Business Statement)`);
  }
  
  if (taxPackage.schedules.cca) {
    lines.push(`  ✓ CCA Schedule (Vehicle Depreciation)`);
  }
  
  if (taxPackage.schedules.mileage) {
    lines.push(`  ✓ Mileage Log Summary (${taxPackage.schedules.mileage.totalTrips} trips)`);
  }
  
  if (taxPackage.schedules.receipts) {
    lines.push(`  ✓ Receipt Summary (${taxPackage.schedules.receipts.totalReceipts} receipts)`);
  }
  
  if (taxPackage.schedules.gstQst) {
    lines.push(`  ✓ GST/QST Analysis`);
  }
  
  lines.push('');
  lines.push('VALIDATION STATUS:');
  
  if (taxPackage.validation.isValid) {
    lines.push(`  ✓ Package is valid`);
  } else {
    lines.push(`  ✗ Package has errors (${taxPackage.validation.errors.length})`);
  }
  
  if (taxPackage.validation.hasWarnings) {
    lines.push(`  ⚠ Warnings: ${taxPackage.validation.warnings.length}`);
  }
  
  if (taxPackage.validation.errors.length > 0) {
    lines.push('');
    lines.push('ERRORS:');
    taxPackage.validation.errors.forEach(err => {
      lines.push(`  - ${err}`);
    });
  }
  
  if (taxPackage.validation.warnings.length > 0) {
    lines.push('');
    lines.push('WARNINGS:');
    taxPackage.validation.warnings.forEach(warn => {
      lines.push(`  - ${warn}`);
    });
  }
  
  lines.push('');
  lines.push('='.repeat(70));
  
  return lines.join('\n');
}
