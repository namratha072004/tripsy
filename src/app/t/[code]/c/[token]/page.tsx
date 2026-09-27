import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { CopyLink, DeadlineForm, LockNowForm, ReopenForm, WhatsAppShare } from "@/components/coordinator-forms";
import { LockedPlan, OptionsList } from "@/components/options";
import { formatDateTime, toIstInput } from "@/lib/time";
import { tokenMatches } from "@/lib/token";
import { confirmedIds, loadTripAndSettle } from "@/lib/trips";
import { personalPath } from "@/lib/codes";
import { PersonalLink } from "@/components/personal-link";

export const dynamic = "force-dynamic";

const EVENT_TEXT = {
  locked: "Locked",
  reopened: "Reopened",
  deadline_changed: "Deadline changed",
} as const;

const ACTOR_TEXT: Record<string, string> = {
  all_responded: "everyone answered",
  deadline: "deadline passed",
};

export default async function CoordinatorPage(props: PageProps<"/t/[code]/c/[token]">) {
  const { code, token } = await props.params;
  const sp = await props.searchParams;
  const b = await loadTripAndSettle(code);
  if (!b || !tokenMatches(token, b.trip.coordinator_token_hash)) notFound();
  const { trip, participants, preferences, candidates, decision, events } = b;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const base = `${proto}://${host}`;
  const shareUrl = `${base}/t/${code}`;
  const myUrl = `${base}/t/${code}/c/${token}`;

  const answered = new Set(preferences.map((p) => p.participant_id));
  const confirmed = confirmedIds(b);
  const reopened = trip.status === "collecting" && events.some((e) => e.event === "reopened");
  const locked = trip.status === "locked" && decision;
  const chosen = decision && candidates.find((c) => c.id === decision.locked_destination_id);
  const soon = toIstInput(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000));

  return (
    <div className="space-y-5">
      <section>
        <p className="hint">Organiser view · only you can see this page</p>
        <h1 className="font-display text-3xl font-extrabold">{trip.name}</h1>
      </section>

      {sp.new === "1" && (
        <section className="rounded-3xl bg-sand p-5 text-[#6e4b0c]">
          <h2 className="font-display text-lg font-extrabold">Save this page&apos;s link</h2>
          <p className="text-sm">
            It&apos;s your private organiser link, and it&apos;s the only way back here. Bookmark it
            or send it to yourself, but don&apos;t share it with the group.
          </p>
          <div className="mt-2">
            <CopyLink url={myUrl} label="Your organiser link" />
          </div>
        </section>
      )}

      <section className="card space-y-2">
        <h2 className="font-display text-lg font-extrabold">Share with the group</h2>
        <p className="hint">
          Drop this in the WhatsApp group so everyone can see the options. To answer, each person
          needs their own code from the list below.
        </p>
        <CopyLink url={shareUrl} label="Group link" />
        <WhatsAppShare url={shareUrl} tripName={trip.name} />
      </section>

      <section className="card">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg font-extrabold">Who&apos;s in</h2>
          <span className="hint">
            {confirmed.size} of {participants.length}
          </span>
        </div>
        <ul className="mt-2 divide-y divide-line">
          {participants.map((p) => (
            <li key={p.id} className="flex items-center justify-between py-2">
              <span>
                {p.name} <span className="hint">· {p.home_city}</span>
              </span>
              {confirmed.has(p.id) ? (
                <span className="rounded-full bg-sage px-3 py-0.5 text-xs text-sage-deep">
                  {reopened ? "Re-confirmed" : "Answered"}
                </span>
              ) : reopened && answered.has(p.id) ? (
                <span className="rounded-full bg-sand px-3 py-0.5 text-xs text-[#6e4b0c]">Needs to re-confirm</span>
              ) : (
                <span className="rounded-full bg-sand px-3 py-0.5 text-xs text-[#6e4b0c]">Waiting</span>
              )}
            </li>
          ))}
        </ul>
        <p className="hint mt-2">
          {reopened
            ? "Since you reopened, everyone needs to tap their name and confirm again (even if nothing changed) before it auto-locks."
            : "The group page never shows who's still waiting. A gentle nudge is up to you."}
        </p>
      </section>

      <section className="card">
        <h2 className="font-display text-lg font-extrabold">Personal links</h2>
        <p className="hint">
          Send each friend their own link privately. Their code means nobody else can open or change
          their answers.
        </p>
        <ul className="mt-2 divide-y divide-line">
          {participants.map((p) => (
            <PersonalLink
              key={p.id}
              name={p.name}
              code={p.access_code}
              url={`${base}${personalPath(code, p)}`}
              tripName={trip.name}
            />
          ))}
        </ul>
      </section>

      {locked && chosen ? (
        <>
          <LockedPlan c={chosen} decision={decision} currency={trip.base_currency} organiser={trip.coordinator_name} participants={participants} />
          <ReopenForm code={code} token={token} suggested={soon} />
        </>
      ) : (
        <>
          <section className="card space-y-3">
            <p>
              Locks automatically at <strong className="font-medium">{formatDateTime(trip.deadline)}</strong>, or as
              soon as everyone&apos;s answered.
            </p>
            <DeadlineForm code={code} token={token} current={toIstInput(new Date(trip.deadline))} />
            {candidates[0] && (
              <LockNowForm
                code={code}
                token={token}
                destinationId={candidates[0].id}
                destinationName={candidates[0].destination_name}
                waiting={participants.length - confirmed.size}
              />
            )}
          </section>
          {candidates.length > 0 ? (
            <section className="space-y-3">
              <h2 className="font-display text-xl font-extrabold">Leading options so far</h2>
              <OptionsList candidates={candidates} currency={trip.base_currency} />
            </section>
          ) : (
            new Date(trip.deadline) <= new Date() && (
              <p className="card">
                The deadline passed before anyone answered, so there&apos;s nothing to lock yet. Set a
                new deadline above to keep going.
              </p>
            )
          )}
        </>
      )}

      {events.length > 0 && (
        <section className="card">
          <h2 className="font-display text-lg font-extrabold">History</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {events.map((e) => (
              <li key={e.id} className="border-t border-line pt-2">
                <span className="font-medium">{EVENT_TEXT[e.event]}</span>
                {e.destination_name ? `: ${e.destination_name}` : ""} ·{" "}
                <span className="hint">
                  {ACTOR_TEXT[e.actor] ?? e.actor}, {formatDateTime(e.created_at)}
                </span>
                {e.reason && e.event === "reopened" && <p className="hint">&ldquo;{e.reason}&rdquo;</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link href={`/t/${code}`} className="btn-ghost">
        See the group&apos;s view
      </Link>
    </div>
  );
}
