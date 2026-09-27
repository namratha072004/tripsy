import { CreateTripForm } from "@/components/create-trip-form";
import { toIstInput } from "@/lib/time";

export const dynamic = "force-dynamic";

export default function Home() {
  const inAWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  inAWeek.setUTCMinutes(0);
  return (
    <div className="space-y-7">
      <section className="pt-6">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-3 py-1 text-xs font-medium text-muted shadow-sm backdrop-blur">
          <span aria-hidden>✿</span> for friend groups who can&apos;t decide
        </span>
        <h1 className="mt-4 font-display text-[2.1rem] font-extrabold leading-[1.15] tracking-tight sm:text-[2.6rem]">
          Less &ldquo;we should totally go.&rdquo;
          <br />
          More <span className="scribble">&ldquo;we&apos;re going.&rdquo;</span>
        </h1>
        <p className="mt-3 max-w-md text-[17px] text-muted">
          Everyone answers once. Tripsy finds the spot that works for the whole crew, and when the
          deadline hits, it&apos;s locked in. No more polls that flip overnight.
        </p>
      </section>
      <CreateTripForm defaultDeadline={toIstInput(inAWeek)} />
      <p className="pb-4 text-center text-xs text-muted">made with love for chaotic group chats ♡</p>
    </div>
  );
}
