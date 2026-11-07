// Verifies the 2026-11-04 (evening) fixes. All non-localhost requests stubbed/blocked.
const { chromium } = require('playwright-core');
const BASE = process.env.BASE || 'http://localhost:3000';
let USER = { id: 'u1', email: 'preview@souvenote.invalid', first_name: 'Alex', last_name: 'Taylor', language: 'English', currency: 'CAD', terms_accepted_at: '2026-11-01T00:00:00Z', terms_version: '1' };
const patches = [];
async function ctxFor(b, w, h, { motion = 'no-preference', touch = w < 600 } = {}) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: touch, hasTouch: touch, reducedMotion: motion });
  await ctx.route('**/*', async (r) => {
    const u = r.request().url();
    if (u.startsWith(BASE)) return r.continue();
    if (/\/auth\/me/.test(u)) {
      if (r.request().method() === 'PATCH') { const body = JSON.parse(r.request().postData()); patches.push(body); USER = { ...USER, ...body }; }
      return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: USER, paymentMethods: [] }) });
    }
    if (/\/credits\/balance\//.test(u)) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ userId: 'u1', balance: 2 }) });
    return r.abort();
  });
  await ctx.addInitScript((user) => {
    localStorage.setItem('souv_cognito_session', JSON.stringify({ idToken: 'x', accessToken: 'x', refreshToken: 'x', expiresAt: Date.now() + 3600000, email: user.email, sub: 's' }));
    localStorage.setItem('souv_local_user', JSON.stringify(user));
  }, USER);
  return ctx;
}
const centre = (p) => p.$eval('.auth-welcome-options li[data-pos="0"] a', (a) => a.getAttribute('href'));
const boxOf = (p, s) => p.$eval(s, (el) => { const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, l: r.left, r: r.right }; });
const results = [];
const check = (name, ok, info) => { results.push({ name, ok: !!ok, info }); };
const MENU_WANT = ['Profile', 'Account Settings', 'Saved Cards & Songs', 'Top Up Cards'];

(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const errors = [];

  // 1. Swipe, then the very next tap on a side card works (390x844 touch).
  {
    const ctx = await ctxFor(b, 390, 844); const p = await ctx.newPage(); p.on('pageerror', (e) => errors.push(String(e)));
    await p.goto(`${BASE}/home?welcome=1`, { waitUntil: 'networkidle' }); await p.waitForSelector('.auth-welcome-options li[data-pos="0"]');
    const before = await centre(p);
    const ul = await boxOf(p, '.auth-welcome-options');
    await p.evaluate(({ x, y }) => {
      const el = document.elementFromPoint(x, y);
      const ev = (type, cx) => el.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerType: 'touch', pointerId: 7, isPrimary: true, clientX: cx, clientY: y }));
      ev('pointerdown', x + 80); ev('pointermove', x + 40); ev('pointermove', x - 20); ev('pointerup', x - 60);
    }, ul);
    await p.waitForTimeout(2000);
    const afterSwipe = await centre(p);
    const side = await boxOf(p, '.auth-welcome-options li[data-pos="1"]');
    const sideHref = await p.$eval('.auth-welcome-options li[data-pos="1"] a', (a) => a.getAttribute('href'));
    await p.touchscreen.tap(Math.min(side.l + 14, 368), side.y); await p.waitForTimeout(700);
    check('swipe moves one card', afterSwipe !== before, { before, afterSwipe });
    const got = (await p.$('.auth-welcome-options li[data-pos="0"] a')) ? await centre(p) : 'modal gone: ' + p.url(); check('first tap after swipe centres the side card', got === sideHref, { want: sideHref, got, side });
    await ctx.close();
  }

  // 2. Hover rotation pauses on the centre card, runs over a side card (1000x800 mouse).
  {
    const ctx = await ctxFor(b, 1000, 800); const p = await ctx.newPage(); p.on('pageerror', (e) => errors.push(String(e)));
    await p.goto(`${BASE}/home?welcome=1`, { waitUntil: 'networkidle' }); await p.waitForSelector('.auth-welcome-options li[data-pos="0"]');
    const c = await boxOf(p, '.auth-welcome-options li[data-pos="0"]');
    const start = await centre(p);
    await p.mouse.move(c.x - 200, 20); await p.mouse.move(c.x, c.y, { steps: 5 }); await p.waitForTimeout(4200);
    check('no rotation while hovering centre card (4.2s)', (await centre(p)) === start, { start, now: await centre(p) });
    // right-click is not blocked for the mouse
    await p.evaluate(() => { window.__ctx = null; window.addEventListener('contextmenu', (e) => { window.__ctx = e.defaultPrevented; e.preventDefault(); }); });
    await p.mouse.click(c.x, c.y, { button: 'right' });
    check('mouse right-click not blocked', (await p.evaluate(() => window.__ctx)) === false, await p.evaluate(() => window.__ctx));
    await p.mouse.click(c.x, c.y); await p.waitForURL((u) => !u.pathname.startsWith('/home'), { timeout: 5000 }).catch(() => {});
    check('click after hovering centre opens that card', new URL(p.url()).pathname === start, { start, url: p.url() });
    await p.goto(`${BASE}/home?welcome=1`, { waitUntil: 'networkidle' }); await p.waitForSelector('.auth-welcome-options li[data-pos="0"]');
    const s = await boxOf(p, '.auth-welcome-options li[data-pos="-1"]');
    await p.mouse.move(5, 20); await p.mouse.move(Math.max(s.l + 15, 100), s.y, { steps: 5 }); await p.waitForTimeout(2200);
    check('rotation runs while hovering a side card', (await centre(p)) !== start, { start, now: await centre(p) });
    await ctx.close();
  }

  // 3. Touch long-press menu still blocked (390x844).
  {
    const ctx = await ctxFor(b, 390, 844); const p = await ctx.newPage();
    await p.goto(`${BASE}/home?welcome=1`, { waitUntil: 'networkidle' }); await p.waitForSelector('.auth-welcome-options li[data-pos="0"]');
    const c = await boxOf(p, '.auth-welcome-options li[data-pos="0"]');
    const prevented = await p.evaluate(({ x, y }) => {
      const el = document.elementFromPoint(x, y);
      el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', pointerId: 3, clientX: x, clientY: y }));
      const ev = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: x, clientY: y });
      el.dispatchEvent(ev);
      el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'touch', pointerId: 3, clientX: x, clientY: y }));
      return ev.defaultPrevented;
    }, c);
    check('touch long-press menu blocked', prevented === true, prevented);
    await ctx.close();
  }

  // 4. Reduced motion: no auto-rotation on hover, no throb; clicks still work.
  {
    const ctx = await ctxFor(b, 1000, 800, { motion: 'reduce' }); const p = await ctx.newPage();
    await p.goto(`${BASE}/home?welcome=1`, { waitUntil: 'networkidle' }); await p.waitForSelector('.auth-welcome-options li[data-pos="0"]');
    const start = await centre(p);
    const s = await boxOf(p, '.auth-welcome-options li[data-pos="-1"]');
    await p.mouse.move(5, 20); await p.mouse.move(Math.max(s.l + 15, 100), s.y, { steps: 5 }); await p.waitForTimeout(3800);
    const anim = await p.$eval('.auth-welcome-option', (a) => getComputedStyle(a).animationName);
    check('reduced motion: no hover rotation', (await centre(p)) === start, { start, now: await centre(p) });
    check('reduced motion: no throb', anim === 'none', anim);
    await p.mouse.click(Math.max(s.l + 15, 100), s.y); await p.waitForTimeout(300);
    check('reduced motion: clicking a side card still moves it', (await centre(p)) !== start, await centre(p));
    await ctx.close();
  }

  // 5. Menu order (desktop + phone) and inner-page footer socials (/pricing).
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const ctx = await ctxFor(b, w, h); const p = await ctx.newPage(); p.on('pageerror', (e) => errors.push(String(e)));
    await p.goto(`${BASE}/home`, { waitUntil: 'networkidle' }); await p.waitForSelector('.souv-nav.is-signed-in');
    await p.click('button[aria-label="Menu"]');
    const items = await p.$$eval('.souv-popmenu-site .souv-popmenu-item', (els) => els.slice(0, 4).map((e) => e.textContent.trim()));
    check(`menu order ${w}x${h}`, JSON.stringify(items) === JSON.stringify(MENU_WANT), items);
    await p.screenshot({ path: `shots/fix1104-menu-${w}x${h}.png` });
    if (w === 1440) {
      await p.goto(`${BASE}/pricing`, { waitUntil: 'networkidle' });
      const socials = await p.$$eval('.souv-footer-social-btn', (els) => els.map((e) => ({ href: e.getAttribute('href'), target: e.getAttribute('target'), label: e.getAttribute('aria-label') })));
      check('inner footer socials real', socials.length > 0 && socials.every((s) => s.href.startsWith('https://') && s.target === '_blank'), socials);
    }
    await ctx.close();
  }

  // 6. Language: only in Preferences, saves on change; Personal save no longer sends it.
  {
    const ctx = await ctxFor(b, 1440, 900); const p = await ctx.newPage(); p.on('pageerror', (e) => errors.push(String(e)));
    await p.goto(`${BASE}/account/settings`, { waitUntil: 'networkidle' }); await p.waitForSelector('.acc-set-group');
    const personalHasLang = await p.$$eval('.acc-set-group .acc-flabel', (els) => els.some((e) => e.textContent.trim() === 'Language'));
    check('Personal info has no Language', !personalHasLang, personalHasLang);
    await p.getByRole('button', { name: 'Preferences' }).first().click();
    await p.waitForSelector('#prefs-language');
    const langCount = await p.$$eval('.acc-flabel', (els) => els.filter((e) => e.textContent.trim() === 'Language').length);
    check('one Language field in Preferences', langCount === 1, langCount);
    await p.selectOption('#prefs-language', 'Francais');
    await p.waitForSelector('text=Language saved.', { timeout: 5000 }).catch(() => {});
    check('Language saves', patches.some((x) => x.language === 'Francais' && Object.keys(x).length === 1) && !!(await p.$('text=Language saved.')), patches);
    check('Language keeps new value', (await p.$eval('#prefs-language', (s) => s.value)) === 'Francais', await p.$eval('#prefs-language', (s) => s.value));
    await p.screenshot({ path: 'shots/fix1104-prefs-language-1440x900.png' });
    patches.length = 0;
    await p.getByRole('button', { name: 'Personal info' }).first().click();
    await p.getByRole('button', { name: 'Save changes' }).click(); await p.waitForTimeout(800);
    check('Personal save omits language', patches.length === 1 && !('language' in patches[0]), patches);
    await ctx.close();
  }

  check('no page errors', errors.length === 0, errors);
  for (const r of results) console.log(r.ok ? 'PASS' : 'FAIL', r.name, r.ok ? '' : JSON.stringify(r.info));
  console.log(`${results.filter((r) => r.ok).length}/${results.length}`);
  await b.close();
})();
