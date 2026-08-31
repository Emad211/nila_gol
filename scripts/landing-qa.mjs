import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const outDir = path.resolve('qa-screenshots');
const CLS_GOOD_THRESHOLD = 0.1;
fs.mkdirSync(outDir, { recursive: true });

// ── figma-redesign landing assertions (design-briefs/figma-redesign/PLAN.md §6) ──
// Declarative checks harvested from the per-section sub-agent reports —
// canonical list lives in design-briefs/figma-redesign/qa-assertions.json
// (each fires ONLY when its `when` selector exists, so the suite stays inert
// on pages where the landing is absent).
const REDESIGN_CHECKS = JSON.parse(
  fs.readFileSync(
    path.resolve('design-briefs/figma-redesign/qa-assertions.json'),
    'utf8',
  ),
);

const viewports = [
  { name: 'mobile-360', width: 360, height: 800 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1440', width: 1440, height: 900 },
];

const browser = await chromium.launch({ headless: true });
const failures = [];
const report = [];

for (const viewport of viewports) {
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });

  await page.addInitScript(() => {
    window.__nilaQaCls = 0;
    window.__nilaQaShifts = [];

    const identify = (node) => {
      if (!(node instanceof Element)) return 'unknown';
      if (node.id) return `#${node.id}`;
      const classes = Array.from(node.classList || []).slice(0, 3);
      return `${node.tagName.toLowerCase()}${classes.length ? `.${classes.join('.')}` : ''}`;
    };

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.hadRecentInput) continue;
          window.__nilaQaCls += entry.value;
          const sources = (entry.sources || []).map((source) => ({
            node: identify(source.node),
            previous: source.previousRect
              ? { x: source.previousRect.x, y: source.previousRect.y, width: source.previousRect.width, height: source.previousRect.height }
              : null,
            current: source.currentRect
              ? { x: source.currentRect.x, y: source.currentRect.y, width: source.currentRect.width, height: source.currentRect.height }
              : null,
          }));
          window.__nilaQaShifts.push({ value: entry.value, sources });
        }
      });
      observer.observe({ type: 'layout-shift', buffered: true });
    } catch {
      // Browser support is expected in Chromium, but QA should still run if unavailable.
    }
  });

  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
  });

  // Trigger below-the-fold reveal observers before taking the full-page capture.
  const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < pageHeight; y += Math.max(500, Math.floor(viewport.height * 0.75))) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
    await page.waitForTimeout(45);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(250);

  const metrics = await page.evaluate(() => {
    const visible = (element) => {
      if (!element) return false;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0;
    };

    const box = (selector) => {
      const element = document.querySelector(selector);
      if (!visible(element)) return null;
      const rect = element.getBoundingClientRect();
      return { width: rect.width, height: rect.height, top: rect.top, bottom: rect.bottom };
    };

    const targetBoxes = Array.from(document.querySelectorAll('.hero-button, .hero-link, .home-discovery-search button, .home-edit-add'))
      .filter(visible)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return { label: element.getAttribute('aria-label') || element.textContent.trim().slice(0, 40), width: rect.width, height: rect.height };
      });

    const brokenImages = Array.from(document.images)
      .filter(visible)
      .filter((img) => img.complete && img.naturalWidth === 0)
      .map((img) => img.currentSrc || img.src);

    const h1 = document.querySelector('.hero-title');
    const h1Rect = h1?.getBoundingClientRect();
    const shifts = [...(window.__nilaQaShifts || [])].sort((a, b) => b.value - a.value).slice(0, 8);

    return {
      viewport: { width: innerWidth, height: innerHeight },
      documentWidth: document.documentElement.scrollWidth,
      documentHeight: document.documentElement.scrollHeight,
      cls: Number(window.__nilaQaCls || 0),
      shifts,
      heroTitle: h1?.textContent?.trim() || '',
      heroTitleBox: h1Rect ? { top: h1Rect.top, bottom: h1Rect.bottom, width: h1Rect.width, height: h1Rect.height } : null,
      heroImage: box('.hero-image-frame'),
      primaryCta: box('.hero-button'),
      discoverySearch: box('.home-discovery-search'),
      categoryCount: document.querySelectorAll('.home-category-card').length,
      featuredCount: document.querySelectorAll('.home-edit-card').length,
      targetBoxes,
      brokenImages,
    };
  });

  const issues = [];
  if (metrics.documentWidth > viewport.width + 1) {
    issues.push(`horizontal overflow: document=${metrics.documentWidth}px viewport=${viewport.width}px`);
  }
  if (!metrics.heroTitle || !metrics.heroTitleBox) issues.push('hero H1 missing or invisible');
  if (!metrics.heroImage) issues.push('hero image missing or invisible');
  if (!metrics.primaryCta) issues.push('primary CTA missing or invisible');
  if (!metrics.discoverySearch) issues.push('homepage product search missing or invisible');
  if (metrics.featuredCount < 1) issues.push('featured product edit missing');
  if (metrics.brokenImages.length) issues.push(`broken visible images: ${metrics.brokenImages.length}`);
  if (metrics.cls > CLS_GOOD_THRESHOLD) {
    issues.push(`CLS exceeds good Core Web Vitals target (${CLS_GOOD_THRESHOLD}): ${metrics.cls.toFixed(3)}`);
  }

  // figma-redesign assertions (guarded — inert until their selectors mount).
  const redesignFailures = await page.evaluate(
    (checks, vw) =>
      checks
        .filter((check) => !(check.vp === 'desktop' && vw <= 900))
        .filter((check) => document.querySelector(check.when))
        .map((check) => {
          const el = document.querySelector(check.selector || check.when);
          if (!el) return { name: check.name, issue: 'selector not found' };
          if (check.type === 'style') {
            const value = getComputedStyle(el).getPropertyValue(check.prop).trim();
            return value === check.equals
              ? null
              : { name: check.name, issue: `${check.prop}="${value}", expected "${check.equals}"` };
          }
          if (check.type === 'text') {
            const text = (el.textContent || '').trim();
            return text.includes(check.contains)
              ? null
              : { name: check.name, issue: `text missing «${check.contains}»` };
          }
          if (check.type === 'count') {
            const n = document.querySelectorAll(check.selector || check.when).length;
            return n >= check.min ? null : { name: check.name, issue: `count ${n} < min ${check.min}` };
          }
          return { name: check.name, issue: `unknown check type "${check.type}"` };
        })
        .filter(Boolean),
    REDESIGN_CHECKS,
    viewport.width,
  );
  for (const failure of redesignFailures) issues.push(`redesign: ${failure.name} — ${failure.issue}`);

  for (const target of metrics.targetBoxes) {
    if (target.width < 24 || target.height < 24) {
      issues.push(`undersized target "${target.label}": ${Math.round(target.width)}x${Math.round(target.height)}`);
    }
  }

  const lightPath = path.join(outDir, `${viewport.name}-light.png`);
  await page.screenshot({ path: lightPath, fullPage: true });

  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.waitForTimeout(100);
  const darkPath = path.join(outDir, `${viewport.name}-dark.png`);
  await page.screenshot({ path: darkPath, fullPage: true });

  report.push({ name: viewport.name, issues, metrics });
  if (issues.length) failures.push(...issues.map((issue) => `${viewport.name}: ${issue}`));
  await page.close();
}

await browser.close();
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));

for (const entry of report) {
  console.log(`\n[landing-qa] ${entry.name}: ${entry.issues.length ? 'FAIL' : 'PASS'}`);
  console.log(`  CLS=${entry.metrics.cls.toFixed(3)} categories=${entry.metrics.categoryCount} featured=${entry.metrics.featuredCount}`);
  for (const issue of entry.issues) console.log(`  - ${issue}`);
  if (entry.issues.length && entry.metrics.shifts?.length) {
    console.log('  top layout shifts:');
    for (const shift of entry.metrics.shifts.slice(0, 4)) {
      const nodes = shift.sources.map((source) => source.node).join(', ') || 'unknown';
      console.log(`    ${shift.value.toFixed(4)} — ${nodes}`);
    }
  }
}

if (failures.length) {
  console.error(`\n[landing-qa] ${failures.length} issue(s) detected.`);
  process.exit(1);
}

console.log('\n[landing-qa] all viewport checks passed.');
