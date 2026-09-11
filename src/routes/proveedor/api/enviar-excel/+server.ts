import { json, type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { resolveDateRange } from '$lib/admin/dates';
import { requireProveedor } from '$lib/proveedor/access';
import { getProveedorReportConfig } from '$lib/server/proveedor-report';
import { buildProveedorReport } from '$lib/server/proveedor-excel';
import { sendProveedorExcelEmail } from '$lib/server/mailer';

/** Envío manual: usa el rango que el proveedor tiene en pantalla. */
export const POST: RequestHandler = async ({ request, locals, url }) => {
	requireProveedor(locals);

	let body: { preset?: string; start?: string; end?: string } = {};
	try {
		body = await request.json();
	} catch {
		/* sin cuerpo: se usa el rango por defecto */
	}

	const rangeUrl = new URL(url.origin);
	if (body.preset) rangeUrl.searchParams.set('preset', body.preset);
	if (body.start) rangeUrl.searchParams.set('start', body.start);
	if (body.end) rangeUrl.searchParams.set('end', body.end);
	const range = resolveDateRange(rangeUrl, 'month');

	const config = await getProveedorReportConfig();
	const to =
		config.email || env.PROVEEDOR_NOTIFY_EMAIL?.trim().toLowerCase() || locals.user?.email || '';
	if (!to) {
		return json({ error: 'No hay email de destino configurado.' }, { status: 400 });
	}

	const report = await buildProveedorReport(range);
	if (!report.total) {
		return json({ error: 'No hay distintivos en el periodo seleccionado.' }, { status: 400 });
	}

	const sent = await sendProveedorExcelEmail({
		to,
		filename: `${report.filename}.xls`,
		xml: report.xml,
		rangeLabel: report.rangeLabel,
		total: report.total
	});

	if (!sent) {
		return json({ error: 'El proveedor de email rechazó el envío.' }, { status: 502 });
	}

	return json({
		ok: true,
		message: `Excel enviado a ${to} con ${report.total} distintivos (${report.rangeLabel}).`
	});
};
