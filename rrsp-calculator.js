// rrsp-calculator.js — 2025 RRSP impact estimator
// Based on combined QC + Fed marginal tax rates (source: Revenu Québec + CRA)

// 2025 Combined Marginal Tax Rates (QC + Fed) — for income in each bracket
const TAX_BRACKETS = [
  { max: 51_268, rate: 0.2885 },   // 15% Fed + 13.85% QC (basic)
  { max: 57_965, rate: 0.3325 },   // + 4.4% QC (solidarity phase-in)
  { max: 110_972, rate: 0.3885 },  // + 5.6% Fed (20.5% bracket)
  { max: 165_430, rate: 0.4385 },  // + 5% Fed (26% bracket)
  { max: 235_430, rate: 0.4835 },  // + 4.5% Fed (29% bracket) + QC surtax
  { max: Infinity, rate: 0.5335 }  // + 5% Fed (33% bracket)
];

export function calculateRrspImpact(income, contribution) {
  contribution = Math.min(contribution, Math.min(income, 31_560)); // 2025 RRSP limit ≈ 18% of $175,333
  const newIncome = Math.max(0, income - contribution);

  // Estimate tax saved = contribution × marginal rate at *original* income
  const marginalRate = TAX_BRACKETS.find(b => income <= b.max)?.rate || 0.5335;
  const taxSaved = contribution * marginalRate;

  return {
    contribution,
    newIncome,
    taxSaved: Math.round(taxSaved * 100) / 100,
    marginalRate: marginalRate
  };
}
