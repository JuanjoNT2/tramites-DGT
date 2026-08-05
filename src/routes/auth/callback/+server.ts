import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { siteOrigin } from '$lib/auth/urls';

export const GET: RequestHandler = async ({ url, locals }) => {
	const code = url.searchParams.get('code');
	const next = url.searchParams.get('next') || '/';

	if (code && locals.supabase) {
		const { error } = await locals.supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			throw redirect(303, next.startsWith('/') ? next : '/');
		}
	}

	// Fallback token hash (legacy email links)
	const token_hash = url.searchParams.get('token_hash');
	const type = url.searchParams.get('type') as
		| 'signup'
		| 'email'
		| 'recovery'
		| 'invite'
		| null;
	if (token_hash && type && locals.supabase) {
		const { error } = await locals.supabase.auth.verifyOtp({ token_hash, type });
		if (!error) {
			const dest =
				type === 'recovery'
					? '/auth/actualizar-password'
					: type === 'invite'
						? '/registro?invite=1'
						: next.startsWith('/')
							? next
							: '/';
			throw redirect(303, dest);
		}
	}

	throw redirect(303, `/login?error=confirm&origin=${encodeURIComponent(siteOrigin())}`);
};
