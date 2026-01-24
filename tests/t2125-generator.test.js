// tests/t2125-generator.test.js — Comprehensive tests for T2125 form generator
import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  calculateT2125,
  generateT2125Form,
  exportT2125AsText,
  BUSINESS_CODE_RIDESHARE,
  T2125_LINE_CODES
} from '../t2125-generator.js';

describe('T2125 Generator Tests', () => {
  describe('Constants', () => {
    it('should have correct business code for rideshare/taxi', () => {
      assert.strictEqual(BUSINESS_CODE_RIDESHARE, '485310');
    });

    it('should have all required T2125 line codes', () => {
      assert.strictEqual(T2125_LINE_CODES.ADVERTISING, '8521');
      assert.strictEqual(T2125_LINE_CODES.INSURANCE, '8690');
      assert.strictEqual(T2125_LINE_CODES.MAINTENANCE, '8960');
      assert.strictEqual(T2125_LINE_CODES.OFFICE, '8810');
      assert.strictEqual(T2125_LINE_CODES.SUPPLIES, '8811');
      assert.strictEqual(T2125_LINE_CODES.TELEPHONE, '9220');
      assert.strictEqual(T2125_LINE_CODES.FUEL, '9281');
      assert.strictEqual(T2125_LINE_CODES.CCA, '9936');
    });
  });

  describe('calculateT2125 - Income Calculations', () => {
    it('should calculate gross income correctly', () => {
      const result = calculateT2125({
        grossFares: 50000,
        commissions: -7500,
        otherIncome: 1000,
        expenses: {}
      });

      assert.strictEqual(result.income.grossFares, 50000);
      assert.strictEqual(result.income.commissions, -7500);
      assert.strictEqual(result.income.otherIncome, 1000);
      assert.strictEqual(result.income.grossIncome, 43500);
    });

    it('should handle zero income', () => {
      const result = calculateT2125({
        grossFares: 0,
        commissions: 0,
        otherIncome: 0,
        expenses: {}
      });

      assert.strictEqual(result.income.grossIncome, 0);
      assert.strictEqual(result.netIncome, 0);
    });

    it('should throw error for negative gross fares', () => {
      assert.throws(() => {
        calculateT2125({
          grossFares: -1000,
          commissions: 0,
          otherIncome: 0,
          expenses: {}
        });
      }, /Invalid gross fares/);
    });

    it('should handle missing income fields as zero', () => {
      const result = calculateT2125({
        grossFares: 10000,
        expenses: {}
      });

      assert.strictEqual(result.income.commissions, 0);
      assert.strictEqual(result.income.otherIncome, 0);
      assert.strictEqual(result.income.grossIncome, 10000);
    });
  });

  describe('calculateT2125 - Expense Tracking', () => {
    it('should calculate all expense categories', () => {
      const result = calculateT2125({
        grossFares: 50000,
        commissions: -7500,
        otherIncome: 0,
        expenses: {
          advertising: 500,
          insurance: 2400,
          maintenance: 1500,
          office: 300,
          supplies: 200,
          telephone: 960,
          fuel: 8000,
          vehicle: 1000,
          licenses: 400,
          cca: 4500
        }
      });

      assert.strictEqual(result.expenses.advertising, 500);
      assert.strictEqual(result.expenses.insurance, 2400);
      assert.strictEqual(result.expenses.maintenance, 1500);
      assert.strictEqual(result.expenses.office, 300);
      assert.strictEqual(result.expenses.supplies, 200);
      assert.strictEqual(result.expenses.telephone, 960);
      assert.strictEqual(result.expenses.fuel, 8000);
      assert.strictEqual(result.expenses.vehicle, 1000);
      assert.strictEqual(result.expenses.licenses, 400);
      assert.strictEqual(result.expenses.cca, 4500);
      assert.strictEqual(result.expenses.totalExpenses, 19760);
    });

    it('should handle missing expense categories as zero', () => {
      const result = calculateT2125({
        grossFares: 10000,
        expenses: {
          fuel: 2000
        }
      });

      assert.strictEqual(result.expenses.fuel, 2000);
      assert.strictEqual(result.expenses.insurance, 0);
      assert.strictEqual(result.expenses.maintenance, 0);
      assert.strictEqual(result.expenses.totalExpenses, 2000);
    });

    it('should reject negative expenses', () => {
      const result = calculateT2125({
        grossFares: 10000,
        expenses: {
          fuel: -500
        }
      });

      // Negative expenses should be treated as 0
      assert.strictEqual(result.expenses.fuel, 0);
    });

    it('should handle empty expenses object', () => {
      const result = calculateT2125({
        grossFares: 10000,
        expenses: {}
      });

      assert.strictEqual(result.expenses.totalExpenses, 0);
      assert.strictEqual(result.netIncome, 10000);
    });
  });

  describe('calculateT2125 - Net Income Calculation', () => {
    it('should calculate net income correctly', () => {
      const result = calculateT2125({
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
      assert.strictEqual(result.netIncome, 27100);
    });

    it('should handle business loss scenario', () => {
      const result = calculateT2125({
        grossFares: 10000,
        commissions: -1500,
        otherIncome: 0,
        expenses: {
          fuel: 5000,
          insurance: 2400,
          maintenance: 2000,
          cca: 3000
        }
      });

      assert.strictEqual(result.income.grossIncome, 8500);
      assert.strictEqual(result.expenses.totalExpenses, 12400);
      assert.strictEqual(result.netIncome, -3900);
    });

    it('should round all financial values to 2 decimal places', () => {
      const result = calculateT2125({
        grossFares: 50000.456,
        commissions: -7500.789,
        otherIncome: 1000.123,
        expenses: {
          fuel: 8000.999
        }
      });

      assert.strictEqual(result.income.grossFares, 50000.46);
      assert.strictEqual(result.income.commissions, -7500.79);
      assert.strictEqual(result.income.otherIncome, 1000.12);
      assert.strictEqual(result.expenses.fuel, 8001);
    });
  });

  describe('calculateT2125 - Validation', () => {
    it('should throw error for null business data', () => {
      assert.throws(() => {
        calculateT2125(null);
      }, /Invalid business data/);
    });

    it('should throw error for non-object business data', () => {
      assert.throws(() => {
        calculateT2125('invalid');
      }, /Invalid business data/);
    });
  });

  describe('generateT2125Form - Form Generation', () => {
    it('should generate complete form with all sections', () => {
      const driverInfo = {
        name: 'John Driver',
        sin: '123-456-789',
        address: '123 Main St, Montreal, QC',
        fiscalYear: 2026
      };

      const businessData = {
        grossFares: 50000,
        commissions: -7500,
        otherIncome: 1000,
        expenses: {
          fuel: 8000,
          insurance: 2400,
          maintenance: 1500,
          cca: 4500
        }
      };

      const form = generateT2125Form(driverInfo, businessData);

      assert.strictEqual(form.formType, 'T2125');
      assert.strictEqual(form.businessCode, BUSINESS_CODE_RIDESHARE);
      assert.strictEqual(form.businessActivity, 'Rideshare/Taxi Driver');
      assert.strictEqual(form.driverInfo.name, 'John Driver');
      assert.strictEqual(form.driverInfo.sin, '123-456-789');
      assert.strictEqual(form.driverInfo.fiscalYear, 2026);
      assert.ok(form.income);
      assert.ok(form.expenses);
      assert.ok(form.generatedDate);
    });

    it('should throw error for missing driver info', () => {
      assert.throws(() => {
        generateT2125Form(null, { grossFares: 10000, expenses: {} });
      }, /Invalid driver info/);
    });

    it('should throw error for missing driver name', () => {
      assert.throws(() => {
        generateT2125Form({ sin: '123-456-789' }, { grossFares: 10000, expenses: {} });
      }, /Invalid driver name/);
    });

    it('should use current year if fiscal year not provided', () => {
      const form = generateT2125Form(
        { name: 'John Driver' },
        { grossFares: 10000, expenses: {} }
      );

      assert.strictEqual(form.driverInfo.fiscalYear, new Date().getFullYear());
    });

    it('should handle missing optional driver fields', () => {
      const form = generateT2125Form(
        { name: 'John Driver' },
        { grossFares: 10000, expenses: {} }
      );

      assert.strictEqual(form.driverInfo.sin, '');
      assert.strictEqual(form.driverInfo.address, '');
    });
  });

  describe('exportT2125AsText - Text Export', () => {
    it('should export form as printable text', () => {
      const formData = generateT2125Form(
        {
          name: 'John Driver',
          sin: '123-456-789',
          address: '123 Main St',
          fiscalYear: 2026
        },
        {
          grossFares: 50000,
          commissions: -7500,
          otherIncome: 1000,
          expenses: {
            advertising: 500,
            insurance: 2400,
            fuel: 8000,
            cca: 4500
          }
        }
      );

      const text = exportT2125AsText(formData);

      assert.ok(text.includes('T2125'));
      assert.ok(text.includes('John Driver'));
      assert.ok(text.includes('123-456-789'));
      assert.ok(text.includes('485310'));
      assert.ok(text.includes('50000.00'));
      assert.ok(text.includes('Rideshare/Taxi Driver'));
    });

    it('should include all income and expense lines', () => {
      const formData = generateT2125Form(
        { name: 'Test Driver' },
        {
          grossFares: 10000,
          expenses: {
            advertising: 100,
            insurance: 200,
            maintenance: 300,
            office: 50,
            supplies: 75,
            telephone: 80,
            fuel: 1000,
            vehicle: 150,
            licenses: 100,
            cca: 500
          }
        }
      );

      const text = exportT2125AsText(formData);

      assert.ok(text.includes('Advertising'));
      assert.ok(text.includes('Insurance'));
      assert.ok(text.includes('Maintenance'));
      assert.ok(text.includes('Office'));
      assert.ok(text.includes('Supplies'));
      assert.ok(text.includes('Telephone'));
      assert.ok(text.includes('Fuel'));
      assert.ok(text.includes('Vehicle'));
      assert.ok(text.includes('Licenses'));
      assert.ok(text.includes('Capital Cost Allowance'));
    });

    it('should throw error for invalid form data', () => {
      assert.throws(() => {
        exportT2125AsText(null);
      }, /Invalid form data/);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle full-time driver with $80k gross income', () => {
      const result = calculateT2125({
        grossFares: 80000,
        commissions: -12000,
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

      assert.strictEqual(result.income.grossIncome, 68500);
      assert.strictEqual(result.expenses.totalExpenses, 26100);
      assert.strictEqual(result.netIncome, 42400);
    });

    it('should handle part-time driver with $25k gross income', () => {
      const result = calculateT2125({
        grossFares: 25000,
        commissions: -3750,
        otherIncome: 0,
        expenses: {
          fuel: 4000,
          insurance: 1800,
          maintenance: 800,
          telephone: 600,
          cca: 2000
        }
      });

      assert.strictEqual(result.income.grossIncome, 21250);
      assert.strictEqual(result.expenses.totalExpenses, 9200);
      assert.strictEqual(result.netIncome, 12050);
    });

    it('should handle first-year driver with high expenses (loss)', () => {
      const result = calculateT2125({
        grossFares: 15000,
        commissions: -2250,
        otherIncome: 0,
        expenses: {
          fuel: 5000,
          insurance: 3600,
          maintenance: 1500,
          telephone: 960,
          supplies: 500,
          licenses: 800,
          cca: 5550 // First year with new vehicle
        }
      });

      assert.strictEqual(result.income.grossIncome, 12750);
      assert.strictEqual(result.expenses.totalExpenses, 17910);
      assert.strictEqual(result.netIncome, -5160);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small amounts', () => {
      const result = calculateT2125({
        grossFares: 0.01,
        commissions: -0.01,
        otherIncome: 0.01,
        expenses: {
          fuel: 0.01
        }
      });

      assert.strictEqual(result.income.grossIncome, 0.01);
      assert.strictEqual(result.expenses.totalExpenses, 0.01);
      assert.strictEqual(result.netIncome, 0);
    });

    it('should handle large amounts', () => {
      const result = calculateT2125({
        grossFares: 500000,
        commissions: -75000,
        otherIncome: 10000,
        expenses: {
          fuel: 50000,
          insurance: 10000,
          maintenance: 15000,
          cca: 20000
        }
      });

      assert.strictEqual(result.income.grossIncome, 435000);
      assert.strictEqual(result.expenses.totalExpenses, 95000);
      assert.strictEqual(result.netIncome, 340000);
    });

    it('should handle string inputs by converting to numbers', () => {
      const result = calculateT2125({
        grossFares: '10000',
        commissions: '-1500',
        otherIncome: '500',
        expenses: {
          fuel: '2000'
        }
      });

      assert.strictEqual(result.income.grossIncome, 9000);
      assert.strictEqual(result.expenses.fuel, 2000);
      assert.strictEqual(result.netIncome, 7000);
    });
  });
});
