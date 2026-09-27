"use client";

import { useRef, useState } from "react";
import type { DateRange } from "@/lib/types";

const MAX_RANGES = 3;

// Free-date stretches, styled like the deadline field: a labelled pair per
// stretch, one shown by default, "+ Add another stretch" for more.
// Fields are named start_i / end_i by position, which is what the server reads.
export function DateRanges({ initial }: { initial: DateRange[] }) {
  const seed = initial.length ? initial : [{ start: "", end: "" }];
  const [rows, setRows] = useState(() => seed.map((r, i) => ({ id: i, ...r })));
  const nextId = useRef(seed.length);

  const setStart = (id: number, start: string) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, start } : r)));

  return (
    <div className="space-y-3">
      {rows.map((r, i) => (
        <div key={r.id}>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="label mb-0">{rows.length === 1 ? "Your free dates" : `Stretch ${i + 1}`}</span>
            {i > 0 && (
              <button
                type="button"
                onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}
                className="rounded-full px-2 text-sm text-[#c4a79f] transition hover:bg-blush/60 hover:text-coral-deep"
                aria-label={`Remove stretch ${i + 1}`}
              >
                × Remove
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              name={`start_${i}`}
              className="field"
              defaultValue={r.start}
              onChange={(e) => setStart(r.id, e.target.value)}
              aria-label={`Stretch ${i + 1}: free from`}
              required={i === 0}
            />
            <input
              type="date"
              name={`end_${i}`}
              className="field"
              defaultValue={r.end}
              min={r.start || undefined}
              aria-label={`Stretch ${i + 1}: until`}
            />
          </div>
          <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-muted">
            <span className="pl-1">From</span>
            <span className="pl-1">Until (leave empty for one day)</span>
          </div>
        </div>
      ))}

      {rows.length < MAX_RANGES && (
        <button
          type="button"
          onClick={() => setRows((rs) => [...rs, { id: nextId.current++, start: "", end: "" }])}
          className="flex h-11 w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-[#efd6cc] font-display font-bold text-coral-deep transition hover:border-coral/60 hover:bg-blush/25"
        >
          <span aria-hidden className="text-lg leading-none">+</span> Add another stretch
        </button>
      )}
    </div>
  );
}
