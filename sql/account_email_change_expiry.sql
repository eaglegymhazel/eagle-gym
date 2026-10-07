-- Requires account_email_changes.sql. No mirrored emails or account links change.
BEGIN;

CREATE OR REPLACE FUNCTION public.clear_pending_account_email_change(p_user_id uuid, p_force boolean DEFAULT false)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE pending auth.users%ROWTYPE;
BEGIN
  SELECT * INTO pending FROM auth.users WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND OR NULLIF(pending.email_change, '') IS NULL THEN RETURN false; END IF;
  IF NOT p_force AND pending.email_change_sent_at IS NOT NULL
    AND pending.email_change_sent_at > pg_catalog.clock_timestamp() - interval '48 hours' THEN RETURN false; END IF;
  UPDATE auth.users SET email_change = '', email_change_token_current = '',
    email_change_token_new = '', email_change_sent_at = NULL, email_change_confirm_status = 0
    WHERE id = p_user_id;
  DELETE FROM auth.one_time_tokens WHERE user_id = p_user_id
    AND token_type IN ('email_change_token_current', 'email_change_token_new');
  DELETE FROM auth.flow_state WHERE user_id = p_user_id AND authentication_method = 'email_change';
  RETURN true;
END;
$$;
ALTER FUNCTION public.clear_pending_account_email_change(uuid,boolean) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.clear_pending_account_email_change(uuid,boolean) FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_account_email_change_status()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE current_auth_id uuid := auth.uid(); result jsonb;
BEGIN
  IF current_auth_id IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501'; END IF;
  -- Only take a write lock when this caller has an expired request. Recheck
  -- under the lock so a concurrent resend/confirmation wins safely.
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = current_auth_id AND NULLIF(email_change, '') IS NOT NULL
    AND (email_change_sent_at IS NULL OR email_change_sent_at <= pg_catalog.clock_timestamp() - interval '48 hours')) THEN
    PERFORM public.clear_pending_account_email_change(current_auth_id);
  END IF;
  SELECT pg_catalog.jsonb_build_object(
    'email', u.email, 'pendingEmail', NULLIF(u.email_change, ''),
    'pendingRequestedAt', CASE WHEN NULLIF(u.email_change, '') IS NOT NULL THEN u.email_change_sent_at END,
    'pendingExpiresAt', CASE WHEN NULLIF(u.email_change, '') IS NOT NULL THEN u.email_change_sent_at + interval '48 hours' END,
    'canChange', w.id IS NOT NULL AND (w.account_id IS NULL OR a.id IS NOT NULL),
    'synchronised', w.id IS NOT NULL AND w.email IS NOT DISTINCT FROM u.email
      AND (w.account_id IS NULL OR (a.id IS NOT NULL AND a.email IS NOT DISTINCT FROM u.email))
  ) INTO result FROM auth.users u LEFT JOIN public.web_accounts w ON w.auth_user_id = u.id
    LEFT JOIN public."Accounts" a ON a.id = w.account_id WHERE u.id = current_auth_id;
  IF result IS NULL THEN RAISE EXCEPTION 'Authenticated user missing' USING ERRCODE = '42501'; END IF;
  RETURN result;
END;
$$;
ALTER FUNCTION public.get_account_email_change_status() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.get_account_email_change_status() FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_account_email_change_status() TO authenticated;

CREATE OR REPLACE FUNCTION public.cancel_account_email_change(p_expected_email text, p_expected_sent_at timestamptz)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE current_auth_id uuid := auth.uid(); pending auth.users%ROWTYPE;
BEGIN
  IF current_auth_id IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501'; END IF;
  SELECT * INTO pending FROM auth.users WHERE id = current_auth_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Authenticated user missing' USING ERRCODE = '42501'; END IF;
  IF NULLIF(pending.email_change, '') IS NOT NULL THEN
    IF p_expected_email IS DISTINCT FROM pending.email_change OR p_expected_sent_at IS DISTINCT FROM pending.email_change_sent_at THEN
      RAISE EXCEPTION 'The pending request changed. Refresh before cancelling.' USING ERRCODE = '40001';
    END IF;
    PERFORM public.clear_pending_account_email_change(current_auth_id, true);
  END IF;
  -- Idempotent after cancellation or a completed confirmation; never undo it.
  RETURN public.get_account_email_change_status();
END;
$$;
ALTER FUNCTION public.cancel_account_email_change(text,timestamptz) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.cancel_account_email_change(text,timestamptz) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.cancel_account_email_change(text,timestamptz) TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_expired_account_email_change()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NULLIF(OLD.email_change, '') IS NOT NULL AND NEW.email = OLD.email_change
    AND (OLD.email_change_sent_at IS NULL OR OLD.email_change_sent_at <= pg_catalog.clock_timestamp() - interval '48 hours') THEN
    RAISE EXCEPTION 'The email change request has expired. Request fresh confirmation emails.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
ALTER FUNCTION public.guard_expired_account_email_change() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.guard_expired_account_email_change() FROM PUBLIC, anon, authenticated, service_role;
CREATE TRIGGER guard_expired_account_email_change BEFORE UPDATE OF email ON auth.users
  FOR EACH ROW WHEN (OLD.email IS DISTINCT FROM NEW.email) EXECUTE FUNCTION public.guard_expired_account_email_change();

CREATE OR REPLACE FUNCTION public.expire_pending_account_email_changes()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE candidate record; cleared integer := 0;
BEGIN
  FOR candidate IN SELECT id FROM auth.users WHERE NULLIF(email_change, '') IS NOT NULL
    AND (email_change_sent_at IS NULL OR email_change_sent_at <= pg_catalog.clock_timestamp() - interval '48 hours')
    ORDER BY id LIMIT 1000 FOR UPDATE SKIP LOCKED LOOP
    IF public.clear_pending_account_email_change(candidate.id) THEN cleared := cleared + 1; END IF;
  END LOOP;
  RETURN cleared;
END;
$$;
ALTER FUNCTION public.expire_pending_account_email_changes() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.expire_pending_account_email_changes() FROM PUBLIC, anon, authenticated, service_role;

-- pg_cron is already enabled on the connected project. Fail rather than leave
-- unattended cleanup silently unconfigured on another project.
SELECT cron.schedule('expire-account-email-changes', '*/5 * * * *', 'SELECT public.expire_pending_account_email_changes();');
COMMIT;
