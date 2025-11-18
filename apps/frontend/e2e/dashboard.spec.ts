import { test, expect } from '@playwright/test';

/**
 * Dashboard E2E Tests
 * Tests main dashboard functionality and widgets
 */

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    
    // Login
    await page.fill('input[type="email"], input[name="email"]', 'demo@example.com');
    await page.fill('input[type="password"], input[name="password"]', 'Demo123456');
    await page.waitForTimeout(500); // Let form settle
    
    // Wait for login API call and navigation
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for navigation with longer timeout
    await page.waitForURL(/dashboard/i, { timeout: 25000 });
  });

  test('should display dashboard with key metrics', async ({ page }) => {
    // Should see dashboard title
    await expect(page.getByText(/dashboard|overview/i).first()).toBeVisible();
    
    // Should see key metrics
    await expect(page.getByText(/total|revenue|orders|inventory/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('should display charts and visualizations', async ({ page }) => {
    // Check for chart elements (SVG or canvas)
    const chart = page.locator('svg, canvas').first();
    await expect(chart).toBeVisible({ timeout: 5000 });
  });

  test('should display recent activities or notifications', async ({ page }) => {
    // Look for recent activities section
    await expect(
      page.getByText(/recent|activities|notifications|updates/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to different modules from dashboard', async ({ page }) => {
    // Click on inventory module
    const inventoryLink = page.getByRole('link', { name: /inventory/i }).first();
    await inventoryLink.click();
    
    // Should navigate to inventory page
    await expect(page).toHaveURL(/inventory/i, { timeout: 5000 });
  });

  test('should display tenant information', async ({ page }) => {
    // Should see tenant name
    await expect(page.getByText(/Demo Manufacturing|Company/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('should have working navigation menu', async ({ page }) => {
    // Check main navigation items
    await expect(page.getByRole('link', { name: /inventory/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sales/i })).toBeVisible();
  });
});

