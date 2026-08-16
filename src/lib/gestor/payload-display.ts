import { ccaaList } from '$lib/data/vehicles';
import { formatEur } from '$lib/utils/pricing';

/** Campos internos / secretos que no deben verse en el panel gestor. */
const HIDDEN_KEYS = new Set([
	'accessToken',
	'raw',
	'wizardStep',
	'marcaId',
	'modeloId',
	'combustibleId',
	'marcaMotoId',
	'modeloMotoId',
	'vmpMarcaId',
	'vmpModeloId',
	'acceptPrivacy',
	// IDs técnicos del catálogo; ya mostramos nombre legible
	'id'
]);

/** Prefijos/nodos enteros a omitir (redundantes o demasiados técnicos). */
const HIDDEN_PREFIXES = [
	'modeloMeta.',
	'pago.stripeSessionId',
	'pago.clientSecret',
	'breakdown.fuente.',
	'metaFiscal.fuente.'
];

const LABELS: Record<string, string> = {
	tipo: 'Tipo de trámite',
	tipoVehiculo: 'Tipo de vehículo',
	matricula: 'Matrícula',
	bastidor: 'Bastidor (VIN)',
	marca: 'Marca',
	modelo: 'Modelo',
	marcaNombre: 'Marca',
	modeloNombre: 'Modelo',
	combustible: 'Combustible',
	cilindrada: 'Cilindrada (cc)',
	fechaMatricula: 'Fecha 1ª matrícula',
	fechaVenta: 'Fecha de venta',
	ccaaId: 'Comunidad autónoma',
	precioVenta: 'Precio de compraventa',
	facturaEmpresa: 'Venta con factura de empresa',
	incluirInforme: 'Incluye informe DGT',
	motivoTransferencia: 'Motivo de la transferencia',
	liquidarItp: 'Liquidar ITP con nosotros',
	tipoCliente: 'Tipo de cliente',
	solicitarFactura: 'Solicita factura del servicio',
	facturaRazonSocial: 'Razón social (factura)',
	facturaNif: 'NIF/CIF (factura)',
	facturaEmail: 'Email de factura',
	facturaTipoVia: 'Tipo de vía (factura)',
	facturaDireccion: 'Dirección (factura)',
	facturaNumeroVia: 'Número (factura)',
	facturaPiso: 'Piso (factura)',
	facturaPuerta: 'Puerta (factura)',
	facturaCp: 'CP (factura)',
	facturaMunicipio: 'Municipio (factura)',
	facturaProvincia: 'Provincia (factura)',
	facturaNumero: 'Nº factura',
	facturaEmitidaAt: 'Factura emitida el',
	facturaEmitidaPor: 'Factura emitida por',
	email: 'Email',
	nif: 'NIF/NIE',
	nombre: 'Nombre',
	apellido1: 'Primer apellido',
	apellido2: 'Segundo apellido',
	telefono: 'Teléfono',
	rol: 'Rol del solicitante',
	otraParteEmail: 'Email de la otra parte',
	provincia: 'Provincia',
	municipio: 'Municipio',
	localidad: 'Localidad',
	pueblo: 'Pueblo',
	direccion: 'Dirección',
	tipoVia: 'Tipo de vía',
	numero: 'Número',
	piso: 'Piso',
	puerta: 'Puerta',
	bloque: 'Bloque',
	escalera: 'Escalera',
	cp: 'Código postal',
	tipoEnvio: 'Tipo de envío',
	sexo: 'Sexo',
	fechaNacimiento: 'Fecha de nacimiento',
	motivoDuplicado: 'Motivo del duplicado',
	clasePermiso: 'Clase de permiso',
	fechaCaducidad: 'Fecha de caducidad',
	distintivoTipo: 'Tipo de distintivo',
	vmpCertificado: 'VMP certificado',
	vmpNumCertificado: 'Nº certificado VMP',
	vmpNumSerie: 'Nº de serie VMP',
	vmpMarca: 'Marca VMP',
	vmpModelo: 'Modelo VMP',
	cartaFinalizacion: 'Carta de finalización',
	docsAttached: 'Documentos adjuntos en el envío',
	priceLines: 'Desglose del presupuesto',
	total: 'Total a pagar',
	amount: 'Importe',
	precioBase: 'Precio medio BOE (tabla)',
	factorCorreccion: 'Factor de corrección (%)',
	fuenteDepreciacion: 'Fuente de depreciación',
	'breakdown.precioVenta': 'Precio de venta (cálculo)',
	'breakdown.precioBase': 'Precio base BOE',
	'breakdown.factorCorreccion': 'Factor de corrección',
	'breakdown.valorSegunPrecioVenta': 'Valor según precio de venta (BOE)',
	'breakdown.valoracionReal': 'Valor venal / valoración real',
	'breakdown.baseImponible': 'Base imponible ITP',
	'breakdown.itpRate': 'Tipo ITP',
	'breakdown.itpAmount': 'Cuota ITP',
	'breakdown.facturaEmpresa': 'Factura empresa (sin ITP)',
	'breakdown.sinValorBoe': 'Sin valor BOE del modelo',
	'breakdown.informeDgt': 'Informe DGT',
	'breakdown.tramitacion': 'Gestión / tramitación (incl. tasas DGT)',
	'breakdown.total': 'Total (desglose)',
	'metaFiscal.valoracionReal': 'Valor venal (fiscal)',
	'metaFiscal.baseImponible': 'Base imponible (fiscal)',
	'metaFiscal.itpAmount': 'ITP (fiscal)',
	'metaFiscal.sinValorBoe': 'Sin valor BOE',
	'metaFiscal.ordenReferencia': 'Orden de referencia Hacienda',
	'pago.amount': 'Importe del pago',
	'pago.mode': 'Modo de pago',
	'pago.createdAt': 'Pago iniciado',
	'pago.stripeSessionId': 'Sesión Stripe',
	'pago.paidAt': 'Fecha de pago',
	'pago.redsysOrder': 'Pedido Redsys'
};

const DOC_LABELS: Record<string, string> = {
	comprador_nif_frontal: 'NIF comprador (frontal)',
	comprador_nif_trasero: 'NIF comprador (trasero)',
	vendedor_nif_frontal: 'NIF vendedor (frontal)',
	vendedor_nif_trasero: 'NIF vendedor (trasero)',
	permiso_circulacion: 'Permiso de circulación',
	ficha_tecnica_frontal: 'Ficha técnica (frontal)',
	ficha_tecnica_trasera: 'Ficha técnica (trasera)',
	ficha_tecnica: 'Ficha técnica',
	contrato_compraventa: 'Contrato de compraventa',
	carta_cancelacion: 'Carta de cancelación de reserva',
	ficha_vmp: 'Ficha / placa VMP',
	foto_vehiculo: 'Foto del vehículo',
	denuncia_justificante: 'Denuncia o justificante',
	foto_permiso: 'Foto del permiso',
	justificante_itp: 'Justificante ITP'
};

const VALUE_LABELS: Record<string, Record<string, string>> = {
	tipoVehiculo: {
		coche: 'Coche / Autocaravana',
		moto: 'Moto / Quad / Coche sin carnet',
		caravana: 'Caravana / Remolque'
	},
	rol: { comprador: 'Comprador', vendedor: 'Vendedor' },
	motivoTransferencia: { compraventa: 'Compraventa', donacion: 'Donación' },
	facturaEmpresa: { si: 'Sí', no: 'No', true: 'Sí', false: 'No' },
	incluirInforme: { si: 'Sí', no: 'No', true: 'Sí', false: 'No' },
	liquidarItp: { si: 'Sí', no: 'No', true: 'Sí', false: 'No' },
	tipoCliente: { particular: 'Particular', profesional: 'Profesional / empresa' },
	solicitarFactura: { si: 'Sí', no: 'No' },
	vmpCertificado: { si: 'Sí', no: 'No' },
	'pago.mode': {
		stripe: 'Stripe',
		stripe_embedded: 'Stripe (embebido)',
		redsys: 'Redsys',
		pending_credentials: 'Pendiente de activar pasarela'
	}
};

const MONEY_KEYS = new Set([
	'precioVenta',
	'total',
	'amount',
	'precioBase',
	'breakdown.precioVenta',
	'breakdown.precioBase',
	'breakdown.valorSegunPrecioVenta',
	'breakdown.valoracionReal',
	'breakdown.baseImponible',
	'breakdown.itpAmount',
	'breakdown.informeDgt',
	'breakdown.tramitacion',
	'breakdown.total',
	'metaFiscal.valoracionReal',
	'metaFiscal.baseImponible',
	'metaFiscal.itpAmount',
	'pago.amount'
]);

const BOOL_KEYS = new Set([
	'breakdown.facturaEmpresa',
	'breakdown.sinValorBoe',
	'metaFiscal.sinValorBoe',
	'acceptPrivacy'
]);

function leafKey(path: string): string {
	const i = path.lastIndexOf('.');
	return i >= 0 ? path.slice(i + 1) : path;
}

function shouldHide(path: string): boolean {
	const leaf = leafKey(path);
	if (HIDDEN_KEYS.has(path) || HIDDEN_KEYS.has(leaf)) return true;
	if (HIDDEN_PREFIXES.some((p) => path.startsWith(p) || path === p.replace(/\.$/, ''))) return true;
	// Evitar duplicados: marcaNombre si ya hay marca, etc.
	if (path === 'marcaNombre' || path === 'modeloNombre') return true;
	return false;
}

function humanLabel(path: string): string {
	if (LABELS[path]) return LABELS[path];
	const leaf = leafKey(path);
	if (LABELS[leaf]) return LABELS[leaf];
	// Fallback: palabras separadas
	return path
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.replace(/\./g, ' · ')
		.replace(/_/g, ' ')
		.replace(/^\w/, (c) => c.toUpperCase());
}

function formatMoney(v: unknown): string {
	const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
	if (!Number.isFinite(n)) return String(v ?? '');
	return formatEur(n);
}

function formatBool(v: unknown): string {
	if (v === true || v === 'si' || v === 'true' || v === 1) return 'Sí';
	if (v === false || v === 'no' || v === 'false' || v === 0) return 'No';
	return String(v);
}

function formatCcaa(id: unknown): string {
	const found = ccaaList.find((c) => c.id === id);
	return found?.name ?? String(id ?? '');
}

function formatPriceLines(v: unknown): string {
	if (!Array.isArray(v)) return String(v);
	return v
		.map((row) => {
			const r = row as { label?: string; amount?: number };
			const label = r.label || 'Concepto';
			const amount = Number(r.amount);
			return Number.isFinite(amount) ? `${label}: ${formatEur(amount)}` : label;
		})
		.join(' · ');
}

function formatDocsAttached(v: unknown): string {
	if (!Array.isArray(v)) return String(v);
	return v
		.map((id) => DOC_LABELS[String(id)] || String(id).replace(/_/g, ' '))
		.join(', ');
}

function formatValue(path: string, v: unknown): string {
	if (v == null || v === '') return '—';

	if (path === 'ccaaId') return formatCcaa(v);
	if (path === 'priceLines') return formatPriceLines(v);
	if (path === 'docsAttached') return formatDocsAttached(v);
	if (path === 'breakdown.itpRate' && typeof v === 'number') {
		return `${Math.round(v * 100)} %`;
	}
	if (path === 'factorCorreccion' || path === 'breakdown.factorCorreccion') {
		const n = Number(v);
		return Number.isFinite(n) ? `${n} %` : String(v);
	}
	if (MONEY_KEYS.has(path)) return formatMoney(v);
	if (BOOL_KEYS.has(path)) return formatBool(v);

	const map = VALUE_LABELS[path] || VALUE_LABELS[leafKey(path)];
	if (map && map[String(v)] != null) return map[String(v)];

	if (typeof v === 'boolean') return formatBool(v);
	if (Array.isArray(v)) {
		return v
			.map((x) => (typeof x === 'object' ? JSON.stringify(x) : String(x)))
			.join(', ');
	}
	return String(v);
}

export type PayloadFieldRow = { key: string; label: string; value: string };

/**
 * Aplana el payload del trámite a filas legibles para el panel gestor / PDF.
 * Omite tokens, IDs técnicos y JSON crudo innecesario.
 */
export function payloadFieldsForDisplay(payload: Record<string, unknown> | null | undefined): PayloadFieldRow[] {
	const rows: PayloadFieldRow[] = [];

	function walk(obj: Record<string, unknown>, prefix = '') {
		for (const [k, v] of Object.entries(obj)) {
			const path = prefix ? `${prefix}.${k}` : k;
			if (shouldHide(path) || shouldHide(k)) continue;

			if (v != null && typeof v === 'object' && !Array.isArray(v)) {
				// No expandir objetos muy grandes/técnicos: mostrar resumen o hijos filtrados
				if (k === 'modeloMeta') continue;
				walk(v as Record<string, unknown>, path);
				continue;
			}

			// Tasa DGT va a 0 en el breakdown: está incluida en tramitación.
			if (path === 'breakdown.tasaDgt') continue;
			// No mostrar importes a cero que solo ensucian (informe no contratado, etc.)
			if (
				(path === 'breakdown.informeDgt' || path === 'breakdown.tasaDgt') &&
				(v === 0 || v === '0')
			) {
				continue;
			}

			const value = formatValue(path, v);
			if (value === '—' && (v == null || v === '')) continue;
			rows.push({ key: path, label: humanLabel(path), value });
		}
	}

	if (payload && typeof payload === 'object') walk(payload);

	// Evitar duplicar importe: preferir "total" frente a "amount"
	const keys = new Set(rows.map((r) => r.key));
	if (keys.has('total') && keys.has('amount')) {
		const i = rows.findIndex((r) => r.key === 'amount');
		if (i >= 0) rows.splice(i, 1);
	}
	if (keys.has('breakdown.total') && keys.has('total')) {
		const i = rows.findIndex((r) => r.key === 'breakdown.total');
		if (i >= 0) rows.splice(i, 1);
	}

	// Orden preferente: datos de persona/vehículo antes que fiscal/pago
	const order = [
		'tipo',
		'tipoVehiculo',
		'matricula',
		'bastidor',
		'marca',
		'modelo',
		'combustible',
		'cilindrada',
		'fechaMatricula',
		'fechaVenta',
		'ccaaId',
		'precioVenta',
		'motivoTransferencia',
		'rol',
		'nombre',
		'apellido1',
		'apellido2',
		'nif',
		'email',
		'telefono',
		'otraParteEmail',
		'provincia',
		'municipio',
		'direccion',
		'cp'
	];
	const rank = (key: string) => {
		const i = order.indexOf(key);
		return i === -1 ? 1000 + key.length : i;
	};
	rows.sort((a, b) => rank(a.key) - rank(b.key) || a.label.localeCompare(b.label, 'es'));
	return rows;
}
