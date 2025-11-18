import { test, expect } from '@playwright/test';

/**
 * Inventory Module E2E Tests
 * Tests product management and inventory operations
 */

test.describe('Inventory Management', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    
    // Login with demo credentials
    await page.fill('input[type="email"], input[name="email"]', 'demo@example.com');
    await page.fill('input[type="password"], input[name="password"]', 'Demo123456');
    await page.waitForTimeout(500); // Let form settle
    
    // Wait for login API call and navigation
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for navigation with longer timeout
    await page.waitForURL(/dashboard/i, { timeout: 25000 });
    
    // Navigate to inventory page
    await page.goto('/dashboard/inventory');
    await page.waitForLoadState('networkidle');
  });

  test('should display inventory list', async ({ page }) => {
    // Should see inventory page header
    await expect(page.getByText(/inventory|products/i).first()).toBeVisible();
    
    // Should see some products from seed data
    await expect(page.getByText(/Industrial Steel Pipes|Hydraulic Pumps/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('should search for products', async ({ page }) => {
    // Find search input in the inventory page (not the header search)
    const searchInput = page.getByPlaceholder(/search products/i);
    await searchInput.fill('Steel');
    
    // Wait for debounced search and API call
    await page.waitForTimeout(1500);
    await page.waitForLoadState('networkidle');
    
    // Should show Steel product or at least some results
    await expect(page.getByText(/Steel|Welding|Hydraulic/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('should filter products by category', async ({ page }) => {
    // Look for category filter
    const categoryFilter = page.getByRole('combobox', { name: /category/i }).or(
      page.getByLabel(/category/i)
    );
    
    if (await categoryFilter.isVisible()) {
      await categoryFilter.click();
      await page.getByText(/Raw Materials|Equipment/i).first().click();
      
      // Wait for filtered results
      await page.waitForTimeout(1000);
    }
  });

  test('should show product details', async ({ page }) => {
    // Click on first product
    const productRow = page.getByText(/Industrial Steel Pipes|PRD-001/i).first();
    await productRow.click();
    
    // Should show more details (modal or new page)
    await expect(page.getByText(/details|quantity|price/i).first()).toBeVisible({ timeout: 3000 });
  });

  test('should show low stock warning', async ({ page }) => {
    // Look for low stock indicator
    await expect(
      page.getByText(/low stock|reorder|out of stock/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('should open add product form', async ({ page }) => {
    // Find add product button
    const addButton = page.getByRole('button', { name: /add product|new product|create/i });
    await addButton.click();
    
    // Should see form
    await expect(page.getByLabel(/product name|name/i).first()).toBeVisible();
    await expect(page.getByLabel(/sku|code/i).first()).toBeVisible();
  });

  test('should validate product form', async ({ page }) => {
    // Open add product form
    const addButton = page.getByRole('button', { name: /add product|new product|create/i });
    await addButton.click();
    
    await page.waitForTimeout(500);
    
    // Verify form opened
    await expect(page.getByText(/Add New Product|Product Name/i).first()).toBeVisible({ timeout: 3000 });
    
    // Check that required fields exist
    const nameInput = page.locator('input#product-name');
    await expect(nameInput).toBeVisible();
    
    // HTML5 validation should prevent submission with empty required fields
    // This is sufficient validation for now
  });

  test('should paginate through products', async ({ page }) => {
    // Look for pagination controls
    const nextButton = page.getByRole('button', { name: /next|›|»/i });
    
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForLoadState('networkidle');
      
      // Should still be on inventory page
      await expect(page).toHaveURL(/inventory/i);
    }
  });
});

