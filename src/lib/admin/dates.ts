import type { DatePreset, DateRange } from './types';

function pad(n: number) {
	return String(n).padStart(2, '0');
}

export function formatISO(d: Date): string {
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseDateParam(value: string | null): string | null {
	if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
	return value;
}

export function resolveDateRange(
	url: URL,
	fallback: DatePreset = 'month'
): DateRange {
	const presetParam = (url.searchParams.get('preset') || fallback) as DatePreset;
	const preset: DatePreset = ['day', 'week', 'month', 'year', 'custom'].includes(presetParam)
		? presetParam
		: fallback;

	const today = new Date();
	today.setHours(12, 0, 0, 0);

	let start = new Date(today);
	let end = new Date(today);

	if (preset === 'day') {
		// today only
	} else if (preset === 'week') {
		start.setDate(today.getDate() - 6);
	} else if (preset === 'month') {
		start.setDate(today.getDate() - 29);
	} else if (preset === 'year') {
		start.setFullYear(today.getFullYear() - 1);
		start.setDate(start.getDate() + 1);
	} else {
		const s = parseDateParam(url.searchParams.get('start'));
		const e = parseDateParam(url.searchParams.get('end'));
		if (s && e && s <= e) {
			return { preset: 'custom', startDate: s, endDate: e };
		}
		start.setDate(today.getDate() - 29);
	}

	return {
		preset,
		startDate: formatISO(start),
		endDate: formatISO(end)
	};
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
