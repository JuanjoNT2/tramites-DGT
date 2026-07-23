import PDFDocument from 'pdfkit';
import type { Solicitud } from '$lib/supabase/types';
import { SOLICITUD_TIPO_LABELS } from '$lib/supabase/types';

function flattenPayload(payload: Record<string, unknown>, prefix = ''): [string, string][] {
	const rows: [string, string][] = [];
	for (const [k, v] of Object.entries(payload)) {
		const key = prefix ? `${prefix}.${k}` : k;
		if (v != null && typeof v === 'object' && !Array.isArray(v)) {
			rows.push(...flattenPayload(v as Record<string, unknown>, key));
		} else if (Array.isArray(v)) {
			rows.push([key, v.map((x) => (typeof x === 'object' ? JSON.stringify(x) : String(x))).join('; ')]);
		} else {
			rows.push([key, v == null ? '' : String(v)]);
		}
	}
	return rows;
}

export async function buildSolicitudPdf(s: Solicitud): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		const doc = new PDFDocument({ margin: 48, size: 'A4' });
		const chunks: Buffer[] = [];
		doc.on('data', (c) => chunks.push(c));
		doc.on('end', () => resolve(Buffer.concat(chunks)));
		doc.on('error', reject);

		const tipoLabel = SOLICITUD_TIPO_LABELS[s.tipo] || s.tipo;

		doc.fillColor('#003050').fontSize(18).text('Solicitud de trámite', { align: 'left' });
		doc.moveDown(0.3);
		doc.fillColor('#5a6b7d').fontSize(11).text('Trámites DGT Online · Panel gestor');
		doc.moveDown();

		doc.fillColor('#1a2b3c').fontSize(10);
		doc.text(`ID: ${s.id}`);
		doc.text(`Tipo: ${tipoLabel}`);
		doc.text(`Estado: ${s.status}`);
		doc.text(`Email: ${s.email || '—'}`);
		doc.text(`Usuario: ${s.user_id || 'anónimo'}`);
		doc.text(`Fecha: ${new Date(s.created_at).toLocaleString('es-ES')}`);
		doc.moveDown();

		doc.fillColor('#003050').fontSize(14).text('Datos del formulario');
		doc.moveDown(0.4);
		doc.fillColor('#1a2b3c').fontSize(9);

		const fields = flattenPayload(s.payload || {});
		for (const [k, v] of fields) {
			if (k === 'tipo') continue;
			doc.text(`${k}: ${v}`, { width: 500 });
		}

		doc.end();
	});
}

/** Excel XML SpreadsheetML (abre en Excel/LibreOffice sin dependencia xlsx). */
export function toExcelXml(rows: Record<string, unknown>[]): string {
	if (!rows.length) {
		return `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Solicitudes"><Table></Table></Worksheet></Workbook>`;
	}
	const headers = Object.keys(rows[0]);
	const esc = (v: unknown) =>
		String(v ?? '')
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');

	const headerCells = headers.map((h) => `<Cell><Data ss:Type="String">${esc(h)}</Data></Cell>`).join('');
	const body = rows
		.map((row) => {
			const cells = headers
				.map((h) => {
					const val = row[h];
					const isNum = typeof val === 'number';
					return `<Cell><Data ss:Type="${isNum ? 'Number' : 'String'}">${esc(val)}</Data></Cell>`;
				})
				.join('');
			return `<Row>${cells}</Row>`;
		})
		.join('');

	return `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Solicitudes"><Table>
<Row>${headerCells}</Row>
${body}
</Table></Worksheet></Workbook>`;
}

export function solicitudToExportRow(s: Solicitud): Record<string, unknown> {
	const p = s.payload || {};
	return {
		id: s.id,
		tipo: s.tipo,
		status: s.status,
		email: s.email ?? '',
		user_id: s.user_id ?? '',
		created_at: s.created_at,
		matricula: p.matricula ?? '',
		nombre: p.nombre ?? p.full_name ?? '',
		telefono: p.telefono ?? '',
		payload_json: JSON.stringify(p)
	};
}
