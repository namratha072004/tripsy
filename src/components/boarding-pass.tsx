import { formatDay } from "@/lib/time";
import type { Candidate, Decision, Participant } from "@/lib/types";

const IST = "Asia/Kolkata";

function weekday(ymd: string): string {
  return new Intl.DateTimeFormat("en-IN", { timeZone: "UTC", weekday: "short" }).format(
    new Date(ymd + "T00:00:00Z"),
  );
}

function lockedTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: new Intl.DateTimeFormat("en-IN", { timeZone: IST, day: "numeric", month: "short" }).format(d),
    time:
      new Intl.DateTimeFormat("en-IN", { timeZone: IST, hour: "numeric", minute: "2-digit" }).format(d) +
      " IST",
  };
}

function Field({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">{label}</p>
      <p className="truncate font-display text-lg font-extrabold leading-tight">{value}</p>
      {sub && <p className="truncate text-xs text-muted">{sub}</p>}
    </div>
  );
}

// "It's happening" as a boarding pass. Dates come from the group window; the
// time shown is when the plan was locked (there's no real flight time to show).
export function BoardingPass({
  c,
  decision,
  participants,
  organiser,
}: {
  c: Candidate;
  decision: Decision;
  participants: Participant[];
  organiser: string;
}) {
  const w = c.score_breakdown.window;
  const answered = new Set(c.score_breakdown.people.map((p) => p.participantId));
  const passengers = participants.filter((p) => answered.has(p.id));
  const fromCodes = [
    ...new Set(passengers.map((p) => p.home_airport ?? p.home_city.slice(0, 3).toUpperCase())),
  ];
  const locked = lockedTime(decision.locked_at);
  const why =
    decision.locked_by === "all_responded"
      ? "Everyone weighed in, so it's settled."
      : decision.locked_by === "deadline"
        ? "The deadline passed, so the top pick is the plan."
        : `Locked by ${decision.locked_by}.`;
  const country = c.destination_type?.includes(" · ") ? c.destination_type.split(" · ")[0] : "India";
  const ref = decision.id.replace(/-/g, "").slice(0, 6).toUpperCase();

  return (
    <section aria-label={`Final plan: ${c.destination_name}`} className="drop-shadow-[0_18px_30px_rgb(176_78_59/0.25)]">
      {/* Main ticket */}
      <div className="overflow-hidden rounded-t-[28px] bg-white">
        <div className="flex items-center justify-between bg-gradient-to-r from-[#c9604b] to-[#b04e3b] px-5 py-3 text-white">
          <span className="flex items-center gap-2 font-display text-sm font-extrabold tracking-wide">
            <span aria-hidden>✈</span> TRIPSY AIR
          </span>
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold tracking-[0.12em]">
            🔒 FINAL PLAN
          </span>
        </div>

        <div className="px-5 pb-5 pt-4">
          <p className="text-center text-xs font-semibold tracking-[0.2em] text-coral-deep uppercase">
            Boarding pass · it&apos;s happening
          </p>

          {/* Route */}
          <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">From</p>
              <p className="truncate font-display text-3xl font-extrabold leading-none">
                {fromCodes.length === 1 ? fromCodes[0] : "CREW"}
              </p>
              <p className="mt-1 truncate text-xs text-muted">{fromCodes.join(" · ")}</p>
            </div>
            <div aria-hidden className="flex flex-col items-center text-coral">
              <span className="text-xl">✈</span>
              <span className="mt-0.5 h-px w-12 border-t-2 border-dotted border-coral/60" />
            </div>
            <div className="min-w-0 text-right">
              <p className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">To</p>
              <p className="truncate font-display text-3xl font-extrabold leading-none text-coral-deep">
                {c.destination_airport ?? "✿"}
              </p>
              <p className="mt-1 truncate text-xs text-muted">{c.destination_name}</p>
            </div>
          </div>

          <h2 className="mt-4 text-center font-display text-2xl font-extrabold leading-tight">
            {c.destination_name}
            <span className="block text-sm font-medium text-muted">{country}</span>
          </h2>

          {/* Details grid */}
          <div className="mt-4 grid grid-cols-3 gap-x-3 gap-y-3 rounded-2xl bg-cream/80 p-4">
            {w ? (
              <>
                <Field label="Depart" value={formatDay(w.start)} sub={weekday(w.start)} />
                <Field label="Return" value={formatDay(w.end)} sub={weekday(w.end)} />
              </>
            ) : (
              <>
                <Field label="Depart" value="TBD" />
                <Field label="Return" value="TBD" />
              </>
            )}
            <Field label="Locked" value={locked.time} sub={locked.date} />
            <Field label="Passengers" value={String(passengers.length)} sub="the whole crew" />
            <Field label="Gate" value="Group chat" />
            <Field label="Seat" value="Window" sub="obviously" />
          </div>

          <p className="mt-4 text-center text-sm">{why}</p>
        </div>
      </div>

      {/* Perforation */}
      <div aria-hidden className="relative h-6 bg-white">
        <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-cream" />
        <span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-cream" />
        <span className="absolute left-5 right-5 top-1/2 border-t-2 border-dashed border-line" />
      </div>

      {/* Stub */}
      <div className="rounded-b-[28px] bg-white px-5 pb-5 pt-2">
        <p className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">Passengers</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {passengers.map((p) => (
            <span key={p.id} className="rounded-full bg-blush/70 px-3 py-1 text-xs font-medium text-[#8a3e2f]">
              {p.name}
            </span>
          ))}
        </div>
        <div className="mt-4 flex items-end justify-between gap-4">
          <div
            aria-hidden
            className="h-12 flex-1 rounded-sm opacity-80"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, #4a2e2a 0 2px, transparent 2px 4px, #4a2e2a 4px 5px, transparent 5px 8px, #4a2e2a 8px 11px, transparent 11px 13px)",
            }}
          />
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">Booking ref</p>
            <p className="font-mono text-base font-bold tracking-widest">{ref}</p>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-muted">
          Time to book those tickets. Only {organiser}, who set up this trip, can reopen it.
        </p>
      </div>
    </section>
  );
}
