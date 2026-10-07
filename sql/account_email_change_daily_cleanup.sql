-- Follow-up to account_email_change_expiry.sql. Reuses the existing named job.
BEGIN;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire-account-email-changes' AND username = CURRENT_USER) THEN
    RAISE EXCEPTION 'The account email cleanup job must already exist for this database role';
  END IF;
  PERFORM cron.schedule('expire-account-email-changes', '0 3 * * *', 'SELECT public.expire_pending_account_email_changes();');
END $$;
COMMIT;
