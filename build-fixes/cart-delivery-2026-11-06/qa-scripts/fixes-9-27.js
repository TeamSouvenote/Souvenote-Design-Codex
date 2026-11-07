// QA for build-fixes items 9, 11-18, 20-22, 24, 25, 27 (2026-11-06). Every outside request is stubbed.
const fs = require('fs');
const path = require('path');
const { BASE, launch, pageWith, CART_ITEMS, FLOW_READY, FLOW_DONE } = require('./lib.js');
const AXE = fs.readFileSync(path.join(__dirname, '..', 'node_modules', 'axe-core', 'axe.min.js'), 'utf8');

const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok: !!ok, detail: String(detail) });
async function axe(page, label, include) {
  await page.addScriptTag({ content: AXE });
  const r = await page.evaluate(async (inc) => {
    const res = await axe.run(inc || document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] });
    return res.violations.map((v) => `${v.id}(${v.nodes.length}): ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' ; ')}`);
  }, include);
  check(`axe ${label}`, r.length === 0, r.join(' || '));
}
const ORDER = (status) => ({ id: '3f2a9b7c-1111-2222', userId: 'u1', cardDraftId: FLOW_READY.cardDraftId, selectedAssetId: FLOW_READY.selectedAssetId, status });
async function stubOrderApi(ctx, calls, bodies) {
  const json = (r, body) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  await ctx.route(/\/api\/orders$/, (r) => { calls.push('orders'); bodies.push(JSON.parse(r.request().postData() || '{}')); return json(r, { order: ORDER('pending') }); });
  await ctx.route(/\/api\/checkout\/start$/, (r) => { calls.push('start'); return json(r, { order: ORDER('checkout_started'), checkoutSession: { id: 'cs_1', orderId: 'o', paymentId: 'p1', status: 'open' } }); });
  await ctx.route(/\/api\/checkout\/mock-success$/, (r) => { calls.push('complete'); return json(r, { order: ORDER('paid_mock'), checkoutSession: { id: 'cs_1', orderId: 'o', paymentId: 'p1', status: 'paid' } }); });
  await ctx.route(/\/api\/fulfillment\/submit$/, (r) => { calls.push('fulfil'); return json(r, { order: ORDER('fulfilled_mock'), fulfillment: { id: 'f1', orderId: 'o', userId: 'u1', mockFulfillmentId: 'mock_ful_1', status: 'submitted' } }); });
}
async function fillRecipient(page) {
  const rec = page.locator('.dv-section').first();
  await rec.getByLabel('First name').fill('Jordan'); await rec.getByLabel('Last name').fill('Lee');
  await rec.getByLabel('Address line 1').fill('10 King St W'); await rec.getByLabel('City').fill('Toronto');
  await rec.getByLabel('Province').fill('ON'); await rec.getByLabel(/Postal code/).fill('M5H 1A1');
}

(async () => {
  const b = await launch();

  // ---------- Cart: 11 (no gift offer), 12, 13, 14, 25 ----------
  {
    const { ctx, page, errors } = await pageWith(b, 1440, 900, { souv_cart: CART_ITEMS.filter((i) => i.type !== 'gift') });
    await page.goto(BASE + '/cart', { waitUntil: 'networkidle' });
    check('cart 25 no hyphen dash', await page.getByText(/ready to check out: cards, packs, and credits all in one go\./).isVisible());
    await page.getByRole('button', { name: /Proceed to checkout/ }).click();
    const co = page.getByRole('dialog', { name: 'Complete your purchase' });
    await co.waitFor({ timeout: 4000 }).catch(() => {});
    check('cart 11 no gift offer, straight to payment', await co.isVisible() && (await page.getByText('Add a blank').count()) === 0);
    check('checkout 13 no address tax line', (await co.getByText(/calculated from your delivery address|calculated at your delivery address/).count()) === 0);
    check('checkout 13 send window kept', await co.getByText('Each card has a 15-month send window.').isVisible());
    check('checkout 13 GST line kept', await co.getByText('GST (5%)').isVisible());
    await co.getByRole('button', { name: '← Back to cart' }).click();
    await page.waitForTimeout(300);
    check('checkout 14 back to cart stays', page.url().endsWith('/cart') && (await page.getByRole('dialog').count()) === 0 && (await page.locator('.ct-line').count()) === 2, page.url());
    await page.getByRole('button', { name: /Proceed to checkout/ }).click();
    await co.getByLabel('Card number').fill('4242424242424242'); await co.getByLabel('Expiry').fill('1229');
    await co.getByLabel('CVC').fill('123'); await co.getByLabel('Billing postal code').fill('V6B 1A1');
    await co.getByRole('button', { name: /^Pay \$/ }).click();
    await page.getByRole('heading', { name: 'Payment confirmed' }).waitFor({ timeout: 6000 }).catch(() => {});
    check('cart 12 no made-up order number', await page.getByText('Thank you. Your order is in. A receipt is on its way to your inbox,').isVisible() && (await page.getByText(/SV-\d/).count()) === 0);
    check('cart no page errors', !errors.some((e) => e.startsWith('pageerror')), errors.join(' | '));
    await ctx.close();
  }

  // ---------- Delivery ----------
  for (const [tag, w, h] of [['desk', 1440, 900], ['phone', 390, 844]]) {
    const assets = [{ id: 'asset-9c1d0000', kind: 'image', type: 'image', assetType: 'image', mockUrl: 'mock://souvenote/card-image.png' }];
    const { ctx, page, errors } = await pageWith(b, w, h, { souv_mock_mvp_flow: { ...FLOW_READY, generatedAssets: assets }, souv_blank_souvenote_pending: '1' });
    const calls = []; const bodies = [];
    await stubOrderApi(ctx, calls, bodies);
    await page.goto(BASE + '/delivery', { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const keep = page.locator('.dv-keepsake');
    const keepText = await keep.textContent();
    check(`delivery ${tag} 9 no sample content`, !/To the moon|Cameron|Mom|Slow R&B|Cinematic/.test(keepText), keepText);
    check(`delivery ${tag} 9 empty frame for mock image`, (await keep.locator('.dv-art.is-empty').count()) === 1 && (await keep.locator('img').count()) === 0);
    check(`delivery ${tag} 9 no song line without song`, (await keep.getByText('QR-code song').count()) === 0 && (await keep.getByText('Song QR printed inside').count()) === 0);
    check(`delivery ${tag} 11 no gift banner`, (await page.getByText('You have a blank Souvenote to give').count()) === 0);
    check(`delivery ${tag} 24 plain shipping line`, await page.getByText('Standard shipping, included').isVisible() && (await page.getByRole('radiogroup', { name: 'Shipping speed' }).count()) === 0);
    check(`delivery ${tag} 18 back default build`, (await page.getByRole('link', { name: 'Back to review' }).getAttribute('href')) === '/create/build-my-card#review');
    await axe(page, `delivery ${tag}`);

    // 15: schedule requires a date, tomorrow or later
    await fillRecipient(page);
    await page.getByRole('switch', { name: 'Return address' }).click();
    await page.getByRole('button', { name: 'Schedule' }).click();
    const dateField = page.getByLabel(/Mail-out date/);
    const min = await dateField.getAttribute('min');
    const t = new Date(); t.setDate(t.getDate() + 1);
    const tomorrow = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    check(`delivery ${tag} 15 min tomorrow`, min === tomorrow, `${min} vs ${tomorrow}`);
    await page.getByRole('button', { name: 'Continue to checkout' }).click();
    await page.waitForTimeout(600);
    const dd = await dateField.getAttribute('aria-describedby');
    check(`delivery ${tag} 15 no date blocked`, calls.length === 0 && (await dateField.getAttribute('aria-invalid')) === 'true' && dd && (await page.locator(`[id="${dd}"]`).textContent()) === 'Choose a mail-out date.', calls.join(','));
    check(`delivery ${tag} 15 focus to date`, await page.evaluate(() => document.activeElement?.getAttribute('data-dlv-field') === 'mailDate'));
    await axe(page, `delivery date error ${tag}`, '.dv-schedule');
    await dateField.fill('2020-01-01');
    check(`delivery ${tag} 15 error clears on change`, (await dateField.getAttribute('aria-invalid')) === null);
    await page.getByRole('button', { name: 'Continue to checkout' }).click();
    await page.waitForTimeout(500);
    check(`delivery ${tag} 15 past date blocked`, calls.length === 0 && (await dateField.getAttribute('aria-invalid')) === 'true');
    await dateField.fill(tomorrow);
    await page.getByRole('button', { name: 'Continue to checkout' }).click();
    // 11: gift pop-up skipped, goes straight to checkout
    await page.getByText('Checkout started').waitFor({ timeout: 5000 }).catch(() => {});
    check(`delivery ${tag} 11 no gift pop-up, order sent`, calls[0] === 'orders' && (await page.getByRole('dialog').count()) === 0, calls.join(','));
    await page.getByRole('button', { name: 'Confirm payment' }).click();
    await page.getByRole('button', { name: 'Send to print' }).waitFor({ timeout: 5000 }).catch(() => {});
    await page.getByRole('button', { name: 'Send to print' }).click();
    await page.waitForURL('**/delivery/confirmation', { timeout: 8000 }).catch(() => {});
    check(`delivery ${tag} 16 straight to confirmation, no pop-up`, page.url().endsWith('/delivery/confirmation') && (await page.getByText('Estimated arrival').count()) === 0, page.url());
    check(`delivery ${tag} no page errors`, !errors.some((e) => e.startsWith('pageerror')), errors.join(' | '));
    await ctx.close();
  }

  // 9: a real image address is shown
  {
    const assets = [{ id: 'asset-9c1d0000', assetType: 'image', type: 'image', mockUrl: 'https://example.invalid/front.png' }, { id: 's1', assetType: 'song', type: 'song' }];
    const { ctx, page } = await pageWith(b, 1440, 900, { souv_mock_mvp_flow: { ...FLOW_READY, generatedAssets: assets } });
    await page.goto(BASE + '/delivery', { waitUntil: 'networkidle' });
    check('delivery 9 real image shown', (await page.locator('.dv-art.has-image img').getAttribute('src')) === 'https://example.invalid/front.png');
    check('delivery 9 song tag only with real song', await page.getByText('Song QR printed inside').isVisible());
    await ctx.close();
  }

  // 18: back link follows the source
  for (const [src, href] of [['personalize', '/create/personalize-a-template'], ['saved', '/create/my-cards-and-songs'], ['build', '/create/build-my-card#review']]) {
    const { ctx, page } = await pageWith(b, 1440, 900, { souv_mock_mvp_flow: FLOW_READY });
    await ctx.addInitScript((s) => sessionStorage.setItem('souv_delivery_source', s), src);
    await page.goto(BASE + '/delivery', { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    check(`delivery 18 back from ${src}`, (await page.getByRole('link', { name: 'Back to review' }).getAttribute('href')) === href);
    await ctx.close();
  }

  // 20, 25: top-up pop-up copy (not reachable in the UI; open it through the dev hook)
  // Skipped: needsCardTopUp is off (item 8). Copy is checked in the source instead.
  {
    const src = fs.readFileSync(path.join(process.env.REPO || 'C:/Users/wilso/Desktop/Souvenote AWS DESIGN', 'frontend/app/components/Delivery.tsx'), 'utf8');
    // 2026-11-07: the old built-in top-up pop-up (items 20/25) was replaced by the shared Top up cards pop-up.
    check('delivery 20/25 old pop-up removed', !src.includes('Top up your card balance') && !src.includes('Bulk, multi or single'));
    check('delivery opens the Top up cards pop-up', src.includes('openTopUp("cards", "/delivery")'));
  }

  // 17: signed out -> sent to /
  for (const route of ['/delivery', '/delivery/confirmation']) {
    const { ctx, page } = await pageWith(b, 1440, 900, { souv_mock_mvp_flow: FLOW_READY }, { signedIn: false });
    await page.goto(BASE + route, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    check(`17 signed out ${route} -> /`, new URL(page.url()).pathname === '/', page.url());
    await ctx.close();
  }
  {
    const { ctx, page } = await pageWith(b, 1440, 900, { souv_cart: CART_ITEMS }, { signedIn: false });
    await page.goto(BASE + '/cart', { waitUntil: 'networkidle' });
    check('17 cart still open signed out', new URL(page.url()).pathname === '/cart');
    await ctx.close();
  }

  // 22: Confirmation never shows "Nothing to confirm yet" when an order is stored
  {
    const { ctx, page } = await pageWith(b, 390, 844, { souv_mock_mvp_flow: FLOW_DONE });
    await ctx.addInitScript(() => {
      window.__sawEmpty = false;
      new MutationObserver(() => {
        const h = document.querySelector('.dc-wrap h1');
        if (h && h.textContent.includes('Nothing to') && getComputedStyle(h).visibility !== 'hidden') window.__sawEmpty = true;
      }).observe(document, { subtree: true, childList: true, characterData: true, attributes: true });
    });
    await page.goto(BASE + '/delivery/confirmation', { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    check('confirm 22 no empty flash', !(await page.evaluate(() => window.__sawEmpty)));
    check('confirm 22 shows order', (await page.locator('h1').textContent()).includes('On its way') && await page.locator('h1').isVisible());
    await ctx.close();
  }

  // 27: error pop-up focus trap, scroll lock, focus return
  {
    const { ctx, page } = await pageWith(b, 1440, 900, { souv_mock_mvp_flow: FLOW_READY });
    await page.goto(BASE + '/delivery', { waitUntil: 'networkidle' });
    const btn = page.getByRole('button', { name: 'Continue to checkout' });
    await btn.click();
    const dlg = page.getByRole('alertdialog', { name: 'Address needed' });
    await dlg.waitFor({ timeout: 4000 }).catch(() => {});
    check('27 error pop-up labelled', await dlg.isVisible());
    check('27 focus on Got it', await page.evaluate(() => document.activeElement?.textContent === 'Got it'));
    for (let i = 0; i < 5; i++) await page.keyboard.press('Tab');
    check('27 tab trapped', await page.evaluate(() => !!document.activeElement?.closest('.bmc-modal')));
    const y0 = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, 600); await page.waitForTimeout(200);
    check('27 scroll locked', (await page.evaluate(() => window.scrollY)) === y0);
    check('27 page inert', await page.evaluate(() => !!document.querySelector('main')?.closest('[inert]')));
    await axe(page, 'error pop-up', '.bmc-modal-wrap');
    await page.keyboard.press('Escape'); await page.waitForTimeout(200);
    check('27 escape closes', (await dlg.count()) === 0);
    check('27 focus returns', await page.evaluate(() => document.activeElement?.textContent?.includes('Continue to checkout')));
    await btn.click(); await dlg.waitFor({ timeout: 4000 }).catch(() => {});
    await page.getByRole('button', { name: 'Got it' }).click(); await page.waitForTimeout(200);
    check('27 Got it closes', (await dlg.count()) === 0 && !(await page.evaluate(() => !!document.querySelector('main')?.closest('[inert]'))));
    await ctx.close();
  }

  const fails = results.filter((r) => !r.ok);
  fails.forEach((r) => console.log('FAIL', r.name, r.detail));
  console.log(`${results.length - fails.length}/${results.length} passed`);
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
