/**
 * Receipt Storage Module
 * CRA-compliant receipt management system with 6-year retention
 * @module receipt-storage
 */

/**
 * Valid receipt categories as per CRA requirements
 */
const VALID_CATEGORIES = [
  'fuel',
  'maintenance',
  'insurance',
  'supplies',
  'office',
  'telephone',
  'advertising',
  'other'
];

/**
 * CRA retention period in years
 */
const RETENTION_PERIOD_YEARS = 6;

/**
 * CRA $30 threshold for receipt requirements
 */
const RECEIPT_THRESHOLD = 30;

/**
 * In-memory receipt storage
 */
let receipts = [];

/**
 * Receipt ID counter
 */
let receiptIdCounter = 1;

/**
 * Validates receipt data
 * @param {Object} receipt - Receipt object to validate
 * @returns {Object} Validation result with isValid and errors array
 */
export function validateReceipt(receipt) {
  const errors = [];

  if (!receipt) {
    return { isValid: false, errors: ['Receipt object is required'] };
  }

  // Validate date
  if (!receipt.date) {
    errors.push('Date is required');
  } else {
    const date = new Date(receipt.date);
    if (isNaN(date.getTime())) {
      errors.push('Invalid date format');
    }
  }

  // Validate amount
  if (receipt.amount === undefined || receipt.amount === null) {
    errors.push('Amount is required');
  } else if (typeof receipt.amount !== 'number') {
    errors.push('Amount must be a number');
  } else if (receipt.amount < 0) {
    errors.push('Amount must be non-negative');
  }

  // Validate vendor
  if (!receipt.vendor) {
    errors.push('Vendor is required');
  } else if (typeof receipt.vendor !== 'string') {
    errors.push('Vendor must be a string');
  } else if (receipt.vendor.trim().length === 0) {
    errors.push('Vendor cannot be empty');
  }

  // Validate category
  if (!receipt.category) {
    errors.push('Category is required');
  } else if (!VALID_CATEGORIES.includes(receipt.category)) {
    errors.push(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }

  // Validate imageUrl (optional)
  if (receipt.imageUrl !== undefined && receipt.imageUrl !== null) {
    if (typeof receipt.imageUrl !== 'string') {
      errors.push('Image URL must be a string');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Adds a receipt to storage with validation
 * @param {string|Date} date - Receipt date
 * @param {number} amount - Receipt amount
 * @param {string} vendor - Vendor name
 * @param {string} category - Receipt category
 * @param {string} [imageUrl] - Optional image URL
 * @returns {Object} Added receipt with ID and metadata
 * @throws {Error} If validation fails
 */
export function addReceipt(date, amount, vendor, category, imageUrl = null) {
  const receipt = {
    date,
    amount: typeof amount === 'number' ? parseFloat(amount.toFixed(2)) : amount,
    vendor,
    category,
    imageUrl
  };

  const validation = validateReceipt(receipt);
  if (!validation.isValid) {
    throw new Error(`Invalid receipt: ${validation.errors.join(', ')}`);
  }

  const storedReceipt = {
    id: receiptIdCounter++,
    date: new Date(date),
    amount: parseFloat(amount.toFixed(2)),
    vendor: vendor.trim(),
    category,
    imageUrl,
    createdAt: new Date(),
    meetsThreshold: amount > RECEIPT_THRESHOLD
  };

  receipts.push(storedReceipt);
  return storedReceipt;
}

/**
 * Gets receipts by category and optional year
 * @param {string} category - Category to filter by
 * @param {number} [year] - Optional year to filter by
 * @returns {Array} Filtered receipts
 * @throws {Error} If category is invalid
 */
export function getReceiptsByCategory(category, year = null) {
  if (!VALID_CATEGORIES.includes(category)) {
    throw new Error(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }

  let filtered = receipts.filter(r => r.category === category);

  if (year !== null) {
    if (typeof year !== 'number' || year < 1900 || year > 2100) {
      throw new Error('Invalid year');
    }
    filtered = filtered.filter(r => r.date.getFullYear() === year);
  }

  return filtered;
}

/**
 * Gets receipts by year
 * @param {number} year - Year to filter by
 * @returns {Array} Receipts from specified year
 * @throws {Error} If year is invalid
 */
export function getReceiptsByYear(year) {
  if (typeof year !== 'number' || year < 1900 || year > 2100) {
    throw new Error('Invalid year');
  }

  return receipts.filter(r => r.date.getFullYear() === year);
}

/**
 * Gets total amount by category and optional year
 * @param {string} category - Category to sum
 * @param {number} [year] - Optional year to filter by
 * @returns {number} Total amount for category/year
 */
export function getTotalByCategory(category, year = null) {
  const categoryReceipts = getReceiptsByCategory(category, year);
  const total = categoryReceipts.reduce((sum, receipt) => sum + receipt.amount, 0);
  return parseFloat(total.toFixed(2));
}

/**
 * Checks if receipts meet CRA $30 rule requirements
 * For expenses over $30, a receipt is required
 * @param {Array} receipts - Receipts to check
 * @returns {Object} Compliance status and details
 */
export function checkThirtyDollarRule(receipts) {
  if (!Array.isArray(receipts)) {
    throw new Error('Receipts must be an array');
  }

  const receiptsOverThreshold = receipts.filter(r => r.amount > RECEIPT_THRESHOLD);
  const receiptsWithImages = receiptsOverThreshold.filter(r => r.imageUrl);
  const receiptsWithoutImages = receiptsOverThreshold.filter(r => !r.imageUrl);

  const compliant = receiptsWithoutImages.length === 0;

  return {
    compliant,
    totalReceipts: receipts.length,
    receiptsOverThreshold: receiptsOverThreshold.length,
    receiptsWithImages: receiptsWithImages.length,
    receiptsWithoutImages: receiptsWithoutImages.length,
    missingReceipts: receiptsWithoutImages.map(r => ({
      id: r.id,
      date: r.date,
      amount: r.amount,
      vendor: r.vendor,
      category: r.category
    })),
    threshold: RECEIPT_THRESHOLD
  };
}

/**
 * Exports audit trail for CRA compliance
 * Includes 6-year retention period validation
 * @param {number} year - Year to generate audit trail for
 * @returns {Object} Audit trail report
 */
export function exportAuditTrail(year) {
  if (typeof year !== 'number' || year < 1900 || year > 2100) {
    throw new Error('Invalid year');
  }

  const currentYear = new Date().getFullYear();
  const yearsRetained = currentYear - year;
  const withinRetentionPeriod = yearsRetained < RETENTION_PERIOD_YEARS;

  const yearReceipts = getReceiptsByYear(year);

  // Group by category
  const byCategory = {};
  VALID_CATEGORIES.forEach(cat => {
    byCategory[cat] = yearReceipts.filter(r => r.category === cat);
  });

  // Calculate totals
  const categoryTotals = {};
  VALID_CATEGORIES.forEach(cat => {
    const total = byCategory[cat].reduce((sum, r) => sum + r.amount, 0);
    categoryTotals[cat] = parseFloat(total.toFixed(2));
  });

  const grandTotal = parseFloat(
    Object.values(categoryTotals).reduce((sum, val) => sum + val, 0).toFixed(2)
  );

  // Check compliance
  const compliance = checkThirtyDollarRule(yearReceipts);

  return {
    year,
    generatedAt: new Date(),
    retentionStatus: {
      withinRetentionPeriod,
      yearsRetained,
      retentionPeriodYears: RETENTION_PERIOD_YEARS,
      expiryYear: year + RETENTION_PERIOD_YEARS
    },
    summary: {
      totalReceipts: yearReceipts.length,
      totalAmount: grandTotal,
      categoryTotals
    },
    compliance: {
      meetsThirtyDollarRule: compliance.compliant,
      receiptsOverThreshold: compliance.receiptsOverThreshold,
      receiptsWithImages: compliance.receiptsWithImages,
      missingReceipts: compliance.missingReceipts
    },
    receipts: yearReceipts.map(r => ({
      id: r.id,
      date: r.date.toISOString(),
      amount: r.amount,
      vendor: r.vendor,
      category: r.category,
      imageUrl: r.imageUrl,
      meetsThreshold: r.meetsThreshold
    })),
    byCategory
  };
}

/**
 * Clears all receipts (for testing purposes)
 */
export function clearReceipts() {
  receipts = [];
  receiptIdCounter = 1;
}

/**
 * Gets all receipts
 * @returns {Array} All stored receipts
 */
export function getAllReceipts() {
  return [...receipts];
}

/**
 * Gets valid categories
 * @returns {Array} Valid receipt categories
 */
export function getValidCategories() {
  return [...VALID_CATEGORIES];
}

/**
 * Gets retention period
 * @returns {number} Retention period in years
 */
export function getRetentionPeriod() {
  return RETENTION_PERIOD_YEARS;
}

/**
 * Gets receipt threshold
 * @returns {number} Receipt threshold amount
 */
export function getReceiptThreshold() {
  return RECEIPT_THRESHOLD;
}
