# Build fixes: Cart, Delivery, Delivery confirmation (screens 23, 24, 25)

Redesign built 2026-11-06 (berry & ivory, same treatment as Pricing). This is the QA fix list.

**Status 2026-11-06 (night): all 30 decided and built.** Your answer for each item is in DECISIONS.md; backend gaps and
the version 2 list are in DEVELOPER_HANDOFF.md "Cart / Delivery fixes". QA (dev server, everything stubbed):
`qa-scripts/fixes-1-7.js` 74/74, `fixes-9-27.js` 61/61, `behaviour.js` 133/133.

- Pages: `/cart`, `/delivery`, `/delivery/confirmation`
- QA run: production build on :3217 with every outside request stubbed (no real backend, Cognito, payment, order or
  fulfillment call). Result: **138/138 behaviour + accessibility checks pass**, no sideways scrolling at 9 screen sizes
  (320x568 to 1920x1080, incl. sideways phone). axe-core (WCAG 2.1 AA + best practice): 0 issues on all three pages and
  every redesigned pop-up.
- Screenshots: `screenshots/` (desk = 1440x900, phone = 390x844). QA scripts: `qa-scripts/` (run from `~/souv-qa`).

Each item says **where**, **what's wrong**, and **why it matters**. Tags: `[backend]` needs backend work,
`[decision]` needs your call, `[copy]` needs wording approval, `[code]` frontend-only fix.

---

## A. Must fix before real customers use it

1. **Cart promo isn't carried into payment** `[code]` (Cart → payment pop-up)
   SOUVENOTE10 takes 10% off in the cart's Order summary, but the payment pop-up gets the full subtotal and charges
   the full price ($129.01 instead of the discounted total in our test cart). The customer sees one total and pays another.

2. **Payment pop-up accepts any promo code** `[code]` (payment pop-up)
   Its own promo box gives 10% off for anything typed (`promo.trim().length > 0`), while the cart only accepts SOUVENOTE10.

3. **Payment isn't real** `[backend]` (payment pop-up, Cart "Payment confirmed")
   "Pay" waits 1.3 seconds and succeeds; card fields aren't checked (Pay works with them empty) and Stripe isn't
   connected. The page still says "Payments secured by Stripe" and "A receipt is on its way to your inbox", which
   aren't true yet. Needs Stripe Checkout/Elements and a real receipt email.

4. **Delivery form comes pre-filled with sample people** `[code]` `[decision]` (Delivery, sections 1 and 2)
   Recipient is pre-filled "Alex Smith, 123 Main St, Toronto ON M1M 1M1" and the return address "Samuel Mathew,
   456 Sender St, Waterloo ON N2L 1A1". A customer who doesn't notice would mail their card to a stranger.
   Decide: start empty, or pre-fill the return address from the signed-in profile.

5. **Hidden fallback address is sent to the backend** `[code]` (Delivery, `dlvPostalAddress`)
   Any blank field is silently replaced with "123 Main St / Toronto / ON / M1M 1M1", and a blank name with
   "Alex Smith" / "Samuel Mathew", before the order is created.

6. **Only the first recipient is sent** `[backend]` `[code]` (Delivery, "Multiple")
   With several recipients added, `createOrder` gets `recipients[0]` only. "How many cards to this address?" is never
   sent either. The order API has no quantity or recipient list, so this needs the backend too.

7. **Return address switch is ignored** `[code]` (Delivery, section 2)
   Turning the return address off still sends the sender address with the order.

8. **Card balance isn't checked** `[code]` `[decision]` (Delivery)
   `needsCardTopUp` is hard-coded to `false`, so the "Top up your card balance" pop-up can never open and a customer
   with 0 cards can send. Decide how the card bank should gate sending (and whether the backend owns it).

9. **Card preview is a hard-coded sample** `[code]` (Delivery, left column)
   Always shows "To the moon and back", the "Mom - … - Cameron" message, "Slow R&B Ballad" and "Cinematic", not the
   customer's own card, message or song.

10. **Backend error text reaches customers** `[code]` `[copy]` (Delivery error pop-ups)
    The approved friendly messages only show when the request itself fails. When the backend answers with an error,
    its raw text is shown instead, e.g. "Mock checkout completion failed with status 500." or "Checkout response did
    not include a checkout session and order." (from `lib/api.ts`). Map these to the approved wording.

11. **Blank gift recipient is thrown away** `[backend]` (Delivery, "You have a blank Souvenote to give" pop-up)
    The name and email/phone typed there aren't saved anywhere; "Save gift & send card" only lowers the gift count.
    The only check is "more than 3 characters".

## B. Should fix

12. **"Payment confirmed" order number is random** `[code]` (Cart)
    "SV-123456" is made up and changes every time the screen redraws. It doesn't match any real order (Delivery uses
    "SVN-…"). Show the real order number or remove it.

13. **GST is always 5%** `[backend]` `[copy]` (Cart, payment pop-up)
    Tax is a flat 5% GST. The pop-up says "GST calculated from your delivery address", but the cart has no address.

14. **"Choose a different pack" leaves the cart** `[decision]` `[copy]` (payment pop-up)
    It closes checkout and goes to Pricing even when paying for a whole cart. Decide whether it should go back to
    the cart, and whether "pack" is the right word there.

15. **Schedule isn't sent, and accepts past or no dates** `[backend]` `[code]` (Delivery, section 3)
    The chosen mail-out date (and "Send now" vs "Schedule") is never sent with the order. The date has no minimum,
    Schedule can be left without a date, and the "Send now" arrival estimate is always "+7 days".

16. **"On its way" pop-up is never really seen** `[decision]` (Delivery)
    It opens and the page moves to Confirmation straight away. Either show it instead of moving on, or remove it
    (Confirmation already says "On its way").

17. **Delivery isn't signed-in only** `[decision]` (Delivery, Cart)
    Signed-out visitors can open /delivery (with the sample data above). /create redirects signed-out visitors; decide
    if /delivery should too. The cart is intentionally open (it asks you to log in at checkout).

18. **"Back to review" always goes to Build My Card** `[code]` (Delivery bar)
    Cards started from Personalize a Template are sent to `/create/build-my-card#review`.

19. **Email promise** `[backend]` (Confirmation, "On its way" pop-up)
    "you'll get an email when it's posted": you approved the wording, but no email is sent yet.

20. **Top-up pop-up copy conflicts** `[copy]` (Delivery, "Top up your card balance")
    "saved in Saved Cards & Songs for 30 days" disagrees with Pricing's 15-month send window, and "Choose between Bulk,
    multi or single sends" reads oddly. Not reachable today (see 8), but worth fixing before it is.

21. **Gift price written twice** `[code]` (Cart gift offer)
    "$6.99" is typed into the copy and the button, separate from `BLANK_SOUVENOTE_GIFT_PRICE`. A price change would
    miss them.

## C. Polish

22. **Confirmation flashes "Nothing to confirm yet"** `[code]`: for a moment on load before switching to "On its way".
    Could hold the heading until the stored order is read.
23. **Short phones** `[code]`: on iPhone SE (375x667) the Confirmation box ends about 12px below the screen; on a
    320x568 phone the empty-cart box ends about 90px below. Desktop and 390x844 fit.
24. **Shipping speed has one option** `[decision]`: a radio list with only "Standard". Show it as a plain line until
    there's a second speed?
25. **Hyphens used as dashes** `[copy]`: "Thank you - your order", "ready to check out - cards, packs, and credits".
26. **Handwritten note line breaks** `[decision]`: the inside-message preview keeps its fixed line breaks, so on phones
    the lines wrap unevenly ("that" on its own line).
27. **Shared pop-ups still dark** (planned): the error pop-up and the "Log in before checkout" prompt keep the old dark
    style over the new pages until Build My Card / Personalize are redesigned (your call, 2026-11-06). The error pop-up
    also has no focus trap or scroll lock yet.
28. **Saved-card thumbnails** `[code]`: cart lines for a saved card (type "card") draw with the old dark `CardArt`
    palette. Revisit when Saved Cards & Songs is redesigned.
29. **No lint tool in the project** `[decision]`: there's no ESLint config, so only type-check, tests and build run.
30. **One unexplained page error** (watch): once, on the dev server only, desktop Delivery logged an unhandled
    "Event" error. It didn't come back in the later dev run or in three runs on the production build.

---

## Already fixed during the build (for the record)

- All developer wording replaced with your approved customer copy (statuses, buttons, error pop-ups, Confirmation).
- Payment pop-up "12 months" → "Each card has a 15-month send window."
- Confirmation shows order number + status; the other IDs are in a closed "Reference details" section.
- Every field now has a linked label; errors are linked to their field and marked invalid for screen readers.
- All five Cart/Delivery pop-ups: focus moves in, Tab stays inside, Escape and backdrop close, page scroll locked,
  focus returns to the button that opened them.
- Return address switch is a real switch; the whole heading row still toggles it.
- Delivery and Confirmation no longer mis-render on load (they read saved data before the page was ready: a React
  hydration error that was already in the code).
- Unused "Choose a pack" picker removed from `Checkout.tsx` (it was never shown; still listed Try Risk-Free).
- Tab titles: "Cart | Souvenote", "Delivery | Souvenote", "Order confirmation | Souvenote" (all still noindex).
