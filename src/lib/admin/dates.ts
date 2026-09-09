import type { DatePreset, DateRange } from './types';

const PRESETS: DatePreset[] = ['day', 'week', 'month', 'year'];

function pad(n: number) {
	return String(n).padStart(2, '0');
}

export function formatISO(d: Date): string {
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function atNoon(d: Date): Date {
	const x = new Date(d);
	x.setHours(12, 0, 0, 0);
	return x;
}

function parseISODate(value: string): Date | null {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
	const d = new Date(`${value}T12:00:00`);
	return Number.isNaN(d.getTime()) ? null : d;
}

export function parseDateParam(value: string | null): string | null {
	if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
	return value;
}

function lastDayOfMonth(year: number, month1to12: number): Date {
	return atNoon(new Date(year, month1to12, 0));
}

export function isoWeekParts(d: Date): { year: number; week: number } {
	const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
	const dayNum = t.getUTCDay() || 7;
	t.setUTCDate(t.getUTCDate() + 4 - dayNum);
	const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
	const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
	return { year: t.getUTCFullYear(), week };
}

export function toIsoWeekValue(isoDate: string): string {
	const d = parseISODate(isoDate);
	if (!d) return isoDate;
	const { year, week } = isoWeekParts(d);
	return `${year}-W${pad(week)}`;
}

function startOfIsoWeek(year: number, week: number): Date {
	const jan4 = atNoon(new Date(year, 0, 4));
	const day = jan4.getDay() || 7;
	const monday = new Date(jan4);
	monday.setDate(jan4.getDate() - day + 1 + (week - 1) * 7);
	return monday;
}

function endOfIsoWeek(year: number, week: number): Date {
	const start = startOfIsoWeek(year, week);
	const end = new Date(start);
	end.setDate(start.getDate() + 6);
	return end;
}

function parseWeek(value: string): { year: number; week: number } | null {
	const m = value.match(/^(\d{4})-W(\d{2})$/i);
	if (!m) return null;
	const year = Number(m[1]);
	const week = Number(m[2]);
	if (week < 1 || week > 53) return null;
	return { year, week };
}

function parseMonth(value: string): { year: number; month: number } | null {
	const m = value.match(/^(\d{4})-(\d{2})/);
	if (!m) return null;
	const year = Number(m[1]);
	const month = Number(m[2]);
	if (month < 1 || month > 12) return null;
	return { year, month };
}

function parseYear(value: string): number | null {
	if (!/^\d{4}$/.test(value)) return null;
	const y = Number(value);
	if (y < 2000 || y > 2100) return null;
	return y;
}

type Bound = 'start' | 'end';

export function boundFromParam(
	value: string | null,
	preset: DatePreset,
	which: Bound
): Date | null {
	if (!value) return null;
	const trimmed = value.trim();

	if (preset === 'year') {
		const y =
			parseYear(trimmed) ??
			parseISODate(trimmed)?.getFullYear() ??
			parseMonth(trimmed)?.year ??
			parseWeek(trimmed)?.year ??
			null;
		if (!y) return null;
		return which === 'start' ? atNoon(new Date(y, 0, 1)) : atNoon(new Date(y, 11, 31));
	}

	if (preset === 'month') {
		const fromDate = parseISODate(trimmed);
		const ym = fromDate
			? { year: fromDate.getFullYear(), month: fromDate.getMonth() + 1 }
			: parseMonth(trimmed);
		if (!ym) return null;
		return which === 'start'
			? atNoon(new Date(ym.year, ym.month - 1, 1))
			: lastDayOfMonth(ym.year, ym.month);
	}

	if (preset === 'week') {
		const w = parseWeek(trimmed);
		if (w) {
			return which === 'start' ? startOfIsoWeek(w.year, w.week) : endOfIsoWeek(w.year, w.week);
		}
		const d = parseISODate(trimmed);
		if (!d) return null;
		const parts = isoWeekParts(d);
		return which === 'start'
			? startOfIsoWeek(parts.year, parts.week)
			: endOfIsoWeek(parts.year, parts.week);
	}

	return parseISODate(trimmed);
}

function defaultRange(preset: DatePreset, today: Date): { start: Date; end: Date } {
	const t = atNoon(today);
	if (preset === 'day') {
		return { start: new Date(t), end: new Date(t) };
	}
	if (preset === 'week') {
		const { year, week } = isoWeekParts(t);
		const end = endOfIsoWeek(year, week);
		const start = startOfIsoWeek(year, week);
		start.setDate(start.getDate() - 21);
		return { start, end };
	}
	if (preset === 'month') {
		const end = lastDayOfMonth(t.getFullYear(), t.getMonth() + 1);
		const start = atNoon(new Date(t.getFullYear(), t.getMonth() - 1, 1));
		return { start, end };
	}
	return {
		start: atNoon(new Date(t.getFullYear() - 1, 0, 1)),
		end: atNoon(new Date(t.getFullYear(), 11, 31))
	};
}

export function normalizePreset(value: string | null | undefined, fallback: DatePreset = 'month'): DatePreset {
	if (value === 'custom') return 'day';
	if (value && PRESETS.includes(value as DatePreset)) return value as DatePreset;
	return fallback;
}

export function resolveDateRange(url: URL, fallback: DatePreset = 'month'): DateRange {
	const preset = normalizePreset(url.searchParams.get('preset'), fallback);
	const today = atNoon(new Date());

	let start = boundFromParam(url.searchParams.get('start'), preset, 'start');
	let end = boundFromParam(url.searchParams.get('end'), preset, 'end');

	if (!start || !end) {
		const fallbackRange = defaultRange(preset, today);
		start = start ?? fallbackRange.start;
		end = end ?? fallbackRange.end;
	}

	if (formatISO(start) > formatISO(end)) {
		const swappedStart = formatISO(end);
		const swappedEnd = formatISO(start);
		start = boundFromParam(swappedStart, preset, 'start') ?? end;
		end = boundFromParam(swappedEnd, preset, 'end') ?? start;
	}

	return {
		preset,
		startDate: formatISO(start),
		endDate: formatISO(end)
	};
}

export function formatRangeLabel(range: DateRange): string {
	const start = parseISODate(range.startDate);
	const end = parseISODate(range.endDate);
	if (!start || !end) return `${range.startDate} → ${range.endDate}`;

	if (range.preset === 'year') {
		const a = start.getFullYear();
		const b = end.getFullYear();
		return a === b ? String(a) : `${a} → ${b}`;
	}

	if (range.preset === 'month') {
		const fmt = new Intl.DateTimeFormat('es-ES', { month: 'long' });
		const a = `${fmt.format(start)} ${start.getFullYear()}`;
		const b = `${fmt.format(end)} ${end.getFullYear()}`;
		return a === b ? a : `${a} → ${b}`;
	}

	if (range.preset === 'week') {
		const sa = isoWeekParts(start);
		const sb = isoWeekParts(end);
		const la = `sem. ${sa.week} ${sa.year}`;
		const lb = `sem. ${sb.week} ${sb.year}`;
		return la === lb ? la : `${la} → ${lb}`;
	}

	const fmt = new Intl.DateTimeFormat('es-ES', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric'
	});
	return range.startDate === range.endDate
		? fmt.format(start)
		: `${fmt.format(start)} → ${fmt.format(end)}`;
}

export function daysInRange(range: DateRange): number {
	const a = new Date(range.startDate + 'T12:00:00');
	const b = new Date(range.endDate + 'T12:00:00');
	return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000) + 1);
}

export function rangeQuery(range: DateRange): string {
	const p = new URLSearchParams({
		preset: range.preset,
		start: range.startDate,
		end: range.endDate
	});
	return p.toString();
}
