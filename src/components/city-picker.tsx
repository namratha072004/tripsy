"use client";

import { useState } from "react";
import { HOME_CITIES } from "@/lib/places";

const OTHER = "__other__";

// Dropdown of common home cities, with "Other…" to type any city.
export function CityPicker({ name, label }: { name: string; label: string }) {
  const [choice, setChoice] = useState("");

  if (choice === OTHER) {
    return (
      <div className="relative">
        <input
          name={name}
          className="field pr-9"
          placeholder="Type your city"
          aria-label={label}
          maxLength={60}
          autoFocus
        />
        <button
          type="button"
          onClick={() => setChoice("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-1.5 text-sm text-muted hover:text-coral-deep"
          aria-label="Back to the city list"
        >
          ↺
        </button>
      </div>
    );
  }

  return (
    <select
      name={name}
      value={choice}
      onChange={(e) => setChoice(e.target.value)}
      className={`field appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1.5l5 5 5-5' stroke='%23b9533f' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")] bg-[length:12px_8px] bg-[right_1rem_center] bg-no-repeat pr-9 ${choice ? "" : "text-[#b39a93]"}`}
      aria-label={label}
    >
      <option value="">Home city</option>
      {HOME_CITIES.map((c) => (
        <option key={c} value={c} className="text-ink">
          {c}
        </option>
      ))}
      <option value={OTHER} className="text-ink">
        Other…
      </option>
    </select>
  );
}
