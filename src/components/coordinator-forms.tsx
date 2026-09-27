"use client";

import { useState } from "react";
import { useFormAction } from "./use-form-action";
import { DeadlineFields } from "./deadline-fields";
import { changeDeadline, reopenTrip, type FormState } from "@/app/actions";

function Status({ state }: { state: FormState }) {
  if (state?.error)
    return (
      <p role="alert" className="rounded-2xl bg-[#f8d5d0] px-4 py-2 text-sm text-[#8a2f25]">
        {state.error}
      </p>
    );
  if (state?.ok)
    return <p className="rounded-2xl bg-sage px-4 py-2 text-sm text-sage-deep">{state.ok}</p>;
  return null;
}

export function CopyLink({ url, label }: { url: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex gap-2">
      <input readOnly value={url} className="field min-w-0 text-sm" aria-label={label} />
      <button
        type="button"
        className="btn-ghost shrink-0"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            setCopied(false);
          }
        }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export function DeadlineForm({ code, token, current }: { code: string; token: string; current: string }) {
  const { state, pending, onSubmit } = useFormAction(changeDeadline);
  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <input type="hidden" name="code" value={code} />
      <input type="hidden" name="token" value={token} />
      <DeadlineFields id="deadline" label="Change the deadline (IST)" defaultValue={current} />
      <button className="btn-ghost" disabled={pending}>Save deadline</button>
      <p className="hint">Everyone will see the new time. Changes are logged below.</p>
      <Status state={state} />
    </form>
  );
}

export function ReopenForm({ code, token, suggested }: { code: string; token: string; suggested: string }) {
  const { state, pending, onSubmit } = useFormAction(reopenTrip);
  return (
    <details className="rounded-2xl border border-line px-4 py-2">
      <summary className="cursor-pointer py-1 font-display font-bold">Reopen the plan</summary>
      <form onSubmit={onSubmit} className="mt-2 space-y-3">
        <input type="hidden" name="code" value={code} />
        <input type="hidden" name="token" value={token} />
        <p className="hint">
          This unlocks the plan so people can change their answers. It&apos;s a big step: the
          group will see that you reopened it and why.
        </p>
        <div>
          <label className="label" htmlFor="reason">Why are you reopening it?</label>
          <textarea id="reason" name="reason" rows={2} className="field" required minLength={5} maxLength={300} />
        </div>
        <DeadlineFields id="new-deadline" label="New deadline (IST)" defaultValue={suggested} />
        <div>
          <label className="label" htmlFor="confirm">Type REOPEN to confirm</label>
          <input id="confirm" name="confirm" className="field" autoComplete="off" required />
        </div>
        <button className="btn w-full" disabled={pending}>
          {pending ? "Reopening…" : "Reopen the plan"}
        </button>
        <Status state={state} />
      </form>
    </details>
  );
}
