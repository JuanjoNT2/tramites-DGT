import { json, type RequestHandler } from '@sveltejs/kit';
import { canAccessProveedorPanel } from '$lib/auth/roles';
import { updateSolicitudStatusByStaff } from '$lib/cuenta/data';
import { loadProveedorTramiteById } from '$lib/proveedor/data';
import type { SolicitudStatus } from '$lib/supabase/types';
import { SOLICITUD_STATUSES } from '$lib/supabase/types';

/** Cambio de estado desde el panel del proveedor, solo sobre sus propios trámites. */
export const PATCH: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || !canAccessProveedorPanel(locals.profile)) {
		return json({ error: 'No autorizado' }, { status: 403 });
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
		return json({ error: 'id y status válidos son obligatorios' }, { status: 400 });
	}

	// Lanza 404 si la solicitud no es un distintivo ambiental
	await loadProveedorTramiteById(id);

	const item = await updateSolicitudStatusByStaff(id, status);
	return json({ ok: true, item });
};
