import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';

const COOKIE = 'tdgt_admin_session';
const MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days
const WEAK_PASSWORDS = new Set(['admin', 'password', '123456', 'changeme']);

function isProduction(): boolean {
	return (
		process.env.NODE_ENV === 'production' ||
		process.env.VERCEL_ENV === 'production' ||
		process.env.VERCEL_ENV === 'preview'
	);
}

function assertProdSecretsConfigured(): void {
	if (!isProduction()) return;
	if (!env.ADMIN_PASSWORD || WEAK_PASSWORDS.has(env.ADMIN_PASSWORD) || env.ADMIN_PASSWORD.length < 12) {
		throw new Error(
			'ADMIN_PASSWORD debe estar definido en producción/preview (≥12 chars, no trivial).'
		);
	}
	if (!env.ADMIN_SESSION_SECRET || env.ADMIN_SESSION_SECRET.length < 32) {
		throw new Error(
			'ADMIN_SESSION_SECRET debe estar definido en producción/preview (≥32 chars).'
		);
	}
}

function secret(): string {
	assertProdSecretsConfigured();
	if (env.ADMIN_SESSION_SECRET) return env.ADMIN_SESSION_SECRET;
	if (env.ADMIN_PASSWORD) return env.ADMIN_PASSWORD;
	// Solo desarrollo local
	return 'dev-admin-secret-change-me';
}

function expectedPassword(): string {
	assertProdSecretsConfigured();
	if (env.ADMIN_PASSWORD) return env.ADMIN_PASSWORD;
	// Solo desarrollo local
	return 'admin';
}

export function verifyAdminPassword(password: string): boolean {
	try {
		const expected = expectedPassword();
		const a = Buffer.from(password);
		const b = Buffer.from(expected);
		if (a.length !== b.length) return false;
		return timingSafeEqual(a, b);
	} catch {
		return false;
	}
}

export function createSessionToken(): string {
	const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
	const payload = `admin:${exp}`;
	const sig = createHmac('sha256', secret()).update(payload).digest('hex');
	return `${payload}.${sig}`;
}

export function verifySessionToken(token: string | undefined): boolean {
	if (!token) return false;
	try {
		const [payload, sig] = token.split('.');
		if (!payload || !sig) return false;
		const expected = createHmac('sha256', secret()).update(payload).digest('hex');
		const ok = timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
		if (!ok) return false;
		const exp = Number(payload.split(':')[1]);
		if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
		return true;
	} catch {
		return false;
	}
}

export function sessionCookieHeader(token: string): string {
	const secure = isProduction() ? '; Secure' : '';
	return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_SEC}${secure}`;
}

export function clearSessionCookieHeader(): string {
	return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function readSessionCookie(cookieHeader: string | null): string | undefined {
	if (!cookieHeader) return undefined;
	const match = cookieHeader.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${COOKIE}=`));
	return match?.slice(COOKIE.length + 1);
}

export { COOKIE as ADMIN_COOKIE };
