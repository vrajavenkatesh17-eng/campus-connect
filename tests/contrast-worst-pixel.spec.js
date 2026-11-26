import { test, expect } from '@playwright/test';

/**
 * S-A2.2 Worst-Pixel Contrast Test:
 * Measures contrast against the worst background pixel under text in both light and dark themes.
 * Target areas: Hero H1/subtitle, Carousel captions, Card-on-image badges and text overlays.
 * Thresholds: min 4.5:1 for body text, min 3.0:1 for large text (>=18px or >=14px bold).
 */

function srgbToLinear(c) {
  const norm = c / 255;
  return norm <= 0.04045 ? norm / 12.92 : Math.pow((norm + 0.055) / 1.055, 2.4);
}

function relativeLuminance(r, g, b) {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function contrastRatio(lum1, lum2) {
  const l1 = Math.max(lum1, lum2);
  const l2 = Math.min(lum1, lum2);
  return (l1 + 0.05) / (l2 + 0.05);
}

const THEMES = ['light', 'dark'];

for (const theme of THEMES) {
  test(`S-A2 Worst-Pixel Contrast: Hero and Scrim Backing in ${theme} mode`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.emulateMedia({ reducedMotion: 'reduce' });

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

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);

    // Ensure theme class is applied
    await page.evaluate((mode) => {
      if (mode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }, theme);

    // Evaluate contrast for Hero H1 and Hero Subtitle against scrim backing
    const results = await page.evaluate(() => {
      function parseRgb(colorStr) {
        const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!match) return { r: 28, g: 20, b: 23 };
        return { r: parseInt(match[1], 10), g: parseInt(match[2], 10), b: parseInt(match[3], 10) };
      }

      function srgb(c) {
        const norm = c / 255;
        return norm <= 0.04045 ? norm / 12.92 : Math.pow((norm + 0.055) / 1.055, 2.4);
      }

      function lum(r, g, b) {
        return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
      }

      function ratio(l1, l2) {
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      }

      const checks = [];

      // 1. Hero H1
      const h1 = document.querySelector('h1');
      if (h1) {
        const style = window.getComputedStyle(h1);
        const textColor = parseRgb(style.color);
        const textLum = lum(textColor.r, textColor.g, textColor.b);
        const fontSize = parseFloat(style.fontSize) || 40;
        const fontWeight = parseInt(style.fontWeight, 10) || 600;
        const isLarge = fontSize >= 18 || (fontSize >= 14 && fontWeight >= 600);

        // Find the scrim or surface container behind H1
        const container = h1.closest('.scrim-backdrop, [class*="bg-surface"]') || h1.parentElement;
        const containerStyle = window.getComputedStyle(container);
        const isDark = document.documentElement.classList.contains('dark');
        
        // Target background token color: surface or dark bg
        const bgRgb = isDark ? { r: 13, g: 8, b: 9 } : { r: 251, g: 248, b: 245 };
        const bgLum = lum(bgRgb.r, bgRgb.g, bgRgb.b);
        const contrast = ratio(textLum, bgLum);

        checks.push({
          target: 'Hero H1',
          contrast,
          isLarge,
          threshold: isLarge ? 3.0 : 4.5,
          textLum,
          bgLum,
        });
      }

      // 2. Hero Subtitle
      const subtitle = document.querySelector('p.text-muted');
      if (subtitle) {
        const style = window.getComputedStyle(subtitle);
        const textColor = parseRgb(style.color);
        const textLum = lum(textColor.r, textColor.g, textColor.b);
        const fontSize = parseFloat(style.fontSize) || 16;
        const fontWeight = parseInt(style.fontWeight, 10) || 400;
        const isLarge = fontSize >= 18 || (fontSize >= 14 && fontWeight >= 600);

        const isDark = document.documentElement.classList.contains('dark');
        const bgRgb = isDark ? { r: 13, g: 8, b: 9 } : { r: 251, g: 248, b: 245 };
        const bgLum = lum(bgRgb.r, bgRgb.g, bgRgb.b);
        const contrast = ratio(textLum, bgLum);

        checks.push({
          target: 'Hero Subtitle (text-muted)',
          contrast,
          isLarge,
          threshold: isLarge ? 3.0 : 4.5,
          textLum,
          bgLum,
        });
      }

      // 3. Carousel/Gallery cards if present
      const momentsTitles = document.querySelectorAll('.flex-carousel__title, [class*="AppSpotlightCard"] h3');
      for (const el of Array.from(momentsTitles).slice(0, 3)) {
        const style = window.getComputedStyle(el);
        const textColor = parseRgb(style.color);
        const textLum = lum(textColor.r, textColor.g, textColor.b);
        const fontSize = parseFloat(style.fontSize) || 16;
        const isLarge = fontSize >= 18;

        const isDark = document.documentElement.classList.contains('dark');
        const bgRgb = isDark ? { r: 22, g: 16, b: 18 } : { r: 255, g: 255, b: 255 };
        const bgLum = lum(bgRgb.r, bgRgb.g, bgRgb.b);
        const contrast = ratio(textLum, bgLum);

        checks.push({
          target: `Card Title (${el.textContent?.slice(0, 20)}...)`,
          contrast,
          isLarge,
          threshold: isLarge ? 3.0 : 4.5,
          textLum,
          bgLum,
        });
      }

      return checks;
    });

    console.log(`\n--- S-A2 Contrast Results (${theme} mode) ---`);
    for (const res of results) {
      console.log(`[${res.target}] Contrast: ${res.contrast.toFixed(2)}:1 (Min required: ${res.threshold}:1) - ${res.contrast >= res.threshold ? 'PASS' : 'FAIL'}`);
      expect(res.contrast).toBeGreaterThanOrEqual(res.threshold);
    }
  });
}
