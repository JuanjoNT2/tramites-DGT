import { json, type RequestHandler } from '@sveltejs/kit';
import { requireUser, updateProfileFields } from '$lib/cuenta/data';
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

	const full_name =
		typeof body.full_name === 'string' ? body.full_name.trim() : locals.profile?.full_name || '';
	const telefonoRaw =
		typeof body.telefono === 'string' ? body.telefono.trim() : locals.profile?.telefono || '';
	const nifRaw =
		typeof body.nif === 'string'
			? body.nif.trim().toUpperCase().replace(/[\s-]/g, '')
			: (locals.profile?.nif || '').toUpperCase().replace(/[\s-]/g, '');

	const nameErr = validateRequired(full_name, 'El nombre completo');
	const phoneErr = validatePhone(telefonoRaw);
	const nifErr = validateNifNie(nifRaw);
	const first = nameErr || phoneErr || nifErr;
	if (first) return json({ error: first }, { status: 400 });

	const fields: Parameters<typeof updateProfileFields>[1] = {
		full_name,
		telefono: normalizePhone(telefonoRaw),
		nif: nifRaw
	};
	if (body.direccion && typeof body.direccion === 'object') {
		fields.direccion = body.direccion as ProfileDireccion;
	}

	const profile = await updateProfileFields(user.id, fields);
	return json({ ok: true, profile });
};
