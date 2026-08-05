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
	const base = `${requestOrigin(url)}/auth/callback`;
	return `${base}?next=${encodeURIComponent(n)}`;
}

export function passwordRecoveryRedirect(url: URL): string {
	return authCallbackUrl(url, '/auth/actualizar-password');
}

/** Invitación Auth: tras aceptar el enlace, el usuario elige contraseña. */
export function inviteUserRedirect(url: URL): string {
	return authCallbackUrl(url, '/auth/actualizar-password');
}
