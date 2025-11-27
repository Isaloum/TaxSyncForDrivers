#!/usr/bin/env node
import { parseRL1Text } from './rl1-parser.js';
import { calculateSolidarityCredit, calculateWorkPremium } from './credit-calculator.js';

// Inline RRSP impact calculator (no extra file needed yet)
function calculateRrspImpact(income, contribution) {
  const limit = Math.min(income, 31560); // 2025 RRSP limit ~18% of $175,333
  contribution = Math.min(contribution, limit);
  const newIncome = Math.max(0, income - contribution);
  // Marginal tax rate for $60k in QC+Fed ≈ 33.25% (15% Fed + 18.25% QC incl. surtax)
  const marginalRate = income <= 51268 ? 0.2885 : income <= 57965 ? 0.3325 : 0.3885;
  return {
    contribution,
    newIncome,
    taxSaved: Math.round(contribution * marginalRate * 100) / 100,
    marginalRate
  };
}

function estimateFederal(income) {
  let cwb = 0;
  if (income <= 25539) cwb = Math.min(income * 0.27, 1519);
  else if (income <= 35539) cwb = Math.max(0, 1519 - (income - 25539) * 0.15);
  const bpa = Math.max(0, 15705 - Math.max(0, income - 165430) * 15705 / 70000);
  const bpaSavings = bpa * 0.15;
  return { cwb: Math.round(cwb * 100) / 100, bpaSavings: Math.round(bpaSavings * 100) / 100 };
}

const args = process.argv.slice(2);
const idx = args.indexOf('--rl1');
if (idx === -1) {
  console.error('Usage: node cli.js --rl1 "Case A: 60000" [--rrsp 5000]');
  process.exit(1);
}
const text = args[idx + 1];
const rrspIdx = args.indexOf('--rrsp');
const rrspAmount = rrspIdx !== -1 ? parseFloat(args[rrspIdx + 1]) || 0 : 0;

const data = parseRL1Text(text);
if (!data.isValid()) {
  console.error('❌ Invalid RL-1 — check Case A.');
  process.exit(1);
}

const originalIncome = data.income;
const rrsp = calculateRrspImpact(originalIncome, rrspAmount);
const effectiveIncome = rrsp.newIncome;

const qc = {
  solidarity: calculateSolidarityCredit(effectiveIncome),
  workPremium: calculateWorkPremium(effectiveIncome)
};
const fed = estimateFederal(effectiveIncome);

const qcTotal = qc.solidarity + qc.workPremium;
const fedTotal = fed.bpaSavings + fed.cwb;
const totalBenefit = qcTotal + fedTotal + rrsp.taxSaved;

console.log(`\n🧾 Quebec + Federal + RRSP Impact (2025)\n`);
console.log(`💼 Original Income: $${originalIncome}`);
if (rrspAmount > 0) {
  console.log(`📉 After RRSP ($${rrspAmount}): $${effectiveIncome}`);
  console.log(`💰 Tax Saved (marginal ${Math.round(rrsp.marginalRate*100)}%): $${rrsp.taxSaved}`);
}
console.log(`\n🇶🇨 Quebec:`);
console.log(`  💰 Solidarity: $${qc.solidarity}`);
console.log(`  👷 Work Premium: $${qc.workPremium}`);
console.log(`\n🇨🇦 Federal:`);
console.log(`  🛡️ BPA Savings: $${fed.bpaSavings}`);
console.log(`  💵 CWB: $${fed.cwb}`);
console.log(`\n🎯 Total Benefit: $${totalBenefit.toFixed(2)}`);
console.log(`   (QC + Fed credits + RRSP tax savings)\n`);
