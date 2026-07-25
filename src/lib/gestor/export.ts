import PDFDocument from 'pdfkit';
import type { Solicitud } from '$lib/supabase/types';
import { SOLICITUD_STATUS_LABELS, SOLICITUD_TIPO_LABELS } from '$lib/supabase/types';
import type { SolicitudStatus } from '$lib/supabase/types';

function flattenPayload(payload: Record<string, unknown>, prefix = ''): [string, string][] {
	const rows: [string, string][] = [];
	for (const [k, v] of Object.entries(payload)) {
		if (k === 'accessToken' || k === 'raw') continue;
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

export function solicitudToExportRow(s: Solicitud): Record<string, unknown> {
	const payload = (s.payload || {}) as Record<string, unknown>;
	return {
		id: s.id,
		tipo: SOLICITUD_TIPO_LABELS[s.tipo] || s.tipo,
		status: SOLICITUD_STATUS_LABELS[s.status as SolicitudStatus] || s.status,
		email: s.email || '',
		user_id: s.user_id || '',
		matricula: String(payload.matricula || ''),
		nombre: String(payload.nombre || ''),
		telefono: String(payload.telefono || ''),
		created_at: s.created_at,
		total: String(payload.total ?? payload.amount ?? '')
	};
}

function xmlEscape(v: unknown): string {
	return String(v ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

export function toExcelXml(rows: Record<string, unknown>[]): string {
	if (!rows.length) {
		return '<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"></Workbook>';
	}
	const keys = Object.keys(rows[0]);
	const header = keys.map((k) => `<Cell><Data ss:Type="String">${xmlEscape(k)}</Data></Cell>`).join('');
	const body = rows
		.map((row) => {
			const cells = keys
				.map((k) => `<Cell><Data ss:Type="String">${xmlEscape(row[k])}</Data></Cell>`)
				.join('');
			return `<Row>${cells}</Row>`;
		})
		.join('');
	return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Solicitudes">
  <Table>
   <Row>${header}</Row>
   ${body}
  </Table>
 </Worksheet>
</Workbook>`;
}

export async function buildSolicitudPdf(s: Solicitud): Promise<Buffer> {
	const doc = new PDFDocument({ margin: 48 });
	const chunks: Buffer[] = [];
	doc.on('data', (c) => chunks.push(c as Buffer));

	const done = new Promise<Buffer>((resolve, reject) => {
		doc.on('end', () => resolve(Buffer.concat(chunks)));
		doc.on('error', reject);
	});

	const tipoLabel = SOLICITUD_TIPO_LABELS[s.tipo] || s.tipo;
	doc.fillColor('#003050').fontSize(18).text('Solicitud de trámite', { align: 'left' });
	doc.moveDown(0.5);
	doc.fillColor('#1a2b3c').fontSize(11);
	doc.text(`Tipo: ${tipoLabel}`);
	doc.text(`Estado: ${SOLICITUD_STATUS_LABELS[s.status as SolicitudStatus] || s.status}`);
	doc.text(`Email: ${s.email || '—'}`);
	doc.text(`ID: ${s.id}`);
	doc.text(`Fecha: ${new Date(s.created_at).toLocaleString('es-ES')}`);
	doc.moveDown();
	doc.fontSize(13).fillColor('#003050').text('Datos');
	doc.moveDown(0.3);
	doc.fontSize(10).fillColor('#1a2b3c');
	for (const [k, v] of flattenPayload((s.payload || {}) as Record<string, unknown>)) {
		doc.text(`${k}: ${v}`);
	}
	doc.end();
	return done;
}
