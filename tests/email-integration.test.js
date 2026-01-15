// tests/email-integration.test.js — Tests for email integration system
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { handleEmailWebhook } from '../email-handler.js';
import {
  updateUserTaxData,
  getUserProfile,
  createUserProfile,
  resetUserProfile,
  getTaxSummary,
} from '../tax-integration.js';
import { DOCUMENT_TYPES } from '../pattern-library.js';
import {
  sendProcessingResults,
  sendErrorNotification,
  sendWelcomeInstructions,
} from '../email-sender.js';

describe('Email Integration System Tests', () => {
  describe('Email Webhook Handler', () => {
    it('should process email with Uber summary attachment', async () => {
      const webhookPayload = {
        from: 'test@example.com',
        subject: 'Uber Weekly Summary',
        text: '',
        attachments: [],
        receivedAt: new Date().toISOString(),
      };

      const result = await handleEmailWebhook(webhookPayload);
      assert.strictEqual(result.success, true);
      assert.ok(result.processingResult);
      assert.ok(result.emailResponse);
    });

    it('should process email with text body containing tax data', async () => {
      const webhookPayload = {
        from: 'driver@example.com',
        subject: 'Tax documents',
        text: `
          Uber Driver Summary
          Gross Fares: $1,250.00
          Tips: $150.00
          Distance: 350.5 km
        `,
        attachments: [],
        receivedAt: new Date().toISOString(),
      };

      const result = await handleEmailWebhook(webhookPayload);
      assert.strictEqual(result.success, true);
      assert.ok(result.processingResult.processedDocuments.length > 0);
    });

    it('should handle email with no valid documents', async () => {
      const webhookPayload = {
        from: 'user@example.com',
        subject: 'Random email',
        text: 'This is just a regular email with no tax data.',
        attachments: [],
        receivedAt: new Date().toISOString(),
      };

      const result = await handleEmailWebhook(webhookPayload);
      // Should not fail, but won't have processed documents
      assert.ok(result);
    });

    it('should generate email response for successful processing', async () => {
      const webhookPayload = {
        from: 'driver@example.com',
        subject: 'Documents',
        text: `
          Shell Gas Station
          Date: 01/15/2025
          Total: $65.98
          Liters: 45.5
        `,
        attachments: [],
        receivedAt: new Date().toISOString(),
      };

      const result = await handleEmailWebhook(webhookPayload);
      assert.strictEqual(result.success, true);
      assert.ok(result.emailResponse);
      assert.ok(result.emailResponse.to);
      assert.ok(result.emailResponse.subject);
    });
  });

  describe('Tax Integration', () => {
    beforeEach(() => {
      // Clean up test user profile before each test
      resetUserProfile('taxtest@example.com');
    });

    it('should create new user profile', () => {
      const profile = createUserProfile('newuser@example.com');
      assert.strictEqual(profile.email, 'newuser@example.com');
      assert.strictEqual(profile.income, 0);
      assert.strictEqual(profile.documentCount, 0);
    });

    it('should get existing user profile', () => {
      createUserProfile('existing@example.com');
      const profile = getUserProfile('existing@example.com');
      assert.ok(profile);
      assert.strictEqual(profile.email, 'existing@example.com');
    });

    it('should update tax data for Uber summary', async () => {
      const documentResult = {
        documentType: DOCUMENT_TYPES.UBER_SUMMARY,
        extractedData: {
          grossFares: 1250,
          tips: 150,
          distance: 350.5,
          trips: 45,
        },
      };

      await updateUserTaxData('taxtest@example.com', documentResult);

      const profile = getUserProfile('taxtest@example.com');
      assert.strictEqual(profile.income, 1400); // 1250 + 150
      assert.ok(profile.vehicleExpenses > 0); // Should have vehicle deduction
    });

    it('should update tax data for gas receipt', async () => {
      const documentResult = {
        documentType: DOCUMENT_TYPES.GAS_RECEIPT,
        extractedData: {
          total: 65.98,
          liters: 45.5,
        },
      };

      await updateUserTaxData('taxtest@example.com', documentResult);

      const profile = getUserProfile('taxtest@example.com');
      const expectedFuelExpense = 65.98 * 0.85; // 85% business use
      assert.strictEqual(
        Math.round(profile.fuelExpenses * 100) / 100,
        Math.round(expectedFuelExpense * 100) / 100
      );
    });

    it('should update tax data for T4 slip', async () => {
      const documentResult = {
        documentType: DOCUMENT_TYPES.T4,
        extractedData: {
          employmentIncome: 52000,
          incomeTax: 8500,
        },
      };

      await updateUserTaxData('taxtest@example.com', documentResult);

      const profile = getUserProfile('taxtest@example.com');
      assert.strictEqual(profile.employmentIncome, 52000);
      assert.strictEqual(profile.taxDeducted, 8500);
    });

    it('should calculate vehicle deduction correctly', async () => {
      const documentResult = {
        documentType: DOCUMENT_TYPES.UBER_SUMMARY,
        extractedData: {
          grossFares: 2000,
          distance: 6000, // Over 5000 km
        },
      };

      await updateUserTaxData('taxtest@example.com', documentResult);

      const profile = getUserProfile('taxtest@example.com');
      // 5000 * 0.70 + 1000 * 0.64 = 3500 + 640 = 4140
      assert.strictEqual(Math.round(profile.vehicleExpenses), 4140);
    });

    it('should increment document count', async () => {
      const doc1 = {
        documentType: DOCUMENT_TYPES.GAS_RECEIPT,
        extractedData: { total: 50 },
      };
      const doc2 = {
        documentType: DOCUMENT_TYPES.GAS_RECEIPT,
        extractedData: { total: 60 },
      };

      await updateUserTaxData('taxtest@example.com', doc1);
      await updateUserTaxData('taxtest@example.com', doc2);

      const profile = getUserProfile('taxtest@example.com');
      assert.strictEqual(profile.documentCount, 2);
    });

    it('should get tax summary', async () => {
      // Add some data
      await updateUserTaxData('taxtest@example.com', {
        documentType: DOCUMENT_TYPES.UBER_SUMMARY,
        extractedData: {
          grossFares: 1000,
          distance: 200,
        },
      });

      const summary = getTaxSummary('taxtest@example.com');
      assert.ok(summary);
      assert.ok(summary.income);
      assert.ok(summary.expenses);
      assert.ok(summary.taxCalculation);
      assert.strictEqual(summary.income.selfEmployment, 1000);
    });

    it('should calculate taxes with multiple income sources', async () => {
      // Add employment income
      await updateUserTaxData('taxtest@example.com', {
        documentType: DOCUMENT_TYPES.T4,
        extractedData: { employmentIncome: 30000 },
      });

      // Add self-employment income
      await updateUserTaxData('taxtest@example.com', {
        documentType: DOCUMENT_TYPES.UBER_SUMMARY,
        extractedData: { grossFares: 20000, distance: 3000 },
      });

      const summary = getTaxSummary('taxtest@example.com');
      assert.strictEqual(summary.income.total, 50000); // 30k + 20k
      assert.ok(summary.expenses.vehicle > 0);
      assert.ok(summary.taxCalculation.totalTax > 0);
    });
  });

  describe('Email Sender', () => {
    it('should generate processing results email', async () => {
      const results = [
        {
          documentType: DOCUMENT_TYPES.UBER_SUMMARY,
          fileName: 'uber_summary.pdf',
          extractedData: {
            grossFares: 1200,
            tips: 100,
            distance: 300,
          },
        },
      ];

      const email = await sendProcessingResults('test@example.com', results, 'My Documents', []);

      assert.ok(email);
      assert.strictEqual(email.to, 'test@example.com');
      assert.ok(email.subject.includes('Documents Processed'));
      assert.ok(email.html);
      assert.ok(email.text);
    });

    it('should generate error notification email', async () => {
      const email = await sendErrorNotification(
        'test@example.com',
        'File format not supported',
        'My Documents'
      );

      assert.ok(email);
      assert.strictEqual(email.to, 'test@example.com');
      assert.ok(email.subject.includes('Failed'));
      assert.ok(email.html.includes('File format not supported'));
    });

    it('should generate welcome email', async () => {
      const email = await sendWelcomeInstructions('newuser@example.com');

      assert.ok(email);
      assert.strictEqual(email.to, 'newuser@example.com');
      assert.ok(email.subject.includes('Welcome'));
      assert.ok(email.html.includes('notifications@isaloumapps.com'));
    });

    it('should include tax savings in results email', async () => {
      const results = [
        {
          documentType: DOCUMENT_TYPES.GAS_RECEIPT,
          fileName: 'gas.jpg',
          extractedData: {
            total: 100,
          },
        },
      ];

      const email = await sendProcessingResults('test@example.com', results, 'Receipt', []);

      assert.ok(email.html.includes('Tax Savings') || email.html.includes('Tax Impact'));
    });
  });

  describe('End-to-End Email Processing', () => {
    beforeEach(() => {
      resetUserProfile('e2e@example.com');
    });

    it('should process complete email workflow', async () => {
      // Step 1: Receive email
      const webhookPayload = {
        from: 'e2e@example.com',
        subject: 'Weekly Documents',
        text: `
          Uber Weekly Summary
          Period: Jan 1 - Jan 7, 2025
          Gross Fares: $1,500.00
          Tips: $200.00
          Distance: 450 km
          Trips: 65
        `,
        attachments: [],
        receivedAt: new Date().toISOString(),
      };

      // Step 2: Process email
      const result = await handleEmailWebhook(webhookPayload);
      assert.strictEqual(result.success, true);

      // Step 3: Update tax data (simulating what email-server.js does)
      for (const doc of result.processingResult.processedDocuments) {
        await updateUserTaxData('e2e@example.com', doc);
      }

      // Step 4: Verify tax data updated
      const profile = getUserProfile('e2e@example.com');
      assert.ok(profile);
      assert.strictEqual(profile.income, 1700); // 1500 + 200

      // Step 5: Verify email response generated
      assert.ok(result.emailResponse);
      assert.ok(result.emailResponse.subject);
    });

    it('should handle multiple documents in sequence', async () => {
      // Document 1: Uber summary
      const result1 = await handleEmailWebhook({
        from: 'e2e@example.com',
        subject: 'Uber Summary',
        text: `
          Uber Driver Summary
          Gross Fares: $1000
          Distance: 200 km
          Trips: 30
        `,
        attachments: [],
      });

      for (const doc of result1.processingResult.processedDocuments) {
        await updateUserTaxData('e2e@example.com', doc);
      }

      // Document 2: Gas receipt
      const result2 = await handleEmailWebhook({
        from: 'e2e@example.com',
        subject: 'Gas Receipt',
        text: `
          Shell Gas Station
          Total: $50.00
          Liters: 35
          Date: 01/15/2025
        `,
        attachments: [],
      });

      for (const doc of result2.processingResult.processedDocuments) {
        await updateUserTaxData('e2e@example.com', doc);
      }

      const profile = getUserProfile('e2e@example.com');
      assert.ok(profile, 'Profile should exist');
      assert.strictEqual(profile.income, 1000);
      assert.ok(profile.fuelExpenses > 0);
      assert.strictEqual(profile.documentCount, 2);
    });
  });
});
