import { env } from '$env/dynamic/private';
import type { SupabaseClient } from '@supabase/supabase-js';

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

	const url = (env.SUPABASE_URL || env.PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
	const key = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
	if (!url || !key) return { exists: false, source: null };

	// GoTrue admin: filtro por email (si el proyecto lo soporta)
	try {
		const res = await fetch(`${url}/auth/v1/admin/users?email=${encodeURIComponent(normalized)}`, {
			headers: {
				Authorization: `Bearer ${key}`,
				apikey: key
			}
		});
		if (res.ok) {
			const body = (await res.json()) as { users?: { id?: string; email?: string }[]; id?: string };
			if (Array.isArray(body.users)) {
				const hit = body.users.some((u) => (u.email || '').toLowerCase() === normalized);
				if (hit) return { exists: true, source: 'auth' };
			} else if (body.id) {
				return { exists: true, source: 'auth' };
			}
		}
	} catch (e) {
		console.error('[authEmailExists] admin users lookup', e);
	}

	return { exists: false, source: null };
}
