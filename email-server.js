// email-server.js — Express server for email webhook processing
// Handles incoming emails from Mailgun and processes tax documents

import express from 'express';
import crypto from 'crypto';
import { handleEmailWebhook } from './email-handler.js';
import { sendProcessingResults, sendErrorNotification } from './email-sender.js';
import { updateUserTaxData } from './tax-integration.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing form data (Mailgun sends multipart/form-data)
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));

/**
 * Verify Mailgun webhook signature
 * @param {string} timestamp - Timestamp from webhook
 * @param {string} token - Token from webhook
 * @param {string} signature - Signature from webhook
 * @returns {boolean} - Whether signature is valid
 */
function verifyMailgunSignature(timestamp, token, signature) {
  if (!process.env.MAILGUN_WEBHOOK_KEY) {
    console.warn('MAILGUN_WEBHOOK_KEY not set - skipping signature verification');
    return true; // In development, allow without verification
  }

  const encodedToken = crypto
    .createHmac('sha256', process.env.MAILGUN_WEBHOOK_KEY)
    .update(timestamp + token)
    .digest('hex');

  return encodedToken === signature;
}

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'TaxSync Email Integration',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Mailgun webhook endpoint for incoming emails
 * Receives emails sent to docs@taxsyncfordrivers.com
 */
app.post('/webhook/mailgun', async (req, res) => {
  try {
    // Extract signature data
    const timestamp = req.body.timestamp;
    const token = req.body.token;
    const signature = req.body.signature;

    // Verify webhook signature for security
    if (!verifyMailgunSignature(timestamp, token, signature)) {
      console.error('Invalid Mailgun signature');
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Extract email data from Mailgun webhook
    const emailData = {
      from: req.body.sender || req.body.From,
      subject: req.body.subject || req.body.Subject || 'No subject',
      textBody: req.body['body-plain'] || req.body['stripped-text'] || '',
      htmlBody: req.body['body-html'] || '',
      attachments: [],
      receivedAt: new Date(),
    };

    // Parse attachments from Mailgun
    // Mailgun sends attachment-count and attachment-1, attachment-2, etc.
    const attachmentCount = parseInt(req.body['attachment-count'] || '0');

    for (let i = 1; i <= attachmentCount; i++) {
      const attachmentData = req.body[`attachment-${i}`];
      if (attachmentData) {
        // In production, Mailgun provides file buffers
        // For now, we'll handle the basic structure
        emailData.attachments.push({
          name: attachmentData.filename || `attachment-${i}`,
          type: attachmentData.contentType || 'application/octet-stream',
          size: attachmentData.size || 0,
          data: attachmentData.data || attachmentData,
        });
      }
    }

    console.log(
      `📧 Received email from ${emailData.from} with ${emailData.attachments.length} attachment(s)`
    );

    // Process the email through our handler
    const processingResult = await handleEmailWebhook(emailData);

    if (processingResult.success) {
      // Update user's tax data
      const taxUpdates = [];
      for (const doc of processingResult.processingResult.processedDocuments) {
        try {
          const taxUpdate = await updateUserTaxData(emailData.from, doc);
          taxUpdates.push(taxUpdate);
        } catch (error) {
          console.error('Tax update error:', error);
        }
      }

      // Send success email with results
      await sendProcessingResults(
        emailData.from,
        processingResult.processingResult.processedDocuments,
        emailData.subject,
        taxUpdates
      );
    } else {
      // Send error notification
      await sendErrorNotification(
        emailData.from,
        processingResult.error || 'Unknown error',
        emailData.subject
      );
    }

    // Respond to Mailgun webhook
    res.status(200).json({ success: true, message: 'Email processed' });
  } catch (error) {
    console.error('Email processing error:', error);

    // Try to notify user about the error
    if (req.body.sender || req.body.From) {
      try {
        await sendErrorNotification(
          req.body.sender || req.body.From,
          error.message,
          req.body.subject || 'Your submission'
        );
      } catch (sendError) {
        console.error('Failed to send error notification:', sendError);
      }
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Generic email webhook endpoint (for other email services)
 */
app.post('/webhook/email', async (req, res) => {
  try {
    const emailData = {
      from: req.body.from || req.body.sender,
      subject: req.body.subject || 'No subject',
      textBody: req.body.text || req.body.body || '',
      htmlBody: req.body.html || '',
      attachments: req.body.attachments || [],
      receivedAt: new Date(req.body.receivedAt || Date.now()),
    };

    console.log(`📧 Received email from ${emailData.from}`);

    const processingResult = await handleEmailWebhook(emailData);

    if (processingResult.success) {
      const taxUpdates = [];
      for (const doc of processingResult.processingResult.processedDocuments) {
        try {
          const taxUpdate = await updateUserTaxData(emailData.from, doc);
          taxUpdates.push(taxUpdate);
        } catch (error) {
          console.error('Tax update error:', error);
        }
      }

      await sendProcessingResults(
        emailData.from,
        processingResult.processingResult.processedDocuments,
        emailData.subject,
        taxUpdates
      );
    } else {
      await sendErrorNotification(emailData.from, processingResult.error, emailData.subject);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Email webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Start the server
 */
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 TaxSync Email Server running on port ${PORT}`);
    console.log(`📧 Webhook endpoints:`);
    console.log(`   - POST /webhook/mailgun (for Mailgun integration)`);
    console.log(`   - POST /webhook/email (generic webhook)`);
    console.log(`   - GET /health (health check)`);
  });
}

export { app, verifyMailgunSignature };
