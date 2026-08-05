import type {
	Profile,
	ProfileDireccion,
	ProfileDocumentos,
	ProfileDocumentoRef
} from '$lib/supabase/types';
import type { DocGroup } from '$lib/tramite/documentos';

export function joinPersonName(
	nombre: string,
	apellido1: string,
	apellido2 = ''
): string {
	return [nombre, apellido1, apellido2]
		.map((s) => s.trim())
		.filter(Boolean)
		.join(' ');
}

/** Fallback solo para perfiles antiguos sin piezas separadas. */
export function splitFullName(fullName: string): {
	nombre: string;
	apellido1: string;
	apellido2: string;
} {
	const parts = fullName.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return { nombre: '', apellido1: '', apellido2: '' };
	if (parts.length === 1) return { nombre: parts[0], apellido1: '', apellido2: '' };
	if (parts.length === 2) return { nombre: parts[0], apellido1: parts[1], apellido2: '' };
	return {
		nombre: parts[0],
		apellido1: parts[1],
		apellido2: parts.slice(2).join(' ')
	};
}

export function namePartsFromProfile(profile: Profile | null | undefined): {
	nombre: string;
	apellido1: string;
	apellido2: string;
} {
	if (!profile) return { nombre: '', apellido1: '', apellido2: '' };
	const nombre = (profile.nombre || '').trim();
	const apellido1 = (profile.apellido1 || '').trim();
	const apellido2 = (profile.apellido2 || '').trim();
	if (nombre || apellido1 || apellido2) {
		return { nombre, apellido1, apellido2 };
	}
	if (profile.full_name?.trim()) return splitFullName(profile.full_name);
	return { nombre: '', apellido1: '', apellido2: '' };
}

/** Primer nombre para saludos (Nav, Mi área). Nunca el email completo. */
export function displayFirstName(
	profile: Profile | null | undefined,
	email?: string | null
): string {
	const fromNombre = (profile?.nombre || '').trim();
	if (fromNombre) return fromNombre.split(/\s+/)[0] || fromNombre;
	const full = (profile?.full_name || '').trim();
	if (full) return full.split(/\s+/)[0] || full;
	const mail = (email || profile?.email || '').trim();
	if (mail.includes('@')) return mail.split('@')[0] || 'Mi cuenta';
	return 'Mi cuenta';
}

export type SolicitanteFields = {
	email: string;
	nif: string;
	nombre: string;
	apellido1: string;
	apellido2: string;
	telefono: string;
	provincia: string;
	municipio: string;
	localidad: string;
	pueblo?: string;
	tipoVia?: string;
	direccion: string;
	numero?: string;
	piso?: string;
	puerta?: string;
	bloque?: string;
	escalera?: string;
	cp: string;
	fechaNacimiento?: string;
	sexo?: string;
};

function str(v: unknown): string {
	return typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim();
}

const SEXO_OK = new Set(['HOMBRE', 'MUJER']);

export function normalizeSexo(value: unknown): string {
	const raw = str(value).toUpperCase();
	if (SEXO_OK.has(raw)) return raw;
	if (raw === 'H' || raw === 'MASCULINO' || raw === 'MALE') return 'HOMBRE';
	if (raw === 'M' || raw === 'FEMENINO' || raw === 'FEMALE') return 'MUJER';
	return '';
}

/** YYYY-MM-DD desde payload o perfil. */
export function normalizeFechaNacimiento(value: unknown): string {
	const raw = str(value);
	if (!raw) return '';
	const m = raw.match(/^(\d{4}-\d{2}-\d{2})/);
	return m ? m[1] : raw;
}

export function normalizeProfileDireccion(
	raw: ProfileDireccion | Record<string, unknown> | string | null | undefined
): ProfileDireccion {
	if (!raw) return {};
	if (typeof raw === 'string') {
		const calle = raw.trim();
		return calle ? { calle } : {};
	}
	const d = raw as Record<string, unknown>;
	const out: ProfileDireccion = {};
	const tipoVia = str(d.tipoVia ?? d.tipo_via);
	const calle = str(d.calle ?? d.direccion);
	const numero = str(d.numero);
	const piso = str(d.piso);
	const puerta = str(d.puerta);
	const bloque = str(d.bloque);
	const escalera = str(d.escalera);
	const cp = str(d.cp);
	const municipio = str(d.municipio);
	const pueblo = str(d.pueblo);
	const localidad = str(d.localidad);
	const ciudad = str(d.ciudad) || municipio || localidad;
	const provincia = str(d.provincia);
	if (tipoVia) out.tipoVia = tipoVia;
	if (calle) out.calle = calle;
	if (numero) out.numero = numero;
	if (piso) out.piso = piso;
	if (puerta) out.puerta = puerta;
	if (bloque) out.bloque = bloque;
	if (escalera) out.escalera = escalera;
	if (cp) out.cp = cp;
	if (municipio) out.municipio = municipio;
	if (pueblo) out.pueblo = pueblo;
	if (localidad) out.localidad = localidad;
	if (ciudad) out.ciudad = ciudad;
	if (provincia) out.provincia = provincia;
	return out;
}

function mergeDireccion(
	base: ProfileDireccion,
	patch: ProfileDireccion
): ProfileDireccion {
	const merged: ProfileDireccion = { ...base };
	for (const [k, v] of Object.entries(patch) as [keyof ProfileDireccion, string | undefined][]) {
		if (v != null && String(v).trim()) merged[k] = String(v).trim();
	}
	if (merged.municipio && !merged.ciudad) merged.ciudad = merged.municipio;
	if (merged.ciudad && !merged.municipio) merged.municipio = merged.ciudad;
	if (merged.ciudad && !merged.localidad) merged.localidad = merged.ciudad;
	return merged;
}

/**
 * Campos de perfil a partir del payload del wizard (solo no vacíos).
 * Dirección siempre como objeto estructurado (fusiona con la existente).
 */
export function profilePatchFromSolicitantePayload(
	payload: Record<string, unknown>,
	existing?: Profile | null
): Partial<
	Pick<
		Profile,
		| 'full_name'
		| 'nombre'
		| 'apellido1'
		| 'apellido2'
		| 'telefono'
		| 'nif'
		| 'direccion'
		| 'fecha_nacimiento'
		| 'sexo'
	>
> {
	const patch: Partial<
		Pick<
			Profile,
			| 'full_name'
			| 'nombre'
			| 'apellido1'
			| 'apellido2'
			| 'telefono'
			| 'nif'
			| 'direccion'
			| 'fecha_nacimiento'
			| 'sexo'
		>
	> = {};

	const nombre = str(payload.nombre);
	const apellido1 = str(payload.apellido1);
	const apellido2 = str(payload.apellido2);
	if (nombre) patch.nombre = nombre;
	if (apellido1) patch.apellido1 = apellido1;
	if (apellido2) patch.apellido2 = apellido2;
	const fullName = joinPersonName(nombre, apellido1, apellido2);
	if (fullName) patch.full_name = fullName;

	const telefono = str(payload.telefono);
	if (telefono) patch.telefono = telefono;

	const nif = str(payload.nif).toUpperCase().replace(/[\s-]/g, '');
	if (nif) patch.nif = nif;

	const fromPayload = normalizeProfileDireccion({
		tipoVia: payload.tipoVia ?? payload.tipo_via,
		calle: payload.direccion ?? payload.calle,
		numero: payload.numero,
		piso: payload.piso,
		puerta: payload.puerta,
		bloque: payload.bloque,
		escalera: payload.escalera,
		cp: payload.cp,
		municipio: payload.municipio,
		pueblo: payload.pueblo,
		localidad: payload.localidad,
		ciudad: payload.ciudad ?? payload.municipio ?? payload.localidad,
		provincia: payload.provincia
	});

	if (Object.keys(fromPayload).length) {
		const base = normalizeProfileDireccion(existing?.direccion ?? null);
		patch.direccion = mergeDireccion(base, fromPayload);
	}

	const fnac = normalizeFechaNacimiento(payload.fechaNacimiento ?? payload.fecha_nacimiento);
	if (fnac) patch.fecha_nacimiento = fnac;

	const sexo = normalizeSexo(payload.sexo);
	if (sexo) patch.sexo = sexo;

	return patch;
}

/**
 * Rellena solo campos vacíos del solicitante a partir del perfil logueado.
 * No pisa lo que el usuario (o un borrador) ya haya escrito.
 */
export function mergeProfileIntoSolicitante(
	fields: SolicitanteFields,
	opts: { userEmail?: string | null; profile: Profile | null | undefined }
): Partial<SolicitanteFields> {
	const profile = opts.profile;
	if (!profile && !opts.userEmail) return {};

	const patch: Partial<SolicitanteFields> = {};

	const email = (opts.userEmail || profile?.email || '').trim();
	if (!fields.email.trim() && email) patch.email = email;

	if (profile?.telefono?.trim() && !fields.telefono.trim()) {
		patch.telefono = profile.telefono.trim();
	}
	if (profile?.nif?.trim() && !fields.nif.trim()) {
		patch.nif = profile.nif.trim().toUpperCase();
	}

	const names = namePartsFromProfile(profile);
	if (!fields.nombre.trim() && names.nombre) patch.nombre = names.nombre;
	if (!fields.apellido1.trim() && names.apellido1) patch.apellido1 = names.apellido1;
	if (!fields.apellido2.trim() && names.apellido2) patch.apellido2 = names.apellido2;

	const dir = normalizeProfileDireccion(profile?.direccion ?? null);
	if (Object.keys(dir).length) {
		if (!(fields.tipoVia || '').trim() && dir.tipoVia) patch.tipoVia = dir.tipoVia;
		if (!fields.direccion.trim() && dir.calle) patch.direccion = dir.calle;
		if (!(fields.numero || '').trim() && dir.numero) patch.numero = dir.numero;
		if (!(fields.piso || '').trim() && dir.piso) patch.piso = dir.piso;
		if (!(fields.puerta || '').trim() && dir.puerta) patch.puerta = dir.puerta;
		if (!(fields.bloque || '').trim() && dir.bloque) patch.bloque = dir.bloque;
		if (!(fields.escalera || '').trim() && dir.escalera) patch.escalera = dir.escalera;
		if (!fields.cp.trim() && dir.cp) patch.cp = dir.cp;
		const ciudad = dir.municipio || dir.ciudad || dir.localidad || '';
		if (!fields.municipio.trim() && ciudad) patch.municipio = ciudad;
		if (!fields.localidad.trim() && (dir.localidad || ciudad)) {
			patch.localidad = dir.localidad || ciudad;
		}
		if (!(fields.pueblo || '').trim() && dir.pueblo) patch.pueblo = dir.pueblo;
		if (!fields.provincia.trim() && dir.provincia) patch.provincia = dir.provincia;
	}

	const fnac = normalizeFechaNacimiento(profile?.fecha_nacimiento);
	if (fnac && !(fields.fechaNacimiento || '').trim()) patch.fechaNacimiento = fnac;

	const sexo = normalizeSexo(profile?.sexo);
	if (sexo && !(fields.sexo || '').trim()) patch.sexo = sexo;

	return patch;
}

const OWN_NIF_PREFIXES = new Set(['titular', 'solicitante', 'propietario']);

/** Prefijos de slots NIF que representan al usuario logueado. */
export function ownNifPrefixes(opts?: { rol?: string | null }): string[] {
	const prefixes = [...OWN_NIF_PREFIXES];
	if (opts?.rol === 'comprador' || opts?.rol === 'vendedor') {
		prefixes.push(opts.rol);
	}
	return prefixes;
}

/** Ids de slots NIF del titular/solicitante a precargar desde el perfil. */
export function ownNifSlotIds(
	groups: DocGroup[],
	opts?: { rol?: string | null }
): string[] {
	const prefixes = ownNifPrefixes(opts);
	const ids: string[] = [];
	for (const g of groups) {
		for (const slot of g.slots) {
			const m = slot.id.match(/^(.*)_(nif_frontal|nif_trasero)$/);
			if (m && prefixes.includes(m[1])) ids.push(slot.id);
		}
	}
	return ids;
}

export function profileDocKeyFromSlotId(slotId: string): 'nif_frontal' | 'nif_trasero' | null {
	if (slotId.endsWith('_nif_frontal') || slotId === 'nif_frontal') return 'nif_frontal';
	if (slotId.endsWith('_nif_trasero') || slotId === 'nif_trasero') return 'nif_trasero';
	return null;
}

export function shouldSaveDocTypeToProfile(
	docType: string,
	opts?: { rol?: string | null }
): 'nif_frontal' | 'nif_trasero' | null {
	const key = profileDocKeyFromSlotId(docType);
	if (!key) return null;
	const prefix = docType.replace(/_nif_(frontal|trasero)$/, '');
	if (ownNifPrefixes(opts).includes(prefix) || prefix === key) return key;
	return null;
}

export function getProfileDocumento(
	profile: Profile | null | undefined,
	key: 'nif_frontal' | 'nif_trasero'
): ProfileDocumentoRef | null {
	const docs = (profile?.documentos || null) as ProfileDocumentos | null;
	const ref = docs?.[key];
	if (!ref?.path) return null;
	return ref;
}
