import { json, type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { DateRange } from '$lib/admin/types';
import { dueReportRange } from '$lib/proveedor/schedule';
import { getProveedorReportConfig, setProveedorReportConfig } from '$lib/server/proveedor-report';
import { buildProveedorReport } from '$lib/server/proveedor-excel';
import { sendProveedorExcelEmail } from '$lib/server/mailer';

/**
 * Cron diario de Vercel. Decide si hoy toca enviar según la frecuencia guardada
 * y solo actúa si el interruptor está activado.
 */
export const GET: RequestHandler = async ({ request }) => {
	const secret = env.CRON_SECRET?.trim();
	if (!secret) {
		return json({ error: 'CRON_SECRET no configurado' }, { status: 503 });
	}
	if (request.headers.get('authorization') !== `Bearer ${secret}`) {
		return json({ error: 'No autorizado' }, { status: 401 });
	}

	const config = await getProveedorReportConfig();
	if (!config.enabled) {
		return json({ ok: true, skipped: 'desactivado' });
	}

	const due = dueReportRange(config, new Date());
	if (!due) {
		return json({ ok: true, skipped: 'hoy no toca' });
	}

	const to = config.email || env.PROVEEDOR_NOTIFY_EMAIL?.trim().toLowerCase() || '';
	if (!to) {
		return json({ error: 'No hay email de destino configurado' }, { status: 400 });
	}

	const range: DateRange = {
		preset: 'day',
		startDate: due.startDate,
		endDate: due.endDate
	};
	const report = await buildProveedorReport(range);

	if (!report.total) {
		await setProveedorReportConfig({ lastSentAt: new Date().toISOString() });
		return json({ ok: true, skipped: 'sin distintivos en el periodo', range: due });
	}

	const sent = await sendProveedorExcelEmail({
		to,
		filename: `${report.filename}.xls`,
		xml: report.xml,
		rangeLabel: report.rangeLabel,
		total: report.total,
		automatico: true
	});

	if (!sent) {
		return json({ error: 'El proveedor de email rechazó el envío' }, { status: 502 });
	}

	await setProveedorReportConfig({ lastSentAt: new Date().toISOString() });
	return json({ ok: true, sent: report.total, to, range: due });
};
