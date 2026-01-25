// receipt-manager.js — Receipt Retention System for CRA Compliance
// Manages receipt uploads, storage, and 6-year retention tracking

const STORAGE_KEY = 'taxsync_receipts';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const STORAGE_WARNING_SIZE = 8 * 1024 * 1024; // 8MB
const RETENTION_YEARS = 6;
const CRA_RECEIPT_THRESHOLD = 75; // Receipts required for expenses >$75

/**
 * Receipt Manager class for CRA-compliant receipt retention
 */
export class ReceiptManager {
  /**
   * Convert file to Base64 string
   * @param {File} file - File object to convert
   * @returns {Promise<string>} - Base64 data URL
   */
  static async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      if (file.size > MAX_FILE_SIZE) {
        reject(new Error('File too large (max 5MB)'));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Calculate retention date (6 years from end of tax year)
   * @param {string} expenseDate - Date of expense (YYYY-MM-DD)
   * @returns {string} - Retention date (YYYY-12-31)
   */
  static calculateRetentionDate(expenseDate) {
    const taxYear = new Date(expenseDate).getFullYear();
    return `${taxYear + RETENTION_YEARS}-12-31`;
  }

  /**
   * Save receipt to localStorage
   * @param {object} expense - Expense details (date, amount, vendor, category, description)
   * @param {File} file - Receipt file (JPEG, PNG, PDF)
   * @returns {Promise<string>} - Receipt ID
   */
  static async saveReceipt(expense, file) {
    const receipts = this.getAllReceipts();
    
    // Check storage quota
    const currentSize = JSON.stringify(receipts).length;
    if (currentSize > STORAGE_WARNING_SIZE) {
      throw new Error('Storage nearly full. Archive old receipts.');
    }
    
    const receipt = {
      id: `receipt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      expense: {
        date: expense.date,
        amount: expense.amount,
        vendor: expense.vendor,
        category: expense.category,
        description: expense.description || ''
      },
      receipt: {
        format: file.type,
        data: await this.fileToBase64(file),
        filename: file.name,
        size: file.size
      },
      metadata: {
        uploadedAt: new Date().toISOString(),
        retainUntil: this.calculateRetentionDate(expense.date),
        auditStatus: 'active'
      }
    };
    
    receipts.push(receipt);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(receipts));
    
    return receipt.id;
  }

  /**
   * Get receipt by ID
   * @param {string} id - Receipt ID
   * @returns {object|null} - Receipt object or null if not found
   */
  static getReceipt(id) {
    const receipts = this.getAllReceipts();
    return receipts.find(r => r.id === id) || null;
  }

  /**
   * Get all receipts
   * @returns {Array} - Array of all receipts
   */
  static getAllReceipts() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  /**
   * Delete receipt by ID
   * @param {string} id - Receipt ID
   * @returns {boolean} - True if deleted, false if not found
   */
  static deleteReceipt(id) {
    const receipts = this.getAllReceipts();
    const index = receipts.findIndex(r => r.id === id);
    
    if (index === -1) return false;
    
    receipts.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(receipts));
    return true;
  }

  /**
   * Get receipts by year
   * @param {number} year - Tax year
   * @returns {Array} - Filtered receipts
   */
  static getReceiptsByYear(year) {
    const receipts = this.getAllReceipts();
    return receipts.filter(r => {
      const expenseYear = new Date(r.expense.date).getFullYear();
      return expenseYear === year;
    });
  }

  /**
   * Get receipts by category
   * @param {string} category - Expense category
   * @returns {Array} - Filtered receipts
   */
  static getReceiptsByCategory(category) {
    const receipts = this.getAllReceipts();
    return receipts.filter(r => r.expense.category === category);
  }

  /**
   * Get receipts over a specified amount
   * @param {number} amount - Minimum amount
   * @returns {Array} - Filtered receipts
   */
  static getReceiptsOverAmount(amount) {
    const receipts = this.getAllReceipts();
    return receipts.filter(r => r.expense.amount > amount);
  }

  /**
   * Validate if receipt is required for CRA compliance
   * @param {number} amount - Expense amount
   * @returns {boolean} - True if receipt required (>$75)
   */
  static validateReceiptRequired(amount) {
    return amount > CRA_RECEIPT_THRESHOLD;
  }

  /**
   * Check retention status of a receipt
   * @param {string} receiptId - Receipt ID
   * @returns {object|null} - Status object with isExpired, daysUntilExpiry, status
   */
  static checkRetentionStatus(receiptId) {
    const receipt = this.getReceipt(receiptId);
    if (!receipt) return null;
    
    const retainUntil = new Date(receipt.metadata.retainUntil);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((retainUntil - now) / (1000 * 60 * 60 * 24));
    
    return {
      isExpired: daysUntilExpiry < 0,
      daysUntilExpiry,
      retainUntil: receipt.metadata.retainUntil,
      status: receipt.metadata.auditStatus
    };
  }

  /**
   * Get receipts expiring soon
   * @param {number} daysUntilExpiry - Number of days threshold
   * @returns {Array} - Receipts expiring within specified days
   */
  static getExpiringReceipts(daysUntilExpiry) {
    const receipts = this.getAllReceipts();
    const now = new Date();
    
    return receipts.filter(r => {
      const retainUntil = new Date(r.metadata.retainUntil);
      const days = Math.ceil((retainUntil - now) / (1000 * 60 * 60 * 24));
      return days >= 0 && days <= daysUntilExpiry;
    });
  }

  /**
   * Generate receipt report as CSV
   * @param {number} year - Tax year
   * @returns {string} - CSV formatted report
   */
  static generateReceiptReport(year) {
    const receipts = this.getReceiptsByYear(year);
    
    let csv = 'Receipt ID,Date,Vendor,Category,Amount,Filename,Retain Until,Status\n';
    
    receipts.forEach(r => {
      csv += `${r.id},${r.expense.date},${r.expense.vendor},${r.expense.category},${r.expense.amount},${r.receipt.filename},${r.metadata.retainUntil},${r.metadata.auditStatus}\n`;
    });
    
    return csv;
  }

  /**
   * Export receipts as downloadable files (Note: ZIP generation requires JSZip library)
   * @param {number} year - Tax year
   * @param {string} category - Optional category filter
   * @returns {Array} - Array of receipt data for export
   */
  static exportReceiptsAsZip(year, category = null) {
    let receipts = this.getReceiptsByYear(year);
    
    if (category) {
      receipts = receipts.filter(r => r.expense.category === category);
    }
    
    // Return receipt data for external ZIP processing
    return receipts.map(r => ({
      filename: r.receipt.filename,
      data: r.receipt.data,
      metadata: {
        date: r.expense.date,
        vendor: r.expense.vendor,
        amount: r.expense.amount,
        category: r.expense.category
      }
    }));
  }

  /**
   * Archive old receipts (change status to archived)
   * @returns {number} - Number of receipts archived
   */
  static archiveOldReceipts() {
    const receipts = this.getAllReceipts();
    const now = new Date();
    let count = 0;
    
    receipts.forEach(r => {
      const retainUntil = new Date(r.metadata.retainUntil);
      const daysUntilExpiry = Math.ceil((retainUntil - now) / (1000 * 60 * 60 * 24));
      
      // Archive receipts within 30 days of expiry but not yet expired
      if (daysUntilExpiry >= 0 && daysUntilExpiry <= 30 && r.metadata.auditStatus === 'active') {
        r.metadata.auditStatus = 'archived';
        count++;
      }
    });
    
    if (count > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(receipts));
    }
    
    return count;
  }

  /**
   * Clear expired receipts (>6 years old)
   * @returns {number} - Number of receipts deleted
   */
  static clearExpiredReceipts() {
    const receipts = this.getAllReceipts();
    const now = new Date();
    
    const activeReceipts = receipts.filter(r => {
      const retainUntil = new Date(r.metadata.retainUntil);
      return retainUntil >= now;
    });
    
    const deletedCount = receipts.length - activeReceipts.length;
    
    if (deletedCount > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activeReceipts));
    }
    
    return deletedCount;
  }
}
