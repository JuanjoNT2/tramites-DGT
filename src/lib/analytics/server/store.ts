import type { IncomingEvent } from './validate';
import { isConversionEvent } from './validate';

export type StoredEvent = IncomingEvent & {
	id: string;
	received_at: string;
	channel: string;
	is_conversion: boolean;
};

export type DailyAggregate = {
	day: string;
	channel: string;
	page_type: string;
	event_name: string;
	event_count: number;
	users: number;
	sessions: number;
	conversions: number;
};

export type ExternalDailyRow = {
	source: 'search_console' | 'google_ads' | 'meta_ads';
	day: string;
	channel: string;
	metrics: Record<string, number | string>;
	updated_at: string;
};

export interface AnalyticsStore {
	appendRaw(event: StoredEvent): Promise<void>;
	queryRaw(opts: {
		start: string;
		end: string;
		limit?: number;
	}): Promise<StoredEvent[]>;
	upsertDaily(rows: DailyAggregate[]): Promise<void>;
	queryDaily(opts: { start: string; end: string }): Promise<DailyAggregate[]>;
	upsertExternal(rows: ExternalDailyRow[]): Promise<void>;
	queryExternal(opts: {
		source?: ExternalDailyRow['source'];
		start: string;
		end: string;
	}): Promise<ExternalDailyRow[]>;
}

export function toStoredEvent(ev: IncomingEvent): StoredEvent {
	const channel = String(ev.acquisition?.channel || 'Direct');
	return {
		...ev,
		id: crypto.randomUUID(),
		received_at: new Date().toISOString(),
		channel,
		is_conversion: isConversionEvent(ev.event)
	};
}
