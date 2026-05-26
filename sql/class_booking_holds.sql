create table if not exists public."ClassBookingGroups" (
  id uuid not null default gen_random_uuid (),
  "accountId" uuid not null,
  "childId" uuid not null,
  "bookingType" text not null,
  status text not null,
  "stripeCheckoutSessionId" text null,
  "stripeSubscriptionId" text null,
  "stripeCustomerId" text null,
  "holdExpiresAt" timestamp with time zone null,
  "paidAt" timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint "ClassBookingGroups_pkey" primary key (id),
  constraint "ClassBookingGroups_accountId_fkey" foreign key ("accountId") references public."Accounts" (id),
  constraint "ClassBookingGroups_childId_fkey" foreign key ("childId") references public."Children" (id),
  constraint "ClassBookingGroups_bookingType_check" check ("bookingType" in ('recreational', 'competition')),
  constraint "ClassBookingGroups_status_check" check (status in ('pending', 'paid', 'failed', 'expired', 'cancelled'))
) tablespace pg_default;

create table if not exists public."ClassBookingGroupItems" (
  id uuid not null default gen_random_uuid (),
  "bookingGroupId" uuid not null,
  "classId" uuid not null,
  "childId" uuid not null,
  "bookingType" text not null,
  "bookedDurationMinutes" integer null,
  "startDate" date null,
  "endDate" date null,
  status text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint "ClassBookingGroupItems_pkey" primary key (id),
  constraint "ClassBookingGroupItems_bookingGroupId_fkey" foreign key ("bookingGroupId") references public."ClassBookingGroups" (id) on delete cascade,
  constraint "ClassBookingGroupItems_classId_fkey" foreign key ("classId") references public."Classes" (id),
  constraint "ClassBookingGroupItems_childId_fkey" foreign key ("childId") references public."Children" (id),
  constraint "ClassBookingGroupItems_bookingType_check" check ("bookingType" in ('recreational', 'competition')),
  constraint "ClassBookingGroupItems_status_check" check (status in ('pending', 'finalized', 'expired', 'cancelled')),
  constraint "ClassBookingGroupItems_duration_check" check ("bookedDurationMinutes" is null or "bookedDurationMinutes" > 0)
) tablespace pg_default;

create index if not exists "idx_class_booking_groups_accountId"
  on public."ClassBookingGroups" using btree ("accountId") tablespace pg_default;

create index if not exists "idx_class_booking_groups_childId"
  on public."ClassBookingGroups" using btree ("childId") tablespace pg_default;

create index if not exists "idx_class_booking_groups_status"
  on public."ClassBookingGroups" using btree (status) tablespace pg_default;

create index if not exists "idx_class_booking_groups_holdExpiresAt"
  on public."ClassBookingGroups" using btree ("holdExpiresAt") tablespace pg_default;

create unique index if not exists "uniq_class_booking_groups_stripeCheckoutSessionId"
  on public."ClassBookingGroups" using btree ("stripeCheckoutSessionId")
  tablespace pg_default
  where "stripeCheckoutSessionId" is not null;

create unique index if not exists "uniq_class_booking_groups_stripeSubscriptionId"
  on public."ClassBookingGroups" using btree ("stripeSubscriptionId")
  tablespace pg_default
  where "stripeSubscriptionId" is not null;

create index if not exists "idx_class_booking_group_items_bookingGroupId"
  on public."ClassBookingGroupItems" using btree ("bookingGroupId") tablespace pg_default;

create index if not exists "idx_class_booking_group_items_classId"
  on public."ClassBookingGroupItems" using btree ("classId") tablespace pg_default;

create index if not exists "idx_class_booking_group_items_childId"
  on public."ClassBookingGroupItems" using btree ("childId") tablespace pg_default;

create index if not exists "idx_class_booking_group_items_status"
  on public."ClassBookingGroupItems" using btree (status) tablespace pg_default;

create index if not exists "idx_class_booking_group_items_bookingType"
  on public."ClassBookingGroupItems" using btree ("bookingType") tablespace pg_default;

create unique index if not exists "uniq_pending_class_hold_per_child_class_type"
  on public."ClassBookingGroupItems" using btree ("childId", "classId", "bookingType")
  tablespace pg_default
  where status = 'pending';

create unique index if not exists "uniq_class_per_booking_group"
  on public."ClassBookingGroupItems" using btree ("bookingGroupId", "classId")
  tablespace pg_default;

create or replace function public.create_recreational_class_booking_hold(
  p_account_id uuid,
  p_child_id uuid,
  p_class_ids uuid[],
  p_hold_minutes integer default 15
)
returns table(
  booking_group_id uuid,
  hold_expires_at timestamp with time zone
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class_ids uuid[];
  v_requested_count integer;
  v_found_count integer;
  v_group_id uuid;
  v_hold_expires_at timestamp with time zone;
  v_full_class_id uuid;
begin
  select array_agg(distinct class_id order by class_id)
  into v_class_ids
  from unnest(p_class_ids) as class_id
  where class_id is not null;

  v_requested_count := coalesce(array_length(v_class_ids, 1), 0);

  if v_requested_count = 0 then
    raise exception 'No classes selected';
  end if;

  if not exists (
    select 1
    from public."Children"
    where id = p_child_id
      and "accountId" = p_account_id
      and coalesce("isArchived", false) = false
  ) then
    raise exception 'Child not found for this account';
  end if;

  update public."ClassBookingGroupItems" item
  set status = 'expired',
      updated_at = now()
  from public."ClassBookingGroups" grp
  where item."bookingGroupId" = grp.id
    and item.status = 'pending'
    and grp.status = 'pending'
    and grp."holdExpiresAt" <= now();

  update public."ClassBookingGroups"
  set status = 'expired',
      updated_at = now()
  where status = 'pending'
    and "holdExpiresAt" <= now();

  perform 1
  from public."Classes"
  where id = any(v_class_ids)
  order by id
  for update;

  select count(*)
  into v_found_count
  from public."Classes"
  where id = any(v_class_ids)
    and coalesce("isCompetitionClass", false) = false;

  if v_found_count <> v_requested_count then
    raise exception 'One or more classes are invalid for recreational checkout';
  end if;

  if exists (
    select 1
    from public."Bookings"
    where "childId" = p_child_id
      and "classId" = any(v_class_ids)
      and "bookingType" = 'recreational'
      and status = 'active'
  ) then
    raise exception 'This child already has an active booking for one of those classes';
  end if;

  if exists (
    select 1
    from public."ClassBookingGroupItems" item
    join public."ClassBookingGroups" grp on grp.id = item."bookingGroupId"
    where item."childId" = p_child_id
      and item."classId" = any(v_class_ids)
      and item."bookingType" = 'recreational'
      and item.status = 'pending'
      and grp.status = 'pending'
      and grp."holdExpiresAt" > now()
  ) then
    raise exception 'This child already has a checkout in progress for one of those classes';
  end if;

  select cls.id
  into v_full_class_id
  from public."Classes" cls
  where cls.id = any(v_class_ids)
    and cls.capacity is not null
    and (
      (
        select count(*)
        from public."Bookings" booking
        where booking."classId" = cls.id
          and booking.status = 'active'
      ) +
      (
        select count(*)
        from public."ClassBookingGroupItems" item
        join public."ClassBookingGroups" grp on grp.id = item."bookingGroupId"
        where item."classId" = cls.id
          and item.status = 'pending'
          and grp.status = 'pending'
          and grp."holdExpiresAt" > now()
      )
    ) >= cls.capacity
  limit 1;

  if v_full_class_id is not null then
    raise exception 'One or more selected classes are now full';
  end if;

  v_hold_expires_at := now() + make_interval(mins => greatest(p_hold_minutes, 1));

  insert into public."ClassBookingGroups" (
    "accountId",
    "childId",
    "bookingType",
    status,
    "holdExpiresAt"
  )
  values (
    p_account_id,
    p_child_id,
    'recreational',
    'pending',
    v_hold_expires_at
  )
  returning id into v_group_id;

  insert into public."ClassBookingGroupItems" (
    "bookingGroupId",
    "classId",
    "childId",
    "bookingType",
    "bookedDurationMinutes",
    status
  )
  select
    v_group_id,
    cls.id,
    p_child_id,
    'recreational',
    cls."durationMinutes",
    'pending'
  from public."Classes" cls
  where cls.id = any(v_class_ids);

  return query select v_group_id, v_hold_expires_at;
end;
$$;

create or replace function public.create_competition_class_booking_hold(
  p_account_id uuid,
  p_child_id uuid,
  p_selections jsonb,
  p_hold_minutes integer default 15
)
returns table(
  booking_group_id uuid,
  hold_expires_at timestamp with time zone
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_requested_count integer;
  v_found_count integer;
  v_group_id uuid;
  v_hold_expires_at timestamp with time zone;
  v_full_class_id uuid;
begin
  create temporary table tmp_competition_booking_selections (
    "classId" uuid primary key,
    "bookedDurationMinutes" integer not null
  ) on commit drop;

  insert into tmp_competition_booking_selections ("classId", "bookedDurationMinutes")
  select distinct
    (entry->>'classId')::uuid,
    (entry->>'bookedDurationMinutes')::integer
  from jsonb_array_elements(coalesce(p_selections, '[]'::jsonb)) as entry
  where entry ? 'classId'
    and entry ? 'bookedDurationMinutes'
    and nullif(entry->>'classId', '') is not null
    and (entry->>'bookedDurationMinutes') ~ '^[0-9]+$'
    and (entry->>'bookedDurationMinutes')::integer > 0;

  select count(*) into v_requested_count from tmp_competition_booking_selections;

  if v_requested_count = 0 then
    raise exception 'No classes selected';
  end if;

  if not exists (
    select 1
    from public."Children"
    where id = p_child_id
      and "accountId" = p_account_id
      and coalesce("isArchived", false) = false
  ) then
    raise exception 'Child not found for this account';
  end if;

  update public."ClassBookingGroupItems" item
  set status = 'expired',
      updated_at = now()
  from public."ClassBookingGroups" grp
  where item."bookingGroupId" = grp.id
    and item.status = 'pending'
    and grp.status = 'pending'
    and grp."holdExpiresAt" <= now();

  update public."ClassBookingGroups"
  set status = 'expired',
      updated_at = now()
  where status = 'pending'
    and "holdExpiresAt" <= now();

  perform 1
  from public."Classes" cls
  join tmp_competition_booking_selections sel on sel."classId" = cls.id
  order by cls.id
  for update;

  select count(*)
  into v_found_count
  from public."Classes" cls
  join tmp_competition_booking_selections sel on sel."classId" = cls.id
  where coalesce(cls."isCompetitionClass", false) = true
    and cls."durationMinutes" is not null
    and cls."durationMinutes" > 0
    and (
      sel."bookedDurationMinutes" = cls."durationMinutes"
      or (
        cls."durationMinutes" = 180
        and sel."bookedDurationMinutes" = 120
      )
    );

  if v_found_count <> v_requested_count then
    raise exception 'One or more classes are invalid for competition checkout';
  end if;

  if exists (
    select 1
    from public."Bookings" booking
    join tmp_competition_booking_selections sel on sel."classId" = booking."classId"
    where booking."childId" = p_child_id
      and booking."bookingType" = 'competition'
      and booking.status = 'active'
  ) then
    raise exception 'This child already has an active booking for one of those classes';
  end if;

  if exists (
    select 1
    from public."ClassBookingGroupItems" item
    join public."ClassBookingGroups" grp on grp.id = item."bookingGroupId"
    join tmp_competition_booking_selections sel on sel."classId" = item."classId"
    where item."childId" = p_child_id
      and item."bookingType" = 'competition'
      and item.status = 'pending'
      and grp.status = 'pending'
      and grp."holdExpiresAt" > now()
  ) then
    raise exception 'This child already has a checkout in progress for one of those classes';
  end if;

  select cls.id
  into v_full_class_id
  from public."Classes" cls
  join tmp_competition_booking_selections sel on sel."classId" = cls.id
  where cls.capacity is not null
    and (
      (
        select count(*)
        from public."Bookings" booking
        where booking."classId" = cls.id
          and booking.status = 'active'
      ) +
      (
        select count(*)
        from public."ClassBookingGroupItems" item
        join public."ClassBookingGroups" grp on grp.id = item."bookingGroupId"
        where item."classId" = cls.id
          and item.status = 'pending'
          and grp.status = 'pending'
          and grp."holdExpiresAt" > now()
      )
    ) >= cls.capacity
  limit 1;

  if v_full_class_id is not null then
    raise exception 'One or more selected classes are now full';
  end if;

  v_hold_expires_at := now() + make_interval(mins => greatest(p_hold_minutes, 1));

  insert into public."ClassBookingGroups" (
    "accountId",
    "childId",
    "bookingType",
    status,
    "holdExpiresAt"
  )
  values (
    p_account_id,
    p_child_id,
    'competition',
    'pending',
    v_hold_expires_at
  )
  returning id into v_group_id;

  insert into public."ClassBookingGroupItems" (
    "bookingGroupId",
    "classId",
    "childId",
    "bookingType",
    "bookedDurationMinutes",
    status
  )
  select
    v_group_id,
    sel."classId",
    p_child_id,
    'competition',
    sel."bookedDurationMinutes",
    'pending'
  from tmp_competition_booking_selections sel;

  return query select v_group_id, v_hold_expires_at;
end;
$$;
