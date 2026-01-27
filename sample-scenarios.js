/**
 * Sample Scenarios - Pre-built tax scenarios for TaxSyncForDrivers
 * Includes driver scenarios (with vehicle data) and other taxpayer scenarios
 * (employees, students, retirees)
 */

/**
 * Driver-specific scenarios with vehicle data
 */
const DRIVER_SCENARIOS = {
  'fulltime-uber-qc': {
    id: 'fulltime-uber-qc',
    name: {
      en: 'Full-Time Uber Driver (Quebec)',
      fr: 'Chauffeur Uber temps plein (Québec)'
    },
    description: {
      en: 'High-income Uber driver in Montreal with comprehensive expenses',
      fr: 'Chauffeur Uber à revenu élevé à Montréal avec dépenses complètes'
    },
    profile: {
      province: 'QC',
      driverType: 'Uber',
      annualIncome: 65000
    },
    vehicle: {
      cost: 28000,
      year: 2024,
      odometer: {
        start: 45000,
        end: 75000,
        businessKm: 27000,
        personalKm: 3000
      },
      businessUsePercent: 90
    },
    expenses: [
      { date: '2025-01-15', amount: 85.50, vendor: 'Shell', category: 'fuel', receipt: true },
      { date: '2025-01-20', amount: 250, vendor: 'Garage Montréal', category: 'maintenance', receipt: true },
      { date: '2025-02-01', amount: 1950, vendor: 'Desjardins Assurance', category: 'insurance', receipt: true },
      { date: '2025-02-10', amount: 95.75, vendor: 'Esso', category: 'fuel', receipt: true },
      { date: '2025-02-15', amount: 45, vendor: 'Lave-Auto Express', category: 'car-wash', receipt: false },
      { date: '2025-03-01', amount: 120, vendor: 'Canadian Tire', category: 'maintenance', receipt: true },
      { date: '2025-03-08', amount: 78.25, vendor: 'Petro-Canada', category: 'fuel', receipt: true },
      { date: '2025-03-15', amount: 350, vendor: 'Garage St-Laurent', category: 'repairs', receipt: true },
      { date: '2025-04-01', amount: 89.50, vendor: 'Shell', category: 'fuel', receipt: true },
      { date: '2025-04-12', amount: 175, vendor: 'Pneus Laval', category: 'tires', receipt: true },
      { date: '2025-04-20', amount: 65, vendor: 'Lave-Auto', category: 'car-wash', receipt: false },
      { date: '2025-05-05', amount: 92.30, vendor: 'Ultramar', category: 'fuel', receipt: true },
      { date: '2025-05-18', amount: 85, vendor: 'Canadian Tire', category: 'oil-change', receipt: true },
      { date: '2025-06-01', amount: 1950, vendor: 'Desjardins Assurance', category: 'insurance', receipt: true },
      { date: '2025-06-10', amount: 88.75, vendor: 'Shell', category: 'fuel', receipt: true }
    ],
    income: [
      { platform: 'Uber', period: 'Q1 2025', gross: 18000, tips: 1200, fees: 4500 },
      { platform: 'Uber', period: 'Q2 2025', gross: 16500, tips: 1100, fees: 4100 }
    ]
  },
  
  'parttime-lyft-on': {
    id: 'parttime-lyft-on',
    name: {
      en: 'Part-Time Lyft Driver (Ontario)',
      fr: 'Chauffeur Lyft temps partiel (Ontario)'
    },
    description: {
      en: 'Weekend driver in Toronto supplementing regular income',
      fr: 'Chauffeur de fin de semaine à Toronto complétant un revenu régulier'
    },
    profile: {
      province: 'ON',
      driverType: 'Lyft',
      annualIncome: 25000
    },
    vehicle: {
      cost: 22000,
      year: 2023,
      odometer: {
        start: 32000,
        end: 42000,
        businessKm: 7000,
        personalKm: 3000
      },
      businessUsePercent: 70
    },
    expenses: [
      { date: '2025-01-12', amount: 65.50, vendor: 'Petro-Canada', category: 'fuel', receipt: false },
      { date: '2025-01-25', amount: 450, vendor: 'Aviva Insurance', category: 'insurance', receipt: true },
      { date: '2025-02-08', amount: 58.25, vendor: 'Shell', category: 'fuel', receipt: false },
      { date: '2025-02-20', amount: 80, vendor: 'Mr. Lube', category: 'oil-change', receipt: true },
      { date: '2025-03-10', amount: 70.00, vendor: 'Esso', category: 'fuel', receipt: false },
      { date: '2025-03-22', amount: 125, vendor: 'Canadian Tire', category: 'maintenance', receipt: true },
      { date: '2025-04-05', amount: 62.75, vendor: 'Petro-Canada', category: 'fuel', receipt: false },
      { date: '2025-04-15', amount: 450, vendor: 'Aviva Insurance', category: 'insurance', receipt: true },
      { date: '2025-05-02', amount: 68.50, vendor: 'Shell', category: 'fuel', receipt: false },
      { date: '2025-05-20', amount: 95, vendor: 'Jiffy Lube', category: 'oil-change', receipt: true }
    ],
    income: [
      { platform: 'Lyft', period: 'Q1 2025', gross: 6800, tips: 420, fees: 1700 },
      { platform: 'Lyft', period: 'Q2 2025', gross: 6200, tips: 380, fees: 1550 }
    ]
  },
  
  'multiplatform-taxi-ab': {
    id: 'multiplatform-taxi-ab',
    name: {
      en: 'Multi-Platform Taxi Driver (Alberta)',
      fr: 'Chauffeur taxi multi-plateformes (Alberta)'
    },
    description: {
      en: 'Calgary driver using Uber, Lyft and traditional taxi service',
      fr: 'Chauffeur de Calgary utilisant Uber, Lyft et service de taxi traditionnel'
    },
    profile: {
      province: 'AB',
      driverType: 'multiple',
      annualIncome: 55000
    },
    vehicle: {
      cost: 32000,
      year: 2024,
      odometer: {
        start: 28000,
        end: 58000,
        businessKm: 26000,
        personalKm: 4000
      },
      businessUsePercent: 87
    },
    expenses: [
      { date: '2025-01-08', amount: 92.50, vendor: 'Husky', category: 'fuel', receipt: true },
      { date: '2025-01-15', amount: 1850, vendor: 'Intact Insurance', category: 'insurance', receipt: true },
      { date: '2025-01-22', amount: 85.75, vendor: 'Shell', category: 'fuel', receipt: true },
      { date: '2025-02-05', amount: 280, vendor: 'Calgary Auto Repair', category: 'maintenance', receipt: true },
      { date: '2025-02-12', amount: 88.25, vendor: 'Co-op', category: 'fuel', receipt: true },
      { date: '2025-02-28', amount: 95, vendor: 'Quick Lube', category: 'oil-change', receipt: true },
      { date: '2025-03-10', amount: 90.50, vendor: 'Petro-Canada', category: 'fuel', receipt: true },
      { date: '2025-03-18', amount: 450, vendor: 'Calgary Tire', category: 'tires', receipt: true },
      { date: '2025-04-02', amount: 87.75, vendor: 'Shell', category: 'fuel', receipt: true },
      { date: '2025-04-15', amount: 1850, vendor: 'Intact Insurance', category: 'insurance', receipt: true },
      { date: '2025-04-25', amount: 92.00, vendor: 'Husky', category: 'fuel', receipt: true },
      { date: '2025-05-08', amount: 180, vendor: 'Calgary Auto Repair', category: 'maintenance', receipt: true },
      { date: '2025-05-15', amount: 89.50, vendor: 'Co-op', category: 'fuel', receipt: true },
      { date: '2025-05-28', amount: 65, vendor: 'Car Wash Plus', category: 'car-wash', receipt: false },
      { date: '2025-06-05', amount: 91.25, vendor: 'Petro-Canada', category: 'fuel', receipt: true }
    ],
    income: [
      { platform: 'Uber', period: 'Q1 2025', gross: 9500, tips: 650, fees: 2375 },
      { platform: 'Lyft', period: 'Q1 2025', gross: 5200, tips: 380, fees: 1300 },
      { platform: 'Taxi', period: 'Q1 2025', gross: 8500, tips: 720, fees: 850 },
      { platform: 'Uber', period: 'Q2 2025', gross: 8800, tips: 590, fees: 2200 },
      { platform: 'Lyft', period: 'Q2 2025', gross: 4800, tips: 340, fees: 1200 },
      { platform: 'Taxi', period: 'Q2 2025', gross: 7900, tips: 680, fees: 790 }
    ]
  }
};

/**
 * Non-driver scenarios (employees, students, retirees)
 */
const OTHER_SCENARIOS = {
  'student-parttime-qc': {
    id: 'student-parttime-qc',
    name: {
      en: 'Part-Time Student (Quebec)',
      fr: 'Étudiant temps partiel (Québec)'
    },
    description: {
      en: 'University student in Montreal with part-time job and tuition credits',
      fr: 'Étudiant universitaire à Montréal avec emploi à temps partiel et crédits de scolarité'
    },
    profile: {
      province: 'QC',
      userType: 'student',
      annualIncome: 18000,
      tuitionFees: 7500,
      isFullTimeStudent: false,
    },
    income: [
      { type: 'T4', employer: 'Tim Hortons', gross: 18000, incomeTax: 800, cpp: 920, ei: 290 }
    ],
    deductions: [
      { type: 'tuition', amount: 7500, description: 'University of Montreal - Fall/Winter 2025' },
      { type: 'studentLoanInterest', amount: 450, description: 'Student loan interest paid' },
    ]
  },

  'employee-t4-on': {
    id: 'employee-t4-on',
    name: {
      en: 'Employee with RRSP (Ontario)',
      fr: 'Employé avec REER (Ontario)'
    },
    description: {
      en: 'Office worker in Toronto with T4 income, RRSP, and charitable donations',
      fr: 'Travailleur de bureau à Toronto avec revenu T4, REER et dons de charité'
    },
    profile: {
      province: 'ON',
      userType: 'employee',
      annualIncome: 75000,
    },
    income: [
      { type: 'T4', employer: 'TechCorp Inc.', gross: 75000, incomeTax: 12500, cpp: 3867, ei: 953 }
    ],
    deductions: [
      { type: 'rrsp', amount: 13500, description: 'RRSP contribution (18% limit)' },
      { type: 'charitableDonations', amount: 2000, description: 'United Way, Red Cross' },
      { type: 'unionDues', amount: 850, description: 'Professional association dues' },
    ]
  },

  'retiree-pension-bc': {
    id: 'retiree-pension-bc',
    name: {
      en: 'Retiree with Pension (BC)',
      fr: 'Retraité avec pension (CB)'
    },
    description: {
      en: 'Retired couple in Victoria with pension income and medical expenses',
      fr: 'Couple retraité à Victoria avec revenu de pension et frais médicaux'
    },
    profile: {
      province: 'BC',
      userType: 'retiree',
      annualIncome: 52000,
      age: 68,
      isMarried: true,
    },
    income: [
      { type: 'T4A', payer: 'Federal Pension', pension: 28000, incomeTax: 3200 },
      { type: 'T4A', payer: 'CPP', pension: 14000, incomeTax: 0 },
      { type: 'T4A', payer: 'Old Age Security', pension: 10000, incomeTax: 0 },
    ],
    deductions: [
      { type: 'medicalExpenses', amount: 8500, description: 'Prescription drugs, dental, physiotherapy' },
      { type: 'pensionIncomeSplitting', amount: 14000, description: 'Split eligible pension with spouse' },
      { type: 'ageAmount', eligible: true, description: 'Age 65+ credit' },
    ]
  },

  'mixed-income-ab': {
    id: 'mixed-income-ab',
    name: {
      en: 'Mixed Income (Alberta)',
      fr: 'Revenus mixtes (Alberta)'
    },
    description: {
      en: 'Calgary worker with full-time job plus freelance consulting',
      fr: 'Travailleur de Calgary avec emploi à temps plein et consultation indépendante'
    },
    profile: {
      province: 'AB',
      userType: 'mixed',
      annualIncome: 95000,
    },
    income: [
      { type: 'T4', employer: 'Energy Corp', gross: 70000, incomeTax: 14000, cpp: 3867, ei: 953 },
      { type: 'T4A', payer: 'Consulting Clients', feesForServices: 25000, incomeTax: 0 },
    ],
    expenses: [
      { date: '2025-01-15', amount: 850, vendor: 'Office Depot', category: 'office-supplies', receipt: true },
      { date: '2025-02-01', amount: 120, vendor: 'Telus', category: 'phone', receipt: true },
      { date: '2025-02-15', amount: 200, vendor: 'Professional Development', category: 'training', receipt: true },
      { date: '2025-03-10', amount: 450, vendor: 'Home Office Furniture', category: 'equipment', receipt: true },
    ],
    deductions: [
      { type: 'homeOffice', amount: 2400, description: 'Home office expenses (200 sq ft)' },
      { type: 'professionalFees', amount: 850, description: 'CPA membership, industry certifications' },
    ]
  }
};

/**
 * All scenarios combined (driver + other)
 */
const SAMPLE_SCENARIOS = {
  ...DRIVER_SCENARIOS,
  ...OTHER_SCENARIOS
};

/**
 * Load a sample scenario into the application
 * @param {string} scenarioId - ID of the scenario to load
 * @param {string} language - Current language ('en' or 'fr')
 */
function loadSampleScenario(scenarioId, language = 'fr') {
  const scenario = SAMPLE_SCENARIOS[scenarioId];
  if (!scenario) {
    console.error('Scenario not found:', scenarioId);
    return;
  }
  
  // Confirm with user before loading
  const confirmMessage = language === 'en' 
    ? `Load sample scenario: "${scenario.name.en}"?\n\nThis will populate the form with sample data for demonstration purposes.`
    : `Charger le scénario d'exemple: "${scenario.name.fr}"?\n\nCeci remplira le formulaire avec des données d'exemple à des fins de démonstration.`;
    
  if (!confirm(confirmMessage)) {
    return;
  }
  
  // Load profile data
  if (scenario.profile) {
    const provinceSelect = document.getElementById('provinceSelect');
    if (provinceSelect && scenario.profile.province) {
      provinceSelect.value = scenario.profile.province;
      // Trigger change event to update province-specific features
      provinceSelect.dispatchEvent(new Event('change'));
    }
  }
  
  // Load vehicle data
  if (scenario.vehicle) {
    const totalKmInput = document.getElementById('totalKm');
    const businessPercentInput = document.getElementById('businessPercent');
    
    if (totalKmInput && scenario.vehicle.odometer) {
      const totalKm = scenario.vehicle.odometer.businessKm + scenario.vehicle.odometer.personalKm;
      totalKmInput.value = totalKm;
    }
    
    if (businessPercentInput && scenario.vehicle.businessUsePercent) {
      businessPercentInput.value = scenario.vehicle.businessUsePercent;
    }
  }
  
  // Load sample expenses as description
  if (scenario.expenses && scenario.expenses.length > 0) {
    let expenseSummary = language === 'en' 
      ? `Sample expenses loaded (${scenario.expenses.length} items):\n\n`
      : `Dépenses d'exemple chargées (${scenario.expenses.length} articles):\n\n`;
    
    const totalExpenses = scenario.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    expenseSummary += scenario.expenses.slice(0, 5).map(exp => 
      `${exp.date}: ${exp.vendor} - $${exp.amount.toFixed(2)} (${exp.category})`
    ).join('\n');
    
    expenseSummary += `\n... (${scenario.expenses.length - 5} more)\n`;
    expenseSummary += `\nTotal: $${totalExpenses.toFixed(2)}`;
    
    // Display in console or alert
    console.log(expenseSummary);
  }
  
  // Load sample income
  if (scenario.income && scenario.income.length > 0) {
    let incomeSummary = language === 'en'
      ? `\nSample income loaded (${scenario.income.length} periods):\n\n`
      : `\nRevenus d'exemple chargés (${scenario.income.length} périodes):\n\n`;
    
    // Check if this is a driver scenario (has platform property) or other scenario
    const isDriverScenario = scenario.income[0].platform !== undefined;
    
    if (isDriverScenario) {
      const totalGross = scenario.income.reduce((sum, inc) => sum + (inc.gross || 0), 0);
      const totalTips = scenario.income.reduce((sum, inc) => sum + (inc.tips || 0), 0);
      const totalFees = scenario.income.reduce((sum, inc) => sum + (inc.fees || 0), 0);
      
      incomeSummary += scenario.income.map(inc =>
        `${inc.platform} (${inc.period}): $${inc.gross.toLocaleString()} gross, $${inc.tips.toLocaleString()} tips, -$${inc.fees.toLocaleString()} fees`
      ).join('\n');
      
      incomeSummary += `\n\nTotal Gross: $${totalGross.toLocaleString()}`;
      incomeSummary += `\nTotal Tips: $${totalTips.toLocaleString()}`;
      incomeSummary += `\nTotal Fees: -$${totalFees.toLocaleString()}`;
      incomeSummary += `\nNet Income: $${(totalGross + totalTips - totalFees).toLocaleString()}`;
    } else {
      // Non-driver scenario (employee, student, retiree)
      incomeSummary += scenario.income.map(inc => {
        if (inc.type === 'T4') {
          return `${inc.employer}: $${inc.gross.toLocaleString()} (T4)`;
        } else if (inc.type === 'T4A' && inc.pension) {
          return `${inc.payer}: $${inc.pension.toLocaleString()} (Pension)`;
        } else if (inc.type === 'T4A' && inc.feesForServices) {
          return `${inc.payer}: $${inc.feesForServices.toLocaleString()} (Consulting)`;
        }
        return JSON.stringify(inc);
      }).join('\n');
    }
    
    console.log(incomeSummary);
  }
  
  // Show success message
  const successMessage = language === 'en'
    ? `✅ Scenario "${scenario.name.en}" loaded successfully!\n\nCheck the console for detailed data or scroll down to see the populated fields.`
    : `✅ Scénario "${scenario.name.fr}" chargé avec succès!\n\nConsultez la console pour les données détaillées ou faites défiler pour voir les champs remplis.`;
  
  alert(successMessage);
  
  // Scroll to vehicle expenses section
  const vehicleSection = document.getElementById('vehicleExpenses');
  if (vehicleSection) {
    vehicleSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * Get list of available driver scenarios
 * Filters to return only scenarios with driverType property (excludes employees, students, etc.)
 * @param {string} language - Current language ('en' or 'fr')
 * @returns {Array} Array of driver scenario metadata
 */
function getAvailableScenarios(language = 'fr') {
  return Object.values(SAMPLE_SCENARIOS)
    .filter(scenario => scenario.profile.driverType) // Only include driver scenarios
    .map(scenario => ({
      id: scenario.id,
      name: scenario.name[language],
      description: scenario.description[language],
      province: scenario.profile.province,
      driverType: scenario.profile.driverType
    }));
}

// Initialize and export
if (typeof window !== 'undefined') {
  window.loadSampleScenario = loadSampleScenario;
  window.getAvailableScenarios = getAvailableScenarios;
  window.SAMPLE_SCENARIOS = SAMPLE_SCENARIOS;
}

export { loadSampleScenario, getAvailableScenarios, SAMPLE_SCENARIOS, DRIVER_SCENARIOS, OTHER_SCENARIOS };
