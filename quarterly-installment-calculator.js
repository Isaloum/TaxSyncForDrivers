/**
 * Quarterly Tax Installment Calculator
 * CRA requires quarterly payments if tax owing > $3,000
 */

(function (global) {
  'use strict';

  const QuarterlyInstallmentCalculator = {
    THRESHOLD: 3000, // CRA minimum threshold
    PENALTY_RATE: 0.05, // 5% annual interest on late/underpayments

    DEADLINES: {
      Q1: { month: 2, day: 15, label: 'March 15' },    // month 2 = March (0-indexed)
      Q2: { month: 5, day: 15, label: 'June 15' },
      Q3: { month: 8, day: 15, label: 'September 15' },
      Q4: { month: 11, day: 15, label: 'December 15' }
    },

    /**
     * Calculate quarterly installments
     * @param {Object} params
     * @param {number} params.estimatedIncome - Current year estimated income
     * @param {number} params.priorYearTax - Last year's total tax paid (optional)
     * @param {string} params.province - Province code (QC, ON, etc.)
     * @returns {Object} Installment schedule
     */
    calculate({ estimatedIncome, priorYearTax = 0, province = 'QC' }) {
      // Import existing tax calculation (reuse from driver-calculator.js)
      const annualTax = this.estimateAnnualTax(estimatedIncome, province);

      // Check if installments required
      if (annualTax < this.THRESHOLD && priorYearTax < this.THRESHOLD) {
        return {
          required: false,
          threshold: this.THRESHOLD,
          message: `No installments required. Estimated tax ($${annualTax.toFixed(2)}) is below $${this.THRESHOLD} threshold.`
        };
      }

      // Calculate quarterly amount
      const baseAmount = priorYearTax > 0 ? priorYearTax : annualTax;
      const quarterlyAmount = Math.ceil(baseAmount / 4);

      // Generate payment schedule
      const currentYear = new Date().getFullYear();
      const schedule = Object.entries(this.DEADLINES).map(([quarter, deadline]) => {
        const dueDate = new Date(currentYear, deadline.month, deadline.day);
        const isPast = dueDate < new Date();

        return {
          quarter,
          amount: quarterlyAmount,
          dueDate: dueDate.toISOString().split('T')[0],
          label: deadline.label,
          isPast,
          status: isPast ? 'overdue' : 'upcoming'
        };
      });

      return {
        required: true,
        quarterlyAmount,
        annualTotal: quarterlyAmount * 4,
        schedule,
        method: priorYearTax > 0 ? 'prior-year' : 'current-year-estimate',
        estimatedTax: annualTax,
        nextPayment: schedule.find(s => !s.isPast)
      };
    },

    /**
     * Estimate annual tax (simplified - reuses existing tax calculator)
     */
    estimateAnnualTax(income, province) {
      // Federal tax (2026 rates)
      const federalTax = this.calculateFederalTax(income);

      // Provincial tax (simplified - use average 10% rate)
      const provincialTax = income * 0.10;

      // CPP/QPP + EI (self-employed)
      const cpp = Math.min(income * 0.1180, 7735); // 2026 max

      return federalTax + provincialTax + cpp;
    },

    calculateFederalTax(income) {
      const bpa = 15705; // 2026 Basic Personal Amount
      const taxableIncome = Math.max(0, income - bpa);

      // Federal brackets 2026
      const brackets = [
        { max: 55867, rate: 0.15 },
        { max: 111733, rate: 0.205 },
        { max: 173205, rate: 0.26 },
        { max: 246752, rate: 0.29 },
        { max: Infinity, rate: 0.33 }
      ];

      let tax = 0;
      let remaining = taxableIncome;
      let prevMax = 0;

      for (const bracket of brackets) {
        const bracketIncome = Math.min(remaining, bracket.max - prevMax);
        if (bracketIncome <= 0) break;

        tax += bracketIncome * bracket.rate;
        remaining -= bracketIncome;
        prevMax = bracket.max;
      }

      return tax;
    },

    /**
     * Calculate penalty for late/underpayment
     */
    calculatePenalty(amountOwed, dayslate) {
      const dailyRate = this.PENALTY_RATE / 365;
      return amountOwed * dailyRate * dayslate;
    }
  };

  // Export to global scope
  global.QuarterlyInstallmentCalculator = QuarterlyInstallmentCalculator;

})(typeof window !== 'undefined' ? window : global);
