// After-purchase pop-up ("Your card is waiting") for Print and Send, Big Sender and credits (owner, 2026-11-07).
// All outside requests stubbed.
const { BASE, ctxFor, launch } = require('../pricing/lib.js');
const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok: !!ok, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const READY = '[role=dialog][aria-labelledby=pr-ready-title]';

async function payInCart(p) {
  await p.waitForSelector('.ct-checkout');
  await p.click('.ct-checkout');
  await p.waitForSelector('#co-card-number');
  await p.fill('#co-card-number', '4242424242424242'); await p.fill('#co-card-exp', '1229');
  await p.fill('#co-card-cvc', '123'); await p.fill('#co-card-postal', 'V6B 1A1');
  await p.click('.co-pay-cta');
  await p.waitForTimeout(3000);
}
async function start(b, url, returnTo) {
  const state = {};
  const ctx = await ctxFor(b, 1440, 900, { state });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(BASE + url, { waitUntil: 'networkidle' }); await p.waitForTimeout(600);
  if (returnTo) await p.evaluate((r) => localStorage.setItem('souv_pricing_return_to', r), returnTo);
  return { ctx, p, state, errs };
}
const pathOf = (p) => new URL(p.url()).pathname;
async function popupInfo(p) {
  if (!(await p.$(READY))) return null;
  return {
    title: (await p.textContent('#pr-ready-title')).replace(/\s+/g, ' ').trim(),
    body: (await p.textContent('#pr-ready-body')).replace(/\s+/g, ' ').trim(),
    links: await p.$$eval('.pr-ready a', (as) => as.map((a) => a.textContent.trim())),
  };
}
const CARDS = 'Your cards are waiting';
const CREDITS = 'Your credits are waiting';
const SAME = { title: CARDS, body: 'Choose one of the following options to create a new card or send a saved one.', links: ['Personalize a Template', 'Build My Card', 'Community Cards', 'Saved Cards & Songs'] };

(async () => {
  const b = await launch();

  // Credits bought from the Top up credits pop-up
  { const { ctx, p, state, errs } = await start(b, '/home');
    await p.click('button[aria-label="Menu"]'); await p.waitForTimeout(250);
    await p.click('.souv-popmenu-item:has-text("Top Up Credits")'); await p.waitForSelector('.tu-dialog'); await p.waitForTimeout(400);
    await p.click('.tu-dialog .pr-credit:has-text("Creator") button'); await p.waitForURL('**/cart'); await p.waitForTimeout(600);
    await payInCart(p);
    const info = await popupInfo(p);
    check('credits: pop-up opens after paying', !!info, info);
    check('credits: title "Your credits are waiting", same text + 4 buttons', JSON.stringify(info) === JSON.stringify({ ...SAME, title: CREDITS }), info);
    check('credits: 80 credits granted', state.balance === 82, state.balance);
    check('credits: on /cart, Payment confirmed behind', pathOf(p) === '/cart' && (await p.textContent('body')).includes('Payment confirmed'));
    await p.keyboard.press('Escape'); await p.waitForTimeout(250);
    check('credits: Escape closes it', !(await p.$(READY)));
    check('credits: no page errors', errs.length === 0, errs.join(' | '));
    await ctx.close(); }

  // Credits bought from the Pricing page
  { const { ctx, p } = await start(b, '/pricing');
    await p.click('.pr-credit:has-text("Starter") button'); await p.waitForURL('**/cart'); await p.waitForTimeout(600);
    await payInCart(p);
    check('credits from Pricing: "Your credits are waiting"', ((await popupInfo(p)) || {}).title === CREDITS);
    await ctx.close(); }

  // Big Sender bought from the Pricing page
  { const { ctx, p, state } = await start(b, '/pricing');
    await p.click('.pr-offer >> nth=1 >> .pr-cta'); await p.waitForURL('**/cart'); await p.waitForTimeout(600);
    await payInCart(p);
    const info = await popupInfo(p);
    check('Big Sender: pop-up opens after paying', !!info, info);
    check('Big Sender: "Your cards are waiting", same text + 4 buttons', JSON.stringify(info) === JSON.stringify(SAME), info);
    check('Big Sender: 2 cards x 10 credits granted', state.balance === 22, state.balance);
    check('Big Sender: nav Cards shows 2', (await p.textContent('.souv-credit-bank b')).trim() === '2', await p.textContent('.souv-credit-bank b'));
    await ctx.close(); }

  // Print and Send still opens it
  { const { ctx, p } = await start(b, '/pricing');
    await p.click('.pr-offer >> nth=0 >> .pr-cta'); await p.waitForURL('**/cart'); await p.waitForTimeout(600);
    await payInCart(p);
    check('Print and Send: "Your cards are waiting"', JSON.stringify(await popupInfo(p)) === JSON.stringify(SAME));
    await ctx.close(); }

  { const { ctx, p } = await start(b, '/pricing');
    await p.click('.pr-credit:has-text("Starter") button'); await p.waitForURL('**/cart'); await p.waitForTimeout(500);
    await p.goto(BASE + '/pricing', { waitUntil: 'networkidle' }); await p.waitForTimeout(500);
    await p.click('.pr-offer >> nth=1 >> .pr-cta'); await p.waitForURL('**/cart'); await p.waitForTimeout(600);
    const lines = await p.$$('.ct-line');
    await payInCart(p);
    check('credits + Big Sender: "Your cards are waiting"', lines.length === 2 && ((await popupInfo(p)) || {}).title === CARDS, lines.length);
    await ctx.close(); }

  // Print and Send with a saved return page: still the pop-up (owner decision 2026-11-04)
  { const { ctx, p } = await start(b, '/pricing', '/create/build-my-card');
    await p.click('.pr-offer >> nth=0 >> .pr-cta'); await p.waitForURL('**/cart'); await p.waitForTimeout(600);
    await payInCart(p);
    check('Print and Send + return page: pop-up, stays on cart', !!(await popupInfo(p)) && pathOf(p) === '/cart', p.url());
    await ctx.close(); }

  // Credits with a saved return page (ran out in Build My Card): straight back, no pop-up
  { const { ctx, p } = await start(b, '/pricing', '/create/build-my-card');
    await p.click('.pr-credit:has-text("Creator") button'); await p.waitForURL('**/cart'); await p.waitForTimeout(600);
    await payInCart(p);
    await p.waitForTimeout(800);
    check('credits + return page: straight back to Build My Card', pathOf(p) === '/create/build-my-card', p.url());
    check('credits + return page: no pop-up', !(await p.$(READY)));
    await ctx.close(); }

  // Big Sender with a saved return page (Reserve cards on Delivery): straight back
  { const { ctx, p } = await start(b, '/pricing', '/delivery');
    await p.click('.pr-offer >> nth=1 >> .pr-cta'); await p.waitForURL('**/cart'); await p.waitForTimeout(600);
    await payInCart(p);
    await p.waitForTimeout(800);
    check('Big Sender + return page: straight back to Delivery', pathOf(p) === '/delivery', p.url());
    check('Big Sender + return page: no pop-up', !(await p.$(READY)));
    await ctx.close(); }

  const fails = results.filter((r) => !r.ok);
  fails.forEach((r) => console.log('FAIL', r.name, r.detail.slice(0, 300)));
  console.log(`${results.length - fails.length}/${results.length} passed`);
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
