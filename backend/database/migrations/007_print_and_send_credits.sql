-- Print and Send now includes 10 AI creation credits (owner decision 2026-11-06),
-- the same as each Big Sender card. Migration 006 created the row with 0.
--
-- The frontend already grants the 10 credits at checkout (creditsPerCard in
-- frontend/app/components/pricingCatalog.ts); this keeps the catalog in step.
-- Fresh databases get the same value from seeds/001_pricing_catalog.sql.
--
-- Safe to run more than once. Run after 006.

UPDATE pricing_catalog
SET credits_per_card = 10,
    updated_at = NOW()
WHERE offer_code = 'print_and_send';
