// tests/gst-qst-tracker.test.js — Comprehensive tests for GST/QST tracker
import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  trackQuarterlyRevenue,
  calculateITC,
  calculateGSTQST,
  isRegistrationRequired,
  getFilingDeadlines,
  getCombinedRate,
  GST_RATE,
  QST_RATE,
  REGISTRATION_THRESHOLD
} from '../gst-qst-tracker.js';

describe('GST/QST Tracker Tests', () => {
  describe('Constants', () => {
    it('should have correct GST rate (5%)', () => {
      assert.strictEqual(GST_RATE, 0.05);
    });

    it('should have correct QST rate (9.975%)', () => {
      assert.strictEqual(QST_RATE, 0.09975);
    });

    it('should have correct registration threshold ($30,000)', () => {
      assert.strictEqual(REGISTRATION_THRESHOLD, 30000);
    });
  });

  describe('trackQuarterlyRevenue - Basic Tracking', () => {
    it('should handle empty quarters array', () => {
      const result = trackQuarterlyRevenue([]);

      assert.strictEqual(result.totalRevenue, 0);
      assert.strictEqual(result.quarterCount, 0);
      assert.strictEqual(result.rollingFourQuarterRevenue, 0);
      assert.strictEqual(result.registrationRequired, false);
      assert.strictEqual(result.remainingBeforeThreshold, 30000);
    });

    it('should track single quarter revenue', () => {
      const result = trackQuarterlyRevenue([
        { quarter: 1, year: 2026, revenue: 8000 }
      ]);

      assert.strictEqual(result.totalRevenue, 8000);
      assert.strictEqual(result.quarterCount, 1);
      assert.strictEqual(result.rollingFourQuarterRevenue, 8000);
      assert.strictEqual(result.registrationRequired, false);
    });

    it('should track multiple quarters', () => {
      const result = trackQuarterlyRevenue([
        { quarter: 1, year: 2026, revenue: 8000 },
        { quarter: 2, year: 2026, revenue: 7500 },
        { quarter: 3, year: 2026, revenue: 9000 }
      ]);

      assert.strictEqual(result.totalRevenue, 24500);
      assert.strictEqual(result.quarterCount, 3);
      assert.strictEqual(result.rollingFourQuarterRevenue, 24500);
    });

    it('should calculate rolling 4-quarter revenue', () => {
      const result = trackQuarterlyRevenue([
        { quarter: 1, year: 2026, revenue: 8000 },
        { quarter: 2, year: 2026, revenue: 7500 },
        { quarter: 3, year: 2026, revenue: 9000 },
        { quarter: 4, year: 2026, revenue: 8500 }
      ]);

      assert.strictEqual(result.rollingFourQuarterRevenue, 33000);
      assert.strictEqual(result.totalRevenue, 33000);
    });

    it('should use only last 4 quarters for rolling calculation', () => {
      const result = trackQuarterlyRevenue([
        { quarter: 1, year: 2025, revenue: 5000 },
        { quarter: 2, year: 2025, revenue: 5000 },
        { quarter: 3, year: 2026, revenue: 8000 },
        { quarter: 4, year: 2026, revenue: 8000 },
        { quarter: 1, year: 2027, revenue: 9000 },
        { quarter: 2, year: 2027, revenue: 9000 }
      ]);

      // Last 4 quarters: 8000 + 8000 + 9000 + 9000 = 34000
      assert.strictEqual(result.rollingFourQuarterRevenue, 34000);
      assert.strictEqual(result.totalRevenue, 44000);
    });
  });

  describe('trackQuarterlyRevenue - Registration Threshold', () => {
    it('should require registration when exceeding $30,000', () => {
      const result = trackQuarterlyRevenue([
        { quarter: 1, year: 2026, revenue: 8000 },
        { quarter: 2, year: 2026, revenue: 8000 },
        { quarter: 3, year: 2026, revenue: 8000 },
        { quarter: 4, year: 2026, revenue: 8000 }
      ]);

      assert.strictEqual(result.rollingFourQuarterRevenue, 32000);
      assert.strictEqual(result.registrationRequired, true);
    });

    it('should not require registration at exactly $30,000', () => {
      const result = trackQuarterlyRevenue([
        { quarter: 1, year: 2026, revenue: 7500 },
        { quarter: 2, year: 2026, revenue: 7500 },
        { quarter: 3, year: 2026, revenue: 7500 },
        { quarter: 4, year: 2026, revenue: 7500 }
      ]);

      assert.strictEqual(result.rollingFourQuarterRevenue, 30000);
      assert.strictEqual(result.registrationRequired, false);
    });

    it('should alert when approaching threshold ($25,000+)', () => {
      const result = trackQuarterlyRevenue([
        { quarter: 1, year: 2026, revenue: 6500 },
        { quarter: 2, year: 2026, revenue: 6500 },
        { quarter: 3, year: 2026, revenue: 6500 },
        { quarter: 4, year: 2026, revenue: 6500 }
      ]);

      assert.strictEqual(result.rollingFourQuarterRevenue, 26000);
      assert.strictEqual(result.approachingThreshold, true);
      assert.strictEqual(result.registrationRequired, false);
    });

    it('should calculate remaining before threshold', () => {
      const result = trackQuarterlyRevenue([
        { quarter: 1, year: 2026, revenue: 8000 },
        { quarter: 2, year: 2026, revenue: 7000 }
      ]);

      assert.strictEqual(result.rollingFourQuarterRevenue, 15000);
      assert.strictEqual(result.remainingBeforeThreshold, 15000);
    });
  });

  describe('trackQuarterlyRevenue - Validation', () => {
    it('should throw error for non-array input', () => {
      assert.throws(() => {
        trackQuarterlyRevenue('invalid');
      }, /Invalid quarters/);
    });

    it('should handle quarters with missing revenue as 0', () => {
      const result = trackQuarterlyRevenue([
        { quarter: 1, year: 2026 }
      ]);

      assert.strictEqual(result.totalRevenue, 0);
    });
  });

  describe('calculateITC - Basic Calculations', () => {
    it('should calculate ITC on fuel expenses', () => {
      const result = calculateITC({ fuel: 1000 }, 'QC');

      assert.strictEqual(result.eligibleExpenses, 1000);
      assert.strictEqual(result.gstITC, 50); // 1000 * 0.05
      assert.strictEqual(result.qstITC, 99.75); // 1000 * 0.09975
      assert.strictEqual(result.totalITC, 149.75);
    });

    it('should calculate ITC on multiple expense categories', () => {
      const result = calculateITC({
        fuel: 1000,
        maintenance: 500,
        insurance: 300,
        supplies: 200
      }, 'QC');

      const total = 2000;
      assert.strictEqual(result.eligibleExpenses, total);
      assert.strictEqual(result.gstITC, 100); // 2000 * 0.05
      assert.strictEqual(result.qstITC, 199.5); // 2000 * 0.09975
      assert.strictEqual(result.totalITC, 299.5);
    });

    it('should include all eligible expense categories', () => {
      const result = calculateITC({
        fuel: 500,
        maintenance: 300,
        insurance: 200,
        supplies: 100,
        office: 50,
        telephone: 80,
        advertising: 150
      }, 'QC');

      assert.strictEqual(result.eligibleExpenses, 1380);
    });

    it('should handle empty expenses', () => {
      const result = calculateITC({}, 'QC');

      assert.strictEqual(result.eligibleExpenses, 0);
      assert.strictEqual(result.gstITC, 0);
      assert.strictEqual(result.qstITC, 0);
      assert.strictEqual(result.totalITC, 0);
    });
  });

  describe('calculateITC - Provincial Variations', () => {
    it('should calculate only GST ITC for non-Quebec provinces', () => {
      const result = calculateITC({ fuel: 1000 }, 'ON');

      assert.strictEqual(result.gstITC, 50);
      assert.strictEqual(result.qstITC, 0);
      assert.strictEqual(result.totalITC, 50);
      assert.strictEqual(result.province, 'ON');
    });

    it('should calculate both GST and QST ITC for Quebec', () => {
      const result = calculateITC({ fuel: 1000 }, 'QC');

      assert.strictEqual(result.gstITC, 50);
      assert.strictEqual(result.qstITC, 99.75);
      assert.strictEqual(result.province, 'QC');
    });
  });

  describe('calculateITC - Validation', () => {
    it('should throw error for invalid expenses', () => {
      assert.throws(() => {
        calculateITC(null);
      }, /Invalid expenses/);
    });

    it('should default to Quebec if province not specified', () => {
      const result = calculateITC({ fuel: 1000 });

      assert.strictEqual(result.province, 'QC');
      assert.ok(result.qstITC > 0);
    });
  });

  describe('calculateGSTQST - Tax Collected', () => {
    it('should calculate GST/QST collected on income', () => {
      const result = calculateGSTQST(10000, {}, 'QC');

      assert.strictEqual(result.income, 10000);
      assert.strictEqual(result.gstCollected, 500); // 10000 * 0.05
      assert.strictEqual(result.qstCollected, 997.5); // 10000 * 0.09975
      assert.strictEqual(result.totalTaxCollected, 1497.5);
    });

    it('should calculate only GST for non-Quebec provinces', () => {
      const result = calculateGSTQST(10000, {}, 'ON');

      assert.strictEqual(result.gstCollected, 500);
      assert.strictEqual(result.qstCollected, 0);
      assert.strictEqual(result.totalTaxCollected, 500);
    });
  });

  describe('calculateGSTQST - Net Tax Owing', () => {
    it('should calculate net tax owing after ITC', () => {
      const result = calculateGSTQST(10000, { fuel: 2000 }, 'QC');

      // Tax collected: GST=500, QST=997.5
      // ITC: GST=100, QST=199.5
      // Net owing: GST=400, QST=798
      assert.strictEqual(result.gstOwing, 400);
      assert.strictEqual(result.qstOwing, 798);
      assert.strictEqual(result.netTaxOwing, 1198);
    });

    it('should handle ITC refund when expenses > income', () => {
      const result = calculateGSTQST(5000, { fuel: 10000 }, 'QC');

      // Tax collected: GST=250, QST=498.75
      // ITC: GST=500, QST=997.5
      // Refund: GST=250, QST=498.75
      assert.strictEqual(result.gstOwing, 0);
      assert.strictEqual(result.qstOwing, 0);
      assert.strictEqual(result.gstRefund, 250);
      assert.strictEqual(result.qstRefund, 498.75);
      assert.strictEqual(result.totalRefund, 748.75);
    });

    it('should calculate zero owing when income equals expenses', () => {
      const result = calculateGSTQST(10000, { fuel: 10000 }, 'QC');

      assert.strictEqual(result.netTaxOwing, 0);
      assert.strictEqual(result.totalRefund, 0);
    });
  });

  describe('calculateGSTQST - Validation', () => {
    it('should throw error for negative income', () => {
      assert.throws(() => {
        calculateGSTQST(-1000, {});
      }, /Invalid income/);
    });

    it('should throw error for non-numeric income', () => {
      assert.throws(() => {
        calculateGSTQST('invalid', {});
      }, /Invalid income/);
    });

    it('should handle zero income', () => {
      const result = calculateGSTQST(0, {});

      assert.strictEqual(result.income, 0);
      assert.strictEqual(result.totalTaxCollected, 0);
    });
  });

  describe('isRegistrationRequired - Registration Analysis', () => {
    it('should require registration when exceeding threshold', () => {
      const result = isRegistrationRequired([
        { quarter: 1, year: 2026, revenue: 8000 },
        { quarter: 2, year: 2026, revenue: 8000 },
        { quarter: 3, year: 2026, revenue: 8000 },
        { quarter: 4, year: 2026, revenue: 8000 }
      ]);

      assert.strictEqual(result.required, true);
      assert.strictEqual(result.rollingRevenue, 32000);
      assert.strictEqual(result.threshold, 30000);
      assert.ok(result.message.includes('registration required'));
    });

    it('should not require registration below threshold', () => {
      const result = isRegistrationRequired([
        { quarter: 1, year: 2026, revenue: 5000 },
        { quarter: 2, year: 2026, revenue: 5000 }
      ]);

      assert.strictEqual(result.required, false);
      assert.strictEqual(result.rollingRevenue, 10000);
      assert.ok(result.message.includes('not required'));
    });

    it('should warn when approaching threshold', () => {
      const result = isRegistrationRequired([
        { quarter: 1, year: 2026, revenue: 7000 },
        { quarter: 2, year: 2026, revenue: 7000 },
        { quarter: 3, year: 2026, revenue: 6500 },
        { quarter: 4, year: 2026, revenue: 6500 }
      ]);

      assert.strictEqual(result.approachingThreshold, true);
      assert.ok(result.message.includes('Approaching'));
    });
  });

  describe('getFilingDeadlines - Quarterly Filing', () => {
    it('should return 4 quarterly deadlines', () => {
      const deadlines = getFilingDeadlines(2026, 'quarterly');

      assert.strictEqual(deadlines.length, 4);
      assert.strictEqual(deadlines[0].quarter, 1);
      assert.strictEqual(deadlines[0].deadline, '2026-04-30');
      assert.strictEqual(deadlines[3].quarter, 4);
      assert.strictEqual(deadlines[3].deadline, '2027-01-31');
    });

    it('should include proper period descriptions', () => {
      const deadlines = getFilingDeadlines(2026, 'quarterly');

      assert.ok(deadlines[0].period.includes('Q1'));
      assert.ok(deadlines[1].period.includes('Q2'));
      assert.ok(deadlines[2].period.includes('Q3'));
      assert.ok(deadlines[3].period.includes('Q4'));
    });
  });

  describe('getFilingDeadlines - Annual Filing', () => {
    it('should return single annual deadline', () => {
      const deadlines = getFilingDeadlines(2026, 'annual');

      assert.strictEqual(deadlines.length, 1);
      assert.strictEqual(deadlines[0].deadline, '2027-06-15');
      assert.ok(deadlines[0].period.includes('Annual'));
    });
  });

  describe('getFilingDeadlines - Validation', () => {
    it('should throw error for invalid year', () => {
      assert.throws(() => {
        getFilingDeadlines(1999);
      }, /Invalid year/);
    });

    it('should throw error for invalid filing frequency', () => {
      assert.throws(() => {
        getFilingDeadlines(2026, 'monthly');
      }, /Invalid filing frequency/);
    });
  });

  describe('getCombinedRate - Rate Calculations', () => {
    it('should calculate combined GST+QST rate for Quebec', () => {
      const result = getCombinedRate('QC');

      assert.strictEqual(result.province, 'QC');
      assert.strictEqual(result.gstRate, 0.05);
      assert.strictEqual(result.provincialRate, 0.09975);
      assert.strictEqual(result.provincialName, 'QST');
      assert.strictEqual(result.gstPercentage, '5.00%');
      assert.strictEqual(result.provincialPercentage, '9.975%');
      assert.strictEqual(result.combinedPercentage, '14.975%');
    });

    it('should calculate GST only for non-Quebec provinces', () => {
      const result = getCombinedRate('ON');

      assert.strictEqual(result.province, 'ON');
      assert.strictEqual(result.gstRate, 0.05);
      assert.strictEqual(result.provincialRate, 0);
      assert.strictEqual(result.provincialName, 'No provincial sales tax');
      assert.strictEqual(result.combinedPercentage, '5.000%');
    });

    it('should default to Quebec if province not specified', () => {
      const result = getCombinedRate();

      assert.strictEqual(result.province, 'QC');
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle typical rideshare driver scenario', () => {
      // Driver earning $35,000/year, $10,000 in eligible expenses
      const quarters = [
        { quarter: 1, year: 2026, revenue: 8500 },
        { quarter: 2, year: 2026, revenue: 9000 },
        { quarter: 3, year: 2026, revenue: 8800 },
        { quarter: 4, year: 2026, revenue: 8700 }
      ];

      const regStatus = isRegistrationRequired(quarters);
      assert.strictEqual(regStatus.required, true);

      const taxCalc = calculateGSTQST(35000, {
        fuel: 6000,
        maintenance: 2000,
        insurance: 2000
      }, 'QC');

      assert.ok(taxCalc.netTaxOwing > 0);
      assert.ok(taxCalc.gstOwing > 0);
      assert.ok(taxCalc.qstOwing > 0);
    });

    it('should handle part-time driver below threshold', () => {
      const quarters = [
        { quarter: 1, year: 2026, revenue: 5000 },
        { quarter: 2, year: 2026, revenue: 5500 },
        { quarter: 3, year: 2026, revenue: 4800 },
        { quarter: 4, year: 2026, revenue: 5200 }
      ];

      const regStatus = isRegistrationRequired(quarters);
      assert.strictEqual(regStatus.required, false);
      assert.strictEqual(regStatus.rollingRevenue, 20500);
    });

    it('should handle high-expense driver with ITC refund', () => {
      const taxCalc = calculateGSTQST(20000, {
        fuel: 15000,
        maintenance: 8000,
        insurance: 3000
      }, 'QC');

      // High expenses should result in refund
      assert.ok(taxCalc.totalRefund > 0);
      assert.strictEqual(taxCalc.netTaxOwing, 0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle exactly $30,000 threshold', () => {
      const result = trackQuarterlyRevenue([
        { quarter: 1, year: 2026, revenue: 7500 },
        { quarter: 2, year: 2026, revenue: 7500 },
        { quarter: 3, year: 2026, revenue: 7500 },
        { quarter: 4, year: 2026, revenue: 7500 }
      ]);

      assert.strictEqual(result.rollingFourQuarterRevenue, 30000);
      assert.strictEqual(result.registrationRequired, false);
      assert.strictEqual(result.remainingBeforeThreshold, 0);
    });

    it('should handle $30,001 threshold (just over)', () => {
      const result = trackQuarterlyRevenue([
        { quarter: 1, year: 2026, revenue: 7500.25 },
        { quarter: 2, year: 2026, revenue: 7500.25 },
        { quarter: 3, year: 2026, revenue: 7500.25 },
        { quarter: 4, year: 2026, revenue: 7500.25 }
      ]);

      assert.ok(result.rollingFourQuarterRevenue > 30000);
      assert.strictEqual(result.registrationRequired, true);
    });

    it('should handle zero income and expenses', () => {
      const result = calculateGSTQST(0, {}, 'QC');

      assert.strictEqual(result.netTaxOwing, 0);
      assert.strictEqual(result.totalRefund, 0);
    });

    it('should round all financial values to 2 decimals', () => {
      const result = calculateGSTQST(12345.67, { fuel: 1234.56 }, 'QC');

      // Check all values are rounded to 2 decimals
      assert.strictEqual(result.gstCollected, 617.28);
      assert.strictEqual(result.qstCollected, 1231.48); // 12345.67 * 0.09975 = 1231.4805825
    });
  });
});
