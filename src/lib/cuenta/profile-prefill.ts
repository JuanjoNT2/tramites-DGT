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
};

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

	const dir = (profile?.direccion || null) as ProfileDireccion | null;
	if (dir && typeof dir === 'object') {
		if (!fields.direccion.trim() && dir.calle?.trim()) patch.direccion = dir.calle.trim();
		if (!fields.cp.trim() && dir.cp?.trim()) patch.cp = dir.cp.trim();
		if (!fields.municipio.trim() && dir.ciudad?.trim()) patch.municipio = dir.ciudad.trim();
		if (!fields.localidad.trim() && dir.ciudad?.trim()) patch.localidad = dir.ciudad.trim();
		if (!fields.provincia.trim() && dir.provincia?.trim()) patch.provincia = dir.provincia.trim();
	}

	return patch;
}
