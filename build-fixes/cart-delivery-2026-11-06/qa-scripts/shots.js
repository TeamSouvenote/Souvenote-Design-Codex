// Screenshots of Cart, Delivery, Confirmation and their pop-ups at desktop and phone sizes.
const fs = require('fs');
const path = require('path');
const { BASE, launch, pageWith, CART_ITEMS, FLOW_READY, FLOW_DONE } = require('./lib.js');

const OUT = path.join(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });
const SIZES = [['desk', 1440, 900], ['phone', 390, 844]];

(async () => {
  const b = await launch();
  const log = [];
  async function shot(name, w, h, seed, url, act, full = false) {
    const { ctx, page, errors } = await pageWith(b, w, h, seed);
    await page.goto(BASE + url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    if (act) await act(page);
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, name + '.png'), fullPage: full });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    log.push(`${name}: overflowX=${overflow} errors=${errors.length}${errors.length ? ' ' + errors.slice(0, 3).join(' | ') : ''}`);
    await ctx.close();
  }
  for (const [tag, w, h] of SIZES) {
    await shot(`cart-empty-${tag}`, w, h, {}, '/cart');
    await shot(`cart-items-${tag}`, w, h, { souv_cart: CART_ITEMS }, '/cart', null, true);
    await shot(`cart-checkout-${tag}`, w, h, { souv_cart: CART_ITEMS }, '/cart', async (p) => { await p.getByRole('button', { name: /Proceed to checkout/ }).click(); });
    await shot(`cart-giftoffer-${tag}`, w, h, { souv_cart: CART_ITEMS.slice(0, 2) }, '/cart', async (p) => { await p.getByRole('button', { name: /Proceed to checkout/ }).click(); });
    await shot(`delivery-${tag}`, w, h, { souv_mock_mvp_flow: FLOW_READY }, '/delivery', null, true);
    await shot(`delivery-first-${tag}`, w, h, { souv_mock_mvp_flow: FLOW_READY }, '/delivery');
    await shot(`delivery-noflow-${tag}`, w, h, {}, '/delivery');
    await shot(`delivery-errors-${tag}`, w, h, { souv_mock_mvp_flow: FLOW_READY }, '/delivery', async (p) => {
      await p.getByLabel('First name').first().fill('');
      await p.getByLabel(/Postal code/).first().fill('abc');
      await p.getByRole('button', { name: /Continue to checkout/ }).click();
      await p.waitForTimeout(400);
      await p.keyboard.press('Escape');
      await p.getByLabel('First name').first().scrollIntoViewIfNeeded();
    });
    await shot(`delivery-multi-${tag}`, w, h, { souv_mock_mvp_flow: FLOW_READY }, '/delivery', async (p) => {
      await p.getByRole('button', { name: 'Multiple' }).click();
      await p.getByRole('button', { name: /Add this address/ }).click();
      await p.getByRole('button', { name: 'Multiple' }).scrollIntoViewIfNeeded();
    });
    await shot(`delivery-gift-${tag}`, w, h, { souv_mock_mvp_flow: FLOW_READY, souv_blank_souvenote_pending: '1' }, '/delivery', async (p) => {
      await p.getByRole('button', { name: /Continue to checkout/ }).click();
    });
    await shot(`confirm-done-${tag}`, w, h, { souv_mock_mvp_flow: FLOW_DONE }, '/delivery/confirmation', async (p) => { await p.locator('summary').click(); });
    await shot(`confirm-empty-${tag}`, w, h, {}, '/delivery/confirmation');
  }
  console.log(log.join('\n'));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
