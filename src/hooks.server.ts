import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

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
	return resolve(event);
};
