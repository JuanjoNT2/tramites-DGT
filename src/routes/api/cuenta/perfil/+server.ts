import { json, type RequestHandler } from '@sveltejs/kit';
import { requireUser, updateProfileFields } from '$lib/cuenta/data';
import { joinPersonName } from '$lib/cuenta/profile-prefill';
import type { ProfileDireccion } from '$lib/supabase/types';
import {
	normalizePhone,
	validateNifNie,
	validatePhone,
	validateRequired
} from '$lib/utils/validators';

export const PATCH: RequestHandler = async ({ request, locals }) => {
	const user = requireUser(locals);
	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'JSON inválido' }, { status: 400 });
	}

	const nombre =
		typeof body.nombre === 'string'
			? body.nombre.trim()
			: (locals.profile?.nombre || '').trim();
	const apellido1 =
		typeof body.apellido1 === 'string'
			? body.apellido1.trim()
			: (locals.profile?.apellido1 || '').trim();
	const apellido2 =
		typeof body.apellido2 === 'string'
			? body.apellido2.trim()
			: (locals.profile?.apellido2 || '').trim();

	const telefonoRaw =
		typeof body.telefono === 'string' ? body.telefono.trim() : locals.profile?.telefono || '';
	const nifRaw =
		typeof body.nif === 'string'
			? body.nif.trim().toUpperCase().replace(/[\s-]/g, '')
			: (locals.profile?.nif || '').toUpperCase().replace(/[\s-]/g, '');

	const nameErr =
		validateRequired(nombre, 'El nombre') ||
		validateRequired(apellido1, 'El primer apellido') ||
		validateRequired(apellido2, 'El segundo apellido');
	const phoneErr = validatePhone(telefonoRaw);
	const nifErr = validateNifNie(nifRaw);
	const first = nameErr || phoneErr || nifErr;
	if (first) return json({ error: first }, { status: 400 });

	const full_name = joinPersonName(nombre, apellido1, apellido2);
	const fields: Parameters<typeof updateProfileFields>[1] = {
		full_name,
		nombre,
		apellido1,
		apellido2,
		telefono: normalizePhone(telefonoRaw),
		nif: nifRaw
	};
	if (body.direccion && typeof body.direccion === 'object') {
		fields.direccion = body.direccion as ProfileDireccion;
	}

	const profile = await updateProfileFields(user.id, fields);
	return json({ ok: true, profile });
};
