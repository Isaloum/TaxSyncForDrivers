// province-language-fix.js — Bilingual Province/Territory Names for Canada
// Fixes UI issue where province names only appear in French

/**
 * Bilingual province and territory data
 */
const PROVINCES = {
  AB: { en: 'Alberta', fr: 'Alberta' },
  BC: { en: 'British Columbia', fr: 'Colombie-Britannique' },
  MB: { en: 'Manitoba', fr: 'Manitoba' },
  NB: { en: 'New Brunswick', fr: 'Nouveau-Brunswick' },
  NL: { en: 'Newfoundland and Labrador', fr: 'Terre-Neuve-et-Labrador' },
  NS: { en: 'Nova Scotia', fr: 'Nouvelle-Écosse' },
  ON: { en: 'Ontario', fr: 'Ontario' },
  PE: { en: 'Prince Edward Island', fr: 'Île-du-Prince-Édouard' },
  QC: { en: 'Quebec', fr: 'Québec' },
  SK: { en: 'Saskatchewan', fr: 'Saskatchewan' },
  NT: { en: 'Northwest Territories', fr: 'Territoires du Nord-Ouest' },
  NU: { en: 'Nunavut', fr: 'Nunavut' },
  YT: { en: 'Yukon', fr: 'Yukon' }
};

/**
 * Get province/territory name in specified language
 * 
 * @param {string} code - Province/territory code (e.g., 'QC', 'ON')
 * @param {string} language - 'en' or 'fr'
 * @returns {string} Province/territory name
 */
export function getProvinceName(code, language = 'en') {
  if (!code || typeof code !== 'string') {
    throw new Error('Invalid province code: must be a string');
  }

  const upperCode = code.toUpperCase();
  
  if (!PROVINCES[upperCode]) {
    throw new Error(`Unknown province code: ${code}`);
  }

  if (!['en', 'fr'].includes(language)) {
    throw new Error('Invalid language: must be "en" or "fr"');
  }

  return PROVINCES[upperCode][language];
}

/**
 * Get all province/territory options for dropdown
 * 
 * @param {string} language - 'en' or 'fr'
 * @returns {Array} Array of {code, name} objects
 */
export function getProvinceOptions(language = 'en') {
  if (!['en', 'fr'].includes(language)) {
    throw new Error('Invalid language: must be "en" or "fr"');
  }

  return Object.keys(PROVINCES).map(code => ({
    code,
    name: PROVINCES[code][language]
  })).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Detect browser language preference
 * 
 * @returns {string} 'en' or 'fr' based on browser settings
 */
export function detectLanguage() {
  // Check if we're in a browser environment
  if (typeof navigator === 'undefined') {
    return 'en'; // Default to English in Node.js
  }

  const browserLang = navigator.language || navigator.userLanguage;
  
  // Check if browser language starts with 'fr'
  if (browserLang && browserLang.toLowerCase().startsWith('fr')) {
    return 'fr';
  }

  return 'en';
}

/**
 * Get all province codes
 * 
 * @returns {Array} Array of province/territory codes
 */
export function getProvinceCodes() {
  return Object.keys(PROVINCES);
}

/**
 * Check if a province code is valid
 * 
 * @param {string} code - Province/territory code
 * @returns {boolean} True if valid
 */
export function isValidProvinceCode(code) {
  if (!code || typeof code !== 'string') {
    return false;
  }
  return Object.prototype.hasOwnProperty.call(PROVINCES, code.toUpperCase());
}
