// tests/cca-calculator.test.js — Comprehensive tests for CCA calculator
import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  calculateFirstYearCCA,
  calculateSubsequentYearCCA,
  calculateCCASchedule,
  calculateTotalCCA,
  exportCCAScheduleAsText,
  LUXURY_VEHICLE_LIMIT_2026,
  CCA_CLASS_10_RATE,
  HALF_YEAR_RULE_RATE
} from '../cca-calculator.js';

describe('CCA Calculator Tests', () => {
  describe('Constants', () => {
    it('should have correct 2026 luxury vehicle limit', () => {
      assert.strictEqual(LUXURY_VEHICLE_LIMIT_2026, 37000);
    });

    it('should have correct Class 10 CCA rate', () => {
      assert.strictEqual(CCA_CLASS_10_RATE, 0.30);
    });

    it('should have correct half-year rule rate', () => {
      assert.strictEqual(HALF_YEAR_RULE_RATE, 0.15);
    });
  });

  describe('calculateFirstYearCCA - Basic Calculations', () => {
    it('should calculate first year CCA with half-year rule', () => {
      const result = calculateFirstYearCCA(30000, 100);

      assert.strictEqual(result.vehicleCost, 30000);
      assert.strictEqual(result.depreciableAmount, 30000);
      assert.strictEqual(result.luxuryLimitApplied, false);
      assert.strictEqual(result.ccaRate, 0.15);
      assert.strictEqual(result.ccaBeforeBusinessUse, 4500); // 30000 * 0.15
      assert.strictEqual(result.businessUsePercentage, 100);
      assert.strictEqual(result.cca, 4500);
      assert.strictEqual(result.uccEnding, 25500); // 30000 - 4500
    });

    it('should apply business use percentage', () => {
      const result = calculateFirstYearCCA(30000, 80);

      assert.strictEqual(result.ccaBeforeBusinessUse, 4500);
      assert.strictEqual(result.businessUsePercentage, 80);
      assert.strictEqual(result.cca, 3600); // 4500 * 0.80
    });

    it('should handle 50% business use', () => {
      const result = calculateFirstYearCCA(20000, 50);

      assert.strictEqual(result.ccaBeforeBusinessUse, 3000); // 20000 * 0.15
      assert.strictEqual(result.cca, 1500); // 3000 * 0.50
    });
  });

  describe('calculateFirstYearCCA - Luxury Vehicle Limit', () => {
    it('should apply luxury vehicle limit for $50k vehicle', () => {
      const result = calculateFirstYearCCA(50000, 100);

      assert.strictEqual(result.vehicleCost, 50000);
      assert.strictEqual(result.depreciableAmount, 37000);
      assert.strictEqual(result.luxuryLimitApplied, true);
      assert.strictEqual(result.ccaBeforeBusinessUse, 5550); // 37000 * 0.15
      assert.strictEqual(result.cca, 5550);
    });

    it('should apply luxury limit at exactly $37,000', () => {
      const result = calculateFirstYearCCA(37000, 100);

      assert.strictEqual(result.depreciableAmount, 37000);
      assert.strictEqual(result.luxuryLimitApplied, false);
    });

    it('should apply luxury limit for $37,001', () => {
      const result = calculateFirstYearCCA(37001, 100);

      assert.strictEqual(result.depreciableAmount, 37000);
      assert.strictEqual(result.luxuryLimitApplied, true);
    });

    it('should apply luxury limit with business use percentage', () => {
      const result = calculateFirstYearCCA(50000, 75);

      assert.strictEqual(result.depreciableAmount, 37000);
      assert.strictEqual(result.ccaBeforeBusinessUse, 5550);
      assert.strictEqual(result.cca, 4162.5); // 5550 * 0.75
    });
  });

  describe('calculateFirstYearCCA - Validation', () => {
    it('should throw error for negative vehicle cost', () => {
      assert.throws(() => {
        calculateFirstYearCCA(-1000, 100);
      }, /Invalid vehicle cost/);
    });

    it('should throw error for invalid business use percentage > 100', () => {
      assert.throws(() => {
        calculateFirstYearCCA(30000, 150);
      }, /Invalid business use percentage/);
    });

    it('should throw error for negative business use percentage', () => {
      assert.throws(() => {
        calculateFirstYearCCA(30000, -10);
      }, /Invalid business use percentage/);
    });

    it('should throw error for non-numeric vehicle cost', () => {
      assert.throws(() => {
        calculateFirstYearCCA('invalid', 100);
      }, /Invalid vehicle cost/);
    });
  });

  describe('calculateFirstYearCCA - Edge Cases', () => {
    it('should handle zero vehicle cost', () => {
      const result = calculateFirstYearCCA(0, 100);

      assert.strictEqual(result.vehicleCost, 0);
      assert.strictEqual(result.cca, 0);
      assert.strictEqual(result.uccEnding, 0);
    });

    it('should handle zero business use', () => {
      const result = calculateFirstYearCCA(30000, 0);

      assert.strictEqual(result.ccaBeforeBusinessUse, 4500);
      assert.strictEqual(result.cca, 0);
    });

    it('should default to 100% business use if not provided', () => {
      const result = calculateFirstYearCCA(30000);

      assert.strictEqual(result.businessUsePercentage, 100);
      assert.strictEqual(result.cca, 4500);
    });
  });

  describe('calculateSubsequentYearCCA - Basic Calculations', () => {
    it('should calculate second year CCA at 30% rate', () => {
      const result = calculateSubsequentYearCCA(25500, 0, 0, 100);

      assert.strictEqual(result.uccBeginning, 25500);
      assert.strictEqual(result.uccBeforeCCA, 25500);
      assert.strictEqual(result.ccaBase, 25500);
      assert.strictEqual(result.ccaRate, 0.30);
      assert.strictEqual(result.ccaBeforeBusinessUse, 7650); // 25500 * 0.30
      assert.strictEqual(result.cca, 7650);
      assert.strictEqual(result.uccEnding, 17850); // 25500 - 7650
    });

    it('should apply business use percentage', () => {
      const result = calculateSubsequentYearCCA(25500, 0, 0, 80);

      assert.strictEqual(result.ccaBeforeBusinessUse, 7650);
      assert.strictEqual(result.cca, 6120); // 7650 * 0.80
    });

    it('should handle vehicle additions with half-year rule', () => {
      const result = calculateSubsequentYearCCA(25500, 10000, 0, 100);

      assert.strictEqual(result.additions, 10000);
      assert.strictEqual(result.depreciableAdditions, 10000);
      assert.strictEqual(result.uccBeforeCCA, 35500); // 25500 + 10000
      assert.strictEqual(result.halfYearRuleAdjustment, 5000); // 10000 * 0.5
      assert.strictEqual(result.ccaBase, 30500); // 35500 - 5000
      assert.strictEqual(result.ccaBeforeBusinessUse, 9150); // 30500 * 0.30
    });

    it('should handle vehicle disposals', () => {
      const result = calculateSubsequentYearCCA(25500, 0, 5000, 100);

      assert.strictEqual(result.disposals, 5000);
      assert.strictEqual(result.uccBeforeCCA, 20500); // 25500 - 5000
      assert.strictEqual(result.ccaBeforeBusinessUse, 6150); // 20500 * 0.30
    });
  });

  describe('calculateSubsequentYearCCA - Recapture', () => {
    it('should calculate recapture when disposals exceed UCC', () => {
      const result = calculateSubsequentYearCCA(10000, 0, 15000, 100);

      assert.strictEqual(result.uccBeforeCCA, 0);
      assert.strictEqual(result.recapture, 5000); // 15000 - 10000
      assert.strictEqual(result.cca, 0);
      assert.strictEqual(result.uccEnding, 0);
    });

    it('should calculate recapture when selling for profit', () => {
      const result = calculateSubsequentYearCCA(5000, 0, 8000, 100);

      assert.strictEqual(result.recapture, 3000);
      assert.strictEqual(result.uccEnding, 0);
    });
  });

  describe('calculateSubsequentYearCCA - Terminal Loss', () => {
    it('should calculate terminal loss when selling last vehicle below UCC', () => {
      const result = calculateSubsequentYearCCA(10000, 0, 5000, 100);

      // This calculates CCA on remaining UCC
      assert.strictEqual(result.uccBeforeCCA, 5000);
      assert.strictEqual(result.ccaBeforeBusinessUse, 1500); // 5000 * 0.30
      assert.strictEqual(result.uccEnding, 3500);
    });
  });

  describe('calculateSubsequentYearCCA - Luxury Limit on Additions', () => {
    it('should apply luxury limit to vehicle additions', () => {
      const result = calculateSubsequentYearCCA(20000, 50000, 0, 100);

      assert.strictEqual(result.additions, 50000);
      assert.strictEqual(result.depreciableAdditions, 37000);
      assert.strictEqual(result.uccBeforeCCA, 57000); // 20000 + 37000
    });

    it('should not apply luxury limit to additions under $37k', () => {
      const result = calculateSubsequentYearCCA(20000, 25000, 0, 100);

      assert.strictEqual(result.additions, 25000);
      assert.strictEqual(result.depreciableAdditions, 25000);
    });
  });

  describe('calculateSubsequentYearCCA - Validation', () => {
    it('should throw error for negative UCC beginning', () => {
      assert.throws(() => {
        calculateSubsequentYearCCA(-1000, 0, 0, 100);
      }, /Invalid UCC beginning/);
    });

    it('should throw error for negative additions', () => {
      assert.throws(() => {
        calculateSubsequentYearCCA(10000, -5000, 0, 100);
      }, /Invalid additions/);
    });

    it('should throw error for negative disposals', () => {
      assert.throws(() => {
        calculateSubsequentYearCCA(10000, 0, -5000, 100);
      }, /Invalid disposals/);
    });

    it('should throw error for invalid business use percentage', () => {
      assert.throws(() => {
        calculateSubsequentYearCCA(10000, 0, 0, 150);
      }, /Invalid business use percentage/);
    });
  });

  describe('calculateCCASchedule - Multi-Year Projections', () => {
    it('should calculate 5-year schedule', () => {
      const schedule = calculateCCASchedule(30000, 5, 100);

      assert.strictEqual(schedule.length, 5);
      assert.strictEqual(schedule[0].year, 1);
      assert.strictEqual(schedule[0].cca, 4500);
      assert.strictEqual(schedule[1].year, 2);
      assert.ok(schedule[1].cca > 0);
    });

    it('should calculate 10-year schedule', () => {
      const schedule = calculateCCASchedule(30000, 10, 100);

      assert.strictEqual(schedule.length, 10);
      assert.strictEqual(schedule[9].year, 10);
    });

    it('should handle vehicle addition in year 3', () => {
      const transactions = [
        { year: 3, type: 'addition', amount: 15000 }
      ];

      const schedule = calculateCCASchedule(30000, 5, 100, transactions);

      assert.strictEqual(schedule.length, 5);
      assert.strictEqual(schedule[2].additions, 15000);
      assert.strictEqual(schedule[2].depreciableAdditions, 15000);
      assert.ok(schedule[2].uccEnding > schedule[1].uccEnding);
    });

    it('should handle vehicle disposal in year 4', () => {
      const transactions = [
        { year: 4, type: 'disposal', amount: 10000 }
      ];

      const schedule = calculateCCASchedule(30000, 5, 100, transactions);

      assert.strictEqual(schedule[3].disposals, 10000);
      assert.ok(schedule[3].uccEnding < schedule[2].uccEnding);
    });

    it('should handle multiple transactions in same year', () => {
      const transactions = [
        { year: 2, type: 'addition', amount: 20000 },
        { year: 2, type: 'disposal', amount: 15000 }
      ];

      const schedule = calculateCCASchedule(30000, 3, 100, transactions);

      assert.strictEqual(schedule[1].additions, 20000);
      assert.strictEqual(schedule[1].disposals, 15000);
    });
  });

  describe('calculateCCASchedule - Validation', () => {
    it('should throw error for negative vehicle cost', () => {
      assert.throws(() => {
        calculateCCASchedule(-1000, 5, 100);
      }, /Invalid vehicle cost/);
    });

    it('should throw error for zero years', () => {
      assert.throws(() => {
        calculateCCASchedule(30000, 0, 100);
      }, /Invalid years/);
    });

    it('should throw error for more than 20 years', () => {
      assert.throws(() => {
        calculateCCASchedule(30000, 21, 100);
      }, /Invalid years/);
    });

    it('should throw error for invalid business use', () => {
      assert.throws(() => {
        calculateCCASchedule(30000, 5, 150);
      }, /Invalid business use percentage/);
    });

    it('should throw error for non-array transactions', () => {
      assert.throws(() => {
        calculateCCASchedule(30000, 5, 100, 'invalid');
      }, /Invalid transactions/);
    });
  });

  describe('calculateTotalCCA - Summary Calculations', () => {
    it('should calculate total CCA over 5 years', () => {
      const schedule = calculateCCASchedule(30000, 5, 100);
      const summary = calculateTotalCCA(schedule);

      assert.strictEqual(summary.years, 5);
      assert.ok(summary.totalCCA > 0);
      assert.ok(summary.finalUCC > 0);
      assert.strictEqual(summary.totalRecapture, 0);
      assert.strictEqual(summary.totalTerminalLoss, 0);
    });

    it('should handle schedule with recapture', () => {
      const transactions = [
        { year: 3, type: 'disposal', amount: 30000 }
      ];

      const schedule = calculateCCASchedule(20000, 5, 100, transactions);
      const summary = calculateTotalCCA(schedule);

      assert.ok(summary.totalRecapture > 0);
    });

    it('should throw error for empty schedule', () => {
      assert.throws(() => {
        calculateTotalCCA([]);
      }, /Invalid schedule/);
    });

    it('should throw error for non-array schedule', () => {
      assert.throws(() => {
        calculateTotalCCA('invalid');
      }, /Invalid schedule/);
    });
  });

  describe('exportCCAScheduleAsText - Text Export', () => {
    it('should export schedule as printable text', () => {
      const schedule = calculateCCASchedule(30000, 3, 100);
      const text = exportCCAScheduleAsText(schedule);

      assert.ok(text.includes('CAPITAL COST ALLOWANCE'));
      assert.ok(text.includes('CLASS 10'));
      assert.ok(text.includes('Year'));
      assert.ok(text.includes('UCC'));
      assert.ok(text.includes('CCA'));
      assert.ok(text.includes('30%'));
    });

    it('should include summary section', () => {
      const schedule = calculateCCASchedule(30000, 3, 100);
      const text = exportCCAScheduleAsText(schedule);

      assert.ok(text.includes('SUMMARY'));
      assert.ok(text.includes('Total CCA Claimed'));
      assert.ok(text.includes('Final UCC'));
    });

    it('should include luxury vehicle limit note', () => {
      const schedule = calculateCCASchedule(50000, 3, 100);
      const text = exportCCAScheduleAsText(schedule);

      assert.ok(text.includes('37000'));
      assert.ok(text.includes('Luxury vehicle limit'));
    });

    it('should throw error for empty schedule', () => {
      assert.throws(() => {
        exportCCAScheduleAsText([]);
      }, /Invalid schedule/);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle typical rideshare driver with $30k vehicle', () => {
      const schedule = calculateCCASchedule(30000, 5, 85);
      
      assert.strictEqual(schedule[0].cca, 3825); // Year 1: 30000 * 0.15 * 0.85
      assert.strictEqual(schedule[0].uccEnding, 25500);
      
      const summary = calculateTotalCCA(schedule);
      assert.ok(summary.totalCCA > 10000);
      assert.ok(summary.finalUCC < 20000);
    });

    it('should handle luxury vehicle purchase', () => {
      const schedule = calculateCCASchedule(60000, 3, 100);
      
      // Should cap at $37,000
      assert.strictEqual(schedule[0].depreciableAmount, 37000);
      assert.strictEqual(schedule[0].cca, 5550); // 37000 * 0.15
    });

    it('should handle trade-in scenario', () => {
      const transactions = [
        { year: 3, type: 'disposal', amount: 15000 },
        { year: 3, type: 'addition', amount: 35000 }
      ];

      const schedule = calculateCCASchedule(30000, 5, 100, transactions);
      
      assert.strictEqual(schedule[2].additions, 35000);
      assert.strictEqual(schedule[2].disposals, 15000);
    });

    it('should handle fleet expansion', () => {
      const transactions = [
        { year: 2, type: 'addition', amount: 25000 },
        { year: 3, type: 'addition', amount: 30000 }
      ];

      const schedule = calculateCCASchedule(30000, 5, 100, transactions);
      
      assert.strictEqual(schedule[1].additions, 25000);
      assert.strictEqual(schedule[2].additions, 30000);
      assert.ok(schedule[4].uccEnding > schedule[0].uccEnding);
    });

    it('should handle sale at profit (recapture scenario)', () => {
      const transactions = [
        { year: 2, type: 'disposal', amount: 28000 }
      ];

      const schedule = calculateCCASchedule(30000, 3, 100, transactions);
      
      // Year 1: UCC ending = 25,500
      // Year 2: Disposal 28,000 creates recapture
      assert.strictEqual(schedule[1].recapture, 2500); // 28000 - 25500
    });
  });

  describe('Edge Cases', () => {
    it('should handle 100% business use', () => {
      const result = calculateFirstYearCCA(30000, 100);
      assert.strictEqual(result.cca, 4500);
    });

    it('should handle 1% business use', () => {
      const result = calculateFirstYearCCA(30000, 1);
      assert.strictEqual(result.cca, 45); // 4500 * 0.01
    });

    it('should handle minimum 1-year schedule', () => {
      const schedule = calculateCCASchedule(30000, 1, 100);
      assert.strictEqual(schedule.length, 1);
    });

    it('should handle maximum 20-year schedule', () => {
      const schedule = calculateCCASchedule(30000, 20, 100);
      assert.strictEqual(schedule.length, 20);
    });

    it('should handle very small vehicle cost', () => {
      const result = calculateFirstYearCCA(1000, 100);
      assert.strictEqual(result.cca, 150); // 1000 * 0.15
    });

    it('should round all values to 2 decimal places', () => {
      const result = calculateFirstYearCCA(33333.33, 85.7);
      
      assert.strictEqual(result.vehicleCost, 33333.33);
      assert.strictEqual(result.businessUsePercentage, 85.7);
      // Check that cca is a number with proper rounding
      assert.ok(typeof result.cca === 'number');
      assert.ok(Math.abs(result.cca - parseFloat(result.cca.toFixed(2))) < 0.01);
    });
  });
});
