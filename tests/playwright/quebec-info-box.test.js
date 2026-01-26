import { test, expect } from '@playwright/test';

/**
 * Quebec-Specific Info Box Visibility Tests
 * Tests to ensure the Quebec-specific contributions informational box
 * only appears on the FSS & QPP Calculator page, not on other feature pages.
 * 
 * This prevents regression of the issue where the info box appeared on all pages.
 */

test.describe('Quebec Info Box Visibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Ensure Quebec is selected as the province
    const provinceSelect = page.locator('#provinceSelect');
    await provinceSelect.selectOption('QC');
  });

  test('Quebec info box should NOT appear on Medical Expenses page', async ({ page }) => {
    // Click on Medical Expenses tab
    const medicalTab = page.locator('.tab-btn[data-tab="medical"]');
    await medicalTab.click();
    
    // Wait for the section to be visible
    const medicalSection = page.locator('#medical');
    await expect(medicalSection).toBeVisible();
    
    // The Quebec info box should NOT be visible
    const quebecInfoBox = page.locator('text=Quebec-specific contributions:').first();
    await expect(quebecInfoBox).not.toBeVisible();
  });

  test('Quebec info box should NOT appear on Childcare page', async ({ page }) => {
    // Click on Childcare tab
    const childcareTab = page.locator('.tab-btn[data-tab="childcare"]');
    await childcareTab.click();
    
    // Wait for the section to be visible
    const childcareSection = page.locator('#childcare');
    await expect(childcareSection).toBeVisible();
    
    // The Quebec info box should NOT be visible
    const quebecInfoBox = page.locator('text=Quebec-specific contributions:').first();
    await expect(quebecInfoBox).not.toBeVisible();
  });

  test('Quebec info box should NOT appear on Business Expenses page', async ({ page }) => {
    // Click on Business Expenses tab
    const businessTab = page.locator('.tab-btn[data-tab="businessExpenses"]');
    await businessTab.click();
    
    // Wait for the section to be visible
    const businessSection = page.locator('#businessExpenses');
    await expect(businessSection).toBeVisible();
    
    // The Quebec info box should NOT be visible
    const quebecInfoBox = page.locator('text=Quebec-specific contributions:').first();
    await expect(quebecInfoBox).not.toBeVisible();
  });

  test('Quebec info box should NOT appear on Charitable Donations page', async ({ page }) => {
    // Click on Charitable Donations tab
    const charitableTab = page.locator('.tab-btn[data-tab="donations"]');
    await charitableTab.click();
    
    // Wait for the section to be visible
    const charitableSection = page.locator('#donations');
    await expect(charitableSection).toBeVisible();
    
    // The Quebec info box should NOT be visible
    const quebecInfoBox = page.locator('text=Quebec-specific contributions:').first();
    await expect(quebecInfoBox).not.toBeVisible();
  });

  test('Quebec info box should NOT appear on Vehicle Expenses page', async ({ page }) => {
    // Click on Vehicle Expenses tab
    const vehicleTab = page.locator('.tab-btn[data-tab="vehicle"]');
    await vehicleTab.click();
    
    // Wait for the section to be visible
    const vehicleSection = page.locator('#vehicle');
    await expect(vehicleSection).toBeVisible();
    
    // The Quebec info box should NOT be visible
    const quebecInfoBox = page.locator('text=Quebec-specific contributions:').first();
    await expect(quebecInfoBox).not.toBeVisible();
  });

  test('Quebec info box SHOULD appear on FSS & QPP Calculator page', async ({ page }) => {
    // Click on FSS & QPP tab
    const fssQppTab = page.locator('.tab-btn[data-tab="fssQppCalculator"]');
    await fssQppTab.click();
    
    // Wait for the section to be visible
    const fssQppSection = page.locator('#fssQppCalculator');
    await expect(fssQppSection).toBeVisible();
    
    // The Quebec info box SHOULD be visible
    const quebecInfoBox = page.locator('.alert.alert-info:has-text("Quebec-specific contributions:")');
    await expect(quebecInfoBox).toBeVisible();
    
    // Verify the full text content
    await expect(quebecInfoBox).toContainText('These apply in addition to federal taxes and Quebec income tax');
  });

  test('Quebec info box should disappear when switching away from FSS & QPP page', async ({ page }) => {
    // First, navigate to FSS & QPP Calculator
    const fssQppTab = page.locator('.tab-btn[data-tab="fssQppCalculator"]');
    await fssQppTab.click();
    
    // Wait for the section to be visible
    const fssQppSection = page.locator('#fssQppCalculator');
    await expect(fssQppSection).toBeVisible();
    
    // Verify the info box is visible
    const quebecInfoBox = page.locator('text=Quebec-specific contributions:').first();
    await expect(quebecInfoBox).toBeVisible();
    
    // Now switch to another tab
    const medicalTab = page.locator('.tab-btn[data-tab="medical"]');
    await medicalTab.click();
    
    // Wait for Medical section to be visible
    const medicalSection = page.locator('#medical');
    await expect(medicalSection).toBeVisible();
    
    // The Quebec info box should no longer be visible
    await expect(quebecInfoBox).not.toBeVisible();
  });

  test('FSS & QPP Calculator tab should be visible when Quebec is selected', async ({ page }) => {
    // The FSS & QPP tab button should be visible when Quebec is selected
    const fssQppTab = page.locator('.tab-btn[data-tab="fssQppCalculator"]');
    await expect(fssQppTab).toBeVisible();
  });

  test('FSS & QPP Calculator tab should be hidden when non-Quebec province is selected', async ({ page }) => {
    // Change province to Ontario
    const provinceSelect = page.locator('#provinceSelect');
    await provinceSelect.selectOption('ON');
    
    // The FSS & QPP tab button should not be visible
    const fssQppTab = page.locator('.tab-btn[data-tab="fssQppCalculator"]');
    await expect(fssQppTab).not.toBeVisible();
  });
});
