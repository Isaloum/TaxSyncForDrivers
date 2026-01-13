// email-sender.js — Email sending functionality using Mailgun
// Sends automated responses with processing results

import { DOCUMENT_TYPES } from './pattern-library.js';

/**
 * Calculate vehicle deduction based on distance
 * @param {number} distanceKm - Distance in kilometers
 * @returns {number} - Deduction amount
 */
function calculateVehicleDeduction(distanceKm) {
  const RATE_FIRST_5000 = 0.7; // $0.70/km
  const RATE_AFTER_5000 = 0.64; // $0.64/km

  if (distanceKm <= 5000) {
    return distanceKm * RATE_FIRST_5000;
  } else {
    return 5000 * RATE_FIRST_5000 + (distanceKm - 5000) * RATE_AFTER_5000;
  }
}

/**
 * Format document type for display
 * @param {string} documentType - Document type constant
 * @returns {string} - Formatted name
 */
function formatDocumentType(documentType) {
  const typeNames = {
    [DOCUMENT_TYPES.T4]: 'T4 Employment Income Slip',
    [DOCUMENT_TYPES.T4A]: 'T4A Other Income Slip',
    [DOCUMENT_TYPES.RL1]: 'RL-1 Quebec Employment Income',
    [DOCUMENT_TYPES.RL2]: 'RL-2 Quebec Benefits',
    [DOCUMENT_TYPES.UBER_SUMMARY]: 'Uber Driver Summary',
    [DOCUMENT_TYPES.LYFT_SUMMARY]: 'Lyft Driver Summary',
    [DOCUMENT_TYPES.TAXI_STATEMENT]: 'Taxi Statement',
    [DOCUMENT_TYPES.GAS_RECEIPT]: 'Gas Station Receipt',
    [DOCUMENT_TYPES.MAINTENANCE_RECEIPT]: 'Vehicle Maintenance Receipt',
    [DOCUMENT_TYPES.INSURANCE_DOC]: 'Insurance Document',
    [DOCUMENT_TYPES.PARKING_RECEIPT]: 'Parking Receipt',
    [DOCUMENT_TYPES.PHONE_BILL]: 'Phone Bill',
    [DOCUMENT_TYPES.MEAL_RECEIPT]: 'Meal Receipt',
  };

  return typeNames[documentType] || documentType;
}

/**
 * Strip HTML tags from text
 * @param {string} html - HTML content
 * @returns {string} - Plain text
 */
function stripHtml(html) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate HTML email response with processing results
 * @param {Array} results - Processing results
 * @param {Array} _taxUpdates - Tax calculation updates (reserved for future use)
 * @returns {string} - HTML content
 */
function generateEmailHTML(results, _taxUpdates = []) {
  let totalIncome = 0;
  let totalDeductions = 0;

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background-color: #2c5aa0; color: white; padding: 20px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">🚗 TaxSyncForDrivers</h1>
      <p style="margin: 5px 0 0 0; font-size: 14px;">Documents Processed Successfully</p>
    </div>
    
    <div style="padding: 20px;">
      <p style="color: #333; font-size: 16px;">Your tax documents have been successfully processed! Here's what we found:</p>
`;

  for (const result of results) {
    const { documentType, extractedData, fileName } = result;

    html += `
      <div style="border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 5px; background-color: #f9f9f9;">
        <h3 style="color: #4a90e2; margin-top: 0; font-size: 18px;">📄 ${fileName || 'Document'}</h3>
        <p style="margin: 5px 0;"><strong>Type:</strong> ${formatDocumentType(documentType)}</p>
`;

    // Format extracted data based on document type
    if (
      documentType === DOCUMENT_TYPES.UBER_SUMMARY ||
      documentType === DOCUMENT_TYPES.LYFT_SUMMARY
    ) {
      if (extractedData.grossFares) {
        html += `<p style="margin: 5px 0;"><strong>Income Added:</strong> $${extractedData.grossFares.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>`;
        totalIncome += extractedData.grossFares;
      }
      if (extractedData.tips) {
        html += `<p style="margin: 5px 0;"><strong>Tips:</strong> $${extractedData.tips.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>`;
        totalIncome += extractedData.tips;
      }
      if (extractedData.distance) {
        const vehicleDeduction = calculateVehicleDeduction(extractedData.distance);
        html += `<p style="margin: 5px 0;"><strong>Distance:</strong> ${extractedData.distance.toLocaleString('en-US')} km</p>`;
        html += `<p style="margin: 5px 0; color: #28a745;"><strong>Vehicle Deduction:</strong> $${vehicleDeduction.toFixed(2)}</p>`;
        totalDeductions += vehicleDeduction;
      }
      if (extractedData.trips || extractedData.rides) {
        html += `<p style="margin: 5px 0;"><strong>Trips:</strong> ${extractedData.trips || extractedData.rides}</p>`;
      }
    } else if (documentType === DOCUMENT_TYPES.GAS_RECEIPT) {
      if (extractedData.total) {
        const businessAmount = extractedData.total * 0.85; // 85% business use
        html += `<p style="margin: 5px 0;"><strong>Fuel Expense:</strong> $${extractedData.total.toFixed(2)}</p>`;
        html += `<p style="margin: 5px 0; color: #28a745;"><strong>Business Portion (85%):</strong> $${businessAmount.toFixed(2)}</p>`;
        totalDeductions += businessAmount;
      }
      if (extractedData.liters) {
        html += `<p style="margin: 5px 0;"><strong>Fuel Amount:</strong> ${extractedData.liters.toFixed(1)} L</p>`;
      }
      if (extractedData.date) {
        html += `<p style="margin: 5px 0;"><strong>Date:</strong> ${extractedData.date}</p>`;
      }
    } else if (documentType === DOCUMENT_TYPES.MAINTENANCE_RECEIPT) {
      if (extractedData.total) {
        const businessAmount = extractedData.total * 0.85; // 85% business use
        html += `<p style="margin: 5px 0;"><strong>Maintenance Cost:</strong> $${extractedData.total.toFixed(2)}</p>`;
        html += `<p style="margin: 5px 0; color: #28a745;"><strong>Business Portion (85%):</strong> $${businessAmount.toFixed(2)}</p>`;
        totalDeductions += businessAmount;
      }
    } else if (documentType === DOCUMENT_TYPES.T4 || documentType === DOCUMENT_TYPES.RL1) {
      if (extractedData.employmentIncome) {
        html += `<p style="margin: 5px 0;"><strong>Employment Income:</strong> $${extractedData.employmentIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>`;
      }
      if (extractedData.incomeTax) {
        html += `<p style="margin: 5px 0;"><strong>Income Tax Deducted:</strong> $${extractedData.incomeTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>`;
      }
    }

    html += `</div>`;
  }

  // Summary section
  html += `
      <div style="background-color: #e8f5e9; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #28a745; margin-top: 0; font-size: 20px;">💰 Tax Impact Summary</h3>
        <p style="margin: 10px 0; font-size: 16px;"><strong>Total Income Added:</strong> $${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        <p style="margin: 10px 0; font-size: 16px;"><strong>Total Deductions Added:</strong> $${totalDeductions.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        <p style="margin: 10px 0; font-size: 16px; color: #28a745;"><strong>Estimated Tax Savings:</strong> $${(totalDeductions * 0.275).toFixed(2)}</p>
        <p style="margin: 10px 0; font-size: 12px; color: #666;">* Based on average marginal tax rate of 27.5%</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://isaloum.github.io/TaxSyncForDrivers/" 
           style="background-color: #4a90e2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px; font-weight: bold;">
          📊 View Updated Tax Calculator
        </a>
      </div>
      
      <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px;">
        <h4 style="color: #333; font-size: 16px; margin-bottom: 10px;">💡 Pro Tips:</h4>
        <ul style="color: #666; font-size: 14px; line-height: 1.6;">
          <li>Keep forwarding receipts weekly to track expenses automatically</li>
          <li>Take photos of paper receipts and email them to docs@taxsyncfordrivers.com</li>
          <li>Forward Uber/Lyft weekly summaries directly from your inbox</li>
          <li>All documents are processed securely and not stored permanently</li>
        </ul>
      </div>
      
      <div style="background-color: #f9f9f9; padding: 15px; text-align: center; margin-top: 20px; border-radius: 5px;">
        <p style="color: #666; font-size: 12px; margin: 5px 0;">
          Questions? Reply to this email or visit our website.<br>
          🔒 Your documents are processed securely and not stored.<br>
          📧 This is an automated message from TaxSync AI
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

  return html;
}

/**
 * Send processing results email using Mailgun
 * @param {string} userEmail - Recipient email
 * @param {Array} results - Processing results
 * @param {string} originalSubject - Original email subject
 * @param {Array} taxUpdates - Tax updates
 */
export async function sendProcessingResults(userEmail, results, originalSubject, taxUpdates = []) {
  if (!results || results.length === 0) {
    return sendErrorNotification(userEmail, 'No documents could be processed', originalSubject);
  }

  const htmlContent = generateEmailHTML(results, taxUpdates);
  const textContent = stripHtml(htmlContent);

  // In production, this would use actual Mailgun API
  // For now, we'll log the email that would be sent
  const emailData = {
    from: 'TaxSync AI <noreply@taxsyncfordrivers.com>',
    to: userEmail,
    subject: `✅ Documents Processed - ${results.length} item(s)`,
    html: htmlContent,
    text: textContent,
  };

  console.log('📤 Would send email:', {
    to: emailData.to,
    subject: emailData.subject,
    documentCount: results.length,
  });

  // Production code would be:
  // const mailgun = require('mailgun-js')({
  //   apiKey: process.env.MAILGUN_API_KEY,
  //   domain: process.env.MAILGUN_DOMAIN
  // });
  // await mailgun.messages().send(emailData);

  return emailData;
}

/**
 * Send error notification email
 * @param {string} userEmail - Recipient email
 * @param {string} errorMessage - Error message
 * @param {string} originalSubject - Original email subject
 */
export async function sendErrorNotification(userEmail, errorMessage, originalSubject) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background-color: #d32f2f; color: white; padding: 20px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">🚗 TaxSyncForDrivers</h1>
      <p style="margin: 5px 0 0 0; font-size: 14px;">Document Processing Error</p>
    </div>
    
    <div style="padding: 20px;">
      <p style="color: #333; font-size: 16px;">We encountered an issue processing your documents:</p>
      
      <div style="background-color: #ffebee; border-left: 4px solid #d32f2f; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #c62828; font-size: 14px;">${errorMessage}</p>
      </div>
      
      <h3 style="color: #333; font-size: 18px; margin-top: 30px;">What you can try:</h3>
      <ul style="color: #666; font-size: 14px; line-height: 1.8;">
        <li>Make sure documents are in supported formats (PDF, JPG, PNG, TXT)</li>
        <li>Ensure text in images is clear and readable</li>
        <li>Try forwarding documents one at a time</li>
        <li>For scanned receipts, ensure good lighting and focus</li>
      </ul>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://isaloum.github.io/TaxSyncForDrivers/" 
           style="background-color: #4a90e2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px; font-weight: bold;">
          📊 Visit Tax Calculator
        </a>
      </div>
      
      <div style="background-color: #f9f9f9; padding: 15px; text-align: center; margin-top: 20px; border-radius: 5px;">
        <p style="color: #666; font-size: 12px; margin: 5px 0;">
          Need help? Reply to this email with your question.<br>
          📧 This is an automated message from TaxSync AI
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

  const emailData = {
    from: 'TaxSync AI <noreply@taxsyncfordrivers.com>',
    to: userEmail,
    subject: `❌ Document Processing Failed - ${originalSubject}`,
    html: html,
    text: stripHtml(html),
  };

  console.log('📤 Would send error email:', {
    to: emailData.to,
    subject: emailData.subject,
    error: errorMessage,
  });

  return emailData;
}

/**
 * Send welcome instructions email to new users
 * @param {string} userEmail - Recipient email
 */
export async function sendWelcomeInstructions(userEmail) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background-color: #2c5aa0; color: white; padding: 20px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px;">🚗 Welcome to TaxSync!</h1>
      <p style="margin: 5px 0 0 0; font-size: 16px;">Email Automation for Tax Documents</p>
    </div>
    
    <div style="padding: 20px;">
      <h2 style="color: #2c5aa0; font-size: 22px;">📧 How to Use:</h2>
      
      <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0; font-size: 18px; font-weight: bold; color: #1976d2;">
          📮 Save this email: <span style="color: #d32f2f;">docs@taxsyncfordrivers.com</span>
        </p>
      </div>
      
      <h3 style="color: #333; font-size: 18px; margin-top: 30px;">Forward any tax documents:</h3>
      <ul style="color: #666; font-size: 16px; line-height: 1.8;">
        <li>📊 <strong>Uber/Lyft weekly summaries</strong></li>
        <li>⛽ <strong>Gas station receipts</strong></li>
        <li>🔧 <strong>Vehicle maintenance receipts</strong></li>
        <li>📄 <strong>T4/RL-1 tax slips</strong></li>
        <li>📱 <strong>Phone bills</strong> (for business use)</li>
        <li>🅿️ <strong>Parking receipts</strong></li>
      </ul>
      
      <h3 style="color: #28a745; font-size: 18px; margin-top: 30px;">✨ Get instant results:</h3>
      <p style="color: #666; font-size: 16px; line-height: 1.6;">
        Tax calculations updated automatically! We'll extract the data, calculate deductions, and send you a detailed summary.
      </p>
      
      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
        <h4 style="margin: 0 0 10px 0; color: #856404; font-size: 16px;">💡 Pro Tips:</h4>
        <ul style="margin: 0; padding-left: 20px; color: #856404; font-size: 14px; line-height: 1.6;">
          <li>📱 Take photos of receipts and email them</li>
          <li>📧 Forward emails with PDF attachments</li>
          <li>📋 Copy & paste text from statements</li>
          <li>🔄 Send multiple documents at once</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://isaloum.github.io/TaxSyncForDrivers/" 
           style="background-color: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px; font-weight: bold;">
          📊 Visit Tax Calculator
        </a>
      </div>
      
      <div style="background-color: #f9f9f9; padding: 15px; text-align: center; margin-top: 20px; border-radius: 5px;">
        <p style="color: #666; font-size: 12px; margin: 5px 0;">
          🔒 Your documents are processed securely and not stored permanently.<br>
          📧 Questions? Reply to this email anytime.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

  const emailData = {
    from: 'TaxSync AI <noreply@taxsyncfordrivers.com>',
    to: userEmail,
    subject: '🚗 Welcome to TaxSync Email Automation!',
    html: html,
    text: stripHtml(html),
  };

  console.log('📤 Would send welcome email:', {
    to: emailData.to,
    subject: emailData.subject,
  });

  return emailData;
}
