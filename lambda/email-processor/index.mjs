// index.mjs - AWS Lambda function for processing tax document emails
// Receives S3 events when emails arrive, processes attachments, sends responses

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { TextractClient, StartDocumentTextDetectionCommand, GetDocumentTextDetectionCommand } from '@aws-sdk/client-textract';
import { parseEmail, extractAttachments, isProcessableAttachment } from './lib/email-parser.js';
import {
  generateSuccessEmail,
  generateErrorEmail,
  generateSuccessTextEmail,
  generateErrorTextEmail,
} from './lib/response-templates.js';

// Import document processing from parent directory
// Note: In Lambda deployment, these will be bundled or copied
import { quickProcess } from '../../document-processor.js';
import { classifyDocument, extractFields } from '../../pattern-library.js';
import { validateData } from '../../validation-engine.js';

// Initialize AWS clients
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-2' });
const sesClient = new SESClient({ region: process.env.AWS_REGION || 'us-east-2' });
const textractClient = new TextractClient({ region: process.env.AWS_REGION || 'us-east-2' });

/**
 * Process a single attachment
 * @param {Object} attachment - Attachment object with content buffer
 * @returns {Promise<Object>} - Processing result
 */
async function processAttachment(attachment) {
  console.log(`Processing attachment: ${attachment.filename}`);
  
  try {
    // For text files, extract text directly
    if (attachment.contentType.includes('text/plain') || attachment.filename.endsWith('.txt')) {
      const text = attachment.content.toString('utf-8');
      const result = quickProcess(text);
      
      return {
        success: result.success,
        documentType: result.documentType,
        extractedData: result.extractedData,
        validation: result.validation,
        fileName: attachment.filename,
        error: result.error,
      };
    }
    
    // For PDF and image files, use AWS Textract for OCR
    if (attachment.contentType.includes('pdf') || attachment.contentType.includes('image/')) {
      try {
        // Upload the file to a temporary S3 bucket for Textract (Textract requires S3 input)
        // We'll use the same bucket as the email, but under a temp/ path
        const tempKey = `temp/${Date.now()}-${attachment.filename}`;
        await s3Client.send(new GetObjectCommand({ // check if bucket exists
          Bucket: process.env.TEMP_BUCKET || process.env.S3_BUCKET || process.env.AWS_S3_BUCKET,
          Key: tempKey
        }).catch(async () => {
          // If not, upload the file
          await s3Client.send(new PutObjectCommand({
            Bucket: process.env.TEMP_BUCKET || process.env.S3_BUCKET || process.env.AWS_S3_BUCKET,
            Key: tempKey,
            Body: attachment.content
          }));
        }));

        // Start Textract job
        const startCommand = new StartDocumentTextDetectionCommand({
          DocumentLocation: {
            S3Object: {
              Bucket: process.env.TEMP_BUCKET || process.env.S3_BUCKET || process.env.AWS_S3_BUCKET,
              Name: tempKey
            }
          }
        });
        const startResponse = await textractClient.send(startCommand);
        const jobId = startResponse.JobId;

        // Poll for job completion
        let status = 'IN_PROGRESS';
        let textractResult;
        while (status === 'IN_PROGRESS') {
          await new Promise(res => setTimeout(res, 2000));
          const getCommand = new GetDocumentTextDetectionCommand({ JobId: jobId });
          textractResult = await textractClient.send(getCommand);
          status = textractResult.JobStatus;
        }

        if (status !== 'SUCCEEDED') {
          throw new Error('Textract failed to process the document.');
        }

        // Concatenate all detected text
        const text = textractResult.Blocks
          .filter(block => block.BlockType === 'LINE')
          .map(block => block.Text)
          .join('\n');

        // Process the extracted text as usual
        const result = quickProcess(text);
        return {
          success: result.success,
          documentType: result.documentType,
          extractedData: result.extractedData,
          validation: result.validation,
          fileName: attachment.filename,
          error: result.error,
        };
      } catch (err) {
        return {
          success: false,
          documentType: 'UNKNOWN',
          extractedData: {},
          validation: {
            isValid: false,
            errors: ['Textract error: ' + err.message],
            warnings: [],
            confidenceScore: 0,
          },
          fileName: attachment.filename,
          error: 'Textract error: ' + err.message,
        };
      }
    }
    
    return {
      success: false,
      documentType: 'UNKNOWN',
      extractedData: {},
      validation: {
        isValid: false,
        errors: ['Unsupported file type'],
        warnings: [],
        confidenceScore: 0,
      },
      fileName: attachment.filename,
      error: `Unsupported file type: ${attachment.contentType}`,
    };
  } catch (error) {
    console.error(`Error processing attachment ${attachment.filename}:`, error);
    return {
      success: false,
      documentType: 'UNKNOWN',
      extractedData: {},
      validation: {
        isValid: false,
        errors: [error.message],
        warnings: [],
        confidenceScore: 0,
      },
      fileName: attachment.filename,
      error: error.message,
    };
  }
}

/**
 * Send response email via SES
 * @param {string} toAddress - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} htmlBody - HTML email body
 * @param {string} textBody - Plain text email body
 * @returns {Promise<void>}
 */
async function sendResponseEmail(toAddress, subject, htmlBody, textBody) {
  const fromEmail = process.env.FROM_EMAIL || 'notifications@isaloumapps.com';
  
  const params = {
    Source: fromEmail,
    Destination: {
      ToAddresses: [toAddress],
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: htmlBody,
          Charset: 'UTF-8',
        },
        Text: {
          Data: textBody,
          Charset: 'UTF-8',
        },
      },
    },
  };
  
  try {
    const command = new SendEmailCommand(params);
    const response = await sesClient.send(command);
    console.log('Email sent successfully:', response.MessageId);
    return response;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Download email from S3
 * @param {string} bucket - S3 bucket name
 * @param {string} key - S3 object key
 * @returns {Promise<Buffer>} - Email content as buffer
 */
async function downloadEmailFromS3(bucket, key) {
  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    
    const response = await s3Client.send(command);
    
    // Convert stream to buffer
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    
    return Buffer.concat(chunks);
  } catch (error) {
    console.error('Error downloading email from S3:', error);
    throw new Error(`Failed to download email from S3: ${error.message}`);
  }
}

/**
 * Main Lambda handler
 * @param {Object} event - S3 event triggered when email arrives
 * @param {Object} context - Lambda context
 * @returns {Promise<Object>} - Response object
 */
export async function handler(event, context) {
  console.log('Lambda function started');
  console.log('Event:', JSON.stringify(event, null, 2));
  
  try {
    // Parse S3 event
    const record = event.Records?.[0];
    if (!record || !record.s3) {
      throw new Error('Invalid S3 event structure');
    }
    
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    
    console.log(`Processing email from S3: ${bucket}/${key}`);
    
    // Download email from S3
    const emailBuffer = await downloadEmailFromS3(bucket, key);
    console.log(`Downloaded email: ${emailBuffer.length} bytes`);
    
    // Parse email
    const parsedEmail = await parseEmail(emailBuffer);
    console.log(`Parsed email from: ${parsedEmail.fromAddress}`);
    console.log(`Subject: ${parsedEmail.subject}`);
    console.log(`Attachments: ${parsedEmail.attachments.length}`);
    
    // Extract and filter attachments
    const processableAttachments = extractAttachments(parsedEmail.attachments).filter(
      isProcessableAttachment
    );
    
    console.log(`Processable attachments: ${processableAttachments.length}`);
    
    // If no attachments, send error response
    if (processableAttachments.length === 0) {
      const errorHtml = generateErrorEmail(
        new Error('No processable attachments found. Please attach PDF, image, or text files.'),
        parsedEmail.fromAddress
      );
      const errorText = generateErrorTextEmail(
        new Error('No processable attachments found. Please attach PDF, image, or text files.')
      );
      
      await sendResponseEmail(
        parsedEmail.fromAddress,
        'TaxSyncForDrivers - No Attachments Found',
        errorHtml,
        errorText
      );
      
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No attachments to process, error email sent' }),
      };
    }
    
    // Process all attachments
    const results = [];
    for (const attachment of processableAttachments) {
      const result = await processAttachment(attachment);
      results.push(result);
    }
    
    console.log(`Processed ${results.length} attachments`);
    
    // Check if any processing was successful
    const hasSuccess = results.some(r => r.success);
    
    if (hasSuccess || results.length > 0) {
      // Send success email with results
      const successHtml = generateSuccessEmail(results, parsedEmail.fromAddress);
      const successText = generateSuccessTextEmail(results);
      
      await sendResponseEmail(
        parsedEmail.fromAddress,
        'TaxSyncForDrivers - Documents Processed',
        successHtml,
        successText
      );
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Processing complete',
          results: results.map(r => ({
            fileName: r.fileName,
            success: r.success,
            documentType: r.documentType,
          })),
        }),
      };
    } else {
      // All processing failed, send error email
      const errorHtml = generateErrorEmail(
        new Error('All documents failed to process. Please check the file formats and try again.'),
        parsedEmail.fromAddress
      );
      const errorText = generateErrorTextEmail(
        new Error('All documents failed to process. Please check the file formats and try again.')
      );
      
      await sendResponseEmail(
        parsedEmail.fromAddress,
        'TaxSyncForDrivers - Processing Failed',
        errorHtml,
        errorText
      );
      
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'All processing failed, error email sent' }),
      };
    }
  } catch (error) {
    console.error('Lambda function error:', error);
    
    // Try to send error email if we have sender info
    try {
      if (event.Records?.[0]?.ses?.mail?.source) {
        const senderEmail = event.Records[0].ses.mail.source;
        const errorHtml = generateErrorEmail(error, senderEmail);
        const errorText = generateErrorTextEmail(error);
        
        await sendResponseEmail(
          senderEmail,
          'TaxSyncForDrivers - Processing Error',
          errorHtml,
          errorText
        );
      }
    } catch (emailError) {
      console.error('Failed to send error email:', emailError);
    }
    
    // Return error response
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
        stack: error.stack,
      }),
    };
  }
}
