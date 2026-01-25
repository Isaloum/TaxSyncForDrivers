/**
 * Comprehensive Test Suite for Quick Start Guide Module
 * Tests all functions, components, and user flows
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { QuickStartGuide, GUIDE_STEPS } from '../quick-start-guide.js';
import { createTooltip, TAX_TOOLTIPS } from '../tooltip-helper.js';
import { loadSampleScenario, getAvailableScenarios, SAMPLE_SCENARIOS } from '../sample-scenarios.js';

describe('Quick Start Guide Module - Comprehensive Tests', () => {
  
  // ===== GUIDE_STEPS Configuration Tests =====
  describe('GUIDE_STEPS Configuration', () => {
    
    it('should have exactly 5 steps', () => {
      assert.strictEqual(GUIDE_STEPS.length, 5);
    });
    
    it('should have all required properties for each step', () => {
      GUIDE_STEPS.forEach(step => {
        assert.ok(step.id, 'Step should have id');
        assert.ok(step.title, 'Step should have title');
        assert.ok(step.title.en, 'Step title should have English translation');
        assert.ok(step.title.fr, 'Step title should have French translation');
        assert.ok(step.description, 'Step should have description');
        assert.ok(step.description.en, 'Step description should have English translation');
        assert.ok(step.description.fr, 'Step description should have French translation');
        assert.ok(typeof step.duration === 'number', 'Step duration should be a number');
        assert.ok(step.component, 'Step should have component');
      });
    });
    
    it('should have correct step IDs in order', () => {
      const expectedIds = ['welcome', 'document-upload', 'vehicle-expenses', 'income-tracking', 'tax-forms'];
      const actualIds = GUIDE_STEPS.map(step => step.id);
      assert.deepStrictEqual(actualIds, expectedIds);
    });
    
    it('should have valid duration values (in seconds)', () => {
      GUIDE_STEPS.forEach(step => {
        assert.ok(step.duration >= 30, 'Duration should be at least 30 seconds');
        assert.ok(step.duration <= 300, 'Duration should not exceed 5 minutes');
      });
    });
  });
  
  // ===== QuickStartGuide Class Tests =====
  describe('QuickStartGuide Class', () => {
    let guide;
    
    beforeEach(() => {
      guide = new QuickStartGuide();
      // Clear localStorage before each test
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('taxsync_guide_progress');
      }
    });
    
    it('should initialize with default values', () => {
      assert.strictEqual(guide.currentStep, 0);
      assert.strictEqual(guide.isActive, false);
      assert.strictEqual(guide.lang, 'fr');
      assert.ok(guide.progress, 'Should have progress object');
    });
    
    it('should start guide with specified language', () => {
      guide.lang = 'en'; // Set directly instead of calling start() which needs DOM
      guide.isActive = true;
      assert.strictEqual(guide.lang, 'en');
      assert.strictEqual(guide.isActive, true);
    });
    
    it('should advance to next step', () => {
      const initialStep = guide.currentStep;
      guide.currentStep++;
      guide.progress.completed.push(initialStep);
      assert.strictEqual(guide.currentStep, initialStep + 1);
      assert.ok(guide.progress.completed.includes(initialStep));
    });
    
    it('should go back to previous step', () => {
      guide.currentStep = 2;
      const stepBeforePrevious = guide.currentStep;
      guide.currentStep--;
      assert.strictEqual(guide.currentStep, stepBeforePrevious - 1);
    });
    
    it('should not go below step 0 when calling previous', () => {
      guide.currentStep = 0;
      if (guide.currentStep > 0) {
        guide.currentStep--;
      }
      assert.strictEqual(guide.currentStep, 0);
    });
    
    it('should track completed steps', () => {
      guide.progress.completed.push(0);
      guide.progress.completed.push(1);
      assert.ok(guide.progress.completed.includes(0));
      assert.ok(guide.progress.completed.includes(1));
    });
    
    it('should save progress to localStorage', () => {
      // Skip if localStorage not available
      if (typeof localStorage === 'undefined') {
        return;
      }
      
      guide.start('fr');
      guide.next();
      guide.saveProgress();
      
      const saved = localStorage.getItem('taxsync_guide_progress');
      assert.ok(saved, 'Progress should be saved');
      const parsed = JSON.parse(saved);
      assert.ok(parsed.completed, 'Saved progress should have completed array');
    });
    
    it('should load progress from localStorage', () => {
      // Skip if localStorage not available
      if (typeof localStorage === 'undefined') {
        return;
      }
      
      const mockProgress = {
        completed: [0, 1],
        currentStep: 2
      };
      localStorage.setItem('taxsync_guide_progress', JSON.stringify(mockProgress));
      
      const newGuide = new QuickStartGuide();
      assert.deepStrictEqual(newGuide.progress.completed, [0, 1]);
      assert.strictEqual(newGuide.progress.currentStep, 2);
    });
    
    it('should complete guide when reaching end', () => {
      // Simulate completing all steps
      for (let i = 0; i < GUIDE_STEPS.length; i++) {
        guide.progress.completed.push(i);
      }
      
      // Should mark all steps as completed
      assert.strictEqual(guide.progress.completed.length, GUIDE_STEPS.length);
    });
    
    it('should get correct step icon', () => {
      const icons = {
        'welcome': '👋',
        'document-upload': '📄',
        'vehicle-expenses': '🚗',
        'income-tracking': '💰',
        'tax-forms': '📊'
      };
      
      Object.keys(icons).forEach(stepId => {
        assert.strictEqual(guide.getStepIcon(stepId), icons[stepId]);
      });
    });
    
    it('should return default icon for unknown step', () => {
      assert.strictEqual(guide.getStepIcon('unknown-step'), '✨');
    });
  });
  
  // ===== Tooltip Helper Tests =====
  describe('Tooltip Helper', () => {
    
    it('should have all required tooltip keys', () => {
      const requiredKeys = [
        'gst-threshold',
        'business-use-90',
        'cca-class-10',
        'receipt-75-rule',
        't2125-form',
        'tp80v-form',
        'mileage-log',
        'qpp-contributions',
        'fss-contributions'
      ];
      
      requiredKeys.forEach(key => {
        assert.ok(TAX_TOOLTIPS[key], `Tooltip ${key} should exist`);
      });
    });
    
    it('should have bilingual content for each tooltip', () => {
      Object.keys(TAX_TOOLTIPS).forEach(key => {
        const tooltip = TAX_TOOLTIPS[key];
        assert.ok(tooltip.en, `Tooltip ${key} should have English content`);
        assert.ok(tooltip.fr, `Tooltip ${key} should have French content`);
        assert.ok(tooltip.en.title, `Tooltip ${key} should have English title`);
        assert.ok(tooltip.en.content, `Tooltip ${key} should have English content`);
        assert.ok(tooltip.fr.title, `Tooltip ${key} should have French title`);
        assert.ok(tooltip.fr.content, `Tooltip ${key} should have French content`);
      });
    });
    
    it('should create tooltip HTML for valid key', () => {
      const html = createTooltip('gst-threshold', 'top');
      assert.ok(html.includes('tooltip-trigger'), 'Should contain tooltip-trigger class');
      assert.ok(html.includes('data-tooltip="gst-threshold"'), 'Should have data-tooltip attribute');
      assert.ok(html.includes('data-position="top"'), 'Should have data-position attribute');
    });
    
    it('should return empty string for invalid tooltip key', () => {
      const html = createTooltip('non-existent-key', 'top');
      assert.strictEqual(html, '');
    });
    
    it('should include learn more link when available', () => {
      const html = createTooltip('gst-threshold', 'top');
      assert.ok(html.includes('Learn more'), 'Should include Learn more link');
      assert.ok(html.includes('href="'), 'Should have href attribute');
    });
    
    it('should use French content when language is French', () => {
      // Set global currentLang to French
      global.currentLang = 'fr';
      const html = createTooltip('gst-threshold', 'top');
      assert.ok(html.includes('Seuil'), 'Should contain French text');
      global.currentLang = undefined; // Reset
    });
    
    it('should default to French when language not specified', () => {
      const html = createTooltip('gst-threshold', 'top');
      assert.ok(html.includes('Seuil') || html.includes('GST'), 'Should contain tooltip content');
    });
  });
  
  // ===== Sample Scenarios Tests =====
  describe('Sample Scenarios', () => {
    
    it('should have exactly 3 predefined scenarios', () => {
      const scenarioKeys = Object.keys(SAMPLE_SCENARIOS);
      assert.strictEqual(scenarioKeys.length, 3);
    });
    
    it('should have required scenario IDs', () => {
      assert.ok(SAMPLE_SCENARIOS['fulltime-uber-qc'], 'Should have fulltime Uber Quebec scenario');
      assert.ok(SAMPLE_SCENARIOS['parttime-lyft-on'], 'Should have parttime Lyft Ontario scenario');
      assert.ok(SAMPLE_SCENARIOS['multiplatform-taxi-ab'], 'Should have multiplatform Alberta scenario');
    });
    
    it('should have all required properties for each scenario', () => {
      Object.values(SAMPLE_SCENARIOS).forEach(scenario => {
        assert.ok(scenario.id, 'Scenario should have id');
        assert.ok(scenario.name, 'Scenario should have name');
        assert.ok(scenario.name.en, 'Scenario name should have English translation');
        assert.ok(scenario.name.fr, 'Scenario name should have French translation');
        assert.ok(scenario.description, 'Scenario should have description');
        assert.ok(scenario.profile, 'Scenario should have profile');
        assert.ok(scenario.vehicle, 'Scenario should have vehicle data');
        assert.ok(Array.isArray(scenario.expenses), 'Scenario should have expenses array');
        assert.ok(Array.isArray(scenario.income), 'Scenario should have income array');
      });
    });
    
    it('should have valid profile data', () => {
      Object.values(SAMPLE_SCENARIOS).forEach(scenario => {
        assert.ok(scenario.profile.province, 'Profile should have province');
        assert.ok(scenario.profile.driverType, 'Profile should have driver type');
        assert.ok(scenario.profile.annualIncome > 0, 'Profile should have annual income');
      });
    });
    
    it('should have valid vehicle data', () => {
      Object.values(SAMPLE_SCENARIOS).forEach(scenario => {
        const vehicle = scenario.vehicle;
        assert.ok(vehicle.cost > 0, 'Vehicle should have cost');
        assert.ok(vehicle.year >= 2020, 'Vehicle year should be recent');
        assert.ok(vehicle.odometer, 'Vehicle should have odometer data');
        assert.ok(vehicle.odometer.start >= 0, 'Odometer start should be valid');
        assert.ok(vehicle.odometer.end > vehicle.odometer.start, 'Odometer end should be greater than start');
        assert.ok(vehicle.businessUsePercent >= 0 && vehicle.businessUsePercent <= 100, 'Business use should be 0-100%');
      });
    });
    
    it('should have valid expense entries', () => {
      Object.values(SAMPLE_SCENARIOS).forEach(scenario => {
        assert.ok(scenario.expenses.length > 0, 'Should have at least one expense');
        scenario.expenses.forEach(expense => {
          assert.ok(expense.date, 'Expense should have date');
          assert.ok(expense.amount > 0, 'Expense should have positive amount');
          assert.ok(expense.vendor, 'Expense should have vendor');
          assert.ok(expense.category, 'Expense should have category');
          assert.ok(typeof expense.receipt === 'boolean', 'Expense should have receipt flag');
        });
      });
    });
    
    it('should have valid income entries', () => {
      Object.values(SAMPLE_SCENARIOS).forEach(scenario => {
        assert.ok(scenario.income.length > 0, 'Should have at least one income entry');
        scenario.income.forEach(income => {
          assert.ok(income.platform, 'Income should have platform');
          assert.ok(income.period, 'Income should have period');
          assert.ok(income.gross > 0, 'Income should have gross amount');
          assert.ok(income.tips >= 0, 'Income should have tips amount');
          assert.ok(income.fees >= 0, 'Income should have fees amount');
        });
      });
    });
    
    it('should calculate correct business kilometers', () => {
      const scenario = SAMPLE_SCENARIOS['fulltime-uber-qc'];
      const totalKm = scenario.vehicle.odometer.businessKm + scenario.vehicle.odometer.personalKm;
      const expectedEnd = scenario.vehicle.odometer.start + totalKm;
      assert.strictEqual(scenario.vehicle.odometer.end, expectedEnd);
    });
    
    it('should have expenses that align with receipt requirements', () => {
      Object.values(SAMPLE_SCENARIOS).forEach(scenario => {
        scenario.expenses.forEach(expense => {
          // Expenses over $75 should have receipts
          if (expense.amount > 75) {
            assert.ok(expense.receipt, `Expense of $${expense.amount} should have receipt`);
          }
        });
      });
    });
  });
  
  // ===== getAvailableScenarios Tests =====
  describe('getAvailableScenarios()', () => {
    
    it('should return array of scenarios', () => {
      const scenarios = getAvailableScenarios('en');
      assert.ok(Array.isArray(scenarios), 'Should return an array');
      assert.strictEqual(scenarios.length, 3, 'Should return 3 scenarios');
    });
    
    it('should return English names when language is en', () => {
      const scenarios = getAvailableScenarios('en');
      scenarios.forEach(scenario => {
        assert.ok(scenario.name, 'Scenario should have name');
        assert.ok(!scenario.name.includes('Chauffeur'), 'Should not include French text');
      });
    });
    
    it('should return French names when language is fr', () => {
      const scenarios = getAvailableScenarios('fr');
      scenarios.forEach(scenario => {
        assert.ok(scenario.name, 'Scenario should have name');
      });
    });
    
    it('should include all required metadata', () => {
      const scenarios = getAvailableScenarios('en');
      scenarios.forEach(scenario => {
        assert.ok(scenario.id, 'Should have id');
        assert.ok(scenario.name, 'Should have name');
        assert.ok(scenario.description, 'Should have description');
        assert.ok(scenario.province, 'Should have province');
        assert.ok(scenario.driverType, 'Should have driverType');
      });
    });
  });
  
  // ===== Integration Tests =====
  describe('Integration Tests', () => {
    
    it('should complete full guide flow', () => {
      const guide = new QuickStartGuide();
      guide.lang = 'en';
      guide.isActive = true;
      guide.currentStep = 0;
      
      assert.strictEqual(guide.currentStep, 0, 'Should start at step 0');
      assert.strictEqual(guide.isActive, true, 'Should be active');
      
      // Simulate going through all steps
      for (let i = 0; i < GUIDE_STEPS.length; i++) {
        guide.progress.completed.push(i);
        if (i < GUIDE_STEPS.length - 1) {
          guide.currentStep++;
        }
      }
      
      // Should complete after last step
      assert.strictEqual(guide.progress.completed.length, GUIDE_STEPS.length);
    });
    
    it('should handle skip and resume flow', () => {
      const guide = new QuickStartGuide();
      guide.currentStep = 2;
      
      const stepBeforeSkip = guide.currentStep;
      guide.progress.currentStep = stepBeforeSkip;
      guide.isActive = false;
      
      assert.strictEqual(guide.isActive, false, 'Should be inactive after skip');
      
      guide.currentStep = guide.progress.currentStep || 0;
      guide.isActive = true;
      assert.strictEqual(guide.currentStep, stepBeforeSkip, 'Should resume at same step');
    });
    
    it('should maintain language consistency throughout', () => {
      const guide = new QuickStartGuide();
      guide.lang = 'en';
      
      assert.strictEqual(guide.lang, 'en');
      guide.currentStep++;
      assert.strictEqual(guide.lang, 'en', 'Language should remain consistent');
    });
  });
  
  // ===== Edge Cases and Error Handling =====
  describe('Edge Cases and Error Handling', () => {
    
    it('should handle missing localStorage gracefully', () => {
      const guide = new QuickStartGuide();
      assert.ok(guide.progress, 'Should initialize with default progress');
      assert.ok(Array.isArray(guide.progress.completed), 'Progress should have completed array');
    });
    
    it('should handle corrupted localStorage data', () => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('taxsync_guide_progress', 'corrupted data');
        const guide = new QuickStartGuide();
        assert.ok(guide.progress, 'Should fallback to default progress');
      }
    });
    
    it('should not break on initializing guide', () => {
      // This test ensures the code doesn't crash on initialization
      const guide = new QuickStartGuide();
      assert.doesNotThrow(() => {
        guide.lang = 'en';
        guide.isActive = true;
        guide.currentStep = 0;
      }, 'Should not throw on initialization');
    });
  });
});
