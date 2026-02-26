type AuthValidationMethod = "getUser" | "getSession";

type AuthValidationLogInput = {
  method: AuthValidationMethod;
  source: string;
  requestKey?: string;
};

function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

function getClientPageKey(): string {
  if (typeof window === "undefined") return "server:unknown";
  const page = `${window.location.pathname}${window.location.search}`;
  return `client:${page}`;
}

function getGlobalCounterMap(): Map<string, number> {
  const globalScope = globalThis as typeof globalThis & {
    __authValidationCounterMap?: Map<string, number>;
  };
  if (!globalScope.__authValidationCounterMap) {
    globalScope.__authValidationCounterMap = new Map<string, number>();
  }
  return globalScope.__authValidationCounterMap;
}

export function getServerAuthRequestKey(
  headersObj: Pick<Headers, "get">,
  fallbackPath: string
): string {
  const explicitRequestId =
    headersObj.get("x-request-id") ??
    headersObj.get("x-vercel-id") ??
    headersObj.get("cf-ray") ??
    headersObj.get("traceparent") ??
    headersObj.get("x-amzn-trace-id");
  const path =
    headersObj.get("x-matched-path") ??
    headersObj.get("next-url") ??
    fallbackPath;
  if (explicitRequestId) {
    return `server:${path}:${explicitRequestId}`;
  }

  const derivedSeed = [
    headersObj.get("host") ?? "",
    headersObj.get("user-agent") ?? "",
    headersObj.get("sec-ch-ua") ?? "",
    headersObj.get("accept-language") ?? "",
    headersObj.get("cookie")?.slice(0, 64) ?? "",
    path,
  ].join("|");

  let hash = 0;
  for (let i = 0; i < derivedSeed.length; i += 1) {
    hash = (hash * 31 + derivedSeed.charCodeAt(i)) >>> 0;
  }

  return `server:${path}:derived-${hash.toString(16)}`;
}

export function logAuthValidation(input: AuthValidationLogInput): void {
  if (!isDevelopment()) return;

  const key = input.requestKey ?? getClientPageKey();
  const counters = getGlobalCounterMap();
  const count = (counters.get(key) ?? 0) + 1;
  counters.set(key, count);

  const prefix = `[auth-debug][${key}] #${count}`;
  console.info(`${prefix} ${input.method} @ ${input.source}`);
  if (count > 1) {
    console.warn(
      `${prefix} duplicate auth validation in same request/page load`
    );
  }
}
