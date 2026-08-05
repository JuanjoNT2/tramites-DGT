import type { Profile, ProfileDireccion } from '$lib/supabase/types';

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
	direccion: string;
	cp: string;
	fechaNacimiento?: string;
};

function str(v: unknown): string {
	return typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim();
}

/** YYYY-MM-DD desde payload o perfil. */
export function normalizeFechaNacimiento(value: unknown): string {
	const raw = str(value);
	if (!raw) return '';
	const m = raw.match(/^(\d{4}-\d{2}-\d{2})/);
	return m ? m[1] : raw;
}

/**
 * Campos de perfil a partir del payload del wizard (solo no vacíos).
 * Dirección siempre como objeto estructurado.
 */
export function profilePatchFromSolicitantePayload(payload: Record<string, unknown>): Partial<
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

	const calle = str(payload.direccion);
	const cp = str(payload.cp);
	const ciudad = str(payload.municipio) || str(payload.localidad) || str(payload.ciudad);
	const provincia = str(payload.provincia);
	if (calle || cp || ciudad || provincia) {
		const direccion: ProfileDireccion = {};
		if (calle) direccion.calle = calle;
		if (cp) direccion.cp = cp;
		if (ciudad) direccion.ciudad = ciudad;
		if (provincia) direccion.provincia = provincia;
		patch.direccion = direccion;
	}

	const fnac = normalizeFechaNacimiento(payload.fechaNacimiento ?? payload.fecha_nacimiento);
	if (fnac) patch.fecha_nacimiento = fnac;

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

	const dir = (profile?.direccion || null) as ProfileDireccion | string | null;
	if (dir && typeof dir === 'object') {
		if (!fields.direccion.trim() && dir.calle?.trim()) patch.direccion = dir.calle.trim();
		if (!fields.cp.trim() && dir.cp?.trim()) patch.cp = dir.cp.trim();
		if (!fields.municipio.trim() && dir.ciudad?.trim()) patch.municipio = dir.ciudad.trim();
		if (!fields.localidad.trim() && dir.ciudad?.trim()) patch.localidad = dir.ciudad.trim();
		if (!fields.provincia.trim() && dir.provincia?.trim()) patch.provincia = dir.provincia.trim();
	} else if (typeof dir === 'string' && dir.trim() && !fields.direccion.trim()) {
		// Perfiles antiguos con dirección en un único string
		patch.direccion = dir.trim();
	}

	const fnac = normalizeFechaNacimiento(profile?.fecha_nacimiento);
	if (fnac && !(fields.fechaNacimiento || '').trim()) patch.fechaNacimiento = fnac;

	return patch;
}
