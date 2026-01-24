/**
 * Tax Forms Integration Tests
 * Comprehensive test suite for tax package generation
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  generateCompleteTaxPackage,
  autoPopulateForms,
  validateTaxPackage,
  getPackageSummary
} from '../tax-forms-integration.js';

describe('Tax Forms Integration', () => {
  let baseDriverData;
  let sampleTrips;
  let sampleReceipts;

  beforeEach(() => {
    // Sample trips for mileage log
    sampleTrips = [
      {
        date: '2026-01-15',
        startKm: 1000,
        endKm: 1050,
        destination: 'Airport',
        purpose: 'Passenger pickup',
        isBusinessTrip: true,
        distance: 50
      },
      {
        date: '2026-01-16',
        startKm: 1050,
        endKm: 1100,
        destination: 'Downtown',
        purpose: 'Multiple trips',
        isBusinessTrip: true,
        distance: 50
      },
      {
        date: '2026-01-17',
        startKm: 1100,
        endKm: 1120,
        destination: 'Grocery Store',
        purpose: 'Personal errands',
        isBusinessTrip: false,
        distance: 20
      }
    ];

    // Sample receipts
    sampleReceipts = [
      { date: '2026-01-10', amount: 80.00, vendor: 'Shell', category: 'fuel', imageUrl: 'url1' },
      { date: '2026-01-15', amount: 150.00, vendor: 'Mechanic', category: 'maintenance', imageUrl: 'url2' },
      { date: '2026-01-20', amount: 200.00, vendor: 'Insurance Co', category: 'insurance', imageUrl: 'url3' },
      { date: '2026-02-05', amount: 50.00, vendor: 'Rogers', category: 'telephone', imageUrl: 'url4' },
      { date: '2026-02-10', amount: 25.00, vendor: 'Staples', category: 'office', imageUrl: null }
    ];

    // Base driver data
    baseDriverData = {
      driverInfo: {
        name: 'John Doe',
        sin: '123-456-789',
        address: '123 Main St, Toronto, ON',
        fiscalYear: 2026,
        province: 'ON'
      },
      income: {
        grossFares: 50000,
        commissions: -10000,
        otherIncome: 1000
      },
      trips: sampleTrips,
      receipts: sampleReceipts,
      language: 'en'
    };
  });

  describe('generateCompleteTaxPackage', () => {
    it('should generate complete tax package for non-Quebec driver', () => {
      const result = generateCompleteTaxPackage(baseDriverData);

      assert.ok(result);
      assert.strictEqual(result.packageType, 'Complete Tax Package');
      assert.strictEqual(result.fiscalYear, 2026);
      assert.strictEqual(result.province, 'ON');
      assert.ok(result.forms.t2125);
      assert.strictEqual(result.forms.tp80v, undefined);
    });

    it('should generate complete tax package for Quebec driver', () => {
      const quebecData = {
        ...baseDriverData,
        driverInfo: { ...baseDriverData.driverInfo, province: 'QC' },
        language: 'fr'
      };

      const result = generateCompleteTaxPackage(quebecData);

      assert.ok(result);
      assert.strictEqual(result.province, 'QC');
      assert.ok(result.forms.t2125);
      assert.ok(result.forms.tp80v);
      assert.ok(result.summary.fss !== undefined);
      assert.ok(result.summary.qpp !== undefined);
    });

    it('should include CCA schedule when vehicle provided', () => {
      const dataWithVehicle = {
        ...baseDriverData,
        vehicle: {
          cost: 30000,
          businessUsePercentage: 83.33,
          years: 1
        }
      };

      const result = generateCompleteTaxPackage(dataWithVehicle);

      assert.ok(result.schedules.cca);
      assert.ok(result.schedules.cca.cca > 0);
      assert.ok(result.summary.cca > 0);
    });

    it('should calculate business use from mileage log', () => {
      const result = generateCompleteTaxPackage(baseDriverData);

      assert.ok(result.schedules.mileage);
      assert.strictEqual(result.schedules.mileage.totalTrips, 3);
      assert.strictEqual(result.schedules.mileage.businessTrips, 2);
      assert.ok(Math.abs(result.schedules.mileage.businessPercentage - 83.33) < 0.1);
      assert.ok(Math.abs(result.summary.businessUsePercentage - 83.33) < 0.1);
    });

    it('should auto-populate expenses from receipts', () => {
      const result = generateCompleteTaxPackage(baseDriverData);

      assert.strictEqual(result.forms.t2125.expenses.fuel, 80);
      assert.strictEqual(result.forms.t2125.expenses.maintenance, 150);
      assert.strictEqual(result.forms.t2125.expenses.insurance, 200);
      assert.strictEqual(result.forms.t2125.expenses.telephone, 50);
      assert.strictEqual(result.forms.t2125.expenses.office, 25);
    });

    it('should include receipt summary', () => {
      const result = generateCompleteTaxPackage(baseDriverData);

      assert.ok(result.schedules.receipts);
      assert.strictEqual(result.schedules.receipts.totalReceipts, 5);
      assert.strictEqual(result.schedules.receipts.byCategory.fuel.count, 1);
      assert.strictEqual(result.schedules.receipts.byCategory.fuel.total, 80);
    });

    it('should validate package completeness', () => {
      const result = generateCompleteTaxPackage(baseDriverData);

      assert.ok(result.validation);
      assert.strictEqual(result.validation.isValid, true);
      assert.strictEqual(result.validation.completeness.hasDriverInfo, true);
      assert.strictEqual(result.validation.completeness.hasIncome, true);
      assert.strictEqual(result.validation.completeness.hasMileageLog, true);
      assert.strictEqual(result.validation.completeness.hasReceipts, true);
    });

    it('should handle driver without vehicle', () => {
      const result = generateCompleteTaxPackage(baseDriverData);

      assert.strictEqual(result.schedules.cca, undefined);
      assert.strictEqual(result.summary.cca, undefined);
      assert.strictEqual(result.forms.t2125.expenses.cca, 0);
    });

    it('should handle driver without trips', () => {
      const dataNoTrips = {
        ...baseDriverData,
        trips: []
      };

      const result = generateCompleteTaxPackage(dataNoTrips);

      assert.strictEqual(result.schedules.mileage, undefined);
      assert.strictEqual(result.summary.businessUsePercentage, 100);
      assert.ok(result.validation.warnings.includes('No mileage log entries - business use percentage cannot be verified'));
    });

    it('should handle driver without receipts', () => {
      const dataNoReceipts = {
        ...baseDriverData,
        receipts: []
      };

      const result = generateCompleteTaxPackage(dataNoReceipts);

      assert.strictEqual(result.schedules.receipts.totalReceipts, 0);
      assert.strictEqual(result.forms.t2125.expenses.fuel, 0);
      assert.ok(result.validation.warnings.includes('No receipts stored - CRA may require proof of expenses'));
    });

    it('should calculate GST/QST for registered driver', () => {
      const gstData = {
        ...baseDriverData,
        gstRegistered: true
      };

      const result = generateCompleteTaxPackage(gstData);

      assert.ok(result.schedules.gstQst);
      assert.ok(result.schedules.gstQst.gstCollected > 0);
      assert.ok(result.schedules.gstQst.itc);
    });

    it('should check registration threshold for non-registered driver', () => {
      const quarterlyData = {
        ...baseDriverData,
        gstRegistered: false,
        quarterlyRevenue: [
          { quarter: 1, year: 2026, revenue: 10000 },
          { quarter: 2, year: 2026, revenue: 12000 },
          { quarter: 3, year: 2026, revenue: 11000 },
          { quarter: 4, year: 2026, revenue: 8000 }
        ]
      };

      const result = generateCompleteTaxPackage(quarterlyData);

      assert.ok(result.schedules.gstQst);
      assert.ok(result.schedules.gstQst.registrationCheck);
      assert.strictEqual(result.schedules.gstQst.registrationCheck.required, true);
    });

    it('should throw error for missing driver data', () => {
      assert.throws(() => generateCompleteTaxPackage(null), /Invalid driver data/);
    });

    it('should throw error for missing driver info', () => {
      const invalidData = {
        income: { grossFares: 50000 }
      };
      assert.throws(() => generateCompleteTaxPackage(invalidData), /Invalid driver info/);
    });

    it('should throw error for missing income data', () => {
      const invalidData = {
        driverInfo: { name: 'Test', province: 'ON' }
      };
      assert.throws(() => generateCompleteTaxPackage(invalidData), /Invalid income data/);
    });

    it('should calculate subsequent year CCA correctly', () => {
      const dataSubsequentYear = {
        ...baseDriverData,
        vehicle: {
          cost: 30000,
          businessUsePercentage: 80,
          years: 2,
          uccBeginning: 25500
        }
      };

      const result = generateCompleteTaxPackage(dataSubsequentYear);

      assert.ok(result.schedules.cca);
      assert.strictEqual(result.schedules.cca.uccBeginning, 25500);
      assert.ok(result.schedules.cca.cca > 0);
    });

    it('should filter receipts by fiscal year', () => {
      const mixedYearReceipts = [
        ...sampleReceipts,
        { date: '2025-12-31', amount: 100, vendor: 'Test', category: 'fuel', imageUrl: null },
        { date: '2027-01-01', amount: 100, vendor: 'Test', category: 'fuel', imageUrl: null }
      ];

      const data = {
        ...baseDriverData,
        receipts: mixedYearReceipts
      };

      const result = generateCompleteTaxPackage(data);

      assert.strictEqual(result.schedules.receipts.totalReceipts, 5);
    });
  });

  describe('autoPopulateForms', () => {
    it('should auto-populate forms from mileage and receipts', () => {
      const result = autoPopulateForms(
        sampleTrips,
        sampleReceipts,
        { grossFares: 50000, commissions: -10000, otherIncome: 1000 },
        2026
      );

      assert.strictEqual(result.income.grossFares, 50000);
      assert.strictEqual(result.expenses.fuel, 80);
      assert.strictEqual(result.expenses.maintenance, 150);
      assert.ok(Math.abs(result.businessUsePercentage - 83.33) < 0.1);
      assert.ok(result.mileageSummary);
    });

    it('should handle empty mileage log', () => {
      const result = autoPopulateForms(
        [],
        sampleReceipts,
        { grossFares: 50000 },
        2026
      );

      assert.strictEqual(result.businessUsePercentage, 100);
      assert.strictEqual(result.mileageSummary, null);
    });

    it('should handle empty receipts', () => {
      const result = autoPopulateForms(
        sampleTrips,
        [],
        { grossFares: 50000 },
        2026
      );

      assert.strictEqual(result.expenses.fuel, 0);
      assert.strictEqual(result.expenses.maintenance, 0);
    });

    it('should throw error for invalid mileage log', () => {
      assert.throws(() => autoPopulateForms('invalid', [], {}, 2026), /Invalid mileage log/);
    });

    it('should throw error for invalid receipts', () => {
      assert.throws(() => autoPopulateForms([], 'invalid', {}, 2026), /Invalid receipts/);
    });

    it('should throw error for invalid income', () => {
      assert.throws(() => autoPopulateForms([], [], null, 2026), /Invalid income/);
    });
  });

  describe('validateTaxPackage', () => {
    it('should validate complete package', () => {
      const packageData = {
        driverInfo: {
          name: 'John Doe',
          sin: '123-456-789',
          address: '123 Main St'
        },
        income: {
          grossFares: 50000,
          commissions: -10000,
          otherIncome: 1000
        },
        expenses: {
          fuel: 5000,
          maintenance: 2000
        },
        trips: sampleTrips,
        receipts: sampleReceipts,
        isQuebec: false,
        gstRegistered: false
      };

      const result = validateTaxPackage(packageData);

      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.errors.length, 0);
      assert.strictEqual(result.completeness.hasDriverInfo, true);
      assert.strictEqual(result.completeness.hasIncome, true);
      assert.strictEqual(result.completeness.hasExpenses, true);
    });

    it('should detect missing driver name', () => {
      const packageData = {
        driverInfo: {},
        income: { grossFares: 50000 },
        expenses: {}
      };

      const result = validateTaxPackage(packageData);

      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.includes('Driver name is required'));
    });

    it('should warn about missing SIN', () => {
      const packageData = {
        driverInfo: { name: 'John Doe' },
        income: { grossFares: 50000 },
        expenses: {}
      };

      const result = validateTaxPackage(packageData);

      assert.strictEqual(result.hasWarnings, true);
      assert.ok(result.warnings.includes('SIN/NAS not provided'));
    });

    it('should warn about zero income', () => {
      const packageData = {
        driverInfo: { name: 'John Doe', sin: '123' },
        income: { grossFares: 0, commissions: 0, otherIncome: 0 },
        expenses: {}
      };

      const result = validateTaxPackage(packageData);

      assert.ok(result.warnings.includes('Total income is zero'));
    });

    it('should detect negative gross fares', () => {
      const packageData = {
        driverInfo: { name: 'John Doe' },
        income: { grossFares: -1000 },
        expenses: {}
      };

      const result = validateTaxPackage(packageData);

      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.includes('Gross fares cannot be negative'));
    });

    it('should warn about low business use percentage', () => {
      const lowBusinessTrips = [
        {
          date: '2026-01-15',
          startKm: 1000,
          endKm: 1020,
          destination: 'Work',
          purpose: 'Business',
          isBusinessTrip: true,
          distance: 20
        },
        {
          date: '2026-01-16',
          startKm: 1020,
          endKm: 1100,
          destination: 'Personal',
          purpose: 'Personal',
          isBusinessTrip: false,
          distance: 80
        }
      ];

      const packageData = {
        driverInfo: { name: 'John Doe' },
        income: { grossFares: 50000 },
        expenses: {},
        trips: lowBusinessTrips
      };

      const result = validateTaxPackage(packageData);

      assert.ok(result.warnings.some(w => w.includes('only 20%')));
    });

    it('should provide info about high business use', () => {
      const highBusinessTrips = [
        {
          date: '2026-01-15',
          startKm: 1000,
          endKm: 1100,
          destination: 'Work',
          purpose: 'Business',
          isBusinessTrip: true,
          distance: 100
        },
        {
          date: '2026-01-16',
          startKm: 1100,
          endKm: 1105,
          destination: 'Personal',
          purpose: 'Personal',
          isBusinessTrip: false,
          distance: 5
        }
      ];

      const packageData = {
        driverInfo: { name: 'John Doe' },
        income: { grossFares: 50000 },
        expenses: {},
        trips: highBusinessTrips
      };

      const result = validateTaxPackage(packageData);

      assert.ok(result.info.some(i => i.includes('95.24%')));
      assert.ok(result.info.some(i => i.includes('100% ITC')));
    });

    it('should warn about receipts over $30 without images', () => {
      const receiptsNoImages = [
        { date: '2026-01-10', amount: 50.00, vendor: 'Test', category: 'fuel', imageUrl: null }
      ];

      const packageData = {
        driverInfo: { name: 'John Doe' },
        income: { grossFares: 50000 },
        expenses: {},
        receipts: receiptsNoImages
      };

      const result = validateTaxPackage(packageData);

      assert.ok(result.warnings.some(w => w.includes('over $30 missing images')));
    });

    it('should validate vehicle data', () => {
      const packageData = {
        driverInfo: { name: 'John Doe' },
        income: { grossFares: 50000 },
        expenses: {},
        vehicle: {
          cost: -1000,
          businessUsePercentage: 150
        }
      };

      const result = validateTaxPackage(packageData);

      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.includes('Vehicle cost must be positive'));
      assert.ok(result.errors.includes('Business use percentage must be between 0 and 100'));
    });

    it('should provide Quebec-specific info', () => {
      const packageData = {
        driverInfo: { name: 'John Doe' },
        income: { grossFares: 50000 },
        expenses: {},
        isQuebec: true
      };

      const result = validateTaxPackage(packageData);

      assert.ok(result.info.some(i => i.includes('TP-80-V')));
      assert.ok(result.info.some(i => i.includes('FSS and QPP')));
    });

    it('should provide GST registration info', () => {
      const packageData = {
        driverInfo: { name: 'John Doe' },
        income: { grossFares: 50000 },
        expenses: {},
        gstRegistered: true
      };

      const result = validateTaxPackage(packageData);

      assert.ok(result.info.some(i => i.includes('GST/QST registered')));
    });
  });

  describe('getPackageSummary', () => {
    it('should generate human-readable summary', () => {
      const taxPackage = generateCompleteTaxPackage(baseDriverData);
      const summary = getPackageSummary(taxPackage);

      assert.ok(summary.includes('TAX PACKAGE SUMMARY'));
      assert.ok(summary.includes('Fiscal Year: 2026'));
      assert.ok(summary.includes('Province: ON'));
      assert.ok(summary.includes('T2125 (Federal Business Statement)'));
      assert.ok(summary.includes('Business Use:'));
    });

    it('should include Quebec forms in summary', () => {
      const quebecData = {
        ...baseDriverData,
        driverInfo: { ...baseDriverData.driverInfo, province: 'QC' },
        language: 'fr'
      };

      const taxPackage = generateCompleteTaxPackage(quebecData);
      const summary = getPackageSummary(taxPackage);

      assert.ok(summary.includes('TP-80-V (Quebec Business Statement)'));
      assert.ok(summary.includes('FSS (Quebec):'));
      assert.ok(summary.includes('QPP (Quebec):'));
    });

    it('should include CCA in summary when vehicle present', () => {
      const dataWithVehicle = {
        ...baseDriverData,
        vehicle: {
          cost: 30000,
          businessUsePercentage: 80,
          years: 1
        }
      };

      const taxPackage = generateCompleteTaxPackage(dataWithVehicle);
      const summary = getPackageSummary(taxPackage);

      assert.ok(summary.includes('CCA Claimed:'));
      assert.ok(summary.includes('CCA Schedule (Vehicle Depreciation)'));
    });

    it('should display errors and warnings', () => {
      const incompleteData = {
        driverInfo: { name: 'Incomplete Driver', province: 'ON', fiscalYear: 2026 },
        income: { grossFares: 0, commissions: 0, otherIncome: 0 },
        trips: [],
        receipts: []
      };

      const taxPackage = generateCompleteTaxPackage(incompleteData);
      const summary = getPackageSummary(taxPackage);

      assert.ok(summary.includes('WARNINGS:'));
    });

    it('should throw error for invalid package', () => {
      assert.throws(() => getPackageSummary(null), /Invalid tax package/);
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should handle driver with all features enabled', () => {
      const fullData = {
        ...baseDriverData,
        driverInfo: { ...baseDriverData.driverInfo, province: 'QC' },
        vehicle: {
          cost: 35000,
          businessUsePercentage: 85,
          years: 1
        },
        gstRegistered: true,
        language: 'fr'
      };

      const result = generateCompleteTaxPackage(fullData);

      assert.ok(result.forms.t2125);
      assert.ok(result.forms.tp80v);
      assert.ok(result.schedules.cca);
      assert.ok(result.schedules.mileage);
      assert.ok(result.schedules.receipts);
      assert.ok(result.schedules.gstQst);
      assert.strictEqual(result.validation.isValid, true);
    });

    it('should handle minimal driver data', () => {
      const minimalData = {
        driverInfo: {
          name: 'Jane Doe',
          fiscalYear: 2026,
          province: 'BC'
        },
        income: {
          grossFares: 30000,
          commissions: 0,
          otherIncome: 0
        },
        trips: [],
        receipts: []
      };

      const result = generateCompleteTaxPackage(minimalData);

      assert.ok(result);
      assert.ok(result.forms.t2125);
      assert.strictEqual(result.validation.hasWarnings, true);
    });

    it('should calculate correct net income with all deductions', () => {
      const quebecData = {
        ...baseDriverData,
        driverInfo: { ...baseDriverData.driverInfo, province: 'QC' },
        language: 'fr'
      };

      const result = generateCompleteTaxPackage(quebecData);

      assert.ok(result.forms.tp80v.netIncome < result.forms.tp80v.netIncomeBeforeFSS);
      assert.ok(result.summary.fss > 0);
      assert.ok(result.summary.qpp > 0);
    });

    it('should handle receipts with multiple years correctly', () => {
      const multiYearReceipts = [
        { date: '2025-12-31', amount: 100, vendor: 'Test', category: 'fuel', imageUrl: null },
        { date: '2026-06-15', amount: 200, vendor: 'Test', category: 'fuel', imageUrl: null },
        { date: '2027-01-01', amount: 150, vendor: 'Test', category: 'fuel', imageUrl: null }
      ];

      const data = {
        ...baseDriverData,
        receipts: multiYearReceipts
      };

      const result = generateCompleteTaxPackage(data);

      assert.strictEqual(result.forms.t2125.expenses.fuel, 200);
      assert.strictEqual(result.schedules.receipts.totalReceipts, 1);
    });
  });
});
