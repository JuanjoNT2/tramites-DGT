import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { readSessionCookie, verifySessionToken } from '$lib/admin/auth';

/** Aliases legacy → URLs SEO oficiales (sin clonar WordPress) */
const REDIRECTS: Record<string, string> = {
	'/etiqueta-medioambiental': '/distintivo-medioambiental',
	'/informe-vehiculo-dgt': '/informe-trafico',
	'/duplicado-carnet': '/duplicado-de-carnet-de-conducir',
	'/cancelacion-reserva-dominio': '/cancelacion-de-reserva-de-dominio',
	'/legal/privacidad': '/politica-de-privacidad',
	'/legal/cookies': '/politica-de-cookies',
	'/legal/aviso-legal': '/aviso-legal'
};

export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname.replace(/\/$/, '') || '/';
	const target = REDIRECTS[path];
	if (target) throw redirect(301, target);

	const isAdmin = path === '/admin' || path.startsWith('/admin/');
	const isLogin = path === '/admin/login';
	const isAdminApiAuth =
		path === '/admin/api/login' || path === '/admin/api/logout';

	if (isAdmin && !isLogin && !isAdminApiAuth) {
		const token = readSessionCookie(event.request.headers.get('cookie'));
		if (!verifySessionToken(token)) {
			const next = encodeURIComponent(event.url.pathname + event.url.search);
			throw redirect(303, `/admin/login?next=${next}`);
		}
		event.locals.admin = true;
	}

	return resolve(event);
};
