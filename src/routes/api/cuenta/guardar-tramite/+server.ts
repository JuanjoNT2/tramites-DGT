import { json, type RequestHandler } from '@sveltejs/kit';
import { isStaffRole } from '$lib/auth/roles';
import {
	requireUser,
	upsertDraftSolicitud,
	upsertVehiculoFromPayload,
	updateProfileFields
} from '$lib/cuenta/data';
import { profilePatchFromSolicitantePayload } from '$lib/cuenta/profile-prefill';
import { validateEmail, validateMatricula, validateNifNie, validatePhone } from '$lib/utils/validators';

function str(v: unknown): string {
	return typeof v === 'string' ? v : v == null ? '' : String(v);
}

/** Guardado blando: formatos solo si el campo viene relleno. */
function softFormatErrors(payload: Record<string, unknown>): string | null {
	const matricula = str(payload.matricula).trim();
	if (matricula) {
		const e = validateMatricula(matricula);
		if (e) return e;
	}
	const email = str(payload.email).trim();
	if (email) {
		const e = validateEmail(email);
		if (e) return e;
	}
	const nif = str(payload.nif).trim();
	if (nif) {
		const e = validateNifNie(nif);
		if (e) return e;
	}
	const telefono = str(payload.telefono).trim();
	if (telefono) {
		const e = validatePhone(telefono);
		if (e) return e;
	}
	const otra = str(payload.otraParteEmail).trim();
	if (otra) {
		const e = validateEmail(otra);
		if (e) return e;
	}
	return null;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = requireUser(locals);
	if (isStaffRole(locals.profile?.role)) {
		return json(
			{ error: 'Las cuentas de gestor no pueden iniciar trámites de ciudadano.' },
			{ status: 403 }
		);
	}
	let body: {
		tipo?: string;
		payload?: Record<string, unknown>;
		solicitudId?: string;
	};
	try {
		body = await request.json();
	} catch {
		return json({ error: 'JSON inválido' }, { status: 400 });
	}

	const tipo = str(body.tipo).trim();
	if (!tipo) return json({ error: 'tipo obligatorio' }, { status: 400 });
	if (!body.payload || typeof body.payload !== 'object') {
		return json({ error: 'payload obligatorio' }, { status: 400 });
	}

	const payload: Record<string, unknown> = {
		...body.payload,
		tipo,
		wizardSavedAt: new Date().toISOString()
	};
	const formatErr = softFormatErrors(payload);
	if (formatErr) return json({ error: formatErr }, { status: 400 });

	const email = str(payload.email).trim().toLowerCase() || user.email?.toLowerCase() || null;
	if (email && !payload.email) payload.email = email;

	const sol = await upsertDraftSolicitud(user.id, {
		tipo,
		payload,
		email,
		solicitudId: body.solicitudId ? String(body.solicitudId) : null
	});

	const vehiculo = await upsertVehiculoFromPayload(user.id, payload).catch(() => null);

	const profilePatch = profilePatchFromSolicitantePayload(payload);
	if (Object.keys(profilePatch).length) {
		await updateProfileFields(user.id, profilePatch).catch((e) =>
			console.error('[guardar-tramite] profile sync', e)
		);
	}

	return json({
		ok: true,
		solicitudId: sol.id,
		cuentaUrl: `/cuenta/tramites/${sol.id}`,
		vehiculoSaved: Boolean(vehiculo),
		message: vehiculo
			? 'Trámite y vehículo guardados en tu cuenta.'
			: 'Trámite guardado en tu cuenta.'
	});
};
