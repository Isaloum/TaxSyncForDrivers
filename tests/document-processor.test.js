// tests/document-processor.test.js — Tests for document processing
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { DocumentProcessor, quickProcess } from '../document-processor.js';
import { DOCUMENT_TYPES } from '../pattern-library.js';

describe('Document Processor Tests', () => {
  describe('quickProcess', () => {
    it('should process T4 text successfully', () => {
      const t4Text = `
        Statement of Remuneration Paid (T4)
        Box 14: 52,000.00 Employment income
        Box 16: 2,898.00 CPP contributions
        Box 18: 815.22 EI premiums
      `;
      const result = quickProcess(t4Text);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.documentType, DOCUMENT_TYPES.T4);
      assert.strictEqual(result.extractedData.employmentIncome, 52000);
    });

    it('should process RL-1 text successfully', () => {
      const rl1Text = `
        Relevé 1 - RL-1
        Case A: 48,000.00 Revenu d'emploi
        Case B.A: 2,750.50 Cotisations au RRQ
      `;
      const result = quickProcess(rl1Text);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.documentType, DOCUMENT_TYPES.RL1);
      assert.strictEqual(result.extractedData.employmentIncome, 48000);
    });

    it('should process Uber summary successfully', () => {
      const uberText = `
        Uber Driver Summary
        Gross Fares: $1,250.00
        Tips: $150.00
        Distance: 350.5 km
      `;
      const result = quickProcess(uberText);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.documentType, DOCUMENT_TYPES.UBER_SUMMARY);
      assert.strictEqual(result.extractedData.grossFares, 1250);
    });

    it('should handle unknown document type', () => {
      const randomText = 'This is just random text with no meaningful data';
      const result = quickProcess(randomText);
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.documentType, DOCUMENT_TYPES.UNKNOWN);
      assert.ok(result.error.includes('Could not identify document type'));
    });

    it('should include validation results', () => {
      const t4Text = 'Box 14: 52,000.00';
      const result = quickProcess(t4Text);
      assert.ok(result.validation);
      assert.ok(typeof result.validation.isValid === 'boolean');
      assert.ok(Array.isArray(result.validation.errors));
      assert.ok(Array.isArray(result.validation.warnings));
      assert.ok(typeof result.validation.confidenceScore === 'number');
    });

    it('should include raw text in result', () => {
      const text = 'Box 14: 52,000.00';
      const result = quickProcess(text);
      assert.ok(result.rawText);
      assert.strictEqual(typeof result.rawText, 'string');
    });
  });

  describe('DocumentProcessor class', () => {
    it('should create processor instance', () => {
      const processor = new DocumentProcessor();
      assert.ok(processor);
      assert.strictEqual(processor.useOCR, false);
    });

    it('should process text through class method', () => {
      const processor = new DocumentProcessor();
      const t4Text = `
        Statement of Remuneration Paid (T4)
        Box 14: 52,000.00 Employment income
      `;
      const result = processor.processText(t4Text);
      assert.strictEqual(result.documentType, DOCUMENT_TYPES.T4);
    });

    it('should handle errors gracefully', () => {
      const processor = new DocumentProcessor();
      const result = processor.processText('');
      assert.strictEqual(result.success, false);
    });
  });

  describe('Validation Integration', () => {
    it('should mark valid T4 as successful', () => {
      const t4Text = `
        Statement of Remuneration Paid (T4)
        Box 14: 52,000.00 Employment income
        Box 16: 2,898.00
        Box 18: 815.22
      `;
      const result = quickProcess(t4Text);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.validation.isValid, true);
    });

    it('should have high confidence for well-formed documents', () => {
      const t4Text = `
        Statement of Remuneration Paid (T4)
        Box 14: 52,000.00 Employment income
        Box 16: 2,898.00
        Box 18: 815.22
      `;
      const result = quickProcess(t4Text);
      assert.ok(result.validation.confidenceScore >= 90);
    });

    it('should provide warnings for unusual data', () => {
      const t4Text = `
        Statement of Remuneration Paid (T4)
        Box 14: 600,000.00 Employment income
      `;
      const result = quickProcess(t4Text);
      assert.ok(result.validation.warnings.length > 0);
    });
  });

  describe('Gas Receipt Processing', () => {
    it('should process gas receipt', () => {
      const receiptText = `
        Shell Gas Station
        Date: 01/15/2025
        Total: $65.98
        Liters: 45.5
      `;
      const result = quickProcess(receiptText);
      assert.strictEqual(result.documentType, DOCUMENT_TYPES.GAS_RECEIPT);
      assert.strictEqual(result.extractedData.total, 65.98);
    });

    it('should validate gas receipt amounts', () => {
      const receiptText = `
        Shell
        Total: $65.98
        Liters: 45.5
        Date: 01/15/2025
      `;
      const result = quickProcess(receiptText);
      assert.strictEqual(result.success, true);
    });
  });
});
