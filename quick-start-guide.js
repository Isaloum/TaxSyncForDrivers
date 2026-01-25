/**
 * Quick Start Guide - Interactive onboarding for TaxSyncForDrivers
 * Provides step-by-step walkthrough for new users
 */

const GUIDE_STEPS = [
  {
    id: 'welcome',
    title: { en: 'Welcome to TaxSyncForDrivers', fr: 'Bienvenue à TaxSyncForDrivers' },
    description: { 
      en: 'Let\'s set up your tax profile in 5 minutes',
      fr: 'Configurons votre profil fiscal en 5 minutes'
    },
    duration: 30,
    component: 'WelcomeStep',
    sampleData: null
  },
  {
    id: 'document-upload',
    title: { en: 'Upload Your First Receipt', fr: 'Téléversez votre premier reçu' },
    description: { 
      en: 'See how AI automatically extracts expense data',
      fr: 'Voyez comment l\'IA extrait automatiquement les données'
    },
    duration: 60,
    component: 'DocumentUploadStep',
    sampleData: {
      receipt: 'sample-shell-receipt.jpg',
      amount: 75.50,
      vendor: 'Shell Gas Station',
      category: 'fuel'
    }
  },
  {
    id: 'vehicle-expenses',
    title: { en: 'Track Vehicle Expenses', fr: 'Suivez les dépenses de véhicule' },
    description: { 
      en: 'Enter odometer readings and calculate business use',
      fr: 'Entrez les lectures d\'odomètre et calculez l\'usage professionnel'
    },
    duration: 120,
    component: 'VehicleExpensesStep',
    sampleData: {
      odometer: {
        start: 45000,
        end: 75000,
        businessKm: 27000,
        personalKm: 3000
      },
      businessUsePercent: 90
    }
  },
  {
    id: 'income-tracking',
    title: { en: 'Income Tracking Demo', fr: 'Démonstration de suivi des revenus' },
    description: { 
      en: 'Upload sample driver statement and see income parsing',
      fr: 'Téléversez un relevé d\'exemple et voyez l\'analyse des revenus'
    },
    duration: 60,
    component: 'IncomeTrackingStep',
    sampleData: {
      platform: 'Uber',
      period: 'Q1 2025',
      gross: 18000,
      tips: 1200,
      fees: 4500
    }
  },
  {
    id: 'tax-forms',
    title: { en: 'Tax Forms Preview', fr: 'Aperçu des formulaires fiscaux' },
    description: { 
      en: 'Generate sample T2125 and export for your accountant',
      fr: 'Générez un exemple de T2125 et exportez pour votre comptable'
    },
    duration: 60,
    component: 'TaxFormsStep',
    sampleData: null
  }
];

class QuickStartGuide {
  constructor() {
    this.currentStep = 0;
    this.isActive = false;
    this.lang = 'fr';
    this.progress = this.loadProgress();
  }

  loadProgress() {
    try {
      const saved = localStorage.getItem('taxsync_guide_progress');
      return saved ? JSON.parse(saved) : { completed: [], currentStep: 0 };
    } catch (e) {
      return { completed: [], currentStep: 0 };
    }
  }

  saveProgress() {
    try {
      localStorage.setItem('taxsync_guide_progress', JSON.stringify(this.progress));
    } catch (e) {
      console.error('Failed to save guide progress:', e);
    }
  }

  start(language = 'fr') {
    this.lang = language;
    this.currentStep = this.progress.currentStep || 0;
    this.isActive = true;
    this.render();
  }

  skip() {
    this.progress.currentStep = this.currentStep;
    this.saveProgress();
    this.close();
  }

  resume() {
    this.currentStep = this.progress.currentStep || 0;
    this.start(this.lang);
  }

  next() {
    if (!this.progress.completed.includes(this.currentStep)) {
      this.progress.completed.push(this.currentStep);
    }
    
    if (this.currentStep < GUIDE_STEPS.length - 1) {
      this.currentStep++;
      this.progress.currentStep = this.currentStep;
      this.saveProgress();
      this.render();
    } else {
      this.complete();
    }
  }

  previous() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.progress.currentStep = this.currentStep;
      this.saveProgress();
      this.render();
    }
  }

  complete() {
    this.progress.completed = GUIDE_STEPS.map((_, idx) => idx);
    this.progress.currentStep = 0;
    this.saveProgress();
    this.showCompletionMessage();
    setTimeout(() => this.close(), 3000);
  }

  close() {
    this.isActive = false;
    const modal = document.getElementById('quickStartModal');
    if (modal) {
      modal.remove();
    }
  }

  render() {
    const step = GUIDE_STEPS[this.currentStep];
    const totalSteps = GUIDE_STEPS.length;
    const progressPercent = ((this.currentStep + 1) / totalSteps) * 100;

    const modalHTML = `
      <div id="quickStartModal" class="quick-start-modal">
        <div class="quick-start-overlay" onclick="window.quickStartGuide.skip()"></div>
        <div class="quick-start-content">
          <div class="quick-start-header">
            <div class="quick-start-progress">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${progressPercent}%"></div>
              </div>
              <div class="progress-text">
                ${this.lang === 'en' ? 'Step' : 'Étape'} ${this.currentStep + 1} ${this.lang === 'en' ? 'of' : 'de'} ${totalSteps}
              </div>
            </div>
            <button class="close-btn" onclick="window.quickStartGuide.skip()">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <div class="quick-start-body">
            <div class="step-icon">${this.getStepIcon(step.id)}</div>
            <h2>${step.title[this.lang]}</h2>
            <p class="step-description">${step.description[this.lang]}</p>
            <div class="step-duration">⏱️ ${step.duration} ${this.lang === 'en' ? 'seconds' : 'secondes'}</div>
            
            <div class="step-content">
              ${this.renderStepContent(step)}
            </div>
          </div>
          
          <div class="quick-start-footer">
            <button class="btn-skip" onclick="window.quickStartGuide.skip()">
              ${this.lang === 'en' ? 'Skip for now' : 'Passer pour l\'instant'}
            </button>
            <div class="nav-buttons">
              ${this.currentStep > 0 ? `
                <button class="btn-secondary" onclick="window.quickStartGuide.previous()">
                  ${this.lang === 'en' ? '← Previous' : '← Précédent'}
                </button>
              ` : ''}
              <button class="btn-primary" onclick="window.quickStartGuide.next()">
                ${this.currentStep < totalSteps - 1 ? 
                  (this.lang === 'en' ? 'Next →' : 'Suivant →') : 
                  (this.lang === 'en' ? 'Complete' : 'Terminer')}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Remove existing modal if any
    const existing = document.getElementById('quickStartModal');
    if (existing) {
      existing.remove();
    }

    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  getStepIcon(stepId) {
    const icons = {
      'welcome': '👋',
      'document-upload': '📄',
      'vehicle-expenses': '🚗',
      'income-tracking': '💰',
      'tax-forms': '📊'
    };
    return icons[stepId] || '✨';
  }

  renderStepContent(step) {
    switch (step.id) {
      case 'welcome':
        return this.renderWelcomeStep();
      case 'document-upload':
        return this.renderDocumentUploadStep(step.sampleData);
      case 'vehicle-expenses':
        return this.renderVehicleExpensesStep(step.sampleData);
      case 'income-tracking':
        return this.renderIncomeTrackingStep(step.sampleData);
      case 'tax-forms':
        return this.renderTaxFormsStep();
      default:
        return '';
    }
  }

  renderWelcomeStep() {
    return `
      <div class="welcome-step">
        <h3>${this.lang === 'en' ? 'Let\'s get started!' : 'Commençons!'}</h3>
        <p>${this.lang === 'en' 
          ? 'This quick guide will help you understand TaxSyncForDrivers in just 5 minutes.'
          : 'Ce guide rapide vous aidera à comprendre TaxSyncForDrivers en seulement 5 minutes.'}</p>
        
        <div class="profile-setup">
          <div class="form-group">
            <label>${this.lang === 'en' ? 'Province:' : 'Province:'}</label>
            <select id="guideProvince">
              <option value="QC">Québec</option>
              <option value="ON">Ontario</option>
              <option value="BC">British Columbia / Colombie-Britannique</option>
              <option value="AB">Alberta</option>
              <option value="MB">Manitoba</option>
              <option value="SK">Saskatchewan</option>
              <option value="NS">Nova Scotia / Nouvelle-Écosse</option>
              <option value="NB">New Brunswick / Nouveau-Brunswick</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>${this.lang === 'en' ? 'Driver Type:' : 'Type de chauffeur:'}</label>
            <select id="guideDriverType">
              <option value="uber">Uber</option>
              <option value="lyft">Lyft</option>
              <option value="taxi">Taxi</option>
              <option value="multiple">${this.lang === 'en' ? 'Multiple Platforms' : 'Plateformes multiples'}</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>${this.lang === 'en' ? 'Estimated Annual Income:' : 'Revenu annuel estimé:'}</label>
            <select id="guideIncome">
              <option value="30000">< $30,000</option>
              <option value="50000">$30,000 - $50,000</option>
              <option value="65000" selected>$50,000 - $80,000</option>
              <option value="100000">> $80,000</option>
            </select>
          </div>
        </div>
      </div>
    `;
  }

  renderDocumentUploadStep(sampleData) {
    return `
      <div class="document-step">
        <p>${this.lang === 'en'
          ? 'TaxSyncForDrivers uses AI to automatically extract data from your receipts and statements.'
          : 'TaxSyncForDrivers utilise l\'IA pour extraire automatiquement les données de vos reçus et relevés.'}</p>
        
        <div class="sample-receipt">
          <div class="receipt-preview">
            <div class="receipt-icon">📄</div>
            <div class="receipt-details">
              <strong>${sampleData.vendor}</strong>
              <div class="receipt-amount">$${sampleData.amount.toFixed(2)}</div>
              <div class="receipt-category">${this.lang === 'en' ? 'Category:' : 'Catégorie:'} ${sampleData.category}</div>
            </div>
          </div>
          <p class="hint">
            ${this.lang === 'en'
              ? '💡 Upload receipts over $75 to comply with CRA requirements'
              : '💡 Téléversez les reçus de plus de 75 $ pour respecter les exigences de l\'ARC'}
          </p>
        </div>
        
        <button class="btn-demo" onclick="scrollToSection('documentAI')">
          ${this.lang === 'en' ? 'Try Document Upload →' : 'Essayer le téléversement →'}
        </button>
      </div>
    `;
  }

  renderVehicleExpensesStep(sampleData) {
    return `
      <div class="vehicle-step">
        <p>${this.lang === 'en'
          ? 'Track your vehicle expenses to maximize tax deductions.'
          : 'Suivez vos dépenses de véhicule pour maximiser vos déductions fiscales.'}</p>
        
        <div class="sample-vehicle">
          <div class="vehicle-data">
            <div class="data-row">
              <span>${this.lang === 'en' ? 'Start Odometer:' : 'Odomètre début:'}</span>
              <strong>${sampleData.odometer.start.toLocaleString()} km</strong>
            </div>
            <div class="data-row">
              <span>${this.lang === 'en' ? 'End Odometer:' : 'Odomètre fin:'}</span>
              <strong>${sampleData.odometer.end.toLocaleString()} km</strong>
            </div>
            <div class="data-row">
              <span>${this.lang === 'en' ? 'Business Use:' : 'Usage professionnel:'}</span>
              <strong>${sampleData.businessUsePercent}%</strong>
            </div>
          </div>
          <p class="hint">
            ${this.lang === 'en'
              ? '⚠️ Claiming over 90% business use triggers CRA scrutiny'
              : '⚠️ Réclamer plus de 90% d\'usage professionnel déclenche un examen de l\'ARC'}
          </p>
        </div>
        
        <button class="btn-demo" onclick="scrollToSection('vehicleExpenses')">
          ${this.lang === 'en' ? 'Go to Vehicle Expenses →' : 'Aller aux dépenses véhicule →'}
        </button>
      </div>
    `;
  }

  renderIncomeTrackingStep(sampleData) {
    return `
      <div class="income-step">
        <p>${this.lang === 'en'
          ? 'Upload your platform statements to automatically track income and fees.'
          : 'Téléversez vos relevés de plateforme pour suivre automatiquement les revenus et frais.'}</p>
        
        <div class="sample-income">
          <div class="income-summary">
            <div class="platform-badge">${sampleData.platform}</div>
            <div class="period">${sampleData.period}</div>
            <div class="income-breakdown">
              <div class="income-row">
                <span>${this.lang === 'en' ? 'Gross Income:' : 'Revenu brut:'}</span>
                <strong>$${sampleData.gross.toLocaleString()}</strong>
              </div>
              <div class="income-row">
                <span>${this.lang === 'en' ? 'Tips:' : 'Pourboires:'}</span>
                <strong>$${sampleData.tips.toLocaleString()}</strong>
              </div>
              <div class="income-row negative">
                <span>${this.lang === 'en' ? 'Platform Fees:' : 'Frais plateforme:'}</span>
                <strong>-$${sampleData.fees.toLocaleString()}</strong>
              </div>
              <div class="income-row total">
                <span>${this.lang === 'en' ? 'Net Income:' : 'Revenu net:'}</span>
                <strong>$${(sampleData.gross + sampleData.tips - sampleData.fees).toLocaleString()}</strong>
              </div>
            </div>
          </div>
        </div>
        
        <button class="btn-demo" onclick="scrollToSection('documentAI')">
          ${this.lang === 'en' ? 'Upload Income Statement →' : 'Téléverser relevé de revenus →'}
        </button>
      </div>
    `;
  }

  renderTaxFormsStep() {
    return `
      <div class="tax-forms-step">
        <p>${this.lang === 'en'
          ? 'Generate professional tax forms ready for submission to CRA.'
          : 'Générez des formulaires fiscaux professionnels prêts pour soumission à l\'ARC.'}</p>
        
        <div class="forms-list">
          <div class="form-card">
            <div class="form-icon">📄</div>
            <strong>T2125</strong>
            <span>${this.lang === 'en' ? 'Business Income & Expenses' : 'Revenus et dépenses d\'entreprise'}</span>
          </div>
          <div class="form-card">
            <div class="form-icon">📋</div>
            <strong>TP-80-V</strong>
            <span>${this.lang === 'en' ? 'Quebec Self-Employment (FSS, QPP)' : 'Travail autonome Québec (FSS, RRQ)'}</span>
          </div>
          <div class="form-card">
            <div class="form-icon">📊</div>
            <strong>CCA Schedule</strong>
            <span>${this.lang === 'en' ? 'Vehicle Depreciation' : 'Dépréciation de véhicule'}</span>
          </div>
        </div>
        
        <button class="btn-demo" onclick="scrollToSection('businessExpenses')">
          ${this.lang === 'en' ? 'Generate Tax Forms →' : 'Générer formulaires fiscaux →'}
        </button>
      </div>
    `;
  }

  showCompletionMessage() {
    const modalContent = document.querySelector('.quick-start-content');
    if (modalContent) {
      modalContent.innerHTML = `
        <div class="completion-message">
          <div class="completion-icon">🎉</div>
          <h2>${this.lang === 'en' ? 'Congratulations!' : 'Félicitations!'}</h2>
          <p>${this.lang === 'en'
            ? 'You\'ve completed the Quick Start Guide. You\'re ready to maximize your tax deductions!'
            : 'Vous avez terminé le guide de démarrage rapide. Vous êtes prêt à maximiser vos déductions fiscales!'}</p>
          <div class="completion-checklist">
            <div>✅ ${this.lang === 'en' ? 'Profile configured' : 'Profil configuré'}</div>
            <div>✅ ${this.lang === 'en' ? 'Document upload understood' : 'Téléversement de documents compris'}</div>
            <div>✅ ${this.lang === 'en' ? 'Vehicle tracking ready' : 'Suivi de véhicule prêt'}</div>
            <div>✅ ${this.lang === 'en' ? 'Income tracking learned' : 'Suivi des revenus appris'}</div>
            <div>✅ ${this.lang === 'en' ? 'Tax forms preview seen' : 'Aperçu des formulaires vu'}</div>
          </div>
        </div>
      `;
    }
  }
}

// Helper function to scroll to a section
function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Close the guide modal
    if (window.quickStartGuide) {
      window.quickStartGuide.close();
    }
  }
}

// Initialize and export
if (typeof window !== 'undefined') {
  window.QuickStartGuide = QuickStartGuide;
  window.quickStartGuide = new QuickStartGuide();
  window.scrollToSection = scrollToSection;
}

export { QuickStartGuide, GUIDE_STEPS };
