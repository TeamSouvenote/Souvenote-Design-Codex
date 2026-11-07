// Pricing behaviour checks against the dev server. All outside requests are
// stubbed (lib.js); checkout here is the app's local test checkout.
const { BASE, ctxFor, launch } = require('./lib');
const results = [];
const check = (n, ok, info) => results.push({ n, ok: !!ok, info: ok ? '' : JSON.stringify(info) });
const path = (p) => new URL(p.url()).pathname;
const cart = (p) => p.evaluate(() => JSON.parse(localStorage.getItem('souv_cart') || '[]'));

async function open(b, w, h, opts = {}) {
  const state = {};
  const ctx = await ctxFor(b, w, h, { ...opts, state });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(BASE + (opts.url || '/pricing'), { waitUntil: opts.pricing === 'hang' ? 'load' : 'networkidle' });
  await p.waitForTimeout(900);
  return { ctx, p, state, errs };
}

async function payInCart(p) {
  // New cart (2026-11-06 redesign): no gift offer; card fields must be filled before Pay.
  await p.waitForSelector('.ct-checkout');
  await p.click('.ct-checkout');
  await p.waitForSelector('#co-card-number');
  await p.fill('#co-card-number', '4242424242424242'); await p.fill('#co-card-exp', '1229');
  await p.fill('#co-card-cvc', '123'); await p.fill('#co-card-postal', 'V6B 1A1');
  await p.click('.co-pay-cta');
  await p.waitForTimeout(2600);
}

(async () => {
  const b = await launch();

  // 1. Metadata, headings, structured data, content
  { const { ctx, p, errs } = await open(b, 1440, 900);
    check('title', (await p.title()) === 'Pricing | Souvenote', await p.title());
    const desc = await p.$eval('meta[name=description]', (m) => m.content);
    check('description', desc === 'Print and send a card for $9.99 with shipping and 10 AI credits included, save with Big Sender from $6.99 a card, or top up creation credits from $2. All prices in CAD.', desc);
    const mainText = (await p.textContent('main')).replace(/\s+/g, ' ');
    check('lede (2026-11-06)', mainText.includes('Every card includes shipping + 10 AI credits. Buy just one or stock up on more to save.'), '');
    check('lede underline on 10 AI credits', (await p.textContent('.pr-lede-mark')) === '10 AI credits', '');
    check('P&S meta', mainText.includes('Send 1 card') && mainText.includes('Shipping and 10 AI creation credits included'), '');
    check('P&S step 1', mainText.includes('Buy your card + credits') && mainText.includes('It waits in your card bank, shown as Credits and Cards at the top of the page and in the menu.'), '');
    check('P&S step 2', mainText.includes('Choose from four different creation options.'), '');
    check('Big Sender meta', mainText.includes('Send multiple different cards') && mainText.includes('Shipping and 10 AI creation credits included per card'), '');
    check('canonical', (await p.$eval('link[rel=canonical]', (l) => l.href)) === 'https://souvenote.com/pricing', '');
    check('indexable', !(await p.$('meta[name=robots][content*=noindex]')), '');
    check('one h1', (await p.$$('h1')).length === 1, '');
    const ld = JSON.parse(await p.$eval('script[type="application/ld+json"]', (s) => s.textContent));
    check('JSON-LD offers', ld['@type'] === 'OfferCatalog' && ld.itemListElement.length === 5 && ld.itemListElement[0].price === '9.99' && ld.itemListElement[0].priceCurrency === 'CAD', ld);
    const body = await p.textContent('main');
    check('no Try Risk-Free', !/risk/i.test(body), '');
    check('no local-backend wording', !/local backend/i.test(body), '');
    check('15-month note', body.includes('Each card has a 15-month send window'), '');
    check('tax is extra', body.includes('tax is extra') && !body.includes('optional, and'), '');
    const tiers = await p.$$eval('.pr-tier-range', (els) => els.map((e) => e.textContent));
    check('tiers from backend + open last tier', tiers.join('|') === '2-10 cards|11-20 cards|21-30+ cards', tiers);
    check('signed-in back link', (await p.textContent('.pr-back')).trim() === 'Back to options' && (await p.getAttribute('.pr-back', 'href')) === '/create', '');
    check('no page errors', errs.length === 0, errs);
    await ctx.close(); }

  // 2. Big Sender: no maximum, tiers, stepper, typing, reserve
  { const { ctx, p } = await open(b, 1440, 900);
    const total = () => p.textContent('.pr-qty-total');
    check('starts at 2 / $17.98', (await p.inputValue('#pr-bs-qty')) === '2' && (await total()) === '$17.98', await total());
    check('minus disabled at minimum', await p.$eval('.pr-stepper button[aria-label=Decrease]', (x) => x.disabled), '');
    await p.click('.pr-stepper button[aria-label=Increase]'); await p.waitForTimeout(200);
    check('plus -> 3 / $26.97', (await p.inputValue('#pr-bs-qty')) === '3' && (await total()) === '$26.97', await total());
    await p.fill('#pr-bs-qty', '35');
    check('35 cards allowed: $244.65', (await total()) === '$244.65', await total());
    const pressed = await p.$$eval('.pr-tier', (els) => els.map((e) => e.getAttribute('aria-pressed')));
    check('21-30+ tier pressed at 35', pressed.join() === 'false,false,true', pressed);
    await p.click('.pr-stepper button[aria-label=Increase]'); await p.waitForTimeout(200);
    check('plus works past 30 (36)', (await p.inputValue('#pr-bs-qty')) === '36', '');
    await p.fill('#pr-bs-qty', '');
    await p.click('h1');
    check('empty box restores last valid value', (await p.inputValue('#pr-bs-qty')) === '36', await p.inputValue('#pr-bs-qty'));
    await p.click('.pr-tier >> nth=1'); await p.waitForTimeout(200);
    check('tier button sets 11', (await p.inputValue('#pr-bs-qty')) === '11' && (await total()) === '$87.89', await total());
    await p.fill('#pr-bs-qty', '40');
    check('button label', (await p.textContent('.pr-offer >> nth=1 >> .pr-cta')).includes('Reserve 40 cards · $279.60'), '');
    await p.click('.pr-offer >> nth=1 >> .pr-cta');
    await p.waitForURL('**/cart', { timeout: 10000 }).catch(() => {});
    check('reserve -> /cart', path(p) === '/cart', p.url());
    await p.waitForTimeout(800);
    const items = await cart(p);
    const bs = items.find((i) => i.id === 'pack-bigsender');
    check('cart keeps 40 cards (no 30 cap)', bs && bs.cardCount === 40 && Math.abs(bs.price - 279.6) < 0.001, bs);
    await ctx.close(); }

  // 3. Print and Send purchase -> card bank + pop-up
  { const { ctx, p, state, errs } = await open(b, 1440, 900);
    check('nav Cards 0 before', (await p.textContent('.souv-credit-bank b')) === '0', '');
    await p.click('.pr-offer >> nth=0 >> .pr-cta');
    await p.waitForURL('**/cart', { timeout: 10000 }).catch(() => {});
    await p.waitForTimeout(800);
    const items = await cart(p);
    const ps = items.find((i) => i.id === 'pack-print-and-send');
    check('P&S in cart at $9.99, 1 card, 10 credits', ps && ps.price === 9.99 && ps.cardCount === 1 && ps.creditsPerCard === 10 && ps.qty === 1, ps);
    check('cart line shows Print and Send', (await p.textContent('.ct-wrap')).includes('Print and Send'), '');
    // stored price can't be tampered with: rebuilt from the catalog
    await p.evaluate(() => { const c = JSON.parse(localStorage.getItem('souv_cart')); c.forEach((i) => { if (i.id === 'pack-print-and-send') i.price = 0.01; }); localStorage.setItem('souv_cart', JSON.stringify(c)); });
    await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(800);
    check('tampered price restored to $9.99', ((await cart(p)).find((i) => i.id === 'pack-print-and-send') || {}).price === 9.99, '');
    await p.evaluate(() => localStorage.setItem('souv_pricing_return_to', '/create/build-my-card'));
    await payInCart(p);
    check('stays on /cart after paying', path(p) === '/cart', p.url());
    check('payment confirmed shown', (await p.textContent('body')).includes('Payment confirmed'), '');
    check('P&S grants 10 credits (2 -> 12)', state.balance === 12, state.balance);
    check('pop-up body (2026-11-06 copy)', (await p.textContent('#pr-ready-body')).replace(/\s+/g, ' ').trim() === "Choose one of the following options to create a new card or send a saved one.", await p.textContent('#pr-ready-body'));
    const dlg = await p.$('[role=dialog][aria-labelledby=pr-ready-title]');
    check('pop-up open', !!dlg, '');
    check('pop-up title', (await p.textContent('#pr-ready-title')).replace(/\s+/g, ' ').trim() === 'Your cards are waiting', '');
    check('pop-up focused', await p.evaluate(() => document.activeElement && document.activeElement.classList.contains('pr-ready')), '');
    const links = await p.$$eval('.pr-ready a', (as) => as.map((a) => a.textContent + '>' + a.getAttribute('href')));
    check('pop-up links', links.join('|') === 'Personalize a Template>/create/personalize-a-template|Build My Card>/create/build-my-card|Community Cards>/community-cards|Saved Cards & Songs>/create/my-cards-and-songs', links);
    check('page behind inert', await p.evaluate(() => [...document.body.children].filter((c) => !c.classList.contains('pr-ready-overlay') && c.tagName !== 'SCRIPT').every((c) => c.inert)), '');
    check('scroll locked', await p.evaluate(() => getComputedStyle(document.documentElement).overflow === 'hidden'), '');
    check('return path cleared', (await p.evaluate(() => localStorage.getItem('souv_pricing_return_to'))) === null, '');
    check('nav Cards 1 after', (await p.textContent('.souv-credit-bank b')) === '1', await p.textContent('.souv-credit-bank b'));
    check('credits granted once for P&S', state.requests.filter((r) => /credits\/grant/.test(r)).length === 1, state.requests);
    await p.keyboard.press('Tab'); await p.keyboard.press('Tab'); await p.keyboard.press('Tab'); await p.keyboard.press('Tab');
    check('Tab stays in pop-up', await p.evaluate(() => !!document.activeElement.closest('.pr-ready')), '');
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    check('Escape closes', !(await p.$('.pr-ready')), '');
    check('scroll unlocked', await p.evaluate(() => getComputedStyle(document.documentElement).overflow !== 'hidden'), '');
    check('page not inert after close', await p.evaluate(() => [...document.body.children].every((c) => !c.inert)), '');
    // menu line
    await p.goto(BASE + '/pricing', { waitUntil: 'networkidle' }); await p.waitForTimeout(900);
    await p.click('button[aria-label=Menu]'); await p.waitForTimeout(300);
    check('menu balance line', (await p.textContent('.souv-popmenu-balance')).replace(/\s+/g, ' ').trim() === '12 credits · 1 card to send', await p.textContent('.souv-popmenu-balance'));
    await p.screenshot({ path: 'pricing/shots/menu-1440.png' });
    check('no page errors', errs.length === 0, errs);
    await ctx.close(); }

  // 4. Pop-up: backdrop click closes, x closes
  { const { ctx, p } = await open(b, 390, 844);
    await p.click('.pr-offer >> nth=0 >> .pr-cta');
    await p.waitForURL('**/cart', { timeout: 10000 }).catch(() => {});
    await payInCart(p);
    await p.screenshot({ path: 'pricing/shots/popup-390.png' });
    const sw = await p.evaluate(() => document.documentElement.scrollWidth);
    check('pop-up fits phone', sw <= 390, sw);
    await p.mouse.click(10, 10); await p.waitForTimeout(300);
    check('backdrop press closes', !(await p.$('.pr-ready')), '');
    await ctx.close(); }
  { const { ctx, p } = await open(b, 1440, 900);
    await p.click('.pr-offer >> nth=0 >> .pr-cta');
    await p.waitForURL('**/cart', { timeout: 10000 }).catch(() => {});
    await payInCart(p);
    await p.screenshot({ path: 'pricing/shots/popup-1440.png' });
    await p.click('.pr-ready-close'); await p.waitForTimeout(300);
    check('x closes', !(await p.$('.pr-ready')), '');
    await ctx.close(); }

  // 5. Credit pack -> cart, other flows unchanged (returns to remembered page)
  { const { ctx, p, state } = await open(b, 1440, 900);
    await p.evaluate(() => localStorage.setItem('souv_pricing_return_to', '/create/build-my-card'));
    await p.click('.pr-credit.is-featured .pr-cta');
    await p.waitForURL('**/cart', { timeout: 10000 }).catch(() => {});
    await p.waitForTimeout(600);
    const c = await cart(p);
    check('Creator in cart', c.length === 1 && c[0].id === 'credit-creator' && c[0].price === 10 && c[0].tokens === '80', c);
    await payInCart(p);
    await p.waitForTimeout(1500);
    check('credits purchase grants 80 (stubbed)', state.requests.some((r) => /POST .*credits\/grant/.test(r)), state.requests);
    check('credits purchase still returns to remembered page', path(p) === '/create/build-my-card', p.url());
    await ctx.close(); }

  // 6. Signed out
  { const { ctx, p } = await open(b, 1440, 900, { signedIn: false });
    check('signed-out back link', (await p.textContent('.pr-back')).trim() === 'Back to home' && (await p.getAttribute('.pr-back', 'href')) === '/', '');
    check('signed-out nav shows Log In', !!(await p.$('.souv-nav-login')), '');
    await p.click('.pr-offer >> nth=0 >> .pr-cta');
    await p.waitForURL('**/signup**', { timeout: 10000 }).catch(() => {});
    check('signed-out buy -> signup with return', p.url().endsWith('/signup?returnTo=%2Fpricing'), p.url());
    await ctx.close(); }

  // 7. Loading and error states
  { const { ctx, p } = await open(b, 1440, 900, { pricing: 'hang' });
    check('loading text', (await p.textContent('.pr-state')) === 'Loading prices…', await p.textContent('.pr-state'));
    check('P&S available while loading', !!(await p.$('#pr-ps-name')), '');
    await ctx.close(); }
  { const { ctx, p } = await open(b, 1440, 900, { pricing: 'error' });
    check('error text', (await p.textContent('.pr-state')) === "We couldn't load prices right now. Please refresh the page or try again.", await p.textContent('.pr-state'));
    await p.screenshot({ path: 'pricing/shots/error-1440.png' });
    await ctx.close(); }

  // 8. Top Up alias
  { const { ctx, p } = await open(b, 1440, 900, { url: '/account/top-up' });
    check('top-up title', (await p.title()) === 'Pricing | Souvenote', await p.title());
    check('top-up noindex', /noindex/.test(await p.$eval('meta[name=robots]', (m) => m.content).catch(() => '')), '');
    check('top-up shows P&S', !!(await p.$('#pr-ps-name')), '');
    await ctx.close(); }

  // 9. No sideways scroll at small widths, reduced motion
  for (const [w, h] of [[320, 568], [375, 667], [390, 844], [768, 1024], [1024, 768], [1920, 1080]]) {
    const { ctx, p } = await open(b, w, h, { motion: 'reduce' });
    const sw = await p.evaluate(() => document.documentElement.scrollWidth);
    check('no sideways scroll at ' + w, sw <= w, sw);
    const tierTops = await p.$$eval('.pr-tier-price', (els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
    check('tier prices level at ' + w, new Set(tierTops).size === 1, tierTops);
    await ctx.close(); }

  await b.close();
  const failed = results.filter((r) => !r.ok);
  results.forEach((r) => console.log((r.ok ? 'PASS ' : 'FAIL ') + r.n + (r.ok ? '' : '  ' + r.info)));
  console.log(results.length - failed.length + '/' + results.length + ' passed');
})();
