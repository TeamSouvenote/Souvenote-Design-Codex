const { BASE, launch, pageWith, FLOW_DONE } = require('./lib.js');
(async () => {
  const b = await launch();
  for (const [name, route, seed, w, h, sel] of [
    ['confirm SE', '/delivery/confirmation', { souv_mock_mvp_flow: FLOW_DONE }, 375, 667, '.dc-card'],
    ['confirm 320', '/delivery/confirmation', { souv_mock_mvp_flow: FLOW_DONE }, 320, 568, '.dc-card'],
    ['confirm 390', '/delivery/confirmation', { souv_mock_mvp_flow: FLOW_DONE }, 390, 844, '.dc-card'],
    ['cart empty 320', '/cart', { souv_cart: [] }, 320, 568, '.ct-state'],
    ['cart empty SE', '/cart', { souv_cart: [] }, 375, 667, '.ct-state'],
  ]) {
    const { ctx, page } = await pageWith(b, w, h, seed);
    await page.goto(BASE + route, { waitUntil: 'networkidle' }); await page.waitForTimeout(400);
    const m = await page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); const nav = document.querySelector('header, nav')?.getBoundingClientRect();
      const main = document.querySelector('main'); const cs = getComputedStyle(main.firstElementChild);
      return { bottom: Math.round(r.bottom), top: Math.round(r.top), h: innerHeight, sw: document.documentElement.scrollWidth, navH: nav && Math.round(nav.height), padTop: cs.paddingTop, gapHead: Math.round(r.top - document.querySelector('.cf-head, .cf-wrap h1').getBoundingClientRect().bottom) }; }, sel);
    console.log(name, JSON.stringify(m));
    await page.screenshot({ path: `shots/short-${name.replace(/ /g, '-')}.png` });
    await ctx.close();
  }
  await b.close();
})();
