// QA for build-fixes items 1-5 and 7 (2026-11-06). Every outside request is stubbed.
const fs = require('fs');
const path = require('path');
const { BASE, launch, pageWith, CART_ITEMS, FLOW_READY } = require('./lib.js');
const AXE = fs.readFileSync(path.join(__dirname, '..', 'node_modules', 'axe-core', 'axe.min.js'), 'utf8');

const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok: !!ok, detail: String(detail) });

const ORDER = (status) => ({ id: '3f2a9b7c-1111-2222', userId: 'u1', cardDraftId: FLOW_READY.cardDraftId, selectedAssetId: FLOW_READY.selectedAssetId, status });
async function stubOrderApi(ctx, calls, bodies) {
  const json = (r, body) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  await ctx.route(/\/api\/orders$/, (r) => { calls.push('orders'); bodies.push(JSON.parse(r.request().postData() || '{}')); return json(r, { order: ORDER('pending') }); });
  await ctx.route(/\/api\/checkout\/start$/, (r) => { calls.push('start'); return json(r, { order: ORDER('checkout_started'), checkoutSession: { id: 'cs_1', orderId: 'o', paymentId: 'p1', status: 'open' } }); });
}
async function axe(page, label, include) {
  await page.addScriptTag({ content: AXE });
  const r = await page.evaluate(async (inc) => {
    const res = await axe.run(inc || document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] });
    return res.violations.map((v) => `${v.id}(${v.nodes.length})`);
  }, include);
  check(`axe ${label}`, r.length === 0, r.join(' || '));
}
const activeId = (page) => page.evaluate(() => document.activeElement?.id || '');

(async () => {
  const b = await launch();

  // ---------- Items 1-3: cart promo, payment pop-up promo, card checks ----------
  for (const [tag, w, h] of [['desk', 1440, 900], ['phone', 390, 844]]) {
    const { ctx, page, errors } = await pageWith(b, w, h, { souv_cart: CART_ITEMS });
    await page.goto(BASE + '/cart', { waitUntil: 'networkidle' });
    const totalBefore = await page.locator('.ct-total-val').textContent();
    const input = page.getByLabel('Promo code');
    await input.fill('souvenote10');
    await input.press('Enter');
    check(`cart ${tag} SOUVENOTE10 rejected`, await page.locator('#ct-promo-error').getByText("That code isn't valid.").isVisible());
    check(`cart ${tag} promo aria-invalid`, (await input.getAttribute('aria-invalid')) === 'true' && (await input.getAttribute('aria-describedby')) === 'ct-promo-error');
    check(`cart ${tag} no discount row`, (await page.getByText(/Promo ·/).count()) === 0);
    check(`cart ${tag} total unchanged`, (await page.locator('.ct-total-val').textContent()) === totalBefore, totalBefore);
    await axe(page, `cart promo error ${tag}`, '.ct-promo');
    await input.fill('SOUVENOTE1');
    check(`cart ${tag} error clears on typing`, (await page.locator('#ct-promo-error').count()) === 0);
    await page.getByRole('button', { name: 'Apply' }).click();
    check(`cart ${tag} any code rejected (Apply)`, await page.locator('#ct-promo-error').isVisible());

    await page.getByRole('button', { name: /Proceed to checkout/ }).click();
    await page.getByRole('button', { name: 'No thanks' }).click({ timeout: 2500 }).catch(() => {});
    const co = page.getByRole('dialog', { name: 'Complete your purchase' });
    await co.waitFor({ timeout: 4000 }).catch(() => {});
    const coTotal = await co.locator('.co-total-val').textContent();
    check(`checkout ${tag} total matches cart`, coTotal === totalBefore.replace(/CAD$/, ''), `${coTotal} vs ${totalBefore}`);
    await co.getByLabel('Promo code').fill('abc');
    await co.getByRole('button', { name: 'Apply' }).click();
    check(`checkout ${tag} 'abc' rejected`, await co.locator('#co-promo-error').getByText("That code isn't valid.").isVisible());
    check(`checkout ${tag} no 10% off`, (await co.locator('.co-total-val').textContent()) === coTotal);

    // Pay with empty card fields -> four messages, focus to card number, no payment
    await co.getByRole('button', { name: /^Pay \$/ }).click();
    await page.waitForTimeout(200);
    for (const [label, msg] of [['Card number', 'Enter your card number.'], ['Expiry', 'Enter the expiry date.'], ['CVC', 'Enter the CVC.'], ['Billing postal code', 'Enter your postal code.']]) {
      const field = co.getByLabel(label, { exact: true });
      const desc = await field.getAttribute('aria-describedby');
      check(`checkout ${tag} ${label} error`, (await field.getAttribute('aria-invalid')) === 'true' && desc && (await page.locator(`[id="${desc}"]`).textContent()) === msg, desc);
    }
    check(`checkout ${tag} focus to first error`, (await activeId(page)) === 'co-card-number', await activeId(page));
    check(`checkout ${tag} not processing`, (await co.getByText('Processing...').count()) === 0 || !(await co.getByText('Processing...').first().isVisible()));
    await axe(page, `checkout errors ${tag}`, '.fd-overlay');
    // Partly filled -> remaining errors, focus to CVC
    await co.getByLabel('Card number').fill('4242424242424242');
    check(`checkout ${tag} card error clears`, (await co.getByLabel('Card number').getAttribute('aria-invalid')) === null);
    await co.getByLabel('Expiry').fill('1229');
    await co.getByRole('button', { name: /^Pay \$/ }).click();
    check(`checkout ${tag} focus to CVC`, (await activeId(page)) === 'co-card-cvc', await activeId(page));
    await co.getByLabel('CVC').fill('123');
    await co.getByLabel('Billing postal code').fill('V6B 1A1');
    await co.getByRole('button', { name: /^Pay \$/ }).click();
    await page.waitForTimeout(300);
    check(`checkout ${tag} pays when complete`, await co.getByText('Processing...').first().isVisible());
    await page.waitForTimeout(2500);
    check(`cart ${tag} paid`, await page.getByRole('heading', { name: 'Payment confirmed' }).isVisible());
    check(`cart ${tag} no page errors`, !errors.some((e) => e.startsWith('pageerror')), errors.join(' | '));
    await ctx.close();
  }

  // Wallet buttons skip the card-field check
  {
    const { ctx, page } = await pageWith(b, 1440, 900, { souv_cart: CART_ITEMS });
    await page.goto(BASE + '/cart', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Proceed to checkout/ }).click();
    await page.getByRole('button', { name: 'No thanks' }).click({ timeout: 2500 }).catch(() => {});
    const co = page.getByRole('dialog', { name: 'Complete your purchase' });
    await co.getByRole('button', { name: 'Pay with Apple Pay' }).click();
    await page.waitForTimeout(300);
    check('checkout Apple Pay skips card check', (await co.locator('.cf-err').count()) === 0 && await co.getByText('Processing...').first().isVisible());
    await ctx.close();
  }

  // ---------- Items 4, 5, 7: Delivery ----------
  for (const [tag, w, h] of [['desk', 1440, 900], ['phone', 390, 844]]) {
    const { ctx, page, errors } = await pageWith(b, w, h, { souv_mock_mvp_flow: FLOW_READY });
    const calls = []; const bodies = [];
    await stubOrderApi(ctx, calls, bodies);
    await page.goto(BASE + '/delivery', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const html = await page.content();
    check(`delivery ${tag} no sample people`, !/Alex Smith|Samuel|Mathew|123 Main St|456 Sender St|M1M 1M1|N2L 1A1/.test(await page.evaluate(() => [...document.querySelectorAll('input')].map((i) => i.value).join('|'))));
    const vals = await page.evaluate(() => [...document.querySelectorAll('.dv-section')].map((s) => [...s.querySelectorAll('input:not([type=number])')].map((i) => i.value)));
    check(`delivery ${tag} recipient empty`, vals[0].every((v) => v === ''), JSON.stringify(vals[0]));
    const ret = page.locator('[data-dlv-return]');
    check(`delivery ${tag} return name from profile`, (await ret.getByLabel('First name').inputValue()) === 'Alex' && (await ret.getByLabel('Last name').inputValue()) === 'Taylor');
    check(`delivery ${tag} return address empty`, (await ret.getByLabel('Address line 1').inputValue()) === '' && (await ret.getByLabel('City').inputValue()) === '');

    // Blank recipient -> Address needed, nothing sent
    await page.getByRole('button', { name: 'Continue to checkout' }).click();
    await page.waitForTimeout(400);
    check(`delivery ${tag} blank recipient blocked`, await page.getByText('Address needed').isVisible() && calls.length === 0, calls.join(','));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // Fill recipient; return on with empty address -> return fields Required, nothing sent
    const rec = page.locator('.dv-section').first();
    await rec.getByLabel('First name').fill('Jordan');
    await rec.getByLabel('Last name').fill('Lee');
    await rec.getByLabel('Address line 1').fill('10 King St W');
    await rec.getByLabel('City').fill('Toronto');
    await rec.getByLabel('Province').fill('ON');
    await rec.getByLabel(/Postal code/).fill('M5H 1A1');
    await page.getByRole('button', { name: 'Continue to checkout' }).click();
    await page.waitForTimeout(700);
    const a1 = ret.getByLabel('Address line 1');
    const d1 = await a1.getAttribute('aria-describedby');
    check(`delivery ${tag} return Required shown`, (await a1.getAttribute('aria-invalid')) === 'true' && d1 && (await page.locator(`[id="${d1}"]`).textContent()) === 'Required');
    check(`delivery ${tag} return names not flagged`, (await ret.getByLabel('First name').getAttribute('aria-invalid')) === null);
    check(`delivery ${tag} focus to return address`, await page.evaluate(() => document.activeElement?.closest('[data-dlv-return]') && document.activeElement.getAttribute('data-dlv-field') === 'address1'));
    check(`delivery ${tag} incomplete return not sent`, calls.length === 0, calls.join(','));
    await axe(page, `delivery return errors ${tag}`, '[data-dlv-return]');

    // Switch off -> sent without senderAddress
    await page.getByRole('switch', { name: 'Return address' }).click();
    await page.getByRole('button', { name: 'Continue to checkout' }).click();
    await page.getByText('Checkout started').waitFor({ timeout: 5000 }).catch(() => {});
    check(`delivery ${tag} order sent`, calls[0] === 'orders', calls.join(','));
    const body = bodies[0] || {};
    check(`delivery ${tag} switch off: no senderAddress`, !('senderAddress' in body), JSON.stringify(body));
    check(`delivery ${tag} recipient sent as typed`, JSON.stringify(body.recipientAddress) === JSON.stringify({ name: 'Jordan Lee', line1: '10 King St W', city: 'Toronto', region: 'ON', postalCode: 'M5H 1A1', country: 'CA' }), JSON.stringify(body.recipientAddress));
    check(`delivery ${tag} no page errors`, !errors.some((e) => e.startsWith('pageerror')), errors.join(' | '));
    await ctx.close();
  }

  // Return on + complete -> senderAddress sent as typed
  {
    const { ctx, page } = await pageWith(b, 1440, 900, { souv_mock_mvp_flow: FLOW_READY });
    const calls = []; const bodies = [];
    await stubOrderApi(ctx, calls, bodies);
    await page.goto(BASE + '/delivery', { waitUntil: 'networkidle' });
    const rec = page.locator('.dv-section').first();
    await rec.getByLabel('First name').fill('Jordan'); await rec.getByLabel('Last name').fill('Lee');
    await rec.getByLabel('Address line 1').fill('10 King St W'); await rec.getByLabel('City').fill('Toronto');
    await rec.getByLabel('Province').fill('ON'); await rec.getByLabel(/Postal code/).fill('M5H 1A1');
    const ret = page.locator('[data-dlv-return]');
    await ret.getByLabel('Address line 1').fill('5 Erb St');
    await ret.getByLabel('City').fill('Waterloo'); await ret.getByLabel('Province').fill('ON'); await ret.getByLabel(/Postal code/).fill('N2J 1A1');
    await page.getByRole('button', { name: 'Continue to checkout' }).click();
    await page.getByText('Checkout started').waitFor({ timeout: 5000 }).catch(() => {});
    check('delivery return on: senderAddress sent', JSON.stringify(bodies[0]?.senderAddress) === JSON.stringify({ name: 'Alex Taylor', line1: '5 Erb St', city: 'Waterloo', region: 'ON', postalCode: 'N2J 1A1', country: 'CA' }), JSON.stringify(bodies[0]?.senderAddress));
    await ctx.close();
  }

  // Signed-out Delivery now redirects to / (item 17): covered in fixes-9-27.js.

  const fails = results.filter((r) => !r.ok);
  fails.forEach((r) => console.log('FAIL', r.name, r.detail));
  console.log(`${results.length - fails.length}/${results.length} passed`);
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
