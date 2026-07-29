import type { DayHours, OpeningHours, WeekDay } from '@/lib/types/database';

export const WEEKDAYS: { key: WeekDay; label: string; short: string }[] = [
  { key: 'monday', label: 'Monday', short: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday', label: 'Thursday', short: 'Thu' },
  { key: 'friday', label: 'Friday', short: 'Fri' },
  { key: 'saturday', label: 'Saturday', short: 'Sat' },
  { key: 'sunday', label: 'Sunday', short: 'Sun' },
];

export const DEFAULT_DAY_HOURS: DayHours = {
  open: '10:00',
  close: '22:00',
  closed: false,
};

export function to12Hour(time: string): string {
  if (!time) return '';
  const [hStr, mStr = '00'] = time.split(':');
  let h = parseInt(hStr, 10);
  if (Number.isNaN(h)) return time;
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${mStr.padStart(2, '0')} ${period}`;
}

/**
 * Collapses opening hours into the fewest human readable lines, e.g.
 * "Mon - Sun: 10:30 AM - 8:30 PM" when every day shares the same hours,
 * or grouped ranges like "Mon - Fri: 9 AM - 6 PM", "Sat - Sun: 10 AM - 8 PM".
 */
export function formatOpeningHours(hours: OpeningHours | null | undefined): string[] {
  if (!hours) return [];

  const entries = WEEKDAYS.map(({ key, short }) => {
    const day = hours[key];
    if (!day) return null;
    const label = day.closed ? 'Closed' : `${to12Hour(day.open)} - ${to12Hour(day.close)}`;
    return { short, label };
  }).filter(Boolean) as { short: string; label: string }[];

  if (entries.length === 0) return [];

  const lines: string[] = [];
  let start = 0;
  for (let i = 1; i <= entries.length; i++) {
    const prev = entries[i - 1];
    const curr = entries[i];
    if (!curr || curr.label !== prev.label) {
      const first = entries[start].short;
      const last = entries[i - 1].short;
      const rangeLabel = first === last ? first : `${first} - ${last}`;
      lines.push(`${rangeLabel}: ${entries[start].label}`);
      start = i;
    }
  }

  return lines;
}

export function isRestaurantOpenNow(hours: OpeningHours | null | undefined): boolean | null {
  if (!hours) return null;
  const now = new Date();
  const dayIndex = now.getDay(); // 0 = Sunday
  const key = WEEKDAYS[(dayIndex + 6) % 7].key; // shift so Monday = 0
  const day = hours[key];
  if (!day || day.closed) return day ? false : null;

  const [openH, openM] = day.open.split(':').map(Number);
  const [closeH, closeM] = day.close.split(':').map(Number);
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  if (closeMinutes <= openMinutes) {
    // overnight hours (e.g. 6pm - 2am)
    return minutesNow >= openMinutes || minutesNow < closeMinutes;
  }
  return minutesNow >= openMinutes && minutesNow < closeMinutes;
}
