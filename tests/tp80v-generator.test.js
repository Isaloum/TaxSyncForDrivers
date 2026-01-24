// tests/tp80v-generator.test.js — Comprehensive tests for TP-80-V Quebec form generator
import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  calculateFSS,
  calculateQPPContributions,
  calculateTP80V,
  generateTP80VForm,
  exportTP80VAsText,
  FSS_TIER_2_THRESHOLD,
  FSS_TIER_2_RATE,
  FSS_TIER_3_THRESHOLD,
  FSS_TIER_3_RATE,
  QPP_CONTRIBUTION_RATE,
  QPP_BASIC_EXEMPTION,
  QPP_MAX_PENSIONABLE_EARNINGS
} from '../tp80v-generator.js';

describe('TP-80-V Generator Tests', () => {
  describe('Constants', () => {
    it('should have correct FSS tier 2 threshold and rate', () => {
      assert.strictEqual(FSS_TIER_2_THRESHOLD, 5000);
      assert.strictEqual(FSS_TIER_2_RATE, 0.0165);
    });

    it('should have correct FSS tier 3 threshold and rate', () => {
      assert.strictEqual(FSS_TIER_3_THRESHOLD, 58515);
      assert.strictEqual(FSS_TIER_3_RATE, 0.0426);
    });

    it('should have correct QPP constants', () => {
      assert.strictEqual(QPP_CONTRIBUTION_RATE, 0.138);
      assert.strictEqual(QPP_BASIC_EXEMPTION, 3500);
      assert.strictEqual(QPP_MAX_PENSIONABLE_EARNINGS, 73200);
    });
  });

  describe('calculateFSS - Tier 1 (0%)', () => {
    it('should calculate 0% FSS for income under $5,000', () => {
      const result = calculateFSS(4000);

      assert.strictEqual(result.netBusinessIncome, 4000);
      assert.strictEqual(result.tier1Amount, 4000);
      assert.strictEqual(result.tier1FSS, 0);
      assert.strictEqual(result.tier2Amount, 0);
      assert.strictEqual(result.totalFSS, 0);
    });

    it('should calculate 0% FSS for income at exactly $5,000', () => {
      const result = calculateFSS(5000);

      assert.strictEqual(result.tier1Amount, 5000);
      assert.strictEqual(result.tier1FSS, 0);
      assert.strictEqual(result.tier2Amount, 0);
      assert.strictEqual(result.totalFSS, 0);
    });

    it('should calculate 0 FSS for zero income', () => {
      const result = calculateFSS(0);

      assert.strictEqual(result.totalFSS, 0);
    });

    it('should calculate 0 FSS for negative income (loss)', () => {
      const result = calculateFSS(-5000);

      assert.strictEqual(result.totalFSS, 0);
    });
  });

  describe('calculateFSS - Tier 2 (1.65%)', () => {
    it('should calculate FSS for income of $10,000', () => {
      const result = calculateFSS(10000);

      assert.strictEqual(result.tier1Amount, 5000);
      assert.strictEqual(result.tier1FSS, 0);
      assert.strictEqual(result.tier2Amount, 5000); // 10000 - 5000
      assert.strictEqual(result.tier2FSS, 82.5); // 5000 * 0.0165
      assert.strictEqual(result.tier3Amount, 0);
      assert.strictEqual(result.totalFSS, 82.5);
    });

    it('should calculate FSS for income of $30,000', () => {
      const result = calculateFSS(30000);

      assert.strictEqual(result.tier1Amount, 5000);
      assert.strictEqual(result.tier2Amount, 25000); // 30000 - 5000
      assert.strictEqual(result.tier2FSS, 412.5); // 25000 * 0.0165
      assert.strictEqual(result.tier3Amount, 0);
      assert.strictEqual(result.totalFSS, 412.5);
    });

    it('should calculate FSS at tier 2 maximum ($58,515)', () => {
      const result = calculateFSS(58515);

      assert.strictEqual(result.tier1Amount, 5000);
      assert.strictEqual(result.tier2Amount, 53515); // 58515 - 5000
      assert.strictEqual(result.tier2FSS, 883);  // 53515 * 0.0165
      assert.strictEqual(result.tier3Amount, 0);
      assert.strictEqual(result.totalFSS, 883);
    });
  });

  describe('calculateFSS - Tier 3 (4.26%)', () => {
    it('should calculate FSS for income of $60,000', () => {
      const result = calculateFSS(60000);

      assert.strictEqual(result.tier1Amount, 5000);
      assert.strictEqual(result.tier2Amount, 53515); // 58515 - 5000
      assert.strictEqual(result.tier2FSS, 883); // 53515 * 0.0165
      assert.strictEqual(result.tier3Amount, 1485); // 60000 - 58515
      assert.strictEqual(result.tier3FSS, 63.26); // 1485 * 0.0426
      assert.strictEqual(result.totalFSS, 946.26); // 883 + 63.26
    });

    it('should calculate FSS for high income ($100,000)', () => {
      const result = calculateFSS(100000);

      assert.strictEqual(result.tier1Amount, 5000);
      assert.strictEqual(result.tier2Amount, 53515);
      assert.strictEqual(result.tier2FSS, 883);
      assert.strictEqual(result.tier3Amount, 41485); // 100000 - 58515
      assert.strictEqual(result.tier3FSS, 1767.26); // 41485 * 0.0426
      assert.strictEqual(result.totalFSS, 2650.26);
    });
  });

  describe('calculateFSS - Validation', () => {
    it('should throw error for non-numeric input', () => {
      assert.throws(() => {
        calculateFSS('invalid');
      }, /Invalid net business income/);
    });
  });

  describe('calculateQPPContributions - Basic Calculations', () => {
    it('should calculate 0 QPP for income below basic exemption', () => {
      const result = calculateQPPContributions(3000);

      assert.strictEqual(result.netBusinessIncome, 3000);
      assert.strictEqual(result.basicExemption, 3500);
      assert.strictEqual(result.pensionableEarnings, 0);
      assert.strictEqual(result.totalContributions, 0);
      assert.strictEqual(result.deductibleAmount, 0);
    });

    it('should calculate 0 QPP at exactly basic exemption', () => {
      const result = calculateQPPContributions(3500);

      assert.strictEqual(result.pensionableEarnings, 0);
      assert.strictEqual(result.totalContributions, 0);
    });

    it('should calculate QPP for income of $20,000', () => {
      const result = calculateQPPContributions(20000);

      const expectedPensionable = 16500; // 20000 - 3500
      const expectedTotal = 2277; // 16500 * 0.138
      const expectedEmployee = 1138.5; // 16500 * 0.069
      const expectedEmployer = 1138.5; // 16500 * 0.069

      assert.strictEqual(result.pensionableEarnings, expectedPensionable);
      assert.strictEqual(result.totalContributions, expectedTotal);
      assert.strictEqual(result.employeeContributions, expectedEmployee);
      assert.strictEqual(result.employerContributions, expectedEmployer);
      assert.strictEqual(result.deductibleAmount, expectedEmployer);
    });

    it('should calculate QPP for income of $50,000', () => {
      const result = calculateQPPContributions(50000);

      const expectedPensionable = 46500; // 50000 - 3500
      const expectedTotal = 6417; // 46500 * 0.138
      const expectedEmployee = 3208.5; // 46500 * 0.069
      const expectedEmployer = 3208.5;

      assert.strictEqual(result.pensionableEarnings, expectedPensionable);
      assert.strictEqual(result.totalContributions, expectedTotal);
      assert.strictEqual(result.employeeContributions, expectedEmployee);
      assert.strictEqual(result.employerContributions, expectedEmployer);
      assert.strictEqual(result.deductibleAmount, expectedEmployer);
    });
  });

  describe('calculateQPPContributions - Maximum Pensionable Earnings', () => {
    it('should cap QPP at maximum pensionable earnings', () => {
      const result = calculateQPPContributions(100000);

      const maxPensionable = 69700; // 73200 - 3500
      const expectedTotal = 9618.6; // 69700 * 0.138
      const expectedEmployee = 4809.3; // 69700 * 0.069
      const expectedEmployer = 4809.3;

      assert.strictEqual(result.pensionableEarnings, maxPensionable);
      assert.strictEqual(result.totalContributions, expectedTotal);
      assert.strictEqual(result.employeeContributions, expectedEmployee);
      assert.strictEqual(result.employerContributions, expectedEmployer);
    });

    it('should calculate QPP at exactly max pensionable earnings', () => {
      const result = calculateQPPContributions(73200);

      const expectedPensionable = 69700; // 73200 - 3500

      assert.strictEqual(result.pensionableEarnings, expectedPensionable);
    });
  });

  describe('calculateQPPContributions - Deductible Employer Portion', () => {
    it('should identify employer portion as deductible', () => {
      const result = calculateQPPContributions(30000);

      assert.strictEqual(result.employerContributions, result.deductibleAmount);
      assert.ok(result.deductibleAmount > 0);
    });
  });

  describe('calculateQPPContributions - Validation', () => {
    it('should throw error for non-numeric input', () => {
      assert.throws(() => {
        calculateQPPContributions('invalid');
      }, /Invalid net business income/);
    });
  });

  describe('calculateTP80V - Income and Expenses', () => {
    it('should calculate Quebec form with same income/expenses as T2125', () => {
      const result = calculateTP80V({
        grossFares: 50000,
        commissions: -7500,
        otherIncome: 1000,
        expenses: {
          fuel: 8000,
          insurance: 2400,
          maintenance: 1500,
          cca: 4500
        }
      });

      assert.strictEqual(result.income.grossIncome, 43500);
      assert.strictEqual(result.expenses.totalExpenses, 16400);
      assert.strictEqual(result.netIncomeBeforeFSS, 27100);
    });

    it('should handle empty expenses', () => {
      const result = calculateTP80V({
        grossFares: 10000,
        expenses: {}
      });

      assert.strictEqual(result.income.grossIncome, 10000);
      assert.strictEqual(result.expenses.totalExpenses, 0);
      assert.strictEqual(result.netIncomeBeforeFSS, 10000);
    });
  });

  describe('calculateTP80V - FSS Integration', () => {
    it('should calculate FSS and deduct from net income', () => {
      const result = calculateTP80V({
        grossFares: 60000,
        commissions: -9000,
        otherIncome: 0,
        expenses: {
          fuel: 10000,
          insurance: 3000,
          maintenance: 2000,
          cca: 5000
        }
      });

      // Net before FSS: 51000 - 20000 = 31000
      assert.strictEqual(result.netIncomeBeforeFSS, 31000);
      
      // FSS on 31000: tier1=0, tier2=(26000*0.0165)=429
      assert.strictEqual(result.fss.totalFSS, 429);
      
      // Net after FSS: 31000 - 429 = 30571
      assert.strictEqual(result.netIncomeAfterFSS, 30571);
    });

    it('should not calculate FSS for business loss', () => {
      const result = calculateTP80V({
        grossFares: 10000,
        expenses: {
          fuel: 15000
        }
      });

      assert.strictEqual(result.netIncomeBeforeFSS, -5000);
      assert.strictEqual(result.fss.totalFSS, 0);
    });
  });

  describe('calculateTP80V - QPP Integration', () => {
    it('should calculate QPP on income after FSS', () => {
      const result = calculateTP80V({
        grossFares: 30000,
        commissions: -4500,
        expenses: {
          fuel: 5000,
          insurance: 2000
        }
      });

      // Net before FSS: 25500 - 7000 = 18500
      // FSS: tier2=(13500*0.0165)=222.75
      // Net after FSS: 18500 - 222.75 = 18277.25
      assert.strictEqual(result.netIncomeAfterFSS, 18277.25);
      
      // QPP on 18277.25: pensionable=(18277.25-3500)=14777.25
      // Total QPP: 14777.25 * 0.138 = 2039.26
      // Employer portion deductible: 1019.63
      assert.ok(result.qpp.totalContributions > 0);
      assert.ok(result.qpp.deductibleAmount > 0);
    });

    it('should deduct employer QPP portion from net income', () => {
      const result = calculateTP80V({
        grossFares: 40000,
        expenses: {
          fuel: 8000
        }
      });

      // Verify employer portion is deducted from final net income
      const expectedNetIncome = result.netIncomeAfterFSS - result.qpp.deductibleAmount;
      assert.strictEqual(result.netIncome, expectedNetIncome);
    });
  });

  describe('calculateTP80V - Validation', () => {
    it('should throw error for null business data', () => {
      assert.throws(() => {
        calculateTP80V(null);
      }, /Invalid business data/);
    });

    it('should throw error for negative gross fares', () => {
      assert.throws(() => {
        calculateTP80V({ grossFares: -1000, expenses: {} });
      }, /Invalid gross fares/);
    });
  });

  describe('generateTP80VForm - Form Generation', () => {
    it('should generate complete French form', () => {
      const form = generateTP80VForm(
        {
          name: 'Jean Chauffeur',
          nas: '123-456-789',
          address: '123 rue Principale, Montréal, QC',
          fiscalYear: 2026
        },
        {
          grossFares: 50000,
          commissions: -7500,
          expenses: {
            fuel: 8000,
            insurance: 2400
          }
        },
        'fr'
      );

      assert.strictEqual(form.formType, 'TP-80-V');
      assert.strictEqual(form.language, 'fr');
      assert.strictEqual(form.businessActivity, 'Chauffeur de covoiturage/taxi');
      assert.strictEqual(form.driverInfo.name, 'Jean Chauffeur');
      assert.ok(form.income);
      assert.ok(form.fss);
      assert.ok(form.qpp);
    });

    it('should generate complete English form', () => {
      const form = generateTP80VForm(
        { name: 'John Driver' },
        { grossFares: 30000, expenses: {} },
        'en'
      );

      assert.strictEqual(form.language, 'en');
      assert.strictEqual(form.businessActivity, 'Rideshare/Taxi Driver');
    });

    it('should default to French if language not specified', () => {
      const form = generateTP80VForm(
        { name: 'Test' },
        { grossFares: 10000, expenses: {} }
      );

      assert.strictEqual(form.language, 'fr');
    });

    it('should throw error for invalid language', () => {
      assert.throws(() => {
        generateTP80VForm(
          { name: 'Test' },
          { grossFares: 10000, expenses: {} },
          'es'
        );
      }, /Invalid language/);
    });

    it('should throw error for missing driver info', () => {
      assert.throws(() => {
        generateTP80VForm(null, { grossFares: 10000, expenses: {} });
      }, /Invalid driver info/);
    });

    it('should throw error for missing driver name', () => {
      assert.throws(() => {
        generateTP80VForm({}, { grossFares: 10000, expenses: {} });
      }, /Invalid driver name/);
    });

    it('should accept SIN or NAS field', () => {
      const form1 = generateTP80VForm(
        { name: 'Test', sin: '123-456-789' },
        { grossFares: 10000, expenses: {} }
      );
      assert.strictEqual(form1.driverInfo.nas, '123-456-789');

      const form2 = generateTP80VForm(
        { name: 'Test', nas: '987-654-321' },
        { grossFares: 10000, expenses: {} }
      );
      assert.strictEqual(form2.driverInfo.nas, '987-654-321');
    });
  });

  describe('exportTP80VAsText - Text Export', () => {
    it('should export form in French', () => {
      const form = generateTP80VForm(
        {
          name: 'Jean Chauffeur',
          nas: '123-456-789',
          fiscalYear: 2026
        },
        {
          grossFares: 50000,
          commissions: -7500,
          expenses: {
            fuel: 8000,
            insurance: 2400
          }
        },
        'fr'
      );

      const text = exportTP80VAsText(form);

      assert.ok(text.includes('REVENU QUÉBEC'));
      assert.ok(text.includes('TP-80-V'));
      assert.ok(text.includes('Jean Chauffeur'));
      assert.ok(text.includes('Chauffeur de covoiturage/taxi'));
      assert.ok(text.includes('FONDS DES SERVICES DE SANTÉ'));
      assert.ok(text.includes('RÉGIME DE RENTES DU QUÉBEC'));
    });

    it('should export form in English', () => {
      const form = generateTP80VForm(
        { name: 'John Driver' },
        { grossFares: 30000, expenses: {} },
        'en'
      );

      const text = exportTP80VAsText(form);

      assert.ok(text.includes('REVENU QUÉBEC'));
      assert.ok(text.includes('TP-80-V'));
      assert.ok(text.includes('John Driver'));
      assert.ok(text.includes('Rideshare/Taxi Driver'));
      assert.ok(text.includes('HEALTH SERVICES FUND'));
      assert.ok(text.includes('QUEBEC PENSION PLAN'));
    });

    it('should include all FSS tiers in export', () => {
      const form = generateTP80VForm(
        { name: 'Test' },
        { grossFares: 100000, expenses: { fuel: 10000 } },
        'en'
      );

      const text = exportTP80VAsText(form);

      assert.ok(text.includes('Tier 1'));
      assert.ok(text.includes('Tier 2'));
      assert.ok(text.includes('Tier 3'));
      assert.ok(text.includes('1.65%'));
      assert.ok(text.includes('4.26%'));
    });

    it('should include QPP details in export', () => {
      const form = generateTP80VForm(
        { name: 'Test' },
        { grossFares: 50000, expenses: {} },
        'en'
      );

      const text = exportTP80VAsText(form);

      assert.ok(text.includes('Basic Exemption'));
      assert.ok(text.includes('Pensionable Earnings'));
      assert.ok(text.includes('13.8%'));
      assert.ok(text.includes('Employee Contributions'));
      assert.ok(text.includes('Employer Contributions'));
    });

    it('should throw error for invalid form data', () => {
      assert.throws(() => {
        exportTP80VAsText(null);
      }, /Invalid form data/);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle full-time driver with $70k gross income', () => {
      const result = calculateTP80V({
        grossFares: 70000,
        commissions: -10500,
        otherIncome: 500,
        expenses: {
          fuel: 12000,
          insurance: 3600,
          maintenance: 2500,
          telephone: 1200,
          supplies: 300,
          licenses: 500,
          cca: 6000
        }
      });

      // Net before FSS: 60000 - 26100 = 33900
      assert.strictEqual(result.netIncomeBeforeFSS, 33900);
      
      // FSS should be calculated on tier 2 and 3
      assert.ok(result.fss.totalFSS > 0);
      assert.ok(result.qpp.totalContributions > 0);
      assert.ok(result.netIncome > 0);
    });

    it('should handle part-time driver with $25k gross income', () => {
      const result = calculateTP80V({
        grossFares: 25000,
        commissions: -3750,
        expenses: {
          fuel: 4000,
          insurance: 1800,
          cca: 2000
        }
      });

      // Net before FSS: 21250 - 7800 = 13450
      assert.strictEqual(result.netIncomeBeforeFSS, 13450);
      
      // FSS tier 2 only
      assert.ok(result.fss.tier2FSS > 0);
      assert.strictEqual(result.fss.tier3FSS, 0);
      
      // QPP contributions
      assert.ok(result.qpp.totalContributions > 0);
    });

    it('should handle business loss (no FSS or QPP)', () => {
      const result = calculateTP80V({
        grossFares: 10000,
        commissions: -1500,
        expenses: {
          fuel: 5000,
          insurance: 2400,
          maintenance: 2000,
          cca: 3000
        }
      });

      // Loss scenario
      assert.ok(result.netIncomeBeforeFSS < 0);
      assert.strictEqual(result.fss.totalFSS, 0);
      assert.strictEqual(result.qpp.totalContributions, 0);
    });
  });
});
