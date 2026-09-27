// The group is in India, so all times are entered and shown in IST.
const IST = "Asia/Kolkata";

// "2026-10-10T20:00" (from <input type="datetime-local">) → Date, read as IST.
export function fromIstInput(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const d = new Date(`${value}:00+05:30`);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Date → "2026-10-10T20:00" in IST, for prefilling datetime-local inputs.
export function toIstInput(d: Date): string {
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 16);
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso)) + " IST";
}

export function formatDay(ymd: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
  }).format(new Date(ymd + "T00:00:00Z"));
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount)}`;
  }
}

// "8 Oct" for a single day, otherwise "8 Oct{sep}12 Oct".
export function dayRange(start: string, end: string, sep: string): string {
  return start === end ? formatDay(start) : `${formatDay(start)}${sep}${formatDay(end)}`;
}
