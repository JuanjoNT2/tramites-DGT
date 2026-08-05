import { json, type RequestHandler } from '@sveltejs/kit';
import { requireUser, updateProfileFields } from '$lib/cuenta/data';
import {
	joinPersonName,
	normalizeFechaNacimiento,
	normalizeSexo
} from '$lib/cuenta/profile-prefill';
import type { ProfileDireccion } from '$lib/supabase/types';
import {
	normalizePhone,
	validateDate,
	validateNifNie,
	validatePhone,
	validateRequired,
	todayIso
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

	let fecha_nacimiento: string | null | undefined;
	if ('fecha_nacimiento' in body || 'fechaNacimiento' in body) {
		const raw = normalizeFechaNacimiento(body.fecha_nacimiento ?? body.fechaNacimiento);
		if (!raw) {
			fecha_nacimiento = null;
		} else {
			const dateErr = validateDate(raw, {
				label: 'La fecha de nacimiento',
				required: true,
				max: todayIso()
			});
			if (dateErr) return json({ error: dateErr }, { status: 400 });
			fecha_nacimiento = raw;
		}
	}

	let sexo: string | null | undefined;
	if ('sexo' in body) {
		const raw = typeof body.sexo === 'string' ? body.sexo.trim() : '';
		if (!raw) {
			sexo = null;
		} else {
			const norm = normalizeSexo(raw);
			if (!norm) return json({ error: 'Sexo no válido.' }, { status: 400 });
			sexo = norm;
		}
	}

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
	if (fecha_nacimiento !== undefined) {
		fields.fecha_nacimiento = fecha_nacimiento;
	}
	if (sexo !== undefined) {
		fields.sexo = sexo;
	}

	const profile = await updateProfileFields(user.id, fields);
	return json({ ok: true, profile });
};
