/**
 * Tooltip Helper - Tax concept tooltips for TaxSyncForDrivers
 * Provides contextual help for Canadian tax concepts
 */

const TAX_TOOLTIPS = {
  'gst-threshold': {
    en: {
      title: 'GST/HST Registration Threshold',
      content: 'You must register for GST/HST when your taxable supplies exceed $30,000 in any 4 consecutive quarters. This includes all rideshare income.',
      learnMore: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/register.html'
    },
    fr: {
      title: 'Seuil d\'inscription TPS/TVH',
      content: 'Vous devez vous inscrire à la TPS/TVH lorsque vos fournitures taxables dépassent 30 000 $ sur 4 trimestres consécutifs.',
      learnMore: 'https://www.canada.ca/fr/agence-revenu/services/impot/entreprises/sujets/tps-tvh-entreprises/inscrire.html'
    }
  },
  'business-use-90': {
    en: {
      title: 'CRA 90% Business Use Rule',
      content: 'Claiming over 90% business use triggers CRA scrutiny. Keep detailed mileage logs to support your claim.',
      learnMore: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/sole-proprietorships-partnerships/report-business-income-expenses/completing-form-t2125/motor-vehicle-expenses.html'
    },
    fr: {
      title: 'Règle ARC 90% usage professionnel',
      content: 'Réclamer plus de 90% d\'usage professionnel déclenche un examen de l\'ARC. Tenez un registre détaillé des kilomètres.',
      learnMore: 'https://www.canada.ca/fr/agence-revenu/services/impot/entreprises/sujets/entreprises-individuelles-societes-personnes/declarer-revenu-depenses-entreprise/remplir-formulaire-t2125/depenses-vehicule-automobile.html'
    }
  },
  'cca-class-10': {
    en: {
      title: 'CCA Class 10 - Vehicle Depreciation',
      content: 'Vehicles depreciate at 30% declining balance (15% first year). Luxury vehicle limit is $37,000 for 2026.',
      learnMore: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/sole-proprietorships-partnerships/report-business-income-expenses/claiming-capital-cost-allowance/classes-depreciable-property.html'
    },
    fr: {
      title: 'DPA Catégorie 10 - Dépréciation de véhicule',
      content: 'Les véhicules se déprécient à 30% dégressif (15% première année). Limite véhicule de luxe : 37 000 $ pour 2026.',
      learnMore: 'https://www.canada.ca/fr/agence-revenu/services/impot/entreprises/sujets/entreprises-individuelles-societes-personnes/declarer-revenu-depenses-entreprise/demander-deduction-amortissement/categories-biens-amortissables.html'
    }
  },
  'receipt-75-rule': {
    en: {
      title: 'CRA $75 Receipt Requirement',
      content: 'Keep receipts for all expenses over $75. For expenses under $75, you need records but not necessarily receipts.',
      learnMore: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/keeping-records/business-records.html'
    },
    fr: {
      title: 'Règle ARC reçu 75 $',
      content: 'Conservez les reçus pour toutes les dépenses de plus de 75 $. Pour les dépenses de moins de 75 $, vous avez besoin de registres mais pas nécessairement de reçus.',
      learnMore: 'https://www.canada.ca/fr/agence-revenu/services/impot/entreprises/sujets/tenir-registres/registres-entreprise.html'
    }
  },
  't2125-form': {
    en: {
      title: 'T2125 - Statement of Business Activities',
      content: 'This form is used to report business income and expenses for self-employed individuals, including rideshare drivers.',
      learnMore: 'https://www.canada.ca/en/revenue-agency/services/forms-publications/forms/t2125.html'
    },
    fr: {
      title: 'T2125 - État des résultats des activités d\'une entreprise',
      content: 'Ce formulaire est utilisé pour déclarer les revenus et dépenses d\'entreprise pour les travailleurs autonomes, y compris les chauffeurs de covoiturage.',
      learnMore: 'https://www.canada.ca/fr/agence-revenu/services/formulaires-publications/formulaires/t2125.html'
    }
  },
  'tp80v-form': {
    en: {
      title: 'TP-80-V - Quebec Self-Employment Income',
      content: 'Quebec form for reporting self-employment income, FSS (health services fund) and QPP (Quebec Pension Plan) contributions.',
      learnMore: 'https://www.revenuquebec.ca/en/businesses/income-tax-return/completing-your-income-tax-return/completing-your-income-tax-return/line-by-line-help/line-22-to-line-82/line-24/'
    },
    fr: {
      title: 'TP-80-V - Revenus de travail autonome du Québec',
      content: 'Formulaire du Québec pour déclarer les revenus de travail autonome, les cotisations au FSS (fonds des services de santé) et au RRQ (régime de rentes du Québec).',
      learnMore: 'https://www.revenuquebec.ca/fr/entreprises/impot/produire-la-declaration-de-revenus/remplir-la-declaration/aide-par-ligne/ligne-22-a-ligne-82/ligne-24/'
    }
  },
  'mileage-log': {
    en: {
      title: 'Mileage Log Requirements',
      content: 'CRA requires detailed mileage logs including date, destination, purpose, and kilometers for each trip. Apps or logbooks are acceptable.',
      learnMore: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/sole-proprietorships-partnerships/report-business-income-expenses/completing-form-t2125/motor-vehicle-expenses.html'
    },
    fr: {
      title: 'Exigences du registre de kilométrage',
      content: 'L\'ARC exige des registres détaillés de kilométrage incluant la date, la destination, le but et les kilomètres pour chaque trajet. Les applications ou carnets sont acceptables.',
      learnMore: 'https://www.canada.ca/fr/agence-revenu/services/impot/entreprises/sujets/entreprises-individuelles-societes-personnes/declarer-revenu-depenses-entreprise/remplir-formulaire-t2125/depenses-vehicule-automobile.html'
    }
  },
  'qpp-contributions': {
    en: {
      title: 'QPP Self-Employed Contributions',
      content: 'Self-employed workers in Quebec must contribute to both the employer and employee portions of QPP (Quebec Pension Plan).',
      learnMore: 'https://www.rrq.gouv.qc.ca/en/programmes/regime_rentes/regime_chiffres/Pages/regime_chiffres.aspx'
    },
    fr: {
      title: 'Cotisations RRQ travailleur autonome',
      content: 'Les travailleurs autonomes au Québec doivent cotiser à la fois la part de l\'employeur et celle de l\'employé au RRQ (Régime de rentes du Québec).',
      learnMore: 'https://www.rrq.gouv.qc.ca/fr/programmes/regime_rentes/regime_chiffres/Pages/regime_chiffres.aspx'
    }
  },
  'fss-contributions': {
    en: {
      title: 'FSS - Health Services Fund',
      content: 'Quebec self-employed workers must contribute to the Health Services Fund (FSS) based on their net business income.',
      learnMore: 'https://www.revenuquebec.ca/en/businesses/source-deductions-and-employer-contributions/calculating-source-deductions-and-employer-contributions/contribution-to-the-health-services-fund/'
    },
    fr: {
      title: 'FSS - Fonds des services de santé',
      content: 'Les travailleurs autonomes du Québec doivent cotiser au Fonds des services de santé (FSS) en fonction de leur revenu net d\'entreprise.',
      learnMore: 'https://www.revenuquebec.ca/fr/entreprises/retenues-et-cotisations/calcul-des-retenues-et-des-cotisations/cotisation-au-fonds-des-services-de-sante/'
    }
  }
};

/**
 * Create a tooltip element
 * @param {string} key - Tooltip key from TAX_TOOLTIPS
 * @param {string} position - Tooltip position: 'top', 'bottom', 'left', 'right'
 * @returns {string} HTML string for tooltip
 */
function createTooltip(key, position = 'top') {
  const tooltipData = TAX_TOOLTIPS[key];
  if (!tooltipData) return '';
  
  const lang = (typeof currentLang !== 'undefined' ? currentLang : 'fr');
  const content = tooltipData[lang];
  
  return `
    <span class="tooltip-trigger" data-tooltip="${key}" data-position="${position}">
      <svg class="info-icon" width="16" height="16" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="7" fill="var(--accent)" opacity="0.1"/>
        <text x="8" y="11" text-anchor="middle" fill="var(--accent)" font-size="10" font-weight="bold">i</text>
      </svg>
      <div class="tooltip-content">
        <h4>${content.title}</h4>
        <p>${content.content}</p>
        ${content.learnMore ? `<a href="${content.learnMore}" target="_blank" rel="noopener noreferrer">Learn more →</a>` : ''}
      </div>
    </span>
  `;
}

/**
 * Initialize tooltip interactions
 */
function initializeTooltips() {
  // Add event listeners for tooltip triggers
  document.addEventListener('click', function(e) {
    const trigger = e.target.closest('.tooltip-trigger');
    
    // Close all tooltips when clicking outside
    if (!trigger) {
      document.querySelectorAll('.tooltip-content.active').forEach(tooltip => {
        tooltip.classList.remove('active');
      });
      return;
    }
    
    e.stopPropagation();
    
    // Toggle the clicked tooltip
    const tooltipContent = trigger.querySelector('.tooltip-content');
    if (tooltipContent) {
      const isActive = tooltipContent.classList.contains('active');
      
      // Close all other tooltips
      document.querySelectorAll('.tooltip-content.active').forEach(tooltip => {
        if (tooltip !== tooltipContent) {
          tooltip.classList.remove('active');
        }
      });
      
      // Toggle current tooltip
      tooltipContent.classList.toggle('active', !isActive);
    }
  });
  
  // Close tooltips on ESC key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.tooltip-content.active').forEach(tooltip => {
        tooltip.classList.remove('active');
      });
    }
  });
}

// Initialize on DOM ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTooltips);
  } else {
    initializeTooltips();
  }
  
  // Make functions globally available
  window.createTooltip = createTooltip;
  window.TAX_TOOLTIPS = TAX_TOOLTIPS;
}

export { createTooltip, initializeTooltips, TAX_TOOLTIPS };
