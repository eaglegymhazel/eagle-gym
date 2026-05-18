create or replace function public.save_summer_camp_register_atomic(
  p_slug text,
  p_camp_date date,
  p_taken_by_account_id uuid,
  p_present_count int,
  p_absent_count int,
  p_entries jsonb
)
returns table(
  register_id uuid,
  present_count int,
  absent_count int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_register_id uuid;
begin
  if jsonb_typeof(p_entries) <> 'array' then
    raise exception 'p_entries must be a JSON array';
  end if;

  insert into public."SummerCampRegisters" (
    slug,
    "campDate",
    "takenByAccountId",
    "presentCount",
    "absentCount"
  )
  values (
    p_slug,
    p_camp_date,
    p_taken_by_account_id,
    p_present_count,
    p_absent_count
  )
  on conflict (slug, "campDate")
  do update set
    "takenByAccountId" = excluded."takenByAccountId",
    "presentCount" = excluded."presentCount",
    "absentCount" = excluded."absentCount",
    updated_at = now()
  returning id into v_register_id;

  delete from public."SummerCampRegisterEntries"
  where "registerId" = v_register_id;

  insert into public."SummerCampRegisterEntries" (
    "registerId",
    "childId",
    "isPresent",
    "requiresPickup",
    "isCollected"
  )
  select
    v_register_id,
    (entry->>'childId')::uuid,
    (entry->>'isPresent')::boolean,
    coalesce((entry->>'requiresPickup')::boolean, true),
    coalesce((entry->>'isCollected')::boolean, false)
  from jsonb_array_elements(p_entries) as entry;

  return query
  select
    v_register_id,
    p_present_count,
    p_absent_count;
end;
$$;
