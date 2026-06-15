export const SITE_GATE_COOKIE = "eagle_site_access";

const ACCESS_MESSAGE = "eagle-gym-site-gate-access-v1";

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function createSignature(value: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return toHex(
    await crypto.subtle.sign("HMAC", key, encoder.encode(value))
  );
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;

  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export function isSiteGateEnabled(): boolean {
  return process.env.SITE_GATE_ENABLED?.trim().toLowerCase() === "true";
}

export function hasSiteGateConfiguration(): boolean {
  return !!(
    process.env.SITE_GATE_PASSWORD?.trim() &&
    process.env.SITE_GATE_SECRET?.trim()
  );
}

export async function createSiteGateToken(): Promise<string | null> {
  const secret = process.env.SITE_GATE_SECRET?.trim();
  if (!secret) return null;
  return createSignature(ACCESS_MESSAGE, secret);
}

export async function isValidSiteGateToken(
  token: string | undefined
): Promise<boolean> {
  if (!token) return false;
  const expectedToken = await createSiteGateToken();
  return !!expectedToken && constantTimeEqual(token, expectedToken);
}

export async function isValidSiteGatePassword(
  password: string
): Promise<boolean> {
  const expectedPassword = process.env.SITE_GATE_PASSWORD?.trim();
  const secret = process.env.SITE_GATE_SECRET?.trim();
  if (!expectedPassword || !secret) return false;

  const [candidateSignature, expectedSignature] = await Promise.all([
    createSignature(password, secret),
    createSignature(expectedPassword, secret),
  ]);
  return constantTimeEqual(candidateSignature, expectedSignature);
}
