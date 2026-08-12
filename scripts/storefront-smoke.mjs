import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const outDir = path.resolve('storefront-smoke-artifacts');
fs.mkdirSync(outDir, { recursive: true });

const cases = [
  { name: 'mobile-390', width: 390, height: 844, mobile: true },
  { name: 'desktop-1440', width: 1440, height: 900, mobile: false },
];

const browser = await chromium.launch({ headless: true });
const failures = [];
const report = [];

async function visible(locator, label) {
  try {
    await locator.waitFor({ state: 'visible', timeout: 6000 });
    return true;
  } catch {
    throw new Error(`${label} is not visible`);
  }
}

for (const testCase of cases) {
  const context = await browser.newContext({
    viewport: { width: testCase.width, height: testCase.height },
    locale: 'fa-IR',
  });
  const page = await context.newPage();
  const issues = [];
  let productName = '';

  try {
    await page.goto(baseUrl, { waitUntil: 'networkidle' });

    await visible(page.locator('.hero-title'), 'home hero');
    await visible(page.locator('.home-discovery-search'), 'home product search');
    await visible(page.locator('.home-edit-card').first(), 'featured product');

    await page.locator('.home-edit-media').first().click();
    await page.waitForURL(/\/products\//, { timeout: 6000 });
    await visible(page.locator('.pdp-name'), 'product title');

    productName = (await page.locator('.pdp-name').textContent())?.trim() || '';
    if (!productName) throw new Error('product name is empty');

    const addButton = page.locator('.pdp-order-btn--cart').first();
    await visible(addButton, 'add-to-cart button');
    if (await addButton.isDisabled()) throw new Error('first smoke product is unexpectedly sold out');
    await addButton.click();

    await page.waitForFunction(() => {
      const label = document.querySelector('.header-cart')?.getAttribute('aria-label') || '';
      return /1\s*کالا/.test(label);
    });

    await page.locator('.header-cart').click();
    await page.waitForURL(/\/cart$/, { timeout: 6000 });
    await visible(page.locator('.cart-title'), 'cart title');

    const cartItemName = (await page.locator('.cart-item-name').first().textContent())?.trim() || '';
    if (cartItemName !== productName) {
      throw new Error(`cart product mismatch: expected "${productName}", got "${cartItemName}"`);
    }

    await page.getByRole('button', { name: 'افزایش تعداد' }).first().click();
    await page.waitForFunction(() => document.querySelector('.qty-value')?.textContent?.trim() === '2');

    // Cart state must survive a full reload; this catches localStorage/provider regressions.
    await page.reload({ waitUntil: 'networkidle' });
    await visible(page.locator('.cart-item-name').first(), 'persisted cart item');
    const persistedQty = (await page.locator('.qty-value').first().textContent())?.trim();
    if (persistedQty !== '2') throw new Error(`cart quantity did not persist after reload (got ${persistedQty})`);

    await page.getByRole('link', { name: 'تکمیل سفارش' }).click();
    await page.waitForURL(/\/checkout$/, { timeout: 6000 });
    await visible(page.locator('.checkout-title'), 'checkout title');
    await visible(page.locator('.checkout-summary'), 'checkout summary');
    await visible(page.locator('.checkout-form'), 'checkout form');

    const summaryText = (await page.locator('.checkout-summary').textContent()) || '';
    if (!summaryText.includes(productName)) throw new Error('checkout summary does not contain the cart product');
    if (!summaryText.includes('× 2') && !summaryText.includes('×۲')) {
      throw new Error('checkout summary does not reflect quantity 2');
    }

    const layout = await page.evaluate(() => {
      const summary = document.querySelector('.checkout-summary')?.getBoundingClientRect();
      const form = document.querySelector('.checkout-form')?.getBoundingClientRect();
      return {
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: innerWidth,
        summaryTop: summary?.top ?? null,
        formTop: form?.top ?? null,
      };
    });

    if (layout.documentWidth > layout.viewportWidth + 1) {
      throw new Error(`checkout horizontal overflow: ${layout.documentWidth}px > ${layout.viewportWidth}px`);
    }
    if (testCase.mobile && layout.summaryTop != null && layout.formTop != null && layout.summaryTop >= layout.formTop) {
      throw new Error('mobile checkout summary is not visually ordered before the form');
    }

    // Validation should focus the first invalid field rather than leaving the user at the submit button.
    await page.locator('.checkout-submit').click();
    await page.waitForTimeout(80);
    const validationState = await page.evaluate(() => ({
      activeName: document.activeElement?.getAttribute?.('name') || '',
      firstError: document.querySelector('.field-error')?.textContent?.trim() || '',
    }));
    if (validationState.activeName !== 'customer_name') {
      throw new Error(`invalid checkout did not focus customer_name (focused: ${validationState.activeName || 'none'})`);
    }
    if (!validationState.firstError) throw new Error('checkout validation did not render an error message');

    await page.screenshot({ path: path.join(outDir, `${testCase.name}-checkout.png`), fullPage: true });
  } catch (error) {
    issues.push(error?.message || String(error));
    try {
      await page.screenshot({ path: path.join(outDir, `${testCase.name}-failure.png`), fullPage: true });
    } catch {
      // best-effort artifact only
    }
  }

  report.push({ name: testCase.name, productName, issues });
  failures.push(...issues.map((issue) => `${testCase.name}: ${issue}`));
  await context.close();
}

await browser.close();
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));

for (const entry of report) {
  console.log(`\n[storefront-smoke] ${entry.name}: ${entry.issues.length ? 'FAIL' : 'PASS'}`);
  if (entry.productName) console.log(`  product: ${entry.productName}`);
  for (const issue of entry.issues) console.log(`  - ${issue}`);
}

if (failures.length) {
  console.error(`\n[storefront-smoke] ${failures.length} issue(s) detected.`);
  process.exit(1);
}

console.log('\n[storefront-smoke] critical purchase journey passed on mobile and desktop.');
