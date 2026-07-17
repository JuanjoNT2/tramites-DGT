import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import type {
	AnalyticsStore,
	DailyAggregate,
	ExternalDailyRow,
	StoredEvent
} from './store';

function client(): SupabaseClient | null {
	const url = env.SUPABASE_URL;
	const key = env.SUPABASE_SERVICE_ROLE_KEY;
	if (!url || !key) return null;
	return createClient(url, key, { auth: { persistSession: false } });
}

export function createSupabaseStore(): AnalyticsStore | null {
	const sb = client();
	if (!sb) return null;

	return {
		async appendRaw(event) {
			const { error } = await sb.from('analytics_events').insert({
				id: event.id,
				event_name: event.event,
				visitor_id: event.visitor_id,
				session_id: event.session_id,
				consent: event.consent,
				ts: event.ts,
				received_at: event.received_at,
				channel: event.channel,
				is_conversion: event.is_conversion,
				props: event.props || {},
				acquisition: event.acquisition || {}
			});
			if (error) throw error;
		},

		async queryRaw({ start, end, limit = 50000 }) {
			const { data, error } = await sb
				.from('analytics_events')
				.select('*')
				.gte('ts', start + 'T00:00:00.000Z')
				.lte('ts', end + 'T23:59:59.999Z')
				.order('ts', { ascending: true })
				.limit(limit);
			if (error) throw error;
			return (data || []).map(rowToStored);
		},

		async upsertDaily(rows) {
			if (!rows.length) return;
			const { error } = await sb.from('analytics_daily').upsert(
				rows.map((r) => ({
					day: r.day,
					channel: r.channel,
					page_type: r.page_type,
					event_name: r.event_name,
					event_count: r.event_count,
					users: r.users,
					sessions: r.sessions,
					conversions: r.conversions
				})),
				{ onConflict: 'day,channel,page_type,event_name' }
			);
			if (error) throw error;
		},

		async queryDaily({ start, end }) {
			const { data, error } = await sb
				.from('analytics_daily')
				.select('*')
				.gte('day', start)
				.lte('day', end);
			if (error) throw error;
			return (data || []).map((r) => ({
				day: r.day,
				channel: r.channel,
				page_type: r.page_type,
				event_name: r.event_name,
				event_count: Number(r.event_count),
				users: Number(r.users),
				sessions: Number(r.sessions),
				conversions: Number(r.conversions)
			}));
		},

		async upsertExternal(rows) {
			if (!rows.length) return;
			const { error } = await sb.from('analytics_external_daily').upsert(
				rows.map((r) => ({
					source: r.source,
					day: r.day,
					channel: r.channel,
					metrics: r.metrics,
					updated_at: r.updated_at
				})),
				{ onConflict: 'source,day,channel' }
			);
			if (error) throw error;
		},

		async queryExternal({ source, start, end }) {
			let q = sb
				.from('analytics_external_daily')
				.select('*')
				.gte('day', start)
				.lte('day', end);
			if (source) q = q.eq('source', source);
			const { data, error } = await q;
			if (error) throw error;
			return (data || []).map((r) => ({
				source: r.source,
				day: r.day,
				channel: r.channel,
				metrics: r.metrics,
				updated_at: r.updated_at
			}));
		}
	};
}

function rowToStored(r: Record<string, unknown>): StoredEvent {
	return {
		id: String(r.id),
		event: String(r.event_name),
		visitor_id: String(r.visitor_id),
		session_id: String(r.session_id),
		consent: r.consent === 'denied' ? 'denied' : 'granted',
		ts: String(r.ts),
		received_at: String(r.received_at),
		channel: String(r.channel || 'Direct'),
		is_conversion: Boolean(r.is_conversion),
		props: (r.props as Record<string, unknown>) || {},
		acquisition: (r.acquisition as Record<string, unknown>) || {}
	};
}
