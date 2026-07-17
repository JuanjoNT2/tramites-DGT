import type { DailyAggregate, StoredEvent } from './store';
import { isConversionEvent } from './validate';

/** Modelado: del crudo a agregados diarios por canal / page_type / evento. */
export function buildDailyAggregates(events: StoredEvent[]): DailyAggregate[] {
	type Acc = {
		day: string;
		channel: string;
		page_type: string;
		event_name: string;
		event_count: number;
		visitors: Set<string>;
		sessions: Set<string>;
		conversions: number;
	};

	const map = new Map<string, Acc>();

	for (const ev of events) {
		const day = (ev.ts || ev.received_at).slice(0, 10);
		const channel = ev.channel || 'Direct';
		const page_type = String(ev.props?.page_type || 'other');
		const event_name = ev.event;
		const key = `${day}|${channel}|${page_type}|${event_name}`;
		let acc = map.get(key);
		if (!acc) {
			acc = {
				day,
				channel,
				page_type,
				event_name,
				event_count: 0,
				visitors: new Set(),
				sessions: new Set(),
				conversions: 0
			};
			map.set(key, acc);
		}
		acc.event_count += 1;
		acc.visitors.add(ev.visitor_id);
		acc.sessions.add(ev.session_id);
		if (ev.is_conversion || isConversionEvent(ev.event)) acc.conversions += 1;
	}

	return [...map.values()].map((a) => ({
		day: a.day,
		channel: a.channel,
		page_type: a.page_type,
		event_name: a.event_name,
		event_count: a.event_count,
		users: a.visitors.size,
		sessions: a.sessions.size,
		conversions: a.conversions
	}));
}

export async function recomputeDailyForRange(
	store: {
		queryRaw: (o: { start: string; end: string }) => Promise<StoredEvent[]>;
		upsertDaily: (rows: DailyAggregate[]) => Promise<void>;
	},
	start: string,
	end: string
) {
	const raw = await store.queryRaw({ start, end });
	const daily = buildDailyAggregates(raw);
	await store.upsertDaily(daily);
	return daily;
}
