// Extra QA for the Top up pop-up (owner asked for the gaps in cards.js to be covered, 2026-11-07):
// pay-and-return from Build My Card + Personalize, the Review "Top Up" button (both flows),
// buying credits after the swap, focus after closing, phone taps, and (DELIVERY_ON=1 only,
// against a copy with CARD_BALANCE_CHECK_ENABLED=true) the Delivery out-of-cards path.
// Every outside request is stubbed by ../pricing/lib.js plus the draft/generation stubs below.
const fs = require('fs');
const path = require('path');
const { BASE, ctxFor, launch } = require('../pricing/lib.js');

const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok: !!ok, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const DIALOG = '[role=dialog][aria-labelledby=tu-title]';
const SHOTS = path.join(__dirname, 'shots'); fs.mkdirSync(SHOTS, { recursive: true });
const txt = async (p, sel) => ((await p.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
const pathOf = (p) => new URL(p.url()).pathname;
const title = (p) => p.$eval('#tu-title', (e) => e.textContent.replace(/\s+/g, ' ').trim()).catch(() => null);
const saved = (p) => p.evaluate(() => localStorage.getItem('souv_pricing_return_to'));
const FLOW_READY = {
  cardDraftId: 'draft-1234abcd-0000', generatedAssets: [{ id: 'asset-9c1d0000', kind: 'image', type: 'image' }],
  selectedAssetId: 'asset-9c1d0000', orderId: null, orderStatus: null, checkoutSessionId: null, paymentId: null, fulfillment: null, updatedAt: null,
};

// Fake card-draft / generation backend so Personalize can reach its Review page.
async function stubDrafts(ctx, state) {
  const draft = { id: 'draft-p1', user_id: 'u1', status: 'draft', occasion: 'Birthday', creative_brief: {}, created_at: '2026-11-07T00:00:00Z', updated_at: '2026-11-07T00:00:00Z' };
  const asset = { id: 'asset-p1', card_draft_id: 'draft-p1', kind: 'image', type: 'image', status: 'ready', url: 'mock://asset-p1', created_at: '2026-11-07T00:00:00Z' };
  const json = (r, body, status = 200) => r.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  await ctx.route(/\/api\/(card-drafts|assets|uploads|generation)/, (r) => {
    const u = r.request().url(); const m = r.request().method();
    state.requests.push(m + ' ' + u);
    if (/\/card-drafts/.test(u) &&(m === 'POST' || m === 'PATCH')) {
      const body = JSON.parse(r.request().postData() || '{}');
      if (body.creativeBrief) draft.creative_brief = body.creativeBrief;
      if (body.occasion) draft.occasion = body.occasion;
      state.savedBrief = draft.creative_brief;
    }
    if (/\/generation\/start/.test(u)) { state.balance = Math.max(0, (state.balance ?? 0) - 3); return json(r, { job: { id: 'job-1', status: 'queued' }, balance: { userId: 'u1', balance: state.balance } }); }
    if (/\/assets\/card-draft\//.test(u)) return json(r, { assets: [asset] });
    if (/\/uploads\/mock/.test(u)) return json(r, { upload: { id: 'up-1', url: 'mock://up-1' } });
    if (/\/card-drafts\/(user\/[^/]+)?\/?(\?|$)/.test(u) && m === 'GET') return json(r, { cardDrafts: [draft] });
    return json(r, { cardDraft: draft });
  });
}

async function open(b, w, h, url, opts = {}) {
  const state = {};
  const ctx = await ctxFor(b, w, h, { ...opts, state });
  if (opts.drafts) await stubDrafts(ctx, state);
  if (opts.seed) await ctx.addInitScript((s) => {
    if (sessionStorage.getItem('__seeded')) return; sessionStorage.setItem('__seeded', '1');
    for (const [k, v] of Object.entries(s)) localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
  }, opts.seed);
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  await p.goto(BASE + url, { waitUntil: 'networkidle' });
  await p.waitForTimeout(800);
  return { ctx, p, state, errs };
}
async function pay(p) {
  await p.waitForSelector('.ct-checkout'); await p.click('.ct-checkout');
  await p.waitForSelector('#co-card-number');
  await p.fill('#co-card-number', '4242424242424242'); await p.fill('#co-card-exp', '1229');
  await p.fill('#co-card-cvc', '123'); await p.fill('#co-card-postal', 'V6B 1A1');
  await p.click('.co-pay-cta'); await p.waitForTimeout(3000);
}
const waitDialog = (p) => p.waitForSelector(DIALOG, { timeout: 8000 }).then(() => p.waitForTimeout(450)).catch(() => {});
async function hamburger(p, label) {
  await p.click('button[aria-label="Menu"]'); await p.waitForTimeout(250);
  await p.click(`.souv-popmenu-item:has-text("${label}")`);
  await waitDialog(p);
}
const active = (p) => p.evaluate(() => ({ cls: document.activeElement?.className || '', label: document.activeElement?.getAttribute('aria-label') || '', text: (document.activeElement?.textContent || '').trim().slice(0, 40) }));

(async () => {
  const b = await launch();

  if (process.env.DELIVERY_ON !== '1') {
    // 1. Out of credits on entry -> pay -> straight back (Build My Card, Personalize)
    for (const route of ['/create/build-my-card', '/create/personalize-a-template']) {
      const { ctx, p, state, errs } = await open(b, 1440, 900, route, { balance: 0 });
      await waitDialog(p);
      check(`${route}: credits pop-up on entry`, (await title(p)) === 'Top up credits' && pathOf(p) === route, p.url());
      await p.click('.tu-dialog .pr-credit:has-text("Starter") button');
      await p.waitForURL('**/cart', { timeout: 10000 }).catch(() => {}); await p.waitForTimeout(600);
      check(`${route}: pack chosen -> cart, return page saved`, pathOf(p) === '/cart' && (await saved(p)) === route, { url: p.url(), saved: await saved(p) });
      await pay(p); await p.waitForTimeout(1500);
      check(`${route}: after paying, straight back (no "waiting" pop-up)`, pathOf(p) === route && !(await p.$('#pr-ready-title')), p.url());
      check(`${route}: 10 credits granted`, state.balance === 10, state.balance);
      await p.waitForTimeout(800);
      check(`${route}: top-up pop-up doesn't reopen with credits`, !(await p.$(DIALOG)));
      check(`${route}: return page cleared after use`, (await saved(p)) === null, await saved(p));
      check(`${route}: no page errors`, errs.length === 0, errs.join(' | '));
      await ctx.close();
    }

    // 2. Build My Card Review: "Top Up Credits" (has credits) and "Out of credits — Top Up" (none)
    { const { ctx, p, errs } = await open(b, 1440, 900, '/create/build-my-card', { balance: 5 });
      await p.evaluate(() => window.__bmcGoStep && window.__bmcGoStep('review')); await p.waitForTimeout(800);
      const btn = p.locator('.bmc-review-actions button', { hasText: 'Top Up' });
      check('BMC Review: "Top Up Credits" button shown', (await btn.count()) === 1 && (await btn.textContent()).includes('Top Up Credits'), await btn.count());
      await btn.click(); await waitDialog(p);
      check('BMC Review: opens credits pop-up on the page', (await title(p)) === 'Top up credits' && pathOf(p) === '/create/build-my-card', p.url());
      check('BMC Review: "Buy a full card + credits" there too', (await txt(p, '.tu-switch button')).includes('Buy a full card + credits'));
      await p.keyboard.press('Escape'); await p.waitForTimeout(300);
      check('BMC Review: Escape -> still on Review, nothing saved', !(await p.$(DIALOG)) && (await p.$('.bmc-review-actions')) !== null && (await saved(p)) === null);
      const f = await active(p);
      check('BMC Review: focus back on the Top Up button', /Top Up/.test(f.text), f);
      await btn.click(); await waitDialog(p);
      await p.click('.tu-dialog .pr-credit:has-text("Starter") button');
      await p.waitForURL('**/cart', { timeout: 10000 }).catch(() => {});
      check('BMC Review: pack chosen -> return page /create/build-my-card', (await saved(p)) === '/create/build-my-card', await saved(p));
      check('BMC Review: no page errors', errs.length === 0, errs.join(' | '));
      await ctx.close(); }

    // 3. Personalize Review (fake draft + generation backend)
    { const { ctx, p, state, errs } = await open(b, 1440, 900, '/create/personalize-a-template', { balance: 20, drafts: true });
      await p.click('.pt-card-cta >> nth=0'); await p.waitForTimeout(800);
      // Step through the modal (Continue ...) to "Create my Card", ticking any consent boxes on the way.
      for (let i = 0; i < 8; i++) {
        const boxes = p.locator('[role=dialog] input[type=checkbox]');
        for (let j = 0; j < await boxes.count(); j++) await boxes.nth(j).check({ force: true }).catch(() => {});
        const cta = p.locator('.pt-cta').first();
        if (!(await cta.count())) break;
        const label = (await cta.textContent()) || '';
        await cta.click().catch(() => {}); await p.waitForTimeout(600);
        if (/Create my Card/i.test(label)) break;
      }
      await p.waitForTimeout(2500);
      const atReview = (await p.$('.bmc-review-actions')) !== null;
      check('Personalize: reaches Review with faked backend', atReview, { url: p.url(), err: await p.$eval('.bmc-modal-wrap, [role=alertdialog]', (e) => e.textContent.trim().slice(0, 200)).catch(() => ''), reqs: state.requests.filter((r) => /card-drafts|generation|assets/.test(r)).slice(-5) });
      if (atReview) {
        await p.waitForTimeout(800); await p.click('[data-screen-label="Modal · Invite A Friend"] .bmc-modal-close').catch(() => {}); await p.waitForTimeout(300); // invite pop-up
        await p.waitForTimeout(5500); // review assets settle
        const btn = p.locator('.bmc-review-actions button', { hasText: 'Top Up' });
        await btn.click(); await waitDialog(p);
        check('Personalize Review: opens credits pop-up on the page', (await title(p)) === 'Top up credits' && pathOf(p) === '/create/personalize-a-template', p.url());
        await p.screenshot({ path: path.join(SHOTS, 'personalize-review-topup.png') });
        await p.click('.tu-dialog .pr-credit:has-text("Starter") button');
        await p.waitForURL('**/cart', { timeout: 10000 }).catch(() => {});
        check('Personalize Review: return page /create/personalize-a-template', (await saved(p)) === '/create/personalize-a-template', await saved(p));
      }
      check('Personalize Review: no page errors', errs.length === 0, errs.join(' | '));
      await ctx.close(); }

    // 3b. Personalize "Create my Card" with too few credits (1, card + song needs 2): draft saved,
    //     credits pop-up opens over the modal; after paying, back into the draft on its last step.
    { const { ctx, p, state, errs } = await open(b, 1440, 900, '/create/personalize-a-template', { balance: 1, drafts: true });
      await p.click('.pt-card-cta >> nth=0'); await p.waitForTimeout(800);
      for (let i = 0; i < 8; i++) {
        const who = p.locator('input[placeholder="Who\x27s it for?"]');
        if (await who.count()) await who.fill('Jordan');
        const cta = p.locator('.pt-cta').first();
        if (!(await cta.count())) break;
        const label = (await cta.textContent()) || '';
        await cta.click().catch(() => {}); await p.waitForTimeout(600);
        if (/Create my Card/i.test(label)) break;
      }
      await waitDialog(p);
      check('Personalize, too few credits: credits pop-up (not the error box)', (await title(p)) === 'Top up credits' && !(await p.$('[data-screen-label*="Error"], .bmc-modal-wrap:has-text("Not enough credits")')), { title: await title(p) });
      check('Personalize: draft saved with what was typed', JSON.stringify(state.savedBrief || {}).includes('Jordan'), state.savedBrief);
      check('Personalize: no generation started', !state.requests.some((x) => x.includes('/generation/start')));
      await p.screenshot({ path: path.join(SHOTS, 'personalize-too-few-credits.png') });
      await p.keyboard.press('Escape'); await p.waitForTimeout(400);
      const whoAfter = p.locator('input[placeholder="Who\x27s it for?"]');
      check('Personalize: Escape closes only the top-up, their details still open', !(await p.$(DIALOG)) && (await whoAfter.count()) === 1 && (await whoAfter.inputValue()) === 'Jordan' && (await saved(p)) === null);
      await p.locator('.pt-cta').first().click(); await waitDialog(p);
      check('Personalize: "Create my Card" again reopens the top-up', (await title(p)) === 'Top up credits');
      await p.click('.tu-dialog .pr-credit:has-text("Starter") button');
      await p.waitForURL('**/cart', { timeout: 10000 }).catch(() => {}); await p.waitForTimeout(600);
      const ret = await saved(p);
      check('Personalize: return page resumes the draft on its last step', ret === '/create/personalize-a-template?modal=1&draftId=draft-p1&step=caption', ret);
      await pay(p); await p.waitForTimeout(2500);
      check('Personalize: after paying, back in the draft (modal open)', pathOf(p) === '/create/personalize-a-template' && !!(await p.$('.pt-cta')), p.url());
      const who = p.locator('input[placeholder="Who\x27s it for?"]');
      check('Personalize: what they typed is still there', (await who.count()) === 1 && (await who.inputValue()) === 'Jordan', (await who.count()) ? await who.inputValue() : 'field not shown');
      check('Personalize: 11 credits now', state.balance === 11, state.balance);
      check('Personalize too-few: no page errors', errs.length === 0, errs.join(' | '));
      await ctx.close(); }

    // 3c. Build My Card "Generate" with too few credits (1, card + song needs 2): same as Personalize.
    { const { ctx, p, state, errs } = await open(b, 1440, 900, '/create/build-my-card', { balance: 1, drafts: true });
      await p.evaluate(() => window.__bmcGoStep && window.__bmcGoStep('song')); await p.waitForTimeout(800);
      const genres = p.locator('.bmc-genre');
      check('BMC: on the QR Song step', (await genres.count()) > 2);
      const pick = p.locator('.bmc-genre:not(.is-active)').nth(2);
      const genre = ((await pick.locator('.bmc-genre-name').textContent()) || '').trim();
      await pick.click(); await p.waitForTimeout(400);
      const activeGenre = async () => ((await p.locator('.bmc-genre.is-active .bmc-genre-name').textContent().catch(() => '')) || '').trim();
      await p.click('.bmc-cta.bmc-cta-lg'); await waitDialog(p);
      check('BMC, too few credits: credits pop-up (not the error box)', (await title(p)) === 'Top up credits' && !(await p.$('.bmc-modal-wrap:has-text("Not enough credits")')), { title: await title(p) });
      check('BMC: draft saved with what was typed', JSON.stringify(state.savedBrief || {}).includes(genre) && genre.length > 0, state.savedBrief);
      check('BMC: no generation started', !state.requests.some((x) => x.includes('/generation/start')));
      await p.screenshot({ path: path.join(SHOTS, 'bmc-too-few-credits.png') });
      await p.keyboard.press('Escape'); await p.waitForTimeout(400);
      check('BMC: Escape -> still on QR Song with their genre', !(await p.$(DIALOG)) && (await activeGenre()) === genre && (await saved(p)) === null, await activeGenre());
      await p.click('.bmc-cta.bmc-cta-lg'); await waitDialog(p);
      await p.click('.tu-dialog .pr-credit:has-text("Starter") button');
      await p.waitForURL('**/cart', { timeout: 10000 }).catch(() => {}); await p.waitForTimeout(600);
      const ret = await saved(p);
      check('BMC: return page resumes the draft on QR Song', ret === '/create/build-my-card?draftId=draft-p1#song', ret);
      await pay(p); await p.waitForTimeout(2500);
      check('BMC: after paying, back on QR Song', pathOf(p) === '/create/build-my-card' && (await p.locator('.bmc-genre').count()) > 2 && !(await p.$(DIALOG)), p.url());
      check('BMC: their genre is still chosen', (await activeGenre()) === genre, { want: genre, got: await activeGenre() });
      check('BMC: 11 credits now', state.balance === 11, state.balance);
      check('BMC too-few: no page errors', errs.length === 0, errs.join(' | '));
      await ctx.close(); }

    // 4. Swap to credits, buy credits only -> "Your credits are waiting"
    { const { ctx, p } = await open(b, 1440, 900, '/home');
      await hamburger(p, 'Top Up Cards');
      await p.click('.tu-switch button'); await p.waitForTimeout(350);
      check('swap: credits view', (await title(p)) === 'Top up credits');
      await p.screenshot({ path: path.join(SHOTS, 'swapped-credits-1440x900.png') });
      await p.click('.tu-dialog .pr-credit:has-text("Starter") button');
      await p.waitForURL('**/cart', { timeout: 10000 }).catch(() => {}); await p.waitForTimeout(600);
      const cart = await p.evaluate(() => JSON.parse(localStorage.getItem('souv_cart') || '[]'));
      check('swap -> Starter: cart has only the credits', cart.length === 1 && cart[0].type === 'credits', cart);
      check('opened from the menu: no return page saved', (await saved(p)) === null, await saved(p));
      await pay(p);
      check('after paying: "Your credits are waiting"', (await txt(p, '#pr-ready-title').catch(() => '')) === 'Your credits are waiting', await txt(p, '#pr-ready-title').catch(() => 'none'));
      await p.screenshot({ path: path.join(SHOTS, 'credits-waiting.png') });
      await ctx.close(); }

    // 5. Focus after closing, cards view
    { const { ctx, p } = await open(b, 1440, 900, '/home');
      await p.focus('.souv-credits-link'); await p.waitForTimeout(250);
      await p.keyboard.press('Tab'); await p.keyboard.press('Enter'); await waitDialog(p);
      check('keyboard "Top up cards": cards view', (await title(p)) === 'Top up cards');
      const f0 = await active(p);
      check('keyboard: focus starts inside the pop-up', await p.evaluate(() => !!document.activeElement?.closest('.tu-dialog')), f0);
      await p.keyboard.press('Escape'); await p.waitForTimeout(300);
      const f1 = await active(p);
      check('keyboard cards view: Escape -> focus to the Credits box', /souv-credits-link/.test(f1.cls), f1);
      await ctx.close(); }
    { const { ctx, p } = await open(b, 1440, 900, '/home');
      await hamburger(p, 'Top Up Cards');
      await p.click('.tu-switch button'); await p.waitForTimeout(300);
      await p.click('.tu-switch button'); await p.waitForTimeout(300);
      await p.click('.tu-close'); await p.waitForTimeout(300);
      const f = await active(p);
      check('hamburger, swap twice, close button -> focus to the menu button', f.label === 'Menu', f);
      await ctx.close(); }

    // 6. Phone, touch taps
    { const { ctx, p, errs } = await open(b, 390, 844, '/home');
      const tap = async (sel) => { const r = await p.$eval(sel, (e) => { e.scrollIntoView({ block: 'center' }); const x = e.getBoundingClientRect(); return { x: x.x + x.width / 2, y: x.y + x.height / 2 }; }); await p.touchscreen.tap(r.x, r.y); await p.waitForTimeout(400); };
      await tap('button[aria-label="Menu"]'); await tap('.souv-popmenu-item:has-text("Top Up Cards")'); await waitDialog(p);
      check('phone tap: hamburger -> cards view', (await title(p)) === 'Top up cards');
      await tap('.tu-switch button');
      check('phone tap: "Buy only credits" -> credits view', (await title(p)) === 'Top up credits');
      check('phone: credits view scrolled to top', (await p.$eval('.tu-overlay', (o) => o.scrollTop)) === 0);
      await p.screenshot({ path: path.join(SHOTS, 'swapped-credits-390x844.png') });
      await tap('.tu-switch button');
      check('phone tap: "Buy a full card + credits" -> cards view', (await title(p)) === 'Top up cards');
      await tap('.tu-dialog [aria-label="Increase"]');
      check('phone tap: Big Sender stepper works', (await txt(p, '.tu-dialog .pr-offer >> nth=1')).includes('3'));
      await tap('.tu-close');
      check('phone tap: close button closes', !(await p.$(DIALOG)));
      await tap('button[aria-label="Menu"]'); await tap('.souv-popmenu-item:has-text("Top Up Credits")'); await waitDialog(p);
      check('phone tap: hamburger "Top Up Credits" -> credits view', (await title(p)) === 'Top up credits');
      await tap('.tu-dialog .pr-credit:has-text("Starter") button');
      await p.waitForURL('**/cart', { timeout: 10000 }).catch(() => {});
      check('phone tap: Starter -> cart', pathOf(p) === '/cart');
      check('phone: no page errors', errs.length === 0, errs.join(' | '));
      await ctx.close(); }
  } else {
    // 7. Delivery with CARD_BALANCE_CHECK_ENABLED = true (separate copy only): 0 cards -> cards view
    { const { ctx, p, errs } = await open(b, 1440, 900, '/delivery', { seed: { souv_mock_mvp_flow: FLOW_READY } });
      const cta = p.getByRole('button', { name: 'Continue to checkout' });
      check('Delivery: "Continue to checkout" is there', (await cta.count()) === 1);
      await cta.click(); await waitDialog(p);
      check('Delivery, 0 cards: cards pop-up opens on Delivery', (await title(p)) === 'Top up cards' && pathOf(p) === '/delivery', p.url());
      check('Delivery: nothing saved just by opening', (await saved(p)) === null);
      await p.screenshot({ path: path.join(SHOTS, 'delivery-cards-on.png') });
      await p.keyboard.press('Escape'); await p.waitForTimeout(300);
      check('Delivery: Escape -> back on Delivery, no order sent', pathOf(p) === '/delivery' && !(await p.$(DIALOG)), p.url());
      await cta.click(); await waitDialog(p);
      await p.click('.tu-dialog .pr-offer >> nth=0 >> .pr-cta');
      await p.waitForURL('**/cart', { timeout: 10000 }).catch(() => {}); await p.waitForTimeout(600);
      check('Delivery: Print and Send chosen -> cart, return page /delivery', pathOf(p) === '/cart' && (await saved(p)) === '/delivery', { url: p.url(), saved: await saved(p) });
      await pay(p); await p.waitForTimeout(1500);
      check('Delivery: after paying, straight back to Delivery', pathOf(p) === '/delivery' && !(await p.$('#pr-ready-title')), p.url());
      check('Delivery: no page errors', errs.length === 0, errs.join(' | '));
      await ctx.close(); }
  }

  const fails = results.filter((r) => !r.ok);
  results.forEach((r) => console.log(r.ok ? 'PASS' : 'FAIL', r.name, r.ok ? '' : r.detail.slice(0, 500)));
  console.log(`${results.length - fails.length}/${results.length} passed`);
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
