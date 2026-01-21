// tax-calculator-bundle.js - Universal calculation module
(function (global) {
  'use strict';

  const MARGINAL_RATES = [
    { max: 54345, rate: 0.28 },    // 14% Fed + 14% QC
    { max: 58523, rate: 0.33 },    // 14% Fed + 19% QC
    { max: 108680, rate: 0.395 },  // 20.5% Fed + 19% QC
    { max: 117045, rate: 0.445 },  // 20.5% Fed + 24% QC
    { max: 132245, rate: 0.50 },   // 26% Fed + 24% QC
    { max: 181440, rate: 0.5175 }, // 26% Fed + 25.75% QC
    { max: 258482, rate: 0.5475 }, // 29% Fed + 25.75% QC
    { max: Infinity, rate: 0.5875 }, // 33% Fed + 25.75% QC
  ];

  function calculateRrspImpact(income, contribution = 0) {
    const limit = Math.min(income, 32490); // 2026 RRSP limit
    const rrsp = Math.min(contribution, limit);
    const newIncome = Math.max(0, income - rrsp);
    const rate = MARGINAL_RATES.find((b) => income <= b.max)?.rate || 0.5875;
    const taxSaved = rrsp * rate;
    return {
      contribution: rrsp,
      newIncome,
      taxSaved: Math.round(taxSaved * 100) / 100,
      marginalRate: rate,
    };
  }

  function calculateSolidarityCredit(income, isSingle = true) {
    const BASE = 531;
    const PHASEOUT_START = 57965;
    const PHASEOUT_END = 64125;
    let amount = isSingle ? BASE : 531 + 531;
    if (income > PHASEOUT_START) {
      if (income >= PHASEOUT_END) {
        amount = 0;
      } else {
        const reduction = (income - PHASEOUT_START) / (PHASEOUT_END - PHASEOUT_START);
        amount *= 1 - reduction;
      }
    }
    return Math.round(amount * 100) / 100;
  }

  function calculateWorkPremium(income, isSingle = true) {
    if (income < 7200) return 0;
    if (income > 57965) return 0;
    const base = Math.min(income - 7200, 33100);
    const raw = base * 0.26;
    const MAX_CREDIT = isSingle ? 728 : 1456;
    return Math.min(Math.round(raw * 100) / 100, MAX_CREDIT);
  }

  function calculateCWB(income, hasDependents = false) {
    // 2026 Canada Workers Benefit (indexed ~2%)
    const MAX_SINGLE = 1549;
    const MAX_FAMILY = 2578;
    const PHASEOUT_START_SINGLE = 26050;
    const PHASEOUT_START_FAMILY = 39092;
    const BASE_THRESHOLD = 17928;
    const max = hasDependents ? MAX_FAMILY : MAX_SINGLE;
    const phaseoutStart = hasDependents ? PHASEOUT_START_FAMILY : PHASEOUT_START_SINGLE;
    if (income <= BASE_THRESHOLD) {
      return Math.min(income * 0.27, max);
    } else if (income <= phaseoutStart) {
      return max;
    } else if (income <= phaseoutStart + max / 0.15) {
      const excess = income - phaseoutStart;
      return Math.max(0, max - excess * 0.15);
    }
    return 0;
  }

  function calculateBPA(income) {
    // 2026 Federal BPA: $14,829 minimum, $16,452 maximum
    const MIN_BPA = 14829;
    const MAX_BPA = 16452;
    const PHASEOUT_START = 181440;
    const PHASEOUT_END = 251440;
    
    let bpa = MAX_BPA;
    
    if (income > PHASEOUT_START) {
      if (income >= PHASEOUT_END) {
        bpa = MIN_BPA;
      } else {
        const reduction = ((income - PHASEOUT_START) / (PHASEOUT_END - PHASEOUT_START)) * (MAX_BPA - MIN_BPA);
        bpa = MAX_BPA - reduction;
      }
    }
    
    return Math.round(bpa * 0.14 * 100) / 100; // 14% lowest bracket rate
  }

  const TaxCalculator = {
    calculateRrspImpact,
    calculateSolidarityCredit,
    calculateWorkPremium,
    calculateCWB,
    calculateBPA,
    MARGINAL_RATES,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = TaxCalculator;
  }
  if (typeof window !== 'undefined') {
    window.TaxCalculator = TaxCalculator;
  }
  if (typeof global !== 'undefined') {
    global.TaxCalculator = TaxCalculator;
  }
})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : this);
