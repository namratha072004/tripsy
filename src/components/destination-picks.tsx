"use client";

import { useState } from "react";
import { DESTINATIONS } from "@/lib/places";

const MAX_PICKS = 5;

// Places that match the trip types someone chose (and their abroad answer).
// They can tap favourites, or leave it to Tripsy. Only the visible picks are
// submitted, so changing trip types quietly drops picks that no longer fit.
export function DestinationPicks({
  types,
  abroad,
  initial,
}: {
  types: Set<string>;
  abroad: "yes" | "no" | "";
  initial: string[];
}) {
  const [picks, setPicks] = useState<Set<string>>(() => new Set(initial));

  const matching = DESTINATIONS.filter(
    (d) => d.types.some((t) => types.has(t)) && !(abroad === "no" && d.country),
  );
  const visiblePicks = matching.filter((d) => picks.has(d.name));
  const letTripsy = visiblePicks.length === 0;

  const toggle = (name: string) =>
    setPicks((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else if (visiblePicks.length < MAX_PICKS) next.add(name);
      return next;
    });

  return (
    <section className="card space-y-3">
      <div>
        <h2 className="font-display text-lg font-extrabold">Any places you&apos;re dreaming of?</h2>
        <p className="hint">
          {types.size === 0
            ? "Pick what sounds fun above and we'll pop up places that match."
            : `Tap up to ${MAX_PICKS} favourites, or let Tripsy pick for the group.`}
        </p>
      </div>

      {types.size > 0 && (
        <>
          <button
            type="button"
            onClick={() => setPicks(new Set())}
            aria-pressed={letTripsy}
            className={`flex w-full items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3 font-display font-bold transition ${
              letTripsy
                ? "border-coral/70 bg-gradient-to-r from-blush to-lilac text-[#7a3a2c]"
                : "border-dashed border-line bg-white/60 text-muted hover:border-coral/50"
            }`}
          >
            <span aria-hidden>✨</span> Let Tripsy choose
          </button>

          <div className="flex flex-wrap gap-2">
            {matching.map((d) => {
              const on = picks.has(d.name);
              return (
                <button
                  key={d.name}
                  type="button"
                  onClick={() => toggle(d.name)}
                  aria-pressed={on}
                  className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                    on
                      ? "border-coral bg-blush text-[#8a3e2f]"
                      : "border-line bg-card hover:border-coral/50 hover:bg-blush/30"
                  }`}
                >
                  {on && <span aria-hidden>♡ </span>}
                  {d.name}
                  {d.country && <span className="ml-1 text-xs text-muted">{d.country}</span>}
                </button>
              );
            })}
          </div>
          <p className="hint">
            {letTripsy
              ? "Tripsy will weigh every matching place against everyone's answers."
              : `${visiblePicks.length} picked. These get a boost for you in the scoring.`}
          </p>
        </>
      )}

      {visiblePicks.map((d) => (
        <input key={d.name} type="hidden" name="favourites" value={d.name} />
      ))}
    </section>
  );
}
