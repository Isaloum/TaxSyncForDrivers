export function calculateSolidarityCredit(income) {
  const BASE = 531;
  const PHASEOUT_START = 57965, PHASEOUT_END = 64125;
  let amount = BASE;
  if (income > PHASEOUT_START) {
    if (income >= PHASEOUT_END) amount = 0;
    else amount *= (1 - (income - PHASEOUT_START) / (PHASEOUT_END - PHASEOUT_START));
  }
  return Math.round(amount * 100) / 100;
}
export function calculateWorkPremium(income) {
  if (income < 7200) return 0;
  const base = Math.min(income - 7200, 33100);
  return Math.min(Math.round(base * 0.26 * 100) / 100, 728);
}
