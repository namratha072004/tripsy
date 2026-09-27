"use client";

import { useFormAction } from "./use-form-action";
import { savePreferences } from "@/app/actions";
import { DESTINATION_TYPES } from "@/lib/places";
import type { Preference } from "@/lib/types";

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD"];

export function PreferencesForm({
  code,
  participantId,
  baseCurrency,
  existing,
}: {
  code: string;
  participantId: string;
  baseCurrency: string;
  existing: Preference | null;
}) {
  const { state, pending, onSubmit } = useFormAction(savePreferences);
  const ranges = existing?.available_date_ranges ?? [];
  const types = new Set(existing?.destination_type_preferences ?? []);
  const currency = existing?.budget_currency ?? baseCurrency;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="code" value={code} />
      <input type="hidden" name="participant_id" value={participantId} />

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
        <p className="hint">
          Add up to three stretches. Only free for one day? Fill in just the &ldquo;from&rdquo; date.
        </p>
        <div className="grid grid-cols-2 gap-2 text-sm font-medium">
          <span>From</span>
          <span>To</span>
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="grid grid-cols-2 gap-2">
            <input
              type="date"
              name={`start_${i}`}
              className="field"
              defaultValue={ranges[i]?.start ?? ""}
              aria-label={`Dates ${i + 1}: from`}
              required={i === 0}
            />
            <input
              type="date"
              name={`end_${i}`}
              className="field"
              defaultValue={ranges[i]?.end ?? ""}
              aria-label={`Dates ${i + 1}: to`}
            />
          </div>
        ))}
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
                defaultChecked={types.has(t.id)}
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

      {state?.error && (
        <p role="alert" className="rounded-2xl bg-[#f8d5d0] px-4 py-2 text-sm text-[#8a2f25]">
          {state.error}
        </p>
      )}
      <button className="btn w-full" disabled={pending}>
        {pending ? "Saving…" : existing ? "Update my answers" : "I'm in"}
      </button>
    </form>
  );
}
