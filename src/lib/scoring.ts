import type {
  BudgetStatus,
  DateRange,
  FareEstimate,
  Fit,
  Participant,
  PersonBreakdown,
  Preference,
  ScoreBreakdown,
} from "./types";
import type { Destination } from "./places";

// Scoring rules (kept simple and explainable; every number here shows up in the
// "See the breakdown" view):
//
// Per person, per destination:
//   - Hard no: if a hard-no entry matches the destination name or one of its
//     types, the person's score is 0 and fit is "no". This is a veto for them.
//   - Dates (40 pts): the group window (below) sits fully inside one of their
//     available ranges.
//   - Type (30 pts): the destination has at least one type they picked.
//   - Budget (30 pts): round-trip flight vs their total budget.
//       flight <= 50% of budget → ok (30), <= 75% → stretch (15), else over (0).
//     If the fare is unavailable or currencies differ, budget is "unknown" and
//     is left out of the score entirely (not guessed).
//   Score = points earned / points possible × 100.
//   Fit: "no" if hard no, dates don't fit, or over budget;
//        "stretch" if type doesn't match or budget is a stretch; else "good".
//
// Group window: the longest run of days (max 7) where the most people are free.
//
// Destination overall score = average of submitted people's scores.

export const WEIGHTS = { dates: 40, type: 30, budget: 30 } as const;
const MAX_WINDOW_DAYS = 7;

type Window = ScoreBreakdown["window"];

function* days(start: string, end: string): Generator<string> {
  const d = new Date(start + "T00:00:00Z");
  const e = new Date(end + "T00:00:00Z");
  let guard = 0;
  while (d <= e && guard++ < 400) {
    yield d.toISOString().slice(0, 10);
    d.setUTCDate(d.getUTCDate() + 1);
  }
}

function nextDay(day: string): string {
  const d = new Date(day + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function groupWindow(prefs: Preference[], total: number): Window {
  const counts = new Map<string, number>();
  for (const p of prefs) {
    const mine = new Set<string>();
    for (const r of p.available_date_ranges) for (const day of days(r.start, r.end)) mine.add(day);
    for (const day of mine) counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  if (counts.size === 0) return null;

  const best = Math.max(...counts.values());
  const sorted = [...counts.keys()].filter((d) => counts.get(d) === best).sort();

  // Longest consecutive run among the best days.
  let runStart = sorted[0];
  let bestRun = { start: sorted[0], end: sorted[0], len: 1 };
  let len = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === nextDay(sorted[i - 1])) {
      len++;
    } else {
      runStart = sorted[i];
      len = 1;
    }
    if (len > bestRun.len) bestRun = { start: runStart, end: sorted[i], len };
  }
  // Cap the window length, keeping the start.
  let end = bestRun.start;
  for (let i = 1; i < Math.min(bestRun.len, MAX_WINDOW_DAYS); i++) end = nextDay(end);

  return { start: bestRun.start, end, available: best, total };
}

function coversWindow(ranges: DateRange[], w: NonNullable<Window>): boolean {
  return ranges.some((r) => r.start <= w.start && r.end >= w.end);
}

function matchHardNo(hardNos: string[], dest: Destination): string | null {
  const haystack = [dest.name, ...dest.types].map((s) => s.toLowerCase());
  for (const raw of hardNos) {
    const h = raw.trim().toLowerCase();
    if (h.length < 3) continue;
    if (haystack.some((s) => s.includes(h) || h.includes(s))) return raw.trim();
  }
  return null;
}

function budgetStatus(fare: FareEstimate | undefined, pref: Preference): BudgetStatus {
  if (!fare || fare.status !== "ok" || fare.amount === null) return "unknown";
  if (fare.currency !== pref.budget_currency) return "unknown";
  const share = fare.amount / pref.budget_amount;
  if (share <= 0.5) return "ok";
  if (share <= 0.75) return "stretch";
  return "over";
}

export function scorePerson(
  person: Participant,
  pref: Preference,
  dest: Destination,
  window: Window,
  fare: FareEstimate | undefined,
): PersonBreakdown {
  const reasons: string[] = [];
  const hardNo = matchHardNo(pref.hard_no_list, dest);
  const dates = window ? coversWindow(pref.available_date_ranges, window) : null;
  const typeMatch = dest.types.some((t) => pref.destination_type_preferences.includes(t));
  const budget = budgetStatus(fare, pref);

  let earned = 0;
  let possible = 0;

  if (dates !== null) {
    possible += WEIGHTS.dates;
    if (dates) earned += WEIGHTS.dates;
    else reasons.push("Isn't free for the group's dates");
  }

  possible += WEIGHTS.type;
  if (typeMatch) earned += WEIGHTS.type;
  else reasons.push("Not the kind of trip they picked");

  if (budget !== "unknown") {
    possible += WEIGHTS.budget;
    if (budget === "ok") earned += WEIGHTS.budget;
    if (budget === "stretch") {
      earned += WEIGHTS.budget / 2;
      reasons.push("Flights take a big chunk of their budget");
    }
    if (budget === "over") reasons.push("Flights are over their budget");
  } else {
    reasons.push("Cost estimate unavailable");
  }

  let score = possible > 0 ? (earned / possible) * 100 : 0;
  if (hardNo) {
    score = 0;
    reasons.unshift(`On their hard-no list ("${hardNo}")`);
  }

  let fit: Fit = "good";
  if (hardNo || dates === false || budget === "over") fit = "no";
  else if (!typeMatch || budget === "stretch") fit = "stretch";

  return {
    participantId: person.id,
    name: person.name,
    fit,
    score: Math.round(score),
    dates,
    typeMatch,
    hardNo,
    budget,
    flightCost: fare?.status === "ok" ? fare.amount : null,
    budgetAmount: pref.budget_amount,
    reasons,
  };
}

export interface ScoredDestination {
  dest: Destination;
  breakdown: ScoreBreakdown;
  overall: number;
}

export function scoreDestination(
  dest: Destination,
  people: { person: Participant; pref: Preference }[],
  window: Window,
  fares: Record<string, FareEstimate>,
): ScoredDestination {
  const scored = people.map(({ person, pref }) =>
    scorePerson(person, pref, dest, window, fares[person.id]),
  );
  const overall = scored.length
    ? scored.reduce((sum, p) => sum + p.score, 0) / scored.length
    : 0;
  return {
    dest,
    breakdown: { window, people: scored, weights: { ...WEIGHTS } },
    overall: Math.round(overall * 10) / 10,
  };
}

// Highest score first; ties broken by fewer "no" fits, then name for stability.
export function rank(a: ScoredDestination, b: ScoredDestination): number {
  if (b.overall !== a.overall) return b.overall - a.overall;
  const noA = a.breakdown.people.filter((p) => p.fit === "no").length;
  const noB = b.breakdown.people.filter((p) => p.fit === "no").length;
  if (noA !== noB) return noA - noB;
  return a.dest.name.localeCompare(b.dest.name);
}
