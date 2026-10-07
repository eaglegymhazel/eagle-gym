-- Always run inside BEGIN ... ROLLBACK. Only generated fixture IDs are mutated.
DO $$
#variable_conflict use_variable
DECLARE
  admin_id uuid := gen_random_uuid();
  member_id uuid := gen_random_uuid();
  child_id uuid := gen_random_uuid();
  badge_id uuid := gen_random_uuid();
  empty_badge_id uuid := gen_random_uuid();
  foreign_skill uuid := gen_random_uuid();
  skill_ids uuid[] := ARRAY[gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid()];
  assignment_id uuid;
  empty_assignment_id uuid;
  response jsonb;
  completed_at_before timestamptz;
  skill_id uuid;
  fail_trigger text := 'badge_test_' || replace(gen_random_uuid()::text, '-', '');
BEGIN
  INSERT INTO auth.users (id,email) VALUES
    (admin_id,admin_id::text || '@example.invalid'), (member_id,member_id::text || '@example.invalid');
  INSERT INTO public.web_accounts (auth_user_id,email,role) VALUES
    (admin_id,admin_id::text || '@example.invalid','admin'),
    (member_id,member_id::text || '@example.invalid','member');
  INSERT INTO public."Children" (id) VALUES (child_id);
  INSERT INTO public.badge_definitions (id,name,category) VALUES
    (badge_id,'Temporary badge test','Temporary test'), (empty_badge_id,'Empty badge test','Temporary test');
  INSERT INTO public.badge_skills (id,badge_id,name,sort_order)
    SELECT x, badge_id, 'Temporary skill', ordinal::integer FROM unnest(skill_ids) WITH ORDINALITY AS t(x,ordinal);
  INSERT INTO public.badge_skills (id,badge_id,name) VALUES (foreign_skill,empty_badge_id,'Foreign skill');

  IF has_function_privilege('anon','public.admin_mutate_child_badge(uuid,text,jsonb)','EXECUTE')
     OR has_function_privilege('authenticated','public.admin_mutate_child_badge(uuid,text,jsonb)','EXECUTE')
     OR NOT has_function_privilege('service_role','public.admin_mutate_child_badge(uuid,text,jsonb)','EXECUTE') THEN
    RAISE EXCEPTION 'FAIL: RPC permissions';
  END IF;
  EXECUTE 'SET LOCAL ROLE service_role';
  BEGIN
    PERFORM public.admin_mutate_child_badge(member_id,'assign',jsonb_build_object('childId',child_id,'badgeId',badge_id));
    RAISE EXCEPTION 'FAIL: member could assign';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  response := public.admin_mutate_child_badge(admin_id,'assign',jsonb_build_object('childId',child_id,'badgeId',badge_id));
  assignment_id := (response->'assignedBadge'->>'assignmentId')::uuid;
  IF jsonb_array_length(response->'assignedBadge'->'skills') <> 5
     OR response ? 'assignedBadges' OR response->'assignedBadge'->>'isCompleted' <> 'false' THEN
    RAISE EXCEPTION 'FAIL: assignment response';
  END IF;
  response := public.admin_mutate_child_badge(admin_id,'assign',jsonb_build_object('childId',child_id,'badgeId',badge_id));
  IF (response->'assignedBadge'->>'assignmentId')::uuid <> assignment_id THEN
    RAISE EXCEPTION 'FAIL: duplicate assignment changed identity';
  END IF;
  BEGIN
    PERFORM public.admin_mutate_child_badge(admin_id,'tracking',jsonb_build_object('assignmentId',assignment_id,'datePaid','2026-10-07'));
    RAISE EXCEPTION 'FAIL: tracking before completion';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;
  BEGIN
    PERFORM public.admin_mutate_child_badge(admin_id,'skill',jsonb_build_object('assignmentId',assignment_id,'badgeSkillId',foreign_skill,'completed',true));
    RAISE EXCEPTION 'FAIL: wrong badge skill allowed';
  EXCEPTION WHEN no_data_found THEN NULL;
  END;
  FOREACH skill_id IN ARRAY skill_ids[1:2] LOOP
    response := public.admin_mutate_child_badge(admin_id,'skill',jsonb_build_object('assignmentId',assignment_id,'badgeSkillId',skill_id,'completed',true));
    IF response->'assignedBadge'->>'isCompleted' <> 'false' THEN
      RAISE EXCEPTION 'FAIL: completed too early';
    END IF;
  END LOOP;
  response := public.admin_mutate_child_badge(admin_id,'skill',jsonb_build_object('assignmentId',assignment_id,'badgeSkillId',skill_ids[3],'completed',true));
  IF response->'assignedBadge'->>'isCompleted' <> 'true' THEN
    RAISE EXCEPTION 'FAIL: total minus two rule changed';
  END IF;
  completed_at_before := (response->'assignedBadge'->>'completedAt')::timestamptz;
  response := public.admin_mutate_child_badge(admin_id,'skill',jsonb_build_object('assignmentId',assignment_id,'badgeSkillId',skill_ids[3],'completed',true));
  IF (response->'assignedBadge'->>'completedAt')::timestamptz IS DISTINCT FROM completed_at_before THEN
    RAISE EXCEPTION 'FAIL: retry changed completion timestamp';
  END IF;
  response := public.admin_mutate_child_badge(admin_id,'tracking',jsonb_build_object('assignmentId',assignment_id,'dateAwarded','2026-10-07','datePaid',null,'dateGiven','2026-10-07'));
  BEGIN
    PERFORM public.admin_mutate_child_badge(admin_id,'tracking',jsonb_build_object('assignmentId',assignment_id,'dateAwarded',null,'datePaid','invalid'));
    RAISE EXCEPTION 'FAIL: invalid tracking date allowed';
  EXCEPTION WHEN invalid_datetime_format THEN NULL;
  END;
  response := public.admin_mutate_child_badge(admin_id,'skill',jsonb_build_object('assignmentId',assignment_id,'badgeSkillId',skill_ids[3],'completed',false));
  IF response->'assignedBadge'->>'isCompleted' <> 'false'
     OR response->'assignedBadge'->>'completedAt' IS NOT NULL
     OR response->'assignedBadge'->>'dateAwarded' IS NULL THEN
    RAISE EXCEPTION 'FAIL: unchecking completion or atomic date validation';
  END IF;
  EXECUTE 'RESET ROLE';
  IF (SELECT count(*) FROM public.child_badge_skill_progress p WHERE p.assignment_id=assignment_id) <> 2 THEN
    RAISE EXCEPTION 'FAIL: retry or uncheck created incorrect progress';
  END IF;

  -- Force the second write to fail, only for this fixture assignment. Verify
  -- the preceding progress insertion rolls back too. Trigger DDL rolls back.
  PERFORM set_config('badge_test.assignment',assignment_id::text,true);
  EXECUTE $create$
    CREATE FUNCTION pg_temp.reject_badge_test_update() RETURNS trigger LANGUAGE plpgsql AS $body$
    BEGIN
      IF NEW.id::text = current_setting('badge_test.assignment',true) THEN
        RAISE EXCEPTION 'Injected fixture failure' USING ERRCODE='23514';
      END IF;
      RETURN NEW;
    END;
    $body$
  $create$;
  EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.child_badge_assignments FOR EACH ROW EXECUTE FUNCTION pg_temp.reject_badge_test_update()',fail_trigger);
  EXECUTE 'SET LOCAL ROLE service_role';
  BEGIN
    PERFORM public.admin_mutate_child_badge(admin_id,'skill',jsonb_build_object('assignmentId',assignment_id,'badgeSkillId',skill_ids[4],'completed',true));
    RAISE EXCEPTION 'FAIL: injected failure did not occur';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  EXECUTE 'RESET ROLE';
  IF EXISTS (SELECT 1 FROM public.child_badge_skill_progress p WHERE p.assignment_id=assignment_id AND p.badge_skill_id=skill_ids[4]) THEN
    RAISE EXCEPTION 'FAIL: partial progress survived failed assignment update';
  END IF;
  EXECUTE format('DROP TRIGGER %I ON public.child_badge_assignments',fail_trigger);
  EXECUTE 'SET LOCAL ROLE service_role';
  response := public.admin_mutate_child_badge(admin_id,'complete',jsonb_build_object('assignmentId',assignment_id));
  IF (SELECT count(*) FROM public.child_badge_skill_progress p WHERE p.assignment_id=assignment_id) <> 5
     OR response->'assignedBadge'->>'isCompleted' <> 'true' THEN
    RAISE EXCEPTION 'FAIL: mark all';
  END IF;
  response := public.admin_mutate_child_badge(admin_id,'delete',jsonb_build_object('assignmentId',assignment_id));
  IF (response->>'deletedAssignmentId')::uuid <> assignment_id OR response->'availableBadge'->>'id' <> badge_id::text
     OR EXISTS (SELECT 1 FROM public.child_badge_skill_progress p WHERE p.assignment_id=assignment_id) THEN
    RAISE EXCEPTION 'FAIL: delete cascade/response';
  END IF;
  EXECUTE 'RESET ROLE';
  DELETE FROM public.badge_skills WHERE id=foreign_skill;
  EXECUTE 'SET LOCAL ROLE service_role';
  response := public.admin_mutate_child_badge(admin_id,'assign',jsonb_build_object('childId',child_id,'badgeId',empty_badge_id));
  empty_assignment_id := (response->'assignedBadge'->>'assignmentId')::uuid;
  BEGIN
    PERFORM public.admin_mutate_child_badge(admin_id,'complete',jsonb_build_object('assignmentId',empty_assignment_id));
    RAISE EXCEPTION 'FAIL: zero-skill badge completion allowed';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;
  EXECUTE 'RESET ROLE';
END;
$$;
SELECT 'Badge transaction, permissions, completion and rollback checks passed' AS result;
