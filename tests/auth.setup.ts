import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = 'playwright/.auth/user.json';

setup('authenticate and setup project', async ({ page }) => {
  // Navigate to the app
  await page.goto('/');

  // Check if we're on the login page
  const loginHeading = page.getByRole('heading', { name: /welcome back/i });

  if (await loginHeading.isVisible({ timeout: 3000 }).catch(() => false)) {
    // Fill in login credentials
    await page.getByPlaceholder(/enter your username/i).fill('admin');
    await page.getByPlaceholder(/enter your password/i).fill('admin');

    // Click sign in button
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait a moment for navigation
    await page.waitForTimeout(2000);
  }

  // Check if there's an onboarding or project selection screen
  const projectHeading = page.getByRole('heading', { name: /project|workspace|get started/i }).first();

  if (await projectHeading.isVisible({ timeout: 3000 }).catch(() => false)) {
    // Handle project selection/creation if needed
    // Look for a skip button or continue button
    const skipButton = page.getByRole('button', { name: /skip|continue|next/i }).first();
    if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipButton.click();
      await page.waitForTimeout(1000);
    }
  }

  // Try to navigate directly to chat if we're not there
  const chatInput = page.getByPlaceholder(/message/i);
  if (!await chatInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    // Try clicking on a chat or home link
    const chatLink = page.getByRole('link', { name: /chat|home/i }).first();
    if (await chatLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await chatLink.click();
      await page.waitForTimeout(1000);
    }
  }

  // Final check - if still no chat input, take a screenshot for debugging
  if (!await chatInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await page.screenshot({ path: 'playwright/.auth/debug-state.png', fullPage: true });
    console.log('Warning: Chat input not found after setup. Screenshot saved to playwright/.auth/debug-state.png');
  }

  // Save authentication state
  await page.context().storageState({ path: authFile });
});
