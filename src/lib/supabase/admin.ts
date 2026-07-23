import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

let cached: SupabaseClient | null | undefined;

/** Cliente privilegiado (service role). Solo en servidor. */
export function getServiceSupabase(): SupabaseClient | null {
	if (cached !== undefined) return cached;
	const url = env.SUPABASE_URL || env.PUBLIC_SUPABASE_URL;
	const key = env.SUPABASE_SERVICE_ROLE_KEY;
	if (!url || !key) {
		cached = null;
		return null;
	}
	cached = createClient(url, key, {
		auth: { persistSession: false, autoRefreshToken: false }
	});
	return cached;
}
