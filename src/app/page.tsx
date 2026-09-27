import { CreateTripForm } from "@/components/create-trip-form";
import { toIstInput } from "@/lib/time";

export const dynamic = "force-dynamic";

export default function Home() {
  const inAWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  inAWeek.setUTCMinutes(0);
  return (
    <div className="space-y-6">
      <section className="pt-4">
        <h1 className="font-display text-3xl font-extrabold leading-tight">
          Let&apos;s get this trip out of the group chat.
        </h1>
        <p className="mt-2 text-muted">
          Everyone answers once. Tripsy finds the options that work for the most people, and
          when the deadline hits, the plan is locked. No more polls that fall apart overnight.
        </p>
      </section>
      <CreateTripForm defaultDeadline={toIstInput(inAWeek)} />
    </div>
  );
}
