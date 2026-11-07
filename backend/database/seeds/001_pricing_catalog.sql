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
    'usd',
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
    'usd',
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
    'usd',
    21,
    30,
    10,
    TRUE,
    '{}'::jsonb
);
