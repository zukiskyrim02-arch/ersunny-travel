const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** 2026-10-22 → 22 October 2026. Other text is left unchanged. */
export function formatDisplayDate(value: string | undefined | null): string {
  const raw = String(value ?? "").trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (!match) return raw;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return raw;
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

/** 07:30 or 19:05 → 07:30 AM or 07:05 PM. Other text is left unchanged. */
export function formatDisplayTime(value: string | undefined | null): string {
  const raw = String(value ?? "").trim();
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?(?:\s*([ap])\.?m\.?)?$/i.exec(raw);
  if (!match) return raw;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || minutes > 59) return raw;
  const suffix = match[3]?.toLowerCase();
  if (suffix) {
    if (hours < 1 || hours > 12) return raw;
    if (suffix === "p" && hours < 12) hours += 12;
    if (suffix === "a" && hours === 12) hours = 0;
  } else if (hours > 23) {
    return raw;
  }
  const period = hours >= 12 ? "PM" : "AM";
  let hour12 = hours % 12;
  if (hour12 === 0) hour12 = 12;
  return `${String(hour12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}`;
}
