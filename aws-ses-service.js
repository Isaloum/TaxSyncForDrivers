// aws-ses-service.js — AWS SES email service integration
// Handles sending emails through AWS Simple Email Service (SES)

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import dotenv from 'dotenv';

dotenv.config();

/**
 * AWS SES Email Service
 * Provides email sending functionality using AWS SES
 */
class AWSSESService {
  constructor() {
    this.client = null;
    this.fromDomain = process.env.SES_FROM_DOMAIN || 'isaloumapps.com';
    this.taxSyncFromEmail = process.env.TAXSYNC_FROM_EMAIL || `notifications@${this.fromDomain}`;
    this.taxSyncAIFromEmail = process.env.TAXSYNCAI_FROM_EMAIL || `ai-alerts@${this.fromDomain}`;
  }

  /**
   * Initialize the SES client
   */
  initialize() {
    if (this.client) {
      return;
    }

    const region = process.env.AWS_REGION || 'us-east-2';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey) {
      console.warn('AWS credentials not configured - email sending will be logged only');
      return;
    }

    this.client = new SESClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    console.log(`✅ AWS SES client initialized (region: ${region})`);
  }

  /**
   * Send an email using AWS SES
   * @param {Object} emailParams - Email parameters
   * @param {string} emailParams.from - Sender email address
   * @param {string|string[]} emailParams.to - Recipient email address(es)
   * @param {string} emailParams.subject - Email subject
   * @param {string} emailParams.html - HTML content
   * @param {string} emailParams.text - Plain text content
   * @returns {Promise<Object>} - Send result
   */
  async sendEmail({ from, to, subject, html, text }) {
    this.initialize();

    // Ensure 'to' is an array
    const recipients = Array.isArray(to) ? to : [to];

    const params = {
      Source: from,
      Destination: {
        ToAddresses: recipients,
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: html,
            Charset: 'UTF-8',
          },
          Text: {
            Data: text,
            Charset: 'UTF-8',
          },
        },
      },
    };

    // If SES client is not configured, log the email instead
    if (!this.client) {
      console.log('📧 [DEVELOPMENT MODE] Would send email via AWS SES:', {
        from,
        to: recipients,
        subject,
        bodyLength: html?.length || text?.length || 0,
      });
      return {
        success: true,
        messageId: `dev-${Date.now()}`,
        mode: 'development',
      };
    }

    try {
      const command = new SendEmailCommand(params);
      const response = await this.client.send(command);

      console.log('✅ Email sent successfully via AWS SES:', {
        messageId: response.MessageId,
        to: recipients,
      });

      return {
        success: true,
        messageId: response.MessageId,
        mode: 'production',
      };
    } catch (error) {
      console.error('❌ Error sending email via AWS SES:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send email from TaxSync (notifications)
   * @param {Object} params - Email parameters
   * @returns {Promise<Object>} - Send result
   */
  async sendFromTaxSync(params) {
    return this.sendEmail({
      ...params,
      from: params.from || this.taxSyncFromEmail,
    });
  }

  /**
   * Send email from TaxSync AI (alerts)
   * @param {Object} params - Email parameters
   * @returns {Promise<Object>} - Send result
   */
  async sendFromTaxSyncAI(params) {
    return this.sendEmail({
      ...params,
      from: params.from || this.taxSyncAIFromEmail,
    });
  }

  /**
   * Verify an email address for sending (requires SES verification)
   * @param {string} emailAddress - Email address to verify
   * @returns {Promise<Object>} - Verification result
   */
  async verifyEmailAddress(emailAddress) {
    this.initialize();

    if (!this.client) {
      console.log('📧 [DEVELOPMENT MODE] Would verify email:', emailAddress);
      return { success: true, mode: 'development' };
    }

    try {
      const { VerifyEmailIdentityCommand } = await import('@aws-sdk/client-ses');
      const command = new VerifyEmailIdentityCommand({
        EmailAddress: emailAddress,
      });
      await this.client.send(command);

      console.log(`✅ Verification email sent to: ${emailAddress}`);
      return { success: true, mode: 'production' };
    } catch (error) {
      console.error('❌ Error verifying email:', error);
      throw new Error(`Failed to verify email: ${error.message}`);
    }
  }
}

// Singleton instance
let sesServiceInstance = null;

/**
 * Get or create the AWS SES service instance
 * @returns {AWSSESService}
 */
export function getSESService() {
  if (!sesServiceInstance) {
    sesServiceInstance = new AWSSESService();
  }
  return sesServiceInstance;
}

/**
 * Send an email using AWS SES
 * @param {Object} emailParams - Email parameters
 * @returns {Promise<Object>} - Send result
 */
export async function sendEmail(emailParams) {
  const service = getSESService();
  return service.sendEmail(emailParams);
}

/**
 * Send email from TaxSync
 * @param {Object} params - Email parameters
 * @returns {Promise<Object>} - Send result
 */
export async function sendFromTaxSync(params) {
  const service = getSESService();
  return service.sendFromTaxSync(params);
}

/**
 * Send email from TaxSync AI
 * @param {Object} params - Email parameters
 * @returns {Promise<Object>} - Send result
 */
export async function sendFromTaxSyncAI(params) {
  const service = getSESService();
  return service.sendFromTaxSyncAI(params);
}

export default AWSSESService;
