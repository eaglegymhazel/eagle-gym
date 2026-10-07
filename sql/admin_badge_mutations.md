The `admin_badge_mutations` migration is installed on the connected Supabase
project. Deploy the corresponding API and StudentProfileTabs changes together
to Vercel. The Next.js production function manifest confirms `lhr1` for
`/api/admin/child-badges`, colocating it with Supabase `eu-west-2` (London).

Each new-client mutation uses one verified Auth request and one service-only
database RPC. The RPC checks the current `web_accounts` admin role by verified
Auth ID. It runs with invoker privileges, an empty search path, qualified table
references and no grants to PUBLIC, anon or authenticated. Existing RLS policies
and table permissions are unchanged. No role or user ID is accepted from the
browser body.

Assignment creation is idempotent. Skill updates, mark-all, tracking changes and
deletion lock the assignment, keeping the mutation, completion calculation and
response in one transaction. Deletion uses the verified progress FK cascade.
The existing completion rule is preserved: at least one skill, and at most two
unfinished skills. Completion timestamps are preserved on idempotent retries;
unchecking below the threshold clears completion without deleting tracking dates.

New clients request the affected badge with `X-Badge-Response: single` and merge
it into their existing state. Skill ticks update optimistically, retain saving
feedback and revert on failure. A synchronous ref blocks overlapping mutations.
Already-open older clients continue receiving the full response. Server-Timing
headers separate Auth and database RPC duration for future latency checks.

Validation:

- Eight new route/component tests plus the existing 19 account-email tests pass.
- TypeScript, targeted ESLint and the production build pass.
- `sql/test_admin_badge_mutations.sql` passes against the installed function
  inside BEGIN/ROLLBACK. It verifies service-only access, non-admin rejection,
  duplicate assignment/skill retries, cross-badge validation, completion rules,
  tracking dates, mark-all, zero-skill badges and delete cascades. A fixture-only
  trigger forces the second write to fail and verifies progress also rolls back.
- These database fixtures, test trigger and test function are rolled back.
- A separate multi-session production concurrency test was rejected by automatic
  approval review because it would commit a temporary Auth user and admin role.
  No committed fixtures were created; cleanup verification returned zero rows.
  Actual multi-session contention has not been tested. Assignment row locking
  provides serialization, but a live race test needs an isolated test database.

After deployment, refresh the admin browser tab, add a badge, tick and untick
skills, mark all, edit tracking dates and delete the assignment. Inspect the
PATCH response's X-Vercel-Id for London execution and Server-Timing for latency.
The deployed website has not yet been updated by this workspace change, so no
end-to-end production speed improvement is claimed yet.
