import { clearSessionCookieHeader } from '$lib/admin/auth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async () => {
	return new Response(null, {
		status: 303,
		headers: {
			Location: '/admin/login',
			'Set-Cookie': clearSessionCookieHeader()
		}
	});
};
