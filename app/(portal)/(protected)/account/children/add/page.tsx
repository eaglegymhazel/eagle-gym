"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { PolicyModal } from "@/components/legal/PolicyModal";
import {
  photoConsentContent,
  photoConsentTitle,
  photoConsentVersion,
} from "@/content/legal/photoConsent";
import { waiverContent, waiverTitle, waiverVersion } from "@/content/legal/waiver";

type LeaveUnattendedChoice = "mayLeaveUnattended" | "mustBeCollected";
type PolicyDoc = "waiver" | "photo";
type PhotoConsentDecision = "accepted" | "denied" | null;

type FormErrors = {
  firstName?: string;
  lastName?: string;
  dob?: string;
  waiverAccepted?: string;
  leaveUnattended?: string;
};

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function ConsentIndicator({
  state,
}: {
  state: "unchecked" | "checked" | "denied";
}) {
  const baseClass =
    "mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border";
  if (state === "checked") {
    return (
      <span className={`${baseClass} border-[#6c35c3] bg-[#6c35c3] text-white`}>
        <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden="true">
          <path
            d="M3.3 8.2l2.6 2.6 6-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }
  if (state === "denied") {
    return (
      <span className={`${baseClass} border-rose-500 bg-rose-100 text-rose-600`}>
        <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden="true">
          <path
            d="M4 4l8 8M12 4L4 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
    );
  }
  return <span className={`${baseClass} border-[#cfc6de] bg-white`} />;
}

export default function AddChildPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [firstNameInvalid, setFirstNameInvalid] = useState(false);
  const [lastNameInvalid, setLastNameInvalid] = useState(false);
  const [dob, setDob] = useState("");
  const [photoConsentDecision, setPhotoConsentDecision] =
    useState<PhotoConsentDecision>(null);
  const [waiverAccepted, setWaiverAccepted] = useState(false);
  const [medicalExpanded, setMedicalExpanded] = useState(false);
  const [noMedicalInfo, setNoMedicalInfo] = useState(false);
  const [medicalConditions, setMedicalConditions] = useState("");
  const [medications, setMedications] = useState("");
  const [disabilities, setDisabilities] = useState("");
  const [behaviouralConditions, setBehaviouralConditions] = useState("");
  const [allergies, setAllergies] = useState("");
  const [dietaryRequirements, setDietaryRequirements] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [surgeryAddress, setSurgeryAddress] = useState("");
  const [surgeryContactNo, setSurgeryContactNo] = useState("");
  const [leaveUnattended, setLeaveUnattended] =
    useState<LeaveUnattendedChoice | null>(null);
  const [openDoc, setOpenDoc] = useState<PolicyDoc | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const waiverTriggerRef = useRef<HTMLButtonElement | null>(null);
  const photoTriggerRef = useRef<HTMLButtonElement | null>(null);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);

  const inputBaseClass =
    "w-full rounded-xl border border-[#cfc6de] bg-white px-4 py-3.5 text-sm text-[#2E2A33] placeholder:text-[#2E2A33]/55 transition duration-200 focus:border-[#6c35c3]/60 focus:outline-none focus:ring-2 focus:ring-[#6c35c3]/25";
  const textareaClass =
    "w-full rounded-xl border border-[#cfc6de] bg-white px-4 py-3 text-sm text-[#2E2A33] placeholder:text-[#2E2A33]/55 transition duration-200 focus:border-[#6c35c3]/60 focus:outline-none focus:ring-2 focus:ring-[#6c35c3]/25";
  const invalidClass = "border-rose-500 focus:border-rose-500 focus:ring-rose-200";
  const today = useMemo(() => getTodayDateString(), []);

  useEffect(() => {
    if (openDoc !== null) return;
    if (lastTriggerRef.current) {
      lastTriggerRef.current.focus();
    }
  }, [openDoc]);

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};

    if (!firstName.trim()) {
      nextErrors.firstName = "First name is required.";
    } else if (!/^[A-Za-z]+$/.test(firstName.trim())) {
      nextErrors.firstName = "First name must contain letters only.";
    }
    if (!lastName.trim()) {
      nextErrors.lastName = "Last name is required.";
    } else if (!/^[A-Za-z]+$/.test(lastName.trim())) {
      nextErrors.lastName = "Last name must contain letters only.";
    }
    if (!dob) {
      nextErrors.dob = "Date of birth is required.";
    } else {
      const selected = new Date(dob);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      if (Number.isNaN(selected.getTime()) || selected >= now) {
        nextErrors.dob = "Date of birth must be in the past.";
      }
    }
    if (!waiverAccepted) {
      nextErrors.waiverAccepted = "You must accept the waiver and safety rules.";
    }
    if (!leaveUnattended) {
      nextErrors.leaveUnattended = "Please choose one unattended policy option.";
    }

    return nextErrors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitAttempted(true);
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 700));

    // TODO: Persist waiver acceptance with acceptedAt timestamp and docVersion.
    // TODO: Persist photo consent (if checked) with acceptedAt timestamp and docVersion.
    // TODO: Store consent audit fields in Children or dedicated consents table.
    // TODO: Persist photo consent decision (accepted/denied) with acceptedAt timestamp and docVersion.
    void photoConsentDecision;
    void medicalConditions;
    void medications;
    void disabilities;
    void behaviouralConditions;
    void allergies;
    void dietaryRequirements;
    void doctorName;
    void surgeryAddress;
    void surgeryContactNo;
    void noMedicalInfo;
    void leaveUnattended;
    void waiverVersion;
    void photoConsentVersion;

    router.push("/account");
  };

  const openPolicy = (doc: PolicyDoc, trigger: HTMLButtonElement | null) => {
    lastTriggerRef.current = trigger;
    setOpenDoc(doc);
    if (doc === "waiver") {
      setErrors((prev) => ({ ...prev, waiverAccepted: undefined }));
    }
  };

  return (
    <section className="w-full bg-[#faf7fb] px-4 pb-20 pt-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6">
          <Link
            href="/account"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#6c35c3] underline-offset-4 hover:underline"
          >
            <span aria-hidden="true">{"\u2190"}</span>
            Back to account
          </Link>
          <div className="mt-4 text-center">
            <div className="mx-auto mb-2 h-1 w-16 rounded-full bg-[#6c35c3] shadow-[0_6px_14px_rgba(108,53,195,0.25)]" />
            <h1 className="text-3xl font-black tracking-tight text-[#1f1a25] sm:text-4xl">
              Add child
            </h1>
            <p className="mt-2 text-sm font-semibold text-[#2E2A33]/65 sm:text-base">
              Add a child to your account for class bookings.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#e1d7ee] bg-white shadow-[0_18px_42px_rgba(22,12,47,0.1)]">
          <div className="grid grid-cols-1 md:grid-cols-[0.28fr_0.72fr]">
            <aside className="relative min-h-[220px] bg-gradient-to-br from-[#5e2eb0] via-[#5530a8] to-[#3a1f7a] px-6 py-11 !text-white sm:px-8 md:px-10 after:pointer-events-none after:absolute after:inset-0 after:bg-black/16">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.32),transparent_52%),radial-gradient(circle_at_85%_12%,rgba(255,255,255,0.12),transparent_40%),radial-gradient(circle_at_70%_75%,rgba(0,0,0,0.2),transparent_55%)]" />
              <div
                className="absolute inset-0 opacity-28 mix-blend-overlay"
                style={{
                  backgroundImage:
                    "url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22%3E%3Cfilter id=%22n%22 x=%220%22 y=%220%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%221%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%2260%22 height=%2260%22 filter=%22url(%23n)%22 opacity=%220.2%22/%3E%3C/svg%3E')",
                }}
              />
              <div className="relative z-10 flex h-full flex-col">
                <div className="text-white">
                  <span className="text-base font-semibold uppercase tracking-[0.28em] !text-white/85">
                    Child profile
                  </span>
                  <p className="mt-6 text-base font-medium leading-relaxed !text-white/85">
                    Add your child&apos;s profile to start booking classes and managing
                    their participation.
                  </p>
                </div>
              </div>
            </aside>

            <div className="px-6 py-8 sm:px-8 lg:px-10">
              <form
                className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2"
                onSubmit={handleSubmit}
                noValidate
              >
                <div className="md:col-span-2">
                  <h2 className="text-sm font-black uppercase tracking-[0.1em] text-[#1f1a25]">
                    Child details
                  </h2>
                </div>

                <div className="md:col-span-1">
                  <label>First name</label>
                  <input
                    className={[inputBaseClass, errors.firstName ? invalidClass : ""].join(" ")}
                    value={firstName}
                    onChange={(event) => {
                      const raw = event.target.value;
                      const cleaned = raw.replace(/[^A-Za-z]/g, "");
                      setFirstName(cleaned);
                      setFirstNameInvalid(cleaned !== raw);
                    }}
                    placeholder="First name"
                    autoComplete="given-name"
                  />
                  {firstNameInvalid ? (
                    <p className="mt-1 text-xs leading-4 text-rose-600">
                      Name can only contain letters.
                    </p>
                  ) : null}
                  {errors.firstName ? (
                    <p className="mt-1 text-xs leading-4 text-rose-600">{errors.firstName}</p>
                  ) : null}
                </div>

                <div className="md:col-span-1">
                  <label>Last name</label>
                  <input
                    className={[inputBaseClass, errors.lastName ? invalidClass : ""].join(" ")}
                    value={lastName}
                    onChange={(event) => {
                      const raw = event.target.value;
                      const cleaned = raw.replace(/[^A-Za-z]/g, "");
                      setLastName(cleaned);
                      setLastNameInvalid(cleaned !== raw);
                    }}
                    placeholder="Last name"
                    autoComplete="family-name"
                  />
                  {lastNameInvalid ? (
                    <p className="mt-1 text-xs leading-4 text-rose-600">
                      Name can only contain letters.
                    </p>
                  ) : null}
                  {errors.lastName ? (
                    <p className="mt-1 text-xs leading-4 text-rose-600">{errors.lastName}</p>
                  ) : null}
                </div>

                <div className="md:col-span-2">
                  <label>Date of birth</label>
                  <input
                    type="date"
                    max={today}
                    className={[inputBaseClass, errors.dob ? invalidClass : ""].join(" ")}
                    value={dob}
                    onChange={(event) => setDob(event.target.value)}
                  />
                  {errors.dob ? (
                    <p className="mt-1 text-xs leading-4 text-rose-600">{errors.dob}</p>
                  ) : null}
                </div>

                <div className="md:col-span-2 mt-2 border-t border-[#ede5f8] pt-4">
                  <h2 className="text-sm font-black uppercase tracking-[0.1em] text-[#1f1a25]">
                    Preferences & consents
                  </h2>
                </div>

                <div className="md:col-span-2">
                  <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-[#e1d7ee] px-4 py-3 text-sm text-[#2E2A33]">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <ConsentIndicator
                        state={
                          photoConsentDecision === "accepted"
                            ? "checked"
                            : photoConsentDecision === "denied"
                            ? "denied"
                            : "unchecked"
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <span className="mr-2 inline-flex rounded-full border border-[#d8c7f4] bg-[#faf6ff] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5b2ca7]">
                          Optional
                        </span>
                        <span className="inline">
                          I consent to photos/videos being taken during sessions under the{" "}
                        </span>
                        <button
                          ref={photoTriggerRef}
                          data-policy-trigger="photo"
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openPolicy("photo", photoTriggerRef.current);
                          }}
                          className="inline cursor-pointer rounded-sm text-sm font-semibold text-[#6c35c3] underline decoration-[#6c35c3]/75 underline-offset-2 transition-colors duration-150 hover:text-[#5529a6] hover:decoration-[#5529a6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3]/35"
                        >
                          Photo and Video Consent
                        </button>
                        <span>.</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div
                    className={[
                      "flex flex-wrap items-start justify-between gap-3 rounded-xl px-4 py-3 text-sm text-[#2E2A33]",
                      errors.waiverAccepted
                        ? "border border-rose-500"
                        : "border border-[#e1d7ee]",
                    ].join(" ")}
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <ConsentIndicator state={waiverAccepted ? "checked" : "unchecked"} />
                      <div className="min-w-0 flex-1">
                        <span className="inline">
                          I have read and accept the{" "}
                        </span>
                        <button
                          ref={waiverTriggerRef}
                          data-policy-trigger="waiver"
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openPolicy("waiver", waiverTriggerRef.current);
                          }}
                          className="inline cursor-pointer rounded-sm text-sm font-semibold text-[#6c35c3] underline decoration-[#6c35c3]/75 underline-offset-2 transition-colors duration-150 hover:text-[#5529a6] hover:decoration-[#5529a6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3]/35"
                        >
                          Waiver and Safety Rules
                        </button>
                        <span>.</span>
                      </div>
                    </div>
                  </div>
                  {errors.waiverAccepted ? (
                    <p className="mt-1 text-xs leading-4 text-rose-600">{errors.waiverAccepted}</p>
                  ) : null}
                </div>

                <div className="md:col-span-2">
                  <div className="overflow-hidden rounded-xl border border-[#e1d7ee]">
                    <button
                      type="button"
                      aria-expanded={medicalExpanded}
                      onClick={() => setMedicalExpanded((prev) => !prev)}
                      className={[
                        "flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors",
                        medicalExpanded ? "bg-[#faf6ff]" : "bg-white",
                      ].join(" ")}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black uppercase tracking-[0.08em] text-[#1f1a25]">
                            Medical & care information
                          </h3>
                          <span className="inline-flex rounded-full border border-[#d8c7f4] bg-[#faf6ff] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5b2ca7]">
                            Optional
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[#2E2A33]/70">
                          Any known disabilities, behavioural conditions, dietary needs, or medications?
                        </p>
                      </div>
                      <span
                        aria-hidden="true"
                        className={[
                          "inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#d8c7f4] text-[#6c35c3] transition-transform",
                          medicalExpanded ? "rotate-180" : "rotate-0",
                        ].join(" ")}
                      >
                        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none">
                          <path
                            d="M5 7.5L10 12.5L15 7.5"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </button>

                    {medicalExpanded ? (
                      <div className="border-t border-[#ede5f8] px-4 py-4">
                        <label className="mb-4 flex items-start gap-3 rounded-xl border border-[#e1d7ee] px-4 py-3 text-sm text-[#2E2A33]">
                          <input
                            type="checkbox"
                            checked={noMedicalInfo}
                            onChange={(event) => {
                              const checked = event.target.checked;
                              setNoMedicalInfo(checked);
                              if (checked) {
                                setMedicalConditions("");
                                setMedications("");
                                setDisabilities("");
                                setBehaviouralConditions("");
                                setAllergies("");
                                setDietaryRequirements("");
                                setDoctorName("");
                                setSurgeryAddress("");
                                setSurgeryContactNo("");
                              }
                            }}
                            className="mt-0.5 h-4 w-4 rounded border-[#cfc6de] text-[#6c35c3] focus:ring-[#6c35c3]/35"
                          />
                          <span>No medical or care information to provide</span>
                        </label>

                        <div className={[noMedicalInfo ? "opacity-60" : ""].join(" ")}>
                          <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-[0.08em] text-[#1f1a25]">
                              Health details
                            </h4>
                            <div className="space-y-3">
                              <div>
                                <label>Medical condition(s)</label>
                                <textarea
                                  rows={3}
                                  disabled={noMedicalInfo}
                                  className={textareaClass}
                                  value={medicalConditions}
                                  onChange={(event) => setMedicalConditions(event.target.value)}
                                  placeholder="e.g. Asthma"
                                />
                              </div>
                              <div>
                                <label>Medication(s)</label>
                                <textarea
                                  rows={3}
                                  disabled={noMedicalInfo}
                                  className={textareaClass}
                                  value={medications}
                                  onChange={(event) => setMedications(event.target.value)}
                                  placeholder="e.g. Epipen"
                                />
                              </div>
                              <div>
                                <label>Disabilities</label>
                                <textarea
                                  rows={3}
                                  disabled={noMedicalInfo}
                                  className={textareaClass}
                                  value={disabilities}
                                  onChange={(event) => setDisabilities(event.target.value)}
                                  placeholder="e.g. Mobility support requirements"
                                />
                              </div>
                              <div>
                                <label>Behavioural condition(s)</label>
                                <textarea
                                  rows={3}
                                  disabled={noMedicalInfo}
                                  className={textareaClass}
                                  value={behaviouralConditions}
                                  onChange={(event) =>
                                    setBehaviouralConditions(event.target.value)
                                  }
                                  placeholder="e.g. ADHD"
                                />
                              </div>
                              <div>
                                <label>Allergies</label>
                                <textarea
                                  rows={3}
                                  disabled={noMedicalInfo}
                                  className={textareaClass}
                                  value={allergies}
                                  onChange={(event) => setAllergies(event.target.value)}
                                  placeholder="e.g. Peanut allergy"
                                />
                              </div>
                              <div>
                                <label>Dietary requirements</label>
                                <textarea
                                  rows={3}
                                  disabled={noMedicalInfo}
                                  className={textareaClass}
                                  value={dietaryRequirements}
                                  onChange={(event) =>
                                    setDietaryRequirements(event.target.value)
                                  }
                                  placeholder="e.g. Gluten free"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="my-4 border-t border-[#ede5f8]" />

                          <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-[0.08em] text-[#1f1a25]">
                              GP / surgery details
                            </h4>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                              <div>
                                <label>Doctor&apos;s name</label>
                                <input
                                  type="text"
                                  disabled={noMedicalInfo}
                                  className={inputBaseClass}
                                  value={doctorName}
                                  onChange={(event) => setDoctorName(event.target.value)}
                                  placeholder="e.g. Dr Jane Smith"
                                />
                              </div>
                              <div>
                                <label>Surgery contact no.</label>
                                <input
                                  type="tel"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  disabled={noMedicalInfo}
                                  className={inputBaseClass}
                                  value={surgeryContactNo}
                                  onChange={(event) =>
                                    setSurgeryContactNo(
                                      event.target.value.replace(/\D/g, "")
                                    )
                                  }
                                  placeholder="e.g. 0141 000 0000"
                                />
                              </div>
                            </div>
                            <div>
                              <label>Surgery address</label>
                              <textarea
                                rows={3}
                                disabled={noMedicalInfo}
                                className={textareaClass}
                                value={surgeryAddress}
                                onChange={(event) => setSurgeryAddress(event.target.value)}
                                placeholder="e.g. 12 Main Street, Glasgow"
                              />
                            </div>
                          </div>
                        </div>

                        <p className="mt-4 text-xs text-[#2E2A33]/70">
                          This information is optional and used only for safeguarding and emergency response.
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label>Leave unattended</label>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <label
                      className={[
                        "flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-sm text-[#2E2A33]",
                        errors.leaveUnattended
                          ? "border border-rose-500"
                          : "border border-[#e1d7ee]",
                      ].join(" ")}
                    >
                      <input
                        type="radio"
                        name="leaveUnattended"
                        checked={leaveUnattended === "mayLeaveUnattended"}
                        onChange={() => setLeaveUnattended("mayLeaveUnattended")}
                        className="h-4 w-4 border-[#cfc6de] text-[#6c35c3] focus:ring-[#6c35c3]/35"
                      />
                      <span>May leave unattended</span>
                    </label>
                    <label
                      className={[
                        "flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-sm text-[#2E2A33]",
                        errors.leaveUnattended
                          ? "border border-rose-500"
                          : "border border-[#e1d7ee]",
                      ].join(" ")}
                    >
                      <input
                        type="radio"
                        name="leaveUnattended"
                        checked={leaveUnattended === "mustBeCollected"}
                        onChange={() => setLeaveUnattended("mustBeCollected")}
                        className="h-4 w-4 border-[#cfc6de] text-[#6c35c3] focus:ring-[#6c35c3]/35"
                      />
                      <span>Must be collected by an adult</span>
                    </label>
                  </div>
                  {errors.leaveUnattended ? (
                    <p className="mt-1 text-xs leading-4 text-rose-600">{errors.leaveUnattended}</p>
                  ) : null}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-b from-[#6f3bc9] via-[#6c35c3] to-[#5f2eb6] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] !text-white shadow-[0_3px_8px_rgba(108,53,195,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:from-[#6a35c1] hover:via-[#6030b8] hover:to-[#5529a6] hover:shadow-[0_4px_10px_rgba(108,53,195,0.18)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3]/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
                >
                  {isSubmitting ? "Saving..." : "Save child"}
                </button>
                {submitAttempted && Object.keys(errors).length > 0 ? (
                  <p className="md:col-span-2 mt-1 text-xs leading-4 text-rose-600">
                    Please complete all required fields.
                  </p>
                ) : null}
              </form>
            </div>
          </div>
        </div>
      </div>

      <PolicyModal
        open={openDoc === "waiver"}
        onOpenChange={(open) => setOpenDoc(open ? "waiver" : null)}
        title={waiverTitle}
        content={waiverContent}
        docId="waiver"
        primaryActionLabel="I accept"
        onPrimaryAction={() => {
          setWaiverAccepted(true);
          setErrors((prev) => ({ ...prev, waiverAccepted: undefined }));
        }}
      />
      <PolicyModal
        open={openDoc === "photo"}
        onOpenChange={(open) => setOpenDoc(open ? "photo" : null)}
        title={photoConsentTitle}
        content={photoConsentContent}
        docId="photo"
        primaryActionLabel="I accept"
        onPrimaryAction={() => {
          setPhotoConsentDecision("accepted");
        }}
        tertiaryActionLabel="I deny"
        onTertiaryAction={() => {
          setPhotoConsentDecision("denied");
        }}
      />
    </section>
  );
}
