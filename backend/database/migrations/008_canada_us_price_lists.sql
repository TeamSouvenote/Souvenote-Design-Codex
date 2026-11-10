-- Canada and the United States price lists (owner decisions 2026-11-08).
--
-- Each account's country picks its price list and currency: Canada pays CAD,
-- the United States pays USD. GET /pricing returns every active row; the
-- frontend picks the rows whose currency matches the visitor (lib/priceLists.ts
-- holds the same values as its fallback). Prices are before tax; Stripe Tax
-- adds Canadian GST/HST/PST or US sales tax at checkout.
--
-- This migration:
--   1. Fixes the Big Sender rows' currency label. Their amounts were always CAD
--      ($8.99 / $7.99 / $6.99) but the seed stored 'usd'. Nothing in the
--      backend reads a row's currency today, so this is a label fix only.
--   2. Retires Try Risk-Free (replaced by Print and Send on 2026-11-04).
--   3. Adds the USD rows: Print and Send $7.99; Big Sender $6.99 / $5.99 / $4.99
--      per card (2-10 / 11-20 / 21+, the tier price applies to every card, the
--      last tier is open-ended); 10 AI credits per card.
--   4. Adds the credit top-ups in both currencies (CAD $2 / $10 / $25,
--      USD $1.50 / $8 / $20 for 10 / 80 / 250 credits) and the one-per-card
--      typo or wrong-address replacement (CAD $3.99, USD $2.99), so every
--      price lives in the catalog. Top-ups carry their credits in
--      metadata.credits (credits_per_card is 0: they include no card).
--
-- Safe to run more than once: each row is inserted, or reset to these values.
-- Run after 007. Fresh databases get the same rows from seeds/001_pricing_catalog.sql.
-- Not run by the frontend; run it on each database before deploying.

UPDATE pricing_catalog
SET currency = 'cad',
    updated_at = NOW()
WHERE offer_type = 'big_sender'
  AND offer_code IN ('big_sender_2_10', 'big_sender_11_20', 'big_sender_21_30');

UPDATE pricing_catalog
SET is_active = FALSE,
    updated_at = NOW()
WHERE offer_code = 'try_risk_free_one_card';

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
VALUES
    ('print_and_send_usd', 'Print and Send', 'print_and_send', 799, 'usd', 1, 1, 10, TRUE, TRUE, '{}'::jsonb),
    ('big_sender_usd_2_10', 'Big Sender 2-10 Cards', 'big_sender', 699, 'usd', 2, 10, 10, TRUE, TRUE, '{}'::jsonb),
    ('big_sender_usd_11_20', 'Big Sender 11-20 Cards', 'big_sender', 599, 'usd', 11, 20, 10, TRUE, TRUE, '{}'::jsonb),
    ('big_sender_usd_21_30', 'Big Sender 21-30 Cards', 'big_sender', 499, 'usd', 21, 30, 10, TRUE, TRUE, '{}'::jsonb),
    ('credits_starter_cad', 'Starter credits', 'credit_pack', 200, 'cad', 0, 0, 0, FALSE, TRUE, '{"credits": 10}'::jsonb),
    ('credits_creator_cad', 'Creator credits', 'credit_pack', 1000, 'cad', 0, 0, 0, FALSE, TRUE, '{"credits": 80}'::jsonb),
    ('credits_power_cad', 'Power credits', 'credit_pack', 2500, 'cad', 0, 0, 0, FALSE, TRUE, '{"credits": 250}'::jsonb),
    ('credits_starter_usd', 'Starter credits', 'credit_pack', 150, 'usd', 0, 0, 0, FALSE, TRUE, '{"credits": 10}'::jsonb),
    ('credits_creator_usd', 'Creator credits', 'credit_pack', 800, 'usd', 0, 0, 0, FALSE, TRUE, '{"credits": 80}'::jsonb),
    ('credits_power_usd', 'Power credits', 'credit_pack', 2000, 'usd', 0, 0, 0, FALSE, TRUE, '{"credits": 250}'::jsonb),
    ('replacement_cad', 'Typo or wrong-address replacement', 'replacement', 399, 'cad', 1, 1, 0, TRUE, TRUE, '{"per_card_limit": 1}'::jsonb),
    ('replacement_usd', 'Typo or wrong-address replacement', 'replacement', 299, 'usd', 1, 1, 0, TRUE, TRUE, '{"per_card_limit": 1}'::jsonb)
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
