import { redirect, type RequestHandler } from '@sveltejs/kit';

/**
 * Los enlaces con token_hash/code NO se consumen aquí (Gmail los precarga).
 * Se reenvían a /auth/verificar, donde el usuario pulsa Continuar.
 */
export const GET: RequestHandler = async ({ url }) => {
	const code = url.searchParams.get('code');
	const token_hash = url.searchParams.get('token_hash');

	if (code || token_hash) {
		throw redirect(303, `/auth/verificar?${url.searchParams.toString()}`);
	}

	// Tokens en el hash (#access_token): página HTML que conserva el hash
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
};
