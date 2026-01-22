// document-processor.js — Core OCR and extraction engine for tax documents
// Note: OCR functionality requires Tesseract.js or cloud OCR service integration

import { classifyDocument, extractFields, DOCUMENT_TYPES, T4A_PATTERNS } from './pattern-library.js';
import { validateData } from './validation-engine.js';

/**
 * Extract data from T4A slip
 * @param {string} text - Text extracted from T4A slip
 * @returns {object} - Extracted T4A data
 */
export function extractT4A(text) {
  const extractAmount = (pattern) => {
    const match = text.match(pattern);
    return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
  };
  
  const extractText = (pattern) => {
    const match = text.match(pattern);
    return match ? match[1].trim() : '';
  };
  
  return {
    documentType: 'T4A',
    feesForServices: extractAmount(T4A_PATTERNS.feesForServices),
    commissions: extractAmount(T4A_PATTERNS.commissions),
    pension: extractAmount(T4A_PATTERNS.pension),
    lumpSum: extractAmount(T4A_PATTERNS.lumpSum),
    otherIncome: extractAmount(T4A_PATTERNS.otherIncome),
    incomeTaxDeducted: extractAmount(T4A_PATTERNS.incomeTaxDeducted),
    payerName: extractText(T4A_PATTERNS.payerName),
    payerBusinessNumber: extractText(T4A_PATTERNS.payerBusinessNumber),
    recipientName: extractText(T4A_PATTERNS.recipientName),
    recipientSIN: extractText(T4A_PATTERNS.recipientSIN),
    year: extractText(T4A_PATTERNS.year),
    totalIncome: extractAmount(T4A_PATTERNS.feesForServices) + 
                 extractAmount(T4A_PATTERNS.commissions) + 
                 extractAmount(T4A_PATTERNS.otherIncome),
  };
}

/**
 * Document processing result
 * @typedef {Object} ProcessingResult
 * @property {boolean} success - Whether processing succeeded
 * @property {string} documentType - Identified document type
 * @property {object} extractedData - Extracted field data
 * @property {object} validation - Validation results
 * @property {string} rawText - Raw extracted text
 * @property {string} error - Error message if failed
 */

/**
 * DocumentProcessor class for handling document extraction and processing
 */
export class DocumentProcessor {
  constructor() {
    this.ocrEngine = null;
    this.useOCR = false; // Set to true when OCR library is available
  }

  /**
   * Initialize OCR engine (Tesseract.js or alternative)
   * This is a placeholder for future OCR integration
   */
  async initializeOCR() {
    // Placeholder for OCR initialization
    // In production, this would initialize Tesseract.js or cloud OCR
    // Example: this.ocrEngine = await Tesseract.createWorker();
    console.log('OCR engine would be initialized here');
    this.useOCR = false; // Keep false until OCR is actually implemented
  }

  /**
   * Extract text from an image file using OCR
   * @param {File|Blob} file - Image file to process
   * @returns {Promise<string>} - Extracted text
   */
  async extractTextFromImage(file) {
    if (!this.useOCR || !this.ocrEngine) {
      throw new Error('OCR engine not initialized. Text extraction from images is not available.');
    }

    // Placeholder for OCR processing
    // In production: const { data: { text } } = await this.ocrEngine.recognize(file);
    throw new Error('OCR functionality not yet implemented. Please use PDF or text input.');
  }

  /**
   * Extract text from a PDF file
   * @param {File} file - PDF file to process
   * @returns {Promise<string>} - Extracted text
   */
  async extractTextFromPDF(file) {
    // Check if PDF.js is available
    if (typeof pdfjsLib === 'undefined') {
      throw new Error('PDF.js library not loaded. Please refresh the page.');
    }
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      
      // Extract text from each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
      }
      
      const extractedText = fullText.trim();
      
      // Check if we actually got any text
      if (!extractedText || extractedText.length === 0) {
        throw new Error('No text could be extracted from this PDF. It may be an image-based (scanned) PDF.');
      }
      
      return extractedText;
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('Failed to extract text from PDF: ' + error.message);
    }
  }

  /**
   * Extract text from a file based on its type
   * @param {File} file - File to process
   * @returns {Promise<string>} - Extracted text
   */
  async extractText(file) {
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();

    // Handle text files
    if (fileType.includes('text') || fileName.endsWith('.txt')) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Failed to read text file'));
        reader.readAsText(file);
      });
    }

    // Handle PDF files
    if (fileType.includes('pdf') || fileName.endsWith('.pdf')) {
      return await this.extractTextFromPDF(file);
    }

    // Handle image files
    if (fileType.includes('image') || /\.(jpg|jpeg|png|gif|bmp)$/i.test(fileName)) {
      return await this.extractTextFromImage(file);
    }

    throw new Error(`Unsupported file type: ${fileType || 'unknown'}`);
  }

  /**
   * Process a document from text input
   * @param {string} text - Document text
   * @returns {ProcessingResult}
   */
  processText(text) {
    console.log('processText called with text length:', text?.length || 0);
    
    try {
      if (!text || text.trim().length === 0) {
        throw new Error('Empty text provided');
      }
      
      // Step 1: Classify document
      const documentType = classifyDocument(text);
      console.log('Document classified as:', documentType);

      if (documentType === DOCUMENT_TYPES.UNKNOWN) {
        return {
          success: false,
          documentType: DOCUMENT_TYPES.UNKNOWN,
          extractedData: {},
          validation: {
            isValid: false,
            errors: ['Could not identify document type'],
            warnings: ['Please ensure the text is from a supported document: T4, T4A, RL-1, RL-2, Uber/Lyft summary, or receipt'],
            confidenceScore: 0,
          },
          rawText: text,
          error: 'Could not identify document type. Please ensure the document is a supported tax form or receipt.',
        };
      }

      // Step 2: Extract data based on document type
      const extractedData = extractFields(text, documentType);
      console.log('Extracted data:', extractedData);

      // Step 3: Validate extracted data
      const validation = validateData(extractedData, documentType);
      console.log('Validation result:', validation);

      return {
        success: validation.isValid,
        documentType,
        extractedData,
        validation,
        rawText: text,
        error: validation.isValid ? null : validation.errors.join('; '),
      };
    } catch (error) {
      console.error('processText error:', error);
      return {
        success: false,
        documentType: DOCUMENT_TYPES.UNKNOWN,
        extractedData: {},
        validation: {
          isValid: false,
          errors: [error.message],
          warnings: [],
          confidenceScore: 0,
        },
        rawText: text,
        error: `Processing error: ${error.message}`,
      };
    }
  }

  /**
   * Process a document file (PDF, image, or text)
   * @param {File} file - Document file
   * @returns {Promise<ProcessingResult>}
   */
  async processDocument(file) {
    try {
      // Extract text from file
      const text = await this.extractText(file);

      // Process the extracted text
      const result = this.processText(text);

      // Add file metadata
      result.fileName = file.name;
      result.fileSize = file.size;
      result.fileType = file.type;

      return result;
    } catch (error) {
      return {
        success: false,
        documentType: DOCUMENT_TYPES.UNKNOWN,
        extractedData: {},
        validation: {
          isValid: false,
          errors: [error.message],
          warnings: [],
          confidenceScore: 0,
        },
        rawText: '',
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        error: error.message,
      };
    }
  }

  /**
   * Process multiple documents in batch
   * @param {File[]} files - Array of document files
   * @returns {Promise<ProcessingResult[]>}
   */
  async processBatch(files) {
    const results = [];

    for (const file of files) {
      const result = await this.processDocument(file);
      results.push(result);
    }

    return results;
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    if (this.ocrEngine) {
      // Cleanup OCR engine if needed
      // Example: await this.ocrEngine.terminate();
      this.ocrEngine = null;
    }
  }
}

/**
 * Create and initialize a document processor
 * @returns {Promise<DocumentProcessor>}
 */
export async function createDocumentProcessor() {
  const processor = new DocumentProcessor();
  // Initialize OCR if available
  try {
    await processor.initializeOCR();
  } catch (error) {
    console.warn('OCR initialization failed:', error.message);
  }
  return processor;
}

/**
 * Quick processing function for simple text input
 * @param {string} text - Document text
 * @returns {ProcessingResult}
 */
export function quickProcess(text) {
  const processor = new DocumentProcessor();
  return processor.processText(text);
}
