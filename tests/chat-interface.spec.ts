import { test, expect } from '@playwright/test';

/**
 * Chat Interface Tests
 *
 * NOTE: These tests require manual setup:
 * 1. Start the dev server: npm run dev
 * 2. Navigate to http://localhost:5173 in a browser
 * 3. Log in with your credentials
 * 4. Select or create a project
 * 5. Ensure you're on the chat interface before running tests
 *
 * The tests assume the chat interface is accessible at the root URL after authentication.
 */

test.describe('Chat Interface - Login Required', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('login page is accessible', async ({ page }) => {
    // Verify login page elements
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.getByPlaceholder(/enter your username/i)).toBeVisible();
    await expect(page.getByPlaceholder(/enter your password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('login form accepts input', async ({ page }) => {
    const usernameInput = page.getByPlaceholder(/enter your username/i);
    const passwordInput = page.getByPlaceholder(/enter your password/i);

    await usernameInput.fill('testuser');
    await expect(usernameInput).toHaveValue('testuser');

    await passwordInput.fill('testpassword');
    await expect(passwordInput).toHaveValue('testpassword');
  });

  test('sign in button is clickable', async ({ page }) => {
    const signInButton = page.getByRole('button', { name: /sign in/i });
    await expect(signInButton).toBeEnabled();

    // Fill in credentials first
    await page.getByPlaceholder(/enter your username/i).fill('admin');
    await page.getByPlaceholder(/enter your password/i).fill('admin');

    // Button should still be enabled
    await expect(signInButton).toBeEnabled();
  });
});

// Tests that require authentication - skip for now
test.describe.skip('Chat Interface - Authenticated', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: Implement proper authentication flow
    await page.goto('/');
  });

  test('user can send a message', async ({ page }) => {
    const textarea = page.getByPlaceholder(/message/i);
    await expect(textarea).toBeVisible();

    const testMessage = 'Hello, this is a test message';
    await textarea.fill(testMessage);

    const sendButton = page.getByRole('button', { name: /send/i });
    await expect(sendButton).toBeEnabled();
    await sendButton.click();

    await expect(page.getByText(testMessage)).toBeVisible();
  });

  test('messages appear with correct styling', async ({ page }) => {
    const testMessage = 'Test message for styling';

    const textarea = page.getByPlaceholder(/message/i);
    await textarea.fill(testMessage);

    const sendButton = page.getByRole('button', { name: /send/i });
    await sendButton.click();

    const userMessage = page.locator('.chat-message.user').filter({ hasText: testMessage });
    await expect(userMessage).toBeVisible();

    const messageContainer = userMessage.locator('div.rounded-2xl').first();
    await expect(messageContainer).toHaveClass(/bg-white/);
  });

  test('messages do not disappear after sending', async ({ page }) => {
    const messages = ['First message', 'Second message', 'Third message'];

    const textarea = page.getByPlaceholder(/message/i);
    const sendButton = page.getByRole('button', { name: /send/i });

    for (const message of messages) {
      await textarea.fill(message);
      await sendButton.click();
      await expect(page.getByText(message)).toBeVisible();
    }

    for (const message of messages) {
      await expect(page.getByText(message)).toBeVisible();
    }
  });

  test('copy button works for user messages', async ({ page }) => {
    const testMessage = 'Message to copy';

    const textarea = page.getByPlaceholder(/message/i);
    await textarea.fill(testMessage);

    const sendButton = page.getByRole('button', { name: /send/i });
    await sendButton.click();

    await expect(page.getByText(testMessage)).toBeVisible();

    const userMessage = page.locator('.chat-message.user').filter({ hasText: testMessage });
    const copyButton = userMessage.getByRole('button').first();

    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await copyButton.click();

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(testMessage);
  });

  test('input field clears after sending message', async ({ page }) => {
    const testMessage = 'This should clear after sending';

    const textarea = page.getByPlaceholder(/message/i);
    await textarea.fill(testMessage);

    const sendButton = page.getByRole('button', { name: /send/i });
    await sendButton.click();

    await expect(textarea).toHaveValue('');
  });

  test('send button is disabled when input is empty', async ({ page }) => {
    const textarea = page.getByPlaceholder(/message/i);
    const sendButton = page.getByRole('button', { name: /send/i });

    await expect(textarea).toHaveValue('');
    await expect(sendButton).toBeDisabled();

    await textarea.fill('Some text');
    await expect(sendButton).toBeEnabled();

    await textarea.clear();
    await expect(sendButton).toBeDisabled();
  });

  test('input field accepts multiline text', async ({ page }) => {
    const multilineMessage = 'Line 1\nLine 2\nLine 3';

    const textarea = page.getByPlaceholder(/message/i);
    await textarea.fill(multilineMessage);

    await expect(textarea).toHaveValue(multilineMessage);
  });

  test('chat interface shows timestamp for messages', async ({ page }) => {
    const testMessage = 'Message with timestamp';

    const textarea = page.getByPlaceholder(/message/i);
    await textarea.fill(testMessage);

    const sendButton = page.getByRole('button', { name: /send/i });
    await sendButton.click();

    const userMessage = page.locator('.chat-message.user').filter({ hasText: testMessage });
    await expect(userMessage).toBeVisible();

    const timestamp = userMessage.locator('span').filter({ hasText: /\d{1,2}:\d{2}/ });
    await expect(timestamp).toBeVisible();
  });

  test('user message design has white background', async ({ page }) => {
    const testMessage = 'Design test message';

    const textarea = page.getByPlaceholder(/message/i);
    await textarea.fill(testMessage);

    const sendButton = page.getByRole('button', { name: /send/i });
    await sendButton.click();

    const userMessage = page.locator('.chat-message.user').filter({ hasText: testMessage });
    const messageBubble = userMessage.locator('div.rounded-2xl').first();

    const classes = await messageBubble.getAttribute('class');
    expect(classes).toContain('bg-white');
  });

  test('assistant message design has beige/amber background', async ({ page }) => {
    const assistantMessages = page.locator('.chat-message.assistant');
    const count = await assistantMessages.count();

    if (count === 0) {
      test.skip();
      return;
    }

    const firstAssistantMessage = assistantMessages.first();
    const messageBubble = firstAssistantMessage.locator('div.rounded-2xl').first();

    const classes = await messageBubble.getAttribute('class');
    expect(classes).toMatch(/bg-amber-50|bg-gray-800/);
  });

  test('chat interface is responsive', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    const textarea = page.getByPlaceholder(/message/i);
    await expect(textarea).toBeVisible();

    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(textarea).toBeVisible();

    await page.setViewportSize({ width: 375, height: 667 });
    await expect(textarea).toBeVisible();
  });
});
