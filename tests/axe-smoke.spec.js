import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ROUTES = ['/', '/login', '/gallery', '/403', '/verify'];
const VIEWPORTS = [
  { name: 'mobile', width: 360, height: 640 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
];
const THEMES = ['light', 'dark'];

for (const route of ROUTES) {
  for (const theme of THEMES) {
    for (const vp of VIEWPORTS) {
      test(`Axe Contrast: route "${route}" in ${theme} mode on ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.emulateMedia({ reducedMotion: 'reduce' });

        // Set theme before navigation
        await page.addInitScript((mode) => {
          try {
            window.localStorage.setItem('campus_connect_theme', mode);
            window.localStorage.setItem('cc_theme', mode);
          } catch {}
          if (mode === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }, theme);

        await page.goto(route, { waitUntil: 'domcontentloaded' });
        // Settle for fonts, theme transitions, and entrance animations
        await page.waitForTimeout(750);

        // Ensure theme class is applied
        await page.evaluate((mode) => {
          if (mode === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }, theme);

        // Analyze accessibility with AxeBuilder focusing on color contrast
        const accessibilityScanResults = await new AxeBuilder({ page })
          .withRules(['color-contrast'])
          .analyze();

        if (accessibilityScanResults.violations.length > 0) {
          for (const v of accessibilityScanResults.violations) {
            for (const n of v.nodes) {
              console.log(`\n[CONTRAST VIOLATION on ${route} (${theme}, ${vp.name})]:`);
              console.log(`  Target: ${n.target.join(' ')}`);
              console.log(`  HTML: ${n.html}`);
              console.log(`  Issue: ${n.failureSummary}`);
            }
          }
        }

        expect(accessibilityScanResults.violations).toEqual([]);

        // S-N2: Verify every route renders at least one [data-motion] element
        const motionCount = await page.locator('[data-motion]').count();
        expect(motionCount).toBeGreaterThanOrEqual(1);
      });
    }
  }
}
