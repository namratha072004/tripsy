import { FitChip, FitLegend } from "./fit";
import { dayRange, formatDateTime, formatDay, formatMoney } from "@/lib/time";
import type { Candidate, Decision, PersonBreakdown } from "@/lib/types";

const BUDGET_TEXT: Record<PersonBreakdown["budget"], string> = {
  ok: "Flights fit the budget",
  stretch: "Flights are a stretch",
  over: "Flights are over budget",
  unknown: "Cost estimate unavailable",
};

function Breakdown({ c, currency }: { c: Candidate; currency: string }) {
  const { people, weights, window } = c.score_breakdown;
  return (
    <details className="mt-3 rounded-2xl bg-cream/70 px-4 py-2 text-sm">
      <summary className="cursor-pointer py-1 font-display font-bold text-coral-deep">
        See the breakdown
      </summary>
      <p className="hint mt-1">
        Each person scores out of 100: dates {weights.dates}, trip type {weights.type}, budget{" "}
        {weights.budget}. A hard no makes it 0 for that person. If a cost estimate is
        unavailable, budget is left out rather than guessed. Overall is the group average.
      </p>
      {window && (
        <p className="hint mt-1">
          Dates checked: {formatDay(window.start)} to {formatDay(window.end)} ({window.available}{" "}
          of {window.total} free).
        </p>
      )}
      <ul className="mt-2 space-y-2">
        {people.map((p) => (
          <li key={p.participantId} className="border-t border-line pt-2">
            <div className="flex justify-between font-medium">
              <span>{p.name}</span>
              <span>{p.score}/100</span>
            </div>
            <ul className="hint">
              <li>
                Dates: {p.dates === null ? "not checked" : p.dates ? "free" : "not free"} · Type:{" "}
                {p.typeMatch ? "a match" : "not their pick"}
                {p.hardNo ? ` · Hard no: "${p.hardNo}"` : ""}
              </li>
              <li>
                {BUDGET_TEXT[p.budget]}
                {p.flightCost !== null &&
                  ` (${formatMoney(p.flightCost, currency)} round trip vs ${formatMoney(p.budgetAmount, currency)} budget)`}
              </li>
            </ul>
          </li>
        ))}
      </ul>
    </details>
  );
}

function summary(c: Candidate): string {
  const issues = c.score_breakdown.people.filter((p) => p.fit !== "good");
  if (issues.length === 0) return "Works for everyone who's answered.";
  return issues
    .slice(0, 2)
    .map((p) => `${p.name}: ${p.reasons[0]?.toLowerCase() ?? "a stretch"}`)
    .join(". ") + ".";
}

export function OptionCard({
  c,
  rank,
  currency,
}: {
  c: Candidate;
  rank: number;
  currency: string;
}) {
  const w = c.score_breakdown.window;
  return (
    <article className="card">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-xl font-extrabold">{c.destination_name}</h3>
        {rank === 0 ? (
          <span className="shrink-0 rounded-full bg-blush px-3 py-1 text-xs font-medium text-[#8a3e2f]">
            Leading
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-sand px-3 py-1 text-xs text-[#6e4b0c]">
            Option {rank + 1}
          </span>
        )}
      </div>
      <p className="hint">
        {c.destination_type}
        {w ? ` · ${dayRange(w.start, w.end, "–")}` : ""} · score {c.overall_score}
      </p>
      <div className="mt-3 flex gap-1.5">
        {c.score_breakdown.people.map((p) => (
          <FitChip key={p.participantId} fit={p.fit} name={p.name} />
        ))}
      </div>
      <p className="mt-3 text-sm">{summary(c)}</p>
      <Breakdown c={c} currency={currency} />
    </article>
  );
}

export function OptionsList({ candidates, currency }: { candidates: Candidate[]; currency: string }) {
  return (
    <section className="space-y-4">
      <FitLegend />
      {candidates.map((c, i) => (
        <OptionCard key={c.id} c={c} rank={i} currency={currency} />
      ))}
    </section>
  );
}

export function LockedPlan({
  c,
  decision,
  currency,
  organiser,
}: {
  c: Candidate;
  decision: Decision;
  currency: string;
  organiser: string;
}) {
  const w = c.score_breakdown.window;
  const why =
    decision.locked_by === "all_responded"
      ? "Everyone weighed in, so it's settled."
      : decision.locked_by === "deadline"
        ? "The deadline passed, so the top option is the plan."
        : `Locked by ${decision.locked_by}.`;
  return (
    <section className="space-y-4">
      <div className="rounded-3xl bg-coral-deep p-6 text-center text-white shadow-soft">
        <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
          🔒 Final plan
        </span>
        <h2 className="mt-3 font-display text-3xl font-extrabold">It&apos;s happening: {c.destination_name}</h2>
        {w && (
          <p className="mt-1 text-lg">
            {dayRange(w.start, w.end, " to ")}
          </p>
        )}
        <p className="mt-3 text-sm">
          {why} Locked {formatDateTime(decision.locked_at)}.
        </p>
        <p className="mt-1 text-sm">Time to book those tickets. Only {organiser}, who set up this trip, can reopen it.</p>
      </div>
      <OptionCard c={c} rank={0} currency={currency} />
    </section>
  );
}
