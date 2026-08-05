import { json, type RequestHandler } from '@sveltejs/kit';
import { isStaffRole } from '$lib/auth/roles';
import { createNotificacion, getProfileById } from '$lib/cuenta/data';
import { displayFirstName } from '$lib/cuenta/profile-prefill';
import { sendGestorAvisoEmail } from '$lib/server/mailer';
import { getServiceSupabase } from '$lib/supabase/admin';

/**
 * Gestor/admin envía aviso in-app + email al ciudadano.
 * Body: { userId, titulo, cuerpo?, solicitudId? }
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || !isStaffRole(locals.profile?.role)) {
		return json({ error: 'No autorizado' }, { status: 403 });
	}

	let body: {
		userId?: string;
		titulo?: string;
		cuerpo?: string;
		solicitudId?: string;
		link?: string;
	};
	try {
		body = await request.json();
	} catch {
		return json({ error: 'JSON inválido' }, { status: 400 });
	}

	const userId = (body.userId || '').trim();
	const titulo = (body.titulo || '').trim();
	const cuerpo = (body.cuerpo || '').trim();
	const solicitudId = (body.solicitudId || '').trim();
	let link = (body.link || '').trim();

	if (!userId || !titulo) {
		return json({ error: 'userId y titulo son obligatorios' }, { status: 400 });
	}
	if (titulo.length > 160) {
		return json({ error: 'El título es demasiado largo (máx. 160).' }, { status: 400 });
	}
	if (cuerpo.length > 4000) {
		return json({ error: 'El mensaje es demasiado largo.' }, { status: 400 });
	}

	const profile = await getProfileById(userId);
	if (!profile) {
		return json({ error: 'Cliente no encontrado' }, { status: 404 });
	}

	if (solicitudId) {
		const sb = getServiceSupabase();
		if (!sb) return json({ error: 'Supabase no configurado' }, { status: 503 });
		const { data: sol } = await sb
			.from('solicitudes')
			.select('id, user_id')
			.eq('id', solicitudId)
			.maybeSingle();
		if (!sol || sol.user_id !== userId) {
			return json({ error: 'El trámite no pertenece a este cliente' }, { status: 400 });
		}
		link = `/cuenta/tramites/${solicitudId}`;
	} else if (link && !link.startsWith('/')) {
		return json({ error: 'El enlace debe ser una ruta interna (empieza por /)' }, { status: 400 });
	}

	if (!link) link = '/cuenta/notificaciones';

	await createNotificacion({
		user_id: userId,
		tipo: 'gestor',
		titulo,
		cuerpo: cuerpo || undefined,
		link
	});

	const to = (profile.email || '').trim().toLowerCase();
	let emailSent = false;
	if (to) {
		emailSent = await sendGestorAvisoEmail({
			to,
			titulo,
			cuerpo: cuerpo || null,
			nombre: displayFirstName(profile, to),
			link
		});
	}

	return json({
		ok: true,
		emailSent,
		emailSkipped: !to ? 'sin_email' : emailSent ? null : 'sendgrid_omitido'
	});
};
