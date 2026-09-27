import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PreferencesForm } from "@/components/preferences-form";
import { formatDateTime } from "@/lib/time";
import { loadTripAndSettle } from "@/lib/trips";

export const dynamic = "force-dynamic";

export default async function MePage(props: PageProps<"/t/[code]/me/[pid]">) {
  const { code, pid } = await props.params;
  const b = await loadTripAndSettle(code);
  if (!b) notFound();
  const person = b.participants.find((p) => p.id === pid);
  if (!person) notFound();
  if (b.trip.status === "locked") redirect(`/t/${code}`);

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
        baseCurrency={b.trip.base_currency}
        existing={pref}
      />
    </div>
  );
}
