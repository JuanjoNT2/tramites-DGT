import { json, type RequestHandler } from '@sveltejs/kit';
import { canChangeSolicitudStatus } from '$lib/auth/roles';
import { adminUpdateSolicitudStatus } from '$lib/cuenta/data';
import type { SolicitudStatus } from '$lib/supabase/types';
import { SOLICITUD_STATUSES } from '$lib/supabase/types';

/** Cambio de status: solo rol admin (Supabase Auth), no el gate ADMIN_PASSWORD. */
export const PATCH: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || !canChangeSolicitudStatus(locals.profile)) {
		return json({ error: 'Solo un admin puede cambiar el estado' }, { status: 403 });
	}

	let body: { id?: string; status?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'JSON inválido' }, { status: 400 });
	}

	const id = body.id;
	const status = body.status as SolicitudStatus | undefined;
	if (!id || !status || !SOLICITUD_STATUSES.includes(status)) {
		return json(
			{ error: 'id y status (nueva|pendiente_pago|pagada|en_curso|realizada|cancelada) requeridos' },
			{ status: 400 }
		);
	}

	const item = await adminUpdateSolicitudStatus(id, status);
	return json({ ok: true, item });
};
