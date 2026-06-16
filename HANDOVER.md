# Eagle Gymnastics Web App Handover

Last reviewed: 2026-06-16

## Overview

This is a Next.js app for Eagle Gymnastics Academy. It covers the public marketing website, customer account/booking flows, admin operations, Sanity CMS content, Supabase-backed data, Stripe checkout/subscriptions, and email confirmations.

The codebase uses:

- Next.js App Router, React, TypeScript, Tailwind CSS
- Supabase Auth and Postgres
- Stripe Checkout, subscriptions, webhooks, and live/test recreational/competition accounts
- Sanity Studio embedded at `/studio`
- Resend API email sending from server code
- Vercel-style deployment assumptions

## First Hour For A New Developer

1. Install dependencies with `npm install`.
2. Create `.env.local` with the required environment variables listed below. Do not commit real keys.
3. Start local development with `npm run dev`.
4. Build-check with `npm run build`.
5. Open:
   - Public site: `/`
   - Admin dashboard: `/admin`
   - Account area: `/account`
   - Booking entry: `/book`
   - Sanity Studio: `/studio`

The app currently has a site gate controlled by `SITE_GATE_ENABLED`; when enabled, most routes redirect through `/site-access`.

## Repository Structure

- `app/` - Next.js routes, layouts, route handlers, and page/client components.
- `app/(marketing)/` - public website pages: home, about, team, timetable, news, gallery, events calendars, birthday party information, contact.
- `app/(portal)/` - customer-facing auth, account, booking, birthday party booking, and summer camp flows.
- `app/(admin)/` - admin dashboard, register pages, student profile/admin tooling.
- `app/api/` - API route handlers for auth, account updates, admin actions, checkout, Stripe webhooks, contact, waitlist, revalidation.
- `components/` - shared/admin/legal/ui components.
- `content/` - static legal copy.
- `lib/` - Supabase clients, server data access, pricing, Sanity helpers, validation, booking/email logic.
- `sanity/` - Sanity schema definitions.
- `sql/` - project SQL snippets/migrations for selected features. This is not a complete schema history.
- `public/` - static assets.

## Main Commands

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run sanity
```

Use `npm run build` as the main verification command before deployment.

## Environment Variables

Required or commonly used variable names:

### Supabase

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Stripe

Recreational test/live:

- `TEST_REC_STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_TEST_REC_STRIPE_PUBLISHABLE_KEY`
- `TEST_REC_STRIPE_WEBHOOK_SECRET`
- `TEST_REC_STRIPE_PRICE_ID`
- `LIVE_REC_STRIPE_SECRET_KEY`
- `LIVE_REC_STRIPE_WEBHOOK_SECRET`
- `LIVE_REC_STRIPE_STANDARD_PRICE_ID`
- `LIVE_REC_STRIPE_PRESCHOOL_PRICE_ID`

Competition test/live:

- `COMP_PUB_KEY`
- `TEST_COMP_STRIPE_SECRET_KEY`
- `TEST_COMP_STRIPE_PRICE_ID`
- `TEST_COMP_STRIPE_WEBHOOK_SECRET`
- `LIVE_COMP_STRIPE_SECRET_KEY`
- `LIVE_COMP_STRIPE_WEBHOOK_SECRET`

Shared:

- `APP_URL`

### Email / Contact

- `RESEND_API_KEY`
- `CONTACT_FROM_EMAIL`
- `CONTACT_TO_EMAIL`
- `CONTACT_CC_EMAIL`

### Sanity

- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET`
- `NEXT_PUBLIC_SANITY_STUDIO_TITLE`

### Site Gate

- `SITE_GATE_ENABLED`
- `SITE_GATE_PASSWORD`
- `SITE_GATE_SECRET`

### Development Only

- `DEV_IMPERSONATE_EMAIL`

Never commit `.env.local` or paste live secrets into tickets/docs. If secrets have been shared outside a secure channel, rotate them.

## Routing And Access Control

The middleware-style file is `proxy.ts`.

It handles:

- Adding an `x-request-id`
- Optional site gate redirect to `/site-access`
- Supabase auth cookie refresh/validation for authenticated areas
- Public route bypasses
- Webhook/revalidation bypasses

Important behavior:

- Static assets are bypassed.
- `/api/stripe/webhook` bypasses the site gate.
- `/api/sanity/revalidate` bypasses the site gate.
- `/studio` is public from the app proxy perspective; Sanity controls its own auth.
- Some authenticated flows perform their own auth/account checks instead of relying only on proxy behavior.

## Supabase

Supabase is used for auth and most application data. There are two main client patterns:

- Browser/client usage via `lib/supabaseClient.ts`.
- Server admin usage via `lib/admin.ts`, which wraps the service-role client.

Server data access is generally in `lib/server/*`.

Important tables referenced by the code include:

- `Accounts`
- `Children`
- `MedicalInformation`
- `Classes`
- `CompetitionPricing`
- `Bookings`
- `ClassBookingGroups`
- `ClassBookingGroupItems`
- `CompetitionBookingDrafts`
- `WaitlistEntries`
- `ClassRegisters`
- `ClassRegisterEntries`
- `SummerCampSessions`
- `SummerCampBookings`
- `SummerCampBookingGroups`
- `SummerCampRegisters`
- `SummerCampRegisterEntries`
- `BirthdayPartyBookings`
- `BirthdayPartyScheduleRules`
- `BirthdayPartyBlockedDates`
- `web_accounts`
- `calendar_events`
- `calendar_events_competition`
- badge tables such as `badge_definitions`, `badge_skills`, `child_badge_assignments`, `child_badge_skill_progress`

Selected SQL files exist in `sql/`, but the folder should not be treated as a complete source of truth for production schema.

## Auth And Accounts

Supabase Auth is used for web login/register/password flows.

Key files:

- `app/components/auth/AuthProvider.tsx`
- `app/(portal)/login/LoginClient.tsx`
- `app/(portal)/register/RegisterClient.tsx`
- `app/auth/callback/route.ts`
- `app/api/auth/*`
- `lib/server/bookingContext.ts`
- `lib/server/bootstrapAccount.ts`
- `lib/server/webAccountRole.ts`

The app bridges Supabase users to legacy/customer records through `web_accounts.account_id` pointing to `Accounts.id`.

Admin access is role-based through `web_accounts.role === "admin"`.

## Public Website

Key public pages:

- `/` home
- `/about`
- `/team`
- `/timetable`
- `/news`
- `/gallery`
- `/contact`
- `/birthday-party`
- `/members`
- `/recreational-events-calendar`
- `/competition-events-calendar`

Sanity-backed content:

- News posts
- Gallery images
- Members page content

Static/local content:

- Team data currently lives in `app/(marketing)/team/teamData.ts`.
- Legal copy lives in `content/legal/*`.

## Calendar Events

Public calendar pages:

- `/recreational-events-calendar`
- `/competition-events-calendar`
- `/events` redirects to recreational events

Server fetcher:

- `lib/server/calendarEvents.ts`

Tables:

- Recreational: `calendar_events`
- Competition: `calendar_events_competition`

Admin management:

- Admin tab: `/admin?tab=calendar-events`
- Component: `components/admin/CalendarEventsManager.tsx`
- Admin fetcher: `lib/server/adminCalendarEvents.ts`
- API route: `app/api/admin/calendar-events/route.ts`

The admin tool can:

- View both calendar tables
- Filter by calendar, year, and month
- Add future/today events
- Edit existing rows, including historical rows
- Delete rows

The add-date picker restricts new entries to today/future dates. Existing historical records remain editable.

When rows are added or edited through the admin tool, `source_file` is set to `admin`. Cache tags/paths are revalidated after writes.

## Class Booking Flows

Entry route:

- `/book`

Recreational booking:

- `app/(portal)/book/recreational/*`
- `app/api/checkout/recreational/route.ts`
- Pricing helper: `lib/recreationalClassPricing.ts`
- Catalog helper: `lib/server/classes.ts`

Competition booking:

- `app/(portal)/book/competition/*`
- `app/api/checkout/competition/route.ts`
- Drafts: `lib/server/competitionBookingDrafts.ts`
- Selection model: `lib/competitionBookingSelection.ts`
- Pricing: `CompetitionPricing` table

Shared checkout/hold concepts:

- `ClassBookingGroups`
- `ClassBookingGroupItems`
- `Bookings`
- `lib/server/resumableClassCheckout.ts`
- SQL helper: `sql/class_booking_holds.sql`

Stripe Checkout is used for payment/subscription start. The webhook finalizes bookings.

## Summer Camps

Routes:

- `/summer-camps`
- `/summer-camps/2026`
- `/summer-camps/2026/book`
- `/summer-camps/2026/summary`
- `/summer-camps/2026/success`

Key files:

- `lib/summerCamps.ts`
- `lib/server/summerCampBookings.ts`
- `lib/server/resumableSummerCampCheckout.ts`
- `app/api/checkout/summer-camp/route.ts`
- `sql/summer_camp_bookings.sql`
- `sql/save_summer_camp_register_atomic.sql`

Admin register:

- `/admin?tab=summer-camp-register`
- `app/(admin)/admin/summer-camp-register/*`
- `app/api/admin/summer-camp-register/save/route.ts`

## Birthday Parties

Public info:

- `/birthday-party`

Booking flow:

- `/birthday-party/book`
- `/birthday-party/book/details`
- `/birthday-party/book/review`
- `/birthday-party/book/success`

Key files:

- `app/(portal)/birthday-party/book/*`
- `lib/birthdayPartyBookingValidation.ts`
- `lib/server/birthdayPartyBookings.ts`
- `lib/server/adminBirthdayPartyBookings.ts`
- `app/api/checkout/birthday-party/route.ts`
- `app/api/admin/birthday-party-availability/route.ts`
- `app/api/admin/birthday-party-bookings/[bookingId]/route.ts`

Admin:

- `/admin?tab=birthday-parties`
- View upcoming parties
- Manage availability/block dates
- View, reschedule, or delete party bookings through detail pages

## Admin Dashboard

Primary route:

- `/admin`

Main files:

- `app/(admin)/admin/page.tsx`
- `app/(admin)/admin/AdminShell.tsx`
- `components/admin/*`
- `lib/server/adminDashboard.ts`
- `lib/server/adminMissedPayments.ts`

Tabs currently include:

- Student Management
- Class Register
- Summer Camp Register
- Waiting List
- Missed Payments
- Birthday Parties
- Calendar Events

Common admin API routes:

- `app/api/admin/children-directory/route.ts`
- `app/api/admin/register-classes/route.ts`
- `app/api/admin/register/save/route.ts`
- `app/api/admin/register-history/route.ts`
- `app/api/admin/waitlist/route.ts`
- `app/api/admin/class-bookings/route.ts`
- `app/api/admin/move-recreational-booking/route.ts`
- `app/api/admin/archive-student/route.ts`
- `app/api/admin/student-competition-eligibility/route.ts`
- `app/api/admin/student-pickup-requirement/route.ts`
- `app/api/admin/child-badges/route.ts`

Admin API routes generally use Supabase Auth cookies to identify the current user, then verify admin role through `getWebAccountRoleForUser` and `isAdminRole`.

## Stripe

Stripe is used for:

- Recreational class checkout/subscriptions
- Competition class checkout/subscriptions
- Summer camp checkout
- Birthday party checkout
- Missed payments admin view

Important files:

- `app/api/checkout/recreational/route.ts`
- `app/api/checkout/competition/route.ts`
- `app/api/checkout/summer-camp/route.ts`
- `app/api/checkout/birthday-party/route.ts`
- `app/api/stripe/webhook/route.ts`
- `lib/server/stripeCheckoutCustomer.ts`
- `lib/server/bookings.ts`
- `lib/server/adminMissedPayments.ts`

Webhook route:

- `/api/stripe/webhook`

The webhook uses available live/test secrets and finalizes data after `checkout.session.completed`, subscription deletion, and related events.

Operational note: keep recreational and competition Stripe account/key separation clear. The code has separate env vars for each programme.

## Email

Email helpers live in:

- `lib/server/bookingEmails.ts`
- `app/api/contact/route.ts`

Booking confirmations include:

- Recreational class booking
- Competition class booking
- Summer camp booking
- Birthday party booking

Contact form variables are listed in the environment section.

## Sanity CMS

Studio route:

- `/studio`

Config:

- `sanity.config.ts`
- `sanity.cli.ts`
- `lib/sanity/*`
- `sanity/schemaTypes/*`

Schemas:

- `newsPostType`
- `galleryImageType`
- `membersPageType`

Images from `cdn.sanity.io` are allowed in `next.config.ts`.

Sanity revalidation route:

- `app/api/sanity/revalidate/route.ts`

## Caching And Revalidation

Examples:

- Classes are cached in `lib/server/classes.ts` for 60 seconds.
- Calendar events are cached in `lib/server/calendarEvents.ts` for 300 seconds with tags.
- News/gallery/Sanity pages use Next/Sanity caching patterns.

Admin calendar event writes revalidate:

- `calendar-events-catalog`
- `calendar-events-competition-catalog`
- `/recreational-events-calendar`
- `/competition-events-calendar`
- `/events`

If admin changes do not appear immediately on public pages, check revalidation tags/path calls first.

## Deployment Notes

The app is designed for a Node-capable Next.js deployment. Vercel is the likely target based on project structure.

Before deploying:

1. Ensure all env vars are set in the deployment environment.
2. Confirm Stripe webhook endpoints point to the deployed `/api/stripe/webhook`.
3. Confirm Sanity dataset/project and revalidation webhook settings.
4. Run `npm run build`.
5. Confirm site gate settings for production.

## Known Caveats / Maintenance Notes

- `.env.local` contains sensitive live credentials locally. Do not commit it and rotate secrets if exposed.
- The `sql/` folder is partial, not a complete database migration history.
- Some data appears to come from legacy tables with capitalized names, for example `Accounts`, `Children`, `Classes`, and `Bookings`.
- Calendar event tables were likely originally imported from CSV/source files, but runtime reads from Supabase tables.
- `DEV_IMPERSONATE_EMAIL` must never be set in production; `lib/server/bookingContext.ts` explicitly guards this.
- Admin dashboard is fairly large in `AdminShell.tsx`; future admin features may benefit from further component extraction.
- There is an unrelated modified file currently visible in git status: `sql/save_class_register_atomic.sql`. Treat it as pre-existing unless you intentionally edit it.

## Useful Files To Open First

- `app/layout.tsx`
- `proxy.ts`
- `app/(admin)/admin/page.tsx`
- `app/(admin)/admin/AdminShell.tsx`
- `lib/admin.ts`
- `lib/server/bookingContext.ts`
- `lib/server/classes.ts`
- `app/api/stripe/webhook/route.ts`
- `lib/server/bookingEmails.ts`
- `components/admin/CalendarEventsManager.tsx`

## Suggested Future Improvements

- Add proper database migrations for all production tables.
- Split `AdminShell.tsx` into tab-specific components.
- Add automated tests for checkout/webhook finalization paths.
- Add audit logging for admin destructive actions, especially booking/calendar deletes.
- Add a search box to Calendar Events if row counts continue to grow.
- Centralize admin auth guard logic for API routes to reduce repeated code.
