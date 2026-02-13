"use client";

import { useEffect, useMemo, useState } from "react";
import {
  passwordRequirements,
  validatePassword,
} from "@/lib/passwordPolicy";

type PasswordFieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  showRequirements?: boolean;
  onValidityChange?: (isValid: boolean) => void;
  placeholder?: string;
};

export default function PasswordField({
  label,
  name,
  value,
  onChange,
  autoComplete = "new-password",
  showRequirements = true,
  onValidityChange,
  placeholder,
}: PasswordFieldProps) {
  const [show, setShow] = useState(false);
  const [touched, setTouched] = useState(false);

  const validation = useMemo(() => validatePassword(value), [value]);
  const showFeedback = touched || value.length > 0;

  useEffect(() => {
    onValidityChange?.(validation.isValid);
  }, [onValidityChange, validation.isValid]);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-bold text-[#2E2A33]" htmlFor={name}>
        {label}
      </label>
      <div className="relative">
        <input
          id={name}
          name={name}
          className="w-full rounded-2xl border border-[#cfc6de] bg-white px-4 py-3 pr-12 text-sm text-[#2E2A33] placeholder:text-[#2E2A33]/45 transition duration-200 focus:border-[#6c35c3]/60 focus:outline-none focus:ring-2 focus:ring-[#6c35c3]/25"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          type={show ? "text" : "password"}
          onBlur={() => setTouched(true)}
          onFocus={() => setTouched(true)}
          aria-invalid={showFeedback && !validation.isValid}
        />
        <button
          type="button"
          onClick={() => setShow((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#5b5264] transition hover:text-[#2E2A33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3]/35"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? (
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17.94 17.94A10.94 10.94 0 0112 20C7 20 2.73 16.89 1 12c.73-2.03 2.07-3.8 3.86-5.1M9.9 4.24A10.87 10.87 0 0112 4c5 0 9.27 3.11 11 8a11.05 11.05 0 01-2.51 4.06M14.12 14.12a3 3 0 01-4.24-4.24" />
              <path d="M1 1l22 22" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>

      {showRequirements && showFeedback ? (
        <div className="space-y-1 text-xs text-[#2E2A33]/70">
          {passwordRequirements.map((req) => {
            const passed = validation.checks[req.key];
            return (
              <div key={req.key} className="flex items-center gap-2">
                <span
                  className={[
                    "h-1.5 w-1.5 rounded-full",
                    passed ? "bg-emerald-500" : "bg-rose-400",
                  ].join(" ")}
                  aria-hidden="true"
                />
                <span className={passed ? "text-[#2E2A33]" : ""}>
                  {req.label}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}

      {showFeedback && !validation.isValid ? (
        <p className="text-xs text-rose-600">
          Password doesn&apos;t meet requirements.
        </p>
      ) : null}
    </div>
  );
}
