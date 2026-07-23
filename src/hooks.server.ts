import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { readSessionCookie, verifySessionToken } from '$lib/admin/auth';
import { isStaffRole } from '$lib/auth/roles';
import { getServiceSupabase } from '$lib/supabase/admin';
import { createSupabaseServerClient } from '$lib/supabase/server';
import type { Profile } from '$lib/supabase/types';

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

async function loadProfile(userId: string): Promise<Profile | null> {
	const sb = getServiceSupabase();
	if (!sb) return null;
	const { data, error } = await sb.from('profiles').select('*').eq('id', userId).maybeSingle();
	if (error || !data) return null;
	return data as Profile;
}

export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname.replace(/\/$/, '') || '/';
	const target = REDIRECTS[path];
	if (target) throw redirect(301, target);

	event.locals.supabase = createSupabaseServerClient(event.cookies);
	event.locals.session = null;
	event.locals.user = null;
	event.locals.profile = null;

	if (event.locals.supabase) {
		const {
			data: { user }
		} = await event.locals.supabase.auth.getUser();
		event.locals.user = user;
		if (user) {
			const {
				data: { session }
			} = await event.locals.supabase.auth.getSession();
			event.locals.session = session;
			event.locals.profile = await loadProfile(user.id);
		}
	}

	const isAdmin = path === '/admin' || path.startsWith('/admin/');
	const isLogin = path === '/admin/login';
	const isAdminApiAuth = path === '/admin/api/login' || path === '/admin/api/logout';

	if (isAdmin && !isLogin && !isAdminApiAuth) {
		const token = readSessionCookie(event.request.headers.get('cookie'));
		if (!verifySessionToken(token)) {
			const next = encodeURIComponent(event.url.pathname + event.url.search);
			throw redirect(303, `/admin/login?next=${next}`);
		}
		event.locals.admin = true;
	}

	const isGestor = path === '/gestor' || path.startsWith('/gestor/');
	if (isGestor) {
		if (!event.locals.user || !isStaffRole(event.locals.profile?.role)) {
			throw redirect(303, `/login?next=${encodeURIComponent(event.url.pathname)}`);
		}
	}

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};
