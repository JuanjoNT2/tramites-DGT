import type { RequestHandler } from './$types';
import { toCsv } from '$lib/admin/export-csv';
import { requireGestor, fetchSolicitudes } from '$lib/gestor/access';
import { exportFilename, parseGestorExportFilter } from '$lib/gestor/export-filters';
import { solicitudToExportRow } from '$lib/gestor/export';

export const GET: RequestHandler = async ({ locals, url }) => {
	requireGestor(locals);
	const filter = parseGestorExportFilter(url);
	const items = await fetchSolicitudes(filter);
	const rows = items.map(solicitudToExportRow);
	const csv = toCsv(rows);

	return new Response(csv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="${exportFilename(filter, 'csv')}"`
		}
	});
};
