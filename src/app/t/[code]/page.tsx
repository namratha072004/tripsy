import Link from "next/link";
import { notFound } from "next/navigation";
import { LockedPlan, OptionsList } from "@/components/options";
import { formatDateTime } from "@/lib/time";
import { loadTripAndSettle } from "@/lib/trips";

export const dynamic = "force-dynamic";

export default async function TripPage(props: PageProps<"/t/[code]">) {
  const { code } = await props.params;
  const sp = await props.searchParams;
  const thanks = typeof sp.thanks === "string" ? sp.thanks : null;

  const b = await loadTripAndSettle(code);
  if (!b) notFound();
  const { trip, participants, candidates, decision } = b;

  if (trip.status === "locked" && decision) {
    const chosen = candidates.find((c) => c.id === decision.locked_destination_id);
    return (
      <div className="space-y-4">
        <h1 className="font-display text-lg font-bold text-muted">{trip.name}</h1>
        {chosen ? (
          <LockedPlan c={chosen} decision={decision} currency={trip.base_currency} organiser={trip.coordinator_name} />
        ) : (
          <p className="card">The plan is locked.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-display text-3xl font-extrabold">{trip.name}</h1>
        <p className="mt-1 text-muted">
          {trip.coordinator_name} is getting everyone on the same page. Answers are due{" "}
          <strong className="font-medium text-ink">{formatDateTime(trip.deadline)}</strong>. After
          that, the top option becomes the plan.
        </p>
      </section>

      {b.events[0]?.event === "reopened" && (
        <p className="rounded-3xl bg-sand px-5 py-3 text-[#6e4b0c]">
          {b.events[0].actor} reopened the plan
          {b.events[0].destination_name ? ` (it was ${b.events[0].destination_name})` : ""}:{" "}
          &ldquo;{b.events[0].reason}&rdquo;. Tap your name and confirm your answers again, even if nothing&apos;s changed.
        </p>
      )}

      {thanks && (
        <p className="rounded-3xl bg-sage px-5 py-3 text-sage-deep">
          Thanks, {thanks}! Your answers are in. You can update them any time before the deadline.
        </p>
      )}

      <section className="card">
        <h2 className="font-display text-xl font-extrabold">Who are you?</h2>
        <p className="hint">Tap your name to add or update your answers.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {participants.map((p) => (
            <Link
              key={p.id}
              href={`/t/${code}/me/${p.id}`}
              className="rounded-full bg-blush px-4 py-2 font-display font-bold text-[#8a3e2f] transition hover:brightness-95"
            >
              {p.name}
            </Link>
          ))}
        </div>
      </section>

      {candidates.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="font-display text-xl font-extrabold">Here&apos;s what&apos;s looking good</h2>
            <p className="hint">
              Based on the answers so far. This isn&apos;t final until the deadline.
            </p>
          </div>
          <OptionsList candidates={candidates} currency={trip.base_currency} />
        </section>
      )}
    </div>
  );
}
