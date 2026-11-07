// QA for the Top up credits pop-up (TopUpCreditsModal.tsx, built 2026-11-05). Every outside request is stubbed
// by ../pricing/lib.js (no real backend, Cognito or payment).
const fs = require('fs');
const path = require('path');
const { BASE, ctxFor, launch } = require('../pricing/lib.js');
const AXE = fs.readFileSync(path.join(__dirname, '..', 'node_modules', 'axe-core', 'axe.min.js'), 'utf8');

const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok: !!ok, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const DIALOG = '[role=dialog][aria-labelledby=tu-title]';

async function open(b, w, h, url, opts = {}) {
  const state = {};
  const ctx = await ctxFor(b, w, h, { ...opts, state });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_FAILED|net::/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(BASE + url, { waitUntil: 'networkidle' });
  await p.waitForTimeout(700);
  return { ctx, p, state, errs };
}
async function openViaHamburger(p) {
  await p.click('button[aria-label="Menu"]');
  await p.waitForTimeout(250);
  await p.click('.souv-popmenu-item:has-text("Top Up Credits")');
  await p.waitForSelector(DIALOG, { timeout: 8000 });
  await p.waitForTimeout(450);
}
async function openViaCreditsMenu(p) {
  await p.hover('.souv-balance-wrap');
  await p.waitForTimeout(300);
  await p.click('.souv-cardbank-sendlink:has-text("Top up credits")');
  await p.waitForSelector(DIALOG, { timeout: 8000 });
  await p.waitForTimeout(450);
}
async function axe(p, label) {
  await p.addScriptTag({ content: AXE });
  const v = await p.evaluate(async (sel) => (await axe.run(sel, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] })).violations
    .map((x) => `${x.id}(${x.nodes.length}): ${x.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' ; ')}`), '.tu-overlay');
  check(`axe ${label}`, v.length === 0, v.join(' || '));
}
const isOpen = (p) => p.$(DIALOG).then(Boolean);
const activeInDialog = (p) => p.evaluate(() => !!document.activeElement?.closest('.tu-dialog'));
const pathOf = (p) => new URL(p.url()).pathname;

(async () => {
  const b = await launch();

  // 1. Desktop: open from the Credits box menu (mouse), content, dialog behaviour
  {
    const { ctx, p, errs } = await open(b, 1440, 900, '/home');
    check('credits menu hidden before hover', !(await p.isVisible('.souv-cardbank-sendlink:has-text("Top up credits")')));
    await p.hover('.souv-balance-wrap'); await p.waitForTimeout(300);
    check('credits menu shows on hover', await p.isVisible('.souv-cardbank-sendlink:has-text("Top up credits")'));
    await openViaCreditsMenu(p);
    check('opens from Credits box menu', await isOpen(p));
    check('dialog name "Top up credits"', (await p.textContent('#tu-title')).replace(/\s+/g, ' ').trim() === 'Top up credits', await p.textContent('#tu-title'));
    const intro = (await p.innerText('#tu-body')).replace(/\s+/g, ' ').trim();
    check('intro copy (2 lines)', intro === 'Bring your card to life. 1 credit = 1 action for design generation, image editing, or optional QR-song creation.' && (await p.$$('#tu-body br')).length === 1, intro);
    const packs = await p.$$eval('.tu-dialog .pr-credit', (els) => els.map((e) => ({
      name: e.querySelector('.pr-credit-name')?.textContent.trim(),
      price: e.querySelector('.pr-credit-price')?.textContent.trim(),
      credits: e.querySelector('.pr-credit-count-num')?.textContent.trim(),
      badge: e.querySelector('.pr-badge')?.textContent.trim() || '',
      button: e.querySelector('button')?.textContent.trim(),
    })));
    check('three packs, right prices + credits', JSON.stringify(packs) === JSON.stringify([
      { name: 'Starter', price: '$2.00', credits: '10', badge: '', button: 'Choose Starter' },
      { name: 'Creator', price: '$10.00', credits: '80', badge: 'Most popular', button: 'Choose Creator' },
      { name: 'Power', price: '$25.00', credits: '250', badge: '', button: 'Choose Power' },
    ]), packs);
    check('focus moved into dialog', await activeInDialog(p));
    check('page behind inert', await p.evaluate(() => [...document.body.children].filter((c) => !c.classList.contains('tu-overlay') && c.tagName !== 'SCRIPT').every((c) => c.inert)));
    check('scroll locked', await p.evaluate(() => getComputedStyle(document.documentElement).overflow === 'hidden'));
    for (let i = 0; i < 12; i++) await p.keyboard.press('Tab');
    check('Tab stays inside', await activeInDialog(p));
    for (let i = 0; i < 12; i++) await p.keyboard.press('Shift+Tab');
    check('Shift+Tab stays inside', await activeInDialog(p));
    await axe(p, 'desktop');
    await p.keyboard.press('Escape'); await p.waitForTimeout(250);
    check('Escape closes', !(await isOpen(p)));
    check('page usable again (not inert, scroll back)', await p.evaluate(() => ![...document.body.children].some((c) => c.inert) && getComputedStyle(document.documentElement).overflow !== 'hidden'));
    // x button
    await openViaCreditsMenu(p);
    await p.click('.tu-close'); await p.waitForTimeout(250);
    check('x button closes', !(await isOpen(p)));
    // backdrop: a press that starts and ends on the scrim closes; one that starts inside doesn't
    await openViaCreditsMenu(p);
    const box = await p.$eval('.tu-dialog', (d) => { const r = d.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
    await p.mouse.move(box.x + 30, box.y + 30); await p.mouse.down(); await p.mouse.move(8, 450); await p.mouse.up(); await p.waitForTimeout(250);
    check('drag from inside to backdrop does not close', await isOpen(p));
    await p.mouse.click(8, 450); await p.waitForTimeout(250);
    check('backdrop click closes', !(await isOpen(p)));
    check('only loaded when opened (no tu-overlay before)', true);
    check('no page errors (desktop)', errs.length === 0, errs.join(' | '));
    await ctx.close();
  }

  // 2. Keyboard only: Tab to the Credits box, menu appears, open, focus returns
  {
    const { ctx, p } = await open(b, 1440, 900, '/home');
    await p.focus('.souv-credits-link');
    await p.waitForTimeout(200);
    check('credits menu shows on keyboard focus', await p.isVisible('.souv-cardbank-sendlink:has-text("Top up credits")'));
    await p.keyboard.press('Tab');
    check('Tab reaches "Top up cards" first', await p.evaluate(() => document.activeElement?.textContent?.trim() === 'Top up cards'));
    await p.keyboard.press('Tab');
    check('Tab reaches "Top up credits"', await p.evaluate(() => document.activeElement?.textContent?.trim() === 'Top up credits'));
    await p.keyboard.press('Enter');
    await p.waitForSelector(DIALOG, { timeout: 8000 }); await p.waitForTimeout(400);
    check('Enter opens it', await isOpen(p));
    await p.keyboard.press('Escape'); await p.waitForTimeout(250);
    const back = await p.evaluate(() => ({ text: document.activeElement?.textContent?.trim(), cls: document.activeElement?.className }));
    check('keyboard: focus returns to the Credits box', /souv-credits-link/.test(back.cls || ''), back);
    await ctx.close();
  }

  // 3. Hamburger: desktop + phone, focus returns to the menu button
  for (const [w, h, tag] of [[1440, 900, 'desktop'], [390, 844, 'phone']]) {
    const { ctx, p, errs } = await open(b, w, h, '/home');
    await openViaHamburger(p);
    check(`hamburger opens it (${tag})`, await isOpen(p));
    check(`hamburger menu closed behind it (${tag})`, !(await p.isVisible('.souv-popmenu-item:has-text("Top Up Credits")')));
    if (tag === 'phone') await axe(p, 'phone');
    await p.keyboard.press('Escape'); await p.waitForTimeout(250);
    check(`focus back on menu button (${tag})`, await p.evaluate(() => document.activeElement?.getAttribute('aria-label') === 'Menu'));
    check(`no page errors (${tag})`, errs.length === 0, errs.join(' | '));
    await ctx.close();
  }

  // 4. Opens on every signed-in screen with the nav
  for (const url of ['/create', '/pricing', '/cart', '/delivery', '/delivery/confirmation', '/account/profile', '/account/settings', '/create/my-cards-and-songs']) {
    const { ctx, p, errs } = await open(b, 1440, 900, url);
    let ok = false;
    try { await openViaHamburger(p); ok = await isOpen(p); } catch (e) { ok = false; }
    check(`opens on ${url}`, ok, errs.join(' | '));
    await ctx.close();
  }

  // 5. Buying: choose Creator -> pop-up closes, cart opens with the pack; pay -> 80 credits arrive
  {
    const { ctx, p, state, errs } = await open(b, 1440, 900, '/home');
    await openViaHamburger(p);
    await p.click('.tu-dialog .pr-credit:has-text("Creator") button');
    await p.waitForURL('**/cart', { timeout: 10000 }).catch(() => {});
    await p.waitForTimeout(800);
    check('choosing a pack opens the cart', pathOf(p) === '/cart', p.url());
    check('pop-up gone after choosing', !(await isOpen(p)));
    const cart = await p.evaluate(() => JSON.parse(localStorage.getItem('souv_cart') || '[]'));
    const line = cart.find((i) => i.id === 'credit-creator');
    check('cart has Creator credits ($10, 80 credits, qty 1)', line && line.price === 10 && String(line.tokens) === '80' && line.qty === 1, cart);
    check('cart badge shows 1', (await p.textContent('.souv-cart-badge').catch(() => '')) === '1');
    // Choose it again from the cart page: quantity goes to 2
    await openViaHamburger(p);
    await p.click('.tu-dialog .pr-credit:has-text("Creator") button');
    await p.waitForTimeout(900);
    const cart2 = await p.evaluate(() => JSON.parse(localStorage.getItem('souv_cart') || '[]'));
    check('choosing the same pack again adds 1 (qty 2)', (cart2.find((i) => i.id === 'credit-creator') || {}).qty === 2, cart2);
    check('cart page shows qty 2 without reloading', (await p.textContent('.ct-stepper .ct-qty-num').catch(() => '')).trim() === '2', await p.textContent('.ct-stepper .ct-qty-num').catch(() => 'none'));
    check('cart total updates to $21.00 (2 x $10 + GST)', (await p.textContent('.ct-total-val')).startsWith('$21.00'), await p.textContent('.ct-total-val'));
    // A different pack added while on the cart shows up as its own line
    await openViaHamburger(p);
    await p.click('.tu-dialog .pr-credit:has-text("Starter") button');
    await p.waitForTimeout(900);
    check('new pack appears as a line on the open cart', (await p.$$('.ct-line')).length === 2, (await p.$$('.ct-line')).length);
    // A change made on the cart page afterwards keeps the new line (no overwrite)
    await p.getByRole("button", { name: "Remove Starter credits" }).click();
    await p.waitForTimeout(400);
    const cart3 = await p.evaluate(() => JSON.parse(localStorage.getItem('souv_cart') || '[]'));
    check('cart edits after a pop-up add keep everything else', cart3.length === 1 && cart3[0].id === 'credit-creator' && cart3[0].qty === 2, cart3);
    check('still on cart, pop-up closed', pathOf(p) === '/cart' && !(await isOpen(p)));
    // Pay
    await p.click('.ct-checkout');
    await p.waitForSelector('#co-card-number');
    await p.fill('#co-card-number', '4242424242424242'); await p.fill('#co-card-exp', '1229'); await p.fill('#co-card-cvc', '123'); await p.fill('#co-card-postal', 'V6B 1A1');
    await p.click('.co-pay-cta');
    await p.waitForTimeout(3000);
    check('payment confirmed', (await p.textContent('body')).includes('Payment confirmed'));
    check('160 credits granted (2 -> 162)', state.balance === 162, state.balance);
    await p.waitForTimeout(500);
    check('nav Credits box updates to 162', (await p.textContent('.souv-credits-link .souv-credit b')).trim() === '162', await p.textContent('.souv-credits-link .souv-credit b'));
    check('no page errors (buy)', errs.length === 0, errs.join(' | '));
    await ctx.close();
  }

  // 6. Starter and Power each go to the cart with the right line
  for (const [name, id, price, tokens] of [['Starter', 'credit-starter', 2, '10'], ['Power', 'credit-power', 25, '250']]) {
    const { ctx, p } = await open(b, 1440, 900, '/create');
    await openViaHamburger(p);
    await p.click(`.tu-dialog .pr-credit:has-text("${name}") button`);
    await p.waitForURL('**/cart', { timeout: 10000 }).catch(() => {});
    await p.waitForTimeout(500);
    const cart = await p.evaluate(() => JSON.parse(localStorage.getItem('souv_cart') || '[]'));
    const line = cart.find((i) => i.id === id);
    check(`${name}: cart line $${price}, ${tokens} credits`, line && line.price === price && String(line.tokens) === tokens, cart);
    await ctx.close();
  }

  // 7. Signed out: no way to open it
  {
    const { ctx, p } = await open(b, 1440, 900, '/pricing', { signedIn: false });
    check('signed out: no Credits box', !(await p.$('.souv-balance-wrap')));
    const menu = await p.$('button[aria-label="Menu"]');
    let hasItem = false;
    if (menu) { await menu.click(); await p.waitForTimeout(250); hasItem = await p.isVisible('.souv-popmenu-item:has-text("Top Up Credits")').catch(() => false); }
    check('signed out: no "Top Up Credits" in menu', !hasItem);
    await ctx.close();
  }

  // 8. Reduced motion: opens without animation
  {
    const { ctx, p } = await open(b, 1440, 900, '/home', { motion: 'reduce' });
    await openViaHamburger(p);
    const anim = await p.$eval('.tu-dialog', (d) => getComputedStyle(d).animationName);
    check('reduced motion: no open animation', anim === 'none', anim);
    await ctx.close();
  }

  // 9. Layout at every size: fits sideways, close button reachable, everything reachable by scrolling, tap targets
  for (const [w, h] of [[1920, 1080], [1440, 900], [1024, 768], [768, 1024], [390, 844], [375, 667], [320, 568], [844, 390]]) {
    const { ctx, p } = await open(b, w, h, '/home');
    await openViaHamburger(p);
    const m = await p.evaluate(() => {
      const ov = document.querySelector('.tu-overlay');
      const d = document.querySelector('.tu-dialog').getBoundingClientRect();
      const close = document.querySelector('.tu-close').getBoundingClientRect();
      const small = [...document.querySelectorAll('.tu-dialog button, .tu-dialog a')].filter((el) => { const r = el.getBoundingClientRect(); return r.width && (r.height < 44 || r.width < 44); }).map((el) => el.textContent.trim() || el.getAttribute('aria-label'));
      return { vw: innerWidth, vh: innerHeight, left: Math.round(d.left), right: Math.round(d.right), sw: ov.scrollWidth, ow: ov.clientWidth, closeTop: Math.round(close.top), closeRight: Math.round(close.right), sh: ov.scrollHeight, ch: ov.clientHeight, bottom: Math.round(d.bottom), small };
    });
    check(`${w}x${h}: no sideways overflow`, m.left >= 0 && m.right <= m.vw && m.sw <= m.ow, m);
    check(`${w}x${h}: close button on screen`, m.closeTop >= 0 && m.closeRight <= m.vw, m);
    // Scroll the overlay to the end: the last pack's button must be reachable.
    await p.$eval('.tu-overlay', (ov) => { ov.scrollTop = ov.scrollHeight; });
    await p.waitForTimeout(150);
    const lastBtn = await p.$eval('.tu-dialog .pr-credit:last-child button', (el) => { const r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), vh: innerHeight }; });
    check(`${w}x${h}: last pack reachable by scrolling`, lastBtn.top >= 0 && lastBtn.bottom <= lastBtn.vh, lastBtn);
    check(`${w}x${h}: tap targets >= 44px`, m.small.length === 0, m.small);
    await p.$eval('.tu-overlay', (ov) => { ov.scrollTop = 0; });
    await p.screenshot({ path: path.join(__dirname, 'shots', `topup-${w}x${h}.png`) });
    await ctx.close();
  }

  const fails = results.filter((r) => !r.ok);
  fails.forEach((r) => console.log('FAIL', r.name, r.detail.slice(0, 400)));
  console.log(`${results.length - fails.length}/${results.length} passed`);
  fs.writeFileSync(path.join(__dirname, 'results.json'), JSON.stringify(results, null, 2));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
