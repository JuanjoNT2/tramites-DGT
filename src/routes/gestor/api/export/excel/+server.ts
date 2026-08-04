import type { RequestHandler } from './$types';
import { requireGestor, fetchSolicitudById, fetchSolicitudes } from '$lib/gestor/access';
import { buildSolicitudExcelXml, solicitudToExportRow, toExcelXml } from '$lib/gestor/export';

export const GET: RequestHandler = async ({ locals, url }) => {
	requireGestor(locals);

	const id = url.searchParams.get('id');
	if (id) {
		const item = await fetchSolicitudById(id);
		const xml = buildSolicitudExcelXml(item);
		const filename = `tramite-${item.tipo}-${id.slice(0, 8)}.xls`;
		return new Response(xml, {
			headers: {
				'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
				'Content-Disposition': `attachment; filename="${filename}"`
			}
		});
	}

	const tipo = url.searchParams.get('tipo') || 'todos';
	const items = await fetchSolicitudes(tipo);
	const rows = items.map(solicitudToExportRow);
	const xml = toExcelXml(rows);
	const filename = `solicitudes-${tipo}-${new Date().toISOString().slice(0, 10)}.xls`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
			'Content-Disposition': `attachment; filename="${filename}"`
		}
	});
};
