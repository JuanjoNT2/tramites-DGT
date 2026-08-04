import PDFDocument from 'pdfkit';
import type { Solicitud } from '$lib/supabase/types';
import { SOLICITUD_STATUS_LABELS, SOLICITUD_TIPO_LABELS } from '$lib/supabase/types';
import type { SolicitudStatus } from '$lib/supabase/types';
import { payloadFieldsForDisplay, type PayloadFieldRow } from '$lib/gestor/payload-display';

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

export function toExcelXml(rows: Record<string, unknown>[], sheetName = 'Solicitudes'): string {
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
	const safeSheet = sheetName.replace(/[^\wáéíóúÁÉÍÓÚñÑ -]/gi, '').slice(0, 31) || 'Datos';
	return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="${xmlEscape(safeSheet)}">
  <Table>
   <Row>${header}</Row>
   ${body}
  </Table>
 </Worksheet>
</Workbook>`;
}

/** Excel de una sola solicitud: filas Campo / Valor legibles. */
export function buildSolicitudExcelXml(s: Solicitud): string {
	const tipoLabel = SOLICITUD_TIPO_LABELS[s.tipo] || s.tipo;
	const statusLabel = SOLICITUD_STATUS_LABELS[s.status as SolicitudStatus] || s.status;
	const fields = payloadFieldsForDisplay((s.payload || {}) as Record<string, unknown>);

	const rows: Record<string, unknown>[] = [
		{ Campo: 'Tipo de trámite', Valor: tipoLabel },
		{ Campo: 'Estado', Valor: statusLabel },
		{ Campo: 'Email de la solicitud', Valor: s.email || '—' },
		{ Campo: 'ID solicitud', Valor: s.id },
		{ Campo: 'Fecha de alta', Valor: new Date(s.created_at).toLocaleString('es-ES') },
		{ Campo: 'ID usuario', Valor: s.user_id || 'No registrado' },
		...fields.map((f) => ({ Campo: f.label, Valor: f.value }))
	];

	return toExcelXml(rows, 'Trámite');
}

type PdfDoc = InstanceType<typeof PDFDocument>;

function sectionTitle(doc: PdfDoc, title: string) {
	doc.moveDown(0.6);
	doc.fillColor('#003050').fontSize(12).font('Helvetica-Bold').text(title);
	doc.moveDown(0.25);
	const y = doc.y;
	doc
		.strokeColor('#00c6d1')
		.lineWidth(1.5)
		.moveTo(doc.page.margins.left, y)
		.lineTo(doc.page.margins.left + 72, y)
		.stroke();
	doc.moveDown(0.45);
	doc.font('Helvetica').fillColor('#1a2b3c');
}

function ensureSpace(doc: PdfDoc, needed = 48) {
	const bottom = doc.page.height - doc.page.margins.bottom;
	if (doc.y + needed > bottom) {
		doc.addPage();
	}
}

function drawFieldRows(doc: PdfDoc, rows: PayloadFieldRow[]) {
	const left = doc.page.margins.left;
	const usable = doc.page.width - doc.page.margins.left - doc.page.margins.right;
	const labelW = Math.min(200, usable * 0.38);
	const valueW = usable - labelW - 8;
	const valueX = left + labelW + 8;

	for (const row of rows) {
		ensureSpace(doc, 28);
		const startY = doc.y;
		doc.font('Helvetica-Bold').fontSize(9).fillColor('#5a6b7d');
		doc.text(row.label, left, startY, { width: labelW });
		const labelH = doc.heightOfString(row.label, { width: labelW });
		doc.font('Helvetica').fontSize(10).fillColor('#1a2b3c');
		doc.text(row.value || '—', valueX, startY, { width: valueW });
		const valueH = doc.heightOfString(row.value || '—', { width: valueW });
		doc.y = startY + Math.max(labelH, valueH) + 6;
		doc
			.strokeColor('#e8eef3')
			.lineWidth(0.5)
			.moveTo(left, doc.y - 2)
			.lineTo(left + usable, doc.y - 2)
			.stroke();
	}
}

function groupFields(fields: PayloadFieldRow[]): { title: string; rows: PayloadFieldRow[] }[] {
	const buckets: { title: string; keys: string[] }[] = [
		{
			title: 'Vehículo',
			keys: [
				'tipoVehiculo',
				'matricula',
				'bastidor',
				'marca',
				'modelo',
				'combustible',
				'cilindrada',
				'fechaMatricula'
			]
		},
		{
			title: 'Operación',
			keys: [
				'fechaVenta',
				'ccaaId',
				'precioVenta',
				'motivoTransferencia',
				'facturaEmpresa',
				'incluirInforme',
				'liquidarItp',
				'rol'
			]
		},
		{
			title: 'Interviniente',
			keys: [
				'nombre',
				'apellido1',
				'apellido2',
				'nif',
				'email',
				'telefono',
				'otraParteEmail',
				'sexo',
				'fechaNacimiento'
			]
		},
		{
			title: 'Dirección de envío',
			keys: [
				'provincia',
				'municipio',
				'localidad',
				'pueblo',
				'tipoVia',
				'direccion',
				'numero',
				'piso',
				'puerta',
				'bloque',
				'escalera',
				'cp',
				'tipoEnvio'
			]
		},
		{
			title: 'Presupuesto y pago',
			keys: [
				'priceLines',
				'total',
				'amount',
				'precioBase',
				'factorCorreccion',
				'fuenteDepreciacion',
				'docsAttached'
			]
		}
	];

	const used = new Set<string>();
	const sections: { title: string; rows: PayloadFieldRow[] }[] = [];

	for (const b of buckets) {
		const precise =
			b.title === 'Presupuesto y pago'
				? fields.filter(
						(f) =>
							b.keys.includes(f.key) ||
							f.key.startsWith('breakdown.') ||
							f.key.startsWith('metaFiscal.') ||
							f.key.startsWith('pago.')
					)
				: fields.filter((f) => b.keys.includes(f.key));

		if (!precise.length) continue;
		for (const r of precise) used.add(r.key);
		sections.push({ title: b.title, rows: precise });
	}

	const rest = fields.filter((f) => !used.has(f.key));
	if (rest.length) sections.push({ title: 'Otros datos', rows: rest });
	return sections;
}

export async function buildSolicitudPdf(s: Solicitud): Promise<Buffer> {
	const doc = new PDFDocument({
		margin: 48,
		size: 'A4',
		bufferPages: true,
		info: {
			Title: `Solicitud ${s.id.slice(0, 8)}`,
			Author: 'Trámites DGT Online — Panel gestor'
		}
	});
	const chunks: Buffer[] = [];
	doc.on('data', (c) => chunks.push(c as Buffer));

	const done = new Promise<Buffer>((resolve, reject) => {
		doc.on('end', () => resolve(Buffer.concat(chunks)));
		doc.on('error', reject);
	});

	const tipoLabel = SOLICITUD_TIPO_LABELS[s.tipo] || s.tipo;
	const statusLabel = SOLICITUD_STATUS_LABELS[s.status as SolicitudStatus] || s.status;
	const fields = payloadFieldsForDisplay((s.payload || {}) as Record<string, unknown>);
	const sections = groupFields(fields);
	const pageW = doc.page.width;

	// Cabecera
	doc.rect(0, 0, pageW, 72).fill('#003050');
	doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(16);
	doc.text('Trámites DGT Online', 48, 22, { width: pageW - 96 });
	doc.font('Helvetica').fontSize(10).fillColor('#9fd8e8');
	doc.text('Ficha de solicitud para gestión', 48, 44, { width: pageW - 96 });
	doc.y = 90;

	doc.fillColor('#003050').font('Helvetica-Bold').fontSize(18).text(tipoLabel);
	doc.moveDown(0.35);
	doc.font('Helvetica').fontSize(10).fillColor('#5a6b7d');
	doc.text(`Estado: ${statusLabel}`);
	doc.text(`Fecha: ${new Date(s.created_at).toLocaleString('es-ES')}`);
	doc.text(`Email: ${s.email || '—'}`);
	doc.text(`Referencia: ${s.id}`);

	for (const section of sections) {
		ensureSpace(doc, 56);
		sectionTitle(doc, section.title);
		drawFieldRows(doc, section.rows);
	}

	const range = doc.bufferedPageRange();
	for (let i = range.start; i < range.start + range.count; i++) {
		doc.switchToPage(i);
		doc
			.fontSize(8)
			.fillColor('#8a9bab')
			.text(
				`Página ${i - range.start + 1} de ${range.count} · Uso interno gestor · ${new Date().toLocaleDateString('es-ES')}`,
				48,
				doc.page.height - 36,
				{ width: pageW - 96, align: 'center' }
			);
	}

	doc.end();
	return done;
}
