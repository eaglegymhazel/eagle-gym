-- Read-only schema inspection: no account rows, emails, passwords or tokens.
-- Run in the Supabase Dashboard SQL Editor and export the results.
WITH targets AS (
  SELECT c.oid, n.nspname AS schema_name, c.relname AS table_name,
         c.relowner, c.relacl, c.relrowsecurity, c.relforcerowsecurity
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE (n.nspname = 'public' AND c.relname IN ('Accounts', 'web_accounts'))
     OR (n.nspname = 'auth' AND c.relname = 'users')
), report AS (
  SELECT 'tables' AS section, t.schema_name, t.table_name,
         t.table_name AS object_name,
         jsonb_build_object(
           'owner', pg_catalog.pg_get_userbyid(t.relowner),
           'acl', t.relacl::text,
           'rls_enabled', t.relrowsecurity,
           'rls_forced', t.relforcerowsecurity
         ) AS details
  FROM targets t
  UNION ALL
  SELECT 'columns', t.schema_name, t.table_name, a.attname,
         jsonb_build_object(
           'type', pg_catalog.format_type(a.atttypid, a.atttypmod),
           'not_null', a.attnotnull,
           'default', pg_catalog.pg_get_expr(d.adbin, d.adrelid),
           'identity', a.attidentity,
           'generated', a.attgenerated,
           'acl', a.attacl::text
         )
  FROM targets t
  JOIN pg_catalog.pg_attribute a ON a.attrelid = t.oid
  LEFT JOIN pg_catalog.pg_attrdef d
    ON d.adrelid = a.attrelid AND d.adnum = a.attnum
  WHERE a.attnum > 0 AND NOT a.attisdropped
    AND (t.schema_name = 'public' OR a.attname IN ('id', 'email', 'email_change', 'email_change_confirm_status'))
  UNION ALL
  SELECT 'constraints', t.schema_name, t.table_name, c.conname,
         jsonb_build_object(
           'definition', pg_catalog.pg_get_constraintdef(c.oid, true),
           'validated', c.convalidated
         )
  FROM targets t
  JOIN pg_catalog.pg_constraint c ON c.conrelid = t.oid
  UNION ALL
  SELECT 'indexes', t.schema_name, t.table_name, i.indexrelid::regclass::text,
         jsonb_build_object(
           'definition', pg_catalog.pg_get_indexdef(i.indexrelid),
           'valid', i.indisvalid
         )
  FROM targets t
  JOIN pg_catalog.pg_index i ON i.indrelid = t.oid
  UNION ALL
  SELECT 'triggers', t.schema_name, t.table_name, g.tgname,
         jsonb_build_object(
           'definition', pg_catalog.pg_get_triggerdef(g.oid, true),
           'enabled', g.tgenabled,
           'function_definition', pg_catalog.pg_get_functiondef(p.oid),
           'function_owner', pg_catalog.pg_get_userbyid(p.proowner),
           'function_security_definer', p.prosecdef,
           'function_settings', p.proconfig,
           'function_acl', p.proacl::text
         )
  FROM targets t
  JOIN pg_catalog.pg_trigger g ON g.tgrelid = t.oid
  JOIN pg_catalog.pg_proc p ON p.oid = g.tgfoid
  WHERE NOT g.tgisinternal
  UNION ALL
  SELECT 'policies', t.schema_name, t.table_name, p.policyname,
         jsonb_build_object(
           'permissive', p.permissive,
           'roles', p.roles,
           'command', p.cmd,
           'using', p.qual,
           'with_check', p.with_check
         )
  FROM targets t
  JOIN pg_catalog.pg_policies p
    ON p.schemaname = t.schema_name AND p.tablename = t.table_name
)
SELECT section, schema_name, table_name, object_name, details
FROM report
ORDER BY section, schema_name, table_name, object_name;
