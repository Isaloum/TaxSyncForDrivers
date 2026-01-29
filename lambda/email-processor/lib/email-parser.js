// email-parser.js - Helper functions for parsing S3 email objects
// Extracts sender, subject, attachments from raw email data

import { simpleParser } from 'mailparser';

/**
 * Parse email from S3 raw email data
 * @param {Buffer|string} rawEmail - Raw email data from S3
 * @returns {Promise<Object>} - Parsed email object
 */
export async function parseEmail(rawEmail) {
  try {
    const parsed = await simpleParser(rawEmail);
    
    return {
      from: parsed.from?.text || parsed.from?.value?.[0]?.address || 'unknown@unknown.com',
      fromAddress: parsed.from?.value?.[0]?.address || 'unknown@unknown.com',
      to: parsed.to?.text || '',
      subject: parsed.subject || 'No Subject',
      text: parsed.text || '',
      html: parsed.html || '',
      attachments: (parsed.attachments || []).map(att => ({
        filename: att.filename || 'unnamed',
        contentType: att.contentType || 'application/octet-stream',
        size: att.size || 0,
        content: att.content, // Buffer
      })),
      messageId: parsed.messageId || '',
      date: parsed.date || new Date(),
    };
  } catch (error) {
    console.error('Email parsing error:', error);
    throw new Error(`Failed to parse email: ${error.message}`);
  }
}

/**
 * Extract attachment information
 * @param {Array} attachments - Attachments from parsed email
 * @returns {Array} - Filtered and formatted attachments
 */
export function extractAttachments(attachments) {
  const supportedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'text/plain',
  ];
  
  return attachments.filter(att => {
    const contentType = att.contentType.split(';')[0].toLowerCase();
    return supportedTypes.includes(contentType) || 
           att.filename.match(/\.(pdf|jpg|jpeg|png|gif|txt)$/i);
  });
}

/**
 * Determine if attachment is processable
 * @param {Object} attachment - Attachment object
 * @returns {boolean} - True if processable
 */
export function isProcessableAttachment(attachment) {
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (attachment.size > maxSize) {
    return false;
  }
  
  const supportedExtensions = /\.(pdf|jpg|jpeg|png|gif|txt)$/i;
  return supportedExtensions.test(attachment.filename);
}

/**
 * Extract text from attachment based on type
 * @param {Object} attachment - Attachment object with content buffer
 * @returns {Promise<string>} - Extracted text content
 */
export async function extractTextFromAttachment(attachment) {
  const contentType = attachment.contentType.split(';')[0].toLowerCase();
  
  // For text files, just convert buffer to string
  if (contentType === 'text/plain' || attachment.filename.endsWith('.txt')) {
    return attachment.content.toString('utf-8');
  }
  
  // For PDFs and images, we'll return indicator that OCR/PDF parsing needed
  // In Lambda, we'll handle this differently
  if (contentType === 'application/pdf') {
    return attachment.content.toString('base64'); // Return base64 for PDF
  }
  
  if (contentType.startsWith('image/')) {
    return attachment.content.toString('base64'); // Return base64 for images
  }
  
  throw new Error(`Unsupported attachment type: ${contentType}`);
}
