import { joinPersonName } from '$lib/cuenta/profile-prefill';
import {
	isCifDocumento,
	validateCodigoPostal,
	validateEmail,
	validateNifNie,
	validateRequired
} from '$lib/utils/validators';

export type TipoCliente = '' | 'particular' | 'profesional';

export type FacturaClienteSource = {
	nombre?: string;
	apellido1?: string;
	apellido2?: string;
	nif?: string;
	email?: string;
	tipoVia?: string;
	direccion?: string;
	numero?: string;
	piso?: string;
	puerta?: string;
	cp?: string;
	municipio?: string;
	provincia?: string;
};

export type FacturaClienteData = {
	tipoCliente: TipoCliente;
	solicitarFactura: 'si' | 'no';
	razonSocial: string;
	nif: string;
	email: string;
	tipoVia: string;
	direccion: string;
	numeroVia: string;
	piso: string;
	puerta: string;
	cp: string;
	municipio: string;
	provincia: string;
};

function str(v: unknown): string {
	return typeof v === 'string' ? v : v == null ? '' : String(v);
}

export function emptyFacturaCliente(): FacturaClienteData {
	return {
		tipoCliente: '',
		solicitarFactura: 'no',
		razonSocial: '',
		nif: '',
		email: '',
		tipoVia: 'Calle',
		direccion: '',
		numeroVia: '',
		piso: '',
		puerta: '',
		cp: '',
		municipio: '',
		provincia: ''
	};
}

export function wantsInvoice(data: Pick<FacturaClienteData, 'tipoCliente' | 'solicitarFactura'>): boolean {
	return data.tipoCliente === 'profesional' && data.solicitarFactura === 'si';
}

export function solicitaFacturaFromPayload(payload: Record<string, unknown> | null | undefined): boolean {
	if (!payload) return false;
	return str(payload.solicitarFactura) === 'si' && str(payload.tipoCliente) === 'profesional';
}

export function facturaEmitidaFromPayload(payload: Record<string, unknown> | null | undefined): boolean {
	if (!payload) return false;
	return Boolean(str(payload.facturaNumero).trim() && str(payload.facturaEmitidaAt).trim());
}

export function displayNameFromSource(source: FacturaClienteSource): string {
	if (isCifDocumento(source.nif || '')) return (source.nombre || '').trim();
	return joinPersonName(source.nombre || '', source.apellido1 || '', source.apellido2 || '');
}

export function prefillFacturaFromSource(
	current: FacturaClienteData,
	source: FacturaClienteSource
): FacturaClienteData {
	const next = { ...current };
	if (!next.razonSocial.trim()) next.razonSocial = displayNameFromSource(source);
	if (!next.nif.trim()) next.nif = (source.nif || '').trim();
	if (!next.email.trim()) next.email = (source.email || '').trim();
	if (!next.tipoVia.trim() || next.tipoVia === 'Calle') next.tipoVia = source.tipoVia || next.tipoVia || 'Calle';
	if (!next.direccion.trim()) next.direccion = (source.direccion || '').trim();
	if (!next.numeroVia.trim()) next.numeroVia = (source.numero || '').trim();
	if (!next.piso.trim()) next.piso = (source.piso || '').trim();
	if (!next.puerta.trim()) next.puerta = (source.puerta || '').trim();
	if (!next.cp.trim()) next.cp = (source.cp || '').trim();
	if (!next.municipio.trim()) next.municipio = (source.municipio || '').trim();
	if (!next.provincia.trim()) next.provincia = (source.provincia || '').trim();
	return next;
}

export function formatFacturaDireccion(data: FacturaClienteData): string {
	const via = [data.tipoVia, data.direccion, data.numeroVia && `nº ${data.numeroVia}`, data.piso, data.puerta]
		.filter(Boolean)
		.join(' ');
	const loc = [data.cp, data.municipio, data.provincia].filter(Boolean).join(', ');
	return [via, loc].filter(Boolean).join(' · ') || '—';
}

export function facturaClienteToPayload(data: FacturaClienteData): Record<string, string> {
	return {
		tipoCliente: data.tipoCliente,
		solicitarFactura: wantsInvoice(data) ? 'si' : 'no',
		facturaRazonSocial: data.razonSocial,
		facturaNif: data.nif,
		facturaEmail: data.email,
		facturaTipoVia: data.tipoVia,
		facturaDireccion: data.direccion,
		facturaNumeroVia: data.numeroVia,
		facturaPiso: data.piso,
		facturaPuerta: data.puerta,
		facturaCp: data.cp,
		facturaMunicipio: data.municipio,
		facturaProvincia: data.provincia
	};
}

export function facturaClienteFromPayload(data: Record<string, unknown> | null | undefined): FacturaClienteData {
	const base = emptyFacturaCliente();
	if (!data) return base;
	const tipo = str(data.tipoCliente);
	base.tipoCliente = tipo === 'particular' || tipo === 'profesional' ? tipo : '';
	base.solicitarFactura = str(data.solicitarFactura) === 'si' ? 'si' : 'no';
	base.razonSocial = str(data.facturaRazonSocial);
	base.nif = str(data.facturaNif);
	base.email = str(data.facturaEmail);
	base.tipoVia = str(data.facturaTipoVia) || 'Calle';
	base.direccion = str(data.facturaDireccion);
	base.numeroVia = str(data.facturaNumeroVia);
	base.piso = str(data.facturaPiso);
	base.puerta = str(data.facturaPuerta);
	base.cp = str(data.facturaCp);
	base.municipio = str(data.facturaMunicipio);
	base.provincia = str(data.facturaProvincia);
	return base;
}

export function facturaClienteErrors(data: FacturaClienteData): Record<string, string | null> {
	const e: Record<string, string | null> = {};
	if (!data.tipoCliente) e.tipoCliente = 'Indica si actúas como particular o profesional';
	if (data.tipoCliente === 'profesional' && data.solicitarFactura !== 'si' && data.solicitarFactura !== 'no') {
		e.solicitarFactura = 'Indica si necesitas factura';
	}
	if (wantsInvoice(data)) {
		e.facturaRazonSocial = validateRequired(data.razonSocial, 'La razón social o nombre fiscal');
		e.facturaNif = validateNifNie(data.nif);
		e.facturaEmail = validateEmail(data.email);
		e.facturaDireccion = validateRequired(data.direccion, 'La dirección fiscal');
		e.facturaNumeroVia = validateRequired(data.numeroVia, 'El número');
		e.facturaCp = validateCodigoPostal(data.cp);
		e.facturaMunicipio = validateRequired(data.municipio, 'El municipio');
		e.facturaProvincia = validateRequired(data.provincia, 'La provincia');
	}
	return e;
}

export function firstFacturaClienteError(data: FacturaClienteData): string | null {
	for (const v of Object.values(facturaClienteErrors(data))) {
		if (v) return v;
	}
	return null;
}
