import type { FareEstimate } from "./types";

// Round-trip fare estimate from a participant's home airport to a destination.
//
// The RapidAPI provider hasn't been chosen yet, so this returns "unavailable"
// for every lookup. It must never return a made-up number: the scoring and UI
// treat "unavailable" as "budget fit unknown" and say so.
export async function estimateFare(
  from: string | null,
  to: string,
  _outbound: string | null,
  _inbound: string | null,
  currency: string,
): Promise<FareEstimate> {
  if (!from) {
    return { status: "unavailable", amount: null, currency, note: "Home airport unknown" };
  }
  if (from === to) {
    return { status: "ok", amount: 0, currency, note: "Lives here" };
  }
  if (!process.env.RAPIDAPI_KEY) {
    return { status: "unavailable", amount: null, currency, note: "Fare lookup not connected yet" };
  }
  // TODO: call the approved RapidAPI flights endpoint here once chosen.
  return { status: "unavailable", amount: null, currency, note: "Fare lookup not connected yet" };
}
