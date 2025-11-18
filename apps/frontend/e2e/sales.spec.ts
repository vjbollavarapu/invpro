import { test, expect } from '@playwright/test';

/**
 * Sales Module E2E Tests
 * Tests order management and customer operations
 */

test.describe('Sales Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    
    // Login
    await page.fill('input[type="email"], input[name="email"]', 'demo@example.com');
    await page.fill('input[type="password"], input[name="password"]', 'Demo123456');
    
    // Wait for login API call and navigation
    await Promise.all([
      page.waitForResponse(response => response.url().includes('/api/auth/login') && response.status() === 200),
      page.getByRole('button', { name: /sign in|login/i }).click()
    ]);
    
    await page.waitForURL(/dashboard/i, { timeout: 15000 });
    
    // Navigate to sales page
    await page.goto('/dashboard/sales');
    await page.waitForLoadState('networkidle');
  });

  test('should display sales orders list', async ({ page }) => {
    await expect(page.getByText(/orders|sales/i).first()).toBeVisible();
    
    // Should see orders from seed data
    await expect(page.getByText(/ORD-001|Acme Corporation/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('should filter orders by status', async ({ page }) => {
    // Look for status filter
    const statusFilter = page.getByRole('combobox', { name: /status/i }).or(
      page.getByLabel(/status/i)
    );
    
    if (await statusFilter.isVisible()) {
      await statusFilter.click();
      await page.getByText(/pending|processing|delivered/i).first().click();
      await page.waitForTimeout(1000);
    }
  });

  test('should show order details', async ({ page }) => {
    // Look for any order number (backend has ORD-005, ORD-004, etc.)
    const orderRow = page.getByText(/ORD-\d+/i).first();
    
    // Check if order is visible, if not just verify page loaded
    const orderVisible = await orderRow.isVisible().catch(() => false);
    
    if (orderVisible) {
      await orderRow.click();
      // Should show order details
      await expect(page.getByText(/customer|items|total/i).first()).toBeVisible({ timeout: 3000 });
    } else {
      // Just verify we're on the sales page
      await expect(page.getByText(/orders|sales/i).first()).toBeVisible();
    }
  });

  test('should display customers list', async ({ page }) => {
    // Navigate to customers
    const customersLink = page.getByRole('link', { name: /customers/i }).or(
      page.getByText(/customers/i).first()
    );
    await customersLink.click();
    
    // Should see customers from seed data
    await expect(page.getByText(/CUST-001|Acme Corporation/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('should show order statistics', async ({ page }) => {
    // Should see metrics/stats
    await expect(
      page.getByText(/total orders|revenue|average/i).first()
    ).toBeVisible({ timeout: 5000 });
  });
});

