# Account deletion and 30-day recovery: backend spec (draft for review)

Status: **proposal, not implemented.** The `/recover` screen in the frontend
(`frontend/app/components/Auth.tsx`, `RecoverView`) is a static placeholder
until this lands. Nothing in this document has been built.

## What the screen promises today

The `/recover` copy, which this backend must make true:

- "Your Souvenote account is scheduled for permanent deletion."
- A **days remaining** countdown inside a **30-day grace** period.
- **Restore my account** brings back: saved card images and songs; active card
  packs; drafts, recipient list and order history.
  (Two earlier items were removed from the copy on 2026-11-03: "clock paused
  during grace" on card packs, since packs have no expiry, and "Referral
  credits earned to date", since referrals are out of scope until v2.)
- **No, finalize deletion now** ends the grace period immediately.

## Current state

| Need | Exists today? |
| --- | --- |
| Request deletion | No endpoint, no UI entry point |
| Grace-period data | No. `users.deleted_at` exists (soft delete), nothing records a pending request |
| Restore / cancel | No |
| Finalize | No |
| Scheduled purge job | No scheduler in the NestJS app |
| Cognito user removal | No `AdminDeleteUser` call (frontend client has no admin rights; must be server-side) |
| Card-pack expiry clock | No expiry exists on credits (`credit_ledger` has no expiry); the "clock paused" phrase was removed from the copy |
| Referral credits | Out of scope until v2; removed from the restore list |
| Audit trail | `audit_logs` table exists and should be used |

## Proposed data (migration 005)

```sql
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deletion_scheduled_for TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_deletion_scheduled_for
    ON users (deletion_scheduled_for)
    WHERE deletion_scheduled_for IS NOT NULL AND deleted_at IS NULL;
```

- Pending deletion: `deletion_scheduled_for IS NOT NULL AND deleted_at IS NULL`.
- Finalized: `deleted_at IS NOT NULL` (existing soft-delete semantics).

## Proposed endpoints (all `CognitoAuthGuard`)

| Method | Path | Behaviour |
| --- | --- | --- |
| `GET` | `/auth/me/deletion` | `{ status: "none" \| "scheduled", requestedAt, scheduledFor, daysRemaining }`. `daysRemaining` is computed server-side (ceil of days to `scheduledFor`). |
| `POST` | `/auth/me/deletion` | Starts the grace period: sets `deletion_requested_at = NOW()`, `deletion_scheduled_for = NOW() + 30 days`. Idempotent if already scheduled. Writes `audit_logs`. |
| `DELETE` | `/auth/me/deletion` | **Restore**: clears both columns. Writes `audit_logs`. |
| `POST` | `/auth/me/deletion/finalize` | **Finalize now**: runs the purge for this user immediately (same code path as the job). Requires a recent sign-in (`auth_time` claim within ~5 minutes) so a stolen long-lived session cannot delete the account. |

`GET /auth/me` should also return the deletion status so the frontend can send
a user with a pending deletion to `/recover` straight after login.

## Purge job

A daily scheduled task (`@nestjs/schedule` cron, or an external scheduler such
as EventBridge calling an internal endpoint) selects users whose
`deletion_scheduled_for <= NOW()` and, per user, in this order:

1. Delete stored media (uploads, generated images and songs) from storage.
2. Delete or anonymise personal data: name, phone, birthday, email (replace
   with a non-reversible placeholder), payment-method metadata, drafts.
3. **Keep** orders and payments needed for tax/accounting retention, detached
   from personal data (decision needed, see below).
4. Delete the Cognito user server-side (`AdminDeleteUser`, needs an IAM role
   with `cognito-idp:AdminDeleteUser` on the pool).
5. Set `deleted_at = NOW()` and write an `audit_logs` entry.

Each step must be idempotent so a failed run can be retried safely.

## Frontend work once the backend exists

- An entry point to request deletion (e.g. Account settings), which is missing today.
- `/recover`: load `GET /auth/me/deletion` for the real countdown; wire
  **Restore my account** to `DELETE`, and **No, finalize deletion now** to
  `POST .../finalize` behind a confirmation step.
- After login, redirect users with a scheduled deletion to `/recover`.

## Decisions needed (product / legal)

1. Is 30 days the confirmed grace period?
2. What order and payment records must be retained, and for how long?
3. Should card packs expire at all? If yes, they need an expiry model, and
   the grace period should pause it.
4. Should a pending-deletion account be able to place orders or use credits
   during the grace period, or be read-only?
5. Email notifications: confirm on request, reminder before purge, confirm on
   purge?
