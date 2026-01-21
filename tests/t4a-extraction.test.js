// tests/t4a-extraction.test.js — Tests for T4A slip extraction
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { extractT4A } from '../document-processor.js';
import { classifyDocument, extractFields, DOCUMENT_TYPES } from '../pattern-library.js';
import { validateT4A } from '../validation-engine.js';

describe('T4A Extraction Tests', () => {
  describe('T4A Classification', () => {
    it('should identify T4A slip with Box 048', () => {
      const t4aText = `
        T4A - Statement of Pension, Retirement, Annuity, and Other Income
        Payer: Acme Consulting Inc
        Box 048: $45,000.00 Fees for services
        Recipient: John Smith
        Tax Year: 2024
      `;
      const docType = classifyDocument(t4aText);
      assert.strictEqual(docType, DOCUMENT_TYPES.T4A);
    });

    it('should identify T4A slip with Box 020', () => {
      const t4aText = `
        T4A - Statement of Pension
        Box 020: $25,000.00 Self-employed commissions
        Recipient SIN: 123-456-789
        Tax Year: 2024
      `;
      const docType = classifyDocument(t4aText);
      assert.strictEqual(docType, DOCUMENT_TYPES.T4A);
    });

    it('should identify T4A slip with Box 028', () => {
      const t4aText = `
        T4A - Statement of Pension
        Box 028: $15,000.00 Other income
        Box 022: $3,000.00 Income tax deducted
        Tax Year: 2024
      `;
      const docType = classifyDocument(t4aText);
      assert.strictEqual(docType, DOCUMENT_TYPES.T4A);
    });
  });

  describe('extractT4A Function', () => {
    it('should extract Box 048 - Fees for services', () => {
      const text = `
        T4A Statement
        Box 048: $45,000.00
      `;
      const data = extractT4A(text);
      assert.strictEqual(data.feesForServices, 45000);
      assert.strictEqual(data.documentType, 'T4A');
    });

    it('should extract Box 020 - Commissions', () => {
      const text = `
        T4A Statement
        Box 020: $25,000.00
      `;
      const data = extractT4A(text);
      assert.strictEqual(data.commissions, 25000);
    });

    it('should extract Box 016 - Pension', () => {
      const text = `
        T4A Statement
        Box 016: $18,500.50
      `;
      const data = extractT4A(text);
      assert.strictEqual(data.pension, 18500.50);
    });

    it('should extract Box 024 - Lump-sum payments', () => {
      const text = `
        T4A Statement
        Box 024: $10,000.00
      `;
      const data = extractT4A(text);
      assert.strictEqual(data.lumpSum, 10000);
    });

    it('should extract Box 028 - Other income', () => {
      const text = `
        T4A Statement
        Box 028: $5,000.00
      `;
      const data = extractT4A(text);
      assert.strictEqual(data.otherIncome, 5000);
    });

    it('should extract Box 022 - Income tax deducted', () => {
      const text = `
        T4A Statement
        Box 022: $3,500.00
      `;
      const data = extractT4A(text);
      assert.strictEqual(data.incomeTaxDeducted, 3500);
    });

    it('should extract payer information', () => {
      const text = `
        T4A Statement
        Payer: Acme Consulting Corporation
        Business Number: 123456789 RC 0001
      `;
      const data = extractT4A(text);
      assert.strictEqual(data.payerName, 'Acme Consulting Corporation');
      assert.strictEqual(data.payerBusinessNumber, '123456789 RC 0001');
    });

    it('should extract recipient information', () => {
      const text = `
        T4A Statement
        Recipient: Jane Doe
        SIN: 123-456-789
      `;
      const data = extractT4A(text);
      assert.strictEqual(data.recipientName, 'Jane Doe');
      assert.strictEqual(data.recipientSIN, '123-456-789');
    });

    it('should extract tax year', () => {
      const text = `
        T4A Statement
        Tax Year: 2024
      `;
      const data = extractT4A(text);
      assert.strictEqual(data.year, '2024');
    });

    it('should calculate total income correctly', () => {
      const text = `
        T4A Statement
        Box 048: $30,000.00
        Box 020: $15,000.00
        Box 028: $5,000.00
      `;
      const data = extractT4A(text);
      assert.strictEqual(data.totalIncome, 50000);
    });

    it('should extract complete T4A slip', () => {
      const text = `
        T4A - Statement of Pension, Retirement, Annuity, and Other Income
        Tax Year: 2024
        
        Payer: Tech Consulting Ltd
        Business Number: 987654321 RC 0001
        
        Recipient: John Smith
        SIN: 987-654-321
        
        Box 048: CA$65,000.00 Fees for services
        Box 022: CA$13,000.00 Income tax deducted
      `;
      const data = extractT4A(text);
      
      assert.strictEqual(data.feesForServices, 65000);
      assert.strictEqual(data.incomeTaxDeducted, 13000);
      assert.strictEqual(data.payerName, 'Tech Consulting Ltd');
      assert.strictEqual(data.recipientName, 'John Smith');
      assert.strictEqual(data.year, '2024');
      assert.strictEqual(data.totalIncome, 65000);
    });
  });

  describe('extractFields with T4A', () => {
    it('should extract T4A fields using extractFields', () => {
      const text = `
        T4A Statement
        Box 048: $45,000.00
        Box 022: $9,000.00
        Tax Year: 2024
      `;
      const data = extractFields(text, DOCUMENT_TYPES.T4A);
      
      assert.strictEqual(data.feesForServices, 45000);
      assert.strictEqual(data.incomeTaxDeducted, 9000);
      assert.strictEqual(data.year, '2024');
    });
  });

  describe('validateT4A Function', () => {
    it('should validate valid T4A data', () => {
      const data = {
        feesForServices: 50000,
        incomeTaxDeducted: 10000,
        payerName: 'Tech Corp',
        year: '2024',
      };
      
      const result = validateT4A(data);
      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it('should reject T4A with no income', () => {
      const data = {
        feesForServices: 0,
        commissions: 0,
        otherIncome: 0,
      };
      
      const result = validateT4A(data);
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some(e => e.includes('income field')));
    });

    it('should warn if tax deducted exceeds 50% of income', () => {
      const data = {
        feesForServices: 10000,
        incomeTaxDeducted: 6000,
      };
      
      const result = validateT4A(data);
      assert.ok(result.warnings.some(w => w.includes('50%')));
    });

    it('should warn if year is out of range', () => {
      const data = {
        feesForServices: 50000,
        year: '2019', // More than 3 years ago
      };
      
      const result = validateT4A(data);
      assert.ok(result.warnings.some(w => w.includes('year')));
    });

    it('should warn if payer name is missing', () => {
      const data = {
        feesForServices: 50000,
        payerName: '',
      };
      
      const result = validateT4A(data);
      assert.ok(result.warnings.some(w => w.includes('Payer name')));
    });

    it('should validate T4A with multiple income sources', () => {
      const data = {
        feesForServices: 30000,
        commissions: 15000,
        otherIncome: 5000,
        incomeTaxDeducted: 10000,
        payerName: 'Multiple Inc',
        year: '2024',
      };
      
      const result = validateT4A(data);
      assert.strictEqual(result.isValid, true);
    });
  });
});
