const { BASE, ctxFor, launch } = require('./lib');
const results = []; const check = (n, ok, info) => results.push({ n, ok: !!ok, info: ok ? '' : JSON.stringify(info) });
const path = (p) => new URL(p.url()).pathname;
const ERR = "We couldn't check your credits. Please try again.";
async function open(b, w, h, opts = {}) {
  const state = opts.state || {}; const ctx = await ctxFor(b, w, h, { ...opts, state }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto(`${BASE}/create`, { waitUntil: 'networkidle' }); await p.waitForSelector('.cr-card'); await p.waitForTimeout(600);
  return { ctx, p, state, errs };
}
(async () => {
  const b = await launch();
  // 1. desktop, balance 2, slow check: spinner, busy, single fresh call, then navigates
  { const { ctx, p, state, errs } = await open(b, 1440, 900, { state: { balance: 2 } });
    check('title', (await p.title()) === 'Create a Card | Souvenote', await p.title());
    check('noindex', /noindex/.test(await p.$eval('meta[name=robots]', m => m.content).catch(() => '')), '');
    check('one h1', (await p.$$('h1')).length === 1, '');
    check('credits line', /You have 2 credits/.test(await p.textContent('.l-hero-balance')), await p.textContent('.l-hero-balance'));
    const order = await p.$$eval('.cr-card', as => as.map(a => a.getAttribute('href')));
    check('quadrant order', order.join() === '/create/personalize-a-template,/create/build-my-card,/community-cards,/create/my-cards-and-songs', order);
    const boxes = await p.$$eval('.cr-card', as => as.map(a => { const r = a.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y)]; }));
    const widths = await p.$$eval('.cr-card', as => as.map(a => a.offsetWidth));
    check('main pair on top and larger', boxes[2][1] > boxes[0][1] + 100 && boxes[3][1] > boxes[1][1] + 100 && widths[0] === widths[1] && widths[2] === widths[3] && widths[2] < widths[0] * 0.8, { boxes, widths });
    check('no inert on desktop', (await p.$$('.cr-options li[inert]')).length === 0, '');
    state.delay = 1500; const before = state.balanceCalls;
    await p.click('.cr-card.is-template', { force: true }); await p.waitForTimeout(300);
    await p.click('.cr-card.is-template', { force: true }); await p.waitForTimeout(300);
    check('spinner while checking', await p.$('.cr-card.is-template .cr-spinner'), '');
    check('aria-busy', (await p.getAttribute('.cr-card.is-template', 'aria-busy')) === 'true', '');
    check('sr status', (await p.textContent('.cr-picker [aria-live="polite"]')) === 'Checking your credits', '');
    check('still on /create while checking', path(p) === '/create', p.url());
    // Counted before the backend answers (the option page makes its own requests once it opens).
    check('exactly one fresh balance call (double-click ignored)', state.balanceCalls - before === 1, { calls: state.balanceCalls - before });
    await p.waitForTimeout(1300);
    state.delay = 0;
    await p.waitForURL('**/create/personalize-a-template', { timeout: 8000 }).catch(() => {});
    check('2 credits -> template opens', path(p) === '/create/personalize-a-template', p.url());
    check('no page errors', errs.length === 0, errs);
    await ctx.close(); }
  // 2. 0 credits -> Top up credits pop-up on /create (2026-11-07; was a trip to Pricing); return path saved once a pack is chosen
  { const { ctx, p } = await open(b, 1440, 900, { balance: 0 });
    await p.click('.cr-card.is-build', { force: true }); await p.waitForSelector('[role=dialog][aria-labelledby=tu-title]', { timeout: 8000 }).catch(() => {}); await p.waitForTimeout(400);
    check('0 credits -> top-up pop-up on /create', path(p) === '/create' && !!(await p.$('[role=dialog][aria-labelledby=tu-title]')), p.url());
    await p.click('.tu-dialog .pr-credit:has-text("Starter") button'); await p.waitForURL('**/cart', { timeout: 8000 }).catch(() => {});
    check('return path remembered', (await p.evaluate(() => localStorage.getItem('souv_pricing_return_to'))) === '/create/build-my-card', '');
    await ctx.close(); }
  // 3. page loaded with 2, but backend says 0 at pick time -> top-up pop-up (fresh check, not cached)
  { const { ctx, p, state } = await open(b, 1440, 900, { state: { balance: 2 } });
    state.balance = 0; await p.click('.cr-card.is-template', { force: true }); await p.waitForSelector('[role=dialog][aria-labelledby=tu-title]', { timeout: 8000 }).catch(() => {});
    check('fresh check beats page-load balance', path(p) === '/create' && !!(await p.$('[role=dialog][aria-labelledby=tu-title]')), p.url()); await ctx.close(); }
  // 4. backend down -> stays + message, retry works
  { const { ctx, p, state } = await open(b, 1440, 900, { state: { balance: 'error' } });
    await p.click('.cr-card.is-build', { force: true }); await p.waitForTimeout(800);
    check('error: stays', path(p) === '/create', p.url());
    check('error message', (await p.textContent('.cr-error')) === ERR, await p.textContent('.cr-error'));
    check('error role alert', (await p.getAttribute('.cr-error', 'role')) === 'alert', '');
    check('no spinner after error', !(await p.$('.cr-spinner')), '');
    await p.screenshot({ path: 'create/shots/create-error-1440x900.png' });
    state.balance = 2; await p.click('.cr-card.is-build', { force: true }); await p.waitForURL('**/create/build-my-card', { timeout: 8000 }).catch(() => {});
    check('retry after error opens', path(p) === '/create/build-my-card', p.url()); await ctx.close(); }
  // 5. community + saved: no credit check
  for (const [k, want] of [['community', '/community-cards'], ['saved', '/create/my-cards-and-songs']]) {
    const { ctx, p } = await open(b, 1440, 900, { state: { balance: 0 } });
    await p.click(`.cr-card.is-${k}`, { force: true }); await p.waitForURL(`**${want}`, { timeout: 8000 }).catch(() => {});
    check(`${k} opens without check (0 credits)`, path(p) === want, p.url()); await ctx.close(); }
  // 6. signed out -> /
  { const ctx = await ctxFor(b, 1440, 900, { signedIn: false }); const p = await ctx.newPage(); await p.goto(`${BASE}/create`); await p.waitForTimeout(1500);
    check('signed out -> /', path(p) === '/', p.url()); await ctx.close(); }
  // 7. phone carousel
  { const { ctx, p, state } = await open(b, 390, 844, { state: { balance: 2 } });
    const centre = () => p.$eval('.cr-primary li[data-pos="0"] a', a => a.getAttribute('href'));
    check('carousel starts on template', (await centre()) === '/create/personalize-a-template', '');
    check('secondaries are closed cards', (await p.$$('.cr-secondary .cr-closed')).length === 2, '');
    check('2 dots', (await p.$$('.cr-dot')).length === 2, '');
    const dotSizes = await p.$$eval('.cr-dot', ds => ds.map(d => d.getBoundingClientRect().width + 'x' + d.getBoundingClientRect().height));
    check('dots 44x44', dotSizes.every(s => s === '44x44'), dotSizes);
    const side = await p.$eval('.cr-primary li[data-pos="1"]', li => { const r = li.getBoundingClientRect(); return { x: r.left + 14, y: r.top + r.height / 2 }; });
    const before = state.balanceCalls;
    await p.touchscreen.tap(Math.min(side.x, 380), side.y); await p.waitForTimeout(700);
    check('tap side card centres it (no nav, no check)', (await centre()) === '/create/build-my-card' && path(p) === '/create' && state.balanceCalls === before, { c: await centre(), calls: state.balanceCalls - before });
    for (const i of [1, 0]) { await p.click(`.cr-dot >> nth=${i}`); await p.waitForTimeout(650); }
    check('dots move centre', (await centre()) === '/create/personalize-a-template', await centre());
    const ul = await p.$eval('.cr-primary', el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    await p.evaluate(({ x, y }) => { const el = document.elementFromPoint(x, y); const ev = (t, cx) => el.dispatchEvent(new PointerEvent(t, { bubbles: true, pointerType: 'touch', pointerId: 3, isPrimary: true, clientX: cx, clientY: y }));
      ev('pointerdown', x + 80); ev('pointermove', x + 40); ev('pointermove', x - 20); ev('pointerup', x - 60); }, ul);
    await p.waitForTimeout(650);
    check('swipe steps one card', (await centre()) === '/create/build-my-card', await centre());
    const c = await p.$eval('.cr-primary li[data-pos="0"] a', a => { const r = a.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    await p.touchscreen.tap(c.x, c.y); await p.waitForURL('**/create/build-my-card', { timeout: 8000 }).catch(() => {});
    check('first tap after swipe opens centre (with check)', path(p) === '/create/build-my-card' && state.balanceCalls > before, { url: p.url(), calls: state.balanceCalls - before });
    await ctx.close(); }
  // 8. keyboard in carousel: tab through cards in order, focus centres each
  { const { ctx, p } = await open(b, 390, 844, { touch: false });
    await p.evaluate(() => { const h = document.querySelector('.cr-head'); h.setAttribute('tabindex', '-1'); h.focus(); });
    const seen = [];
    for (let i = 0; i < 6; i++) { await p.keyboard.press('Tab'); await p.waitForTimeout(650);
      seen.push(await p.evaluate(() => { const a = document.activeElement; if (a.classList.contains('cr-dot')) return 'dot'; const li = a.closest('li'); return a.getAttribute('href') + '@' + (li && li.dataset.pos); })); }
    check('tab order + focus centres card', seen.join() === '/create/personalize-a-template@0,/create/build-my-card@0,dot,dot,/community-cards@undefined,/create/my-cards-and-songs@undefined', seen);
    await ctx.close(); }
  // 9. reduced motion: no animations
  { const { ctx, p } = await open(b, 1440, 900, { motion: 'reduce' });
    const an = await p.$$eval('.cr-card, .cr-card-left, .cr-card-right, .cr-closed', els => els.map(e => getComputedStyle(e).animationName));
    check('reduced motion: no throb', an.every(a => a === 'none'), an.slice(0, 3)); await ctx.close();
    const { ctx: c2, p: p2 } = await open(b, 1440, 900);
    const an2 = await p2.$eval('.cr-card', e => getComputedStyle(e).animationName);
    check('throb on normally', an2 === 'cr-card-breathe', an2); await c2.close(); }
  // 10. axe
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const { ctx, p } = await open(b, w, h, { motion: 'reduce' });
    await p.addScriptTag({ path: require.resolve('axe-core') });
    const r = await p.evaluate(async () => (await axe.run(document.querySelector('main'), { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] })).violations.map(v => v.id + ':' + v.nodes.length));
    check(`axe ${w}x${h} (main) no violations`, r.length === 0, r);
    await ctx.close(); }
  console.table(results); console.log(results.filter(r => r.ok).length + '/' + results.length);
  await b.close();
})();
