export const PASSWORD_MIN_LEN = 7;

export const passwordRequirements = [
  {
    key: "minLen",
    label: `At least ${PASSWORD_MIN_LEN} characters`,
  },
  {
    key: "hasAlnum",
    label: "At least one letter or number",
  },
  {
    key: "hasSpecial",
    label: "At least one special character",
  },
] as const;

export function validatePassword(pw: string) {
  const minLen = pw.length >= PASSWORD_MIN_LEN;
  const hasAlnum = /[A-Za-z0-9]/.test(pw);
  const hasSpecial = /[^A-Za-z0-9]/.test(pw);
  const isValid = minLen && hasAlnum && hasSpecial;
  return {
    isValid,
    checks: { minLen, hasAlnum, hasSpecial },
  };
}
