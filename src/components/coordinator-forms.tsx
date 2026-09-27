"use client";

import { useRef, useState } from "react";
import { useFormAction } from "./use-form-action";
import { DeadlineFields } from "./deadline-fields";
import { changeDeadline, lockNow, reopenTrip, type FormState } from "@/app/actions";

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
  const [status, setStatus] = useState<"idle" | "copied" | "manual">("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  const selectAll = () => inputRef.current?.select();

  const copy = async () => {
    // Clipboard API first; it's blocked in some browsers and embedded views.
    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2000);
      return;
    } catch {}
    // Fallback: select the text and use the legacy copy command.
    selectAll();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {}
    setStatus(ok ? "copied" : "manual");
    if (ok) setTimeout(() => setStatus("idle"), 2000);
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          readOnly
          value={url}
          onFocus={selectAll}
          onClick={selectAll}
          className="field min-w-0 text-sm"
          aria-label={label}
        />
        <button type="button" className="btn-ghost shrink-0" onClick={copy}>
          {status === "copied" ? "Copied" : "Copy"}
        </button>
      </div>
      {status === "manual" && (
        <p className="hint mt-1" role="status">
          Your browser blocked copying. The link is selected, so press Cmd+C (or Ctrl+C), or long-press
          it on your phone.
        </p>
      )}
    </div>
  );
}

export function WhatsAppShare({ url, tripName }: { url: string; tripName: string }) {
  const text = `Planning "${tripName}" on Tripsy. Tap your name and add your answers: ${url}`;
  return (
    <a
      href={`https://wa.me/?text=${encodeURIComponent(text)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="btn-ghost"
    >
      Share on WhatsApp
    </a>
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

export function LockNowForm({
  code,
  token,
  destinationId,
  destinationName,
  waiting,
}: {
  code: string;
  token: string;
  destinationId: string;
  destinationName: string;
  waiting: number;
}) {
  const { state, pending, onSubmit } = useFormAction(lockNow);
  return (
    <form onSubmit={onSubmit} className="space-y-2 border-t border-line pt-3">
      <input type="hidden" name="code" value={code} />
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="destination_id" value={destinationId} />
      <p className="text-sm">
        Group already agreed? You can lock <strong className="font-medium">{destinationName}</strong> now
        {waiting > 0 ? ` without waiting for ${waiting} more ${waiting === 1 ? "person" : "people"}` : ""}.
        It&apos;ll show in the history as locked by you.
      </p>
      <button className="btn w-full" disabled={pending}>
        {pending ? "Locking…" : `Lock ${destinationName} now`}
      </button>
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
