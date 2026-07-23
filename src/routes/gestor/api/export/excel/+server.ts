import type { RequestHandler } from './$types';
import { requireGestor, fetchSolicitudes } from '$lib/gestor/access';
import { solicitudToExportRow, toExcelXml } from '$lib/gestor/export';

export const GET: RequestHandler = async ({ locals, url }) => {
	requireGestor(locals);
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
