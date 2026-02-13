"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
} from "libphonenumber-js";

type Country = { code: string; name: string };

const COUNTRIES: Country[] = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },
  { code: "IE", name: "Ireland" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "CH", name: "Switzerland" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "ZA", name: "South Africa" },
  { code: "IN", name: "India" },
];

const PRIMARY_COUNTRIES = COUNTRIES.slice(0, 12);

type InternationalPhoneFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  name: string;
  placeholder?: string;
  onBlur?: () => void;
};

export default function InternationalPhoneField({
  label,
  value,
  onChange,
  error,
  required,
  name,
  placeholder = "+1 213 373 4253",
  onBlur,
}: InternationalPhoneFieldProps) {
  const [country, setCountry] = useState<string>("US");
  const [national, setNational] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!value) {
      return;
    }
    if (value.startsWith("+")) {
      const phone = parsePhoneNumberFromString(value);
      if (phone?.country) {
        setCountry(phone.country);
        setNational(phone.nationalNumber);
      }
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const countries = useMemo(() => {
    const list = expanded ? COUNTRIES : PRIMARY_COUNTRIES;
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        `+${getCountryCallingCode(c.code)}`.includes(q)
    );
  }, [expanded, query]);

  const callingCode = getCountryCallingCode(country as any);

  const handleNationalChange = (next: string) => {
    const cleaned = next.replace(/[^\d\s()-]/g, "");
    setNational(cleaned);

    const digits = cleaned.replace(/\D/g, "");
    if (!digits) {
      onChange("");
      return;
    }
    const candidate = `+${callingCode}${digits}`;
    if (isValidPhoneNumber(candidate)) {
      onChange(candidate);
    } else {
      onChange("");
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text").trim();
    if (pasted.startsWith("+")) {
      const phone = parsePhoneNumberFromString(pasted);
      if (phone?.country && phone.isValid()) {
        setCountry(phone.country);
        setNational(phone.nationalNumber);
        onChange(phone.number);
        event.preventDefault();
      }
    }
  };

  return (
    <div className="flex flex-col">
      <label htmlFor={name}>
        {label}
        {required ? <span className="ml-1 text-rose-600">*</span> : null}
      </label>
      <div
        ref={containerRef}
        className={[
          "relative flex items-center w-full rounded-xl border bg-white px-3 h-12 transition duration-200",
          error
            ? "border-rose-500 focus-within:ring-2 focus-within:ring-rose-300"
            : "border-slate-200 focus-within:ring-2 focus-within:ring-purple-400 focus-within:border-purple-400",
        ].join(" ")}
      >
        <button
          type="button"
          className="flex w-24 h-10 items-center justify-between rounded-lg px-2 text-sm text-slate-900 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
          onClick={() => setOpen((prev) => !prev)}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span>+{callingCode}</span>
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 text-slate-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <div className="mx-2 h-6 w-px bg-slate-200" />
        <input
          id={name}
          name={name}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          className="flex-1 h-10 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
          placeholder={placeholder}
          value={national}
          onChange={(event) => handleNationalChange(event.target.value)}
          onPaste={handlePaste}
          onBlur={onBlur}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
        />

        {open ? (
          <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-slate-200 bg-white shadow-lg">
            <div className="p-2">
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
                placeholder="Search country"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="max-h-64 overflow-auto">
              {countries.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  className="flex w-full items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => {
                    setCountry(item.code);
                    setOpen(false);
                  }}
                >
                  <span>{item.name}</span>
                  <span className="text-slate-500">
                    +{getCountryCallingCode(item.code)}
                  </span>
                </button>
              ))}
              {!expanded ? (
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-purple-600 hover:bg-slate-50"
                  onClick={() => setExpanded(true)}
                >
                  More…
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
      {error ? (
        <p id={`${name}-error`} className="mt-1 text-xs leading-4 text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
