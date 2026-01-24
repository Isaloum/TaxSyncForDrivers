/**
 * Comprehensive Test Suite for Mileage Log Module
 * Tests all functions with edge cases and real-world scenarios
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  addTrip,
  calculateBusinessPercentage,
  exportLogAsCSV,
  exportLogAsText,
  validateBusinessUse,
  getAnnualSummary,
  getRepresentativePeriod
} from '../mileage-log.js';

describe('Mileage Log Module - Comprehensive Tests', () => {
  
  // ===== addTrip() Tests =====
  describe('addTrip()', () => {
    
    it('should create a valid trip with correct distance calculation', () => {
      const trip = addTrip('2024-01-15', 1000, 1050, 'Client Office', 'Business meeting', true);
      assert.strictEqual(trip.date, '2024-01-15');
      assert.strictEqual(trip.startKm, 1000);
      assert.strictEqual(trip.endKm, 1050);
      assert.strictEqual(trip.distance, 50);
      assert.strictEqual(trip.destination, 'Client Office');
      assert.strictEqual(trip.purpose, 'Business meeting');
      assert.strictEqual(trip.isBusinessTrip, true);
    });

    it('should create a personal trip', () => {
      const trip = addTrip('2024-01-16', 1050, 1080, 'Grocery Store', 'Shopping', false);
      assert.strictEqual(trip.isBusinessTrip, false);
      assert.strictEqual(trip.distance, 30);
    });

    it('should handle zero distance trips', () => {
      const trip = addTrip('2024-01-17', 2000, 2000, 'Same Location', 'Parked all day', true);
      assert.strictEqual(trip.distance, 0);
    });

    it('should round distance to 2 decimal places', () => {
      const trip = addTrip('2024-01-18', 1000, 1025.567, 'Office', 'Work', true);
      assert.strictEqual(trip.distance, 25.57);
    });

    it('should throw error if date is missing', () => {
      assert.throws(
        () => addTrip('', 1000, 1050, 'Office', 'Work', true),
        { message: 'Date is required and must be a string' }
      );
    });

    it('should throw error if date format is invalid', () => {
      assert.throws(
        () => addTrip('01/15/2024', 1000, 1050, 'Office', 'Work', true),
        { message: 'Date must be in YYYY-MM-DD format' }
      );
    });

    it('should throw error if start odometer is negative', () => {
      assert.throws(
        () => addTrip('2024-01-15', -100, 1050, 'Office', 'Work', true),
        { message: 'Start odometer must be a non-negative number' }
      );
    });

    it('should throw error if end odometer is less than start', () => {
      assert.throws(
        () => addTrip('2024-01-15', 1050, 1000, 'Office', 'Work', true),
        { message: 'End odometer cannot be less than start odometer' }
      );
    });

    it('should throw error if destination is missing', () => {
      assert.throws(
        () => addTrip('2024-01-15', 1000, 1050, '', 'Work', true),
        { message: 'Destination is required and must be a string' }
      );
    });

    it('should throw error if purpose is missing', () => {
      assert.throws(
        () => addTrip('2024-01-15', 1000, 1050, 'Office', '', true),
        { message: 'Purpose is required and must be a string' }
      );
    });

    it('should throw error if isBusinessTrip is not boolean', () => {
      assert.throws(
        () => addTrip('2024-01-15', 1000, 1050, 'Office', 'Work', 'yes'),
        { message: 'isBusinessTrip must be a boolean' }
      );
    });
  });

  // ===== calculateBusinessPercentage() Tests =====
  describe('calculateBusinessPercentage()', () => {
    
    it('should return 0 for empty array', () => {
      const percentage = calculateBusinessPercentage([]);
      assert.strictEqual(percentage, 0);
    });

    it('should return 100 for all business trips', () => {
      const trips = [
        addTrip('2024-01-15', 1000, 1050, 'Client A', 'Meeting', true),
        addTrip('2024-01-16', 1050, 1100, 'Client B', 'Meeting', true),
        addTrip('2024-01-17', 1100, 1150, 'Client C', 'Meeting', true)
      ];
      const percentage = calculateBusinessPercentage(trips);
      assert.strictEqual(percentage, 100);
    });

    it('should return 0 for all personal trips', () => {
      const trips = [
        addTrip('2024-01-15', 1000, 1050, 'Mall', 'Shopping', false),
        addTrip('2024-01-16', 1050, 1100, 'Home', 'Personal', false)
      ];
      const percentage = calculateBusinessPercentage(trips);
      assert.strictEqual(percentage, 0);
    });

    it('should calculate 50% business use correctly', () => {
      const trips = [
        addTrip('2024-01-15', 1000, 1100, 'Office', 'Work', true),
        addTrip('2024-01-16', 1100, 1200, 'Mall', 'Shopping', false)
      ];
      const percentage = calculateBusinessPercentage(trips);
      assert.strictEqual(percentage, 50);
    });

    it('should round percentage to 2 decimal places', () => {
      const trips = [
        addTrip('2024-01-15', 1000, 1033, 'Office', 'Work', true),
        addTrip('2024-01-16', 1033, 1100, 'Mall', 'Shopping', false)
      ];
      const percentage = calculateBusinessPercentage(trips);
      assert.strictEqual(percentage, 33);
    });

    it('should handle trips with zero distance', () => {
      const trips = [
        addTrip('2024-01-15', 1000, 1000, 'Office', 'Parked', true),
        addTrip('2024-01-16', 1000, 1000, 'Mall', 'Parked', false)
      ];
      const percentage = calculateBusinessPercentage(trips);
      assert.strictEqual(percentage, 0);
    });

    it('should throw error if trips is not an array', () => {
      assert.throws(
        () => calculateBusinessPercentage('not an array'),
        { message: 'Trips must be an array' }
      );
    });

    it('should calculate 90% business use (threshold)', () => {
      const trips = [
        addTrip('2024-01-15', 1000, 1090, 'Office', 'Work', true),
        addTrip('2024-01-16', 1090, 1100, 'Mall', 'Shopping', false)
      ];
      const percentage = calculateBusinessPercentage(trips);
      assert.strictEqual(percentage, 90);
    });
  });

  // ===== exportLogAsCSV() Tests =====
  describe('exportLogAsCSV()', () => {
    
    it('should export trips as CSV with headers', () => {
      const trips = [
        addTrip('2024-01-15', 1000, 1050, 'Client Office', 'Business meeting', true)
      ];
      const csv = exportLogAsCSV(trips);
      assert.ok(csv.includes('Date,Start Odometer (km),End Odometer (km),Distance (km),Destination,Purpose,Type'));
      assert.ok(csv.includes('2024-01-15,1000,1050,50,Client Office,Business meeting,Business'));
    });

    it('should export multiple trips correctly', () => {
      const trips = [
        addTrip('2024-01-15', 1000, 1050, 'Office', 'Work', true),
        addTrip('2024-01-16', 1050, 1080, 'Mall', 'Shopping', false)
      ];
      const csv = exportLogAsCSV(trips);
      const lines = csv.split('\n');
      assert.strictEqual(lines.length, 3); // header + 2 trips
      assert.ok(lines[1].includes('Business'));
      assert.ok(lines[2].includes('Personal'));
    });

    it('should return only headers for empty array', () => {
      const csv = exportLogAsCSV([]);
      assert.strictEqual(csv, 'Date,Start Odometer (km),End Odometer (km),Distance (km),Destination,Purpose,Type\n');
    });

    it('should throw error if trips is not an array', () => {
      assert.throws(
        () => exportLogAsCSV(null),
        { message: 'Trips must be an array' }
      );
    });
  });

  // ===== exportLogAsText() Tests =====
  describe('exportLogAsText()', () => {
    
    it('should export trips as formatted text with summary', () => {
      const trips = [
        addTrip('2024-01-15', 1000, 1050, 'Office', 'Work', true)
      ];
      const text = exportLogAsText(trips);
      assert.ok(text.includes('MILEAGE LOG - CRA COMPLIANT'));
      assert.ok(text.includes('Trip 1:'));
      assert.ok(text.includes('Date:        2024-01-15'));
      assert.ok(text.includes('Distance:    50 km'));
      assert.ok(text.includes('SUMMARY'));
      assert.ok(text.includes('Total Trips:       1'));
      assert.ok(text.includes('Business Use:      100%'));
    });

    it('should show correct summary for mixed trips', () => {
      const trips = [
        addTrip('2024-01-15', 1000, 1100, 'Office', 'Work', true),
        addTrip('2024-01-16', 1100, 1150, 'Mall', 'Shopping', false)
      ];
      const text = exportLogAsText(trips);
      assert.ok(text.includes('Total Trips:       2'));
      assert.ok(text.includes('Total Distance:    150.00 km'));
      assert.ok(text.includes('Business Distance: 100.00 km'));
      assert.ok(text.includes('Personal Distance: 50.00 km'));
      assert.ok(text.includes('Business Use:      66.67%'));
    });

    it('should handle empty array with appropriate message', () => {
      const text = exportLogAsText([]);
      assert.ok(text.includes('No trips recorded'));
    });

    it('should throw error if trips is not an array', () => {
      assert.throws(
        () => exportLogAsText({}),
        { message: 'Trips must be an array' }
      );
    });
  });

  // ===== validateBusinessUse() Tests =====
  describe('validateBusinessUse()', () => {
    
    it('should validate 90% threshold - meets requirement', () => {
      const result = validateBusinessUse(90);
      assert.strictEqual(result.meetsThreshold, true);
      assert.strictEqual(result.percentage, 90);
      assert.strictEqual(result.threshold, 90);
      assert.ok(result.message.includes('meets CRA 90% threshold'));
    });

    it('should validate 95% threshold - meets requirement', () => {
      const result = validateBusinessUse(95);
      assert.strictEqual(result.meetsThreshold, true);
    });

    it('should validate 100% threshold - meets requirement', () => {
      const result = validateBusinessUse(100);
      assert.strictEqual(result.meetsThreshold, true);
    });

    it('should validate 89.99% - does not meet requirement', () => {
      const result = validateBusinessUse(89.99);
      assert.strictEqual(result.meetsThreshold, false);
      assert.ok(result.message.includes('does not meet CRA 90% threshold'));
    });

    it('should validate 50% - does not meet requirement', () => {
      const result = validateBusinessUse(50);
      assert.strictEqual(result.meetsThreshold, false);
    });

    it('should validate 0% - does not meet requirement', () => {
      const result = validateBusinessUse(0);
      assert.strictEqual(result.meetsThreshold, false);
    });

    it('should throw error for negative percentage', () => {
      assert.throws(
        () => validateBusinessUse(-10),
        { message: 'Percentage must be between 0 and 100' }
      );
    });

    it('should throw error for percentage over 100', () => {
      assert.throws(
        () => validateBusinessUse(101),
        { message: 'Percentage must be between 0 and 100' }
      );
    });

    it('should throw error if percentage is not a number', () => {
      assert.throws(
        () => validateBusinessUse('90'),
        { message: 'Percentage must be a number' }
      );
    });
  });

  // ===== getAnnualSummary() Tests =====
  describe('getAnnualSummary()', () => {
    
    it('should generate complete annual summary', () => {
      const trips = [
        addTrip('2024-01-15', 1000, 1100, 'Office', 'Work', true),
        addTrip('2024-01-16', 1100, 1150, 'Mall', 'Shopping', false),
        addTrip('2024-01-17', 1150, 1200, 'Client', 'Meeting', true)
      ];
      const summary = getAnnualSummary(trips);
      
      assert.strictEqual(summary.totalTrips, 3);
      assert.strictEqual(summary.businessTrips, 2);
      assert.strictEqual(summary.personalTrips, 1);
      assert.strictEqual(summary.totalDistance, 200);
      assert.strictEqual(summary.businessDistance, 150);
      assert.strictEqual(summary.personalDistance, 50);
      assert.strictEqual(summary.businessPercentage, 75);
      assert.strictEqual(summary.meetsThreshold, false);
    });

    it('should show meetsThreshold true when at 90%', () => {
      const trips = [
        addTrip('2024-01-15', 1000, 1090, 'Office', 'Work', true),
        addTrip('2024-01-16', 1090, 1100, 'Mall', 'Shopping', false)
      ];
      const summary = getAnnualSummary(trips);
      assert.strictEqual(summary.meetsThreshold, true);
      assert.strictEqual(summary.businessPercentage, 90);
    });

    it('should handle empty trips array', () => {
      const summary = getAnnualSummary([]);
      assert.strictEqual(summary.totalTrips, 0);
      assert.strictEqual(summary.totalDistance, 0);
      assert.strictEqual(summary.businessPercentage, 0);
      assert.strictEqual(summary.meetsThreshold, false);
    });

    it('should throw error if trips is not an array', () => {
      assert.throws(
        () => getAnnualSummary('not an array'),
        { message: 'Trips must be an array' }
      );
    });
  });

  // ===== getRepresentativePeriod() Tests =====
  describe('getRepresentativePeriod()', () => {
    
    it('should extract 3-month representative period', () => {
      const trips = [
        addTrip('2024-01-15', 1000, 1050, 'Office', 'Work', true),
        addTrip('2024-02-15', 1050, 1100, 'Client', 'Meeting', true),
        addTrip('2024-03-15', 1100, 1150, 'Office', 'Work', true),
        addTrip('2024-04-15', 1150, 1200, 'Office', 'Work', true),
        addTrip('2024-05-15', 1200, 1250, 'Office', 'Work', true)
      ];
      
      const period = getRepresentativePeriod(trips, '2024-01-01', '2024-03-31');
      assert.strictEqual(period.length, 3);
      assert.strictEqual(period[0].date, '2024-01-15');
      assert.strictEqual(period[2].date, '2024-03-15');
    });

    it('should return empty array if no trips in period', () => {
      const trips = [
        addTrip('2024-01-15', 1000, 1050, 'Office', 'Work', true)
      ];
      const period = getRepresentativePeriod(trips, '2024-06-01', '2024-08-31');
      assert.strictEqual(period.length, 0);
    });

    it('should include trips on boundary dates', () => {
      const trips = [
        addTrip('2024-01-01', 1000, 1050, 'Office', 'Work', true),
        addTrip('2024-03-31', 1050, 1100, 'Office', 'Work', true)
      ];
      const period = getRepresentativePeriod(trips, '2024-01-01', '2024-03-31');
      assert.strictEqual(period.length, 2);
    });

    it('should throw error if trips is not an array', () => {
      assert.throws(
        () => getRepresentativePeriod(null, '2024-01-01', '2024-03-31'),
        { message: 'Trips must be an array' }
      );
    });

    it('should throw error if dates are missing', () => {
      assert.throws(
        () => getRepresentativePeriod([], '', '2024-03-31'),
        { message: 'Start and end dates are required' }
      );
    });

    it('should throw error if end date is before start date', () => {
      assert.throws(
        () => getRepresentativePeriod([], '2024-03-31', '2024-01-01'),
        { message: 'End date cannot be before start date' }
      );
    });

    it('should throw error for invalid date format', () => {
      assert.throws(
        () => getRepresentativePeriod([], 'invalid', '2024-03-31'),
        { message: 'Invalid date format' }
      );
    });
  });

  // ===== Real-World Scenario Tests =====
  describe('Real-World Scenarios', () => {
    
    it('should handle Uber driver with 95% business use', () => {
      const trips = [
        addTrip('2024-01-15', 10000, 10237.5, 'Downtown', 'Uber rides', true),
        addTrip('2024-01-15', 10237.5, 10475, 'Airport', 'Uber rides', true),
        addTrip('2024-01-15', 10475, 10712.5, 'Suburbs', 'Uber rides', true),
        addTrip('2024-01-15', 10712.5, 10950, 'City Center', 'Uber rides', true),
        addTrip('2024-01-16', 10950, 11000, 'Grocery Store', 'Personal shopping', false)
      ];
      
      const percentage = calculateBusinessPercentage(trips);
      const validation = validateBusinessUse(percentage);
      const summary = getAnnualSummary(trips);
      
      assert.strictEqual(percentage, 95);
      assert.strictEqual(validation.meetsThreshold, true);
      assert.strictEqual(summary.totalDistance, 1000);
      assert.strictEqual(summary.businessDistance, 950);
      assert.strictEqual(summary.meetsThreshold, true);
    });

    it('should handle delivery driver just meeting 90% threshold', () => {
      const trips = [
        addTrip('2024-01-15', 5000, 5900, 'Delivery routes', 'Food delivery', true),
        addTrip('2024-01-16', 5900, 6000, 'Home to Mall', 'Shopping', false)
      ];
      
      const percentage = calculateBusinessPercentage(trips);
      const validation = validateBusinessUse(percentage);
      
      assert.strictEqual(percentage, 90);
      assert.strictEqual(validation.meetsThreshold, true);
    });

    it('should handle driver falling just short of threshold', () => {
      const trips = [
        addTrip('2024-01-15', 5000, 5890, 'Delivery routes', 'Deliveries', true),
        addTrip('2024-01-16', 5890, 6000, 'Personal trips', 'Errands', false)
      ];
      
      const percentage = calculateBusinessPercentage(trips);
      const validation = validateBusinessUse(percentage);
      
      assert.strictEqual(percentage, 89);
      assert.strictEqual(validation.meetsThreshold, false);
      assert.ok(validation.message.includes('does not meet'));
    });

    it('should handle complete year of mixed trips', () => {
      const trips = [];
      let currentKm = 10000;
      
      // Add 12 months of trips
      for (let month = 1; month <= 12; month++) {
        // Business trips
        for (let i = 0; i < 20; i++) {
          const date = `2024-${String(month).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
          trips.push(addTrip(date, currentKm, currentKm + 50, 'Business location', 'Work', true));
          currentKm += 50;
        }
        // Personal trips
        for (let i = 0; i < 2; i++) {
          const date = `2024-${String(month).padStart(2, '0')}-${String(25 + i).padStart(2, '0')}`;
          trips.push(addTrip(date, currentKm, currentKm + 30, 'Personal location', 'Personal', false));
          currentKm += 30;
        }
      }
      
      const summary = getAnnualSummary(trips);
      assert.strictEqual(summary.totalTrips, 264); // 22 trips * 12 months
      assert.strictEqual(summary.businessTrips, 240);
      assert.strictEqual(summary.personalTrips, 24);
      
      const percentage = summary.businessPercentage;
      assert.ok(percentage > 92); // Should be around 92-93%
      assert.strictEqual(summary.meetsThreshold, true);
    });

    it('should handle CSV export for tax filing', () => {
      const trips = [
        addTrip('2024-01-15', 10000, 10100, 'Client A', 'Business meeting', true),
        addTrip('2024-01-16', 10100, 10150, 'Client B', 'Consultation', true),
        addTrip('2024-01-17', 10150, 10180, 'Grocery', 'Shopping', false)
      ];
      
      const csv = exportLogAsCSV(trips);
      const lines = csv.split('\n');
      
      assert.strictEqual(lines.length, 4); // Header + 3 trips
      assert.ok(lines[0].includes('Date'));
      assert.ok(lines[0].includes('Distance (km)'));
      assert.ok(lines[1].includes('2024-01-15'));
      assert.ok(lines[2].includes('2024-01-16'));
      assert.ok(lines[3].includes('2024-01-17'));
    });

    it('should generate printable log for CRA audit', () => {
      const trips = [
        addTrip('2024-01-15', 10000, 10100, 'Client Office', 'Meeting', true),
        addTrip('2024-01-16', 10100, 10120, 'Personal', 'Errands', false)
      ];
      
      const text = exportLogAsText(trips);
      
      assert.ok(text.includes('CRA COMPLIANT'));
      assert.ok(text.includes('Trip 1:'));
      assert.ok(text.includes('Trip 2:'));
      assert.ok(text.includes('SUMMARY'));
      assert.ok(text.includes('Business Use:'));
    });
  });
});
