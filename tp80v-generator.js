// tp80v-generator.js — TP-80-V Form Generator for Quebec Self-Employed
// Quebec equivalent of T2125 with FSS and QPP calculations

/**
 * Constants for 2026 tax year - Quebec
 */
export const FSS_TIER_2_THRESHOLD = 5000;
export const FSS_TIER_2_RATE = 0.0165;
export const FSS_TIER_3_THRESHOLD = 58515;
export const FSS_TIER_3_RATE = 0.0426;
export const QPP_CONTRIBUTION_RATE = 0.138;
export const QPP_BASIC_EXEMPTION = 3500;
export const QPP_MAX_PENSIONABLE_EARNINGS = 73200;

/**
 * Calculate Health Services Fund (FSS) contribution
 * 
 * @param {number} netBusinessIncome - Net business income before FSS
 * @returns {Object} FSS calculation breakdown
 */
export function calculateFSS(netBusinessIncome) {
  if (typeof netBusinessIncome !== 'number') {
    throw new Error('Invalid net business income: must be a number');
  }

  // FSS only applies to positive income
  if (netBusinessIncome <= 0) {
    return {
      netBusinessIncome: Math.round(netBusinessIncome * 100) / 100,
      tier1Amount: 0,
      tier1Rate: 0,
      tier1FSS: 0,
      tier2Amount: 0,
      tier2Rate: 0,
      tier2FSS: 0,
      tier3Amount: 0,
      tier3Rate: 0,
      tier3FSS: 0,
      totalFSS: 0
    };
  }

  let tier1Amount = 0;
  let tier2Amount = 0;
  let tier3Amount = 0;

  // Tier 1: $0 - $5,000 (0%)
  tier1Amount = Math.min(netBusinessIncome, FSS_TIER_2_THRESHOLD);

  // Tier 2: $5,001 - $58,515 (1.65%)
  if (netBusinessIncome > FSS_TIER_2_THRESHOLD) {
    tier2Amount = Math.min(
      netBusinessIncome - FSS_TIER_2_THRESHOLD,
      FSS_TIER_3_THRESHOLD - FSS_TIER_2_THRESHOLD
    );
  }

  // Tier 3: Over $58,515 (4.26%)
  if (netBusinessIncome > FSS_TIER_3_THRESHOLD) {
    tier3Amount = netBusinessIncome - FSS_TIER_3_THRESHOLD;
  }

  const tier1FSS = 0; // 0% rate
  const tier2FSS = tier2Amount * FSS_TIER_2_RATE;
  const tier3FSS = tier3Amount * FSS_TIER_3_RATE;
  const totalFSS = tier1FSS + tier2FSS + tier3FSS;

  return {
    netBusinessIncome: Math.round(netBusinessIncome * 100) / 100,
    tier1Amount: Math.round(tier1Amount * 100) / 100,
    tier1Rate: 0,
    tier1FSS: Math.round(tier1FSS * 100) / 100,
    tier2Amount: Math.round(tier2Amount * 100) / 100,
    tier2Rate: FSS_TIER_2_RATE,
    tier2FSS: Math.round(tier2FSS * 100) / 100,
    tier3Amount: Math.round(tier3Amount * 100) / 100,
    tier3Rate: FSS_TIER_3_RATE,
    tier3FSS: Math.round(tier3FSS * 100) / 100,
    totalFSS: Math.round(totalFSS * 100) / 100
  };
}

/**
 * Calculate Quebec Pension Plan (QPP) contributions for self-employed
 * 
 * @param {number} netBusinessIncome - Net business income after FSS deduction
 * @returns {Object} QPP contribution calculation
 */
export function calculateQPPContributions(netBusinessIncome) {
  if (typeof netBusinessIncome !== 'number') {
    throw new Error('Invalid net business income: must be a number');
  }

  // QPP only applies to positive income above basic exemption
  if (netBusinessIncome <= QPP_BASIC_EXEMPTION) {
    return {
      netBusinessIncome: Math.round(netBusinessIncome * 100) / 100,
      basicExemption: QPP_BASIC_EXEMPTION,
      pensionableEarnings: 0,
      maxPensionableEarnings: QPP_MAX_PENSIONABLE_EARNINGS,
      contributionRate: QPP_CONTRIBUTION_RATE,
      totalContributions: 0,
      employeeContributions: 0,
      employerContributions: 0,
      deductibleAmount: 0
    };
  }

  // Calculate pensionable earnings (income - basic exemption)
  const pensionableEarnings = Math.min(
    netBusinessIncome - QPP_BASIC_EXEMPTION,
    QPP_MAX_PENSIONABLE_EARNINGS - QPP_BASIC_EXEMPTION
  );

  // Total contributions (employee + employer portions)
  const totalContributions = pensionableEarnings * QPP_CONTRIBUTION_RATE;
  
  // Split into employee (6.9%) and employer (6.9%) portions
  const employeeContributions = pensionableEarnings * (QPP_CONTRIBUTION_RATE / 2);
  const employerContributions = pensionableEarnings * (QPP_CONTRIBUTION_RATE / 2);

  // Employer portion is deductible
  const deductibleAmount = employerContributions;

  return {
    netBusinessIncome: Math.round(netBusinessIncome * 100) / 100,
    basicExemption: QPP_BASIC_EXEMPTION,
    pensionableEarnings: Math.round(pensionableEarnings * 100) / 100,
    maxPensionableEarnings: QPP_MAX_PENSIONABLE_EARNINGS,
    contributionRate: QPP_CONTRIBUTION_RATE,
    totalContributions: Math.round(totalContributions * 100) / 100,
    employeeContributions: Math.round(employeeContributions * 100) / 100,
    employerContributions: Math.round(employerContributions * 100) / 100,
    deductibleAmount: Math.round(deductibleAmount * 100) / 100
  };
}

/**
 * Calculate TP-80-V form data from business income and expenses
 * 
 * @param {Object} businessData - Same structure as T2125
 * @returns {Object} TP-80-V calculation object
 */
export function calculateTP80V(businessData) {
  if (!businessData || typeof businessData !== 'object') {
    throw new Error('Invalid business data: must be an object');
  }

  // Extract income
  const grossFares = Number(businessData.grossFares) || 0;
  const commissions = Number(businessData.commissions) || 0;
  const otherIncome = Number(businessData.otherIncome) || 0;

  if (grossFares < 0) {
    throw new Error('Invalid gross fares: must be non-negative');
  }

  // Calculate gross income
  const grossIncome = Math.round((grossFares + commissions + otherIncome) * 100) / 100;

  // Extract and validate expenses
  const expenses = businessData.expenses || {};
  const expenseBreakdown = {
    advertising: Math.max(0, Number(expenses.advertising) || 0),
    insurance: Math.max(0, Number(expenses.insurance) || 0),
    maintenance: Math.max(0, Number(expenses.maintenance) || 0),
    office: Math.max(0, Number(expenses.office) || 0),
    supplies: Math.max(0, Number(expenses.supplies) || 0),
    telephone: Math.max(0, Number(expenses.telephone) || 0),
    fuel: Math.max(0, Number(expenses.fuel) || 0),
    vehicle: Math.max(0, Number(expenses.vehicle) || 0),
    licenses: Math.max(0, Number(expenses.licenses) || 0),
    cca: Math.max(0, Number(expenses.cca) || 0)
  };

  // Calculate total expenses
  const totalExpenses = Math.round(
    Object.values(expenseBreakdown).reduce((sum, expense) => sum + expense, 0) * 100
  ) / 100;

  // Net income before FSS
  const netIncomeBeforeFSS = Math.round((grossIncome - totalExpenses) * 100) / 100;

  // Calculate FSS
  const fssCalculation = calculateFSS(netIncomeBeforeFSS);

  // Net income after FSS deduction (FSS is deductible)
  const netIncomeAfterFSS = Math.round((netIncomeBeforeFSS - fssCalculation.totalFSS) * 100) / 100;

  // Calculate QPP
  const qppCalculation = calculateQPPContributions(netIncomeAfterFSS);

  // Final net income (after FSS, but employer QPP is also deductible)
  const netIncome = Math.round((netIncomeAfterFSS - qppCalculation.deductibleAmount) * 100) / 100;

  return {
    income: {
      grossFares: Math.round(grossFares * 100) / 100,
      commissions: Math.round(commissions * 100) / 100,
      otherIncome: Math.round(otherIncome * 100) / 100,
      grossIncome
    },
    expenses: {
      advertising: Math.round(expenseBreakdown.advertising * 100) / 100,
      insurance: Math.round(expenseBreakdown.insurance * 100) / 100,
      maintenance: Math.round(expenseBreakdown.maintenance * 100) / 100,
      office: Math.round(expenseBreakdown.office * 100) / 100,
      supplies: Math.round(expenseBreakdown.supplies * 100) / 100,
      telephone: Math.round(expenseBreakdown.telephone * 100) / 100,
      fuel: Math.round(expenseBreakdown.fuel * 100) / 100,
      vehicle: Math.round(expenseBreakdown.vehicle * 100) / 100,
      licenses: Math.round(expenseBreakdown.licenses * 100) / 100,
      cca: Math.round(expenseBreakdown.cca * 100) / 100,
      totalExpenses
    },
    netIncomeBeforeFSS,
    fss: fssCalculation,
    netIncomeAfterFSS,
    qpp: qppCalculation,
    netIncome
  };
}

/**
 * Generate complete TP-80-V form with driver information
 * 
 * @param {Object} driverInfo - Driver personal information
 * @param {Object} businessData - Business income and expense data
 * @param {string} language - 'fr' or 'en' for French/English
 * @returns {Object} Complete TP-80-V form data
 */
export function generateTP80VForm(driverInfo, businessData, language = 'fr') {
  // Validate inputs
  if (!driverInfo || typeof driverInfo !== 'object') {
    throw new Error('Invalid driver info: must be an object');
  }

  if (!driverInfo.name || typeof driverInfo.name !== 'string') {
    throw new Error('Invalid driver name: required string');
  }

  if (!['fr', 'en'].includes(language)) {
    throw new Error('Invalid language: must be "fr" or "en"');
  }

  // Calculate TP-80-V values
  const calculation = calculateTP80V(businessData);

  // Generate form
  return {
    formType: 'TP-80-V',
    language,
    driverInfo: {
      name: driverInfo.name,
      nas: driverInfo.nas || driverInfo.sin || '',
      address: driverInfo.address || '',
      fiscalYear: driverInfo.fiscalYear || new Date().getFullYear()
    },
    businessActivity: language === 'fr' ? 'Chauffeur de covoiturage/taxi' : 'Rideshare/Taxi Driver',
    ...calculation,
    generatedDate: new Date().toISOString()
  };
}

/**
 * Export TP-80-V form as printable text format
 * 
 * @param {Object} formData - Complete TP-80-V form data
 * @returns {string} Printable text representation
 */
export function exportTP80VAsText(formData) {
  if (!formData || typeof formData !== 'object') {
    throw new Error('Invalid form data');
  }

  const lang = formData.language || 'fr';
  const lines = [];
  
  // Labels in French/English
  const labels = {
    fr: {
      title: 'REVENU QUÉBEC',
      formTitle: 'TP-80-V - ÉTAT DES RÉSULTATS DES ACTIVITÉS D\'UNE ENTREPRISE',
      driverInfo: 'INFORMATION DU CHAUFFEUR:',
      name: 'Nom',
      nas: 'NAS',
      address: 'Adresse',
      fiscalYear: 'Année fiscale',
      businessActivity: 'Activité commerciale',
      income: 'REVENU:',
      grossFares: 'Revenus bruts (courses)',
      commissions: 'Commissions plateforme',
      otherIncome: 'Autres revenus',
      grossIncome: 'REVENU BRUT',
      expenses: 'DÉPENSES:',
      advertising: 'Publicité',
      insurance: 'Assurance',
      maintenance: 'Entretien et réparations',
      office: 'Fournitures de bureau',
      supplies: 'Fournitures',
      telephone: 'Téléphone et Internet',
      fuel: 'Essence',
      vehicle: 'Frais de véhicule',
      licenses: 'Permis et licences',
      cca: 'Amortissement (DPA)',
      totalExpenses: 'TOTAL DES DÉPENSES',
      netIncomeBeforeFSS: 'REVENU NET AVANT FSS',
      fss: 'FONDS DES SERVICES DE SANTÉ (FSS):',
      tier1: 'Palier 1 (0$ - 5 000$)',
      tier2: 'Palier 2 (5 001$ - 58 515$)',
      tier3: 'Palier 3 (Plus de 58 515$)',
      rate: 'Taux',
      amount: 'Montant',
      totalFSS: 'TOTAL FSS',
      netIncomeAfterFSS: 'REVENU NET APRÈS FSS',
      qpp: 'RÉGIME DE RENTES DU QUÉBEC (RRQ):',
      basicExemption: 'Exemption de base',
      pensionableEarnings: 'Gains cotisables',
      contributionRate: 'Taux de cotisation',
      totalContributions: 'Cotisations totales',
      employeeContributions: 'Cotisations employé',
      employerContributions: 'Cotisations employeur (déductible)',
      netIncome: 'REVENU NET D\'ENTREPRISE',
      generated: 'Généré'
    },
    en: {
      title: 'REVENU QUÉBEC',
      formTitle: 'TP-80-V - STATEMENT OF BUSINESS ACTIVITIES',
      driverInfo: 'DRIVER INFORMATION:',
      name: 'Name',
      nas: 'SIN',
      address: 'Address',
      fiscalYear: 'Fiscal Year',
      businessActivity: 'Business Activity',
      income: 'INCOME:',
      grossFares: 'Gross Fares',
      commissions: 'Platform Commissions',
      otherIncome: 'Other Income',
      grossIncome: 'GROSS INCOME',
      expenses: 'EXPENSES:',
      advertising: 'Advertising',
      insurance: 'Insurance',
      maintenance: 'Maintenance and Repairs',
      office: 'Office Supplies',
      supplies: 'Supplies',
      telephone: 'Telephone and Internet',
      fuel: 'Fuel',
      vehicle: 'Vehicle Expenses',
      licenses: 'Licenses and Permits',
      cca: 'Capital Cost Allowance',
      totalExpenses: 'TOTAL EXPENSES',
      netIncomeBeforeFSS: 'NET INCOME BEFORE HSF',
      fss: 'HEALTH SERVICES FUND (HSF):',
      tier1: 'Tier 1 ($0 - $5,000)',
      tier2: 'Tier 2 ($5,001 - $58,515)',
      tier3: 'Tier 3 (Over $58,515)',
      rate: 'Rate',
      amount: 'Amount',
      totalFSS: 'TOTAL HSF',
      netIncomeAfterFSS: 'NET INCOME AFTER HSF',
      qpp: 'QUEBEC PENSION PLAN (QPP):',
      basicExemption: 'Basic Exemption',
      pensionableEarnings: 'Pensionable Earnings',
      contributionRate: 'Contribution Rate',
      totalContributions: 'Total Contributions',
      employeeContributions: 'Employee Contributions',
      employerContributions: 'Employer Contributions (deductible)',
      netIncome: 'NET BUSINESS INCOME',
      generated: 'Generated'
    }
  };

  const t = labels[lang];
  
  lines.push('='.repeat(70));
  lines.push(t.title);
  lines.push(t.formTitle);
  lines.push('='.repeat(70));
  lines.push('');
  
  // Driver information
  lines.push(t.driverInfo);
  lines.push(`${t.name}: ${formData.driverInfo?.name || 'N/A'}`);
  lines.push(`${t.nas}: ${formData.driverInfo?.nas || 'N/A'}`);
  lines.push(`${t.address}: ${formData.driverInfo?.address || 'N/A'}`);
  lines.push(`${t.fiscalYear}: ${formData.driverInfo?.fiscalYear || 'N/A'}`);
  lines.push(`${t.businessActivity}: ${formData.businessActivity || 'N/A'}`);
  lines.push('');
  
  // Income section
  lines.push('-'.repeat(70));
  lines.push(t.income);
  lines.push('-'.repeat(70));
  lines.push(`${t.grossFares.padEnd(50)} $${(formData.income?.grossFares || 0).toFixed(2).padStart(12)}`);
  lines.push(`${t.commissions.padEnd(50)} $${(formData.income?.commissions || 0).toFixed(2).padStart(12)}`);
  lines.push(`${t.otherIncome.padEnd(50)} $${(formData.income?.otherIncome || 0).toFixed(2).padStart(12)}`);
  lines.push(`${''.padStart(58, '-')}`);
  lines.push(`${t.grossIncome.padEnd(50)} $${(formData.income?.grossIncome || 0).toFixed(2).padStart(12)}`);
  lines.push('');
  
  // Expenses section
  lines.push('-'.repeat(70));
  lines.push(t.expenses);
  lines.push('-'.repeat(70));
  lines.push(`${t.advertising.padEnd(50)} $${(formData.expenses?.advertising || 0).toFixed(2).padStart(12)}`);
  lines.push(`${t.insurance.padEnd(50)} $${(formData.expenses?.insurance || 0).toFixed(2).padStart(12)}`);
  lines.push(`${t.maintenance.padEnd(50)} $${(formData.expenses?.maintenance || 0).toFixed(2).padStart(12)}`);
  lines.push(`${t.office.padEnd(50)} $${(formData.expenses?.office || 0).toFixed(2).padStart(12)}`);
  lines.push(`${t.supplies.padEnd(50)} $${(formData.expenses?.supplies || 0).toFixed(2).padStart(12)}`);
  lines.push(`${t.telephone.padEnd(50)} $${(formData.expenses?.telephone || 0).toFixed(2).padStart(12)}`);
  lines.push(`${t.fuel.padEnd(50)} $${(formData.expenses?.fuel || 0).toFixed(2).padStart(12)}`);
  lines.push(`${t.vehicle.padEnd(50)} $${(formData.expenses?.vehicle || 0).toFixed(2).padStart(12)}`);
  lines.push(`${t.licenses.padEnd(50)} $${(formData.expenses?.licenses || 0).toFixed(2).padStart(12)}`);
  lines.push(`${t.cca.padEnd(50)} $${(formData.expenses?.cca || 0).toFixed(2).padStart(12)}`);
  lines.push(`${''.padStart(58, '-')}`);
  lines.push(`${t.totalExpenses.padEnd(50)} $${(formData.expenses?.totalExpenses || 0).toFixed(2).padStart(12)}`);
  lines.push('');
  lines.push(`${t.netIncomeBeforeFSS.padEnd(50)} $${(formData.netIncomeBeforeFSS || 0).toFixed(2).padStart(12)}`);
  lines.push('');
  
  // FSS section
  lines.push('-'.repeat(70));
  lines.push(t.fss);
  lines.push('-'.repeat(70));
  const fss = formData.fss || {};
  lines.push(`${t.tier1} @ 0%:                       $${(fss.tier1FSS || 0).toFixed(2).padStart(12)}`);
  lines.push(`${t.tier2} @ 1.65%:                $${(fss.tier2FSS || 0).toFixed(2).padStart(12)}`);
  lines.push(`${t.tier3} @ 4.26%:            $${(fss.tier3FSS || 0).toFixed(2).padStart(12)}`);
  lines.push(`${''.padStart(58, '-')}`);
  lines.push(`${t.totalFSS.padEnd(50)} $${(fss.totalFSS || 0).toFixed(2).padStart(12)}`);
  lines.push('');
  lines.push(`${t.netIncomeAfterFSS.padEnd(50)} $${(formData.netIncomeAfterFSS || 0).toFixed(2).padStart(12)}`);
  lines.push('');
  
  // QPP section
  lines.push('-'.repeat(70));
  lines.push(t.qpp);
  lines.push('-'.repeat(70));
  const qpp = formData.qpp || {};
  lines.push(`${t.basicExemption.padEnd(50)} $${(qpp.basicExemption || 0).toFixed(2).padStart(12)}`);
  lines.push(`${t.pensionableEarnings.padEnd(50)} $${(qpp.pensionableEarnings || 0).toFixed(2).padStart(12)}`);
  lines.push(`${t.contributionRate} (13.8%)`);
  lines.push(`${t.totalContributions.padEnd(50)} $${(qpp.totalContributions || 0).toFixed(2).padStart(12)}`);
  lines.push(`${t.employeeContributions.padEnd(50)} $${(qpp.employeeContributions || 0).toFixed(2).padStart(12)}`);
  lines.push(`${t.employerContributions.padEnd(50)} $${(qpp.employerContributions || 0).toFixed(2).padStart(12)}`);
  lines.push('');
  
  // Net income
  lines.push('='.repeat(70));
  lines.push(`${t.netIncome.padEnd(50)} $${(formData.netIncome || 0).toFixed(2).padStart(12)}`);
  lines.push('='.repeat(70));
  lines.push('');
  lines.push(`${t.generated}: ${formData.generatedDate || new Date().toISOString()}`);
  
  return lines.join('\n');
}
