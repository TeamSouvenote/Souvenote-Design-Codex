// Behaviour + accessibility QA for Cart, Delivery and Confirmation.
// All network outside the app is stubbed: order/checkout/fulfillment answer
// from fixtures below; nothing reaches the real backend, Cognito or a payment.
const fs = require('fs');
const path = require('path');
const { BASE, launch, pageWith, CART_ITEMS, FLOW_READY } = require('./lib.js');
const AXE = fs.readFileSync(path.join(__dirname, '..', 'node_modules', 'axe-core', 'axe.min.js'), 'utf8');

const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail }); };

const ORDER = (status) => ({ id: '3f2a9b7c-1111-2222', userId: 'u1', cardDraftId: FLOW_READY.cardDraftId, selectedAssetId: FLOW_READY.selectedAssetId, status });
async function stubOrderApi(ctx, calls, { failStart = false } = {}) {
  const json = (r, body, status = 200) => r.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  await ctx.route(/\/api\/orders$/, (r) => { calls.push('orders'); return json(r, { order: ORDER('pending') }); });
  await ctx.route(/\/api\/checkout\/start$/, (r) => { calls.push('start'); return failStart ? json(r, { message: 'down' }, 503) : json(r, { order: ORDER('checkout_started'), checkoutSession: { id: 'cs_1', orderId: 'o', paymentId: 'p1', status: 'open' } }); });
  await ctx.route(/\/api\/checkout\/mock-success$/, (r) => { calls.push('complete'); return json(r, { order: ORDER('paid_mock'), checkoutSession: { id: 'cs_1', orderId: 'o', paymentId: 'p1', status: 'paid' } }); });
  await ctx.route(/\/api\/fulfillment\/submit$/, (r) => { calls.push('fulfil'); return json(r, { order: ORDER('fulfilled_mock'), fulfillment: { id: 'f1', orderId: 'o', userId: 'u1', mockFulfillmentId: 'mock_ful_1', status: 'submitted' } }); });
}

async function axe(page, label, include) {
  await page.addScriptTag({ content: AXE });
  const r = await page.evaluate(async (inc) => {
    // eslint-disable-next-line no-undef
    const res = await axe.run(inc || document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] });
    return res.violations.map((v) => `${v.id}(${v.nodes.length}): ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' ; ')}`);
  }, include);
  check(`axe ${label}`, r.length === 0, r.join(' || '));
}

async function smallTargets(page, scope) {
  return page.evaluate((sel) => {
    const out = [];
    document.querySelectorAll(`${sel} :is(a[href], button, input, select, summary, [role=switch])`).forEach((el) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const s = getComputedStyle(el);
      if (s.opacity === '0' || s.pointerEvents === 'none') return;
      if (r.height < 44 && r.width < 44) out.push(`${el.tagName}.${el.className}`.slice(0, 60) + ` ${Math.round(r.width)}x${Math.round(r.height)}`);
      else if (Math.min(r.height, r.width) < 24) out.push(`${el.tagName}.${el.className}`.slice(0, 60) + ` ${Math.round(r.width)}x${Math.round(r.height)}`);
    });
    return out;
  }, scope);
}

(async () => {
  const b = await launch();

  // ---------- CART ----------
  for (const [tag, w, h] of [['desk', 1440, 900], ['phone', 390, 844]]) {
    const { ctx, page, errors } = await pageWith(b, w, h, { souv_cart: CART_ITEMS });
    await page.goto(BASE + '/cart', { waitUntil: 'networkidle' });
    check(`cart ${tag} title`, (await page.title()) === 'Cart | Souvenote', await page.title());
    check(`cart ${tag} noindex`, /noindex/.test(await page.locator('meta[name=robots]').getAttribute('content')));
    check(`cart ${tag} single h1`, (await page.locator('h1').count()) === 1);
    await axe(page, `cart ${tag}`);
    const st = await smallTargets(page, '#main');
    check(`cart ${tag} touch targets`, st.length === 0, st.join(', '));
    // Quantity + / -
    const plus = page.getByRole('button', { name: 'Increase quantity' });
    await plus.click();
    check(`cart ${tag} qty +`, (await page.locator('.ct-stepper .ct-qty-num').textContent()) === '3');
    await page.getByRole('button', { name: 'Decrease quantity' }).click();
    check(`cart ${tag} qty -`, (await page.locator('.ct-stepper .ct-qty-num').textContent()) === '2');
    await page.waitForFunction(() => document.querySelector('.souv-cart-badge')?.textContent === '4', null, { timeout: 4000 }).catch(() => {});
    check(`cart ${tag} badge count`, (await page.locator('.souv-cart-badge').textContent()) === '4');
    // Promo
    await page.getByLabel('Promo code').fill('souvenote10');
    await page.getByLabel('Promo code').press('Enter');
    check(`cart ${tag} promo rejected`, await page.locator('#ct-promo-error').isVisible());
    // Remove gift
    await page.getByRole('button', { name: 'Remove Blank Souvenote Gift' }).click();
    check(`cart ${tag} remove`, (await page.locator('.ct-line').count()) === 2);
    // Gift offer is off until V2 (item 11): checkout opens the payment pop-up directly.
    const proceed = page.getByRole('button', { name: /Proceed to checkout/ });
    const co = page.getByRole('dialog', { name: 'Complete your purchase' });
    await proceed.click(); await co.waitFor({ timeout: 4000 }).catch(() => {});
    check(`cart ${tag} no gift offer`, (await page.getByRole('dialog', { name: /Add a blank Souvenote/ }).count()) === 0);
    check(`cart ${tag} checkout focus inside`, await page.evaluate(() => !!document.activeElement?.closest('.fd-dialog')));
    check(`cart ${tag} page inert`, await page.evaluate(() => document.querySelector('main')?.closest('[inert]') !== null));
    const y0 = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(200);
    check(`cart ${tag} scroll locked`, (await page.evaluate(() => window.scrollY)) === y0);
    for (let i = 0; i < 20; i++) await page.keyboard.press('Tab');
    check(`cart ${tag} tab trapped`, await page.evaluate(() => !!document.activeElement?.closest('.fd-dialog')));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
    check(`cart ${tag} escape closes`, (await co.count()) === 0);
    check(`cart ${tag} focus returns`, await page.evaluate(() => document.activeElement?.textContent?.includes('Proceed to checkout')));
    // Backdrop click closes
    await proceed.click(); await co.waitFor({ timeout: 4000 }).catch(() => {});
    await page.waitForTimeout(400);
    await page.mouse.click(5, h - 5);
    await page.waitForTimeout(150);
    check(`cart ${tag} backdrop closes`, (await page.getByRole('dialog').count()) === 0);
    await proceed.click(); await co.waitFor({ timeout: 4000 }).catch(() => {});
    check(`cart ${tag} checkout opens`, await co.isVisible());
    check(`cart ${tag} checkout labels`, await page.getByLabel('Card number').isVisible() && await page.getByLabel('Expiry').isVisible() && await page.getByLabel('CVC').isVisible() && await page.getByLabel('Billing postal code').isVisible());
    await page.getByLabel('Card number').fill('4242424242424242');
    check(`cart ${tag} card format`, (await page.getByLabel('Card number').inputValue()) === '4242 4242 4242 4242');
    await page.getByLabel('Expiry').fill('1229');
    check(`cart ${tag} exp format`, (await page.getByLabel('Expiry').inputValue()) === '12 / 29');
    await page.getByLabel('CVC').fill('123');
    await page.getByLabel('Billing postal code').fill('V6B 1A1');
    check(`cart ${tag} 15-month copy`, await co.getByText('Each card has a 15-month send window.').isVisible());
    const coBox = await co.boundingBox();
    check(`cart ${tag} checkout fits width`, coBox.width <= w, `${coBox.width}`);
    await axe(page, `checkout ${tag}`, '.fd-overlay');
    const st2 = await smallTargets(page, '.fd-overlay');
    check(`checkout ${tag} touch targets`, st2.length === 0, st2.join(', '));
    await co.getByRole('button', { name: /^Pay \$/ }).click();
    await page.waitForTimeout(300);
    check(`cart ${tag} processing state`, await co.getByText('Processing...').first().isVisible());
    await page.waitForTimeout(2500);
    check(`cart ${tag} paid state`, await page.getByRole('heading', { name: 'Payment confirmed' }).isVisible());
    check(`cart ${tag} cart cleared`, ['[]', null].includes(await page.evaluate(() => localStorage.getItem('souv_cart'))));
    check(`cart ${tag} no page errors`, !errors.some((e) => e.startsWith('pageerror')), errors.filter((e) => e.startsWith('pageerror')).join(' | '));
    await ctx.close();
  }

  // Signed out: checkout shows the log-in prompt.
  {
    const { ctx, page } = await pageWith(b, 1440, 900, { souv_cart: CART_ITEMS }, { signedIn: false });
    await page.goto(BASE + '/cart', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Proceed to checkout/ }).click();
    check('cart signed-out auth prompt', await page.getByText('Log in before checkout').isVisible());
    await ctx.close();
  }

  // ---------- DELIVERY ----------
  for (const [tag, w, h] of [['desk', 1440, 900], ['phone', 390, 844]]) {
    const { ctx, page, errors } = await pageWith(b, w, h, { souv_mock_mvp_flow: FLOW_READY });
    const calls = [];
    await stubOrderApi(ctx, calls);
    await page.goto(BASE + '/delivery', { waitUntil: 'networkidle' });
    check(`delivery ${tag} title`, (await page.title()) === 'Delivery | Souvenote');
    check(`delivery ${tag} noindex`, /noindex/.test(await page.locator('meta[name=robots]').getAttribute('content')));
    await axe(page, `delivery ${tag}`);
    const st = await smallTargets(page, '#main');
    check(`delivery ${tag} touch targets`, st.length === 0, st.join(', '));
    const hs = await page.locator('main h1, main h2').allTextContents();
    check(`delivery ${tag} headings`, hs.length >= 5, hs.join(' / '));
    for (const l of ['Title', 'First name', 'Last name', 'Company', 'Address line 1', 'Address line 2', 'Address line 3', 'City', 'Province', 'Postal code', 'Country']) {
      check(`delivery ${tag} label ${l}`, (await page.getByLabel(l, { exact: false }).count()) >= 1);
    }
    // Validation
    await page.getByLabel('First name').first().fill('');
    await page.getByLabel(/Postal code/).first().fill('abc');
    await page.getByRole('button', { name: 'Continue to checkout' }).click();
    await page.waitForTimeout(400);
    check(`delivery ${tag} error modal`, await page.getByText('Address needed').isVisible());
    await page.keyboard.press('Escape');
    const fn = page.getByLabel('First name').first();
    check(`delivery ${tag} aria-invalid`, (await fn.getAttribute('aria-invalid')) === 'true');
    const desc = await fn.getAttribute('aria-describedby');
    check(`delivery ${tag} error linked`, desc && (await page.locator(`[id="${desc}"]`).textContent()) === 'Required');
    check(`delivery ${tag} postal msg`, await page.getByText('Enter a valid postal code').isVisible());
    // Chips
    await page.getByRole('button', { name: 'Schedule' }).click();
    check(`delivery ${tag} schedule date`, await page.getByLabel('Mail-out date').isVisible());
    check(`delivery ${tag} aria-pressed`, (await page.getByRole('button', { name: 'Schedule' }).getAttribute('aria-pressed')) === 'true');
    await page.getByRole('button', { name: 'Send now' }).click();
    // Return switch (whole row toggles)
    const sw = page.getByRole('switch', { name: 'Return address' });
    await sw.click();
    check(`delivery ${tag} switch off`, (await sw.getAttribute('aria-checked')) === 'false' && await page.getByText('No return address').isVisible());
    await page.locator('.dv-toggle-head h2').click({ force: true });
    check(`delivery ${tag} heading row toggles`, (await sw.getAttribute('aria-checked')) === 'true');
    // Multiple recipients: add, edit
    await page.getByRole('button', { name: 'Multiple' }).click();
    await fn.fill('Jo'); await page.getByLabel('Last name').first().fill('Smith');
    await page.getByLabel('Address line 1').first().fill('10 King St W'); await page.getByLabel('City').first().fill('Toronto');
    await page.getByLabel('Province').first().fill('ON'); await page.getByLabel(/Postal code/).first().fill('M5H 1A1');
    await page.getByRole('button', { name: 'Add this address' }).click();
    check(`delivery ${tag} recipient added`, (await page.locator('.dv-recip-item').count()) === 1);
    await page.getByRole('button', { name: 'Edit Jo Smith' }).click();
    check(`delivery ${tag} editing`, await page.getByText('Editing recipient 1').isVisible());
    await page.getByRole('button', { name: 'Save changes' }).click();
    // Send flow (stubbed backend); return address off (empty since 2026-11-06 fixes)
    await sw.click();
    await page.getByRole('button', { name: 'Continue to checkout' }).click();
    await page.getByRole('button', { name: 'Confirm payment' }).waitFor({ timeout: 5000 }).catch(() => {});
    check(`delivery ${tag} checkout started`, await page.getByText('Checkout started').isVisible(), calls.join(','));
    await page.getByRole('button', { name: 'Confirm payment' }).click();
    await page.getByRole('button', { name: 'Send to print' }).waitFor({ timeout: 5000 }).catch(() => {});
    check(`delivery ${tag} payment confirmed`, await page.getByText('Payment confirmed').isVisible());
    await page.getByRole('button', { name: 'Send to print' }).click();
    await page.waitForURL('**/delivery/confirmation', { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(600);
    check(`delivery ${tag} to confirmation`, page.url().endsWith('/delivery/confirmation'), page.url());
    check(`confirm ${tag} heading`, await page.getByRole('heading', { level: 1 }).textContent().then((t) => t.includes('On its way')));
    check(`confirm ${tag} order no`, await page.getByText('SVN-3F2A9B7C').isVisible());
    check(`delivery ${tag} api calls`, calls.join(',') === 'orders,start,complete,fulfil', calls.join(','));
    check(`delivery ${tag} no page errors`, !errors.some((e) => e.startsWith('pageerror')), errors.filter((e) => e.startsWith('pageerror')).join(' | '));
    await ctx.close();
  }

  // Delivery: backend error message + blank gift modal
  {
    const { ctx, page } = await pageWith(b, 1440, 900, { souv_mock_mvp_flow: FLOW_READY, souv_blank_souvenote_pending: '1' });
    const calls = [];
    await stubOrderApi(ctx, calls, { failStart: true });
    await page.goto(BASE + '/delivery', { waitUntil: 'networkidle' });
    await page.getByLabel('First name').first().fill('Jo'); await page.getByLabel('Last name').first().fill('Smith');
    await page.getByLabel('Address line 1').first().fill('10 King St W'); await page.getByLabel('City').first().fill('Toronto');
    await page.getByLabel('Province').first().fill('ON'); await page.getByLabel(/Postal code/).first().fill('M5H 1A1');
    await page.getByRole('switch', { name: 'Return address' }).click();
    await page.getByRole('button', { name: 'Continue to checkout' }).click();
    check('delivery gift pop-up off (V2)', (await page.getByRole('dialog', { name: /blank Souvenote to give/ }).count()) === 0);
    await page.waitForTimeout(800);
    check('delivery start failure title', await page.getByText("Checkout didn't start").isVisible());
    await ctx.close();
  }

  // Confirmation: empty, reduced motion
  {
    const { ctx, page } = await pageWith(b, 390, 844, {}, { motion: 'reduce' });
    await page.goto(BASE + '/delivery/confirmation', { waitUntil: 'networkidle' });
    check('confirm empty title', (await page.title()) === 'Order confirmation | Souvenote');
    check('confirm empty heading', (await page.locator('h1').textContent()).includes('Nothing to confirm yet'));
    check('confirm empty status', await page.getByText('Not started').isVisible());
    await axe(page, 'confirm empty phone');
    await ctx.close();
  }

  const fails = results.filter((r) => !r.ok);
  results.forEach((r) => { if (!r.ok) console.log('FAIL', r.name, r.detail); });
  console.log(`${results.length - fails.length}/${results.length} passed`);
  fs.writeFileSync(path.join(__dirname, 'behaviour-results.json'), JSON.stringify(results, null, 2));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
