// driver-calculator.js — Tax calculations for Quebec rideshare & taxi drivers
// 2025 CRA/Revenu Quebec rates for self-employed drivers

(function (global) {
  'use strict';

  const MILEAGE_RATES = {
    first5000: 0.7,
    additional: 0.64,
    territories: 0.04,
  };

  function calculateSimplifiedVehicle(totalKm) {
    if (totalKm <= 0) return { deduction: 0, breakdown: { first5000: 0, additional: 0 } };
    const first5000Km = Math.min(totalKm, 5000);
    const additionalKm = Math.max(0, totalKm - 5000);
    const first5000Deduction = first5000Km * MILEAGE_RATES.first5000;
    const additionalDeduction = additionalKm * MILEAGE_RATES.additional;
    return {
      deduction: Math.round((first5000Deduction + additionalDeduction) * 100) / 100,
      breakdown: {
        first5000Km,
        first5000Deduction: Math.round(first5000Deduction * 100) / 100,
        additionalKm,
        additionalDeduction: Math.round(additionalDeduction * 100) / 100,
      },
    };
  }

  function calculateDetailedVehicle(expenses) {
    const {
      fuel = 0,
      insurance = 0,
      maintenance = 0,
      registration = 0,
      carWash = 0,
      parking = 0,
      tolls = 0,
      leasePayments = 0,
      interest = 0,
      vehicleCost = 0,
      businessUsePercent = 100,
    } = expenses;
    const operatingExpenses =
      fuel + insurance + maintenance + registration + carWash + parking + tolls;
    const financingCosts = leasePayments + interest;
    const ccaFirstYear = Math.min(vehicleCost, 37000) * 0.3 * 0.5;
    const businessRatio = businessUsePercent / 100;
    const totalDeduction = (operatingExpenses + financingCosts + ccaFirstYear) * businessRatio;
    return {
      deduction: Math.round(totalDeduction * 100) / 100,
      breakdown: {
        operatingExpenses: Math.round(operatingExpenses * 100) / 100,
        financingCosts: Math.round(financingCosts * 100) / 100,
        cca: Math.round(ccaFirstYear * 100) / 100,
        businessUsePercent,
        totalBeforeBusinessUse:
          Math.round((operatingExpenses + financingCosts + ccaFirstYear) * 100) / 100,
      },
    };
  }

  function compareVehicleMethods(totalKm, expenses) {
    const simplified = calculateSimplifiedVehicle(totalKm);
    const detailed = calculateDetailedVehicle(expenses);
    return {
      recommended: simplified.deduction >= detailed.deduction ? 'simplified' : 'detailed',
      simplified,
      detailed,
      savings: Math.round(Math.abs(simplified.deduction - detailed.deduction) * 100) / 100,
      bestDeduction: Math.max(simplified.deduction, detailed.deduction),
    };
  }

  const SELF_EMPLOYMENT_RATES = {
    qppRate: 0.128,
    qppMaxPensionable: 71300,
    qppExemption: 3500,
    qpp2Rate: 0.02,
    qpp2MaxEarnings: 81200,
  };

  function calculateSelfEmploymentTax(netSelfEmploymentIncome) {
    if (netSelfEmploymentIncome <= SELF_EMPLOYMENT_RATES.qppExemption)
      return { totalContribution: 0, deductiblePortion: 0, netCost: 0, qpp2Contribution: 0 };
    const pensionableEarnings = Math.min(
      netSelfEmploymentIncome - SELF_EMPLOYMENT_RATES.qppExemption,
      SELF_EMPLOYMENT_RATES.qppMaxPensionable - SELF_EMPLOYMENT_RATES.qppExemption
    );
    const baseContribution = pensionableEarnings * SELF_EMPLOYMENT_RATES.qppRate;
    let qpp2Contribution = 0;
    if (netSelfEmploymentIncome > SELF_EMPLOYMENT_RATES.qppMaxPensionable) {
      qpp2Contribution =
        Math.min(
          netSelfEmploymentIncome - SELF_EMPLOYMENT_RATES.qppMaxPensionable,
          SELF_EMPLOYMENT_RATES.qpp2MaxEarnings - SELF_EMPLOYMENT_RATES.qppMaxPensionable
        ) * SELF_EMPLOYMENT_RATES.qpp2Rate;
    }
    const totalContribution = baseContribution + qpp2Contribution;
    const deductiblePortion = baseContribution / 2;
    return {
      totalContribution: Math.round(totalContribution * 100) / 100,
      deductiblePortion: Math.round(deductiblePortion * 100) / 100,
      netCost: Math.round((totalContribution - deductiblePortion) * 100) / 100,
      qpp2Contribution: Math.round(qpp2Contribution * 100) / 100,
    };
  }

  const QUARTERLY_DUE_DATES = {
    q1: { month: 3, day: 15, label: 'March 15' },
    q2: { month: 6, day: 15, label: 'June 15' },
    q3: { month: 9, day: 15, label: 'September 15' },
    q4: { month: 12, day: 15, label: 'December 15' },
  };

  function calculateQuarterlyInstallments(estimatedAnnualTax, estimatedAnnualIncome) {
    const quarterlyAmount = estimatedAnnualTax / 4;
    const schedule = Object.entries(QUARTERLY_DUE_DATES).map(([quarter, info]) => ({
      quarter: quarter.toUpperCase(),
      dueDate: info.label,
      amount: Math.round(quarterlyAmount * 100) / 100,
    }));
    return {
      annualTax: Math.round(estimatedAnnualTax * 100) / 100,
      quarterly: Math.round(quarterlyAmount * 100) / 100,
      monthly: Math.round((estimatedAnnualTax / 12) * 100) / 100,
      biweekly: Math.round((estimatedAnnualTax / 26) * 100) / 100,
      weekly: Math.round((estimatedAnnualTax / 52) * 100) / 100,
      schedule,
      effectiveTaxRate: Math.round((estimatedAnnualTax / estimatedAnnualIncome) * 10000) / 100,
    };
  }

  function calculateLatePenalty(amountOwing, daysLate) {
    if (daysLate <= 0) return { interest: 0, total: amountOwing };
    const dailyRate = 0.1 / 365;
    const interest = amountOwing * dailyRate * daysLate;
    return {
      interest: Math.round(interest * 100) / 100,
      total: Math.round((amountOwing + interest) * 100) / 100,
      daysLate,
      dailyInterest: Math.round(amountOwing * dailyRate * 100) / 100,
    };
  }

  function parsePlatformStatement(text) {
    if (!text || typeof text !== 'string')
      return { grossFares: 0, tips: 0, fees: 0, netIncome: 0, platform: 'unknown', isValid: false };
    const normalized = text.toLowerCase();
    let platform = 'unknown';
    if (normalized.includes('uber')) platform = 'uber';
    else if (normalized.includes('lyft')) platform = 'lyft';
    else if (normalized.includes('taxi')) platform = 'taxi';
    const extractAmount = (patterns) => {
      for (const p of patterns) {
        const m = text.match(p);
        if (m) return parseFloat(m[1].replace(/,/g, '')) || 0;
      }
      return 0;
    };
    const grossFares = extractAmount([/(?:gross|brut|fares?|courses?)[:\s]*\$?([\d,]+\.?\d*)/i]);
    const tips = extractAmount([/(?:tips?|pourboires?)[:\s]*\$?([\d,]+\.?\d*)/i]);
    const fees = extractAmount([/(?:fees?|frais|commission)[:\s]*\$?([\d,]+\.?\d*)/i]);
    let netIncome = extractAmount([/(?:net|payout|dépôt|deposit)[:\s]*\$?([\d,]+\.?\d*)/i]);
    if (netIncome === 0 && grossFares > 0) netIncome = grossFares + tips - fees;
    return {
      grossFares: Math.round(grossFares * 100) / 100,
      tips: Math.round(tips * 100) / 100,
      fees: Math.round(fees * 100) / 100,
      netIncome: Math.round(netIncome * 100) / 100,
      platform,
      isValid: grossFares > 0 || netIncome > 0,
    };
  }

  const TAX_BRACKETS = [
    { max: 51268, rate: 0.2885 },
    { max: 57965, rate: 0.3325 },
    { max: 110972, rate: 0.4375 },
    { max: 165430, rate: 0.5125 },
    { max: 235430, rate: 0.5825 },
    { max: Infinity, rate: 0.6625 },
  ];

  const DriverCalculator = {
    calculateSimplifiedVehicle,
    calculateDetailedVehicle,
    compareVehicleMethods,
    MILEAGE_RATES,
    calculateSelfEmploymentTax,
    SELF_EMPLOYMENT_RATES,
    calculateQuarterlyInstallments,
    calculateLatePenalty,
    QUARTERLY_DUE_DATES,
    parsePlatformStatement,
    TAX_BRACKETS,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = DriverCalculator;
  if (typeof window !== 'undefined') window.DriverCalculator = DriverCalculator;
})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : this);
