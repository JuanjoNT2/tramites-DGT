import { env } from '$env/dynamic/private';
import type { SupabaseClient, User } from '@supabase/supabase-js';

function adminAuthUrl(): { url: string; key: string } | null {
	const url = (env.SUPABASE_URL || env.PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
	const key = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
	if (!url || !key) return null;
	return { url, key };
}

export async function getAuthUserByEmail(email: string): Promise<User | null> {
	const normalized = email.trim().toLowerCase();
	if (!normalized) return null;
	const auth = adminAuthUrl();
	if (!auth) return null;

	try {
		const res = await fetch(
			`${auth.url}/auth/v1/admin/users?email=${encodeURIComponent(normalized)}`,
			{
				headers: {
					Authorization: `Bearer ${auth.key}`,
					apikey: auth.key
				}
			}
		);
		if (!res.ok) return null;
		const body = (await res.json()) as { users?: User[]; id?: string } & Partial<User>;
		if (Array.isArray(body.users)) {
			return body.users.find((u) => (u.email || '').toLowerCase() === normalized) ?? null;
		}
		if (body.id && (body.email || '').toLowerCase() === normalized) {
			return body as User;
		}
	} catch (e) {
		console.error('[getAuthUserByEmail]', e);
	}
	return null;
}

/**
 * Comprueba si el email ya está en Auth o en profiles (cuenta o invitación previa).
 */
export async function authEmailExists(
	sb: SupabaseClient,
	email: string
): Promise<{ exists: boolean; source: 'profile' | 'auth' | null }> {
	const normalized = email.trim().toLowerCase();
	if (!normalized) return { exists: false, source: null };

	const { data: profile } = await sb
		.from('profiles')
		.select('id')
		.ilike('email', normalized)
		.limit(1)
		.maybeSingle();
	if (profile?.id) return { exists: true, source: 'profile' };

	const user = await getAuthUserByEmail(normalized);
	if (user?.id) return { exists: true, source: 'auth' };
	return { exists: false, source: null };
}
