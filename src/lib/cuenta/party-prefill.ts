import {
	mergeProfileIntoSolicitante,
	type SolicitanteFields
} from '$lib/cuenta/profile-prefill';
import type { Profile } from '$lib/supabase/types';
import { isCifDocumento, normalizeDocumento } from '$lib/utils/validators';

export type PartyRole = 'comprador' | 'vendedor';

export type PartyData = {
	email: string;
	nif: string;
	nombre: string;
	apellido1: string;
	apellido2: string;
	telefono: string;
	provincia: string;
	municipio: string;
	tipoVia: string;
	direccion: string;
	numero: string;
	piso: string;
	puerta: string;
	cp: string;
};

export function partyDisplayName(
	party: Pick<PartyData, 'nombre' | 'apellido1' | 'apellido2' | 'nif'>
): string {
	if (isCifDocumento(party.nif)) return party.nombre.trim() || '—';
	return [party.nombre, party.apellido1, party.apellido2].filter((p) => p.trim()).join(' ') || '—';
}

export function emptyParty(tipoVia = 'Calle'): PartyData {
	return {
		email: '',
		nif: '',
		nombre: '',
		apellido1: '',
		apellido2: '',
		telefono: '',
		provincia: '',
		municipio: '',
		tipoVia,
		direccion: '',
		numero: '',
		piso: '',
		puerta: '',
		cp: ''
	};
}

/** Rellena solo campos vacíos de una parte con el perfil logueado. */
export function mergeProfileIntoParty(
	party: PartyData,
	opts: { userEmail?: string | null; profile: Profile | null | undefined }
): PartyData {
	const fields: SolicitanteFields = {
		email: party.email,
		nif: party.nif,
		nombre: party.nombre,
		apellido1: party.apellido1,
		apellido2: party.apellido2,
		telefono: party.telefono,
		provincia: party.provincia,
		municipio: party.municipio,
		localidad: party.municipio,
		tipoVia: party.tipoVia,
		direccion: party.direccion,
		numero: party.numero,
		piso: party.piso,
		puerta: party.puerta,
		cp: party.cp
	};
	const patch = mergeProfileIntoSolicitante(fields, opts);
	return {
		email: patch.email ?? party.email,
		nif: patch.nif ?? party.nif,
		nombre: patch.nombre ?? party.nombre,
		apellido1: patch.apellido1 ?? party.apellido1,
		apellido2: patch.apellido2 ?? party.apellido2,
		telefono: patch.telefono ?? party.telefono,
		provincia: patch.provincia ?? party.provincia,
		municipio: patch.municipio ?? party.municipio,
		tipoVia: patch.tipoVia ?? party.tipoVia,
		direccion: patch.direccion ?? party.direccion,
		numero: patch.numero ?? party.numero,
		piso: patch.piso ?? party.piso,
		puerta: patch.puerta ?? party.puerta,
		cp: patch.cp ?? party.cp
	};
}

/** ¿La parte coincide con el usuario logueado (email o NIF)? */
export function partyMatchesUser(
	party: PartyData,
	opts: { userEmail?: string | null; profileNif?: string | null }
): boolean {
	const email = (opts.userEmail || '').trim().toLowerCase();
	const nif = normalizeDocumento(opts.profileNif || '');
	if (email && party.email.trim().toLowerCase() === email) return true;
	if (nif && normalizeDocumento(party.nif) === nif) return true;
	return false;
}

/**
 * Infiera si el usuario es comprador o vendedor por email/NIF.
 * null si no hay match claro (no forzar un rol).
 */
export function inferUserPartyRole(
	comprador: PartyData,
	vendedor: PartyData,
	opts: { userEmail?: string | null; profileNif?: string | null }
): PartyRole | null {
	const c = partyMatchesUser(comprador, opts);
	const v = partyMatchesUser(vendedor, opts);
	if (c && !v) return 'comprador';
	if (v && !c) return 'vendedor';
	return null;
}

/** Parte de contacto para email/pago: la inferida, o la que tenga email. */
export function contactParty(
	comprador: PartyData,
	vendedor: PartyData,
	rol: PartyRole | null
): PartyData {
	if (rol === 'vendedor') return vendedor;
	if (rol === 'comprador') return comprador;
	if (comprador.email.trim()) return comprador;
	if (vendedor.email.trim()) return vendedor;
	return comprador;
}

/** Aplana PartyData al payload con prefijo (compradorNombre, vendedorEmail…). */
export function flattenParty(prefix: string, party: PartyData): Record<string, string> {
	const cap = (k: string) => prefix + k.charAt(0).toUpperCase() + k.slice(1);
	return {
		[`${prefix}Email`]: party.email,
		[`${prefix}Nif`]: party.nif,
		[cap('nombre')]: party.nombre,
		[`${prefix}Apellido1`]: party.apellido1,
		[`${prefix}Apellido2`]: party.apellido2,
		[`${prefix}Telefono`]: party.telefono,
		[`${prefix}Provincia`]: party.provincia,
		[`${prefix}Municipio`]: party.municipio,
		[`${prefix}TipoVia`]: party.tipoVia,
		[`${prefix}Direccion`]: party.direccion,
		[`${prefix}Numero`]: party.numero,
		[`${prefix}Piso`]: party.piso,
		[`${prefix}Puerta`]: party.puerta,
		[`${prefix}Cp`]: party.cp
	};
}

export function partyFromFlat(
	prefix: string,
	data: Record<string, unknown>,
	fallbackTipoVia = 'Calle'
): PartyData {
	const g = (camel: string, alt?: string) => {
		const a = data[`${prefix}${camel}`];
		const b = alt ? data[alt] : undefined;
		return typeof a === 'string' ? a : typeof b === 'string' ? b : '';
	};
	return {
		email: g('Email', prefix === '' ? 'email' : undefined),
		nif: g('Nif', prefix === '' ? 'nif' : undefined),
		nombre: g('Nombre', prefix === '' ? 'nombre' : undefined),
		apellido1: g('Apellido1', prefix === '' ? 'apellido1' : undefined),
		apellido2: g('Apellido2', prefix === '' ? 'apellido2' : undefined),
		telefono: g('Telefono', prefix === '' ? 'telefono' : undefined),
		provincia: g('Provincia', prefix === '' ? 'provincia' : undefined),
		municipio: g('Municipio', prefix === '' ? 'municipio' : undefined),
		tipoVia: g('TipoVia', prefix === '' ? 'tipoVia' : undefined) || fallbackTipoVia,
		direccion: g('Direccion', prefix === '' ? 'direccion' : undefined),
		numero: g('Numero', prefix === '' ? 'numero' : undefined),
		piso: g('Piso', prefix === '' ? 'piso' : undefined),
		puerta: g('Puerta', prefix === '' ? 'puerta' : undefined),
		cp: g('Cp', prefix === '' ? 'cp' : undefined)
	};
}
