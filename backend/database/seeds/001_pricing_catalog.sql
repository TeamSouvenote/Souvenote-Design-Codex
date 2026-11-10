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
    metadata
)
VALUES
(
    'try_risk_free_one_card',
    'Try Risk-Free',
    'try_risk_free',
    999,
    'usd',
    1,
    1,
    10,
    TRUE,
    '{"hold_days": 5, "no_send_fee_cents": 200}'::jsonb
),
(
    -- Print and Send (owner decisions 2026-11-05 / 2026-11-06): 1 card, $9.99 CAD, shipping included,
    -- 10 AI creation credits. Existing databases get this row from migrations 006 + 007.
    'print_and_send',
    'Print and Send',
    'print_and_send',
    999,
    'cad',
    1,
    1,
    10,
    TRUE,
    '{}'::jsonb
),
(
    'big_sender_2_10',
    'Big Sender 2-10 Cards',
    'big_sender',
    899,
    'cad',
    2,
    10,
    10,
    TRUE,
    '{}'::jsonb
),
(
    'big_sender_11_20',
    'Big Sender 11-20 Cards',
    'big_sender',
    799,
    'cad',
    11,
    20,
    10,
    TRUE,
    '{}'::jsonb
),
(
    'big_sender_21_30',
    'Big Sender 21-30 Cards',
    'big_sender',
    699,
    'cad',
    21,
    30,
    10,
    TRUE,
    '{}'::jsonb
);

-- Canada and the US (owner decisions 2026-11-08; same rows as migration 008):
-- Try Risk-Free is retired, and the USD list, credit top-ups and the typo
-- replacement are added in both currencies.
UPDATE pricing_catalog SET is_active = FALSE WHERE offer_code = 'try_risk_free_one_card';

INSERT INTO pricing_catalog (
    offer_code, name, offer_type, price_cents, currency,
    card_count_min, card_count_max, credits_per_card, shipping_included, metadata
)
VALUES
    ('print_and_send_usd', 'Print and Send', 'print_and_send', 799, 'usd', 1, 1, 10, TRUE, '{}'::jsonb),
    ('big_sender_usd_2_10', 'Big Sender 2-10 Cards', 'big_sender', 699, 'usd', 2, 10, 10, TRUE, '{}'::jsonb),
    ('big_sender_usd_11_20', 'Big Sender 11-20 Cards', 'big_sender', 599, 'usd', 11, 20, 10, TRUE, '{}'::jsonb),
    ('big_sender_usd_21_30', 'Big Sender 21-30 Cards', 'big_sender', 499, 'usd', 21, 30, 10, TRUE, '{}'::jsonb),
    ('credits_starter_cad', 'Starter credits', 'credit_pack', 200, 'cad', 0, 0, 0, FALSE, '{"credits": 10}'::jsonb),
    ('credits_creator_cad', 'Creator credits', 'credit_pack', 1000, 'cad', 0, 0, 0, FALSE, '{"credits": 80}'::jsonb),
    ('credits_power_cad', 'Power credits', 'credit_pack', 2500, 'cad', 0, 0, 0, FALSE, '{"credits": 250}'::jsonb),
    ('credits_starter_usd', 'Starter credits', 'credit_pack', 150, 'usd', 0, 0, 0, FALSE, '{"credits": 10}'::jsonb),
    ('credits_creator_usd', 'Creator credits', 'credit_pack', 800, 'usd', 0, 0, 0, FALSE, '{"credits": 80}'::jsonb),
    ('credits_power_usd', 'Power credits', 'credit_pack', 2000, 'usd', 0, 0, 0, FALSE, '{"credits": 250}'::jsonb),
    ('replacement_cad', 'Typo or wrong-address replacement', 'replacement', 399, 'cad', 1, 1, 0, TRUE, '{"per_card_limit": 1}'::jsonb),
    ('replacement_usd', 'Typo or wrong-address replacement', 'replacement', 299, 'usd', 1, 1, 0, TRUE, '{"per_card_limit": 1}'::jsonb);
