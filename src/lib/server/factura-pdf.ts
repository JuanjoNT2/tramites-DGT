import { env } from '$env/dynamic/private';
import PDFDocument from 'pdfkit';
import { SOLICITUD_TIPO_LABELS, type Solicitud } from '$lib/supabase/types';
import {
	facturaClienteFromPayload,
	formatFacturaDireccion,
	solicitaFacturaFromPayload
} from '$lib/tramite/factura-cliente';
import { formatEur } from '$lib/utils/pricing';

const IVA_RATE = 0.21;

export type FacturaEmisor = {
	nombre: string;
	nif: string;
	direccion: string;
	email: string;
};

export type FacturaIvaSplit = {
	base: number;
	iva: number;
	total: number;
};

function round2(n: number): number {
	return Math.round(n * 100) / 100;
}

export function amountFromSolicitudPayload(payload: Record<string, unknown>): number | null {
	const pago = (payload.pago as Record<string, unknown>) || {};
	const cents = Number(pago.amountCents ?? pago.amountCentsExpected);
	if (Number.isFinite(cents) && cents > 0) return round2(cents / 100);
	const eur = Number(pago.amount ?? payload.amount ?? payload.total);
	if (Number.isFinite(eur) && eur > 0) return round2(eur);
	return null;
}

export function splitIvaIncluido(total: number): FacturaIvaSplit {
	const t = round2(total);
	const base = round2(t / (1 + IVA_RATE));
	const iva = round2(t - base);
	return { base, iva, total: t };
}

export function getFacturaEmisor(): FacturaEmisor | null {
	const nombre = env.FACTURA_EMISOR_NOMBRE?.trim() || 'Trámites DGT Online';
	const nif = env.FACTURA_EMISOR_NIF?.trim() || '';
	const direccion = env.FACTURA_EMISOR_DIRECCION?.trim() || '';
	const email = env.FACTURA_EMISOR_EMAIL?.trim() || '';
	if (!nif) return null;
	return { nombre, nif, direccion, email };
}

export function facturaFilename(numero: string): string {
	return `factura-${numero.replace(/[^\w.-]/g, '_')}.pdf`;
}

type PdfDoc = InstanceType<typeof PDFDocument>;

function kv(doc: PdfDoc, label: string, value: string, x: number, y: number, width: number) {
	doc.font('Helvetica').fontSize(8).fillColor('#5a6b7d').text(label, x, y, { width });
	doc.font('Helvetica-Bold').fontSize(10).fillColor('#1a2b3c').text(value || '—', x, y + 12, { width });
}

export async function buildFacturaPdf(opts: {
	solicitud: Solicitud;
	numero: string;
	emitidaAt: string;
}): Promise<Buffer> {
	const emisor = getFacturaEmisor();
	if (!emisor) {
		throw new Error('Faltan FACTURA_EMISOR_NIF (y resto de datos del emisor) en el entorno');
	}

	const payload = (opts.solicitud.payload || {}) as Record<string, unknown>;
	if (!solicitaFacturaFromPayload(payload)) {
		throw new Error('Esta solicitud no pide factura');
	}
	const cliente = facturaClienteFromPayload(payload);
	const total = amountFromSolicitudPayload(payload);
	if (total == null) {
		throw new Error('No hay importe cobrado para facturar');
	}
	const split = splitIvaIncluido(total);
	const tipoLabel = SOLICITUD_TIPO_LABELS[opts.solicitud.tipo] || opts.solicitud.tipo;
	const matricula = String(payload.matricula || '').trim();
	const concepto = matricula
		? `Gestión de trámite «${tipoLabel}» · matrícula ${matricula}`
		: `Gestión de trámite «${tipoLabel}»`;
	const fecha = new Date(opts.emitidaAt).toLocaleDateString('es-ES');

	const doc = new PDFDocument({
		margin: 48,
		size: 'A4',
		bufferPages: true,
		info: {
			Title: `Factura ${opts.numero}`,
			Author: emisor.nombre
		}
	});
	const chunks: Buffer[] = [];
	doc.on('data', (c) => chunks.push(c as Buffer));
	const done = new Promise<Buffer>((resolve, reject) => {
		doc.on('end', () => resolve(Buffer.concat(chunks)));
		doc.on('error', reject);
	});

	const pageW = doc.page.width;
	const left = 48;
	const usable = pageW - 96;

	doc.rect(0, 0, pageW, 72).fill('#003050');
	doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(16);
	doc.text(emisor.nombre, left, 22, { width: usable * 0.6 });
	doc.font('Helvetica').fontSize(10).fillColor('#9fd8e8');
	doc.text('Factura', left, 44, { width: usable * 0.6 });
	doc.font('Helvetica-Bold').fontSize(12).fillColor('#ffffff');
	doc.text(opts.numero, left + usable * 0.55, 26, { width: usable * 0.45, align: 'right' });
	doc.font('Helvetica').fontSize(9).fillColor('#9fd8e8');
	doc.text(`Fecha: ${fecha}`, left + usable * 0.55, 44, { width: usable * 0.45, align: 'right' });

	doc.y = 96;
	const colW = (usable - 24) / 2;
	const yBox = 96;
	doc.roundedRect(left, yBox, colW, 92, 8).strokeColor('#d8e0e8').lineWidth(1).stroke();
	doc.roundedRect(left + colW + 24, yBox, colW, 92, 8).strokeColor('#d8e0e8').lineWidth(1).stroke();
	kv(doc, 'EMISOR', emisor.nombre, left + 12, yBox + 10, colW - 24);
	doc.font('Helvetica').fontSize(9).fillColor('#1a2b3c');
	doc.text(`NIF ${emisor.nif}`, left + 12, yBox + 38, { width: colW - 24 });
	if (emisor.direccion) doc.text(emisor.direccion, left + 12, yBox + 52, { width: colW - 24 });
	if (emisor.email) doc.text(emisor.email, left + 12, yBox + 66, { width: colW - 24 });

	kv(doc, 'CLIENTE', cliente.razonSocial, left + colW + 36, yBox + 10, colW - 24);
	doc.font('Helvetica').fontSize(9).fillColor('#1a2b3c');
	doc.text(`NIF/CIF ${cliente.nif}`, left + colW + 36, yBox + 38, { width: colW - 24 });
	doc.text(formatFacturaDireccion(cliente), left + colW + 36, yBox + 52, { width: colW - 24 });
	doc.text(cliente.email, left + colW + 36, yBox + 66, { width: colW - 24 });

	doc.y = yBox + 118;
	doc.fillColor('#003050').font('Helvetica-Bold').fontSize(11).text('Concepto');
	doc.moveDown(0.35);
	doc.font('Helvetica').fontSize(10).fillColor('#1a2b3c').text(concepto);
	doc.fontSize(9).fillColor('#5a6b7d').text(`Referencia de solicitud: ${opts.solicitud.id}`);

	doc.moveDown(1.2);
	const tableY = doc.y;
	doc.rect(left, tableY, usable, 28).fill('#003050');
	doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
	doc.text('Descripción', left + 10, tableY + 9, { width: usable * 0.5 });
	doc.text('Base', left + usable * 0.52, tableY + 9, { width: usable * 0.15, align: 'right' });
	doc.text('IVA 21%', left + usable * 0.67, tableY + 9, { width: usable * 0.15, align: 'right' });
	doc.text('Total', left + usable * 0.82, tableY + 9, { width: usable * 0.16, align: 'right' });

	doc.rect(left, tableY + 28, usable, 36).fill('#f4f7fa');
	doc.fillColor('#1a2b3c').font('Helvetica').fontSize(9);
	doc.text('Honorarios de gestoría (IVA incluido)', left + 10, tableY + 38, { width: usable * 0.5 });
	doc.text(formatEur(split.base), left + usable * 0.52, tableY + 38, {
		width: usable * 0.15,
		align: 'right'
	});
	doc.text(formatEur(split.iva), left + usable * 0.67, tableY + 38, {
		width: usable * 0.15,
		align: 'right'
	});
	doc.font('Helvetica-Bold').text(formatEur(split.total), left + usable * 0.82, tableY + 38, {
		width: usable * 0.16,
		align: 'right'
	});

	doc.y = tableY + 80;
	const totW = 220;
	const totX = left + usable - totW;
	doc.roundedRect(totX, doc.y, totW, 78, 8).fill('#e8f8fa');
	const ty = doc.y + 12;
	doc.font('Helvetica').fontSize(9).fillColor('#5a6b7d');
	doc.text('Base imponible', totX + 14, ty, { width: totW - 28 });
	doc.font('Helvetica-Bold').fontSize(10).fillColor('#003050');
	doc.text(formatEur(split.base), totX + 14, ty, { width: totW - 28, align: 'right' });
	doc.font('Helvetica').fontSize(9).fillColor('#5a6b7d');
	doc.text('IVA 21%', totX + 14, ty + 20, { width: totW - 28 });
	doc.font('Helvetica-Bold').fontSize(10).fillColor('#003050');
	doc.text(formatEur(split.iva), totX + 14, ty + 20, { width: totW - 28, align: 'right' });
	doc.font('Helvetica-Bold').fontSize(12).fillColor('#003050');
	doc.text('Total cobrado', totX + 14, ty + 44, { width: totW - 28 });
	doc.text(formatEur(split.total), totX + 14, ty + 44, { width: totW - 28, align: 'right' });

	doc.y = ty + 100;
	doc.font('Helvetica').fontSize(8).fillColor('#8a9bab');
	doc.text(
		'El importe cobrado incluye IVA al 21 %. Documento informativo al margen de VeriFactu. No es una factura electrónica verificable.',
		left,
		doc.y,
		{ width: usable }
	);

	doc.end();
	return done;
}
