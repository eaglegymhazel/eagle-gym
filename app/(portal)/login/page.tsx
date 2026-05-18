import LoginClient from "./LoginClient";

function resolveRedirectTarget(rawRedirect: string | undefined) {
  if (!rawRedirect) return "/account";
  if (!rawRedirect.startsWith("/")) return "/account";
  if (rawRedirect.startsWith("//")) return "/account";
  return rawRedirect;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ redirect?: string }> | { redirect?: string };
}) {
  const resolvedSearchParams = await searchParams;
  const redirectTarget = resolveRedirectTarget(resolvedSearchParams?.redirect);

  return <LoginClient redirectTo={redirectTarget} />;
}
