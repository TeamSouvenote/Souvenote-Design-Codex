# Pre-push re-check: cart, checkout and delivery in mock mode (2026-11-09)

## Why
- The Prompt 2 E-F2 change (mock code loaded with `loadMock()`) re-walked sign-in, credits, the Build My Card interviewer and Personalize research. Cart, checkout and delivery weren't walked again. The owner asked for a re-check before pushing.
- Owner decision the same day: the app stays on mock data and nothing gets wired up for now.

## How it was checked
- A temp copy of `frontend/` (`%TEMP%\souv-prepush-CoKh`, node_modules junction), dev server on port 3270. The Browser pane couldn't start it: all five per-folder server slots belonged to other chats.
- Headless Chrome via `puppeteer-core` in a separate folder (`%TEMP%\souv-prepush-driver-9Zca`, scripts `s1`–`s11.mjs`). It logged console errors, page errors and HTTP 4xx/5xx on every step.
- `.claude/launch.json` gained `frontend-prepush-copy` (port 3270). Don't commit it unless wanted.

## Results (1280×800, demo login, mock mode)
- **Delivery:** Saved Cards & Songs → "Print and send" → Delivery.
  - An empty "Continue to checkout" shows "Address needed", and "Got it" closes it.
  - A saved recipient fills the address. With a return address added: order created → "Checkout started" → "Confirm payment" → "Payment confirmed" → "Send to print" → `/delivery/confirmation` ("On its way", 1 card, "Sent to print").
- **Cart:** Pricing "Reserve 2 cards" (Big Sender) and "Choose Starter" both add to the cart.
  - Quantity +1 recalculates the totals ($19.98 → $21.98, tax $1.00 → $1.10).
  - A bad promo code shows "That code isn't valid." (plus a hidden live-region copy).
  - Remove updates the totals and `localStorage`.
- **Checkout:** the pop-up total matches the cart ($18.88).
  - A test card pays: credits 20 → 40, cards 0 → 2, the cart is emptied, and "Your cards are waiting" opens.
- **Errors:** none in any run (no console errors, page errors or failed requests).
- **Focus:** after a route change, the h1 takes focus (RouteFocus, O1). With a mouse there's no ring; keyboard users see the 2px ring, as designed.
- **Tax:** the estimate is the labelled 5% placeholder (`lib/taxEstimate.ts`) until Stripe Tax is connected.

## Fixed
- **Eyebrow left in the cart:** each cart item had a small uppercase kind line ("Card pack", "Creation credits") above its name. The 2026-11-09 "remove all" sweep missed it.
  - `components/CartPage.tsx`: the line is removed. The thumbnail badge keeps `aria-label` with the kind.
  - `styles/checkout-flow.css`: `.ct-line-kind` is removed, and `.ct-line-name` loses its 4px top margin, so names line up with the thumbnail tops.
  - `design-system/docs/06-governance.md`: v1.40.
  - Checked at 1280 and 375 (screenshots `c2.png`, `c6.png` in the driver folder). `tsc` and ESLint are clean.

## Not covered
- The "Checkout didn't start" retry (B5): it needs a forced failure.
- Delivery redeeming a Big Sender card balance; multiple recipients; scheduled send.
- Tablet size, a screen reader, Safari.
