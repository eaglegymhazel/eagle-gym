create table if not exists public."SummerCampSessions" (
  id uuid not null default gen_random_uuid (),
  slug text not null,
  title text not null,
  "campDate" date not null,
  "startTime" time without time zone not null default '10:00'::time,
  "endTime" time without time zone not null default '15:00'::time,
  capacity integer not null,
  status text not null default 'active',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint "SummerCampSessions_pkey" primary key (id),
  constraint "SummerCampSessions_capacity_check" check (capacity > 0),
  constraint "SummerCampSessions_status_check" check (status in ('active', 'archived')),
  constraint "SummerCampSessions_slug_date_key" unique (slug, "campDate")
) tablespace pg_default;

create index if not exists "summer_camp_sessions_date_idx"
  on public."SummerCampSessions" using btree ("campDate")
  tablespace pg_default;

create table if not exists public."SummerCampBookingGroups" (
  id uuid not null default gen_random_uuid (),
  "accountId" uuid not null,
  "childId" uuid not null,
  slug text not null,
  status text not null default 'pending',
  "totalAmountPence" integer not null,
  currency text not null default 'gbp',
  "stripeCheckoutSessionId" text null,
  "stripePaymentIntentId" text null,
  "holdExpiresAt" timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  paid_at timestamp with time zone null,
  constraint "SummerCampBookingGroups_pkey" primary key (id),
  constraint "SummerCampBookingGroups_accountId_fkey"
    foreign key ("accountId") references public."Accounts" (id),
  constraint "SummerCampBookingGroups_childId_fkey"
    foreign key ("childId") references public."Children" (id),
  constraint "SummerCampBookingGroups_status_check"
    check (status in ('pending', 'paid', 'cancelled', 'expired')),
  constraint "SummerCampBookingGroups_amount_check"
    check ("totalAmountPence" >= 0)
) tablespace pg_default;

create unique index if not exists "summer_camp_booking_groups_checkout_session_key"
  on public."SummerCampBookingGroups" using btree ("stripeCheckoutSessionId")
  tablespace pg_default
  where "stripeCheckoutSessionId" is not null;

create index if not exists "summer_camp_booking_groups_child_idx"
  on public."SummerCampBookingGroups" using btree ("childId", created_at desc)
  tablespace pg_default;

create table if not exists public."SummerCampBookings" (
  id uuid not null default gen_random_uuid (),
  "bookingGroupId" uuid not null,
  "childId" uuid not null,
  slug text not null,
  "campDate" date not null,
  status text not null default 'pending',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint "SummerCampBookings_pkey" primary key (id),
  constraint "SummerCampBookings_bookingGroupId_fkey"
    foreign key ("bookingGroupId") references public."SummerCampBookingGroups" (id) on delete cascade,
  constraint "SummerCampBookings_childId_fkey"
    foreign key ("childId") references public."Children" (id),
  constraint "SummerCampBookings_status_check"
    check (status in ('pending', 'active', 'cancelled', 'expired')),
  constraint "SummerCampBookings_session_fkey"
    foreign key (slug, "campDate")
    references public."SummerCampSessions" (slug, "campDate")
) tablespace pg_default;

create unique index if not exists "summer_camp_bookings_child_date_live_key"
  on public."SummerCampBookings" using btree ("childId", "campDate")
  tablespace pg_default
  where status in ('pending', 'active');

create index if not exists "summer_camp_bookings_date_live_idx"
  on public."SummerCampBookings" using btree ("campDate", "childId")
  tablespace pg_default
  where status in ('pending', 'active');

create index if not exists "summer_camp_bookings_group_idx"
  on public."SummerCampBookings" using btree ("bookingGroupId")
  tablespace pg_default;

create table if not exists public."SummerCampRegisters" (
  id uuid not null default gen_random_uuid (),
  slug text not null,
  "campDate" date not null,
  "takenByAccountId" uuid not null,
  "presentCount" integer not null default 0,
  "absentCount" integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint "SummerCampRegisters_pkey" primary key (id),
  constraint "SummerCampRegisters_takenByAccountId_fkey"
    foreign key ("takenByAccountId") references public."Accounts" (id),
  constraint "SummerCampRegisters_session_fkey"
    foreign key (slug, "campDate")
    references public."SummerCampSessions" (slug, "campDate"),
  constraint "SummerCampRegisters_slug_date_key" unique (slug, "campDate")
) tablespace pg_default;

create table if not exists public."SummerCampRegisterEntries" (
  id uuid not null default gen_random_uuid (),
  "registerId" uuid not null,
  "childId" uuid not null,
  "isPresent" boolean not null,
  "requiresPickup" boolean not null default true,
  "isCollected" boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint "SummerCampRegisterEntries_pkey" primary key (id),
  constraint "SummerCampRegisterEntries_registerId_fkey"
    foreign key ("registerId") references public."SummerCampRegisters" (id) on delete cascade,
  constraint "SummerCampRegisterEntries_childId_fkey"
    foreign key ("childId") references public."Children" (id),
  constraint "SummerCampRegisterEntries_register_child_key"
    unique ("registerId", "childId")
) tablespace pg_default;
