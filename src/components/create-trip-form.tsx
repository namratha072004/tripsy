"use client";

import { useRef, useState } from "react";
import { useFormAction } from "./use-form-action";
import { DeadlineFields } from "./deadline-fields";
import { createTrip } from "@/app/actions";
import { MAX_PEOPLE, MIN_PEOPLE } from "@/lib/limits";

export function CreateTripForm({ defaultDeadline }: { defaultDeadline: string }) {
  const { state, pending, onSubmit } = useFormAction(createTrip);
  // Stable ids so removing a row doesn't shift what's typed in the others.
  const [rows, setRows] = useState([0, 1, 2]);
  const nextId = useRef(3);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <section className="card space-y-5">
        <div className="flex items-center gap-2.5">
          <span className="step bg-blush text-[#8a3e2f]">1</span>
          <h2 className="font-display text-xl font-extrabold">The trip</h2>
        </div>
        <div>
          <label className="label" htmlFor="name">What are we calling it?</label>
          <input id="name" name="name" className="field" placeholder="Winter getaway 2026" required maxLength={80} />
        </div>
        <div>
          <label className="label" htmlFor="coordinator">And you are…</label>
          <input id="coordinator" name="coordinator" className="field" placeholder="Riya" required maxLength={40} />
          <p className="hint mt-1.5">You&apos;re the organiser. You&apos;ll get a private link, so keep it to yourself.</p>
        </div>
        <div>
          <DeadlineFields id="deadline" label="Answers due by (IST)" defaultValue={defaultDeadline} />
          <p className="hint mt-1.5">
            When this passes, or once everyone&apos;s answered, the top pick locks in as the plan.
          </p>
        </div>
      </section>

      <fieldset className="card">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="step bg-sage text-sage-deep">2</span>
            <legend className="font-display text-xl font-extrabold">The crew</legend>
          </div>
          <span className="rounded-full bg-lilac px-3 py-0.5 text-xs font-medium text-[#5b4a7a]">
            {rows.length} {rows.length === 1 ? "person" : "people"}
          </span>
        </div>
        <p className="hint -mt-2 mb-3">Include yourself. Home city helps estimate each person&apos;s travel cost.</p>
        <div className="space-y-2">
          {rows.map((rowId, i) => (
            <div key={rowId} className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <input
                name={`p${i}_name`}
                className="field"
                placeholder={i === 0 ? "You" : `Friend ${i + 1}`}
                aria-label={`Person ${i + 1} name`}
                maxLength={40}
              />
              <input
                name={`p${i}_city`}
                className="field"
                placeholder={i === 0 ? "Home city" : "City"}
                aria-label={`Person ${i + 1} home city`}
                maxLength={60}
              />
              <button
                type="button"
                onClick={() => setRows((r) => r.filter((id) => id !== rowId))}
                className="h-12 w-10 rounded-full text-lg text-[#c4a79f] transition hover:bg-blush/60 hover:text-coral-deep disabled:opacity-30"
                aria-label={`Remove person ${i + 1}`}
                disabled={rows.length <= MIN_PEOPLE}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        {rows.length < MAX_PEOPLE ? (
          <button
            type="button"
            onClick={() => setRows((r) => [...r, nextId.current++])}
            className="mt-3 flex h-12 w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-[#efd6cc] font-display font-bold text-coral-deep transition hover:border-coral/60 hover:bg-blush/25"
          >
            <span aria-hidden className="text-lg leading-none">+</span> Add a friend
          </button>
        ) : (
          <p className="hint mt-2">That&apos;s the max of {MAX_PEOPLE} people per trip.</p>
        )}
      </fieldset>

      {state?.error && (
        <p role="alert" className="rounded-2xl bg-[#f8d5d0] px-4 py-2 text-sm text-[#8a2f25]">
          {state.error}
        </p>
      )}
      <button className="btn w-full" disabled={pending}>
        {pending ? "Packing the bags…" : "Let's plan this ✈"}
      </button>
    </form>
  );
}
