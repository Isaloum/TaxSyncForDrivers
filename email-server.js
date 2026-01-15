// email-server.js — Express server for email webhook processing
// Handles incoming emails via AWS SES and processes tax documents

import express from 'express';
import { handleEmailWebhook } from './email-handler.js';
import { sendProcessingResults, sendErrorNotification } from './email-sender.js';
import { updateUserTaxData } from './tax-integration.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON and form data
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));

// TODO: Add rate limiting middleware for production deployment
// Recommended: express-rate-limit package
// Example:
// const rateLimit = require('express-rate-limit');
// const limiter = rateLimit({
//   windowMs: 60 * 60 * 1000, // 1 hour
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: 'Too many requests from this IP, please try again later.'
// });
// app.use('/webhook/', limiter);


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
 * AWS SES webhook endpoint for incoming emails
 * Receives emails sent to notifications@isaloumapps.com
 */
app.post('/webhook/ses', async (req, res) => {
  try {
    // Extract email data from AWS SES webhook
    // AWS SES can send SNS notifications with email data
    const emailData = {
      from: req.body.from || req.body.sender,
      subject: req.body.subject || 'No subject',
      textBody: req.body.text || req.body.body || '',
      htmlBody: req.body.html || '',
      attachments: req.body.attachments || [],
      receivedAt: new Date(req.body.receivedAt || Date.now()),
    };

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

    // Respond to AWS SES webhook
    res.status(200).json({ success: true, message: 'Email processed' });
  } catch (error) {
    console.error('Email processing error:', error);

    // Try to notify user about the error
    if (req.body.from || req.body.sender) {
      try {
        await sendErrorNotification(
          req.body.from || req.body.sender,
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
    console.log(`   - POST /webhook/ses (for AWS SES integration)`);
    console.log(`   - POST /webhook/email (generic webhook)`);
    console.log(`   - GET /health (health check)`);
  });
}

export { app };
