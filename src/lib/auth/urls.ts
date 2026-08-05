import { env as publicEnv } from '$env/dynamic/public';

export function siteOrigin(): string {
	return (publicEnv.PUBLIC_SITE_ORIGIN || 'https://tramitesdgtonline.com').replace(/\/$/, '');
}

/** Origen del request actual (mejor para auth en preview Vercel). */
export function requestOrigin(url: URL): string {
	return url.origin.replace(/\/$/, '');
}

export function authCallbackUrl(url: URL, next = '/'): string {
	const n = next.startsWith('/') ? next : '/';
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
