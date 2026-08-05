import { error } from '@sveltejs/kit';
import { getServiceSupabase } from '$lib/supabase/admin';
import type {
	Notificacion,
	Profile,
	Solicitud,
	SolicitudDocumento,
	SolicitudStatus,
	Vehiculo
} from '$lib/supabase/types';
import { SOLICITUD_STATUSES, SOLICITUD_STATUS_LABELS } from '$lib/supabase/types';

/** PostgREST / Postgres: tabla o columna aún no migrada */
export function isSchemaMissingError(err: { message?: string; code?: string } | null): boolean {
	if (!err) return false;
	const msg = (err.message || '').toLowerCase();
	return (
		err.code === 'PGRST205' ||
		err.code === '42P01' ||
		err.code === '42703' ||
		msg.includes('does not exist') ||
		msg.includes('schema cache') ||
		msg.includes('could not find the table')
	);
}

export const SCHEMA_HINT =
	'Falta aplicar la migración SQL 20260724_panel_usuario.sql en el SQL Editor de Supabase.';

export function requireUser(locals: App.Locals) {
	if (!locals.user) throw error(401, 'Debes iniciar sesión');
	return locals.user;
}

export function requireService() {
	const sb = getServiceSupabase();
	if (!sb) throw error(503, 'Supabase no configurado');
	return sb;
}

export async function listUserSolicitudes(
	userId: string,
	filter: 'en_curso' | 'realizados' | 'todos' = 'todos'
): Promise<Solicitud[]> {
	const sb = requireService();
	let q = sb
		.from('solicitudes')
		.select('*')
		.eq('user_id', userId)
		.order('created_at', { ascending: false })
		.limit(200);

	if (filter === 'en_curso') q = q.in('status', ['nueva', 'en_curso', 'pendiente_pago', 'pagada']);
	if (filter === 'realizados') q = q.in('status', ['realizada', 'cancelada']);

	const { data, error: err } = await q;
	if (err) throw error(500, err.message);
	return (data ?? []) as Solicitud[];
}

export async function getUserSolicitud(userId: string, id: string): Promise<Solicitud> {
	const sb = requireService();
	const { data, error: err } = await sb
		.from('solicitudes')
		.select('*')
		.eq('id', id)
		.eq('user_id', userId)
		.maybeSingle();
	if (err) throw error(500, err.message);
	if (!data) throw error(404, 'Solicitud no encontrada');
	return data as Solicitud;
}

/** Asocia solicitudes anónimas (mismo email, sin user_id) al usuario que inicia sesión. */
export async function claimAnonymousSolicitudes(userId: string, email: string | null | undefined) {
	const normalized = (email || '').trim().toLowerCase();
	if (!normalized) return 0;
	const sb = getServiceSupabase();
	if (!sb) return 0;
	const { data, error: err } = await sb
		.from('solicitudes')
		.update({ user_id: userId })
		.is('user_id', null)
		.ilike('email', normalized)
		.select('id');
	if (err) {
		console.error('[claim] solicitudes', err.message);
		return 0;
	}
	return (data || []).length;
}

export function canUserUploadDocs(status: string): boolean {
	return (
		status === 'nueva' ||
		status === 'en_curso' ||
		status === 'pendiente_pago' ||
		status === 'pagada'
	);
}

export async function updateUserSolicitudPayload(
	userId: string,
	id: string,
	payload: Record<string, unknown>
): Promise<Solicitud> {
	const sb = requireService();
	const current = await getUserSolicitud(userId, id);
	if (current.status !== 'nueva') {
		throw error(403, 'Solo puedes editar trámites en estado nueva');
	}
	const { data, error: err } = await sb
		.from('solicitudes')
		.update({ payload })
		.eq('id', id)
		.eq('user_id', userId)
		.select('*')
		.maybeSingle();
	if (err) throw error(500, err.message);
	if (!data) throw error(404, 'Solicitud no encontrada');
	return data as Solicitud;
}

/** Crea o actualiza un borrador de trámite (status nueva) sin validación completa. */
export async function upsertDraftSolicitud(
	userId: string,
	opts: {
		tipo: string;
		payload: Record<string, unknown>;
		email?: string | null;
		solicitudId?: string | null;
	}
): Promise<Solicitud> {
	const sb = requireService();
	const email =
		(opts.email || '').trim().toLowerCase() ||
		(typeof opts.payload.email === 'string' ? opts.payload.email.trim().toLowerCase() : '') ||
		null;

	if (opts.solicitudId) {
		const current = await getUserSolicitud(userId, opts.solicitudId);
		if (current.status !== 'nueva') {
			throw error(403, 'Solo puedes editar trámites en estado nueva');
		}
		const { data, error: err } = await sb
			.from('solicitudes')
			.update({
				payload: opts.payload,
				tipo: opts.tipo,
				email: email || current.email
			})
			.eq('id', opts.solicitudId)
			.eq('user_id', userId)
			.select('*')
			.maybeSingle();
		if (err) throw error(500, err.message);
		if (!data) throw error(404, 'Solicitud no encontrada');
		return data as Solicitud;
	}

	const id = crypto.randomUUID();
	const { data, error: err } = await sb
		.from('solicitudes')
		.insert({
			id,
			tipo: opts.tipo,
			payload: opts.payload,
			user_id: userId,
			email,
			status: 'nueva',
			created_at: new Date().toISOString()
		})
		.select('*')
		.maybeSingle();
	if (err) throw error(500, err.message);
	if (!data) throw error(500, 'No se pudo guardar el trámite');
	return data as Solicitud;
}

/** Promueve un borrador `nueva` a `pendiente_pago` con el payload final. */
export async function promoteSolicitudToPayment(
	userId: string,
	id: string,
	payload: Record<string, unknown>
): Promise<Solicitud> {
	const sb = requireService();
	const current = await getUserSolicitud(userId, id);
	if (current.status !== 'nueva') {
		throw error(403, 'Este trámite ya no se puede enviar a pago desde el borrador');
	}
	const { data, error: err } = await sb
		.from('solicitudes')
		.update({ payload, status: 'pendiente_pago' })
		.eq('id', id)
		.eq('user_id', userId)
		.select('*')
		.maybeSingle();
	if (err) throw error(500, err.message);
	if (!data) throw error(404, 'Solicitud no encontrada');
	return data as Solicitud;
}

export async function updateProfileFields(
	userId: string,
	fields: Partial<
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
			| 'email'
		>
	>
): Promise<Profile> {
	const sb = requireService();
	const { data, error: err } = await sb
		.from('profiles')
		.update(fields)
		.eq('id', userId)
		.select('*')
		.maybeSingle();
	if (err) {
		if (isSchemaMissingError(err)) throw error(503, SCHEMA_HINT);
		throw error(500, err.message);
	}
	if (!data) throw error(404, 'Perfil no encontrado');
	return data as Profile;
}

export async function listVehiculos(userId: string): Promise<Vehiculo[]> {
	const sb = requireService();
	const { data, error: err } = await sb
		.from('vehiculos')
		.select('*')
		.eq('user_id', userId)
		.order('updated_at', { ascending: false });
	if (err) {
		console.error('[vehiculos] list', err.message);
		if (isSchemaMissingError(err)) return [];
		throw error(500, err.message);
	}
	return (data ?? []) as Vehiculo[];
}

export async function upsertVehiculoFromPayload(
	userId: string,
	payload: Record<string, unknown>
): Promise<Vehiculo | null> {
	const matricula = String(payload.matricula || '')
		.trim()
		.toUpperCase()
		.replace(/\s+/g, '');
	if (!matricula) return null;

	const tipo = String(payload.tipoVehiculo || payload.variant || payload.tipo || 'coche');
	const marca = payload.marca != null ? String(payload.marca) : null;
	const modelo = payload.modelo != null ? String(payload.modelo) : null;
	const bastidor = payload.bastidor != null ? String(payload.bastidor) : null;

	const sb = requireService();
	const { data, error: err } = await sb
		.from('vehiculos')
		.upsert(
			{
				user_id: userId,
				matricula,
				tipo,
				marca,
				modelo,
				bastidor,
				meta: {
					combustible: payload.combustible ?? null,
					cilindrada: payload.cilindrada ?? null,
					marcaId: payload.marcaId ?? null,
					modeloId: payload.modeloId ?? null
				}
			},
			{ onConflict: 'user_id,matricula' }
		)
		.select('*')
		.maybeSingle();

	if (err) {
		console.error('[vehiculos] upsert failed', err.message);
		return null;
	}
	return data as Vehiculo;
}

export async function createVehiculo(
	userId: string,
	input: {
		matricula: string;
		tipo?: string;
		marca?: string;
		modelo?: string;
		bastidor?: string;
		meta?: Record<string, unknown>;
	}
): Promise<Vehiculo> {
	const sb = requireService();
	const matricula = input.matricula.trim().toUpperCase().replace(/\s+/g, '');
	const { data, error: err } = await sb
		.from('vehiculos')
		.insert({
			user_id: userId,
			matricula,
			tipo: input.tipo || 'coche',
			marca: input.marca || null,
			modelo: input.modelo || null,
			bastidor: input.bastidor || null,
			meta: input.meta || {}
		})
		.select('*')
		.maybeSingle();
	if (err) throw error(400, err.message);
	if (!data) throw error(500, 'No se pudo crear el vehículo');
	return data as Vehiculo;
}

export async function updateVehiculo(
	userId: string,
	id: string,
	input: Partial<Pick<Vehiculo, 'matricula' | 'tipo' | 'marca' | 'modelo' | 'bastidor' | 'meta'>>
): Promise<Vehiculo> {
	const sb = requireService();
	const patch: Record<string, unknown> = { ...input };
	if (typeof patch.matricula === 'string') {
		patch.matricula = patch.matricula.trim().toUpperCase().replace(/\s+/g, '');
	}
	const { data, error: err } = await sb
		.from('vehiculos')
		.update(patch)
		.eq('id', id)
		.eq('user_id', userId)
		.select('*')
		.maybeSingle();
	if (err) throw error(400, err.message);
	if (!data) throw error(404, 'Vehículo no encontrado');
	return data as Vehiculo;
}

export async function deleteVehiculo(userId: string, id: string): Promise<void> {
	const sb = requireService();
	const { error: err } = await sb.from('vehiculos').delete().eq('id', id).eq('user_id', userId);
	if (err) throw error(500, err.message);
}

export async function listDocsForUser(userId: string): Promise<SolicitudDocumento[]> {
	const sb = requireService();
	const { data, error: err } = await sb
		.from('solicitud_documentos')
		.select('*')
		.eq('user_id', userId)
		.order('created_at', { ascending: false })
		.limit(200);
	if (err) {
		console.error('[docs] list user', err.message);
		if (isSchemaMissingError(err)) return [];
		throw error(500, err.message);
	}
	return (data ?? []) as SolicitudDocumento[];
}

export async function listDocsForSolicitud(solicitudId: string): Promise<SolicitudDocumento[]> {
	const sb = requireService();
	const { data, error: err } = await sb
		.from('solicitud_documentos')
		.select('*')
		.eq('solicitud_id', solicitudId)
		.order('created_at', { ascending: false });
	if (err) {
		console.error('[docs] list solicitud', err.message);
		if (isSchemaMissingError(err)) return [];
		throw error(500, err.message);
	}
	return (data ?? []) as SolicitudDocumento[];
}

export async function listNotificaciones(userId: string): Promise<Notificacion[]> {
	const sb = requireService();
	const { data, error: err } = await sb
		.from('notificaciones')
		.select('*')
		.eq('user_id', userId)
		.order('created_at', { ascending: false })
		.limit(100);
	if (err) {
		console.error('[notificaciones] list', err.message);
		if (isSchemaMissingError(err)) return [];
		throw error(500, err.message);
	}
	return (data ?? []) as Notificacion[];
}

export async function countUnreadNotificaciones(userId: string): Promise<number> {
	const sb = requireService();
	const { count, error: err } = await sb
		.from('notificaciones')
		.select('*', { count: 'exact', head: true })
		.eq('user_id', userId)
		.is('read_at', null);
	if (err) {
		console.error('[notificaciones] count', err.message);
		if (isSchemaMissingError(err)) return 0;
		throw error(500, err.message);
	}
	return count ?? 0;
}

export async function markNotificacionRead(userId: string, id: string): Promise<void> {
	const sb = requireService();
	const { error: err } = await sb
		.from('notificaciones')
		.update({ read_at: new Date().toISOString() })
		.eq('id', id)
		.eq('user_id', userId);
	if (err) throw error(500, err.message);
}

export async function markAllNotificacionesRead(userId: string): Promise<void> {
	const sb = requireService();
	const { error: err } = await sb
		.from('notificaciones')
		.update({ read_at: new Date().toISOString() })
		.eq('user_id', userId)
		.is('read_at', null);
	if (err) throw error(500, err.message);
}

export async function createNotificacion(input: {
	user_id: string;
	tipo?: string;
	titulo: string;
	cuerpo?: string;
	link?: string;
}): Promise<void> {
	const sb = requireService();
	const { error: err } = await sb.from('notificaciones').insert({
		user_id: input.user_id,
		tipo: input.tipo || 'info',
		titulo: input.titulo,
		cuerpo: input.cuerpo || null,
		link: input.link || null
	});
	if (err) console.error('[notificaciones] insert failed', err.message);
}

export async function adminUpdateSolicitudStatus(
	id: string,
	status: SolicitudStatus
): Promise<Solicitud> {
	if (!SOLICITUD_STATUSES.includes(status)) {
		throw error(400, 'Estado inválido');
	}
	const sb = requireService();
	const { data: prev, error: e1 } = await sb.from('solicitudes').select('*').eq('id', id).maybeSingle();
	if (e1) throw error(500, e1.message);
	if (!prev) throw error(404, 'Solicitud no encontrada');

	const { data, error: err } = await sb
		.from('solicitudes')
		.update({ status })
		.eq('id', id)
		.select('*')
		.maybeSingle();
	if (err) throw error(500, err.message);
	if (!data) throw error(404, 'Solicitud no encontrada');

	const sol = data as Solicitud;
	if (sol.user_id) {
		await createNotificacion({
			user_id: sol.user_id,
			tipo: 'status',
			titulo: `Trámite actualizado: ${SOLICITUD_STATUS_LABELS[status]}`,
			cuerpo: `Tu solicitud ${sol.tipo} ha pasado a estado «${SOLICITUD_STATUS_LABELS[status]}».`,
			link: `/cuenta/tramites/${sol.id}`
		});
	}
	return sol;
}

export async function getProfileById(userId: string): Promise<Profile | null> {
	const sb = requireService();
	const { data } = await sb.from('profiles').select('*').eq('id', userId).maybeSingle();
	return (data as Profile) || null;
}
