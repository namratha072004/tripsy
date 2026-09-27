import { db } from "./db";
import { estimateFare } from "./fares";
import { DESTINATIONS } from "./places";
import { groupWindow, rank, scoreDestination } from "./scoring";
import type {
  Candidate,
  Decision,
  DecisionEvent,
  FareEstimate,
  Participant,
  Preference,
  Trip,
} from "./types";

export interface TripBundle {
  trip: Trip;
  participants: Participant[];
  preferences: Preference[];
  candidates: Candidate[];
  decision: Decision | null;
  events: DecisionEvent[];
}

function must<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export async function loadTrip(shareCode: string): Promise<TripBundle | null> {
  const trip = must(
    await db().from("trips").select("*").eq("share_code", shareCode).maybeSingle(),
  ) as Trip | null;
  if (!trip) return null;

  const [participants, preferences, candidates, decision, events] = await Promise.all([
    db().from("participants").select("*").eq("trip_id", trip.id).order("created_at"),
    db().from("preferences").select("*").eq("trip_id", trip.id),
    db()
      .from("candidate_destinations")
      .select("*")
      .eq("trip_id", trip.id)
      .order("overall_score", { ascending: false }),
    db().from("decision").select("*").eq("trip_id", trip.id).maybeSingle(),
    db()
      .from("decision_events")
      .select("*")
      .eq("trip_id", trip.id)
      .order("created_at", { ascending: false }),
  ]);

  return {
    trip,
    participants: must(participants) as Participant[],
    preferences: must(preferences) as Preference[],
    candidates: (must(candidates) as Candidate[]).map((c) => ({
      ...c,
      overall_score: Number(c.overall_score),
    })),
    decision: must(decision) as Decision | null,
    events: must(events) as DecisionEvent[],
  };
}

// Rebuilds the 2–3 options from current preferences. Only allowed while the
// trip is collecting, so a locked decision's destination is never deleted.
export async function regenerateOptions(b: TripBundle): Promise<void> {
  if (b.trip.status !== "collecting") return;

  const byId = new Map(b.participants.map((p) => [p.id, p]));
  const people = b.preferences
    .filter((pref) => byId.has(pref.participant_id))
    .map((pref) => ({ person: byId.get(pref.participant_id)!, pref }));

  await db().from("candidate_destinations").delete().eq("trip_id", b.trip.id);
  if (people.length === 0) return;

  const window = groupWindow(
    people.map((p) => p.pref),
    b.participants.length,
  );

  // Pass 1 without fares to shortlist, then look up fares only for the shortlist.
  const noFares = DESTINATIONS.map((d) => scoreDestination(d, people, window, {})).sort(rank);
  const shortlist = noFares.slice(0, 5).map((s) => s.dest);

  const scored = await Promise.all(
    shortlist.map(async (dest) => {
      const fares: Record<string, FareEstimate> = {};
      await Promise.all(
        people.map(async ({ person }) => {
          fares[person.id] = await estimateFare(
            person.home_airport,
            dest.airport,
            window?.start ?? null,
            window?.end ?? null,
            b.trip.base_currency,
          );
        }),
      );
      return { ...scoreDestination(dest, people, window, fares), fares };
    }),
  );
  scored.sort(rank);

  const rows = scored.slice(0, 3).map((s) => ({
    trip_id: b.trip.id,
    destination_name: s.dest.name,
    destination_airport: s.dest.airport,
    destination_type: s.dest.types.join(", "),
    est_flight_cost_by_participant: s.fares,
    fits_dates_by_participant: Object.fromEntries(
      s.breakdown.people.map((p) => [p.participantId, p.dates]),
    ),
    score_breakdown: s.breakdown,
    overall_score: s.overall,
  }));
  must(await db().from("candidate_destinations").insert(rows));
}

export type LockReason = "deadline" | "all_responded";

export function lockDue(b: TripBundle, now = new Date()): LockReason | null {
  if (b.trip.status !== "collecting") return null;
  const total = b.participants.length;
  const submitted = new Set(b.preferences.map((p) => p.participant_id)).size;
  if (total > 0 && submitted >= total) return "all_responded";
  if (now >= new Date(b.trip.deadline)) return "deadline";
  return null;
}

// Called on every page load and after every submission. If the deadline has
// passed or everyone is in, the top option is locked. Returns a fresh bundle.
export async function loadTripAndSettle(shareCode: string): Promise<TripBundle | null> {
  let b = await loadTrip(shareCode);
  if (!b) return null;
  const reason = lockDue(b);
  if (!reason || b.preferences.length === 0) return b;

  // Options are rebuilt after every submission, so normally they already
  // exist. Only rebuild here if they're missing (avoids racing a parallel lock).
  if (b.candidates.length === 0) {
    await regenerateOptions(b);
    b = (await loadTrip(shareCode))!;
  }
  const top = b.candidates[0];
  if (!top) return b;

  const { error } = await db().rpc("lock_trip", {
    p_trip_id: b.trip.id,
    p_destination_id: top.id,
    p_locked_by: reason,
  });
  if (error) throw new Error(error.message);
  return loadTrip(shareCode);
}
