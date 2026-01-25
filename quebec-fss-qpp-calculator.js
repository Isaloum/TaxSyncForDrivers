/**
 * FSS (Health Services Fund) and QPP (Quebec Pension Plan) Calculator
 * Quebec-specific contributions for self-employed workers
 * 
 * References:
 * - FSS: https://www.revenuquebec.ca/en/businesses/source-deductions-and-employer-contributions/paying-the-contribution-to-the-health-services-fund/
 * - QPP: https://www.rrq.gouv.qc.ca/en/programmes/regime_rentes/regime_chiffres/Pages/regime_chiffres.aspx
 */

export class QuebecFSSQPPCalculator {
  // FSS Rates (2026)
  static FSS_RATES = {
    tier1: { threshold: 100000, rate: 0.0100 },
    tier2: { threshold: 1000000, rate: 0.0165 },
    tier3: { rate: 0.0200 }
  };

  // QPP Rates (2026)
  static QPP_RATES = {
    exemption: 3500,
    maxBase: 68500,
    maxAdditional: 73200,
    baseRate: 0.1280,
    additionalRate: 0.0200,
    maxContribution: 8244.60
  };

  /**
   * Calculate FSS (Health Services Fund)
   * @param {number} netBusinessIncome - Self-employment income
   * @returns {Object} FSS breakdown
   */
  static calculateFSS(netBusinessIncome) {
    let fss = 0;
    let tier = 1;

    if (netBusinessIncome <= this.FSS_RATES.tier1.threshold) {
      fss = netBusinessIncome * this.FSS_RATES.tier1.rate;
      tier = 1;
    } else if (netBusinessIncome <= this.FSS_RATES.tier2.threshold) {
      const tier1Amount = this.FSS_RATES.tier1.threshold * this.FSS_RATES.tier1.rate;
      const tier2Amount = (netBusinessIncome - this.FSS_RATES.tier1.threshold) * this.FSS_RATES.tier2.rate;
      fss = tier1Amount + tier2Amount;
      tier = 2;
    } else {
      const tier1Amount = this.FSS_RATES.tier1.threshold * this.FSS_RATES.tier1.rate;
      const tier2Amount = (this.FSS_RATES.tier2.threshold - this.FSS_RATES.tier1.threshold) * this.FSS_RATES.tier2.rate;
      const tier3Amount = (netBusinessIncome - this.FSS_RATES.tier2.threshold) * this.FSS_RATES.tier3.rate;
      fss = tier1Amount + tier2Amount + tier3Amount;
      tier = 3;
    }

    return {
      amount: fss,
      tier,
      rate: this._getFSSRate(tier),
      ratePercentage: this._getFSSRatePercentage(tier)
    };
  }

  /**
   * Get FSS rate for a tier
   * @private
   */
  static _getFSSRate(tier) {
    switch (tier) {
      case 1: return this.FSS_RATES.tier1.rate;
      case 2: return this.FSS_RATES.tier2.rate;
      case 3: return this.FSS_RATES.tier3.rate;
      default: return this.FSS_RATES.tier1.rate;
    }
  }

  /**
   * Get FSS rate percentage string for a tier
   * @private
   */
  static _getFSSRatePercentage(tier) {
    switch (tier) {
      case 1: return '1.00%';
      case 2: return '1.65%';
      case 3: return '2.00%';
      default: return '1.00%';
    }
  }

  /**
   * Calculate QPP (Quebec Pension Plan)
   * @param {number} netBusinessIncome - Self-employment income
   * @returns {Object} QPP breakdown
   */
  static calculateQPP(netBusinessIncome) {
    const { exemption, maxBase, maxAdditional, baseRate, additionalRate, maxContribution } = this.QPP_RATES;

    // Base contribution calculation
    const baseIncome = Math.min(
      Math.max(0, netBusinessIncome - exemption),
      maxBase - exemption
    );
    const baseContribution = baseIncome * baseRate;

    // Additional contribution (second tier)
    const additionalIncome = Math.max(0, netBusinessIncome - maxBase);
    const additionalContribution = Math.min(additionalIncome, maxAdditional - maxBase) * additionalRate;

    const totalQPP = Math.min(baseContribution + additionalContribution, maxContribution);

    return {
      baseContribution,
      additionalContribution,
      totalQPP,
      baseIncome,
      additionalIncome: Math.min(additionalIncome, maxAdditional - maxBase),
      maxReached: totalQPP >= maxContribution
    };
  }

  /**
   * Calculate both FSS and QPP
   * @param {number} netBusinessIncome - Self-employment income
   * @returns {Object} Combined FSS + QPP breakdown
   */
  static calculate(netBusinessIncome) {
    const fss = this.calculateFSS(netBusinessIncome);
    const qpp = this.calculateQPP(netBusinessIncome);

    return {
      fss,
      qpp,
      total: fss.amount + qpp.totalQPP,
      netBusinessIncome,
      effectiveRate: netBusinessIncome > 0 ? ((fss.amount + qpp.totalQPP) / netBusinessIncome) * 100 : 0
    };
  }

  /**
   * Get payment instructions
   * @returns {Object} Payment details
   */
  static getPaymentInfo() {
    return {
      fss: {
        form: 'TP-1',
        deadline: 'April 30 (or June 15 if self-employed)',
        method: 'Paid with Quebec income tax return',
        link: 'https://www.revenuquebec.ca/en/businesses/source-deductions-and-employer-contributions/paying-the-contribution-to-the-health-services-fund/'
      },
      qpp: {
        form: 'TP-1 (Schedule L)',
        deadline: 'April 30 (or June 15 if self-employed)',
        method: 'Paid with Quebec income tax return',
        link: 'https://www.rrq.gouv.qc.ca/en/programmes/regime_rentes/regime_chiffres/Pages/regime_chiffres.aspx'
      }
    };
  }
}
