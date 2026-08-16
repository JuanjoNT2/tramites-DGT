import { SITE_ORIGIN } from '$lib/seo/site';

export const prerender = true;

export function GET() {
const body = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /gestor
Disallow: /cuenta
Disallow: /pago
Disallow: /login
Disallow: /registro
Disallow: /auth
Disallow: /api

Sitemap: ${SITE_ORIGIN}/sitemap.xml
`;
	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
}
