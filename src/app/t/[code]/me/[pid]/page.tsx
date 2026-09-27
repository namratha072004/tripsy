import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PreferencesForm } from "@/components/preferences-form";
import { codeMatches } from "@/lib/codes";
import { formatDateTime } from "@/lib/time";
import { confirmedIds, loadTripAndSettle } from "@/lib/trips";

export const dynamic = "force-dynamic";

export default async function MePage(props: PageProps<"/t/[code]/me/[pid]">) {
  const { code, pid } = await props.params;
  const sp = await props.searchParams;
  const k = typeof sp.k === "string" ? sp.k : "";

  const b = await loadTripAndSettle(code);
  if (!b) notFound();
  const person = b.participants.find((p) => p.id === pid);
  if (!person) notFound();
  if (b.trip.status === "locked") redirect(`/t/${code}`);

  // Without the right private code, ask for it instead of showing the form.
  if (!codeMatches(person, k)) {
    return (
      <div className="space-y-5">
        <Link href={`/t/${code}`} className="hint hover:text-ink">
          ← {b.trip.name}
        </Link>
        <section className="card space-y-4">
          <div>
            <h1 className="font-display text-2xl font-extrabold">Hey {person.name}! Quick check</h1>
            <p className="hint mt-1">
              Enter the 6-character code {b.trip.coordinator_name} sent you. It keeps your answers
              yours, so nobody else can change them.
            </p>
          </div>
          <form method="get" className="space-y-3">
            <input
              name="k"
              className="field text-center font-mono text-xl tracking-[0.4em] uppercase"
              placeholder="A1B2C3"
              maxLength={6}
              autoComplete="off"
              autoCapitalize="characters"
              aria-label="Your code"
              required
              autoFocus
            />
            {k && (
              <p role="alert" className="rounded-2xl bg-[#f8d5d0] px-4 py-2 text-sm text-[#8a2f25]">
                That code doesn&apos;t match. Check the message from {b.trip.coordinator_name}.
              </p>
            )}
            <button className="btn w-full">Open my answers</button>
          </form>
          <p className="hint">No code? Ask {b.trip.coordinator_name} to send you your personal link.</p>
        </section>
      </div>
    );
  }

  const pref = b.preferences.find((p) => p.participant_id === person.id) ?? null;

  return (
    <div className="space-y-5">
      <Link href={`/t/${code}`} className="hint hover:text-ink">
        ← {b.trip.name}
      </Link>
      <section>
        <h1 className="font-display text-3xl font-extrabold">Hey {person.name}!</h1>
        <p className="mt-1 text-muted">
          {pref
            ? "Here's what you told us. Change anything that's different now."
            : "A couple of quick questions and you're done."}{" "}
          Due {formatDateTime(b.trip.deadline)}.
        </p>
      </section>
      <PreferencesForm
        code={code}
        participantId={person.id}
        accessCode={person.access_code}
        baseCurrency={b.trip.base_currency}
        existing={pref}
        reconfirm={b.events.some((e) => e.event === "reopened") && !confirmedIds(b).has(person.id)}
      />
    </div>
  );
}
