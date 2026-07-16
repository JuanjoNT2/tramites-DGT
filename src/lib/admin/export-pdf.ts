import PDFDocument from 'pdfkit';
import type { ChannelRow, DateRange, EventRow, OverviewMetrics } from './types';

export async function buildReportPdf(opts: {
	range: DateRange;
	overview: OverviewMetrics;
	channels: ChannelRow[];
	events: EventRow[];
}): Promise<Buffer> {
	const { range, overview, channels, events } = opts;

	return new Promise((resolve, reject) => {
		const doc = new PDFDocument({ margin: 48, size: 'A4' });
		const chunks: Buffer[] = [];
		doc.on('data', (c) => chunks.push(c));
		doc.on('end', () => resolve(Buffer.concat(chunks)));
		doc.on('error', reject);

		doc.fillColor('#003050').fontSize(20).text('Informe de analítica', { align: 'left' });
		doc.moveDown(0.3);
		doc.fillColor('#5a6b7d').fontSize(11).text('Trámites DGT Online · Estilo GA4');
		doc.text(`Periodo: ${range.startDate} → ${range.endDate} (${range.preset})`);
		doc.text(`Fuente métricas: ${overview.source === 'ga4' ? 'GA4 live' : 'Demo'}`);
		doc.moveDown();

		doc.fillColor('#003050').fontSize(14).text('KPIs generales');
		doc.moveDown(0.4);
		doc.fillColor('#1a2b3c').fontSize(10);
		const kpis = [
			['Usuarios activos', overview.activeUsers],
			['Sesiones', overview.sessions],
			['Vistas', overview.screenPageViews],
			['Sesiones engaged', overview.engagedSessions],
			['Conversiones', overview.conversions],
			['Eventos', overview.eventCount],
			['Engagement rate', `${(overview.engagementRate * 100).toFixed(1)}%`]
		];
		for (const [label, value] of kpis) {
			doc.text(`${label}: ${value}`);
		}

		doc.moveDown();
		doc.fillColor('#003050').fontSize(14).text('Canales de adquisición (top)');
		doc.moveDown(0.4);
		doc.fillColor('#1a2b3c').fontSize(9);
		for (const c of channels.slice(0, 8)) {
			doc.text(
				`${c.channel} — sesiones ${c.sessions}, usuarios ${c.users}, conversiones ${c.conversions}`
			);
		}

		doc.moveDown();
		doc.fillColor('#003050').fontSize(14).text('Conversiones / eventos clave');
		doc.moveDown(0.4);
		doc.fillColor('#1a2b3c').fontSize(9);
		const conversions = events.filter((e) => e.isConversion);
		const list = conversions.length ? conversions : events.slice(0, 5);
		for (const e of list) {
			doc.text(
				`${e.eventName}${e.isConversion ? ' (conv)' : ''} — ${e.eventCount} eventos, ${e.users} usuarios`
			);
		}

		doc.moveDown(1.5);
		doc.fillColor('#8896a6').fontSize(8).text(`Generado ${new Date().toISOString()}`);
		doc.end();
	});
}
