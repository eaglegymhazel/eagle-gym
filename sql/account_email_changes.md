Account email changes
=====================

Deployment
----------

The connected Supabase project has this migration installed, with version
`20261007120534` and name `account_email_changes`, applied on 7 October 2026.
Do not run the migration again on that project. For another environment, apply
`sql/account_email_changes.sql` before deploying the application changes.
Pre-deployment tests ran its body and disposable fixtures in a transaction
ending in ROLLBACK. Post-deployment tests rolled back only the test fixtures.

Keep Supabase Auth email confirmation and **Secure Email Change enabled**.
Both the current and proposed addresses must be confirmed. The application
does not alter Auth settings or use the admin update-user API.

In Auth URL Configuration, allow this exact callback for each application origin:

    https://YOUR-APPLICATION-ORIGIN/auth/callback?flow=email-change

For local testing, also allow:

    http://localhost:3000/auth/callback?flow=email-change

For the live Vercel Production environment, set `NEXT_PUBLIC_SITE_URL` to
`https://www.eaglegymnastics.co.uk` and allow this exact URL in Supabase:

    https://www.eaglegymnastics.co.uk/auth/callback?flow=email-change

Keep Supabase's Site URL set to the live origin. If the live application is
accessed on the apex domain without a redirect to www, allow its callback too:

    https://eaglegymnastics.co.uk/auth/callback?flow=email-change

Preview (`VERCEL_ENV=preview`) and development confirmations use the request's
origin, ignoring a shared production `NEXT_PUBLIC_SITE_URL`. Enable Vercel's
system environment variables so `VERCEL_ENV` is available. After pushing a
preview, add its exact callback to Supabase's allowed Redirect URLs **before**
requesting the change:

    https://YOUR-PREVIEW-HOST.vercel.app/auth/callback?flow=email-change

Test from that same preview hostname; deployment URLs and branch aliases are
different origins and each needs its own allowed callback. A URL missing from
the allowlist can fall back to Supabase's production Site URL. No broad wildcard
for other Vercel projects is required. On non-Vercel production servers, the
configured site origin is used if present, otherwise the request origin.

Vercel Preview and Production both need `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY` and the server-only `SUPABASE_SERVICE_ROLE_KEY`
for the same intended Supabase project. The service key is used for profile
saves, never to bypass email verification. Do not expose it as a public variable.
If Vercel deployment protection is enabled, the second browser/device must also
have access to the preview before it can open the public confirmation page.
Production testing does not require removing preview protection.

In the **Change Email Address** email template, use this link for cross-device
confirmation (the callback has a query string already):

    <a href="{{ .RedirectTo }}&amp;token_hash={{ .TokenHash }}&amp;type=email_change">Confirm account email change</a>

A complete branded replacement is saved in
`docs/email-templates/change-account-email.html`. Paste that file's contents into
the Change Email Address template and use the subject
`Confirm your account email change | Eagle Gymnastics`. Its inline styles,
fluid tables and hosted logo match the site's purple and navy branding. Both
the button and fallback link use the callback above; neither verifies on GET.
Preview it in Supabase and send a real test to check the target email client.

Supabase supplies the token hash appropriate to each recipient. Preserve both
confirmation emails. Do not change the signup/recovery templates for this task.
The public page verifies the link when the recipient clicks its confirmation
button. Token hashes work without the originating browser's PKCE verifier.
Existing code-based email links are still accepted in their original browser;
links without a code/hash only show instructions, never a success claim.

References:
- https://supabase.com/docs/guides/auth/auth-email-templates
- https://supabase.com/docs/reference/javascript/auth-updateuser

Verified account ownership and migration behaviour
--------------------------------------------------

The authoritative email is `auth.users.email`. The stable path is
`web_accounts.auth_user_id -> web_accounts.account_id -> public."Accounts".id`.
`Accounts."userId"` is NOT a verified Auth link: 239 linked records have different
values. Existing values are preserved. Confirmation never matches by email,
creates accounts, reassigns links, or modifies children/bookings/payment fields.

No triggers existed on the three inspected tables. Existing constraints include
the Accounts normalised-email unique index and nonblank check, web_accounts
email/auth-user uniqueness, and the Accounts foreign key. The added partial
unique account_id index prevents two Auth logins sharing a linked legacy row.

Auth users with no web account are valid historical/mobile users: sync skips
them without creating anything. A web account without account_id is valid before
profile setup: its email is synchronised, without creating a legacy row. When
account_id is present, the referenced legacy row is mandatory. Missing linked
rows or constraint failures abort the same Auth transaction. The trigger fires
only for `OLD.email IS DISTINCT FROM NEW.email`.

The trigger functions use qualified references, empty search paths and an
explicit postgres owner to perform the narrow updates through RLS. They cannot
be executed by application roles. Invoker-security guards reject direct changes
to mirrored email fields, including service-role profile writes; nested sync
also checks the value against Auth. The status RPC is authenticated and reads
only the caller's Auth ID. The profile RPC is service-role-only, locks Auth before
initialising records, and updates existing profiles without writing email or IDs.

Bootstrap no longer creates links or searches for legacy ownership by email.
Profile setup encountering a legacy duplicate rolls back and requires a verified
link from support, rather than guessing ownership. Development impersonation's
read-only email lookup remains; the email-change control is disabled there.

Existing data was not repaired: inspection found one web mirror and five linked
legacy mirrors differing from Auth, eight web accounts without a legacy link,
and 648 Auth users without a web account. No shared legacy links or dangling
Auth links were found. A subsequent confirmed change synchronises the verified
links; existing discrepancies are not silently backfilled.

Validation
----------

    node --test tests/account-email.test.cjs
    npx.cmd tsc --noEmit --incremental false

On a project with the migration installed, run `sql/test_account_email_changes.sql`
between BEGIN and ROLLBACK. To validate before installation, run it in the SAME
transaction as the migration body, omitting the migration's BEGIN/COMMIT and
ending in ROLLBACK. Never run those fixtures as a committed migration. SQL checks cover pending and
partial states, full sync, both unique constraints with atomic rollback, protected
email edits, optional/mandatory links, profile creation/save and function grants.
The Auth phase is simulated with SQL; the connection cannot SET ROLE to
Supabase's internal supabase_auth_admin. Service-role profile and authenticated
status privileges are exercised directly.

Before release, use a test account with access to two mailboxes:
1. Request a change; verify continued sign-in and all three active emails stay old.
2. Confirm only one address (repeat with each confirmation order). Verify all
   active emails stay old, including a normal profile save while pending.
3. Confirm the second address signed out/on another device. Verify both mirrors
   and Auth change together, the original device refreshes, and the same user,
   account, children, bookings, roles and payment relationships remain.
4. Sign in with the new email and the existing password.
5. Exercise expired/reused links, rate limits, duplicate email failures, signup
   confirmation and password recovery. Confirm failures never show success.

The running local dev server was checked at `http://localhost:3000`. The installed
status RPC is visible through the API and rejects anonymous callers as intended.
Public Auth settings confirm email login is enabled and automatic email
confirmation is disabled. Secure Email Change, the redirect allowlist and email
template are not exposed by the connected tools. On 7 October 2026 the user
confirmed the dashboard configuration and later confirmed the dual-confirmation
flow works end to end. The localhost callback and token-hash template remain
applicable. Secure Email Change must remain enabled; if it was switched off
during testing, enable it again before starting a fresh request.

Local HTTP checks passed: signed-out status returns 401, email callback redirects
to the public confirmation page, that page returns 200, and malformed confirmation
submissions return 400. The focused application tests also cover production,
preview and localhost redirect selection, including ignoring submitted redirects.

The user verified the dual-confirmation flow works. Use another browser or a
private window on the same computer to test without the original
session/verifier. A localhost link on a different physical device points to that
device; testing there requires an accessible application URL and its own allowed
redirect. Auth configuration was not silently changed.

Vercel readiness checks on 7 October 2026: all 21 account-email tests and eight
badge regression tests passed, targeted ESLint passed, and `npm.cmd run build`
completed including TypeScript checks. The installed email sync/guard triggers
were rechecked. The database test script passed against the connected project
inside BEGIN/ROLLBACK; none of its fixtures were retained. No migration or Auth
configuration change was needed. Production/preview Auth allowlists, the email
template and Vercel environment configuration still require dashboard checking;
the connected tools cannot inspect or change those settings. A real preview
two-mailbox test remains the final release check.
