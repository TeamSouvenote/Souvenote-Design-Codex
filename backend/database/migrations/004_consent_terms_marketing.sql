-- Consent records for sign-up.
--
-- 1. Marketing email is opt-in. Canada's anti-spam law (CASL) does not accept a
--    pre-ticked box as express consent, so new users now default to NOT opted
--    in. Existing rows are left exactly as they are; reviewing users who were
--    defaulted to TRUE under the old default is a separate, deliberate decision.
--
-- 2. Record when a user accepted the Terms of Service and Privacy Policy, and
--    which version ("Last updated" dates, set by the frontend at sign-up).
--    NULL means no acceptance has been recorded (e.g. accounts created before
--    this migration, or social sign-ups, which do not show the terms checkbox).

ALTER TABLE users
    ALTER COLUMN marketing_opt_in SET DEFAULT FALSE;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS terms_version VARCHAR(120);
