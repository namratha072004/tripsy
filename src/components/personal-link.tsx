"use client";

import { useState } from "react";

// One row in the organiser's "Personal links" list: name, code, copy, WhatsApp.
export function PersonalLink({
  name,
  code,
  url,
  tripName,
}: {
  name: string;
  code: string;
  url: string;
  tripName: string;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "manual">("idle");
  const message = `Hey ${name}! Add your answers for "${tripName}" on Tripsy. This link is just for you, so don't share it: ${url} (your code: ${code})`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("manual");
    }
  };

  return (
    <li className="py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium">{name}</span>
        <span className="rounded-lg bg-lilac px-2 py-0.5 font-mono text-sm tracking-widest text-[#5b4a7a]">
          {code}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" onClick={copy} className="btn-ghost h-9 px-4 text-sm">
          {status === "copied" ? "Copied" : "Copy link"}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost h-9 px-4 text-sm"
        >
          Send on WhatsApp
        </a>
      </div>
      {status === "manual" && (
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          autoFocus
          className="field mt-2 text-xs"
          aria-label={`${name}'s personal link`}
        />
      )}
    </li>
  );
}
