-- Run against the installed expiry migration inside BEGIN / ROLLBACK only.
DO $$
DECLARE
  subject uuid := gen_random_uuid(); other_subject uuid := gen_random_uuid();
  account_id uuid := gen_random_uuid(); web_id uuid := gen_random_uuid();
  prefix text := gen_random_uuid()::text;
  old_email text; proposed_email text; sent timestamptz; result jsonb;
  recovery_id uuid := gen_random_uuid(); recovery_flow_id uuid := gen_random_uuid();
BEGIN
  old_email := prefix || '-old@example.invalid'; proposed_email := prefix || '-new@example.invalid';
  INSERT INTO auth.users(id,email,encrypted_password,email_confirmed_at) VALUES
    (subject,old_email,'preserved-password',now()),(other_subject,prefix || '-other@example.invalid','other-password',now());
  INSERT INTO public."Accounts"(id,"userId",email,"stripeCustomerId") VALUES(account_id,'preserved-legacy-id',old_email,'preserved-payment-link');
  INSERT INTO public.web_accounts(id,auth_user_id,account_id,email,role) VALUES(web_id,subject,account_id,old_email,'admin');

  -- Even if the job has not run, an expired second confirmation cannot commit.
  sent := clock_timestamp() - interval '48 hours';
  UPDATE auth.users SET email_change=proposed_email,email_change_sent_at=sent,email_change_confirm_status=1,
    email_change_token_current='',email_change_token_new=prefix || '-new-token' WHERE id=subject;
  BEGIN
    UPDATE auth.users SET email=proposed_email,email_change='',email_change_token_new='',email_change_confirm_status=0 WHERE id=subject;
    RAISE EXCEPTION 'FAIL: expired confirmation was accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
  IF (SELECT email FROM auth.users WHERE id=subject)<>old_email
    OR (SELECT email_change FROM auth.users WHERE id=subject)<>proposed_email THEN RAISE EXCEPTION 'FAIL: expired confirmation partially committed'; END IF;

  INSERT INTO auth.one_time_tokens(id,user_id,token_type,token_hash,relates_to) VALUES
    (gen_random_uuid(),subject,'email_change_token_current',prefix || '-current',old_email),
    (gen_random_uuid(),subject,'email_change_token_new',prefix || '-new',proposed_email),
    (recovery_id,subject,'recovery_token',prefix || '-recovery',old_email);
  INSERT INTO auth.flow_state(id,user_id,provider_type,authentication_method,created_at) VALUES
    (gen_random_uuid(),subject,'email','email_change',now()),(recovery_flow_id,subject,'email','recovery',now());

  -- Caller status expires immediately, including partial confirmation, and
  -- leaves recovery/signup/session and all confirmed identity data alone.
  PERFORM set_config('request.jwt.claim.sub',subject::text,true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  result := public.get_account_email_change_status();
  EXECUTE 'RESET ROLE';
  IF result->>'pendingEmail' IS NOT NULL OR result->>'pendingExpiresAt' IS NOT NULL
    OR result->>'email'<>old_email THEN RAISE EXCEPTION 'FAIL: expired pending status'; END IF;
  IF EXISTS(SELECT 1 FROM auth.one_time_tokens WHERE user_id=subject AND token_type IN ('email_change_token_current','email_change_token_new'))
    OR EXISTS(SELECT 1 FROM auth.flow_state WHERE user_id=subject AND authentication_method='email_change')
    OR NOT EXISTS(SELECT 1 FROM auth.one_time_tokens WHERE id=recovery_id)
    OR NOT EXISTS(SELECT 1 FROM auth.flow_state WHERE id=recovery_flow_id)
    OR (SELECT email_change_confirm_status FROM auth.users WHERE id=subject)<>0 THEN RAISE EXCEPTION 'FAIL: expiry token scope'; END IF;

  -- A resend starts a new 48-hour window; an old tab cannot cancel it.
  sent := clock_timestamp();
  UPDATE auth.users SET email_change=proposed_email,email_change_sent_at=sent,email_change_confirm_status=0 WHERE id=subject;
  IF public.clear_pending_account_email_change(subject) THEN RAISE EXCEPTION 'FAIL: fresh request expired'; END IF;
  result := public.get_account_email_change_status();
  IF (result->>'pendingExpiresAt')::timestamptz IS DISTINCT FROM sent + interval '48 hours' THEN RAISE EXCEPTION 'FAIL: expiry timestamp'; END IF;
  EXECUTE 'SET LOCAL ROLE authenticated';
  BEGIN
    PERFORM public.cancel_account_email_change(proposed_email,sent - interval '1 second');
    RAISE EXCEPTION 'FAIL: stale tab cancelled newer resend';
  EXCEPTION WHEN serialization_failure THEN NULL; END;
  EXECUTE 'RESET ROLE';
  IF (SELECT email_change FROM auth.users WHERE id=subject)<>proposed_email THEN RAISE EXCEPTION 'FAIL: stale cancellation changed state'; END IF;

  -- Auth.uid, never an injected user ID, owns cancellation.
  PERFORM set_config('request.jwt.claim.sub',other_subject::text,true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  PERFORM public.cancel_account_email_change(proposed_email,sent);
  EXECUTE 'RESET ROLE';
  IF (SELECT email_change FROM auth.users WHERE id=subject)<>proposed_email THEN RAISE EXCEPTION 'FAIL: cross-account cancellation'; END IF;
  PERFORM set_config('request.jwt.claim.sub',subject::text,true);
  UPDATE auth.users SET email_change_confirm_status=1 WHERE id=subject;
  EXECUTE 'SET LOCAL ROLE authenticated';
  result := public.cancel_account_email_change(proposed_email,sent);
  PERFORM public.cancel_account_email_change(proposed_email,sent);
  EXECUTE 'RESET ROLE';
  IF result->>'pendingEmail' IS NOT NULL OR result->>'email'<>old_email THEN RAISE EXCEPTION 'FAIL: partial cancellation/idempotency'; END IF;

  -- Scheduled expiry does not depend on the account being visited. Missing
  -- timestamps on historical pending requests are treated as expired.
  UPDATE auth.users SET email_change=proposed_email,email_change_sent_at=clock_timestamp()-interval '49 hours' WHERE id=subject;
  UPDATE auth.users SET email_change=prefix || '-other-new@example.invalid',email_change_sent_at=NULL WHERE id=other_subject;
  PERFORM public.expire_pending_account_email_changes();
  IF EXISTS(SELECT 1 FROM auth.users WHERE id IN(subject,other_subject) AND NULLIF(email_change,'') IS NOT NULL) THEN RAISE EXCEPTION 'FAIL: scheduled expiry'; END IF;

  -- A fresh fully confirmed change still synchronises the SAME linked rows.
  sent := clock_timestamp();
  UPDATE auth.users SET email_change=proposed_email,email_change_sent_at=sent,email_change_confirm_status=1 WHERE id=subject;
  UPDATE auth.users SET email=proposed_email,email_change='',email_change_confirm_status=0 WHERE id=subject;
  result := public.cancel_account_email_change(proposed_email,sent);
  IF result->>'email'<>proposed_email OR result->>'pendingEmail' IS NOT NULL
    OR (SELECT email FROM public."Accounts" WHERE id=account_id)<>proposed_email
    OR (SELECT email FROM public.web_accounts WHERE id=web_id)<>proposed_email
    OR (SELECT w.account_id FROM public.web_accounts w WHERE w.id=web_id) IS DISTINCT FROM account_id
    OR (SELECT role FROM public.web_accounts WHERE id=web_id)<>'admin'
    OR (SELECT "userId" FROM public."Accounts" WHERE id=account_id)<>'preserved-legacy-id'
    OR (SELECT "stripeCustomerId" FROM public."Accounts" WHERE id=account_id)<>'preserved-payment-link'
    OR (SELECT encrypted_password FROM auth.users WHERE id=subject)<>'preserved-password' THEN RAISE EXCEPTION 'FAIL: fresh confirmation/identity preservation'; END IF;

  IF has_function_privilege('authenticated','public.clear_pending_account_email_change(uuid,boolean)','EXECUTE')
    OR has_function_privilege('authenticated','public.expire_pending_account_email_changes()','EXECUTE')
    OR has_function_privilege('anon','public.cancel_account_email_change(text,timestamptz)','EXECUTE')
    OR has_function_privilege('service_role','public.cancel_account_email_change(text,timestamptz)','EXECUTE') THEN RAISE EXCEPTION 'FAIL: expiry privileges'; END IF;
  PERFORM set_config('request.jwt.claim.sub','',true);
  BEGIN
    PERFORM public.cancel_account_email_change(proposed_email,sent);
    RAISE EXCEPTION 'FAIL: anonymous cancellation';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT 'Email-change expiry/cancellation checks passed; roll back fixtures.' AS result;
