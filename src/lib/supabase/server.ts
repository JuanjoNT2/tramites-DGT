import { createServerClient } from '@supabase/ssr';
import { env as publicEnv } from '$env/dynamic/public';
import type { Cookies } from '@sveltejs/kit';

export function createSupabaseServerClient(cookies: Cookies) {
	const url = publicEnv.PUBLIC_SUPABASE_URL;
	const anon = publicEnv.PUBLIC_SUPABASE_ANON_KEY;
	if (!url || !anon) return null;

	return createServerClient(url, anon, {
		cookies: {
			getAll: () => cookies.getAll(),
			setAll: (cookiesToSet) => {
				for (const { name, value, options } of cookiesToSet) {
					cookies.set(name, value, { ...options, path: '/' });
				}
			}
		}
	});
}
