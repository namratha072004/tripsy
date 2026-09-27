// Date + time picked separately: <input type="datetime-local"> is fiddly on
// several browsers. The server joins them as "YYYY-MM-DDTHH:MM" (IST).
const TIMES = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  const m = i % 2 ? "30" : "00";
  const h12 = Math.floor(i / 2) % 12 || 12;
  return { value: `${h}:${m}`, label: `${h12}:${m} ${i < 24 ? "am" : "pm"}` };
});

export function DeadlineFields({
  id,
  label,
  defaultValue,
}: {
  id: string;
  label: string;
  defaultValue: string; // "YYYY-MM-DDTHH:MM"
}) {
  const [date, time] = defaultValue.split("T");
  const rounded = `${time.slice(0, 2)}:${Number(time.slice(3, 5)) >= 30 ? "30" : "00"}`;
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <div className="grid grid-cols-2 gap-2">
        <input id={id} name="deadline_date" type="date" className="field" defaultValue={date} required />
        <select name="deadline_time" className="field" defaultValue={rounded} aria-label="Time">
          {TIMES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
