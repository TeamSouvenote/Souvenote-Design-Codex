-- Add the Print and Send offer to the pricing catalog (owner decision 2026-11-05).
--
-- Print and Send: 1 card, $9.99 CAD (999 cents), shipping included, no AI
-- credits. It replaces Try Risk-Free on the Pricing page, which until now kept
-- the price only in the frontend (PRINT_AND_SEND_PRICE in
-- frontend/app/components/pricingCatalog.ts). GET /pricing returns every active
-- row, so the Pricing page now reads this one.
--
-- Currency is 'cad' because the price is in CAD. The older catalog rows still
-- say 'usd' (a separate fix; see DEVELOPER_HANDOFF.md). Nothing in the backend
-- reads a catalog row's currency today.
--
-- Safe to run more than once: it inserts the row, or resets it to these values.
-- Fresh databases get the same row from seeds/001_pricing_catalog.sql.

INSERT INTO pricing_catalog (
    offer_code,
    name,
    offer_type,
    price_cents,
    currency,
    card_count_min,
    card_count_max,
    credits_per_card,
    shipping_included,
    is_active,
    metadata
)
VALUES (
    'print_and_send',
    'Print and Send',
    'print_and_send',
    999,
    'cad',
    1,
    1,
    0,
    TRUE,
    TRUE,
    '{}'::jsonb
)
ON CONFLICT (offer_code) DO UPDATE SET
    name = EXCLUDED.name,
    offer_type = EXCLUDED.offer_type,
    price_cents = EXCLUDED.price_cents,
    currency = EXCLUDED.currency,
    card_count_min = EXCLUDED.card_count_min,
    card_count_max = EXCLUDED.card_count_max,
    credits_per_card = EXCLUDED.credits_per_card,
    shipping_included = EXCLUDED.shipping_included,
    is_active = EXCLUDED.is_active,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();
