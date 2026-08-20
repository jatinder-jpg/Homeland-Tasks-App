const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Deterministic "MMM D" formatter (e.g. "Aug 7") that doesn't depend on the
 * runtime's ICU data. toLocaleDateString("en-US", {...}) can render
 * differently on the server (Node's ICU build) vs the browser, causing
 * hydration mismatches even with an explicit locale.
 */
export function formatShortDate(date: Date): string {
  return `${MONTH_ABBR[date.getMonth()]} ${date.getDate()}`;
}

/** Deterministic "M/D/YYYY" formatter, same rationale as formatShortDate. */
export function formatNumericDate(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

/** Deterministic "M/D/YYYY, h:mm AM/PM" formatter, for activity/audit logs. */
export function formatDateTime(date: Date): string {
  const hours24 = date.getHours();
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${formatNumericDate(date)}, ${hours12}:${minutes} ${period}`;
}
