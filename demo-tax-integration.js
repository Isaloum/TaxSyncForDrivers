#!/usr/bin/env node
/**
 * Demo: Tax Forms Integration
 * Demonstrates complete tax package generation for rideshare drivers
 */

import { generateCompleteTaxPackage, getPackageSummary } from './tax-forms-integration.js';

console.log('='.repeat(80));
console.log('TAX FORMS INTEGRATION DEMO');
console.log('Complete Tax Package Generator for Rideshare Drivers');
console.log('='.repeat(80));
console.log('');

// Sample driver data - Ontario driver
const ontarioDriver = {
  driverInfo: {
    name: 'Sarah Johnson',
    sin: '123-456-789',
    address: '456 Queen St, Toronto, ON M5V 2B4',
    fiscalYear: 2026,
    province: 'ON'
  },
  income: {
    grossFares: 65000,
    commissions: -13000,  // Uber/Lyft fees
    otherIncome: 500      // Tips
  },
  trips: [
    { date: '2026-01-15', startKm: 45000, endKm: 45250, destination: 'Airport', purpose: 'Passenger pickup', isBusinessTrip: true, distance: 250 },
    { date: '2026-01-16', startKm: 45250, endKm: 45600, destination: 'Downtown', purpose: 'Multiple fares', isBusinessTrip: true, distance: 350 },
    { date: '2026-01-17', startKm: 45600, endKm: 45700, destination: 'Home Depot', purpose: 'Personal shopping', isBusinessTrip: false, distance: 100 },
    { date: '2026-02-10', startKm: 45700, endKm: 46000, destination: 'Various', purpose: 'Rideshare', isBusinessTrip: true, distance: 300 }
  ],
  receipts: [
    { date: '2026-01-10', amount: 85.50, vendor: 'Shell', category: 'fuel', imageUrl: 'https://receipts.com/1' },
    { date: '2026-01-15', amount: 200.00, vendor: 'Canadian Tire', category: 'maintenance', imageUrl: 'https://receipts.com/2' },
    { date: '2026-02-01', amount: 1800.00, vendor: 'TD Insurance', category: 'insurance', imageUrl: 'https://receipts.com/3' },
    { date: '2026-02-05', amount: 85.00, vendor: 'Rogers', category: 'telephone', imageUrl: 'https://receipts.com/4' },
    { date: '2026-03-01', amount: 120.00, vendor: 'Shell', category: 'fuel', imageUrl: 'https://receipts.com/5' }
  ],
  vehicle: {
    cost: 32000,
    businessUsePercentage: 90,
    years: 1
  },
  language: 'en',
  gstRegistered: true
};

console.log('SCENARIO 1: Ontario Driver with Vehicle');
console.log('-'.repeat(80));
const ontarioPackage = generateCompleteTaxPackage(ontarioDriver);
console.log(getPackageSummary(ontarioPackage));
console.log('');
console.log('');

// Sample driver data - Quebec driver
const quebecDriver = {
  driverInfo: {
    name: 'Marc Dubois',
    sin: '987-654-321',
    address: '123 Rue Saint-Denis, Montréal, QC H2X 3K8',
    fiscalYear: 2026,
    province: 'QC'
  },
  income: {
    grossFares: 58000,
    commissions: -11600,
    otherIncome: 800
  },
  trips: [
    { date: '2026-01-05', startKm: 20000, endKm: 20400, destination: 'Aéroport', purpose: 'Client', isBusinessTrip: true, distance: 400 },
    { date: '2026-01-06', startKm: 20400, endKm: 20850, destination: 'Centre-ville', purpose: 'Multiples courses', isBusinessTrip: true, distance: 450 },
    { date: '2026-01-07', startKm: 20850, endKm: 20900, destination: 'Épicerie', purpose: 'Personnel', isBusinessTrip: false, distance: 50 }
  ],
  receipts: [
    { date: '2026-01-08', amount: 95.00, vendor: 'Petro-Canada', category: 'fuel', imageUrl: 'https://receipts.com/q1' },
    { date: '2026-01-20', amount: 250.00, vendor: 'Garage Montréal', category: 'maintenance', imageUrl: 'https://receipts.com/q2' },
    { date: '2026-02-01', amount: 1950.00, vendor: 'Desjardins Assurance', category: 'insurance', imageUrl: 'https://receipts.com/q3' },
    { date: '2026-02-10', amount: 95.00, vendor: 'Bell', category: 'telephone', imageUrl: 'https://receipts.com/q4' }
  ],
  vehicle: {
    cost: 28000,
    businessUsePercentage: 90,
    years: 1
  },
  language: 'fr',
  gstRegistered: true
};

console.log('SCENARIO 2: Quebec Driver (with FSS and QPP)');
console.log('-'.repeat(80));
const quebecPackage = generateCompleteTaxPackage(quebecDriver);
console.log(getPackageSummary(quebecPackage));
console.log('');
console.log('');

// Sample driver data - New driver without vehicle
const newDriver = {
  driverInfo: {
    name: 'Alex Chen',
    sin: '555-123-456',
    address: '789 Main St, Vancouver, BC V6B 2W9',
    fiscalYear: 2026,
    province: 'BC'
  },
  income: {
    grossFares: 25000,
    commissions: -5000,
    otherIncome: 200
  },
  trips: [],
  receipts: [
    { date: '2026-06-15', amount: 45.00, vendor: 'Shell', category: 'fuel', imageUrl: null },
    { date: '2026-06-20', amount: 60.00, vendor: 'Telus', category: 'telephone', imageUrl: 'https://receipts.com/n1' }
  ],
  language: 'en',
  gstRegistered: false,
  quarterlyRevenue: [
    { quarter: 1, year: 2026, revenue: 5000 },
    { quarter: 2, year: 2026, revenue: 8000 },
    { quarter: 3, year: 2026, revenue: 7000 },
    { quarter: 4, year: 2026, revenue: 5000 }
  ]
};

console.log('SCENARIO 3: New Driver (No Vehicle, Below GST Threshold)');
console.log('-'.repeat(80));
const newDriverPackage = generateCompleteTaxPackage(newDriver);
console.log(getPackageSummary(newDriverPackage));
console.log('');

console.log('='.repeat(80));
console.log('DEMO COMPLETE');
console.log('');
console.log('Key Features Demonstrated:');
console.log('  ✓ Complete tax package generation');
console.log('  ✓ T2125 (Federal) and TP-80-V (Quebec) forms');
console.log('  ✓ CCA calculation for vehicles');
console.log('  ✓ Business use calculation from mileage logs');
console.log('  ✓ Expense auto-population from receipts');
console.log('  ✓ GST/QST registration analysis');
console.log('  ✓ FSS and QPP calculations for Quebec');
console.log('  ✓ Comprehensive validation and warnings');
console.log('='.repeat(80));
