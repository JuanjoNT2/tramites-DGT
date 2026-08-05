import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
	const code = url.searchParams.get('code');
	const nextRaw = url.searchParams.get('next') || '/';
	const next = nextRaw.startsWith('/') ? nextRaw : '/';
	const token_hash = url.searchParams.get('token_hash');
	const type = url.searchParams.get('type') as
		| 'signup'
		| 'email'
		| 'recovery'
		| 'invite'
		| 'magiclink'
		| null;

	const isRecovery =
		type === 'recovery' || next.includes('actualizar-password') || next.includes('seguridad');
	const isInvite = type === 'invite' || next.includes('invite=1');

	function failRedirect(kind: 'recovery' | 'invite' | 'confirm') {
		throw redirect(303, `/login?error=${kind}`);
	}

	if (!locals.supabase) {
		failRedirect(isRecovery ? 'recovery' : isInvite ? 'invite' : 'confirm');
	}

	const sb = locals.supabase!;

	if (code) {
		const { error } = await sb.auth.exchangeCodeForSession(code);
		if (!error) {
			throw redirect(303, next);
		}
		console.error('[auth/callback] exchangeCodeForSession', error.message);
		failRedirect(isRecovery ? 'recovery' : isInvite ? 'invite' : 'confirm');
	}

	if (token_hash && type) {
		const { error } = await sb.auth.verifyOtp({ token_hash, type });
		if (!error) {
			const dest =
				type === 'recovery'
					? next.includes('actualizar-password')
						? next
						: '/auth/actualizar-password'
					: type === 'invite'
						? '/registro?invite=1'
						: next;
			throw redirect(303, dest);
		}
		console.error('[auth/callback] verifyOtp', type, error.message);
		failRedirect(type === 'recovery' ? 'recovery' : type === 'invite' ? 'invite' : 'confirm');
	}

	// Sin code/token en la query: posible enlace con tokens en el hash (#access_token=…)
	// Lo resuelve el cliente en +page.svelte
	return {
		next,
		isRecovery,
		isInvite,
		needsClient: true as const
	};
};
