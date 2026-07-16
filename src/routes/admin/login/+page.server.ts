import { redirect } from '@sveltejs/kit';
import { readSessionCookie, verifySessionToken } from '$lib/admin/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ request, url }) => {
	const token = readSessionCookie(request.headers.get('cookie'));
	if (verifySessionToken(token)) {
		throw redirect(303, url.searchParams.get('next') || '/admin');
	}
	return {
		next: url.searchParams.get('next') || '/admin',
		error: url.searchParams.get('error')
	};
};
