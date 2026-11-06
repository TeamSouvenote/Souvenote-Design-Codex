-- Reset marketing email consent for every existing user.
--
-- Before migration 004, users.marketing_opt_in defaulted to TRUE, the sign-up
-- checkbox was never saved, and the Account settings toggle was pre-switched
-- on and re-saved its value on any settings save. So no existing TRUE value
-- can be shown to be express consent, which Canada's anti-spam law (CASL)
-- requires. Everyone is set to opted out; anyone who wants marketing email
-- can switch it back on in Account settings.
--
-- Run once, after 004 and before sending any marketing email. It sends
-- nothing and changes no other column. Running it again would also clear
-- opt-ins given after the first run, so do not re-run it.

UPDATE users
SET
    marketing_opt_in = FALSE,
    updated_at = NOW()
WHERE marketing_opt_in = TRUE;
