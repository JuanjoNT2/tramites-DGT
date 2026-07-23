import type { RequestHandler } from './$types';
import { toCsv } from '$lib/admin/export-csv';
import { requireGestor, fetchSolicitudes } from '$lib/gestor/access';
import { solicitudToExportRow } from '$lib/gestor/export';

export const GET: RequestHandler = async ({ locals, url }) => {
	requireGestor(locals);
	const tipo = url.searchParams.get('tipo') || 'todos';
	const items = await fetchSolicitudes(tipo);
	const rows = items.map(solicitudToExportRow);
	const csv = toCsv(rows);
	const filename = `solicitudes-${tipo}-${new Date().toISOString().slice(0, 10)}.csv`;

	return new Response(csv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="${filename}"`
		}
	});
};
