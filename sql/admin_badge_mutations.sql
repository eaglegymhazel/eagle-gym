-- Additive migration: old deployments keep using their existing badge queries.
BEGIN;

CREATE OR REPLACE FUNCTION public.admin_mutate_child_badge(
  p_auth_user_id uuid, p_action text, p_payload jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE
  assignment public.child_badge_assignments%ROWTYPE;
  definition public.badge_definitions%ROWTYPE;
  total_skills integer;
  completed_skills integer;
  complete boolean;
  result jsonb;
  field text;
  tracking jsonb := '{}'::jsonb;
BEGIN
  -- Only the server service role can execute this function. The server supplies
  -- the verified Auth ID; do not accept a role or Auth ID from the request body.
  IF NOT EXISTS (
    SELECT 1 FROM public.web_accounts w
    WHERE w.auth_user_id = p_auth_user_id
      AND pg_catalog.lower(pg_catalog.btrim(w.role)) = 'admin'
  ) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;
  IF p_payload IS NULL OR pg_catalog.jsonb_typeof(p_payload) <> 'object'
     OR p_action IS NULL OR p_action NOT IN ('assign', 'skill', 'complete', 'tracking', 'delete') THEN
    RAISE EXCEPTION 'Invalid badge request' USING ERRCODE = '22023';
  END IF;

  IF p_action = 'assign' THEN
    PERFORM 1 FROM public."Children" c
      WHERE c.id = (p_payload->>'childId')::uuid FOR KEY SHARE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Child not found' USING ERRCODE = 'P0002';
    END IF;
    SELECT d.* INTO definition FROM public.badge_definitions d
      WHERE d.id = (p_payload->>'badgeId')::uuid AND d.is_active FOR SHARE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Active badge not found' USING ERRCODE = 'P0002';
    END IF;
    -- Idempotent assignment; ON CONFLICT also locks an existing assignment.
    INSERT INTO public.child_badge_assignments (child_id, badge_id)
      VALUES ((p_payload->>'childId')::uuid, definition.id)
      ON CONFLICT (child_id, badge_id) DO UPDATE SET badge_id = EXCLUDED.badge_id
      RETURNING * INTO assignment;
  ELSE
    -- Serialize updates/deletes on the same assignment, including across devices.
    SELECT a.* INTO assignment FROM public.child_badge_assignments a
      WHERE a.id = (p_payload->>'assignmentId')::uuid FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Badge assignment not found' USING ERRCODE = 'P0002';
    END IF;
    SELECT d.* INTO definition FROM public.badge_definitions d WHERE d.id = assignment.badge_id;
  END IF;

  IF p_action = 'delete' THEN
    -- The verified FK cascades skill progress, inside this transaction.
    DELETE FROM public.child_badge_assignments WHERE id = assignment.id;
    RETURN pg_catalog.jsonb_build_object(
      'childId', assignment.child_id, 'deletedAssignmentId', assignment.id,
      'availableBadge', CASE WHEN definition.is_active THEN pg_catalog.jsonb_build_object(
        'id', definition.id, 'name', definition.name, 'description', definition.description,
        'category', definition.category
      ) ELSE NULL END
    );
  END IF;

  IF p_action = 'skill' THEN
    IF pg_catalog.jsonb_typeof(p_payload->'completed') IS DISTINCT FROM 'boolean' THEN
      RAISE EXCEPTION 'completed must be a boolean' USING ERRCODE = '22023';
    END IF;
    PERFORM 1 FROM public.badge_skills s
      WHERE s.id = (p_payload->>'badgeSkillId')::uuid AND s.badge_id = assignment.badge_id
      FOR KEY SHARE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Badge skill not found for this assignment' USING ERRCODE = 'P0002';
    END IF;
    IF (p_payload->>'completed')::boolean THEN
      INSERT INTO public.child_badge_skill_progress (assignment_id, badge_skill_id)
        VALUES (assignment.id, (p_payload->>'badgeSkillId')::uuid)
        ON CONFLICT (assignment_id, badge_skill_id) DO NOTHING;
    ELSE
      DELETE FROM public.child_badge_skill_progress
        WHERE assignment_id = assignment.id AND badge_skill_id = (p_payload->>'badgeSkillId')::uuid;
    END IF;
  ELSIF p_action = 'complete' THEN
    PERFORM 1 FROM public.badge_skills WHERE badge_id = assignment.badge_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'This badge has no skills to mark complete' USING ERRCODE = '22023';
    END IF;
    INSERT INTO public.child_badge_skill_progress (assignment_id, badge_skill_id)
      SELECT assignment.id, s.id FROM public.badge_skills s WHERE s.badge_id = assignment.badge_id
      ON CONFLICT (assignment_id, badge_skill_id) DO NOTHING;
  END IF;

  SELECT pg_catalog.count(*)::integer, pg_catalog.count(p.id)::integer
    INTO total_skills, completed_skills
    FROM public.badge_skills s
    LEFT JOIN public.child_badge_skill_progress p
      ON p.assignment_id = assignment.id AND p.badge_skill_id = s.id
    WHERE s.badge_id = assignment.badge_id;
  -- Preserve lib/badgeCompletion.ts: up to two unfinished skills are allowed.
  complete := total_skills > 0 AND completed_skills >= GREATEST(1, total_skills - 2);

  IF p_action = 'tracking' THEN
    IF NOT (assignment.is_completed OR complete) THEN
      RAISE EXCEPTION 'Award and payment dates can only be updated after the badge is complete'
        USING ERRCODE = '22023';
    END IF;
    FOR field IN SELECT pg_catalog.jsonb_object_keys(p_payload - 'assignmentId') LOOP
      IF field NOT IN ('dateAwarded', 'datePaid', 'dateGiven') THEN
        RAISE EXCEPTION 'Invalid tracking field' USING ERRCODE = '22023';
      END IF;
      IF pg_catalog.jsonb_typeof(p_payload->field) NOT IN ('string', 'null') THEN
        RAISE EXCEPTION 'Invalid tracking date' USING ERRCODE = '22023';
      END IF;
      -- Validate every field before writing any of them.
      tracking := tracking || pg_catalog.jsonb_build_object(field,
        NULLIF(p_payload->>field, '')::timestamptz);
    END LOOP;
    IF tracking = '{}'::jsonb THEN
      RAISE EXCEPTION 'No assignment fields were provided to update' USING ERRCODE = '22023';
    END IF;
    UPDATE public.child_badge_assignments SET
      is_completed = true,
      completed_at = COALESCE(completed_at, pg_catalog.now()),
      date_awarded = CASE WHEN tracking ? 'dateAwarded' THEN (tracking->>'dateAwarded')::timestamptz ELSE date_awarded END,
      date_paid = CASE WHEN tracking ? 'datePaid' THEN (tracking->>'datePaid')::timestamptz ELSE date_paid END,
      date_given = CASE WHEN tracking ? 'dateGiven' THEN (tracking->>'dateGiven')::timestamptz ELSE date_given END
      WHERE id = assignment.id RETURNING * INTO assignment;
  ELSIF p_action IN ('skill', 'complete') THEN
    UPDATE public.child_badge_assignments SET
      is_completed = complete,
      completed_at = CASE WHEN complete THEN COALESCE(completed_at, pg_catalog.now()) ELSE NULL END
      WHERE id = assignment.id RETURNING * INTO assignment;
  END IF;

  -- Return only the affected badge, with authoritative timestamps and progress.
  SELECT COALESCE(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'id', s.id, 'name', s.name, 'description', s.description, 'sortOrder', s.sort_order,
    'completedAt', p.completed_at
  ) ORDER BY s.sort_order, s.name, s.id), '[]'::jsonb) INTO result
    FROM public.badge_skills s LEFT JOIN public.child_badge_skill_progress p
      ON p.assignment_id = assignment.id AND p.badge_skill_id = s.id
    WHERE s.badge_id = assignment.badge_id;
  RETURN pg_catalog.jsonb_build_object('childId', assignment.child_id, 'assignedBadge',
    pg_catalog.jsonb_build_object(
      'assignmentId', assignment.id, 'badgeId', definition.id, 'name', definition.name,
      'description', definition.description, 'category', definition.category,
      'isCompleted', assignment.is_completed OR complete, 'completedAt', assignment.completed_at,
      'dateAwarded', assignment.date_awarded, 'datePaid', assignment.date_paid,
      'dateGiven', assignment.date_given, 'skills', result
    )
  );
END;
$$;

ALTER FUNCTION public.admin_mutate_child_badge(uuid, text, jsonb) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.admin_mutate_child_badge(uuid, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_mutate_child_badge(uuid, text, jsonb) TO service_role;
COMMENT ON FUNCTION public.admin_mutate_child_badge(uuid, text, jsonb)
  IS 'Server-only, admin-checked, atomic badge mutations serialized by assignment ID.';

NOTIFY pgrst, 'reload schema';

COMMIT;
