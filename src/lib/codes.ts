import type { Participant } from "./types";

// Case-insensitive, whitespace-tolerant check of a person's private code.
export function codeMatches(person: Participant, code: string | null | undefined): boolean {
  if (!code) return false;
  return code.trim().toUpperCase() === person.access_code.toUpperCase();
}

export function personalPath(shareCode: string, person: Participant): string {
  return `/t/${shareCode}/me/${person.id}?k=${encodeURIComponent(person.access_code)}`;
}
