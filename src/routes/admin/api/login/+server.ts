import { redirect } from '@sveltejs/kit';
import {
	createSessionToken,
	sessionCookieHeader,
	verifyAdminPassword
} from '$lib/admin/auth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const form = await request.formData();
	const password = String(form.get('password') || '');
	const nextRaw = String(form.get('next') || '/admin');
	const next = nextRaw.startsWith('/admin') ? nextRaw : '/admin';

	if (!verifyAdminPassword(password)) {
		throw redirect(303, `/admin/login?error=1&next=${encodeURIComponent(next)}`);
	}

	const token = createSessionToken();
	return new Response(null, {
		status: 303,
		headers: {
			Location: next,
			'Set-Cookie': sessionCookieHeader(token)
		}
	});
};
