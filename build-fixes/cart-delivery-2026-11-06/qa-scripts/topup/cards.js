// QA for the Top up cards pop-up + swap with the credits view + mid-creation wiring (owner, 2026-11-07).
// Every outside request is stubbed by ../pricing/lib.js.
const fs = require('fs');
const path = require('path');
const { BASE, ctxFor, launch } = require('../pricing/lib.js');
const AXE = fs.readFileSync(path.join(__dirname, '..', 'node_modules', 'axe-core', 'axe.min.js'), 'utf8');

const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok: !!ok, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const DIALOG = '[role=dialog][aria-labelledby=tu-title]';
const txt = async (p, sel) => ((await p.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
const pathOf = (p) => new URL(p.url()).pathname;

async function open(b, w, h, url, opts = {}) {
  const state = {};
  const ctx = await ctxFor(b, w, h, { ...opts, state });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  await p.goto(BASE + url, { waitUntil: 'networkidle' });
  await p.waitForTimeout(800);
  return { ctx, p, state, errs };
}
async function hamburger(p, label) {
  await p.click('button[aria-label="Menu"]'); await p.waitForTimeout(250);
  await p.click(`.souv-popmenu-item:has-text("${label}")`);
  await p.waitForSelector(DIALOG, { timeout: 8000 }); await p.waitForTimeout(450);
}
async function pay(p) {
  await p.waitForSelector('.ct-checkout'); await p.click('.ct-checkout');
  await p.waitForSelector('#co-card-number');
  await p.fill('#co-card-number', '4242424242424242'); await p.fill('#co-card-exp', '1229');
  await p.fill('#co-card-cvc', '123'); await p.fill('#co-card-postal', 'V6B 1A1');
  await p.click('.co-pay-cta'); await p.waitForTimeout(3000);
}
async function axe(p, label) {
  await p.addScriptTag({ content: AXE });
  const v = await p.evaluate(async () => (await axe.run('.tu-overlay', { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] })).violations
    .map((x) => `${x.id}(${x.nodes.length}): ${x.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' ; ')}`));
  check(`axe ${label}`, v.length === 0, v.join(' || '));
}
const dupIds = (p) => p.evaluate(() => { const seen = {}; document.querySelectorAll('[id]').forEach((e) => { seen[e.id] = (seen[e.id] || 0) + 1; }); return Object.keys(seen).filter((k) => seen[k] > 1); });

(async () => {
  const b = await launch();

  // 1. Menus: Credits box menu + hamburger
  { const { ctx, p } = await open(b, 1440, 900, '/home');
    await p.hover('.souv-balance-wrap'); await p.waitForTimeout(300);
    const items = await p.$$eval('.souv-cardbank-pop .souv-cardbank-sendlink', (els) => els.map((e) => e.textContent.trim()));
    check('Credits box menu: Top up cards, Top up credits, Saved Cards & Songs', JSON.stringify(items) === JSON.stringify(['Top up cards', 'Top up credits', 'Saved Cards & Songs']), items);
    check('Credits box menu: no "See pricing"', !items.includes('See pricing'));
    await p.click('.souv-cardbank-sendlink:has-text("Top up cards")');
    await p.waitForSelector(DIALOG); await p.waitForTimeout(400);
    check('Credits box "Top up cards" opens the cards view', (await txt(p, '#tu-title')) === 'Top up cards');
    await p.keyboard.press('Escape'); await p.waitForTimeout(250);
    await p.click('button[aria-label="Menu"]'); await p.waitForTimeout(250);
    const cardsItem = await p.$('.souv-popmenu-item:has-text("Top Up Cards")');
    check('hamburger "Top Up Cards" is a button (not a Pricing link)', cardsItem && (await cardsItem.evaluate((e) => e.tagName)) === 'BUTTON');
    await cardsItem.click(); await p.waitForSelector(DIALOG); await p.waitForTimeout(400);
    check('hamburger "Top Up Cards" opens the cards view on the same page', (await txt(p, '#tu-title')) === 'Top up cards' && pathOf(p) === '/home');
    await ctx.close(); }

  // 2. Cards view content, swap both ways, focus, dialog behaviour
  { const { ctx, p, errs } = await open(b, 1440, 900, '/home');
    await hamburger(p, 'Top Up Cards');
    check('cards: intro', (await txt(p, '#tu-body')) === 'Every card includes shipping + 10 AI credits. Buy just one or stock up on more to save.', await txt(p, '#tu-body'));
    check('cards: gold underline on "10 AI credits"', (await txt(p, '.tu-dialog .pr-lede-mark')) === '10 AI credits');
    const names = await p.$$eval('.tu-dialog .pr-offer-name', (els) => els.map((e) => e.textContent.trim()));
    check('cards: Print and Send + Big Sender boxes', JSON.stringify(names) === JSON.stringify(['Print and Send', 'Big Sender']), names);
    check('cards: same "How it works" steps as Pricing', (await p.$$('.tu-dialog .pr-how-item')).length === 6);
    check('cards: Print and Send $9.99', (await txt(p, '.tu-dialog .pr-offer >> nth=0 >> .pr-price')) === '$9.99');
    check('cards: berry top edge', await p.$eval('.tu-dialog', (d) => d.classList.contains('is-cards')));
    const sw = p.locator('.tu-switch button');
    check('cards: "Buy only credits" button at the bottom', (await sw.textContent()).trim() === 'Buy only credits');
    // Big Sender stepper works inside the pop-up
    await p.click('.tu-dialog [aria-label="Increase"]'); await p.waitForTimeout(150);
    check('cards: Big Sender stepper (2 -> 3, $26.97)', (await p.inputValue('#tu-bs-qty')) === '3' && (await txt(p, '.tu-dialog .pr-qty-total')) === '$26.97', await txt(p, '.tu-dialog .pr-qty-total'));
    await axe(p, 'cards view desktop');
    // Swap to credits
    await sw.click(); await p.waitForTimeout(300);
    check('swap: now the credits view', (await txt(p, '#tu-title')) === 'Top up credits' && (await p.$$('.tu-dialog .pr-credit')).length === 3);
    check('swap: same pop-up stays open', (await p.$$(DIALOG)).length === 1);
    check('swap: focus on the new heading', await p.evaluate(() => document.activeElement?.id === 'tu-title'));
    check('swap: scrolled to top', await p.$eval('.tu-overlay', (o) => o.scrollTop === 0));
    check('credits: "Buy a full card + credits" button', (await sw.textContent()).trim() === 'Buy a full card + credits');
    check('credits: gold top edge', await p.$eval('.tu-dialog', (d) => d.classList.contains('is-credits')));
    await axe(p, 'credits view desktop');
    await sw.click(); await p.waitForTimeout(300);
    check('swap back: cards view again', (await txt(p, '#tu-title')) === 'Top up cards' && (await p.$$('.tu-dialog .pr-offer')).length === 2);
    // Dialog behaviour
    for (let i = 0; i < 25; i++) await p.keyboard.press('Tab');
    check('Tab stays inside', await p.evaluate(() => !!document.activeElement?.closest('.tu-dialog')));
    check('page behind inert', await p.evaluate(() => [...document.body.children].filter((c) => !c.classList.contains('tu-overlay') && c.tagName !== 'SCRIPT').every((c) => c.inert)));
    await p.keyboard.press('Escape'); await p.waitForTimeout(250);
    check('Escape closes', !(await p.$(DIALOG)));
    check('no page errors', errs.length === 0, errs.join(' | '));
    await ctx.close(); }

  // 3. Opened over the Pricing page: no duplicate ids
  { const { ctx, p } = await open(b, 1440, 900, '/pricing');
    await hamburger(p, 'Top Up Cards');
    check('over Pricing (cards): no duplicate ids', (await dupIds(p)).length === 0, await dupIds(p));
    await p.click('.tu-switch button'); await p.waitForTimeout(300);
    check('over Pricing (credits): no duplicate ids', (await dupIds(p)).length === 0, await dupIds(p));
    await ctx.close(); }

  // 4. Buying from the cards view
  { const { ctx, p } = await open(b, 1440, 900, '/home');
    await hamburger(p, 'Top Up Cards');
    await p.click('.tu-dialog .pr-offer >> nth=0 >> .pr-cta');
    await p.waitForURL('**/cart', { timeout: 10000 }).catch(() => {}); await p.waitForTimeout(600);
    check('Buy Print and Send: pop-up closes, cart opens with it', pathOf(p) === '/cart' && !(await p.$(DIALOG)) && (await p.textContent('.ct-wrap')).includes('Print and Send'));
    await pay(p);
    check('after paying: "Your cards are waiting"', (await txt(p, '#pr-ready-title')) === 'Your cards are waiting');
    await ctx.close(); }
  { const { ctx, p } = await open(b, 1440, 900, '/home');
    await hamburger(p, 'Top Up Cards');
    await p.click('.tu-dialog [aria-label="Increase"]'); await p.waitForTimeout(150);
    await p.click('.tu-dialog .pr-offer >> nth=1 >> .pr-cta');
    await p.waitForURL('**/cart', { timeout: 10000 }).catch(() => {}); await p.waitForTimeout(600);
    const cart = await p.evaluate(() => JSON.parse(localStorage.getItem('souv_cart') || '[]'));
    check('Reserve Big Sender (3 cards) from the pop-up', cart.some((i) => i.id === 'pack-bigsender' && i.cardCount === 3), cart);
    await ctx.close(); }

  // 5. Mid-creation: out of credits on Create a Card -> credits pop-up there; after paying, on to the option
  { const { ctx, p, state } = await open(b, 1440, 900, '/create', { balance: 0 });
    await p.click('.cr-card.is-template >> visible=true', { force: true });
    await p.waitForSelector(DIALOG, { timeout: 8000 }).catch(() => {}); await p.waitForTimeout(400);
    check('/create, 0 credits: credits pop-up opens on /create', !!(await p.$(DIALOG)) && (await txt(p, '#tu-title')) === 'Top up credits' && pathOf(p) === '/create', p.url());
    check('/create: no return page saved just by opening', (await p.evaluate(() => localStorage.getItem('souv_pricing_return_to'))) === null);
    await p.click('.tu-dialog .pr-credit:has-text("Starter") button');
    await p.waitForURL('**/cart', { timeout: 10000 }).catch(() => {}); await p.waitForTimeout(600);
    const ret = await p.evaluate(() => localStorage.getItem('souv_pricing_return_to'));
    check('/create: choosing a pack saves the return page', /^\/create\/(personalize-a-template|build-my-card)$/.test(ret || ''), ret);
    await pay(p); await p.waitForTimeout(1200);
    check('/create: after paying, straight on to the option (no pop-up)', pathOf(p) === ret && !(await p.$('#pr-ready-title')), p.url());
    check('/create: 10 credits granted', state.balance === 10, state.balance);
    await ctx.close(); }
  // Closing without buying leaves no return page behind
  { const { ctx, p } = await open(b, 1440, 900, '/create', { balance: 0 });
    await p.click('.cr-card.is-template >> visible=true', { force: true });
    await p.waitForSelector(DIALOG, { timeout: 8000 }).catch(() => {}); await p.waitForTimeout(400);
    await p.keyboard.press('Escape'); await p.waitForTimeout(250);
    check('/create: closing without buying stays on /create, nothing saved', pathOf(p) === '/create' && (await p.evaluate(() => localStorage.getItem('souv_pricing_return_to'))) === null);
    await ctx.close(); }
  // Build My Card / Personalize entry with 0 credits: pop-up on the page, not a trip to Pricing
  for (const route of ['/create/build-my-card', '/create/personalize-a-template']) {
    const { ctx, p, errs } = await open(b, 1440, 900, route, { balance: 0 });
    await p.waitForSelector(DIALOG, { timeout: 8000 }).catch(() => {}); await p.waitForTimeout(400);
    check(`${route}, 0 credits: credits pop-up opens on the page`, !!(await p.$(DIALOG)) && (await txt(p, '#tu-title')) === 'Top up credits' && pathOf(p) === route, p.url());
    check(`${route}: no page errors`, errs.length === 0, errs.join(' | '));
    await ctx.close();
  }
  // With credits: no pop-up on entry
  { const { ctx, p } = await open(b, 1440, 900, '/create/build-my-card', { balance: 5 });
    await p.waitForTimeout(800);
    check('Build My Card with credits: no pop-up', !(await p.$(DIALOG)));
    await ctx.close(); }

  // 6. No signed-in nav: the open request isn't handled (callers fall back to Pricing)
  { const { ctx, p } = await open(b, 1440, 900, '/pricing', { signedIn: false });
    const handled = await p.evaluate(() => { const detail = { view: 'credits', handled: false }; window.dispatchEvent(new CustomEvent('souv-open-top-up', { detail })); return detail.handled; });
    check('signed out: request not handled (fallback to Pricing)', handled === false && !(await p.$(DIALOG)));
    await ctx.close(); }

  // 7. Delivery: card check is wired but off -> no card pop-up
  { const { ctx, p } = await open(b, 1440, 900, '/delivery');
    await p.getByRole('button', { name: 'Continue to checkout' }).click().catch(() => {});
    await p.waitForTimeout(600);
    check('Delivery, 0 cards: card pop-up stays off (until backend owns cards)', !(await p.$(DIALOG)));
    await ctx.close(); }

  // 8. Layout of the cards view at every size
  for (const [w, h] of [[1920, 1080], [1440, 900], [1024, 768], [768, 1024], [390, 844], [375, 667], [320, 568], [844, 390]]) {
    const { ctx, p } = await open(b, w, h, '/home');
    await hamburger(p, 'Top Up Cards');
    const m = await p.evaluate(() => {
      const ov = document.querySelector('.tu-overlay'); const d = document.querySelector('.tu-dialog').getBoundingClientRect();
      const close = document.querySelector('.tu-close').getBoundingClientRect();
      const small = [...document.querySelectorAll('.tu-dialog button, .tu-dialog a, .tu-dialog input')].filter((el) => { const r = el.getBoundingClientRect(); return r.width && (r.height < 44 || r.width < 44); }).map((el) => el.textContent.trim() || el.getAttribute('aria-label') || el.id);
      return { vw: innerWidth, left: Math.round(d.left), right: Math.round(d.right), sw: ov.scrollWidth, ow: ov.clientWidth, closeTop: Math.round(close.top), closeRight: Math.round(close.right), small };
    });
    check(`${w}x${h}: no sideways overflow`, m.left >= 0 && m.right <= m.vw && m.sw <= m.ow, m);
    check(`${w}x${h}: close on screen`, m.closeTop >= 0 && m.closeRight <= m.vw, m);
    check(`${w}x${h}: tap targets >= 44px`, m.small.length === 0, m.small);
    await p.$eval('.tu-overlay', (o) => { o.scrollTop = o.scrollHeight; }); await p.waitForTimeout(150);
    const sb = await p.$eval('.tu-switch button', (el) => { const r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), vh: innerHeight }; });
    check(`${w}x${h}: "Buy only credits" reachable`, sb.top >= 0 && sb.bottom <= sb.vh, sb);
    if (w === 390) await axe(p, 'cards view phone');
    await p.$eval('.tu-overlay', (o) => { o.scrollTop = 0; });
    await p.screenshot({ path: path.join(__dirname, 'shots', `cards-${w}x${h}.png`) });
    if (w === 1440) { await p.$eval('.tu-overlay', (o) => { o.scrollTop = o.scrollHeight; }); await p.screenshot({ path: path.join(__dirname, 'shots', `cards-${w}x${h}-bottom.png`) }); }
    await ctx.close();
  }

  const fails = results.filter((r) => !r.ok);
  fails.forEach((r) => console.log('FAIL', r.name, r.detail.slice(0, 400)));
  console.log(`${results.length - fails.length}/${results.length} passed`);
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
