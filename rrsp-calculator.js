// rrsp-calculator.js — 2026 official marginal tax rates (QC + Fed)
// Source: Revenu Québec 2026 Taxation Guide + CRA 2026 Rates

/**
 * 2026 Combined Quebec + Federal marginal tax rate brackets
 * Each bracket defines maximum income and the combined tax rate
 * Federal: Indexed 2%, lowest rate reduced from 15% to 14%
 * Quebec: Indexed 2.05%
 *
 * @type {Array<{max: number, rate: number}>}
 */
export const MARGINAL_RATES = [
  { max: 54_345, rate: 0.28 },    // 14% Fed + 14% QC
  { max: 58_523, rate: 0.33 },    // 14% Fed + 19% QC
  { max: 108_680, rate: 0.395 },  // 20.5% Fed + 19% QC
  { max: 117_045, rate: 0.445 },  // 20.5% Fed + 24% QC
  { max: 132_245, rate: 0.50 },   // 26% Fed + 24% QC
  { max: 181_440, rate: 0.5175 }, // 26% Fed + 25.75% QC
  { max: 258_482, rate: 0.5475 }, // 29% Fed + 25.75% QC
  { max: Infinity, rate: 0.5875 }, // 33% Fed + 25.75% QC
];

/**
 * Calculate RRSP contribution impact on taxable income and tax savings
 * Uses the pre-RRSP income to determine marginal tax rate
 *
 * @param {number} income - Annual income before RRSP contribution in CAD
 * @param {number} [contribution=0] - RRSP contribution amount in CAD
 * @returns {{contribution: number, newIncome: number, taxSaved: number, marginalRate: number}}
 *   Object containing contribution amount, new taxable income, tax saved, and marginal rate
 */
export function calculateRrspImpact(income, contribution = 0) {
  // RRSP limit 2026 = 18% of $180,000 = $32,490
  const limit = Math.min(income, 32_490);
  const rrsp = Math.min(contribution, limit);
  const newIncome = Math.max(0, income - rrsp);

  // Use pre-RRSP income to determine marginal rate (correct for tax savings)
  const rate = MARGINAL_RATES.find((b) => income <= b.max)?.rate || 0.5875;
  const taxSaved = rrsp * rate;

  return {
    contribution: rrsp,
    newIncome,
    taxSaved: Math.round(taxSaved * 100) / 100,
    marginalRate: rate,
  };
}
