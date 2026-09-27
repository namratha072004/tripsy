import type { Fit } from "@/lib/types";

const STYLES: Record<Fit, { bg: string; icon: string; label: string }> = {
  good: { bg: "bg-[#ddeedd] text-[#2f5e36]", icon: "✓", label: "Works" },
  stretch: { bg: "bg-[#fbebc8] text-[#6e4b0c]", icon: "!", label: "Stretch" },
  no: { bg: "bg-[#f8d5d0] text-[#8a2f25]", icon: "✕", label: "Doesn't fit" },
};

export function FitChip({ fit, name }: { fit: Fit; name: string }) {
  const s = STYLES[fit];
  return (
    <div
      className={`flex min-w-0 flex-1 flex-col items-center rounded-2xl px-1 py-2 text-xs ${s.bg}`}
      title={`${name}: ${s.label}`}
    >
      <span aria-hidden className="text-base font-bold leading-none">
        {s.icon}
      </span>
      <span className="mt-1 w-full truncate text-center">{name}</span>
      <span className="sr-only">{s.label}</span>
    </div>
  );
}

export function FitLegend() {
  return (
    <p className="hint flex flex-wrap gap-x-4">
      <span>✓ works</span>
      <span>! a stretch</span>
      <span>✕ doesn&apos;t fit</span>
    </p>
  );
}
