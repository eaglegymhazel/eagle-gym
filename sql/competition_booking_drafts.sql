create table if not exists public."CompetitionBookingDrafts" (
  id uuid not null default gen_random_uuid (),
  "accountId" uuid not null,
  "childId" uuid not null,
  selections jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint CompetitionBookingDrafts_pkey primary key (id),
  constraint CompetitionBookingDrafts_accountId_fkey
    foreign key ("accountId") references public."Accounts" (id),
  constraint CompetitionBookingDrafts_childId_fkey
    foreign key ("childId") references public."Children" (id)
) tablespace pg_default;

create unique index if not exists competition_booking_drafts_account_child_key
  on public."CompetitionBookingDrafts" using btree ("accountId", "childId")
  tablespace pg_default;

create index if not exists competition_booking_drafts_updated_at_idx
  on public."CompetitionBookingDrafts" using btree (updated_at desc)
  tablespace pg_default;
