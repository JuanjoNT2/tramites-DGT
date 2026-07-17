import { env } from '$env/dynamic/private';
import type { AnalyticsStore } from './store';
import { createFileStore } from './store-file';
import { createSupabaseStore } from './store-supabase';

let cached: AnalyticsStore | null = null;

/** Fuente de verdad propia: Supabase si hay credenciales; si no, ficheros en .data/analytics. */
export function getAnalyticsStore(): AnalyticsStore {
	if (cached) return cached;
	const sb = createSupabaseStore();
	cached = sb || createFileStore();
	return cached;
}

export function analyticsStoreMode(): 'supabase' | 'file' {
	return env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY ? 'supabase' : 'file';
}
