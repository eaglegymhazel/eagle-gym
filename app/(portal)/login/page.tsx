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
  searchParams?:
    | Promise<{ redirect?: string; verified?: string }>
    | { redirect?: string; verified?: string };
}) {
  const resolvedSearchParams = await searchParams;
  const redirectTarget = resolveRedirectTarget(resolvedSearchParams?.redirect);
  const verified =
    resolvedSearchParams?.verified === "signup"
      ? "signup"
      : undefined;

  return <LoginClient redirectTo={redirectTarget} verified={verified} />;
}
