// response-templates.js - Email response templates for processing results
// Beautiful, professional design matching existing email-sender.js style

/**
 * Format document type for display
 * @param {string} documentType - Document type constant
 * @returns {string} - Formatted name
 */
function formatDocumentType(documentType) {
  const typeNames = {
    'T4': 'T4 Employment Income Slip',
    'T4A': 'T4A Other Income Slip',
    'T5': 'T5 Investment Income Slip',
    'T3': 'T3 Trust Income Slip',
    'T5008': 'T5008 Securities Transaction Slip',
    'T2202': 'T2202 Tuition Certificate',
    'RL-1': 'RL-1 Quebec Employment Income',
    'RL-2': 'RL-2 Quebec Benefits',
    'UBER_SUMMARY': 'Uber Driver Summary',
    'LYFT_SUMMARY': 'Lyft Driver Summary',
    'TAXI_STATEMENT': 'Taxi Statement',
    'GAS_RECEIPT': 'Gas Station Receipt',
    'MAINTENANCE_RECEIPT': 'Vehicle Maintenance Receipt',
    'INSURANCE_DOC': 'Insurance Document',
    'INSURANCE_RECEIPT': 'Insurance Receipt',
    'VEHICLE_REGISTRATION': 'Vehicle Registration',
    'PARKING_RECEIPT': 'Parking Receipt',
    'PHONE_BILL': 'Phone Bill',
    'MEAL_RECEIPT': 'Meal Receipt',
    'BUSINESS_RECEIPT': 'Business Receipt',
    'MEDICAL_RECEIPT': 'Medical Receipt',
    'PHARMACY_RECEIPT': 'Pharmacy Receipt',
    'DENTAL_RECEIPT': 'Dental Receipt',
    'OPTICAL_RECEIPT': 'Optical Receipt',
    'CHARITABLE_RECEIPT': 'Charitable Receipt',
    'UNKNOWN': 'Unknown Document',
  };

  return typeNames[documentType] || documentType;
}

/**
 * Format currency value
 * @param {number} value - Numeric value
 * @returns {string} - Formatted currency
 */
function formatCurrency(value) {
  if (typeof value !== 'number' || isNaN(value)) {
    return '$0.00';
  }
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Generate HTML for a single document result
 * @param {Object} result - Processing result
 * @param {number} index - Result index
 * @returns {string} - HTML content
 */
function generateDocumentResultHTML(result, index) {
  const { documentType, extractedData, fileName, validation } = result;
  
  let html = `
    <div style="border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 5px; background-color: #f9f9f9;">
      <h3 style="color: #4a90e2; margin-top: 0; font-size: 18px;">📄 ${fileName || `Document ${index + 1}`}</h3>
      <p style="margin: 5px 0;"><strong>Type:</strong> ${formatDocumentType(documentType)}</p>
  `;
  
  // Add confidence score if available
  if (validation?.confidenceScore !== undefined) {
    const confidencePercent = Math.round(validation.confidenceScore * 100);
    const confidenceColor = confidencePercent >= 80 ? '#28a745' : confidencePercent >= 60 ? '#ffc107' : '#dc3545';
    html += `<p style="margin: 5px 0;"><strong>Confidence:</strong> <span style="color: ${confidenceColor};">${confidencePercent}%</span></p>`;
  }
  
  // Format extracted data based on document type
  if (extractedData) {
    html += '<div style="margin-top: 10px; padding: 10px; background-color: #fff; border-radius: 3px;">';
    
    // Display key fields based on document type
    if (documentType === 'T4' || documentType === 'T4A') {
      if (extractedData.employmentIncome) {
        html += `<p style="margin: 5px 0;"><strong>Employment Income:</strong> ${formatCurrency(extractedData.employmentIncome)}</p>`;
      }
      if (extractedData.incomeTax) {
        html += `<p style="margin: 5px 0;"><strong>Income Tax Deducted:</strong> ${formatCurrency(extractedData.incomeTax)}</p>`;
      }
      if (extractedData.cpp) {
        html += `<p style="margin: 5px 0;"><strong>CPP Contributions:</strong> ${formatCurrency(extractedData.cpp)}</p>`;
      }
      if (extractedData.ei) {
        html += `<p style="margin: 5px 0;"><strong>EI Premiums:</strong> ${formatCurrency(extractedData.ei)}</p>`;
      }
      if (extractedData.employerName) {
        html += `<p style="margin: 5px 0;"><strong>Employer:</strong> ${extractedData.employerName}</p>`;
      }
    } else if (documentType === 'T5') {
      if (extractedData.interestIncome) {
        html += `<p style="margin: 5px 0;"><strong>Interest Income:</strong> ${formatCurrency(extractedData.interestIncome)}</p>`;
      }
      if (extractedData.eligibleDividends) {
        html += `<p style="margin: 5px 0;"><strong>Eligible Dividends:</strong> ${formatCurrency(extractedData.eligibleDividends)}</p>`;
      }
      if (extractedData.payerName) {
        html += `<p style="margin: 5px 0;"><strong>Payer:</strong> ${extractedData.payerName}</p>`;
      }
    } else if (documentType === 'UBER_SUMMARY' || documentType === 'LYFT_SUMMARY') {
      if (extractedData.grossFares) {
        html += `<p style="margin: 5px 0;"><strong>Gross Fares:</strong> ${formatCurrency(extractedData.grossFares)}</p>`;
      }
      if (extractedData.tips) {
        html += `<p style="margin: 5px 0;"><strong>Tips:</strong> ${formatCurrency(extractedData.tips)}</p>`;
      }
      if (extractedData.distance) {
        html += `<p style="margin: 5px 0;"><strong>Distance:</strong> ${extractedData.distance} km</p>`;
      }
    } else if (documentType.includes('RECEIPT')) {
      if (extractedData.amount) {
        html += `<p style="margin: 5px 0;"><strong>Amount:</strong> ${formatCurrency(extractedData.amount)}</p>`;
      }
      if (extractedData.date) {
        html += `<p style="margin: 5px 0;"><strong>Date:</strong> ${extractedData.date}</p>`;
      }
      if (extractedData.vendor) {
        html += `<p style="margin: 5px 0;"><strong>Vendor:</strong> ${extractedData.vendor}</p>`;
      }
    }
    
    html += '</div>';
  }
  
  // Add warnings if any
  if (validation?.warnings && validation.warnings.length > 0) {
    html += `
      <div style="margin-top: 10px; padding: 10px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 3px;">
        <p style="margin: 0; font-weight: bold; color: #856404;">⚠️ Warnings:</p>
        <ul style="margin: 5px 0; padding-left: 20px; color: #856404;">
    `;
    validation.warnings.forEach(warning => {
      html += `<li>${warning}</li>`;
    });
    html += `
        </ul>
      </div>
    `;
  }
  
  html += '</div>';
  return html;
}

/**
 * Generate success email HTML
 * @param {Array} results - Array of processing results
 * @param {string} recipientEmail - Recipient email address
 * @returns {string} - Complete HTML email
 */
export function generateSuccessEmail(results, recipientEmail) {
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
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
      <p style="color: #333; font-size: 16px;">Hello,</p>
      <p style="color: #333; font-size: 16px;">Your tax documents have been processed! Here are the results:</p>
      
      <div style="background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p style="margin: 0; font-size: 16px;"><strong>Processing Summary:</strong></p>
        <p style="margin: 5px 0; font-size: 14px;">✅ Successfully processed: ${successCount} of ${totalCount} document(s)</p>
      </div>
  `;
  
  // Add each document result
  results.forEach((result, index) => {
    html += generateDocumentResultHTML(result, index);
  });
  
  // Add footer
  html += `
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 14px;">📋 <strong>Next Steps:</strong></p>
        <ul style="color: #666; font-size: 14px;">
          <li>Review the extracted data above for accuracy</li>
          <li>Visit <a href="https://isaloum.github.io/TaxSyncForDrivers/" style="color: #4a90e2;">TaxSyncForDrivers</a> to complete your tax calculation</li>
          <li>Keep this email for your records</li>
        </ul>
      </div>
      
      <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; text-align: center;">
        <p style="margin: 0; color: #666; font-size: 12px;">
          This is an automated message from TaxSyncForDrivers<br>
          For support, reply to this email
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
 * Generate error email HTML
 * @param {Error} error - Error object
 * @param {string} recipientEmail - Recipient email address
 * @param {string} fileName - Original file name if available
 * @returns {string} - Complete HTML email
 */
export function generateErrorEmail(error, recipientEmail, fileName = null) {
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">🚗 TaxSyncForDrivers</h1>
      <p style="margin: 5px 0 0 0; font-size: 14px;">Processing Error</p>
    </div>
    
    <div style="padding: 20px;">
      <p style="color: #333; font-size: 16px;">Hello,</p>
      <p style="color: #333; font-size: 16px;">We encountered an error while processing your document${fileName ? ` "${fileName}"` : ''}.</p>
      
      <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #dc3545;">
        <p style="margin: 0; font-weight: bold; color: #721c24;">❌ Error Details:</p>
        <p style="margin: 5px 0; color: #721c24;">${error.message || 'Unknown error occurred'}</p>
      </div>
      
      <div style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border-radius: 5px;">
        <p style="margin: 0; font-weight: bold; color: #856404;">💡 Troubleshooting Tips:</p>
        <ul style="margin: 5px 0; padding-left: 20px; color: #856404;">
          <li>Ensure your attachment is a supported format (PDF, JPG, PNG, TXT)</li>
          <li>Check that the file is not corrupted or password-protected</li>
          <li>Verify the document is a Canadian tax form (T4, T4A, T5, etc.) or receipt</li>
          <li>File size should be under 10MB</li>
        </ul>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 14px;">Need help? Reply to this email with:</p>
        <ul style="color: #666; font-size: 14px;">
          <li>Description of the document you're trying to process</li>
          <li>Any specific error messages you're seeing</li>
        </ul>
      </div>
      
      <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; text-align: center;">
        <p style="margin: 0; color: #666; font-size: 12px;">
          This is an automated message from TaxSyncForDrivers<br>
          For support, reply to this email
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
 * Generate plain text version of success email
 * @param {Array} results - Array of processing results
 * @returns {string} - Plain text email
 */
export function generateSuccessTextEmail(results) {
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  let text = `TaxSyncForDrivers - Documents Processed Successfully\n\n`;
  text += `Your tax documents have been processed!\n\n`;
  text += `Processing Summary:\n`;
  text += `✅ Successfully processed: ${successCount} of ${totalCount} document(s)\n\n`;
  
  results.forEach((result, index) => {
    text += `\n--- Document ${index + 1}: ${result.fileName || 'Unnamed'} ---\n`;
    text += `Type: ${formatDocumentType(result.documentType)}\n`;
    
    if (result.validation?.confidenceScore !== undefined) {
      text += `Confidence: ${Math.round(result.validation.confidenceScore * 100)}%\n`;
    }
    
    if (result.extractedData) {
      text += `\nExtracted Data:\n`;
      Object.entries(result.extractedData).forEach(([key, value]) => {
        if (value && typeof value !== 'object') {
          const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
          text += `  ${formattedKey}: ${value}\n`;
        }
      });
    }
    
    if (result.validation?.warnings && result.validation.warnings.length > 0) {
      text += `\n⚠️  Warnings:\n`;
      result.validation.warnings.forEach(w => text += `  - ${w}\n`);
    }
  });
  
  text += `\n\nNext Steps:\n`;
  text += `- Review the extracted data above for accuracy\n`;
  text += `- Visit https://isaloum.github.io/TaxSyncForDrivers/ to complete your tax calculation\n`;
  text += `- Keep this email for your records\n`;
  
  return text;
}

/**
 * Generate plain text version of error email
 * @param {Error} error - Error object
 * @param {string} fileName - Original file name if available
 * @returns {string} - Plain text email
 */
export function generateErrorTextEmail(error, fileName = null) {
  let text = `TaxSyncForDrivers - Processing Error\n\n`;
  text += `We encountered an error while processing your document${fileName ? ` "${fileName}"` : ''}.\n\n`;
  text += `❌ Error Details:\n${error.message || 'Unknown error occurred'}\n\n`;
  text += `💡 Troubleshooting Tips:\n`;
  text += `- Ensure your attachment is a supported format (PDF, JPG, PNG, TXT)\n`;
  text += `- Check that the file is not corrupted or password-protected\n`;
  text += `- Verify the document is a Canadian tax form (T4, T4A, T5, etc.) or receipt\n`;
  text += `- File size should be under 10MB\n\n`;
  text += `Need help? Reply to this email with a description of the issue.\n`;
  
  return text;
}
