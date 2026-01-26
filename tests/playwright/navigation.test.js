import { test, expect } from '@playwright/test';

/**
 * Navigation Tests
 * Tests for duplicate navigation entries and proper tab functionality
 * Created to prevent regression of issue where duplicate "Mileage Log" entries appeared
 */

test.describe('Navigation Bar Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
  });

  test('should not have duplicate "Mileage Log" navigation entries', async ({ page }) => {
    // Find all tab buttons with "Mileage Log" text
    const mileageLogButtons = page.locator('.tab-btn[data-tab="mileageLog"]');
    
    // Should be exactly one "Mileage Log" button
    await expect(mileageLogButtons).toHaveCount(1);
    
    // Verify it has the correct text
    await expect(mileageLogButtons).toContainText('Mileage Log');
  });

  test('should have both Vehicle Expenses and Mileage Log as separate tabs', async ({ page }) => {
    // Check for Vehicle Expenses tab
    const vehicleTab = page.locator('.tab-btn[data-tab="vehicle"]');
    await expect(vehicleTab).toHaveCount(1);
    await expect(vehicleTab).toBeVisible();
    
    // Check for Mileage Log tab
    const mileageLogTab = page.locator('.tab-btn[data-tab="mileageLog"]');
    await expect(mileageLogTab).toHaveCount(1);
    await expect(mileageLogTab).toBeVisible();
  });

  test('should have valid HTML structure for all navigation buttons', async ({ page }) => {
    // Get all tab buttons
    const allTabButtons = page.locator('.tab-btn');
    const count = await allTabButtons.count();
    
    // Should have multiple tabs (at least the main ones)
    expect(count).toBeGreaterThan(5);
    
    // Each button should be properly formed
    for (let i = 0; i < count; i++) {
      const button = allTabButtons.nth(i);
      
      // Each button should have a data-tab attribute
      const dataTab = await button.getAttribute('data-tab');
      expect(dataTab).toBeTruthy();
      
      // Each button should have an icon and label
      const icon = button.locator('.tab-icon');
      const label = button.locator('.tab-label');
      
      await expect(icon).toHaveCount(1);
      await expect(label).toHaveCount(1);
    }
  });

  test('Vehicle Expenses tab should display Vehicle Expenses content', async ({ page }) => {
    const vehicleTab = page.locator('.tab-btn[data-tab="vehicle"]');
    await vehicleTab.click();
    
    // Wait for content to be visible
    const vehicleSection = page.locator('#vehicle');
    await expect(vehicleSection).toBeVisible();
    
    // Check for vehicle-specific content
    await expect(vehicleSection).toContainText(/Vehicle|véhicule/i);
    
    // Should have odometer tracking
    await expect(page.locator('#odometerStart')).toBeVisible();
  });

  test('Mileage Log tab should display Mileage Log content', async ({ page }) => {
    const mileageLogTab = page.locator('.tab-btn[data-tab="mileageLog"]');
    await mileageLogTab.click();
    
    // Wait for content to be visible
    const mileageLogSection = page.locator('#mileageLog');
    await expect(mileageLogSection).toBeVisible();
    
    // Check for mileage log-specific content
    await expect(mileageLogSection).toContainText(/Mileage Log/i);
    
    // Should have trip tracking fields
    await expect(page.locator('#tripDate')).toBeVisible();
    await expect(page.locator('#tripDestination')).toBeVisible();
  });

  test('Vehicle Expenses and Mileage Log should have distinct content', async ({ page }) => {
    // Click Vehicle Expenses tab
    const vehicleTab = page.locator('.tab-btn[data-tab="vehicle"]');
    await vehicleTab.click();
    
    const vehicleSection = page.locator('#vehicle');
    const vehicleContent = await vehicleSection.textContent();
    
    // Click Mileage Log tab
    const mileageLogTab = page.locator('.tab-btn[data-tab="mileageLog"]');
    await mileageLogTab.click();
    
    const mileageLogSection = page.locator('#mileageLog');
    const mileageLogContent = await mileageLogSection.textContent();
    
    // The two sections should have different content
    expect(vehicleContent).not.toBe(mileageLogContent);
    
    // Vehicle Expenses should mention "simplified" or "detailed" methods
    expect(vehicleContent).toMatch(/simplified|simplifiée|detailed|détaillée/i);
    
    // Mileage Log should mention "trip" or "voyage"
    expect(mileageLogContent).toMatch(/trip|voyage/i);
  });

  test('should be able to navigate between tabs without errors', async ({ page }) => {
    // Navigate through several tabs
    const tabs = [
      'vehicle',
      'mileageLog',
      'homeOffice',
      'businessExpenses'
    ];
    
    for (const tabName of tabs) {
      const tab = page.locator(`.tab-btn[data-tab="${tabName}"]`);
      await tab.click();
      
      // Verify the corresponding section is visible
      const section = page.locator(`#${tabName}`);
      await expect(section).toBeVisible();
      
      // Verify the tab is marked as active
      await expect(tab).toHaveClass(/active/);
    }
  });

  test('navigation buttons should not be nested incorrectly', async ({ page }) => {
    // Check that no tab button contains another tab button (which would indicate nesting)
    const nestedButtons = page.locator('.tab-btn .tab-btn');
    await expect(nestedButtons).toHaveCount(0);
  });

  test('all navigation buttons should be properly closed', async ({ page }) => {
    // Get the HTML of the navigation
    const navHTML = await page.locator('nav.tabs').innerHTML();
    
    // Count opening and closing button tags
    const openTags = (navHTML.match(/<button/g) || []).length;
    const closeTags = (navHTML.match(/<\/button>/g) || []).length;
    
    // Should have equal number of opening and closing tags
    expect(openTags).toBe(closeTags);
  });
});
