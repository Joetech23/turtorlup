// Timezone-safe date helpers. All display formatting uses the organisation's
// timezone so server and browser render identical strings (no hydration drift).

export const APP_TZ = "Europe/London";

function partsIn(date: Date, tz: string) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
  });
  const out: Record<string, string> = {};
  for (const p of fmt.formatToParts(date)) out[p.type] = p.value;
  return {
    year: Number(out.year),
    month: Number(out.month),
    day: Number(out.day),
    hour: Number(out.hour),
    minute: Number(out.minute),
    second: Number(out.second),
    weekday: out.weekday,
  };
}

function tzOffsetMs(date: Date, tz: string) {
  const p = partsIn(date, tz);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** Midnight today in the given timezone, as a Date. */
export function startOfToday(tz = APP_TZ, now = new Date()) {
  const p = partsIn(now, tz);
  return zoned(p.year, p.month - 1, p.day, 0, 0, tz);
}

/** Build a Date for a wall-clock time in a timezone. */
export function zoned(year: number, monthIndex: number, day: number, hour: number, minute: number, tz = APP_TZ) {
  const guess = new Date(Date.UTC(year, monthIndex, day, hour, minute));
  const off = tzOffsetMs(guess, tz);
  const result = new Date(guess.getTime() - off);
  // correct around DST changes
  const off2 = tzOffsetMs(result, tz);
  return off2 === off ? result : new Date(guess.getTime() - off2);
}

/** Wall-clock time `dayOffset` days from the anchor date. */
export function atDay(anchor: Date, dayOffset: number, hour = 0, minute = 0, tz = APP_TZ) {
  const p = partsIn(anchor, tz);
  return zoned(p.year, p.month - 1, p.day + dayOffset, hour, minute, tz);
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
/** 0 = Monday ... 6 = Sunday, in the given timezone. */
export function weekdayIndex(date: Date, tz = APP_TZ) {
  return WEEKDAYS.indexOf(partsIn(date, tz).weekday);
}

export function dayKey(date: Date | string, tz = APP_TZ) {
  const p = partsIn(new Date(date), tz);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

export function hourOf(date: Date | string, tz = APP_TZ) {
  const p = partsIn(new Date(date), tz);
  return p.hour + p.minute / 60;
}

export function monthKey(date: Date | string, tz = APP_TZ) {
  return dayKey(date, tz).slice(0, 7);
}

const cache = new Map<string, Intl.DateTimeFormat>();
function f(opts: Intl.DateTimeFormatOptions) {
  const key = JSON.stringify(opts);
  let fmt = cache.get(key);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat("en-GB", { timeZone: APP_TZ, ...opts });
    cache.set(key, fmt);
  }
  return fmt;
}

export const fmt = {
  date: (d: string | Date) => f({ day: "numeric", month: "short", year: "numeric" }).format(new Date(d)),
  short: (d: string | Date) => f({ day: "numeric", month: "short" }).format(new Date(d)),
  weekdayShort: (d: string | Date) => f({ weekday: "short", day: "numeric", month: "short" }).format(new Date(d)),
  weekdayLong: (d: string | Date) => f({ weekday: "long", day: "numeric", month: "long" }).format(new Date(d)),
  time: (d: string | Date) => f({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(d)),
  dateTime: (d: string | Date) =>
    f({ day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(d)),
  month: (d: string | Date) => f({ month: "short", year: "2-digit" }).format(new Date(d)),
  monthLong: (d: string | Date) => f({ month: "long", year: "numeric" }).format(new Date(d)),
};

/** "3 days ago", "in 2 hours" relative to a reference time. */
export function relative(d: string | Date, now: Date = new Date()) {
  const diff = new Date(d).getTime() - now.getTime();
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60000);
  const hours = Math.round(abs / 3600000);
  const days = Math.round(abs / 86400000);
  let s: string;
  if (mins < 1) return "just now";
  if (mins < 60) s = `${mins} min`;
  else if (hours < 24) s = `${hours} hr`;
  else if (days < 30) s = `${days} day${days === 1 ? "" : "s"}`;
  else s = `${Math.round(days / 30)} mo`;
  return diff < 0 ? `${s} ago` : `in ${s}`;
}

export const DAY_MS = 86400000;
