import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';

const COOKIE = 'tdgt_admin_session';
const MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days

function secret(): string {
	return env.ADMIN_SESSION_SECRET || env.ADMIN_PASSWORD || 'dev-admin-secret-change-me';
}

function expectedPassword(): string {
	return env.ADMIN_PASSWORD || 'admin';
}

export function verifyAdminPassword(password: string): boolean {
	const expected = expectedPassword();
	const a = Buffer.from(password);
	const b = Buffer.from(expected);
	if (a.length !== b.length) return false;
	return timingSafeEqual(a, b);
}

export function createSessionToken(): string {
	const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
	const payload = `admin:${exp}`;
	const sig = createHmac('sha256', secret()).update(payload).digest('hex');
	return `${payload}.${sig}`;
}

export function verifySessionToken(token: string | undefined): boolean {
	if (!token) return false;
	const [payload, sig] = token.split('.');
	if (!payload || !sig) return false;
	const expected = createHmac('sha256', secret()).update(payload).digest('hex');
	try {
		const ok = timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
		if (!ok) return false;
	} catch {
		return false;
	}
	const exp = Number(payload.split(':')[1]);
	if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
	return true;
}

export function sessionCookieHeader(token: string): string {
	const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
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
