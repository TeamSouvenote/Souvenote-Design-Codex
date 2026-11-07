const { BASE, launch, pageWith, CART_ITEMS, FLOW_READY, FLOW_DONE } = require('./lib.js');
(async () => {
  const b = await launch();
  const sizes = [[320, 568], [375, 667], [390, 844], [820, 1180], [844, 390], [1024, 768], [1280, 800], [1440, 900], [1920, 1080]];
  const pages = [['/cart', {}], ['/cart', { souv_cart: CART_ITEMS }], ['/delivery', { souv_mock_mvp_flow: FLOW_READY }], ['/delivery/confirmation', { souv_mock_mvp_flow: FLOW_DONE }]];
  for (const [w, h] of sizes) {
    const row = [];
    for (const [url, seed] of pages) {
      const { ctx, page } = await pageWith(b, w, h, seed);
      await page.goto(BASE + url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(300);
      const m = await page.evaluate(() => {
        const main = document.querySelector('main .cf-wrap');
        const head = document.querySelector('.cf-head');
        const focus = document.querySelector('.ct-state, .ct-summary, .dc-card, .dv-section');
        const r = focus?.getBoundingClientRect();
        return { ox: document.documentElement.scrollWidth - innerWidth, focusBottom: r ? Math.round(r.bottom) : null };
      });
      row.push(`${url}${seed.souv_cart ? '+items' : ''} ox=${m.ox} focusBottom=${m.focusBottom}`);
      if (url === '/cart' && seed.souv_cart) {
        await page.getByRole('button', { name: /Proceed to checkout/ }).click();
        const d = page.getByRole('dialog', { name: 'Complete your purchase' });
        await d.waitFor();
        // Scroll the overlay to its end: the pay button and summary must be reachable.
        const reach = await page.evaluate(() => { const o = document.querySelector('.fd-overlay'); o.scrollTop = o.scrollHeight; const btn = document.querySelector('.co-pay-cta').getBoundingClientRect(); const sum = document.querySelector('.co-summary').getBoundingClientRect(); return { ox: o.scrollWidth - o.clientWidth, sumBottom: Math.round(sum.bottom), vh: innerHeight, btnW: Math.round(btn.width) }; });
        row.push(`  checkout ox=${reach.ox} summaryBottom=${reach.sumBottom}/${reach.vh}`);
      }
      await ctx.close();
    }
    console.log(`${w}x${h}\n  ` + row.join('\n  '));
  }
  await b.close();
})();
