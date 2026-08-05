import { redirect, type RequestHandler } from '@sveltejs/kit';

function failKind(type: string | null, next: string): 'recovery' | 'invite' | 'confirm' {
	if (type === 'recovery' || next.includes('actualizar-password')) return 'recovery';
	if (type === 'invite' || next.includes('invite=1')) return 'invite';
	return 'confirm';
}

function successDest(type: string | null, next: string): string {
	if (type === 'recovery' || next.includes('actualizar-password')) {
		return '/auth/actualizar-password';
	}
	if (type === 'invite' || next.includes('invite=1')) return '/registro?invite=1';
	if (next.startsWith('/')) return next;
	if (type === 'signup' || type === 'email') return '/cuenta';
	return '/cuenta';
}

export const GET: RequestHandler = async ({ url, locals }) => {
	const code = url.searchParams.get('code');
	const token_hash = url.searchParams.get('token_hash');
	const type = url.searchParams.get('type');
	const nextRaw = url.searchParams.get('next') || '';
	const next = nextRaw.startsWith('/') ? nextRaw : '';

	// Sin params en la query: los tokens pueden ir en el hash (#access_token=…).
	// Un redirect 303 del servidor perdería el hash → página HTML que lo conserva.
	if (!code && !token_hash) {
		const qs = url.search ? url.search : '';
		const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"/><title>Validando…</title></head>
<body>
<p style="font-family:sans-serif;text-align:center;margin-top:3rem;color:#003050">Validando enlace…</p>
<script>
(function () {
  var hash = location.hash || '';
  var qs = ${JSON.stringify(qs)};
  if (hash.indexOf('access_token') !== -1) {
    location.replace('/auth/callback/client' + qs + hash);
    return;
  }
  location.replace('/login?error=confirm');
})();
</script>
</body>
</html>`;
		return new Response(html, {
			headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }
		});
	}

	if (!locals.supabase) {
		throw redirect(303, `/login?error=${failKind(type, next)}`);
	}

	if (code) {
		const { error } = await locals.supabase.auth.exchangeCodeForSession(code);
		if (error) {
			console.error('[auth/callback] exchangeCodeForSession', error.message);
			throw redirect(303, `/login?error=${failKind(type, next)}`);
		}
		throw redirect(303, successDest(type, next));
	}

	const otpType = type as 'signup' | 'email' | 'recovery' | 'invite' | 'magiclink';
	const { error } = await locals.supabase.auth.verifyOtp({
		token_hash: token_hash!,
		type: otpType
	});
	if (error) {
		console.error('[auth/callback] verifyOtp', type, error.message);
		throw redirect(303, `/login?error=${failKind(type, next)}`);
	}
	throw redirect(303, successDest(type, next));
};
