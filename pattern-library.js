// pattern-library.js — Document type patterns and field extractors for tax processing
// Supports T4, T4A, RL-1, RL-2, Uber/Lyft summaries, and various expense receipts

export const DOCUMENT_TYPES = {
  T4: 'T4',
  T4A: 'T4A',
  T5: 'T5',
  T3: 'T3',
  T5008: 'T5008',
  T2202: 'T2202',
  RL1: 'RL-1',
  RL2: 'RL-2',
  UBER_SUMMARY: 'UBER_SUMMARY',
  LYFT_SUMMARY: 'LYFT_SUMMARY',
  TAXI_STATEMENT: 'TAXI_STATEMENT',
  GAS_RECEIPT: 'GAS_RECEIPT',
  MAINTENANCE_RECEIPT: 'MAINTENANCE_RECEIPT',
  INSURANCE_DOC: 'INSURANCE_DOC',
  INSURANCE_RECEIPT: 'INSURANCE_RECEIPT',
  VEHICLE_REGISTRATION: 'VEHICLE_REGISTRATION',
  PARKING_RECEIPT: 'PARKING_RECEIPT',
  PHONE_BILL: 'PHONE_BILL',
  MEAL_RECEIPT: 'MEAL_RECEIPT',
  BUSINESS_RECEIPT: 'BUSINESS_RECEIPT',
  MEDICAL_RECEIPT: 'MEDICAL_RECEIPT',
  PHARMACY_RECEIPT: 'PHARMACY_RECEIPT',
  DENTAL_RECEIPT: 'DENTAL_RECEIPT',
  OPTICAL_RECEIPT: 'OPTICAL_RECEIPT',
  CHARITABLE_RECEIPT: 'CHARITABLE_RECEIPT',
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

// T5 Pattern Extractors (Investment Income)
export const T5_PATTERNS = {
  // Box 13 - Interest from Canadian sources
  interestIncome: /(?:Box|Case)\s+13[:\s]*(?:CA)?\$?\s*([0-9,]+\.?\d{0,2})/i,
  
  // Box 24 - Eligible dividends (from Canadian public corporations)
  eligibleDividends: /(?:Box|Case)\s+24[:\s]*(?:CA)?\$?\s*([0-9,]+\.?\d{0,2})/i,
  
  // Box 25 - Taxable amount of eligible dividends (grossed up)
  eligibleDividendsGrossUp: /(?:Box|Case)\s+25[:\s]*(?:CA)?\$?\s*([0-9,]+\.?\d{0,2})/i,
  
  // Box 10 - Other than eligible dividends (small business)
  otherDividends: /(?:Box|Case)\s+10[:\s]*(?:CA)?\$?\s*([0-9,]+\.?\d{0,2})/i,
  
  // Box 11 - Taxable amount of other dividends (grossed up)
  otherDividendsGrossUp: /(?:Box|Case)\s+11[:\s]*(?:CA)?\$?\s*([0-9,]+\.?\d{0,2})/i,
  
  // Box 14 - Capital gains dividends
  capitalGainsDividends: /(?:Box|Case)\s+14[:\s]*(?:CA)?\$?\s*([0-9,]+\.?\d{0,2})/i,
  
  // Box 18 - Foreign income
  foreignIncome: /(?:Box|Case)\s+18[:\s]*(?:CA)?\$?\s*([0-9,]+\.?\d{0,2})/i,
  
  // Box 19 - Foreign tax paid
  foreignTaxPaid: /(?:Box|Case)\s+19[:\s]*(?:CA)?\$?\s*([0-9,]+\.?\d{0,2})/i,
  
  // Payer information
  payerName: /(?:Payer|Investment Company|Financial Institution)[:\s]*([A-Za-z0-9\s&.,'-]+?)(?:\n|Box|Case|Account)/i,
  accountNumber: /(?:Account|Compte)[:\s#]*(\d{4,12})/i,
  
  // Tax year
  year: /(?:Tax Year|Année d'imposition|Year|Année)[:\s]*(\d{4})/i,
};

// T3 Pattern Extractors (Trust Income - RRSP/RRIF distributions)
export const T3_PATTERNS = {
  // Box 21 - Actual amount of eligible dividends
  eligibleDividends: /(?:Box|Case)\s+21[:\s]*(?:CA)?\$?\s*([0-9,]+\.?\d{0,2})/i,
  
  // Box 23 - Taxable amount of eligible dividends
  eligibleDividendsGrossUp: /(?:Box|Case)\s+23[:\s]*(?:CA)?\$?\s*([0-9,]+\.?\d{0,2})/i,
  
  // Box 49 - Actual amount of other than eligible dividends
  otherDividends: /(?:Box|Case)\s+49[:\s]*(?:CA)?\$?\s*([0-9,]+\.?\d{0,2})/i,
  
  // Box 51 - Taxable amount of other dividends
  otherDividendsGrossUp: /(?:Box|Case)\s+51[:\s]*(?:CA)?\$?\s*([0-9,]+\.?\d{0,2})/i,
  
  // Box 26 - Foreign investment income
  foreignIncome: /(?:Box|Case)\s+26[:\s]*(?:CA)?\$?\s*([0-9,]+\.?\d{0,2})/i,
  
  // Box 34 - Foreign tax paid
  foreignTaxPaid: /(?:Box|Case)\s+34[:\s]*(?:CA)?\$?\s*([0-9,]+\.?\d{0,2})/i,
  
  // Box 42 - Return of capital
  returnOfCapital: /(?:Box|Case)\s+42[:\s]*(?:CA)?\$?\s*([0-9,]+\.?\d{0,2})/i,
  
  trustName: /(?:Trust|Fiducie)[:\s]*([A-Za-z0-9\s&.,'-]+?)(?:\n|Box|Case)/i,
  year: /(?:Tax Year|Année d'imposition)[:\s]*(\d{4})/i,
};

// T5008 Pattern Extractors (Capital Gains/Losses)
export const T5008_PATTERNS = {
  // Box 20 - Proceeds of disposition
  proceeds: /(?:Box|Case)\s+20[:\s]*(?:CA)?\$?\s*([0-9,]+\.?\d{0,2})/i,
  
  // Box 21 - Adjusted cost base
  costBase: /(?:Box|Case)\s+21[:\s]*(?:CA)?\$?\s*([0-9,]+\.?\d{0,2})/i,
  
  // Security description
  securityDescription: /(?:Description|Security|Titre)[:\s]*([A-Za-z0-9\s&.,'-]+?)(?:\n|Quantity|Shares)/i,
  
  // Quantity
  quantity: /(?:Quantity|Nombre|Shares|Actions)[:\s]*([0-9,]+\.?\d{0,4})/i,
  
  // Settlement date
  settlementDate: /(?:Settlement|Règlement|Date)[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
  
  // Broker
  brokerName: /(?:Brokerage|Courtier|Institution)[:\s]*([A-Za-z\s&.,'-]+?)(?:\n|Account)/i,
  accountNumber: /(?:Account|Compte)[:\s#]*(\d{4,12})/i,
  
  year: /(?:Tax Year|Année)[:\s]*(\d{4})/i,
};

// T2202 Pattern Extractors (Tuition and Enrolment Certificate)
export const T2202_PATTERNS = {
  // Tuition fees - Box A (or common variations)
  tuitionFees: /(?:Box|Case)\s+A[:\s]*(?:CA)?\$?\s*([0-9,]+\.?\d{0,2})/i,
  tuitionFeesAlt: /(?:Tuition|Frais de scolarité|Eligible tuition fees)[:\s]*(?:CA)?\$?\s*([0-9,]+\.?\d{0,2})/i,
  
  // Full-time months - Box B
  fullTimeMonths: /(?:Box|Case)\s+B[:\s]*(\d{1,2})/i,
  fullTimeMonthsAlt: /(?:Full-time|Temps plein).*?months?[:\s]*(\d{1,2})/i,
  
  // Part-time months - Box C
  partTimeMonths: /(?:Box|Case)\s+C[:\s]*(\d{1,2})/i,
  partTimeMonthsAlt: /(?:Part-time|Temps partiel).*?months?[:\s]*(\d{1,2})/i,
  
  // Student information
  studentName: /(?:Student|Étudiant|Student name|Nom de l'étudiant)[:\s]*([A-Za-z\s'-]+?)(?:\n|SIN|Program|Address)/i,
  studentSIN: /(?:SIN|NAS|Social Insurance)[:\s]*(\d{3}[\s-]?\d{3}[\s-]?\d{3})/i,
  
  // Institution information
  institutionName: /(?:Educational institution|Établissement d'enseignement|Institution|University|College|Université|Collège)[:\s]*([A-Za-z0-9\s&.,'-]+?)(?:\n|Address|Box|Program)/i,
  programName: /(?:Program|Programme|Field of study|Domaine)[:\s]*([A-Za-z\s&.,'-]+?)(?:\n|Address|Box)/i,
  
  // Tax year
  year: /(?:Tax Year|Année d'imposition|Year|Année)[:\s]*(\d{4})/i,
};

// T4A Pattern Extractors (Contractor/Freelancer Income)
export const T4A_PATTERNS = {
  // Box 048 - Fees for services (most common for contractors)
  feesForServices: /(?:Box|Case)\s+048[:\s]*(?:CA)?\$?\s*([0-9,]+\.?\d{0,2})/i,
  
  // Box 020 - Self-employed commissions
  commissions: /(?:Box|Case)\s+020[:\s]*(?:CA)?\$?\s*([0-9,]+\.?\d{0,2})/i,
  
  // Box 016 - Pension or superannuation
  pension: /(?:Box|Case)\s+016[:\s]*(?:CA)?\$?\s*([0-9,]+\.?\d{0,2})/i,
  
  // Box 024 - Lump-sum payments
  lumpSum: /(?:Box|Case)\s+024[:\s]*(?:CA)?\$?\s*([0-9,]+\.?\d{0,2})/i,
  
  // Box 028 - Other income
  otherIncome: /(?:Box|Case)\s+028[:\s]*(?:CA)?\$?\s*([0-9,]+\.?\d{0,2})/i,
  
  // Box 022 - Income tax deducted (if any)
  incomeTaxDeducted: /(?:Box|Case)\s+022[:\s]*(?:CA)?\$?\s*([0-9,]+\.?\d{0,2})/i,
  
  // Payer information
  payerName: /(?:Payer|Payeur|Company|Entreprise)[:\s]*([A-Za-z0-9\s&.,'-]+?)(?:\n|Box|Case|Address)/i,
  payerBusinessNumber: /(?:Business Number|Numéro d'entreprise)[:\s]*(\d{9}\s?[A-Z]{2}\s?\d{4})/i,
  
  // Recipient information
  recipientName: /(?:Recipient|Bénéficiaire)[:\s]*([A-Za-z\s'-]+?)(?:\n|Address|SIN)/i,
  recipientSIN: /(?:SIN|NAS)[:\s]*(\d{3}[\s-]?\d{3}[\s-]?\d{3})/i,
  
  // Tax year
  year: /(?:Tax Year|Année d'imposition|Year|Année)[:\s]*(\d{4})/i,
  
  // Legacy fields for backward compatibility
  selfEmployment: /(?:Box|Case)\s+020[:\s]*(?:CA)?\$?\s*([0-9,]+\.?\d{0,2})/i,
  incomeTax: /(?:Box|Case)\s+022[:\s]*(?:CA)?\$?\s*([0-9,]+\.?\d{0,2})/i,
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
  // Match "Total CA$XXX.XX" or "Total $XXX.XX" after GROSS FARES, or simple "Gross Fares: $XXX"
  grossFares: /(?:(?:GROSS\s+FARES\s+BREAKDOWN|Gross\s+Fares?|Total\s+Fares?|Revenue)[\s\S]{0,500}?Total[\s:]*(?:CA)?\$?\s*([\d,]+\.?\d*)|(?:Gross\s+Fares?|Total\s+Fares?|Revenue)[\s:]*(?:CA)?\$?\s*([\d,]+\.?\d*))/i,
  
  // Match Uber Eats fares separately
  uberEatsFares: /UBER\s+EATS.*?GROSS\s+FARES[\s\S]{0,300}?Total[\s:]*(?:CA)?\$?\s*([\d,]+\.?\d*)/i,
  
  // Tips (may appear multiple times)
  tips: /Tips?[\s:]*(?:CA)?\$?\s*([\d,]+\.?\d*)/i,
  
  // Tolls
  tolls: /Tolls?[\s:]*(?:CA)?\$?\s*([\d,]+\.?\d*)/i,
  
  // Distance - match "Online Mileage X km" or standard patterns
  distance: /(?:Online\s+Mileage|(?:Total\s+)?(?:Distance|Kilometers?|Kilometres?|Mileage))[\s:]*(\d+(?:\.\d+)?)\s*(?:km|kilometers?|kilometres?)?/i,
  
  // Trips/Rides
  trips: /(?:Total\s+)?(?:Trips?|Rides?)[\s:]*(\d+)/i,
  
  // Service Fees - match total fees paid to Uber
  serviceFees: /(?:(?:FEES\s+BREAKDOWN|Service\s+Fee|Uber\s+Fee)[\s\S]{0,300}?Total[\s:]*(?:CA)?\$?\s*([\d,]+\.?\d*)|(?:Service\s+Fee|Uber\s+Fee)[\s:]*(?:CA)?\$?\s*([\d,]+\.?\d*))/i,
  
  // Net Earnings
  netEarnings: /(?:Net\s+Earnings?|Total\s+Payout)[\s:]*(?:CA)?\$?\s*([\d,]+\.?\d*)/i,
  
  // Period/Year
  period: /(?:Tax\s+summary\s+for\s+the\s+period|Week|Period)[\s:]*(\d{4}|[A-Za-z]+\s+\d+\s*-\s*[A-Za-z]+\s+\d+,?\s*\d{4})/i,
  
  // Date formats
  startDate: /(?:From|Start)[\s:]*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
  endDate: /(?:To|End)[\s:]*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
  
  // GST/QST collected (Canadian tax specific)
  gstCollected: /GST\s+you\s+collected.*?(?:CA)?\$?\s*([\d,]+\.?\d*)/i,
  qstCollected: /QST\s+you\s+collected.*?(?:CA)?\$?\s*([\d,]+\.?\d*)/i,
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
  // Vendor detection
  vendor: /(?:Esso|Petro-Canada|Shell|Ultramar|Irving|Canadian Tire|Costco)/i,
  
  // Amount patterns
  total: /(?:Total|Montant|Amount)[:\s]*(?:CA)?\$?\s*([0-9]+\.[0-9]{2})/i,
  
  // Volume - supports both "Liters: 45.5" and "45.5 L" formats
  // Uses two capture groups to handle different word order - extractValue finds first non-empty group
  liters: /(?:Litres?|Liters?)[:\s]+([0-9]+\.[0-9]{1,3})|([0-9]+\.[0-9]{1,3})\s*L(?:\s|$)/i,
  pricePerLiter: /(?:Price\s+per\s+L|PPL)[:\s]*\$?\s*([\d,]+\.?\d*)/i,
  
  // Date
  date: /(\d{2}[-/]\d{2}[-/]\d{2,4})/,
  
  // Odometer (if available)
  odometer: /(?:Odomètre|Odometer|KM)[:\s]*([0-9,]+)/i,
  
  // Legacy station pattern for backward compatibility
  station: /(?:Shell|Esso|Petro-Canada|Canadian Tire Gas|Ultramar|Costco|Irving)/i,
};

// Maintenance Receipt Pattern Extractors
export const MAINTENANCE_RECEIPT_PATTERNS = {
  vendor: /(?:Canadian Tire|Midas|Mr\. Lube|Jiffy Lube|Garage|Concessionnaire|Dealer)/i,
  serviceType: /(Oil Change|Tire Rotation|Brake Service|Inspection|Alignment|Vidange|Freins)/i,
  parts: /(?:Parts|Pièces)[:\s]*(?:CA)?\$?\s*([0-9,]+\.[0-9]{2})/i,
  labor: /(?:Labor|Labour|Main-d'œuvre)[:\s]*(?:CA)?\$?\s*([0-9,]+\.[0-9]{2})/i,
  total: /(?:Total|Grand Total|Montant Total)[:\s]*(?:CA)?\$?\s*([0-9,]+\.[0-9]{2})/i,
  subtotal: /(?:Subtotal|Sub-Total)[:\s]*\$?\s*([\d,]+\.?\d*)/i,
  tax: /(?:Tax|GST|QST|HST)[:\s]*\$?\s*([\d,]+\.?\d*)/i,
  date: /(?:Date)[:\s]*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
};

// Insurance Document Pattern Extractors
export const INSURANCE_PATTERNS = {
  provider: /(?:Intact|Desjardins|Bélairdirect|TD Insurance|Aviva|La Capitale)/i,
  premium: /(?:Prime|Premium|Monthly Payment)[:\s]*(?:CA)?\$?\s*([0-9,]+\.[0-9]{2})/i,
  period: /(?:Coverage Period|Période)[:\s]*(\d{2}[-/]\d{2}[-/]\d{2,4})\s*(?:to|à)\s*(\d{2}[-/]\d{2}[-/]\d{2,4})/i,
  vehicleYear: /(\d{4})\s+(?:Honda|Toyota|Ford|Chevrolet|Nissan|Mazda|Hyundai|Kia)/i,
  vehicleMake: /(Honda|Toyota|Ford|Chevrolet|Nissan|Mazda|Hyundai|Kia)/i,
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

// Medical/Pharmacy Receipt Patterns
export const PHARMACY_RECEIPT_PATTERNS = {
  total: /(?:Total|Amount|Balance)[:\s]*\$?\s*([\d,]+\.?\d*)/i,
  prescriptionNumber: /(?:Rx|Prescription|Script)[:\s#]*(\d{6,10})/i,
  din: /(?:DIN)[:\s]*(\d{8})/i,
  pharmacyName: /^(Shoppers|Jean Coutu|Pharmaprix|Uniprix|Brunet|Lawtons|Rexall|Costco Pharmacy).*$/im,
  date: /(?:Date|Sold)[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
};

// Dental Receipt Patterns
export const DENTAL_RECEIPT_PATTERNS = {
  total: /(?:Total|Amount|Balance Due|Patient Portion)[:\s]*\$?\s*([\d,]+\.?\d*)/i,
  service: /(?:Service|Treatment|Procedure)[:\s]*([A-Za-z\s,]+?)(?:\n|Total|Amount)/i,
  dentistName: /(?:Dr\.|Doctor|Dentist)[:\s]*([A-Za-z\s'-]+?)(?:\n|DDS|DMD)/i,
  date: /(?:Date of Service|Service Date|Date)[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
};

// Optical/Vision Receipt Patterns
export const OPTICAL_RECEIPT_PATTERNS = {
  total: /(?:Total|Amount|Balance)[:\s]*\$?\s*([\d,]+\.?\d*)/i,
  service: /(?:Frames|Lenses|Contact Lenses|Eye Exam|Vision Test)/i,
  provider: /^([A-Za-z\s&'-]+?)(?:Optical|Optometry|Vision|Eye Care).*$/im,
  date: /(?:Date|Service Date)[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
};

// General Medical Receipt Patterns
export const MEDICAL_RECEIPT_PATTERNS = {
  total: /(?:Total|Amount|Fee|Balance)[:\s]*\$?\s*([\d,]+\.?\d*)/i,
  service: /(?:Service|Treatment|Consultation|Visit|Therapy)[:\s]*([A-Za-z\s,]+?)(?:\n|Total|Amount)/i,
  practitioner: /(?:Dr\.|Doctor|Physician|Therapist|Chiropractor|Physiotherapist)[:\s]*([A-Za-z\s'-]+?)(?:\n|MD|DO)/i,
  date: /(?:Date of Service|Service Date|Date)[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
};

// Charitable Donation Receipt Patterns
export const CHARITABLE_RECEIPT_PATTERNS = {
  amount: /(?:Amount|Donation|Gift)[:\s]*\$?\s*([\d,]+\.?\d*)/i,
  charityName: /(?:Charity|Organization|Organisme)[:\s]*([A-Za-z0-9\s&',-]+?)(?:\n|Registration|Address)/i,
  registrationNumber: /(?:Registration Number|Numéro d'enregistrement|BN\/RR)[:\s#]*(\d{9}[A-Z]{2}\d{4})/i,
  date: /(?:Date)[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
  receiptNumber: /(?:Receipt Number|Official Receipt|Reçu)[:\s#]*([A-Z0-9-]+)/i,
};

// Business Expense Receipt Patterns
export const BUSINESS_EXPENSE_PATTERNS = {
  // Office supplies
  officeSupplies: {
    keywords: ['staples', 'bureau en gros', 'office depot', 'costco', 'walmart', 'amazon'],
    categories: ['paper', 'papier', 'pen', 'stylo', 'printer', 'imprimante', 'ink', 'encre', 'envelope', 'enveloppe'],
  },
  
  // Software/subscriptions
  software: {
    keywords: ['microsoft', 'adobe', 'quickbooks', 'freshbooks', 'shopify', 'dropbox', 'google workspace', 'zoom'],
    patterns: /(?:subscription|abonnement|monthly|mensuel)/i,
  },
  
  // Professional fees
  professionalFees: {
    keywords: ['accountant', 'comptable', 'lawyer', 'avocat', 'notary', 'notaire', 'consultant', 'cpa'],
    patterns: /(?:professional fee|honoraires professionnels|consulting fee|frais de consultation)/i,
  },
  
  // Advertising/marketing
  advertising: {
    keywords: ['google ads', 'facebook ads', 'meta', 'advertising', 'publicité', 'marketing', 'flyer', 'dépliant'],
    patterns: /(?:ad spend|dépenses publicitaires|promotion|campagne)/i,
  },
  
  // Bank fees
  bankFees: {
    keywords: ['monthly fee', 'frais mensuels', 'transaction fee', 'frais de transaction', 'overdraft', 'découvert'],
    patterns: /(?:bank|banque|service charge|frais de service)/i,
  },
  
  // Professional development
  training: {
    keywords: ['course', 'cours', 'training', 'formation', 'workshop', 'atelier', 'conference', 'conférence', 'seminar', 'séminaire'],
    patterns: /(?:tuition|frais de scolarité|certification|accréditation)/i,
  },
  
  // Business insurance
  businessInsurance: {
    keywords: ['liability insurance', 'assurance responsabilité', 'business insurance', 'assurance entreprise', 'errors & omissions', 'erreurs et omissions'],
  },
  
  // Licenses and permits
  licenses: {
    keywords: ['license', 'licence', 'permit', 'permis', 'registration', 'enregistrement', 'membership', 'adhésion'],
  },
  
  // Meals and entertainment (50% deductible)
  mealsEntertainment: {
    keywords: ['restaurant', 'coffee', 'café', 'lunch', 'dîner', 'dinner', 'souper', 'client meeting', 'rencontre client'],
    deductionRate: 0.5, // Only 50% deductible
  },
  
  // General receipt patterns
  amount: /(?:Total|Montant|Amount|Subtotal|Sous-total)[:\s]*(?:CA)?\$?\s*([0-9,]+\.\d{2})/i,
  tax: /(?:GST|TPS|HST|TVH|QST|TVQ)[:\s]*(?:CA)?\$?\s*([0-9,]+\.\d{2})/i,
  date: /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/,
  vendor: /^([A-Z][A-Za-z\s&.'-]{2,40})/m,
};

// Document classification patterns
export const CLASSIFICATION_PATTERNS = {
  T4: /(?:T4|Statement\s+of\s+Remuneration).*(?:Box\s+14|Employment\s+Income)/is,
  T4A: /(?:T4A|Statement\s+of\s+Pension).*(?:Box\s+(?:016|020|024|028|048|16|18|20|22|24|28|48)|Fees\s+for\s+services|Commissions?)/is,
  T5: /(?:T5|Statement\s+of\s+Investment\s+Income).*(?:Box\s+(?:10|11|13|14|18|19|24|25)|Interest|Dividend)/is,
  T3: /(?:T3|Statement\s+of\s+Trust\s+Income).*(?:Box\s+(?:21|23|26|34|42|49|51)|Trust|Fiducie)/is,
  T5008: /(?:T5008|Securities\s+Transactions?).*(?:Box\s+(?:20|21)|Proceeds|Disposition|Cost\s+Base)/is,
  RL1: /(?:RL-1|Relevé\s+1).*(?:Case\s+A|Box\s+A)/is,
  RL2: /(?:RL-2|Relevé\s+2).*(?:Case\s+A|Pension)/is,
  UBER_SUMMARY: /(?:Uber|uber\.com).*(?:Gross\s+Fares?|Weekly\s+Summary|Driver\s+Summary|Tax\s+summary\s+for\s+the\s+period|GROSS\s+FARES\s+BREAKDOWN|FEES\s+BREAKDOWN)/is,
  LYFT_SUMMARY: /(?:Lyft|lyft\.com).*(?:Driver\s+Earnings?|Weekly\s+Summary)/is,
  TAXI_STATEMENT: /(?:Taxi|Cab|Dispatch).*(?:Gross\s+Income|Commission)/is,
  GAS_RECEIPT: /(?:Shell|Esso|Petro-Canada|Ultramar|Irving|Canadian Tire|Costco|Gas|Fuel|Essence|Gasoline).*(?:Liters?|Litres?|L\s)/is,
  MAINTENANCE_RECEIPT: /(?:Oil\s+Change|Vidange|Tire|Pneu|Brake|Frein|Repair|Réparation|Service|Canadian Tire|Midas|Mr\.\s+Lube|Jiffy Lube).*(?:Labor|Labour|Main-d'œuvre|Parts|Pièces)/is,
  INSURANCE_RECEIPT: /(?:Intact|Desjardins|Bélairdirect|TD Insurance|Aviva|La Capitale).*(?:Prime|Premium|Monthly Payment|Coverage Period|Période)/is,
  INSURANCE_DOC: /(?:Insurance|Assurance|Policy).*(?:Premium|Coverage|Effective\s+Date)/is,
  PARKING_RECEIPT: /(?:Parking|Park).*(?:Duration|Zone)/is,
  PHONE_BILL:
    /(?:Wireless|Mobile|Cell|Phone|Rogers|Bell|Telus|Fido).*(?:Billing\s+Period|Data\s+Usage)/is,
  MEAL_RECEIPT: /(?:Restaurant|Café|Coffee|Food|Tim\s+Hortons|McDonald's).*(?:Subtotal|Tip)/is,
  PHARMACY_RECEIPT: /(?:Pharmacy|Pharmacie|Shoppers|Jean Coutu|Pharmaprix|Uniprix|Brunet).*(?:Prescription|Rx|DIN|Médicament)/is,
  DENTAL_RECEIPT: /(?:Dental|Dentiste|Dentistry|Orthodontic).*(?:Service|Treatment|Cleaning|Filling|Crown|Root Canal)/is,
  OPTICAL_RECEIPT: /(?:Optical|Optometry|Vision|Lunetterie|Eye\s+Care|Eyewear).*(?:Glasses|Lentilles|Contact|Exam|Examination)/is,
  MEDICAL_RECEIPT: /(?:Medical|Médical|Clinic|Clinique|Doctor|Médecin|Physician|Physiotherapy|Chiropractor).*(?:Service|Treatment|Consultation|Fee)/is,
  CHARITABLE_RECEIPT: /(?:Donation|Don|Charity|Organisme\s+de\s+bienfaisance|Official\s+Receipt|Reçu\s+officiel).*(?:Registration\s+Number|Numéro\s+d'enregistrement|RR\d{4}|\d{9}RR)/is,
  BUSINESS_RECEIPT: /(?:receipt|reçu|invoice|facture).*(?:total|montant|amount|subtotal)/is,
};

/**
 * Extract a value using a regex pattern
 * @param {string} text - The text to extract from
 * @param {RegExp} pattern - The regex pattern to use
 * @returns {string|number|null} - The extracted value or null
 */
export function extractValue(text, pattern) {
  const match = text.match(pattern);
  if (!match) return null;

  // Find first non-empty capture group (support patterns with multiple alternatives)
  let value = null;
  for (let i = 1; i < match.length; i++) {
    if (match[i] !== undefined) {
      value = match[i].trim();
      break;
    }
  }
  
  if (!value) return null;

  // Check if it looks like a date or year (don't parse as number)
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(value) || /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  
  // Check if it's a 4-digit year (keep as string for period/year fields)
  if (/^\d{4}$/.test(value) && parseInt(value) >= 1900 && parseInt(value) <= 2100) {
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
    case DOCUMENT_TYPES.T5:
      patterns = T5_PATTERNS;
      break;
    case DOCUMENT_TYPES.T3:
      patterns = T3_PATTERNS;
      break;
    case DOCUMENT_TYPES.T5008:
      patterns = T5008_PATTERNS;
      break;
    case DOCUMENT_TYPES.T2202:
      patterns = T2202_PATTERNS;
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
    case DOCUMENT_TYPES.INSURANCE_RECEIPT:
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
    case DOCUMENT_TYPES.PHARMACY_RECEIPT:
      patterns = PHARMACY_RECEIPT_PATTERNS;
      break;
    case DOCUMENT_TYPES.DENTAL_RECEIPT:
      patterns = DENTAL_RECEIPT_PATTERNS;
      break;
    case DOCUMENT_TYPES.OPTICAL_RECEIPT:
      patterns = OPTICAL_RECEIPT_PATTERNS;
      break;
    case DOCUMENT_TYPES.MEDICAL_RECEIPT:
      patterns = MEDICAL_RECEIPT_PATTERNS;
      break;
    case DOCUMENT_TYPES.CHARITABLE_RECEIPT:
      patterns = CHARITABLE_RECEIPT_PATTERNS;
      break;
    case DOCUMENT_TYPES.BUSINESS_RECEIPT:
      // For business receipts, extract general receipt patterns
      patterns = {
        amount: BUSINESS_EXPENSE_PATTERNS.amount,
        tax: BUSINESS_EXPENSE_PATTERNS.tax,
        date: BUSINESS_EXPENSE_PATTERNS.date,
        vendor: BUSINESS_EXPENSE_PATTERNS.vendor,
      };
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

  // Special handling for Uber summaries: sum multiple income sources
  if (docType === DOCUMENT_TYPES.UBER_SUMMARY) {
    // If we have both Uber Rides and Uber Eats fares, sum them
    if (result.uberEatsFares && typeof result.uberEatsFares === 'number') {
      const baseGrossFares = result.grossFares || 0;
      result.grossFares = Math.round((baseGrossFares + result.uberEatsFares) * 100) / 100;
      // Keep uberEatsFares for reference
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
      excludeIfPresent: ['t4a', 'pension', 'fees for services'], // Don't match T4 if T4A indicators present
    },
    T4A: {
      keywords: ['t4a', 'statement of pension', 'fees for services', 'commissions', 'box 048', 'box 020', 'box 028', 'box 024', 'other income'],
      patterns: [/T4A/i, /Statement\s+of\s+Pension/i, /Box\s+(?:048|020|028|024)/i, /Fees\s+for\s+services/i],
      confidence: 0,
    },
    T5: {
      keywords: ['t5', 'statement of investment income', 'interest', 'dividends', 'box 13', 'box 24', 'box 10'],
      patterns: [/T5/i, /Statement\s+of\s+Investment\s+Income/i, /Box\s+(?:10|11|13|24|25)/i],
      confidence: 0,
    },
    T3: {
      keywords: ['t3', 'statement of trust income', 'trust', 'fiducie', 'box 21', 'box 23', 'box 49'],
      patterns: [/T3/i, /Trust\s+Income/i, /Box\s+(?:21|23|26|34|42|49|51)/i, /Fiducie/i],
      confidence: 0,
    },
    T5008: {
      keywords: ['t5008', 'securities transactions', 'proceeds', 'disposition', 'cost base', 'box 20', 'box 21'],
      patterns: [/T5008/i, /Securities\s+Transactions?/i, /Box\s+(?:20|21)/i, /Proceeds.*Disposition/i],
      confidence: 0,
    },
    T2202: {
      keywords: ['t2202', 'tuition', 'enrolment certificate', 'educational institution', 'eligible tuition fees', 'full-time months', 'part-time months', 'student', 'university', 'college'],
      patterns: [/T2202/i, /Tuition.*Enrolment/i, /Educational\s+Institution/i, /Eligible\s+tuition\s+fees/i, /Full-time\s+months/i],
      confidence: 0,
    },
    RL1: {
      keywords: ['rl-1', 'rl1', 'relevé 1', "revenu d'emploi", 'case a'],
      patterns: [/(?:RL-1|Relevé\s+1)/i, /Case\s+A/i, /Revenu.*emploi/i],
      confidence: 0,
    },
    UBER_SUMMARY: {
      keywords: ['uber', 'driver partner', 'weekly summary', 'trip earnings', 'gross fare', 'tax summary for the period', 'gross fares breakdown', 'fees breakdown', 'uber rides', 'uber eats'],
      patterns: [/uber.*partner/i, /weekly.*summary/i, /gross.*fare/i, /uber\.com/i, /tax\s+summary\s+for\s+the\s+period/i, /GROSS\s+FARES\s+BREAKDOWN/i],
      confidence: 0,
    },
    LYFT_SUMMARY: {
      keywords: ['lyft', 'weekly summary', 'driver dashboard', 'ride earnings'],
      patterns: [/lyft.*driver/i, /weekly.*earning/i, /total.*payout/i, /lyft\.com/i],
      confidence: 0,
    },
    GAS_RECEIPT: {
      keywords: ['shell', 'esso', 'petro', 'ultramar', 'irving', 'canadian tire', 'costco', 'gas', 'fuel', 'essence', 'gasoline', 'liters', 'litres'],
      patterns: [/(shell|esso|petro-canada|ultramar|irving|canadian tire|costco)/i, /fuel|gas|essence/i, /liters?|litres?/i],
      confidence: 0,
    },
    MAINTENANCE_RECEIPT: {
      keywords: ['oil change', 'vidange', 'tire', 'pneu', 'brake', 'frein', 'service', 'repair', 'réparation', 'maintenance', 'canadian tire', 'midas', 'mr. lube', 'jiffy lube'],
      patterns: [/oil.*change|vidange/i, /tire.*service|pneu/i, /brake.*repair|frein/i, /labor|labour|main-d'œuvre/i],
      confidence: 0,
    },
    INSURANCE_RECEIPT: {
      keywords: ['insurance', 'assurance', 'intact', 'desjardins', 'belair', 'bélairdirect', 'td insurance', 'aviva', 'la capitale', 'premium', 'prime'],
      patterns: [/(intact|desjardins|bélairdirect|td insurance|aviva|la capitale)/i, /prime|premium|monthly payment/i, /coverage period|période/i],
      confidence: 0,
    },
    PHARMACY_RECEIPT: {
      keywords: ['pharmacy', 'pharmacie', 'shoppers', 'jean coutu', 'pharmaprix', 'uniprix', 'brunet', 'prescription', 'rx', 'din', 'médicament'],
      patterns: [/(shoppers|jean coutu|pharmaprix|uniprix|brunet)/i, /prescription|rx/i, /din\s*\d{8}/i],
      confidence: 0,
    },
    DENTAL_RECEIPT: {
      keywords: ['dental', 'dentiste', 'dentistry', 'orthodontic', 'cleaning', 'filling', 'crown', 'root canal'],
      patterns: [/dental|dentiste/i, /service|treatment|cleaning|filling/i, /dr\.|doctor/i],
      confidence: 0,
    },
    OPTICAL_RECEIPT: {
      keywords: ['optical', 'optometry', 'vision', 'lunetterie', 'eye care', 'eyewear', 'glasses', 'lentilles', 'contact', 'exam'],
      patterns: [/optical|optometry|vision/i, /glasses|lentilles|contact/i, /exam|examination/i],
      confidence: 0,
    },
    MEDICAL_RECEIPT: {
      keywords: ['medical', 'médical', 'clinic', 'clinique', 'doctor', 'médecin', 'physician', 'physiotherapy', 'chiropractor'],
      patterns: [/clinic|clinique/i, /doctor|médecin|physician/i, /treatment|consultation|therapy/i],
      confidence: 0,
    },
    CHARITABLE_RECEIPT: {
      keywords: ['donation', 'don', 'charity', 'organisme de bienfaisance', 'official receipt', 'reçu officiel', 'registration number'],
      patterns: [/donation|don/i, /charity|organisme.*bienfaisance/i, /\d{9}RR\d{4}/i, /registration.*number/i],
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
      excludeIfPresent: ['t4a', 'pension', 'fees for services'],
    },
    T4A: {
      keywords: ['t4a', 'statement of pension', 'fees for services', 'commissions', 'box 048', 'box 020', 'box 028', 'box 024', 'other income'],
      patterns: [/T4A/i, /Statement\s+of\s+Pension/i, /Box\s+(?:048|020|028|024)/i, /Fees\s+for\s+services/i],
      confidence: 0,
    },
    T5: {
      keywords: ['t5', 'statement of investment income', 'interest', 'dividends', 'box 13', 'box 24', 'box 10'],
      patterns: [/T5/i, /Statement\s+of\s+Investment\s+Income/i, /Box\s+(?:10|11|13|24|25)/i],
      confidence: 0,
    },
    T3: {
      keywords: ['t3', 'statement of trust income', 'trust', 'fiducie', 'box 21', 'box 23', 'box 49'],
      patterns: [/T3/i, /Trust\s+Income/i, /Box\s+(?:21|23|26|34|42|49|51)/i, /Fiducie/i],
      confidence: 0,
    },
    T5008: {
      keywords: ['t5008', 'securities transactions', 'proceeds', 'disposition', 'cost base', 'box 20', 'box 21'],
      patterns: [/T5008/i, /Securities\s+Transactions?/i, /Box\s+(?:20|21)/i, /Proceeds.*Disposition/i],
      confidence: 0,
    },
    T2202: {
      keywords: ['t2202', 'tuition', 'enrolment certificate', 'educational institution', 'eligible tuition fees', 'full-time months', 'part-time months', 'student', 'university', 'college'],
      patterns: [/T2202/i, /Tuition.*Enrolment/i, /Educational\s+Institution/i, /Eligible\s+tuition\s+fees/i, /Full-time\s+months/i],
      confidence: 0,
    },
    RL1: {
      keywords: ['rl-1', 'rl1', 'relevé 1', "revenu d'emploi", 'case a'],
      patterns: [/(?:RL-1|Relevé\s+1)/i, /Case\s+A/i, /Revenu.*emploi/i],
      confidence: 0,
    },
    UBER_SUMMARY: {
      keywords: ['uber', 'driver partner', 'weekly summary', 'trip earnings', 'gross fare', 'tax summary for the period', 'gross fares breakdown', 'fees breakdown', 'uber rides', 'uber eats'],
      patterns: [/uber.*partner/i, /weekly.*summary/i, /gross.*fare/i, /uber\.com/i, /tax\s+summary\s+for\s+the\s+period/i, /GROSS\s+FARES\s+BREAKDOWN/i],
      confidence: 0,
    },
    LYFT_SUMMARY: {
      keywords: ['lyft', 'weekly summary', 'driver dashboard', 'ride earnings'],
      patterns: [/lyft.*driver/i, /weekly.*earning/i, /total.*payout/i, /lyft\.com/i],
      confidence: 0,
    },
    GAS_RECEIPT: {
      keywords: ['shell', 'esso', 'petro', 'ultramar', 'irving', 'canadian tire', 'costco', 'gas', 'fuel', 'essence', 'gasoline', 'liters', 'litres'],
      patterns: [/(shell|esso|petro-canada|ultramar|irving|canadian tire|costco)/i, /fuel|gas|essence/i, /liters?|litres?/i],
      confidence: 0,
    },
    MAINTENANCE_RECEIPT: {
      keywords: ['oil change', 'vidange', 'tire', 'pneu', 'brake', 'frein', 'service', 'repair', 'réparation', 'maintenance', 'canadian tire', 'midas', 'mr. lube', 'jiffy lube'],
      patterns: [/oil.*change|vidange/i, /tire.*service|pneu/i, /brake.*repair|frein/i, /labor|labour|main-d'œuvre/i],
      confidence: 0,
    },
    INSURANCE_RECEIPT: {
      keywords: ['insurance', 'assurance', 'intact', 'desjardins', 'belair', 'bélairdirect', 'td insurance', 'aviva', 'la capitale', 'premium', 'prime'],
      patterns: [/(intact|desjardins|bélairdirect|td insurance|aviva|la capitale)/i, /prime|premium|monthly payment/i, /coverage period|période/i],
      confidence: 0,
    },
    PHARMACY_RECEIPT: {
      keywords: ['pharmacy', 'pharmacie', 'shoppers', 'jean coutu', 'pharmaprix', 'uniprix', 'brunet', 'prescription', 'rx', 'din', 'médicament'],
      patterns: [/(shoppers|jean coutu|pharmaprix|uniprix|brunet)/i, /prescription|rx/i, /din\s*\d{8}/i],
      confidence: 0,
    },
    DENTAL_RECEIPT: {
      keywords: ['dental', 'dentiste', 'dentistry', 'orthodontic', 'cleaning', 'filling', 'crown', 'root canal'],
      patterns: [/dental|dentiste/i, /service|treatment|cleaning|filling/i, /dr\.|doctor/i],
      confidence: 0,
    },
    OPTICAL_RECEIPT: {
      keywords: ['optical', 'optometry', 'vision', 'lunetterie', 'eye care', 'eyewear', 'glasses', 'lentilles', 'contact', 'exam'],
      patterns: [/optical|optometry|vision/i, /glasses|lentilles|contact/i, /exam|examination/i],
      confidence: 0,
    },
    MEDICAL_RECEIPT: {
      keywords: ['medical', 'médical', 'clinic', 'clinique', 'doctor', 'médecin', 'physician', 'physiotherapy', 'chiropractor'],
      patterns: [/clinic|clinique/i, /doctor|médecin|physician/i, /treatment|consultation|therapy/i],
      confidence: 0,
    },
    CHARITABLE_RECEIPT: {
      keywords: ['donation', 'don', 'charity', 'organisme de bienfaisance', 'official receipt', 'reçu officiel', 'registration number'],
      patterns: [/donation|don/i, /charity|organisme.*bienfaisance/i, /\d{9}RR\d{4}/i, /registration.*number/i],
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
