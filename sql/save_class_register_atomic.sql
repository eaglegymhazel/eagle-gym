-- Run this in Supabase SQL editor before using /api/admin/register/save
-- It ensures header + entries are saved atomically in a single DB transaction.

create or replace function public.save_class_register_atomic(
  p_class_id uuid,
  p_session_date date,
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

  insert into public."ClassRegisters" (
    "classId",
    "sessionDate",
    "takenByAccountId",
    "presentCount",
    "absentCount"
  )
  values (
    p_class_id,
    p_session_date,
    p_taken_by_account_id,
    p_present_count,
    p_absent_count
  )
  returning id into v_register_id;

  insert into public."ClassRegisterEntries" (
    "registerId",
    "childId",
    "isPresent",
    "requiresPickup"
  )
  select
    v_register_id,
    (entry->>'childId')::uuid,
    (entry->>'isPresent')::boolean,
    coalesce((entry->>'requiresPickup')::boolean, true)
  from jsonb_array_elements(p_entries) as entry;

  return query
  select
    v_register_id,
    p_present_count,
    p_absent_count;
end;
$$;

