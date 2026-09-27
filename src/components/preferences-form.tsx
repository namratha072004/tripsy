"use client";

import { useState } from "react";
import { useFormAction } from "./use-form-action";
import { DestinationPicks } from "./destination-picks";
import { DateRanges } from "./date-ranges";
import { savePreferences } from "@/app/actions";
import { DESTINATION_TYPES } from "@/lib/places";
import type { Preference } from "@/lib/types";

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD"];

export function PreferencesForm({
  code,
  participantId,
  baseCurrency,
  existing,
  reconfirm = false,
  accessCode,
}: {
  accessCode: string;
  code: string;
  participantId: string;
  baseCurrency: string;
  existing: Preference | null;
  reconfirm?: boolean;
}) {
  const { state, pending, onSubmit } = useFormAction(savePreferences);
  const ranges = existing?.available_date_ranges ?? [];
  const [types, setTypes] = useState<Set<string>>(
    () => new Set(existing?.destination_type_preferences ?? []),
  );
  const [abroad, setAbroad] = useState<"yes" | "no" | "">(
    existing ? (existing.open_to_abroad === false ? "no" : "yes") : "",
  );
  const toggleType = (id: string, on: boolean) =>
    setTypes((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  const currency = existing?.budget_currency ?? baseCurrency;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="code" value={code} />
      <input type="hidden" name="participant_id" value={participantId} />
      <input type="hidden" name="k" value={accessCode} />

      <section className="card space-y-2">
        <h2 className="font-display text-lg font-extrabold">What can you spend?</h2>
        <p className="hint">Your whole-trip budget, including getting there. Only Tripsy sees the number.</p>
        <div className="flex gap-2">
          <select name="currency" defaultValue={currency} className="field w-28" aria-label="Currency">
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input
            name="budget"
            type="number"
            inputMode="numeric"
            min={1}
            step="any"
            className="field"
            placeholder="15000"
            defaultValue={existing?.budget_amount ?? ""}
            aria-label="Budget amount"
            required
          />
        </div>
      </section>

      <section className="card space-y-2">
        <h2 className="font-display text-lg font-extrabold">When are you free?</h2>
        <p className="hint">Add up to three stretches of dates you could travel.</p>
        <DateRanges initial={ranges} />
      </section>

      <section className="card space-y-2">
        <h2 className="font-display text-lg font-extrabold">What sounds fun?</h2>
        <p className="hint">Pick as many as you like.</p>
        <div className="flex flex-wrap gap-2">
          {DESTINATION_TYPES.map((t) => (
            <label key={t.id} className="cursor-pointer">
              <input
                type="checkbox"
                name="types"
                value={t.id}
                checked={types.has(t.id)}
                onChange={(e) => toggleType(t.id, e.target.checked)}
                className="peer sr-only"
              />
              <span className="inline-block rounded-full border border-line bg-card px-4 py-2 text-sm transition peer-checked:border-coral peer-checked:bg-blush peer-checked:text-[#8a3e2f] peer-focus-visible:ring-2 peer-focus-visible:ring-coral/40">
                {t.label}
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="card space-y-2">
        <h2 className="font-display text-lg font-extrabold">Up for going abroad?</h2>
        <p className="hint">Think passport, visa, and leave. Places like Bali, Thailand, Dubai, Sri Lanka, or Nepal.</p>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "yes", label: "Yes, I'm in" },
            { value: "no", label: "India only for me" },
          ].map((o) => (
            <label key={o.value} className="cursor-pointer">
              <input
                type="radio"
                name="abroad"
                value={o.value}
                checked={abroad === o.value}
                onChange={() => setAbroad(o.value as "yes" | "no")}
                className="peer sr-only"
                required
              />
              <span className="inline-block rounded-full border border-line bg-card px-4 py-2 text-sm transition peer-checked:border-coral peer-checked:bg-blush peer-checked:text-[#8a3e2f] peer-focus-visible:ring-2 peer-focus-visible:ring-coral/40">
                {o.label}
              </span>
            </label>
          ))}
        </div>
      </section>

      <DestinationPicks
        types={types}
        abroad={abroad}
        initial={existing?.favourite_destinations ?? []}
      />

      <section className="card space-y-2">
        <h2 className="font-display text-lg font-extrabold">Any hard no&apos;s?</h2>
        <p className="hint">Places or things you really don&apos;t want. Separate with commas. Totally optional.</p>
        <textarea
          name="hard_no"
          rows={2}
          className="field"
          placeholder="Goa, mountains, overnight bus"
          defaultValue={existing?.hard_no_list.join(", ") ?? ""}
          maxLength={600}
        />
      </section>

      {reconfirm && (
        <p className="rounded-2xl bg-sand px-4 py-2 text-sm text-[#6e4b0c]">
          The plan was reopened. Check your answers and tap Confirm, even if nothing&apos;s changed.
        </p>
      )}
      {state?.error && (
        <p role="alert" className="rounded-2xl bg-[#f8d5d0] px-4 py-2 text-sm text-[#8a2f25]">
          {state.error}
        </p>
      )}
      <button className="btn w-full" disabled={pending}>
        {pending ? "Saving…" : reconfirm ? "Confirm my answers" : existing ? "Update my answers" : "I'm in"}
      </button>
    </form>
  );
}
