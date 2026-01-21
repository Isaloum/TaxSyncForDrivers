// tests/vehicle-expense-calculator.test.js — Tests for vehicle expense calculations
import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  calculateSimplifiedMethod,
  calculateDetailedMethod,
  compareVehicleMethods,
  VEHICLE_RATES_2026,
  CCA_RATES,
} from '../vehicle-expense-calculator.js';

describe('Vehicle Expense Calculator Tests', () => {
  describe('calculateSimplifiedMethod', () => {
    it('should calculate simplified method for under 5000 km', () => {
      const result = calculateSimplifiedMethod(10000, 4000);
      assert.strictEqual(result.deduction, 2800); // 4000 * 0.70
      assert.strictEqual(result.breakdown.first5000km, 4000);
      assert.strictEqual(result.breakdown.after5000km, 0);
    });

    it('should calculate simplified method for over 5000 km', () => {
      const result = calculateSimplifiedMethod(25000, 10000);
      // First 5000: 5000 * 0.70 = 3500
      // After 5000: 5000 * 0.64 = 3200
      // Total: 6700
      assert.strictEqual(result.deduction, 6700);
      assert.strictEqual(result.breakdown.first5000km, 5000);
      assert.strictEqual(result.breakdown.after5000km, 5000);
    });

    it('should calculate simplified method with real 2023 data (19,839 km)', () => {
      const result = calculateSimplifiedMethod(25000, 19839);
      // First 5000: 5000 * 0.70 = 3500
      // After 5000: 14839 * 0.64 = 9496.96
      // Total: 12996.96
      assert.strictEqual(result.deduction, 12996.96);
    });

    it('should add northern territory supplement', () => {
      const result = calculateSimplifiedMethod(10000, 5000, true);
      // Standard: 5000 * 0.70 = 3500
      // Territory: 5000 * 0.04 = 200
      // Total: 3700
      assert.strictEqual(result.deduction, 3700);
      assert.strictEqual(result.breakdown.territoryAddition, 200);
    });

    it('should return zero deduction for zero business km', () => {
      const result = calculateSimplifiedMethod(10000, 0);
      assert.strictEqual(result.deduction, 0);
    });
  });

  describe('calculateDetailedMethod', () => {
    it('should calculate detailed method with basic expenses', () => {
      const expenses = {
        gas: 4000,
        insurance: 1500,
        maintenance: 1000,
      };
      const result = calculateDetailedMethod(expenses, 25000, 20000);
      // Total expenses: 6500
      // Business use: 20000/25000 = 80%
      // Deduction: 6500 * 0.80 = 5200
      assert.strictEqual(result.deduction, 5200);
      assert.strictEqual(result.breakdown.businessUsePercent, 80);
    });

    it('should calculate CCA for first year', () => {
      const expenses = { gas: 1000 };
      const result = calculateDetailedMethod(expenses, 10000, 8000, 30000, true);
      // CCA: 30000 * 0.30 * 0.5 = 4500 (half-year rule)
      // Total before business use: 1000 + 4500 = 5500
      // Business use: 80%
      // Deduction: 5500 * 0.80 = 4400
      assert.strictEqual(result.deduction, 4400);
      assert.strictEqual(result.breakdown.cca, 4500);
    });

    it('should cap CCA at maximum depreciable amount', () => {
      const expenses = { gas: 1000 };
      const result = calculateDetailedMethod(expenses, 10000, 8000, 50000, true);
      // Vehicle over limit, capped at $37,000
      // CCA: 37000 * 0.30 * 0.5 = 5550
      const expectedCCA = CCA_RATES.maxDepreciableAmount * CCA_RATES.class10 * CCA_RATES.firstYearRule;
      assert.strictEqual(result.breakdown.cca, expectedCCA);
    });

    it('should handle financing costs', () => {
      const expenses = {
        gas: 2000,
        leasePayments: 6000,
        loanInterest: 500,
      };
      const result = calculateDetailedMethod(expenses, 20000, 16000);
      // Operating: 2000
      // Financing: 6500
      // Total: 8500
      // Business use: 80%
      // Deduction: 8500 * 0.80 = 6800
      assert.strictEqual(result.deduction, 6800);
    });

    it('should return zero deduction for zero kilometers', () => {
      const expenses = { gas: 1000 };
      const result = calculateDetailedMethod(expenses, 0, 0);
      assert.strictEqual(result.deduction, 0);
    });
  });

  describe('compareVehicleMethods', () => {
    it('should recommend simplified method when better', () => {
      const expenses = { gas: 500, insurance: 500 };
      const result = compareVehicleMethods(10000, 8000, expenses);
      // Simplified: 5000 * 0.70 + 3000 * 0.64 = 3500 + 1920 = 5420
      // Detailed: 1000 * 0.80 = 800
      assert.strictEqual(result.recommended, 'simplified');
      assert.strictEqual(result.bestDeduction, result.simplified.deduction);
    });

    it('should recommend detailed method when better', () => {
      const expenses = {
        gas: 6000,
        insurance: 3000,
        maintenance: 3000,
        repairs: 2000,
      };
      const result = compareVehicleMethods(25000, 20000, expenses, 35000, true);
      // Simplified: 5000*0.70 + 15000*0.64 = 3500 + 9600 = 13100
      // Detailed: (6000+3000+3000+2000 = 14000 operating) + (35000*0.30*0.5 = 5250 CCA) = 19250 * 0.80 = 15400
      // Detailed should be higher
      assert.strictEqual(result.recommended, 'detailed');
      assert.strictEqual(result.bestDeduction, result.detailed.deduction);
    });

    it('should calculate savings between methods', () => {
      const expenses = { gas: 2000, insurance: 1500 };
      const result = compareVehicleMethods(20000, 15000, expenses);
      const expectedSavings = Math.abs(
        result.simplified.deduction - result.detailed.deduction
      );
      assert.strictEqual(result.savings, expectedSavings);
    });
  });
});
