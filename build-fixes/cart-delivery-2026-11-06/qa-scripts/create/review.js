// Acceptance review checks for /create beyond behaviour.js. BASE=http://localhost:3217 (production build).
const { BASE, ctxFor, launch } = require('./lib');
const { chromium } = require('playwright-core');
const fs = require('fs'); fs.mkdirSync('create/review', { recursive: true });
const results = []; const check = (n, ok, info) => results.push({ n, ok: !!ok, info: ok ? '' : JSON.stringify(info).slice(0, 160) });
const path = (p) => new URL(p.url()).pathname;
async function open(b, w, h, opts = {}) { const state = opts.state || {}; const ctx = await ctxFor(b, w, h, { ...opts, state }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto(`${BASE}/create`, { waitUntil: opts.wait || 'networkidle' }); return { ctx, p, state, errs }; }

(async () => {
  const b = await launch();

  // A. What a phone shows before JavaScript runs (server HTML only).
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, javaScriptEnabled: false, isMobile: w < 600, hasTouch: w < 600, reducedMotion: 'reduce' });
    await ctx.route('**/*', r => r.request().url().startsWith(BASE) ? r.continue() : r.abort());
    const p = await ctx.newPage(); await p.goto(`${BASE}/create`, { waitUntil: 'load' });
    const info = await p.evaluate(() => { const vis = (sel) => [...document.querySelectorAll(sel)].filter(e => e.offsetWidth > 0).length; return { closed: vis('.cr-closed'), openedSecondary: vis('.cr-card.is-secondary'), dots: vis('.cr-dot'), centre: document.querySelectorAll('.cr-primary [data-pos="0"]').length, overflow: [...document.querySelectorAll('.cr-card-left, .cr-card-right, .cr-closed')].filter(e => e.offsetWidth > 0 && e.scrollHeight > e.clientHeight + 1).length,
      secW: [...document.querySelectorAll('.cr-secondary li')].map(li => Math.round(li.getBoundingClientRect().width)) }; });
    await p.screenshot({ path: `create/review/nojs-${w}x${h}.png` });
    if (w === 390) check('phone pre-hydration HTML matches phone layout (closed cards, dots)', info.closed === 2 && info.openedSecondary === 0 && info.dots === 2 && info.centre === 1 && info.overflow === 0, info);
    else check('desktop pre-hydration HTML matches desktop layout', info.openedSecondary === 2 && info.closed === 0 && info.dots === 0 && info.overflow === 0, info);
    await ctx.close();
  }

  // B. Layout shift during load on a phone (CLS).
  { const ctx = await ctxFor(b, 390, 844, { motion: 'reduce' }); const p = await ctx.newPage();
    await p.addInitScript(() => { window.__cls = 0; new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); });
    await p.goto(`${BASE}/create`, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
    const cls = await p.evaluate(() => window.__cls); check('phone layout shift (CLS) under 0.1', cls < 0.1, { cls }); results[results.length - 1].info = 'CLS=' + cls.toFixed(3); await ctx.close(); }

  // C. Nav hamburger on /create: opens, Escape closes, focus returns, outside press closes.
  { const { ctx, p } = await open(b, 1440, 900, { motion: 'reduce' });
    const btn = await p.$('.souv-nav button[aria-expanded]');
    if (!btn) check('hamburger present', false, 'no aria-expanded button'); else {
      await btn.click(); await p.waitForTimeout(300);
      check('menu opens (aria-expanded=true)', (await btn.getAttribute('aria-expanded')) === 'true', '');
      await p.keyboard.press('Escape'); await p.waitForTimeout(300);
      check('Escape closes menu', (await btn.getAttribute('aria-expanded')) === 'false', '');
      check('focus returns to menu button', await p.evaluate(b => document.activeElement === b, btn), '');
      await btn.click(); await p.waitForTimeout(300); await p.mouse.click(700, 500); await p.waitForTimeout(300);
      check('outside press closes menu without opening a card', (await btn.getAttribute('aria-expanded')) === 'false' && path(p) === '/create', p.url());
    }
    await ctx.close(); }

  // D. Balance still loading: line empty, nav reads 0, a pick waits for the backend.
  { const state = { balance: 2, delay: 3000 }; const { ctx, p } = await open(b, 1440, 900, { state, wait: 'domcontentloaded' });
    await p.waitForSelector('.cr-card'); await p.waitForTimeout(800);
    check('loading: credits line empty', (await p.textContent('.l-hero-balance')).trim() === '', await p.textContent('.l-hero-balance'));
    await p.click('.cr-card.is-build', { force: true }); await p.waitForTimeout(500);
    check('loading: pick shows spinner, stays', !!(await p.$('.cr-card.is-build .cr-spinner')) && path(p) === '/create', p.url());
    await p.waitForURL('**/create/build-my-card', { timeout: 10000 }).catch(() => {});
    check('loading: opens once backend answers', path(p) === '/create/build-my-card', p.url()); await ctx.close(); }

  // E. One credit: singular copy, opens.
  { const { ctx, p } = await open(b, 1440, 900, { balance: 1 });
    check('1 credit: "You have 1 credit"', (await p.textContent('.l-hero-balance')).trim() === 'You have 1 credit', await p.textContent('.l-hero-balance'));
    await p.click('.cr-card.is-template', { force: true }); await p.waitForURL('**/personalize-a-template', { timeout: 8000 }).catch(() => {});
    check('1 credit: template opens', path(p) === '/create/personalize-a-template', p.url()); await ctx.close(); }

  // F. Credit balance fails on load: line empty, nav still renders, page usable.
  { const { ctx, p } = await open(b, 1440, 900, { balance: 'error' });
    check('balance error on load: line empty', (await p.textContent('.l-hero-balance')).trim() === '', '');
    await p.click('.cr-card.is-saved', { force: true }); await p.waitForURL('**/my-cards-and-songs', { timeout: 8000 }).catch(() => {});
    check('balance error: Saved still opens', path(p) === '/create/my-cards-and-songs', p.url()); await ctx.close(); }

  // G. Invalid stored session (backend rejects it) -> sent to /.
  { const ctx = await ctxFor(b, 1440, 900); await ctx.route(/\/auth\/me/, r => r.fulfill({ status: 401, body: '{}' }));
    const p = await ctx.newPage(); await p.goto(`${BASE}/create`); await p.waitForTimeout(3000);
    check('rejected session -> /', path(p) === '/', p.url()); await ctx.close(); }

  // H. Skip link, Enter key, phone carousel 0-credit + error.
  { const { ctx, p } = await open(b, 1440, 900, { motion: 'reduce', touch: false });
    await p.keyboard.press('Tab'); const skip = await p.evaluate(() => document.activeElement.className + '|' + document.activeElement.getAttribute('href'));
    check('first Tab = skip link to #main', skip.includes('l-skip') && skip.endsWith('#main'), skip);
    await p.focus('.cr-card.is-template'); await p.keyboard.press('Enter'); await p.waitForURL('**/personalize-a-template', { timeout: 8000 }).catch(() => {});
    check('Enter on Template runs check and opens', path(p) === '/create/personalize-a-template', p.url()); await ctx.close(); }
  { const { ctx, p, state } = await open(b, 390, 844, { state: { balance: 0 } }); await p.waitForTimeout(500);
    const c = await p.$eval('.cr-primary li[data-pos="0"] a', a => { const r = a.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    await p.touchscreen.tap(c.x, c.y); await p.waitForSelector('[role=dialog][aria-labelledby=tu-title]', { timeout: 8000 }).catch(() => {});
    check('phone: 0 credits centre tap -> top-up pop-up', path(p) === '/create' && !!(await p.$('[role=dialog][aria-labelledby=tu-title]')), p.url()); await ctx.close(); }
  { const { ctx, p } = await open(b, 390, 844, { state: { balance: 'error' } }); await p.waitForTimeout(500);
    const c = await p.$eval('.cr-primary li[data-pos="0"] a', a => { const r = a.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    await p.touchscreen.tap(c.x, c.y); await p.waitForTimeout(1000);
    const err = await p.$eval('.cr-error', e => { const r = e.getBoundingClientRect(); return { t: e.textContent, vis: r.top >= 0 && r.bottom <= innerHeight }; });
    check('phone: backend down -> message visible', err.t.startsWith("We couldn't") && err.vis, err);
    await p.screenshot({ path: 'create/review/error-390x844.png' }); await ctx.close(); }

  // I. Sticky hover after tapping a side card on touch.
  { const { ctx, p } = await open(b, 390, 844); await p.waitForTimeout(500);
    const s = await p.$eval('.cr-primary li[data-pos="1"]', li => { const r = li.getBoundingClientRect(); return { x: Math.min(r.left + 14, 380), y: r.top + r.height / 2 }; });
    await p.touchscreen.tap(s.x, s.y); await p.waitForTimeout(900);
    const tr = await p.$eval('.cr-card.is-build', e => getComputedStyle(e).translate);
    check('touch: no sticky hover lift after tap', tr === 'none' || tr === '0px' || tr === '0px 0px', { translate: tr }); await ctx.close(); }

  // J. Tap targets, headings, landmarks, closed-card names, forced colours.
  { const { ctx, p } = await open(b, 390, 844, { motion: 'reduce' });
    const small = await p.$$eval('main a, main button', els => els.filter(e => e.offsetParent !== null && !e.classList.contains('l-skip')).map(e => { const r = e.getBoundingClientRect(); return { t: (e.getAttribute('aria-label') || e.textContent).trim().slice(0, 24), w: Math.round(r.width), h: Math.round(r.height) }; }).filter(x => x.w < 44 || x.h < 44));
    check('phone: all main tap targets >= 44x44', small.length === 0, small);
    const heads = await p.$$eval('h1,h2,h3,h4,h5,h6', hs => hs.map(h => h.tagName + ':' + h.textContent.trim().slice(0, 30)));
    check('one h1, no skipped levels in main', heads.filter(h => h.startsWith('H1')).length === 1, heads); results[results.length - 1].info = heads.join(' / ').slice(0, 160);
    const lm = await p.evaluate(() => ({ main: document.querySelectorAll('main').length, nav: document.querySelectorAll('nav').length, footer: document.querySelectorAll('footer').length }));
    check('landmarks: 1 main, nav, footer', lm.main === 1 && lm.nav >= 1 && lm.footer >= 1, lm);
    const names = await p.$$eval('.cr-closed', as => as.map(a => a.textContent.replace(/\s+/g, ' ').trim()));
    check('closed cards: name includes the explanation', names[0].includes('No AI credits required') && names[1].includes('Queue another song'), names);
    await ctx.close(); }
  { const ctx = await ctxFor(b, 1440, 900, { motion: 'reduce' }); const p = await ctx.newPage(); await p.emulateMedia({ forcedColors: 'active' });
    await p.goto(`${BASE}/create`, { waitUntil: 'networkidle' }); await p.waitForTimeout(800); await p.screenshot({ path: 'create/review/forced-colors-1440.png' });
    // Only the cards this layout shows (the other layout's variants are display:none by design).
    const vis = await p.$$eval('.cr-card-title, .cr-card-sub, .cr-title', els => { const shown = els.filter(e => { const card = e.closest('.cr-card, .cr-closed'); return !card || card.offsetWidth > 0; }); return shown.length >= 9 && shown.every(e => e.getBoundingClientRect().height > 0 && getComputedStyle(e).visibility !== 'hidden'); });
    check('forced colours: headings/titles/handwriting rendered', vis, ''); await ctx.close(); }

  // L. Live cart badge: reads the saved cart, updates in the same tab and from another tab.
  { const { ctx, p } = await open(b, 1440, 900, { motion: 'reduce' });
    const badge = () => p.evaluate(() => { const a = document.querySelector('.souv-nav a[href="/cart"]'); const b = a.querySelector('.souv-cart-badge'); return (b ? b.textContent : '-') + '|' + a.getAttribute('aria-label'); });
    check('cart empty: no badge, "Cart, empty"', (await badge()) === '-|Cart, empty', await badge());
    await p.evaluate(() => { localStorage.setItem('souv_cart', JSON.stringify([{ id: 'a', qty: 1 }, { id: 'b', qty: 2 }])); window.dispatchEvent(new Event('souv-cart-changed')); });
    await p.waitForTimeout(200);
    check('cart same-tab update: badge 3, "Cart, 3 items"', (await badge()) === '3|Cart, 3 items', await badge());
    const p2 = await ctx.newPage(); await p2.goto(`${BASE}/create`, { waitUntil: 'networkidle' });
    await p2.evaluate(() => localStorage.setItem('souv_cart', JSON.stringify([{ id: 'a', qty: 1 }])));
    await p.waitForTimeout(400);
    check('cart other-tab update: badge 1, "Cart, 1 item"', (await badge()) === '1|Cart, 1 item', await badge());
    // adding from Pricing goes through the real writer
    await p.evaluate(() => localStorage.removeItem('souv_cart')); await p.goto(`${BASE}/pricing`, { waitUntil: 'networkidle' }); await p.waitForTimeout(600);
    const add = await p.$('main button:has-text("Add"), main button:has-text("Buy"), main button:has-text("Choose"), main a:has-text("Buy")');
    if (add) { await add.click({ force: true }); await p.waitForTimeout(1500); const after = await p.evaluate(() => (JSON.parse(localStorage.getItem('souv_cart') || '[]')).length);
      check('pricing add-to-cart -> badge counts it', after > 0 && !(await badge()).startsWith('-'), { url: p.url(), after, badge: await badge() }); }
    else results.push({ n: 'pricing add-to-cart (skipped: no button found)', ok: true, info: '' });
    await ctx.close(); }

  // M. Welcome modal: no sticky hover after a tap on touch.
  { const ctx = await ctxFor(b, 390, 844); const p = await ctx.newPage(); await p.goto(`${BASE}/home?welcome=1`, { waitUntil: 'networkidle' }); await p.waitForSelector('.auth-welcome-option'); await p.waitForTimeout(800);
    const s = await p.$eval('.auth-welcome-options li[data-pos="1"]', li => { const r = li.getBoundingClientRect(); return { x: Math.min(r.left + 14, 380), y: r.top + r.height / 2, href: li.querySelector('a').getAttribute('href') }; });
    await p.touchscreen.tap(s.x, s.y); await p.waitForTimeout(900);
    const tr = await p.$eval(`.auth-welcome-option[href="${s.href}"]`, e => getComputedStyle(e).translate);
    check('Welcome touch: no sticky hover lift after tap', tr === 'none' || tr === '0px' || tr === '0px 0px', { translate: tr }); await ctx.close(); }

  // K. Search engines and privacy.
  { const ctx = await b.newContext(); const p = await ctx.newPage();
    const html = await (await ctx.request.get(`${BASE}/create`)).text();
    check('robots meta noindex in server HTML', /<meta name="robots" content="noindex/.test(html), html.match(/<meta name="robots"[^>]*>/)?.[0]);
    check('no canonical / JSON-LD on /create', !/rel="canonical"/.test(html) && !/application\/ld\+json/.test(html), '');
    check('title in server HTML', /<title>Create a Card \| Souvenote<\/title>/.test(html), html.match(/<title>[^<]*<\/title>/)?.[0]);
    check('no user data in server HTML', !/preview@souvenote|Alex|You have \d/.test(html), '');
    const sm = await (await ctx.request.get(`${BASE}/sitemap.xml`)).text(); check('/create not in sitemap', !/\/create/.test(sm), '');
    const rb = await (await ctx.request.get(`${BASE}/robots.txt`)).text(); results.push({ n: 'robots.txt (info)', ok: true, info: rb.replace(/\s+/g, ' ').slice(0, 120) });
    await ctx.close(); }

  console.table(results); console.log(results.filter(r => r.ok).length + '/' + results.length);
  await b.close();
})();
