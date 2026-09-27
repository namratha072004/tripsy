"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { airportFor, DESTINATION_TYPES } from "@/lib/places";
import { hashToken, newToken, tokenMatches } from "@/lib/token";
import { loadTrip, loadTripAndSettle, regenerateOptions } from "@/lib/trips";
import { fromIstInput } from "@/lib/time";
import type { DateRange } from "@/lib/types";

export type FormState = { error?: string; ok?: string } | undefined;

const MAX_PEOPLE = 8;

function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

// ---------------------------------------------------------------------------
// Create trip
// ---------------------------------------------------------------------------
export async function createTrip(_: FormState, fd: FormData): Promise<FormState> {
  const name = str(fd, "name");
  const coordinator = str(fd, "coordinator");
  const deadline = fromIstInput(str(fd, "deadline"));

  const people: { name: string; city: string }[] = [];
  for (let i = 0; i < MAX_PEOPLE; i++) {
    const n = str(fd, `p${i}_name`);
    const c = str(fd, `p${i}_city`);
    if (!n && !c) continue;
    if (!n || !c) return { error: "Each person needs both a name and a home city." };
    people.push({ name: n.slice(0, 40), city: c.slice(0, 60) });
  }

  if (!name) return { error: "Give your trip a name." };
  if (!coordinator) return { error: "Add your name so the group knows who's organising." };
  if (!deadline) return { error: "Pick a response deadline." };
  if (deadline.getTime() <= Date.now()) return { error: "The deadline needs to be in the future." };
  if (people.length < 2) return { error: "Add at least two people." };
  const lower = people.map((p) => p.name.toLowerCase());
  if (new Set(lower).size !== lower.length) {
    return { error: "Two people have the same name. Add an initial so everyone can find themselves." };
  }

  const token = newToken();
  const { data: trip, error } = await db()
    .from("trips")
    .insert({
      name: name.slice(0, 80),
      coordinator_name: coordinator.slice(0, 40),
      coordinator_token_hash: hashToken(token),
      deadline: deadline.toISOString(),
    })
    .select("id, share_code")
    .single();
  if (error || !trip) return { error: "Couldn't create the trip. Try again in a moment." };

  const { error: pErr } = await db()
    .from("participants")
    .insert(
      people.map((p) => ({
        trip_id: trip.id,
        name: p.name,
        home_city: p.city,
        home_airport: airportFor(p.city),
      })),
    );
  if (pErr) {
    await db().from("trips").delete().eq("id", trip.id);
    return { error: "Couldn't save the group. Try again in a moment." };
  }

  redirect(`/t/${trip.share_code}/c/${token}?new=1`);
}

// ---------------------------------------------------------------------------
// Submit preferences
// ---------------------------------------------------------------------------
export async function savePreferences(_: FormState, fd: FormData): Promise<FormState> {
  const code = str(fd, "code");
  const participantId = str(fd, "participant_id");

  const b = await loadTrip(code);
  if (!b) return { error: "This trip link doesn't work anymore." };
  const person = b.participants.find((p) => p.id === participantId);
  if (!person) return { error: "We couldn't find you on this trip." };
  if (b.trip.status === "locked") {
    return { error: "The plan's already locked, so answers can't change right now." };
  }

  const budget = Number(str(fd, "budget"));
  const currency = (str(fd, "currency") || b.trip.base_currency).toUpperCase();
  if (!Number.isFinite(budget) || budget <= 0) return { error: "Add a budget above zero." };
  if (!/^[A-Z]{3}$/.test(currency)) return { error: "Pick a currency." };

  const ranges: DateRange[] = [];
  for (let i = 0; i < 3; i++) {
    const s = str(fd, `start_${i}`);
    const e = str(fd, `end_${i}`);
    if (!s && !e) continue;
    if (!s || !e) return { error: "Each date range needs a start and an end." };
    if (e < s) return { error: "One of your date ranges ends before it starts." };
    ranges.push({ start: s, end: e });
  }
  if (ranges.length === 0) return { error: "Add at least one stretch of dates you're free." };

  const allowed = new Set<string>(DESTINATION_TYPES.map((t) => t.id));
  const types = fd.getAll("types").map(String).filter((t) => allowed.has(t));
  if (types.length === 0) return { error: "Pick at least one kind of trip you'd enjoy." };

  const hardNos = str(fd, "hard_no")
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10)
    .map((s) => s.slice(0, 60));

  const { error } = await db()
    .from("preferences")
    .upsert(
      {
        participant_id: person.id,
        trip_id: b.trip.id,
        budget_amount: budget,
        budget_currency: currency,
        available_date_ranges: ranges,
        destination_type_preferences: types,
        hard_no_list: hardNos,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "participant_id" },
    );
  if (error) return { error: "Couldn't save your answers. Try again in a moment." };

  const fresh = await loadTrip(code);
  if (fresh) await regenerateOptions(fresh);
  await loadTripAndSettle(code);

  revalidatePath(`/t/${code}`, "layout");
  redirect(`/t/${code}?thanks=${encodeURIComponent(person.name)}`);
}

// ---------------------------------------------------------------------------
// Coordinator actions (require the secret coordinator token)
// ---------------------------------------------------------------------------
async function coordinatorTrip(fd: FormData) {
  const code = str(fd, "code");
  const token = str(fd, "token");
  const b = await loadTrip(code);
  if (!b || !token || !tokenMatches(token, b.trip.coordinator_token_hash)) return null;
  return { b, code, token };
}

export async function changeDeadline(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await coordinatorTrip(fd);
  if (!ctx) return { error: "Only the coordinator link can change the deadline." };
  const { b, code } = ctx;
  if (b.trip.status !== "collecting") {
    return { error: "The plan is locked. Reopen it first if you really need to." };
  }
  const deadline = fromIstInput(str(fd, "deadline"));
  if (!deadline || deadline.getTime() <= Date.now()) {
    return { error: "Pick a new deadline in the future." };
  }

  await db().from("trips").update({ deadline: deadline.toISOString() }).eq("id", b.trip.id);
  await db().from("decision_events").insert({
    trip_id: b.trip.id,
    event: "deadline_changed",
    actor: b.trip.coordinator_name,
    reason: `New deadline ${deadline.toISOString()}`,
  });
  revalidatePath(`/t/${code}`, "layout");
  return { ok: "Deadline updated." };
}

export async function reopenTrip(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await coordinatorTrip(fd);
  if (!ctx) return { error: "Only the coordinator link can reopen the plan." };
  const { b, code } = ctx;
  if (b.trip.status !== "locked") return { error: "The plan isn't locked." };

  const reason = str(fd, "reason");
  if (reason.length < 5) return { error: "Add a short reason. Everyone will see it." };
  if (str(fd, "confirm") !== "REOPEN") return { error: "Type REOPEN to confirm." };
  const deadline = fromIstInput(str(fd, "deadline"));
  if (!deadline || deadline.getTime() <= Date.now()) {
    return { error: "Pick a new deadline in the future." };
  }

  const { error } = await db().rpc("reopen_trip", {
    p_trip_id: b.trip.id,
    p_actor: b.trip.coordinator_name,
    p_reason: reason.slice(0, 300),
    p_new_deadline: deadline.toISOString(),
  });
  if (error) return { error: "Couldn't reopen the plan. Try again in a moment." };

  revalidatePath(`/t/${code}`, "layout");
  return { ok: "Reopened. Everyone can update their answers until the new deadline." };
}
