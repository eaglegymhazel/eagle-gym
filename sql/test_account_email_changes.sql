-- Run in a transaction against the installed migration, or together with its
-- body before deployment. Always end with ROLLBACK to remove test fixtures.
DO $$
DECLARE
  user_id uuid := gen_random_uuid();
  other_user_id uuid := gen_random_uuid();
  no_legacy_user_id uuid := gen_random_uuid();
  no_web_user_id uuid := gen_random_uuid();
  legacy_id uuid := gen_random_uuid();
  other_legacy_id uuid := gen_random_uuid();
  web_id uuid := gen_random_uuid();
  prefix text := gen_random_uuid()::text;
  old_email text;
  new_email text;
  duplicate_email text;
  profile jsonb := '{"accFirstName":"Test","accLastName":"Parent","accTelNo":"123","accEmergencyTelNo":"456","accAddress":"Example"}';
  legacy_identity text := gen_random_uuid()::text;
BEGIN
  old_email := prefix || '-old@example.invalid';
  new_email := prefix || '-new@example.invalid';
  duplicate_email := prefix || '-duplicate@example.invalid';
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
    VALUES (user_id, old_email, 'unchanged-password-hash', now()),
           (other_user_id, prefix || '-other@example.invalid', 'other-password', now()),
           (no_legacy_user_id, prefix || '-optional@example.invalid', 'optional-password', now()),
           (no_web_user_id, prefix || '-auth-only@example.invalid', 'auth-only-password', now());
  INSERT INTO public."Accounts" (id, "userId", email, "stripeCustomerId", "stripeCustomerIdCompetition")
    VALUES (legacy_id, legacy_identity, old_email, 'unchanged-rec-customer', 'unchanged-comp-customer'),
           (other_legacy_id, 'other-legacy-identity', duplicate_email, NULL, NULL);
  INSERT INTO public.web_accounts (id, auth_user_id, email, account_id, role)
    VALUES (web_id, user_id, old_email, legacy_id, 'admin'),
           (gen_random_uuid(), no_legacy_user_id, prefix || '-optional@example.invalid', NULL, 'member');

  -- Pending and first confirmation do not update ANY active email.
  UPDATE auth.users SET email_change = new_email, email_change_confirm_status = 0 WHERE id = user_id;
  UPDATE auth.users SET email_change_confirm_status = 1 WHERE id = user_id;
  IF (SELECT email FROM auth.users WHERE id=user_id) IS DISTINCT FROM old_email
     OR (SELECT email FROM public.web_accounts WHERE id=web_id) IS DISTINCT FROM old_email
     OR (SELECT email FROM public."Accounts" WHERE id=legacy_id) IS DISTINCT FROM old_email THEN
    RAISE EXCEPTION 'FAIL: pending/partial confirmation changed active emails';
  END IF;

  -- A normal profile save cannot change any mirrored email, user ID or link.
  EXECUTE 'SET LOCAL ROLE service_role';
  PERFORM public.save_linked_account_profile(user_id, profile || '{"email":"injected@example.invalid","userId":"injected"}');
  EXECUTE 'RESET ROLE';
  IF (SELECT email FROM public."Accounts" WHERE id=legacy_id) IS DISTINCT FROM old_email
     OR (SELECT "userId" FROM public."Accounts" WHERE id=legacy_id) IS DISTINCT FROM legacy_identity
     OR (SELECT account_id FROM public.web_accounts WHERE id=web_id) IS DISTINCT FROM legacy_id THEN
    RAISE EXCEPTION 'FAIL: profile save changed identity';
  END IF;
  BEGIN
    UPDATE public."Accounts" SET email=new_email WHERE id=legacy_id;
    RAISE EXCEPTION 'FAIL: direct legacy email edit was allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    UPDATE public.web_accounts SET email=new_email WHERE id=web_id;
    RAISE EXCEPTION 'FAIL: direct web email edit was allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  -- Full confirmation commits the Auth email and both mirrors together.
  UPDATE auth.users SET email=new_email, email_change='', email_change_confirm_status=0 WHERE id=user_id;
  IF (SELECT email FROM public.web_accounts WHERE id=web_id) IS DISTINCT FROM new_email
     OR (SELECT email FROM public."Accounts" WHERE id=legacy_id) IS DISTINCT FROM new_email
     OR (SELECT encrypted_password FROM auth.users WHERE id=user_id) <> 'unchanged-password-hash'
     OR (SELECT role FROM public.web_accounts WHERE id=web_id) <> 'admin'
     OR (SELECT "userId" FROM public."Accounts" WHERE id=legacy_id) <> legacy_identity
     OR (SELECT "stripeCustomerId" FROM public."Accounts" WHERE id=legacy_id) <> 'unchanged-rec-customer'
     OR (SELECT "stripeCustomerIdCompetition" FROM public."Accounts" WHERE id=legacy_id) <> 'unchanged-comp-customer' THEN
    RAISE EXCEPTION 'FAIL: full sync or preserved relationships';
  END IF;

  -- A legacy uniqueness failure rolls back Auth and the web mirror too.
  BEGIN
    UPDATE auth.users SET email=upper(duplicate_email) WHERE id=user_id;
    RAISE EXCEPTION 'FAIL: legacy duplicate accepted';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  IF (SELECT email FROM auth.users WHERE id=user_id) IS DISTINCT FROM new_email
     OR (SELECT email FROM public.web_accounts WHERE id=web_id) IS DISTINCT FROM new_email
     OR (SELECT email FROM public."Accounts" WHERE id=legacy_id) IS DISTINCT FROM new_email THEN
    RAISE EXCEPTION 'FAIL: legacy duplicate left partial updates';
  END IF;

  -- A web uniqueness failure after the legacy update must roll back everything.
  INSERT INTO public.web_accounts (email) VALUES (prefix || '-web-duplicate@example.invalid');
  BEGIN
    UPDATE auth.users SET email=prefix || '-web-duplicate@example.invalid' WHERE id=user_id;
    RAISE EXCEPTION 'FAIL: web duplicate accepted';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  IF (SELECT email FROM auth.users WHERE id=user_id) IS DISTINCT FROM new_email
     OR (SELECT email FROM public.web_accounts WHERE id=web_id) IS DISTINCT FROM new_email
     OR (SELECT email FROM public."Accounts" WHERE id=legacy_id) IS DISTINCT FROM new_email THEN
    RAISE EXCEPTION 'FAIL: web duplicate left partial updates';
  END IF;

  -- A required linked record cannot disappear (existing FK).
  BEGIN
    DELETE FROM public."Accounts" WHERE id=legacy_id;
    RAISE EXCEPTION 'FAIL: mandatory legacy record removed';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO public.web_accounts (auth_user_id, account_id)
      VALUES (other_user_id, legacy_id);
    RAISE EXCEPTION 'FAIL: shared legacy account link allowed';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;

  -- Optional links stay optional; no accounts are created/matched by sync.
  UPDATE auth.users SET email=prefix || '-optional-new@example.invalid' WHERE id=no_legacy_user_id;
  IF (SELECT email FROM public.web_accounts WHERE auth_user_id=no_legacy_user_id)
       IS DISTINCT FROM prefix || '-optional-new@example.invalid'
     OR (SELECT account_id FROM public.web_accounts WHERE auth_user_id=no_legacy_user_id) IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL: optional legacy link';
  END IF;
  UPDATE auth.users SET email=prefix || '-auth-only-new@example.invalid' WHERE id=no_web_user_id;
  IF EXISTS (SELECT 1 FROM public.web_accounts WHERE auth_user_id=no_web_user_id) THEN
    RAISE EXCEPTION 'FAIL: Auth-only sync created an account';
  END IF;

  -- Onboarding must not attach an existing legacy account by matching email.
  UPDATE auth.users SET email=duplicate_email WHERE id=other_user_id;
  BEGIN
    PERFORM public.save_linked_account_profile(other_user_id, profile);
    RAISE EXCEPTION 'FAIL: duplicate legacy account matched/created by onboarding';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  IF EXISTS (SELECT 1 FROM public.web_accounts WHERE auth_user_id=other_user_id) THEN
    RAISE EXCEPTION 'FAIL: profile creation left a partial web account';
  END IF;

  -- Account status reads authoritative values using the caller's stable ID.
  PERFORM set_config('request.jwt.claim.sub', user_id::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  IF public.get_account_email_change_status()->>'email' <> new_email
     OR NOT (public.get_account_email_change_status()->>'synchronised')::boolean THEN
    RAISE EXCEPTION 'FAIL: status read';
  END IF;
  EXECUTE 'RESET ROLE';
  PERFORM set_config('request.jwt.claim.sub', '', true);
  BEGIN
    PERFORM public.get_account_email_change_status();
    RAISE EXCEPTION 'FAIL: anonymous status read';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  IF has_function_privilege('authenticated', 'public.save_linked_account_profile(uuid,jsonb)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.sync_confirmed_account_email()', 'EXECUTE')
     OR has_function_privilege('anon', 'public.get_account_email_change_status()', 'EXECUTE') THEN
    RAISE EXCEPTION 'FAIL: function grants';
  END IF;
END;
$$;
SELECT 'Account email database checks passed; test transaction must be rolled back.' AS result;
