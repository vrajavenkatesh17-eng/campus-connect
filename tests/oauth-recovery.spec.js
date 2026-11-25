import { test, expect } from '@playwright/test';

test.describe('OAuth Error Recovery, Single-Shot Guard & Webview Detection', () => {
  test('recovers cleanly on "/" when OAuth state has expired in query params and cleans URL', async ({ page }) => {
    await page.goto(
      '/?error=invalid_request&error_code=bad_oauth_state&error_description=OAuth+state+has+expired',
      { waitUntil: 'domcontentloaded' }
    );
    const alert = page.locator('[role="alert"]').first();
    await expect(alert).toBeVisible({ timeout: 15000 });

    const alertText = await alert.textContent();
    expect(alertText).toContain('Your sign-in took too long or was interrupted. Please try again.');
    expect(alertText).not.toContain('bad_oauth_state');
    expect(alertText).not.toContain('OAuth state has expired');

    await expect(alert.getByRole('button', { name: 'Try again' })).toBeVisible();
    // Verify URL was cleaned with history.replaceState
    expect(page.url()).not.toContain('error=');
    expect(page.url()).not.toContain('bad_oauth_state');
  });

  test('reads OAuth errors from location.hash on /login and cleans URL', async ({ page }) => {
    await page.goto('/login#error=access_denied&error_code=access_denied', {
      waitUntil: 'domcontentloaded',
    });
    const alert = page.locator('[role="alert"]').first();
    await expect(alert).toBeVisible({ timeout: 15000 });

    const alertText = await alert.textContent();
    expect(alertText).toContain('Google sign-in was cancelled.');
    expect(page.url()).not.toContain('access_denied');
  });

  test('disables Google button immediately on click with "Connecting..." state and blocks double-click', async ({ page }) => {
    let oauthNavigations = 0;
    await page.route('**/auth/v1/authorize*', async (route) => {
      oauthNavigations += 1;
      // HTTP 204 keeps the browser on /login so we can inspect the disabled "Connecting..." button
      await route.fulfill({ status: 204, body: '' });
    });

    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    const btn = page.getByTestId('google-signin-btn');
    await expect(btn).toBeVisible({ timeout: 15000 });
    await expect(btn).toBeEnabled();

    await btn.click();
    await expect(btn).toBeDisabled();
    await expect(btn).toContainText('Connecting...');
    expect(oauthNavigations).toBeLessThanOrEqual(1);
  });

  test('displays Chrome/Safari banner when opened in an in-app browser webview', async ({ browser }) => {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 302.0.0.23.109',
    });
    const page = await context.newPage();
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByText('Open this link in Chrome/Safari to sign in with Google.')
    ).toBeVisible({ timeout: 15000 });
    await context.close();
  });
});
