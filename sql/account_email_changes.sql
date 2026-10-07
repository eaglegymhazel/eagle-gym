-- Verified against public."Accounts", public.web_accounts and auth.users.
-- Accounts."userId" is a legacy identifier; NEVER use or rewrite it to link Auth.
-- No backfill, email matching, Auth configuration change or account reassignment.
BEGIN;

-- A linked legacy record must belong to at most one web login.
CREATE UNIQUE INDEX IF NOT EXISTS web_accounts_linked_account_unique
  ON public.web_accounts (account_id)
  WHERE account_id IS NOT NULL AND auth_user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.sync_confirmed_account_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  linked_web_id uuid;
  linked_account_id uuid;
BEGIN
  SELECT w.id, w.account_id INTO linked_web_id, linked_account_id
    FROM public.web_accounts AS w
    WHERE w.auth_user_id = NEW.id
    FOR UPDATE;

  -- Historical/mobile Auth users need not have a web account. Never create one
  -- or find a legacy account by email during confirmation.
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- A null link is valid before profile setup. A non-null link is mandatory.
  IF linked_account_id IS NOT NULL THEN
    PERFORM a.id FROM public."Accounts" AS a
      WHERE a.id = linked_account_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'The linked legacy account is missing' USING ERRCODE = '23503';
    END IF;
    UPDATE public."Accounts" SET email = NEW.email WHERE id = linked_account_id;
  END IF;

  UPDATE public.web_accounts SET email = NEW.email WHERE id = linked_web_id;
  -- Let every constraint error propagate: Auth and BOTH mirrors roll back.
  RETURN NEW;
END;
$$;
ALTER FUNCTION public.sync_confirmed_account_email() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.sync_confirmed_account_email() FROM PUBLIC, anon, authenticated, service_role;

CREATE TRIGGER sync_confirmed_account_email
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.sync_confirmed_account_email();

-- Invoker security preserves the caller identity. Only the nested Auth sync
-- running as its explicit owner may change a mirrored email, and even then
-- the value must equal auth.users.email. No spoofable session flags are used.
CREATE OR REPLACE FUNCTION public.guard_confirmed_account_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  authoritative_email text;
BEGIN
  IF TG_TABLE_NAME = 'Accounts' AND NOT EXISTS (
    SELECT 1 FROM public.web_accounts AS w
      WHERE w.account_id = OLD.id AND w.auth_user_id IS NOT NULL
  ) THEN
    RETURN NEW; -- Unlinked legacy accounts are not Auth email mirrors.
  END IF;

  IF CURRENT_USER = 'postgres' AND pg_catalog.pg_trigger_depth() = 2 THEN
    IF TG_TABLE_NAME = 'web_accounts' THEN
      SELECT u.email INTO authoritative_email FROM auth.users AS u
        WHERE u.id = NEW.auth_user_id;
    ELSE
      SELECT u.email INTO authoritative_email
        FROM public.web_accounts AS w
        JOIN auth.users AS u ON u.id = w.auth_user_id
        WHERE w.account_id = NEW.id;
    END IF;
    IF FOUND AND NEW.email IS NOT DISTINCT FROM authoritative_email THEN
      RETURN NEW;
    END IF;
  END IF;

  RAISE EXCEPTION 'Confirmed account emails must be changed through Supabase Auth'
    USING ERRCODE = '42501';
END;
$$;
ALTER FUNCTION public.guard_confirmed_account_email() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.guard_confirmed_account_email() FROM PUBLIC, anon, authenticated, service_role;

CREATE TRIGGER guard_web_account_email
  BEFORE UPDATE OF email ON public.web_accounts
  FOR EACH ROW WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.guard_confirmed_account_email();
CREATE TRIGGER guard_legacy_account_email
  BEFORE UPDATE OF email ON public."Accounts"
  FOR EACH ROW WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.guard_confirmed_account_email();

-- Authenticated status reads the database, never JWT email claims or metadata.
-- Its existence also makes the UI fail closed until this migration is applied.
CREATE OR REPLACE FUNCTION public.get_account_email_change_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_auth_id uuid := auth.uid();
  result jsonb;
BEGIN
  IF current_auth_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  SELECT pg_catalog.jsonb_build_object(
    'email', u.email,
    'pendingEmail', NULLIF(u.email_change, ''),
    'canChange', w.id IS NOT NULL AND (w.account_id IS NULL OR a.id IS NOT NULL),
    'synchronised', w.id IS NOT NULL AND w.email IS NOT DISTINCT FROM u.email
      AND (w.account_id IS NULL OR (a.id IS NOT NULL AND a.email IS NOT DISTINCT FROM u.email))
  ) INTO result
    FROM auth.users AS u
    LEFT JOIN public.web_accounts AS w ON w.auth_user_id = u.id
    LEFT JOIN public."Accounts" AS a ON a.id = w.account_id
    WHERE u.id = current_auth_id;
  IF result IS NULL THEN
    RAISE EXCEPTION 'Authenticated user missing' USING ERRCODE = '42501';
  END IF;
  RETURN result;
END;
$$;
ALTER FUNCTION public.get_account_email_change_status() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.get_account_email_change_status() FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_account_email_change_status() TO authenticated;

-- Profile creation/save must preserve links and cannot write existing emails.
-- Auth lock serialises initial email assignment with a confirmation transaction.
CREATE OR REPLACE FUNCTION public.save_linked_account_profile(p_auth_user_id uuid, p_profile jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  confirmed_email text;
  web_id uuid;
  legacy_id uuid;
  result jsonb;
BEGIN
  SELECT u.email INTO confirmed_email FROM auth.users AS u
    WHERE u.id = p_auth_user_id FOR UPDATE;
  IF NOT FOUND OR confirmed_email IS NULL THEN
    RAISE EXCEPTION 'Authenticated user email required' USING ERRCODE = '23503';
  END IF;

  SELECT w.id, w.account_id INTO web_id, legacy_id FROM public.web_accounts AS w
    WHERE w.auth_user_id = p_auth_user_id FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.web_accounts (auth_user_id, email)
      VALUES (p_auth_user_id, confirmed_email) RETURNING id INTO web_id;
  END IF;

  IF legacy_id IS NULL THEN
    INSERT INTO public."Accounts" ("userId", email)
      VALUES (p_auth_user_id::text, confirmed_email) RETURNING id INTO legacy_id;
    UPDATE public.web_accounts SET account_id = legacy_id WHERE id = web_id;
  END IF;

  UPDATE public."Accounts" SET
    "accFirstName" = p_profile->>'accFirstName',
    "accLastName" = p_profile->>'accLastName',
    "accTelNo" = p_profile->>'accTelNo',
    "accEmergencyTelNo" = p_profile->>'accEmergencyTelNo',
    "accAddress" = NULLIF(p_profile->>'accAddress', '')
  WHERE id = legacy_id
  RETURNING pg_catalog.jsonb_build_object(
    'id', id, 'email', email,
    'accFirstName', "accFirstName", 'accLastName', "accLastName",
    'accTelNo', "accTelNo", 'accEmergencyTelNo', "accEmergencyTelNo",
    'accAddress', "accAddress"
  ) INTO result;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'The linked legacy account is missing' USING ERRCODE = '23503';
  END IF;
  RETURN result;
END;
$$;
ALTER FUNCTION public.save_linked_account_profile(uuid, jsonb) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.save_linked_account_profile(uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_linked_account_profile(uuid, jsonb) TO service_role;

COMMIT;
