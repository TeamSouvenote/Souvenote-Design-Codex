# Fix decisions: Cart, Delivery, Confirmation (screens 23-25)

Your answers to each item in BUILD-FIXES.md (2026-11-06). **All 30 decided, all built (2026-11-06 night).** Left as is on purpose: 6, 8, 10, 19 (backend gaps), 26 (not needed), 28 (Saved Cards redesign), 30 (watch). Gaps + V2 list in DEVELOPER_HANDOFF.md "Cart / Delivery fixes".

General rule (2026-11-06): **no dummy data**. No made-up codes, addresses, prices or results standing in for real ones.

| # | Item | Decision | Backend gap? |
|---|------|----------|--------------|
| 1 | Cart promo not carried into payment | Payment pop-up uses the cart's total and any applied code. No hard-coded codes (SOUVENOTE10 removed). Promo codes won't work until Stripe is wired up. | Yes: promo codes come from Stripe |
| 1+2 | Promo box until Stripe is live | Promo boxes stay visible in the cart and the payment pop-up. Every code is rejected with an error message (copy to approve). | |
| 2 | Pop-up accepts any promo code | Accepts only codes set up in Stripe. Fake 10%-off-anything logic removed. | Yes: promo codes checked against Stripe |
| 3 | Payment isn't real | Keep the mock for now, add basic card-field checks, record Stripe + receipt email in DEVELOPER_HANDOFF.md as must-do before launch. Copy unchanged. | Yes |
| 4 | Delivery form pre-filled with sample people | Recipient starts empty. Return address pre-filled from the signed-in profile, otherwise empty. | Profiles have no mailing address yet (only name + billing postal code) |
| 4 | (follow-up) | For now only the return **name** is pre-filled from the profile; address lines start empty. Address auto-fills once profiles have one. | Yes: mailing address on profile |
| 5 | Hidden fallback address | Fallback removed. First/last name, address line 1, city, province and postal code are required (they show "Required"); "Send to print" won't continue until they're filled. Apartment/unit stays optional. | |
| 1+2 | (copy) Promo rejection message | "That code isn't valid." (approved 2026-11-06) | |
| 3 | (copy) Card-field checks | Per-field: "Enter your card number." / "Enter the expiry date." / "Enter the CVC." / "Enter your postal code." (approved) | |
| 6 | Only first recipient sent | Leave as is; record in DEVELOPER_HANDOFF.md. | Yes: order API needs recipient list + quantity |
| 7 | Return address switch ignored | Fix: switch off = no return address sent. | |
| 8 | Card balance not checked | Leave the check off (card bank is browser-only, no dummy gate). Turn on when the backend owns the card balance. | Yes: card balance on backend |
| 9 | Card preview is a sample | Show the customer's own front image (selected asset). Hide the message and song lines until they're saved with the card. | Yes: message + song not stored with the card draft |
| 10 | Backend error text reaches customers | Keep showing the backend's own text. This is a frontend rebuild, not customer-facing yet; the team needs to see real errors. IDs stay as decided (closed "Reference details"). Every raw error is listed in DEVELOPER_HANDOFF.md as a backend gap: give it customer wording before launch. | Yes (going forward, all such errors) |
| 11 | Blank gift recipient thrown away | Hide the name and email/phone fields. Gift recipients = version 2 (DEVELOPER_HANDOFF.md). | V2 |
| 12 | Random order number on cart | Remove it. Line reads "Thank you. Your order is in. A receipt is on its way to your inbox, ..." | |
| 13 | Flat 5% GST | Keep "GST (5%)"; drop "GST calculated from your delivery address." | Yes: real tax by province (e.g. Stripe Tax) |
| 14 | "Choose a different pack" | "← Back to cart": closes the pop-up, stays on the cart. | |
| 15 | Schedule | Date earliest tomorrow; Schedule with no date shows "Choose a mail-out date." and nothing is sent. Arrival estimate hidden until the print/mail partner gives one. | Yes: send date + mode with order; real arrival estimate |
| 16 | "On its way" pop-up | Removed; go straight to Confirmation. | |
| 17 | Delivery open to signed-out | Signed-in only, same as /create. | |
| 18 | Back to review | Go back to the builder the card came from; fall back to Build My Card. | |
| 19 | Email promise | Keep the line. | Yes: "posted" email |
| 20 | Top-up pop-up copy | "Choose between Bulk, multi or single sends at delivery" -> "Send to one person or many when you're ready." 30-day line kept (about drafts, matches FAQ). | |
| 21-23 | Gift price twice, Confirmation flash, short phones | Code fixes, no decision needed. | |
| 24 | One shipping speed | Plain line "Standard shipping, included". | |
| 25 | Hyphens | "N items ready to check out: cards, packs, and credits all in one go." / "Reserve N cards for $X". | |
| 26 | Note line breaks | Not needed: the sample message is hidden (item 9). | |
| 27 | Old dark pop-ups | Add focus trap, scroll lock, focus return to the error pop-up now; dark look stays until the Build My Card redesign. | |
| 28 | Saved-card thumbnail | Later, with the Saved Cards & Songs redesign. | |
| 29 | No lint | Add Next.js's standard ESLint setup; report findings, don't fix without asking. | |
| 30 | Unexplained "Event" error | Keep watching. | |
| 11 | (follow-up) | Gift pop-up + reminder banner on Delivery skipped until V2; the cart's "Add a blank Souvenote?" offer before checkout hidden until V2. Code kept behind flags. | V2 |
