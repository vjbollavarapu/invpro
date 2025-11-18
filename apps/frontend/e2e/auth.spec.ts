import { test, expect } from '@playwright/test';

/**
 * Authentication E2E Tests
 * Tests login, registration, and authentication flows
 */

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login page', async ({ page }) => {
    await expect(page).toHaveTitle(/InvPro|Login/i);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  test('should show validation errors for empty login form', async ({ page }) => {
    // Verify form fields have required attribute
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    
    await expect(emailInput).toHaveAttribute('required', '');
    await expect(passwordInput).toHaveAttribute('required', '');
    
    // Form should not submit with empty fields (HTML5 validation)
    const loginButton = page.getByRole('button', { name: /sign in|login/i });
    await loginButton.click();
    
    // Should still be on login page (form didn't submit)
    await expect(page).toHaveURL(/login/);
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Fill in the login form with seed data credentials
    await page.fill('input[type="email"], input[name="email"]', 'demo@example.com');
    await page.fill('input[type="password"], input[name="password"]', 'Demo123456');
    
    // Click login button
    const loginButton = page.getByRole('button', { name: /sign in|login/i });
    await loginButton.click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/dashboard|home/i, { timeout: 10000 });
    
    // Should see user info or dashboard content
    await expect(
      page.getByText(/dashboard|welcome|demo/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('input[type="email"], input[name="email"]', 'wrong@example.com');
    await page.fill('input[type="password"], input[name="password"]', 'WrongPassword123');
    
    const loginButton = page.getByRole('button', { name: /sign in|login/i });
    await loginButton.click();
    
    // Should show error message
    await expect(page.getByText(/invalid|incorrect|failed/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to registration page', async ({ page }) => {
    // Look for sign up link
    const signUpLink = page.getByRole('link', { name: /sign up|register|create account/i });
    await signUpLink.click();
    
    // Should be on registration page
    await expect(page.getByText(/create account|sign up|register/i).first()).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // First login
    await page.fill('input[type="email"], input[name="email"]', 'demo@example.com');
    await page.fill('input[type="password"], input[name="password"]', 'Demo123456');
    
    await Promise.all([
      page.waitForResponse(response => response.url().includes('/api/auth/login') && response.status() === 200),
      page.getByRole('button', { name: /sign in|login/i }).click()
    ]);
    
    await page.waitForURL(/dashboard/i, { timeout: 15000 });
    
    // Wait for dashboard to fully load
    await page.waitForTimeout(3000);
    
    // Look for any button in header area that might be user menu
    // Try clicking on a button that contains user info
    try {
      // Option 1: Look for button with "Demo" text (user name)
      const userButton = page.locator('header button, [role="banner"] button').filter({ hasText: /Demo|Admin/i }).first();
      await userButton.click({ timeout: 3000 });
      await page.waitForTimeout(500);
      
      // Click logout
      await page.getByText(/log out/i).click({ timeout: 3000 });
    } catch (error) {
      // Option 2: If above fails, try finding logout directly
      await page.getByRole('menuitem', { name: /log out|logout/i }).click();
    }
    
    // Should redirect to login page
    await expect(page).toHaveURL(/login/i, { timeout: 5000 });
  });
});

