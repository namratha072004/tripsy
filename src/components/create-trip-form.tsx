"use client";

import { useActionState } from "react";
import { createTrip, type FormState } from "@/app/actions";

const ROWS = 6;

export function CreateTripForm({ defaultDeadline }: { defaultDeadline: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createTrip, undefined);

  return (
    <form action={action} className="card space-y-5">
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
        <label className="label" htmlFor="deadline">Answers due by (IST)</label>
        <input
          id="deadline"
          name="deadline"
          type="datetime-local"
          className="field"
          defaultValue={defaultDeadline}
          required
        />
        <p className="hint mt-1">
          When this passes, or once everyone&apos;s answered, the top option locks in as the plan.
        </p>
      </div>

      <fieldset>
        <legend className="label">Who&apos;s coming? (include yourself)</legend>
        <div className="space-y-2">
          {Array.from({ length: ROWS }, (_, i) => (
            <div key={i} className="grid grid-cols-2 gap-2">
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
            </div>
          ))}
        </div>
        <p className="hint mt-1">Home city lets Tripsy estimate each person&apos;s own travel cost.</p>
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
