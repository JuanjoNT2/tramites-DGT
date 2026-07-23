import { createBrowserClient } from '@supabase/ssr';
import { env } from '$env/dynamic/public';

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowser() {
	const url = env.PUBLIC_SUPABASE_URL;
	const anon = env.PUBLIC_SUPABASE_ANON_KEY;
	if (!url || !anon) return null;
	if (!browserClient) {
		browserClient = createBrowserClient(url, anon);
	}
	return browserClient;
}
