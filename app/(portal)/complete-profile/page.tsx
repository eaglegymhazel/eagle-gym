"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { isValidPhoneNumber } from "libphonenumber-js";
import InternationalPhoneField from "@/app/components/forms/InternationalPhoneField";

const schema = z.object({
  accFirstName: z.string().min(1, { message: "First name is required." }),
  accLastName: z.string().min(1, { message: "Last name is required." }),
  accTelNo: z.string().min(1, { message: "Phone number is required." }),
  accEmergencyTelNo: z
    .string()
    .min(1, { message: "Emergency phone number is required." }),
  accAddressLine1: z
    .string()
    .trim()
    .min(1, { message: "Address Line 1 is required." }),
  accAddressLine2: z.string().trim().optional(),
  accTownCity: z
    .string()
    .trim()
    .min(1, { message: "Town / City is required." })
    .refine((value) => /^[A-Za-z ]+$/.test(value), {
      message: "Town / City must contain letters and spaces only.",
    }),
  accPostCode: z
    .string()
    .trim()
    .min(1, { message: "Post Code is required and must be alphanumeric." })
    .refine((value) => /^[A-Za-z0-9]{3}\s?[A-Za-z0-9]{0,4}$/.test(value), {
      message: "Post Code is required and must be alphanumeric.",
    }),
});

type CountrySelectProps = {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
};

function CountrySelect({
  value,
  onChange,
  disabled,
  className,
}: CountrySelectProps) {
  return (
    <select
      className={
        className ??
        "min-w-[170px] bg-transparent text-sm text-[#2E2A33] focus:outline-none"
      }
      value={value ?? ""}
      onChange={(event) => onChange?.(event.target.value)}
      disabled={disabled}
      aria-label="Country"
    >
      <option value="" disabled>
        Select country
      </option>
      {getCountries().map((country) => (
        <option key={country} value={country}>
          {en[country] ?? country} (+{getCountryCallingCode(country)})
        </option>
      ))}
    </select>
  );
}

const PhoneTextInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function PhoneTextInput(props, ref) {
    return <input ref={ref} {...props} />;
  }
);

type FormValues = z.infer<typeof schema>;

export default function CompleteProfilePage() {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [firstNameInvalid, setFirstNameInvalid] = useState(false);
  const [lastNameInvalid, setLastNameInvalid] = useState(false);
  const [telTouched, setTelTouched] = useState(false);
  const [emergencyTouched, setEmergencyTouched] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
    setError,
    clearErrors,
    setValue,
    watch,
    control,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      accFirstName: "",
      accLastName: "",
      accTelNo: "",
      accEmergencyTelNo: "",
      accAddressLine1: "",
      accAddressLine2: "",
      accTownCity: "",
      accPostCode: "",
    },
  });

  useEffect(() => {
    let active = true;
    const run = async () => {
      const res = await fetch("/api/account/bootstrap", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ includeChildDetails: false }),
      });
      if (!active) return;
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      const data = await res.json();
      if (data?.status === "existing") {
        router.replace("/account");
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [router]);

  const onValidSubmit = (values: FormValues) => {
    setSubmitAttempted(true);
    setSubmitError(false);
    validatePhone(values.accTelNo, "accTelNo");
    validatePhone(values.accEmergencyTelNo, "accEmergencyTelNo");
    if (
      !values.accTelNo ||
      !values.accEmergencyTelNo ||
      !isValidPhoneNumber(values.accTelNo) ||
      !isValidPhoneNumber(values.accEmergencyTelNo)
    ) {
      setSubmitError(true);
      return;
    }
    const addressParts = [
      values.accAddressLine1,
      values.accAddressLine2,
      values.accTownCity,
      values.accPostCode,
    ].filter((part) => part && part.trim().length > 0);
    const payload = {
      accFirstName: values.accFirstName,
      accLastName: values.accLastName,
      accTelNo: values.accTelNo,
      accEmergencyTelNo: values.accEmergencyTelNo,
      accAddress: addressParts.join(", "),
    };
    console.log(payload);
    setSaved(true);
  };

  const onInvalidSubmit = () => {
    setSubmitAttempted(true);
    setSubmitError(true);
    setSaved(false);
  };

  const onSubmit = handleSubmit(onValidSubmit, onInvalidSubmit);

  const phoneInputClass =
    "w-full rounded-xl border border-[#cfc6de] bg-white px-4 py-3.5 text-sm text-[#2E2A33] placeholder:text-[#2E2A33]/55 transition duration-200 focus:border-[#6c35c3]/60 focus:outline-none focus:ring-2 focus:ring-[#6c35c3]/25";

  const validatePhone = (
    value: string,
    field: "accTelNo" | "accEmergencyTelNo"
  ) => {
    if (!value) return;
    if (!isValidPhoneNumber(value)) {
      setError(field, {
        type: "manual",
        message: "Enter a valid phone number including country code.",
      });
      return;
    }
    clearErrors(field);
  };

  const inputClass = (isInvalid: boolean) =>
    [
      phoneInputClass,
      isInvalid ? "border-rose-500 focus:border-rose-500 focus:ring-rose-200" : "",
    ].join(" ");

  const accFirstName = watch("accFirstName");
  const accLastName = watch("accLastName");
  const accTelNo = watch("accTelNo");
  const accEmergencyTelNo = watch("accEmergencyTelNo");
  const accAddressLine1 = watch("accAddressLine1");
  const accAddressLine2 = watch("accAddressLine2");
  const accTownCity = watch("accTownCity");
  const accPostCode = watch("accPostCode");

  const telHasError =
    !!errors.accTelNo?.message &&
    !errors.accTelNo.message.toLowerCase().includes("required");
  const emergencyHasError =
    !!errors.accEmergencyTelNo?.message &&
    !errors.accEmergencyTelNo.message.toLowerCase().includes("required");

  return (
    <section className="complete-profile w-full bg-[#faf7fb] px-4 pb-20 pt-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-2 h-1 w-16 rounded-full bg-[#6c35c3] shadow-[0_6px_14px_rgba(108,53,195,0.25)]" />
          <h1 className="text-3xl font-black tracking-tight text-[#1f1a25] sm:text-4xl">
            Complete your profile
          </h1>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#e1d7ee] bg-white shadow-[0_18px_42px_rgba(22,12,47,0.1)]">
          <div className="grid grid-cols-1 md:grid-cols-[0.28fr_0.72fr]">
            <aside className="relative min-h-[220px] bg-gradient-to-br from-[#5e2eb0] via-[#5530a8] to-[#3a1f7a] px-6 py-11 !text-white sm:px-8 md:px-10 after:pointer-events-none after:absolute after:inset-0 after:bg-black/16">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.32),transparent_52%),radial-gradient(circle_at_85%_12%,rgba(255,255,255,0.12),transparent_40%),radial-gradient(circle_at_70%_75%,rgba(0,0,0,0.2),transparent_55%)]" />
              <div className="absolute inset-0 opacity-28 mix-blend-overlay" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22%3E%3Cfilter id=%22n%22 x=%220%22 y=%220%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%221%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%2260%22 height=%2260%22 filter=%22url(%23n)%22 opacity=%220.2%22/%3E%3C/svg%3E')" }} />
              <div className="relative z-10 flex h-full flex-col">
                <div className="text-white">
                  <span className="text-base font-semibold uppercase tracking-[0.28em] !text-white/85">
                    Profile setup
                  </span>
                  <p className="mt-6 text-base font-medium leading-relaxed !text-white/85">
                    To help us create a safe, supportive environment for your child, we need a few important details from you.
                  </p>
                  <p className="mt-4 text-base font-medium leading-relaxed !text-white/85">
                    This information enables us to manage class bookings accurately, maintain up-to-date parent and child records, and contact you promptly if necessary.
                  </p>
                </div>
              </div>
            </aside>

            <div className="px-6 py-8 sm:px-8 lg:px-10">
              <form
                className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2"
                onSubmit={onSubmit}
              >
                <div className="md:col-span-1">
                  <label>First name</label>
                  <input
                    className={inputClass(
                      (submitAttempted && !accFirstName) || !!errors.accFirstName
                    )}
                    {...register("accFirstName", {
                      onChange: (event) => {
                        const raw = event.target.value as string;
                        const cleaned = raw.replace(/[^a-zA-Z]/g, "");
                        setValue("accFirstName", cleaned, {
                          shouldValidate: false,
                          shouldDirty: true,
                          shouldTouch: true,
                        });
                        setFirstNameInvalid(cleaned !== raw);
                      },
                    })}
                    placeholder="First name"
                    autoComplete="given-name"
                  />
                  {firstNameInvalid && (
                    <p className="mt-1 text-xs leading-4 !text-rose-600">
                      *Name can only contain letters.
                    </p>
                  )}
                  {errors.accFirstName?.message &&
                  !errors.accFirstName.message.toLowerCase().includes("required") ? (
                    <p className="mt-1 text-xs leading-4 text-rose-600">
                      {errors.accFirstName.message}
                    </p>
                  ) : null}
                </div>

                <div className="md:col-span-1">
                  <label>Last name</label>
                  <input
                    className={inputClass(
                      (submitAttempted && !accLastName) || !!errors.accLastName
                    )}
                    {...register("accLastName", {
                      onChange: (event) => {
                        const raw = event.target.value as string;
                        const cleaned = raw.replace(/[^a-zA-Z]/g, "");
                        setValue("accLastName", cleaned, {
                          shouldValidate: false,
                          shouldDirty: true,
                          shouldTouch: true,
                        });
                        setLastNameInvalid(cleaned !== raw);
                      },
                    })}
                    placeholder="Last name"
                    autoComplete="family-name"
                  />
                  {lastNameInvalid && (
                    <p className="mt-1 text-xs leading-4 !text-rose-600">
                      *Name can only contain letters.
                    </p>
                  )}
                  {errors.accLastName?.message &&
                  !errors.accLastName.message.toLowerCase().includes("required") ? (
                    <p className="mt-1 text-xs leading-4 text-rose-600">
                      {errors.accLastName.message}
                    </p>
                  ) : null}
                </div>

                <div className="md:col-span-1">
                  <Controller
                    control={control}
                    name="accTelNo"
                    render={({ field }) => (
                      <InternationalPhoneField
                        label="Phone number"
                        name="accTelNo"
                        value={field.value ?? ""}
                        onChange={(nextValue) => {
                          field.onChange(nextValue);
                          if (submitAttempted || telTouched) {
                            validatePhone(nextValue, "accTelNo");
                          }
                        }}
                        onBlur={() => {
                          setTelTouched(true);
                          if (!field.value) {
                            setError("accTelNo", {
                              type: "manual",
                              message:
                                "Enter a valid phone number including country code.",
                            });
                            return;
                          }
                          validatePhone(field.value ?? "", "accTelNo");
                        }}
                        error={
                          telHasError || (submitAttempted && !field.value)
                            ? errors.accTelNo?.message ??
                              "Enter a valid phone number including country code."
                            : undefined
                        }
                      />
                    )}
                  />
                </div>

                <div className="md:col-span-1">
                  <Controller
                    control={control}
                    name="accEmergencyTelNo"
                    render={({ field }) => (
                      <InternationalPhoneField
                        label="Emergency phone number"
                        name="accEmergencyTelNo"
                        value={field.value ?? ""}
                        onChange={(nextValue) => {
                          field.onChange(nextValue);
                          if (submitAttempted || emergencyTouched) {
                            validatePhone(nextValue, "accEmergencyTelNo");
                          }
                        }}
                        onBlur={() => {
                          setEmergencyTouched(true);
                          if (!field.value) {
                            setError("accEmergencyTelNo", {
                              type: "manual",
                              message:
                                "Enter a valid phone number including country code.",
                            });
                            return;
                          }
                          validatePhone(
                            field.value ?? "",
                            "accEmergencyTelNo"
                          );
                        }}
                        error={
                          emergencyHasError || (submitAttempted && !field.value)
                            ? errors.accEmergencyTelNo?.message ??
                              "Enter a valid phone number including country code."
                            : undefined
                        }
                      />
                    )}
                  />
                </div>

                <div className="md:col-span-2 mt-2">
                  <label>Address Line 1 (House number + Street)</label>
                  <input
                    className={inputClass(
                      (submitAttempted && !accAddressLine1) ||
                        !!errors.accAddressLine1
                    )}
                    {...register("accAddressLine1")}
                    placeholder="House number and street"
                    autoComplete="address-line1"
                  />
                  {errors.accAddressLine1?.message &&
                  !errors.accAddressLine1.message
                    .toLowerCase()
                    .includes("required") ? (
                    <p className="mt-1 text-xs leading-4 text-rose-600">
                      {errors.accAddressLine1.message}
                    </p>
                  ) : null}
                </div>

                <div className="md:col-span-2">
                  <label>Address Line 2 (Apartment, unit, floor, suite — optional)</label>
                  <input
                    className={inputClass(false)}
                    {...register("accAddressLine2")}
                    placeholder="Apartment, unit, floor, suite"
                    autoComplete="address-line2"
                  />
                </div>

                <div className="md:col-span-1 mt-1">
                  <label>Town / City</label>
                  <input
                    className={inputClass(
                      (submitAttempted && !accTownCity) || !!errors.accTownCity
                    )}
                    {...register("accTownCity")}
                    placeholder="Town or city"
                    autoComplete="address-level2"
                  />
                  {errors.accTownCity?.message &&
                  !errors.accTownCity.message.toLowerCase().includes("required") ? (
                    <p className="mt-1 text-xs leading-4 text-rose-600">
                      {errors.accTownCity.message}
                    </p>
                  ) : null}
                </div>

                <div className="md:col-span-1">
                  <label>Post Code</label>
                  <input
                    className={inputClass(
                      (submitAttempted && !accPostCode) || !!errors.accPostCode
                    )}
                    {...register("accPostCode")}
                    placeholder="A65 F4E2"
                    autoComplete="postal-code"
                  />
                  {errors.accPostCode?.message &&
                  !errors.accPostCode.message.toLowerCase().includes("required") ? (
                    <p className="mt-1 text-xs leading-4 text-rose-600">
                      {errors.accPostCode.message}
                    </p>
                  ) : null}
                </div>

            <button
              type="submit"
              className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-b from-[#6f3bc9] via-[#6c35c3] to-[#5f2eb6] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] !text-white shadow-[0_3px_8px_rgba(108,53,195,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:from-[#6a35c1] hover:via-[#6030b8] hover:to-[#5529a6] hover:shadow-[0_4px_10px_rgba(108,53,195,0.18)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3]/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
              aria-disabled={
                !isValid ||
                isSubmitting ||
                !accFirstName ||
                !accLastName ||
                !accTelNo ||
                !accEmergencyTelNo ||
                !accAddressLine1 ||
                !accTownCity ||
                !accPostCode ||
                !!errors.accFirstName ||
                !!errors.accLastName ||
                !!errors.accTelNo ||
                !!errors.accEmergencyTelNo ||
                !!errors.accAddressLine1 ||
                !!errors.accTownCity ||
                !!errors.accPostCode
              }
            >
              Save and continue
            </button>

            {submitError && (
              <div className="md:col-span-2 flex md:justify-end">
                <p className="mt-1 w-full text-xs leading-4 !text-rose-600 md:w-[320px]">
                  *Please complete all required fields.
                </p>
              </div>
            )}

            {saved && (
              <div className="md:col-span-2 flex md:justify-end">
                <p className="w-full text-sm text-[#2E2A33]/75 md:w-[320px]">
                  Saved (mock).
                </p>
              </div>
            )}

          </form>
        </div>
      </div>
    </div>
  </div>
      <style jsx global>{`
        .complete-profile input::placeholder {
          color: rgba(46, 42, 51, 0.6) !important;
        }
      `}</style>
    </section>
  );
}
