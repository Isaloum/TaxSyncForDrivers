// tests/pattern-library.test.js — Tests for document pattern matching and extraction
import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  classifyDocument,
  extractFields,
  extractValue,
  DOCUMENT_TYPES,
  T4_PATTERNS,
  RL1_PATTERNS,
  UBER_PATTERNS,
  GAS_RECEIPT_PATTERNS,
} from '../pattern-library.js';

describe('Pattern Library Tests', () => {
  describe('extractValue', () => {
    it('should extract numeric values', () => {
      const text = 'Box 14: 52,000.00';
      const value = extractValue(text, /Box\s+14[:\s]*([\d,]+\.?\d*)/i);
      assert.strictEqual(value, 52000);
    });

    it('should extract string values', () => {
      const text = 'Employer: Acme Corporation';
      const value = extractValue(text, /Employer[:\s]*([A-Za-z\s]+)/i);
      assert.strictEqual(value, 'Acme Corporation');
    });

    it('should return null for no match', () => {
      const text = 'Random text';
      const value = extractValue(text, /Box\s+14[:\s]*([\d,]+\.?\d*)/i);
      assert.strictEqual(value, null);
    });
  });

  describe('classifyDocument - T4', () => {
    it('should identify T4 slip', () => {
      const t4Text = `
        Statement of Remuneration Paid (T4)
        Box 14: 52,000.00 Employment income
        Box 16: 2,898.00 CPP contributions
        Box 18: 815.22 EI premiums
      `;
      const docType = classifyDocument(t4Text);
      assert.strictEqual(docType, DOCUMENT_TYPES.T4);
    });

    it('should extract T4 fields correctly', () => {
      const t4Text = `
        Box 14: 52,000.00
        Box 16: 2,898.00
        Box 18: 815.22
        Box 22: 9,500.00
      `;
      const fields = extractFields(t4Text, DOCUMENT_TYPES.T4);
      assert.strictEqual(fields.employmentIncome, 52000);
      assert.strictEqual(fields.cpp, 2898);
      assert.strictEqual(fields.ei, 815.22);
      assert.strictEqual(fields.incomeTax, 9500);
    });
  });

  describe('classifyDocument - RL-1', () => {
    it('should identify RL-1 slip', () => {
      const rl1Text = `
        Relevé 1 - RL-1
        Case A: 48,000.00 Revenu d'emploi
        Case B.A: 2,750.50 Cotisations au RRQ
        Case C: 755.04 Cotisations à l'assurance-emploi
      `;
      const docType = classifyDocument(rl1Text);
      assert.strictEqual(docType, DOCUMENT_TYPES.RL1);
    });

    it('should extract RL-1 fields correctly', () => {
      const rl1Text = `
        Box A: 48,000.00
        Box B.A: 2,750.50
        Box C: 755.04
        Box E: 8,200.00
      `;
      const fields = extractFields(rl1Text, DOCUMENT_TYPES.RL1);
      assert.strictEqual(fields.employmentIncome, 48000);
      assert.strictEqual(fields.qpp, 2750.5);
      assert.strictEqual(fields.ei, 755.04);
      assert.strictEqual(fields.incomeTax, 8200);
    });
  });

  describe('classifyDocument - Uber Summary', () => {
    it('should identify Uber summary', () => {
      const uberText = `
        Uber Driver Summary
        Week of January 15 - January 21, 2025
        Gross Fares: $1,250.00
        Tips: $150.00
        Distance: 350 km
        Total Trips: 45
      `;
      const docType = classifyDocument(uberText);
      assert.strictEqual(docType, DOCUMENT_TYPES.UBER_SUMMARY);
    });

    it('should extract Uber fields correctly', () => {
      const uberText = `
        Gross Fares: $1,250.00
        Tips: $150.00
        Tolls: $25.00
        Distance: 350.5 km
        Total Trips: 45
        Net Earnings: $1,075.00
      `;
      const fields = extractFields(uberText, DOCUMENT_TYPES.UBER_SUMMARY);
      assert.strictEqual(fields.grossFares, 1250);
      assert.strictEqual(fields.tips, 150);
      assert.strictEqual(fields.tolls, 25);
      assert.strictEqual(fields.distance, 350.5);
      assert.strictEqual(fields.trips, 45);
      assert.strictEqual(fields.netEarnings, 1075);
    });
  });

  describe('classifyDocument - Gas Receipt', () => {
    it('should identify gas receipt', () => {
      const gasText = `
        Shell Gas Station
        Date: 01/15/2025
        Liters: 45.5
        Price per L: $1.45
        Total: $65.98
      `;
      const docType = classifyDocument(gasText);
      assert.strictEqual(docType, DOCUMENT_TYPES.GAS_RECEIPT);
    });

    it('should extract gas receipt fields correctly', () => {
      const gasText = `
        Total: $65.98
        Liters: 45.5
        Date: 01/15/2025
        Shell
      `;
      const fields = extractFields(gasText, DOCUMENT_TYPES.GAS_RECEIPT);
      assert.strictEqual(fields.total, 65.98);
      assert.strictEqual(fields.liters, 45.5);
      assert.strictEqual(fields.date, '01/15/2025');
    });
  });

  describe('classifyDocument - Unknown', () => {
    it('should return UNKNOWN for unrecognized documents', () => {
      const randomText = 'This is just some random text that does not match any pattern';
      const docType = classifyDocument(randomText);
      assert.strictEqual(docType, DOCUMENT_TYPES.UNKNOWN);
    });
  });

  describe('extractFields - Edge Cases', () => {
    it('should handle missing fields gracefully', () => {
      const partialT4 = 'Box 14: 52,000.00';
      const fields = extractFields(partialT4, DOCUMENT_TYPES.T4);
      assert.strictEqual(fields.employmentIncome, 52000);
      assert.strictEqual(fields.cpp, undefined);
      assert.strictEqual(fields.ei, undefined);
    });

    it('should handle commas in numbers', () => {
      const text = 'Box 14: 152,345.67';
      const fields = extractFields(text, DOCUMENT_TYPES.T4);
      assert.strictEqual(fields.employmentIncome, 152345.67);
    });

    it('should round to 2 decimal places', () => {
      const text = 'Total: $45.999';
      const value = extractValue(text, /Total[:\s]*\$?\s*([\d,]+\.?\d*)/i);
      assert.strictEqual(value, 46);
    });
  });
});
