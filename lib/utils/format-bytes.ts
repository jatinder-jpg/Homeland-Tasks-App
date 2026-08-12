const UNITS = ["B", "KB", "MB", "GB", "TB"];

export const STORAGE_QUOTA_BYTES = 5 * 1024 ** 3;

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0B";
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), UNITS.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${exponent === 0 ? value : value.toFixed(2)}${UNITS[exponent]}`;
}
