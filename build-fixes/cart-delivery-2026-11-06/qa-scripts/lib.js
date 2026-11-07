// Cart / Delivery QA helpers. Builds on the Pricing helpers: everything
// outside the app origin is stubbed or aborted (no real backend, Cognito,
// payment, order or fulfillment call is ever made).
const { ctxFor, launch, BASE } = require('../pricing/lib.js');

const CART_ITEMS = [
  { id: 'pack-bigsender', type: 'pack', qty: 1, cardCount: 12, price: 0, replaceGroup: 'pack-bigsender' },
  { id: 'credit-creator', type: 'credits', name: 'Creator credits', meta: '80 AI credits · image, edit, or QR song actions', sub: 'Our most popular: a season of cards & songs.', price: 10, qty: 2, unitNote: 'one-time top-up', tokens: '80' },
  { id: 'addon-blank-souvenote', type: 'gift', qty: 1, price: 6.99 },
];

const FLOW_READY = {
  cardDraftId: 'draft-1234abcd-0000', generatedAssets: [{ id: 'asset-9c1d0000', kind: 'image', type: 'image' }],
  selectedAssetId: 'asset-9c1d0000', orderId: null, orderStatus: null, checkoutSessionId: null, paymentId: null, fulfillment: null, updatedAt: null,
};
const FLOW_DONE = {
  ...FLOW_READY, orderId: '3f2a9b7c-1111-2222', orderStatus: 'fulfilled_mock', checkoutSessionId: 'cs_mock_123456789', paymentId: 'pay_mock_987654321', fulfillment: { id: 'ful-1', mockFulfillmentId: 'mock_ful_abcdef123456' },
};

/** New page with localStorage seeded before the app loads. */
async function pageWith(browser, w, h, seed = {}, opts = {}) {
  const ctx = await ctxFor(browser, w, h, opts);
  await ctx.addInitScript((s) => {
    if (sessionStorage.getItem('__seeded')) return;
    sessionStorage.setItem('__seeded', '1');
    for (const [k, v] of Object.entries(s)) localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
  }, seed);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message + ' @ ' + String(e.stack || e).slice(0, 300)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  return { ctx, page, errors };
}

module.exports = { BASE, launch, pageWith, CART_ITEMS, FLOW_READY, FLOW_DONE };
