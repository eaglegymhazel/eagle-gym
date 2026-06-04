"use client";

export type BirthdayPartyDraft = {
  slotId: string;
  partySize: number | null;
  birthdayChildFirstName: string;
  birthdayChildLastName: string;
  birthdayChildDateOfBirth: string;
  healthNotes: string;
  specialRequirements: string;
  additionalNotes: string;
};

const DRAFT_KEY = "birthday-party-draft";

export function saveBirthdayPartyDraft(draft: BirthdayPartyDraft) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function loadBirthdayPartyDraft(): BirthdayPartyDraft | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(DRAFT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BirthdayPartyDraft;
  } catch {
    return null;
  }
}
