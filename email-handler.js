// email-handler.js — Email processing workflow for tax documents
// Handles incoming emails with attachments and processes them automatically

import { createDocumentProcessor } from './document-processor.js';

/**
 * Email processing result
 * @typedef {Object} EmailProcessingResult
 * @property {boolean} success - Whether processing succeeded
 * @property {string} emailSubject - Email subject line
 * @property {string} emailFrom - Email sender
 * @property {Date} receivedAt - When email was received
 * @property {Array} processedDocuments - Array of processed document results
 * @property {Array} failedAttachments - Array of failed attachment names
 * @property {string} summary - Processing summary
 */

/**
 * EmailProcessor class for handling incoming email processing
 */
export class EmailProcessor {
  constructor() {
    this.documentProcessor = null;
    this.maxAttachmentSize = 10 * 1024 * 1024; // 10MB
    this.supportedFormats = ['.pdf', '.jpg', '.jpeg', '.png', '.txt'];
  }

  /**
   * Initialize the email processor
   */
  async initialize() {
    this.documentProcessor = await createDocumentProcessor();
  }

  /**
   * Extract attachments from an email
   * @param {object} email - Email object with attachments
   * @returns {Array<File>} - Array of attachment files
   */
  extractAttachments(email) {
    if (!email.attachments || email.attachments.length === 0) {
      return [];
    }

    const validAttachments = [];

    for (const attachment of email.attachments) {
      // Check file size
      if (attachment.size > this.maxAttachmentSize) {
        console.warn(`Attachment ${attachment.name} exceeds max size (10MB)`);
        continue;
      }

      // Check file format
      const hasValidExtension = this.supportedFormats.some((ext) =>
        attachment.name.toLowerCase().endsWith(ext)
      );

      if (!hasValidExtension) {
        console.warn(`Attachment ${attachment.name} has unsupported format`);
        continue;
      }

      validAttachments.push(attachment);
    }

    return validAttachments;
  }

  /**
   * Extract text from email body
   * @param {object} email - Email object
   * @returns {string} - Email body text
   */
  extractEmailBodyText(email) {
    // Try to get plain text version first
    if (email.textBody) {
      return email.textBody;
    }

    // Fall back to HTML body (strip tags)
    if (email.htmlBody) {
      // Basic HTML tag removal
      return email.htmlBody
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    return '';
  }

  /**
   * Process text from email body
   * @param {string} text - Email body text
   * @returns {object|null} - Processing result or null if no valid data
   */
  processEmailBody(text) {
    // Only process if text looks like it contains tax document data
    if (!text || text.length < 50) return null;

    // Check if text contains any document-like patterns
    const hasDocumentPatterns =
      /(?:Box|Case)\s+(?:14|A|16)|Employment\s+Income|Gross\s+Fares?|Total|Receipt/i.test(text);

    if (!hasDocumentPatterns) return null;

    return this.documentProcessor.processText(text);
  }

  /**
   * Process a single incoming email
   * @param {object} email - Email object
   * @returns {Promise<EmailProcessingResult>}
   */
  async processIncomingEmail(email) {
    if (!this.documentProcessor) {
      await this.initialize();
    }

    const results = [];
    const failedAttachments = [];

    // Step 1: Process attachments
    const attachments = this.extractAttachments(email);

    for (const attachment of attachments) {
      try {
        const result = await this.documentProcessor.processDocument(attachment);
        results.push(result);
      } catch (error) {
        failedAttachments.push({
          name: attachment.name,
          error: error.message,
        });
      }
    }

    // Step 2: Try to extract data from email body
    const bodyText = this.extractEmailBodyText(email);
    const bodyResult = this.processEmailBody(bodyText);

    if (bodyResult && bodyResult.success) {
      results.push(bodyResult);
    }

    // Step 3: Generate summary
    const summary = this.generateEmailSummary(results, failedAttachments);

    return {
      success: results.length > 0,
      emailSubject: email.subject || 'No subject',
      emailFrom: email.from || 'Unknown sender',
      receivedAt: email.receivedAt || new Date(),
      processedDocuments: results,
      failedAttachments,
      summary,
    };
  }

  /**
   * Generate a summary report of email processing
   * @param {Array} results - Processing results
   * @param {Array} failedAttachments - Failed attachments
   * @returns {string} - Summary text
   */
  generateEmailSummary(results, failedAttachments) {
    let summary = '📧 Email Processing Summary\n\n';

    if (results.length === 0) {
      summary += '❌ No valid documents were processed.\n';
      if (failedAttachments.length > 0) {
        summary += `\nFailed attachments (${failedAttachments.length}):\n`;
        failedAttachments.forEach((att) => {
          summary += `  - ${att.name}: ${att.error}\n`;
        });
      }
      return summary;
    }

    summary += `✅ Successfully processed ${results.length} document(s):\n\n`;

    results.forEach((result, index) => {
      summary += `${index + 1}. ${result.documentType}\n`;

      if (result.fileName) {
        summary += `   File: ${result.fileName}\n`;
      }

      if (result.validation.confidenceScore) {
        summary += `   Confidence: ${result.validation.confidenceScore}%\n`;
      }

      if (result.extractedData) {
        const dataPoints = Object.keys(result.extractedData).length;
        summary += `   Extracted ${dataPoints} field(s)\n`;
      }

      if (result.validation.warnings.length > 0) {
        summary += `   ⚠️  ${result.validation.warnings.length} warning(s)\n`;
      }

      summary += '\n';
    });

    if (failedAttachments.length > 0) {
      summary += `\n⚠️  Failed to process ${failedAttachments.length} attachment(s):\n`;
      failedAttachments.forEach((att) => {
        summary += `  - ${att.name}\n`;
      });
    }

    return summary;
  }

  /**
   * Generate an email response with processing results
   * @param {EmailProcessingResult} result - Email processing result
   * @returns {object} - Email response object
   */
  generateEmailResponse(result) {
    const subject = `Re: ${result.emailSubject} - Processing Complete`;

    let body = `Thank you for submitting your tax documents!\n\n`;
    body += result.summary;
    body += '\n---\n';
    body += 'TaxSyncForDrivers Automated Document Processing\n';
    body += 'This is an automated response. Please do not reply to this email.\n';

    return {
      to: result.emailFrom,
      subject,
      body,
      isSuccess: result.success,
    };
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    if (this.documentProcessor) {
      await this.documentProcessor.cleanup();
    }
  }
}

/**
 * Create and initialize an email processor
 * @returns {Promise<EmailProcessor>}
 */
export async function createEmailProcessor() {
  const processor = new EmailProcessor();
  await processor.initialize();
  return processor;
}

/**
 * Webhook handler for incoming emails (e.g., from n8n)
 * @param {object} webhookPayload - Webhook payload from email service
 * @returns {Promise<object>} - Processing result
 */
export async function handleEmailWebhook(webhookPayload) {
  const processor = new EmailProcessor();
  await processor.initialize();

  try {
    // Parse webhook payload into email format
    const email = {
      from: webhookPayload.from || webhookPayload.sender,
      subject: webhookPayload.subject,
      textBody: webhookPayload.text || webhookPayload.body,
      htmlBody: webhookPayload.html,
      attachments: webhookPayload.attachments || [],
      receivedAt: new Date(webhookPayload.receivedAt || Date.now()),
    };

    const result = await processor.processIncomingEmail(email);

    // Generate response email
    const response = processor.generateEmailResponse(result);

    return {
      success: true,
      processingResult: result,
      emailResponse: response,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      emailResponse: {
        to: webhookPayload.from,
        subject: 'Document Processing Failed',
        body: `We encountered an error processing your documents: ${error.message}\n\nPlease try again or contact support.`,
        isSuccess: false,
      },
    };
  } finally {
    await processor.cleanup();
  }
}
