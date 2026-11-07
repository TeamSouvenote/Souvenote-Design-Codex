const { BASE, launch, pageWith } = require('./lib.js');
const ROUTES = ['/', '/home', '/pricing', '/faq', '/contact', '/community-cards', '/signup', '/signup/terms', '/login', '/forgot', '/reset', '/recover', '/verify', '/verify/expired', '/welcome', '/create', '/create/build-my-card', '/create/personalize-a-template', '/create/my-cards-and-songs', '/my-cards', '/cart', '/delivery', '/delivery/confirmation', '/account/profile', '/account/settings', '/account/top-up', '/gift', '/gift/redeem', '/refer', '/legal/privacy-policy', '/legal/terms-of-service', '/legal/refund-policy', '/legal/cookie-policy'];
(async () => {
  const b = await launch(); let bad = 0;
  for (const signedIn of [true, false]) {
    for (const r of ROUTES) {
      const { ctx, page, errors } = await pageWith(b, 1440, 900, {}, { signedIn });
      let status;
      try { const resp = await page.goto(BASE + r, { waitUntil: 'networkidle', timeout: 90000 }); status = resp && resp.status(); } catch (e) { status = 'ERR ' + e.message.slice(0, 60); }
      await page.waitForTimeout(300);
      const pe = errors.filter((e) => e.startsWith('pageerror') || /Hydration|hydrat|did not match/i.test(e));
      const text = await page.evaluate(() => document.body.innerText).catch(() => '');
      const ent = /&apos;|&quot;/.test(text);
      if (status !== 200 || pe.length || ent) { bad++; console.log((signedIn ? 'IN ' : 'OUT'), r, status, ent ? 'RAW ENTITY TEXT' : '', pe.join(' | ').slice(0, 300)); }
      await ctx.close();
    }
  }
  console.log(bad ? `${bad} problem pages` : 'all pages OK (66 loads)');
  await b.close();
})();
