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
    <form onSubmit={onSubmit} className="card space-y-5">
      <div>
        <label className="label" htmlFor="name">Trip name</label>
        <input id="name" name="name" className="field" placeholder="Winter getaway 2026" required maxLength={80} />
      </div>
      <div>
        <label className="label" htmlFor="coordinator">Your name</label>
        <input id="coordinator" name="coordinator" className="field" placeholder="Riya" required maxLength={40} />
        <p className="hint mt-1">You&apos;ll get a private organiser link. Keep it to yourself.</p>
      </div>
      <div>
        <DeadlineFields id="deadline" label="Answers due by (IST)" defaultValue={defaultDeadline} />
        <p className="hint mt-1">
          When this passes, or once everyone&apos;s answered, the top option locks in as the plan.
        </p>
      </div>

      <fieldset>
        <div className="flex items-baseline justify-between">
          <legend className="label">Who&apos;s coming? (include yourself)</legend>
          <span className="hint">
            {rows.length} {rows.length === 1 ? "person" : "people"}
          </span>
        </div>
        <div className="space-y-2">
          {rows.map((rowId, i) => (
            <div key={rowId} className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <input
                name={`p${i}_name`}
                className="field"
                placeholder={i === 0 ? "Name" : `Friend ${i + 1}`}
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
                className="h-11 w-11 rounded-full text-lg text-muted transition hover:bg-blush/60 disabled:opacity-30"
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
            className="btn-ghost mt-3"
          >
            + Add a friend
          </button>
        ) : (
          <p className="hint mt-2">That&apos;s the max of {MAX_PEOPLE} people per trip.</p>
        )}
        <p className="hint mt-2">Home city lets Tripsy estimate each person&apos;s own travel cost.</p>
      </fieldset>

      {state?.error && (
        <p role="alert" className="rounded-2xl bg-[#f8d5d0] px-4 py-2 text-sm text-[#8a2f25]">
          {state.error}
        </p>
      )}
      <button className="btn w-full" disabled={pending}>
        {pending ? "Setting things up…" : "Create trip"}
      </button>
    </form>
  );
}
