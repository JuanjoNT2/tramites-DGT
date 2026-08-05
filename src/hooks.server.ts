import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import type { User } from '@supabase/supabase-js';
import { readSessionCookie, verifySessionToken } from '$lib/admin/auth';
import { isStaffRole } from '$lib/auth/roles';
import { joinPersonName } from '$lib/cuenta/profile-prefill';
import { getServiceSupabase } from '$lib/supabase/admin';
import { createSupabaseServerClient } from '$lib/supabase/server';
import type { Profile } from '$lib/supabase/types';
import { claimAnonymousSolicitudes } from '$lib/cuenta/data';

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

function metaStr(meta: Record<string, unknown>, key: string): string {
	const v = meta[key];
	return typeof v === 'string' ? v.trim() : '';
}

/** Si el perfil está incompleto pero Auth metadata tiene datos del registro, sincroniza. */
async function syncProfileFromUserMetadata(
	user: User,
	profile: Profile | null
): Promise<Profile | null> {
	const sb = getServiceSupabase();
	if (!sb) return profile;

	const meta = (user.user_metadata || {}) as Record<string, unknown>;
	const nombre = metaStr(meta, 'nombre');
	const apellido1 = metaStr(meta, 'apellido1');
	const apellido2 = metaStr(meta, 'apellido2');
	const telefono = metaStr(meta, 'telefono');
	const nif = metaStr(meta, 'nif').toUpperCase().replace(/[\s-]/g, '');
	const fullFromMeta = metaStr(meta, 'full_name') || joinPersonName(nombre, apellido1, apellido2);

	const needsNombre = !profile?.nombre?.trim() && !profile?.full_name?.trim() && (nombre || fullFromMeta);
	const needsTel = !profile?.telefono?.trim() && Boolean(telefono);
	const needsNif = !profile?.nif?.trim() && Boolean(nif);
	if (!needsNombre && !needsTel && !needsNif) return profile;

	const patch: Record<string, string> = {
		email: (user.email || profile?.email || '').toLowerCase()
	};
	if (needsNombre) {
		if (nombre) patch.nombre = nombre;
		if (apellido1) patch.apellido1 = apellido1;
		if (apellido2) patch.apellido2 = apellido2;
		if (fullFromMeta) patch.full_name = fullFromMeta;
	}
	if (needsTel) patch.telefono = telefono;
	if (needsNif) patch.nif = nif;

	const { data, error } = await sb
		.from('profiles')
		.upsert({ id: user.id, role: profile?.role || 'user', ...patch }, { onConflict: 'id' })
		.select('*')
		.maybeSingle();
	if (error) {
		console.error('[hooks] syncProfileFromUserMetadata', error.message);
		return profile;
	}
	return (data as Profile) || profile;
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
			let profile = await loadProfile(user.id);
			profile = await syncProfileFromUserMetadata(user, profile);
			event.locals.profile = profile;
			// Enlazar trámites hechos como invitado (una vez por sesión/cookie)
			if (!event.cookies.get('tdgt_claim')) {
				claimAnonymousSolicitudes(user.id, user.email)
					.then(() => {
						event.cookies.set('tdgt_claim', '1', {
							path: '/',
							maxAge: 60 * 60 * 24 * 30,
							httpOnly: true,
							sameSite: 'lax',
							secure: event.url.protocol === 'https:'
						});
					})
					.catch(() => null);
			}
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

	const isCuenta = path === '/cuenta' || path.startsWith('/cuenta/');
	if (isCuenta && !event.locals.user) {
		throw redirect(303, `/login?next=${encodeURIComponent(event.url.pathname + event.url.search)}`);
	}
	// Gestor/admin Auth no usan el área ciudadano (Mis vehículos, etc.)
	if (isCuenta && event.locals.user && isStaffRole(event.locals.profile?.role)) {
		const dest =
			path === '/cuenta/seguridad' || path.startsWith('/cuenta/seguridad/')
				? '/gestor/seguridad'
				: '/gestor';
		throw redirect(303, dest);
	}

	// Gestores no deben iniciar trámites de ciudadano ni usar la home pública como funnel
	const isStaff = Boolean(event.locals.user && isStaffRole(event.locals.profile?.role));
	if (isStaff) {
		const isHome = path === '/';
		const isTramitar = path === '/tramitar' || path.startsWith('/tramitar/');
		if (isHome || isTramitar) {
			throw redirect(303, '/gestor');
		}
	}

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};
