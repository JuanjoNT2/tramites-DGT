import type { RequestHandler } from './$types';
import { requireGestor, fetchSolicitudById } from '$lib/gestor/access';
import { buildSolicitudPdf } from '$lib/gestor/export';

export const GET: RequestHandler = async ({ locals, url }) => {
	requireGestor(locals);
	const id = url.searchParams.get('id');
	if (!id) {
		return new Response('Falta id', { status: 400 });
	}
	const item = await fetchSolicitudById(id);
	const pdf = await buildSolicitudPdf(item);
	const filename = `solicitud-${item.tipo}-${id.slice(0, 8)}.pdf`;

	return new Response(new Uint8Array(pdf), {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `attachment; filename="${filename}"`
		}
	});
};
