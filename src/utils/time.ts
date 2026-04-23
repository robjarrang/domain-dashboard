export type Staleness = 'fresh' | 'warning' | 'stale';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const WARNING_AGE = 24 * HOUR;
const STALE_AGE = 72 * HOUR;

export function getStaleness(lastChecked: string | Date, now: Date = new Date()): Staleness {
  const then = typeof lastChecked === 'string' ? new Date(lastChecked) : lastChecked;
  const age = now.getTime() - then.getTime();
  if (age >= STALE_AGE) return 'stale';
  if (age >= WARNING_AGE) return 'warning';
  return 'fresh';
}

export function formatRelativeTime(lastChecked: string | Date, now: Date = new Date()): string {
  const then = typeof lastChecked === 'string' ? new Date(lastChecked) : lastChecked;
  const diff = now.getTime() - then.getTime();
  if (Number.isNaN(diff)) return 'unknown';
  if (diff < 45 * 1000) return 'just now';
  if (diff < 90 * 1000) return '1 minute ago';
  if (diff < HOUR) return `${Math.round(diff / MINUTE)} minutes ago`;
  if (diff < 2 * HOUR) return '1 hour ago';
  if (diff < DAY) return `${Math.round(diff / HOUR)} hours ago`;
  if (diff < 2 * DAY) return '1 day ago';
  if (diff < 30 * DAY) return `${Math.round(diff / DAY)} days ago`;
  if (diff < 365 * DAY) return `${Math.round(diff / (30 * DAY))} months ago`;
  return `${Math.round(diff / (365 * DAY))} years ago`;
}

export function stalenessClasses(staleness: Staleness): string {
  switch (staleness) {
    case 'stale':
      return 'text-red-700 bg-red-50 ring-1 ring-red-600/10';
    case 'warning':
      return 'text-amber-700 bg-amber-50 ring-1 ring-amber-600/10';
    case 'fresh':
    default:
      return 'text-deep-teal bg-ice-white ring-1 ring-deep-teal/10';
  }
}
