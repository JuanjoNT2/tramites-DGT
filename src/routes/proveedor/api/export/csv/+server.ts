import type { RequestHandler } from './$types';
import { resolveDateRange } from '$lib/admin/dates';
import { requireProveedor } from '$lib/proveedor/access';
import { buildProveedorReport } from '$lib/server/proveedor-excel';

export const GET: RequestHandler = async ({ locals, url }) => {
	requireProveedor(locals);
	const range = resolveDateRange(url, 'month');
	const report = await buildProveedorReport(range);

	return new Response(report.csv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="${report.filename}.csv"`
		}
	});
};
