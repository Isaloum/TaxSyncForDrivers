// pattern-library.js — Document type patterns and field extractors for tax processing
// Supports T4, T4A, RL-1, RL-2, Uber/Lyft summaries, and various expense receipts

export const DOCUMENT_TYPES = {
  T4: 'T4',
  T4A: 'T4A',
  RL1: 'RL-1',
  RL2: 'RL-2',
  UBER_SUMMARY: 'UBER_SUMMARY',
  LYFT_SUMMARY: 'LYFT_SUMMARY',
  TAXI_STATEMENT: 'TAXI_STATEMENT',
  GAS_RECEIPT: 'GAS_RECEIPT',
  MAINTENANCE_RECEIPT: 'MAINTENANCE_RECEIPT',
  INSURANCE_DOC: 'INSURANCE_DOC',
  PARKING_RECEIPT: 'PARKING_RECEIPT',
  PHONE_BILL: 'PHONE_BILL',
  MEAL_RECEIPT: 'MEAL_RECEIPT',
  UNKNOWN: 'UNKNOWN',
};

// T4 Pattern Extractors (Canadian Employment Income)
export const T4_PATTERNS = {
  employmentIncome: /(?:Box|Case)\s+14[:\s]*([\d,]+\.?\d*)/i,
  incomeTax: /(?:Box|Case)\s+22[:\s]*([\d,]+\.?\d*)/i,
  cpp: /(?:Box|Case)\s+16[:\s]*([\d,]+\.?\d*)/i,
  ei: /(?:Box|Case)\s+18[:\s]*([\d,]+\.?\d*)/i,
  qpp: /(?:Box|Case)\s+17[:\s]*([\d,]+\.?\d*)/i,
  ppip: /(?:Box|Case)\s+55[:\s]*([\d,]+\.?\d*)/i,
  unionDues: /(?:Box|Case)\s+44[:\s]*([\d,]+\.?\d*)/i,
  employerName: /(?:Employer|Employeur)[:\s]*([A-Za-z0-9\s&.-]+?)(?:\n|Box|Case)/i,
  year: /(?:Year|Année|Tax Year)[:\s]*(\d{4})/i,
};

// T4A Pattern Extractors (Other Income)
export const T4A_PATTERNS = {
  pension: /(?:Box|Case)\s+16[:\s]*([\d,]+\.?\d*)/i,
  lumpSum: /(?:Box|Case)\s+18[:\s]*([\d,]+\.?\d*)/i,
  selfEmployment: /(?:Box|Case)\s+20[:\s]*([\d,]+\.?\d*)/i,
  incomeTax: /(?:Box|Case)\s+22[:\s]*([\d,]+\.?\d*)/i,
  year: /(?:Year|Année|Tax Year)[:\s]*(\d{4})/i,
};

// RL-1 Pattern Extractors (Quebec Employment)
export const RL1_PATTERNS = {
  employmentIncome: /(?:Box|Case)\s+A[:\s]*([\d,]+\.?\d*)/i,
  qpp: /(?:Box|Case)\s+B\.A[:\s]*([\d,]+\.?\d*)/i,
  ei: /(?:Box|Case)\s+C[:\s]*([\d,]+\.?\d*)/i,
  ppip: /(?:Box|Case)\s+H[:\s]*([\d,]+\.?\d*)/i,
  incomeTax: /(?:Box|Case)\s+E[:\s]*([\d,]+\.?\d*)/i,
  unionDues: /(?:Box|Case)\s+F[:\s]*([\d,]+\.?\d*)/i,
  employerName: /(?:Employer|Employeur)[:\s]*([A-Za-z0-9\s&.-]+?)(?:\n|Box|Case)/i,
  year: /(?:Year|Année)[:\s]*(\d{4})/i,
};

// RL-2 Pattern Extractors (Quebec Benefits)
export const RL2_PATTERNS = {
  qpp: /(?:Box|Case)\s+A[:\s]*([\d,]+\.?\d*)/i,
  oldAgeSecurity: /(?:Box|Case)\s+C[:\s]*([\d,]+\.?\d*)/i,
  incomeTax: /(?:Box|Case)\s+D[:\s]*([\d,]+\.?\d*)/i,
  year: /(?:Year|Année)[:\s]*(\d{4})/i,
};

// Uber Summary Pattern Extractors
export const UBER_PATTERNS = {
  grossFares: /(?:Gross\s+Fares?|Total\s+Fares?|Revenue)[:\s]*\$?\s*([\d,]+\.?\d*)/i,
  tips: /Tips[:\s]*\$?\s*([\d,]+\.?\d*)/i,
  tolls: /Tolls?[:\s]*\$?\s*([\d,]+\.?\d*)/i,
  distance:
    /(?:Total\s+)?(?:Distance|Kilometers?|Kilometres?)[:\s]*([\d,]+\.?\d*)\s*(?:km|kilometers?|kilometres?)?/i,
  trips: /(?:Total\s+)?Trips?[:\s]*(\d+)/i,
  serviceFees: /(?:Service\s+Fee|Uber\s+Fee)[:\s]*\$?\s*([\d,]+\.?\d*)/i,
  netEarnings: /(?:Net\s+Earnings?|Total\s+Payout)[:\s]*\$?\s*([\d,]+\.?\d*)/i,
  period: /(?:Week|Period)[:\s]*([A-Za-z]+\s+\d+\s*-\s*[A-Za-z]+\s+\d+,?\s*\d{4})/i,
  startDate: /(?:From|Start)[:\s]*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
  endDate: /(?:To|End)[:\s]*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
};

// Lyft Summary Pattern Extractors
export const LYFT_PATTERNS = {
  grossFares:
    /(?:Gross\s+Earnings?|Driver\s+Earnings?|Total\s+Earnings?)[:\s]*\$?\s*([\d,]+\.?\d*)/i,
  tips: /Tips[:\s]*\$?\s*([\d,]+\.?\d*)/i,
  distance: /(?:Total\s+)?(?:Miles?|Distance)[:\s]*([\d,]+\.?\d*)\s*(?:mi|miles?)?/i,
  rides: /(?:Total\s+)?Rides?[:\s]*(\d+)/i,
  platformFees: /(?:Platform\s+Fee|Lyft\s+Fee)[:\s]*\$?\s*([\d,]+\.?\d*)/i,
  netEarnings: /(?:Net\s+Earnings?|Total\s+Payout)[:\s]*\$?\s*([\d,]+\.?\d*)/i,
  period: /(?:Week|Period)[:\s]*([A-Za-z]+\s+\d+\s*-\s*[A-Za-z]+\s+\d+,?\s*\d{4})/i,
};

// Taxi Statement Pattern Extractors
export const TAXI_PATTERNS = {
  grossIncome: /(?:Gross\s+Income|Total\s+Fares?|Revenue)[:\s]*\$?\s*([\d,]+\.?\d*)/i,
  tips: /Tips[:\s]*\$?\s*([\d,]+\.?\d*)/i,
  dispatchFees: /(?:Dispatch\s+Fee|Commission)[:\s]*\$?\s*([\d,]+\.?\d*)/i,
  netIncome: /(?:Net\s+Income|Take\s+Home)[:\s]*\$?\s*([\d,]+\.?\d*)/i,
  period: /(?:Period|Month)[:\s]*([A-Za-z]+\s+\d{4})/i,
};

// Gas Receipt Pattern Extractors
export const GAS_RECEIPT_PATTERNS = {
  total: /(?:Total|Amount)[:\s]*\$?\s*([\d,]+\.?\d*)/i,
  liters: /(?:Liters?|Litres?|L)[:\s]*([\d,]+\.?\d*)/i,
  pricePerLiter: /(?:Price\s+per\s+L|PPL)[:\s]*\$?\s*([\d,]+\.?\d*)/i,
  date: /(?:Date)[:\s]*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
  vendor: /^([A-Za-z0-9\s&'-]+?)(?:\n|Date|Total)/im,
  station: /(?:Shell|Esso|Petro-Canada|Canadian Tire Gas|Ultramar|Costco|Irving)/i,
};

// Maintenance Receipt Pattern Extractors
export const MAINTENANCE_RECEIPT_PATTERNS = {
  total: /(?:Total|Amount|Grand\s+Total)[:\s]*\$?\s*([\d,]+\.?\d*)/i,
  subtotal: /(?:Subtotal|Sub-Total)[:\s]*\$?\s*([\d,]+\.?\d*)/i,
  tax: /(?:Tax|GST|QST|HST)[:\s]*\$?\s*([\d,]+\.?\d*)/i,
  labor: /(?:Labor|Labour)[:\s]*\$?\s*([\d,]+\.?\d*)/i,
  parts: /(?:Parts)[:\s]*\$?\s*([\d,]+\.?\d*)/i,
  date: /(?:Date)[:\s]*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
  vendor: /^([A-Za-z0-9\s&'-]+?)(?:\n|Date|Invoice)/im,
  serviceType: /(?:Oil\s+Change|Tire\s+Rotation|Brake|Inspection|Repair)/i,
};

// Insurance Document Pattern Extractors
export const INSURANCE_PATTERNS = {
  premium: /(?:Premium|Annual\s+Premium|Total\s+Premium)[:\s]*\$?\s*([\d,]+\.?\d*)/i,
  policyNumber: /(?:Policy\s+Number|Policy\s+#)[:\s]*([\w-]+)/i,
  effectiveDate: /(?:Effective\s+Date|Start\s+Date)[:\s]*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
  expiryDate: /(?:Expiry\s+Date|End\s+Date)[:\s]*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
  insurer: /(?:Insurer|Company)[:\s]*([A-Za-z0-9\s&'-]+?)(?:\n|Policy)/i,
};

// Parking/Toll Receipt Pattern Extractors
export const PARKING_TOLL_PATTERNS = {
  amount: /(?:Amount|Total)[:\s]*\$?\s*([\d,]+\.?\d*)/i,
  date: /(?:Date)[:\s]*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
  location: /(?:Location|Zone)[:\s]*([A-Za-z0-9\s,-]+?)(?:\n|Date|Amount)/i,
  duration: /(?:Duration|Hours?)[:\s]*([\d.]+)\s*(?:hours?|hrs?|h)?/i,
};

// Phone Bill Pattern Extractors
export const PHONE_BILL_PATTERNS = {
  total: /(?:Total|Amount\s+Due|Balance\s+Due)[:\s]*\$?\s*([\d,]+\.?\d*)/i,
  planCost: /(?:Plan|Monthly\s+Plan)[:\s]*\$?\s*([\d,]+\.?\d*)/i,
  data: /(?:Data\s+Usage)[:\s]*([\d.]+)\s*(?:GB|MB)?/i,
  billingPeriod: /(?:Billing\s+Period)[:\s]*([A-Za-z]+\s+\d+\s*-\s*[A-Za-z]+\s+\d+,?\s*\d{4})/i,
  accountNumber: /(?:Account\s+Number|Account\s+#)[:\s]*([\w-]+)/i,
};

// Meal Receipt Pattern Extractors
export const MEAL_RECEIPT_PATTERNS = {
  total: /(?:Total|Amount)[:\s]*\$?\s*([\d,]+\.?\d*)/i,
  subtotal: /(?:Subtotal|Sub-Total)[:\s]*\$?\s*([\d,]+\.?\d*)/i,
  tip: /(?:Tip|Gratuity)[:\s]*\$?\s*([\d,]+\.?\d*)/i,
  tax: /(?:Tax|GST|QST|HST)[:\s]*\$?\s*([\d,]+\.?\d*)/i,
  date: /(?:Date)[:\s]*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
  restaurant: /^([A-Za-z0-9\s&'-]+?)(?:\n|Date|Total)/im,
};

// Document classification patterns
export const CLASSIFICATION_PATTERNS = {
  T4: /(?:T4|Statement\s+of\s+Remuneration).*(?:Box\s+14|Employment\s+Income)/is,
  T4A: /(?:T4A|Statement\s+of\s+Pension).*(?:Box\s+16|Box\s+18)/is,
  RL1: /(?:RL-1|Relevé\s+1).*(?:Case\s+A|Box\s+A)/is,
  RL2: /(?:RL-2|Relevé\s+2).*(?:Case\s+A|Pension)/is,
  UBER_SUMMARY: /(?:Uber|uber\.com).*(?:Gross\s+Fares?|Weekly\s+Summary|Driver\s+Summary)/is,
  LYFT_SUMMARY: /(?:Lyft|lyft\.com).*(?:Driver\s+Earnings?|Weekly\s+Summary)/is,
  TAXI_STATEMENT: /(?:Taxi|Cab|Dispatch).*(?:Gross\s+Income|Commission)/is,
  GAS_RECEIPT: /(?:Shell|Esso|Petro-Canada|Gas|Fuel|Gasoline).*(?:Liters?|Litres?)/is,
  MAINTENANCE_RECEIPT: /(?:Oil\s+Change|Tire|Brake|Repair|Service).*(?:Labor|Parts)/is,
  INSURANCE_DOC: /(?:Insurance|Policy).*(?:Premium|Coverage|Effective\s+Date)/is,
  PARKING_RECEIPT: /(?:Parking|Park).*(?:Duration|Zone)/is,
  PHONE_BILL:
    /(?:Wireless|Mobile|Cell|Phone|Rogers|Bell|Telus|Fido).*(?:Billing\s+Period|Data\s+Usage)/is,
  MEAL_RECEIPT: /(?:Restaurant|Café|Coffee|Food|Tim\s+Hortons|McDonald's).*(?:Subtotal|Tip)/is,
};

/**
 * Extract a value using a regex pattern
 * @param {string} text - The text to extract from
 * @param {RegExp} pattern - The regex pattern to use
 * @returns {string|number|null} - The extracted value or null
 */
export function extractValue(text, pattern) {
  const match = text.match(pattern);
  if (!match || !match[1]) return null;

  const value = match[1].trim();

  // Check if it looks like a date (don't parse as number)
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(value) || /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  // Try to parse as number
  const numValue = parseFloat(value.replace(/,/g, ''));
  if (!isNaN(numValue)) {
    return Math.round(numValue * 100) / 100; // Round to 2 decimals
  }

  return value;
}

/**
 * Extract all fields for a given document type
 * @param {string} text - The text to extract from
 * @param {string} docType - The document type
 * @returns {object} - Extracted fields
 */
export function extractFields(text, docType) {
  const clean = text.replace(/\s+/g, ' ').trim();
  let patterns;

  switch (docType) {
    case DOCUMENT_TYPES.T4:
      patterns = T4_PATTERNS;
      break;
    case DOCUMENT_TYPES.T4A:
      patterns = T4A_PATTERNS;
      break;
    case DOCUMENT_TYPES.RL1:
      patterns = RL1_PATTERNS;
      break;
    case DOCUMENT_TYPES.RL2:
      patterns = RL2_PATTERNS;
      break;
    case DOCUMENT_TYPES.UBER_SUMMARY:
      patterns = UBER_PATTERNS;
      break;
    case DOCUMENT_TYPES.LYFT_SUMMARY:
      patterns = LYFT_PATTERNS;
      break;
    case DOCUMENT_TYPES.TAXI_STATEMENT:
      patterns = TAXI_PATTERNS;
      break;
    case DOCUMENT_TYPES.GAS_RECEIPT:
      patterns = GAS_RECEIPT_PATTERNS;
      break;
    case DOCUMENT_TYPES.MAINTENANCE_RECEIPT:
      patterns = MAINTENANCE_RECEIPT_PATTERNS;
      break;
    case DOCUMENT_TYPES.INSURANCE_DOC:
      patterns = INSURANCE_PATTERNS;
      break;
    case DOCUMENT_TYPES.PARKING_RECEIPT:
      patterns = PARKING_TOLL_PATTERNS;
      break;
    case DOCUMENT_TYPES.PHONE_BILL:
      patterns = PHONE_BILL_PATTERNS;
      break;
    case DOCUMENT_TYPES.MEAL_RECEIPT:
      patterns = MEAL_RECEIPT_PATTERNS;
      break;
    default:
      return {};
  }

  const result = {};
  for (const [field, pattern] of Object.entries(patterns)) {
    const value = extractValue(clean, pattern);
    if (value !== null) {
      result[field] = value;
    }
  }

  return result;
}

/**
 * Classify a document based on its content with confidence scoring
 * @param {string} text - The text to classify
 * @param {string} filename - Optional filename for additional hints
 * @returns {string} - The document type
 */
export function classifyDocument(text, filename = '') {
  const clean = text.replace(/\s+/g, ' ').trim();

  // Enhanced classification with confidence scoring
  const documentPatterns = {
    T4: {
      keywords: ['t4', 'statement of remuneration', 'employment income', 'box 14'],
      patterns: [/(?:T4|Statement\s+of\s+Remuneration)/i, /Box\s+14/i, /Employment\s+Income/i],
      confidence: 0,
    },
    RL1: {
      keywords: ['rl-1', 'rl1', 'relevé 1', "revenu d'emploi", 'case a'],
      patterns: [/(?:RL-1|Relevé\s+1)/i, /Case\s+A/i, /Revenu.*emploi/i],
      confidence: 0,
    },
    UBER_SUMMARY: {
      keywords: ['uber', 'driver partner', 'weekly summary', 'trip earnings', 'gross fare'],
      patterns: [/uber.*partner/i, /weekly.*summary/i, /gross.*fare/i, /uber\.com/i],
      confidence: 0,
    },
    LYFT_SUMMARY: {
      keywords: ['lyft', 'weekly summary', 'driver dashboard', 'ride earnings'],
      patterns: [/lyft.*driver/i, /weekly.*earning/i, /total.*payout/i, /lyft\.com/i],
      confidence: 0,
    },
    GAS_RECEIPT: {
      keywords: ['shell', 'esso', 'petro', 'gas', 'fuel', 'gasoline', 'liters', 'litres'],
      patterns: [/(shell|esso|petro-canada|ultramar)/i, /fuel|gas/i, /liters?|litres?/i],
      confidence: 0,
    },
    MAINTENANCE_RECEIPT: {
      keywords: ['oil change', 'tire', 'brake', 'service', 'repair', 'maintenance'],
      patterns: [/oil.*change/i, /tire.*service/i, /brake.*repair/i, /labor|labour/i],
      confidence: 0,
    },
  };

  // Calculate confidence scores for each document type
  for (const [type, config] of Object.entries(documentPatterns)) {
    let score = 0;

    // Keyword matching (1 point each)
    for (const keyword of config.keywords) {
      if (clean.toLowerCase().includes(keyword.toLowerCase())) {
        score += 1;
      }
    }

    // Pattern matching (2 points each)
    for (const pattern of config.patterns) {
      if (pattern.test(clean)) {
        score += 2;
      }
    }

    // Filename matching (1 point)
    if (filename.toLowerCase().includes(type.toLowerCase().replace('_', ''))) {
      score += 1;
    }

    documentPatterns[type].confidence = score;
  }

  // Find highest confidence document type
  let maxConfidence = 0;
  let bestType = DOCUMENT_TYPES.UNKNOWN;

  for (const [type, config] of Object.entries(documentPatterns)) {
    if (config.confidence > maxConfidence) {
      maxConfidence = config.confidence;
      bestType = DOCUMENT_TYPES[type];
    }
  }

  // Require minimum confidence threshold of 2
  if (maxConfidence < 2) {
    // Fall back to original simple pattern matching
    for (const [type, pattern] of Object.entries(CLASSIFICATION_PATTERNS)) {
      if (pattern.test(clean)) {
        return DOCUMENT_TYPES[type];
      }
    }
    return DOCUMENT_TYPES.UNKNOWN;
  }

  return bestType;
}

/**
 * Classify document with confidence score returned
 * @param {string} text - The text to classify
 * @param {string} filename - Optional filename
 * @returns {object} - Classification result with confidence
 */
export function classifyDocumentWithConfidence(text, filename = '') {
  const clean = text.replace(/\s+/g, ' ').trim();

  const documentPatterns = {
    T4: {
      keywords: ['t4', 'statement of remuneration', 'employment income', 'box 14'],
      patterns: [/(?:T4|Statement\s+of\s+Remuneration)/i, /Box\s+14/i, /Employment\s+Income/i],
      confidence: 0,
    },
    RL1: {
      keywords: ['rl-1', 'rl1', 'relevé 1', "revenu d'emploi", 'case a'],
      patterns: [/(?:RL-1|Relevé\s+1)/i, /Case\s+A/i, /Revenu.*emploi/i],
      confidence: 0,
    },
    UBER_SUMMARY: {
      keywords: ['uber', 'driver partner', 'weekly summary', 'trip earnings', 'gross fare'],
      patterns: [/uber.*partner/i, /weekly.*summary/i, /gross.*fare/i, /uber\.com/i],
      confidence: 0,
    },
    LYFT_SUMMARY: {
      keywords: ['lyft', 'weekly summary', 'driver dashboard', 'ride earnings'],
      patterns: [/lyft.*driver/i, /weekly.*earning/i, /total.*payout/i, /lyft\.com/i],
      confidence: 0,
    },
    GAS_RECEIPT: {
      keywords: ['shell', 'esso', 'petro', 'gas', 'fuel', 'gasoline', 'liters', 'litres'],
      patterns: [/(shell|esso|petro-canada|ultramar)/i, /fuel|gas/i, /liters?|litres?/i],
      confidence: 0,
    },
    MAINTENANCE_RECEIPT: {
      keywords: ['oil change', 'tire', 'brake', 'service', 'repair', 'maintenance'],
      patterns: [/oil.*change/i, /tire.*service/i, /brake.*repair/i, /labor|labour/i],
      confidence: 0,
    },
  };

  // Calculate confidence scores
  for (const [type, config] of Object.entries(documentPatterns)) {
    let score = 0;

    for (const keyword of config.keywords) {
      if (clean.toLowerCase().includes(keyword.toLowerCase())) {
        score += 1;
      }
    }

    for (const pattern of config.patterns) {
      if (pattern.test(clean)) {
        score += 2;
      }
    }

    if (filename.toLowerCase().includes(type.toLowerCase().replace('_', ''))) {
      score += 1;
    }

    documentPatterns[type].confidence = score;
  }

  // Find best match
  let maxConfidence = 0;
  let bestType = DOCUMENT_TYPES.UNKNOWN;

  for (const [type, config] of Object.entries(documentPatterns)) {
    if (config.confidence > maxConfidence) {
      maxConfidence = config.confidence;
      bestType = DOCUMENT_TYPES[type];
    }
  }

  // Fall back to simple matching if low confidence
  if (maxConfidence < 2) {
    for (const [type, pattern] of Object.entries(CLASSIFICATION_PATTERNS)) {
      if (pattern.test(clean)) {
        return {
          documentType: DOCUMENT_TYPES[type],
          confidence: 50,
          scores: documentPatterns,
        };
      }
    }
  }

  // Convert score to percentage (max realistic score is ~10)
  const confidencePercent = Math.min(100, Math.round((maxConfidence / 10) * 100));

  return {
    documentType: bestType,
    confidence: confidencePercent,
    scores: documentPatterns,
  };
}
