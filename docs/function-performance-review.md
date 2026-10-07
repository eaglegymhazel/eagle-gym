Read-only review of heavier functions, 7 October 2026. Supabase is eu-west-2
(London), t4g.nano, confirmed by the user. The deployed badge endpoint currently
reports lhr1::iad1 in X-Vercel-Id; its replacement is configured for London.
Vercel per-function CPU metrics are not connected, so this ranks code-backed
opportunities, not measured CPU savings.

| Priority | Area | Finding | Safe direction and constraints |
| --- | --- | --- | --- |
| High | `proxy.ts` | No matcher; compiled configuration matches every request, including static assets. Its early asset return still invokes Node.js code. | Exclude assets using a build-time matcher while retaining the site gate and required Auth routes. Validate gate, callbacks, APIs and public pages. |
| High | Function regions | Only the replacement badge API specifies London; most other database-backed routes have no region override. | Place database-heavy routes or the project default near Supabase. Verify Vercel deployment configuration and headers; static content remains on the CDN. |
| High | Public link prefetching | An isolated signed-out homepage visit plus a scroll produced four login and two book prefetch requests with cache misses; closed desktop menus remain mounted. No account/role API calls occurred. | Disable eager prefetch for protected/dynamic routes and closed menu items. Preserve navigation and public static-page caching. |
| Medium | `lib/server/badges.ts` / account bootstrap | `getAssignedBadgesForChildren` runs the full five-query admin badge loader for each child, including the available badge catalog that parents do not need. | Batch assignments and progress across verified child IDs; fetch metadata once and retain inactive assigned badges, empty-child results, ordering and completion rules. Avoid broad caching of private progress. |
| Medium | Admin students directory | Both the page helper and API load all children, including archived ones, then fetch parent emails and bookings in sequential 250-ID chunks. Current/archived filtering and search happen in the browser. | Consolidate the duplicated loader; introduce server pagination/search with stable IDs and explicit counts. Independent read batches can use bounded concurrency. Do not remove pagination from the database reads or truncate results. |
| Medium | Register payment flags | Every class register page calls `getDelinquentAccountFlags`, which scans live Stripe subscriptions for both programmes and both late-payment statuses before filtering to that class/programme. | Fetch the relevant programme, parallelise independent reads with limits, or maintain a webhook-backed snapshot with an explicit freshness policy. Retain live correctness, permissions and payment follow-up behaviour. |
| Medium | Signed-in AuthProvider | `getSession` and INITIAL_SESSION can each call `/api/auth/role`; later Auth events also reload roles. Anonymous users correctly skip the API. | Deduplicate in-flight checks for the same verified session, with generation guards for logout/account switching. Do not persist an admin-authorisation cache across users. |
| Review carefully | Stripe checkout/webhook | These routes contain long sequences of external calls and database mutations. Some sequence is required for capacity holds, idempotency, subscription creation and confirmation emails. Register saving already uses an atomic RPC. | Instrument stage duration before changing sequencing. Preserve payment and booking semantics; use transactional RPCs/outbox patterns for any later rewrite. Do not remove validation or parallelise dependent writes. |

The database already has the relevant badge relationship indexes. Historical
badge SQL averaged approximately 0.29 ms for reads and 2.77 ms for inserts.
Broader queries involving Children, Accounts and Bookings averaged roughly
1.5–1.8 ms. These cumulative database statistics exclude HTTP/network latency,
Auth, Stripe and Vercel JavaScript processing; they are not full request timings.

The admin landing page already loads data only for its selected tab. Public
homepage/about/contact pages are statically cached, and timetable/news/gallery/
calendars use revalidation. Slideshow timers and animations run in the browser.
No payment behaviour, cache freshness or global runtime settings were changed
by this review. The implemented change is documented in
`sql/admin_badge_mutations.md`.

References:

- https://nextjs.org/docs/app/api-reference/file-conventions/proxy
- https://nextjs.org/docs/app/api-reference/components/link#prefetch
- https://vercel.com/docs/functions/configuring-functions/region
- https://vercel.com/docs/functions/usage-and-pricing
