import { env as publicEnv } from '$env/dynamic/public';

export function siteOrigin(): string {
	return (publicEnv.PUBLIC_SITE_ORIGIN || 'https://tramitesdgtonline.com').replace(/\/$/, '');
}

/** Origen del request actual (mejor para auth en preview Vercel). */
export function requestOrigin(url: URL): string {
	return url.origin.replace(/\/$/, '');
}

/**
 * Destino post-login seguro (ruta relativa).
 * Rechaza home, auth y URLs externas; vacío = sin preferencia.
 */
export function safePostLoginNext(nextRaw: string | null | undefined): string {
	const next = (nextRaw || '').trim();
	if (!next.startsWith('/') || next.startsWith('//')) return '';
	if (next === '/') return '';
	if (
		next.startsWith('/login') ||
		next.startsWith('/registro') ||
		next.startsWith('/recuperar-password') ||
		next.startsWith('/auth')
	) {
		return '';
	}
	return next;
}

/** Enlace a /login conservando la página actual (p. ej. un trámite). */
export function loginUrl(currentPathWithSearch: string, email?: string): string {
	const params = new URLSearchParams();
	const next = safePostLoginNext(currentPathWithSearch);
	if (next) params.set('next', next);
	if (email) params.set('email', email.trim().toLowerCase());
	const q = params.toString();
	return q ? `/login?${q}` : '/login';
}

export function authCallbackUrl(url: URL, next = '/'): string {
	// Incluye /auth/* (recovery, etc.); no usar safePostLoginNext aquí.
	const n = next.startsWith('/') && !next.startsWith('//') ? next : '/';
	// Misma origen desde la que se pide el email (dev/preview/prod),
	// con fallback al dominio canónico.
	const origin = requestOrigin(url) || siteOrigin();
	return `${origin}/auth/callback?next=${encodeURIComponent(n)}`;
}

export function passwordRecoveryRedirect(url: URL): string {
	return authCallbackUrl(url, '/auth/actualizar-password');
}

/** Invitación Auth: tras aceptar el enlace, completar registro (datos + contraseña). */
export function inviteUserRedirect(url: URL): string {
	return authCallbackUrl(url, '/registro?invite=1');
}
