import { json, type RequestHandler } from '@sveltejs/kit';
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { env } from '$env/dynamic/private';
import { isStaffRole } from '$lib/auth/roles';
import { getServiceSupabase } from '$lib/supabase/admin';
import { upsertVehiculoFromPayload } from '$lib/cuenta/data';
import { validateSolicitudPayload } from '$lib/server/solicitud-validate';
import { sendOtraParteInviteEmail, sendSolicitudReceivedEmail } from '$lib/server/mailer';
import { generatePagoAccessToken } from '$lib/pago/access';

type LocalEntry = {
	id: string;
	tipo: string;
	data: Record<string, unknown>;
	user_id?: string | null;
	email?: string | null;
	created_at: string;
};

async function saveLocalFallback(entry: LocalEntry) {
	const dir = path.join(process.cwd(), '.data');
	if (!existsSync(dir)) await mkdir(dir, { recursive: true });
	const file = path.join(dir, 'solicitudes.json');
	let entries: LocalEntry[] = [];
	if (existsSync(file)) entries = JSON.parse(await readFile(file, 'utf-8'));
	entries.push(entry);
	await writeFile(file, JSON.stringify(entries, null, 2));
}

export const POST: RequestHandler = async ({ request, locals }) => {
	if (locals.user && isStaffRole(locals.profile?.role)) {
		return json(
			{ error: 'Las cuentas de gestor no pueden iniciar trámites de ciudadano.' },
			{ status: 403 }
		);
	}

	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Petición inválida' }, { status: 400 });
	}

	const tipo = String(body.tipo ?? 'desconocido');
	const validated = validateSolicitudPayload(tipo, body);
	if (!validated.ok) {
		return json({ error: validated.error }, { status: 400 });
	}

	const userId = locals.user?.id ?? null;
	const email = validated.email || locals.user?.email?.toLowerCase() || null;
	if (email && !body.email) body.email = email;
	if (validated.amount != null) {
		body.amount = validated.amount;
		body.total = validated.amount;
		body.pago = {
			...((body.pago as Record<string, unknown>) || {}),
			amount: validated.amount,
			currency: 'EUR'
		};
	}

	const accessToken = generatePagoAccessToken();
	body.accessToken = accessToken;

	const id = crypto.randomUUID();
	const created_at = new Date().toISOString();

	const requestedStatus = typeof body.status === 'string' ? body.status : 'nueva';
	const status =
		requestedStatus === 'pendiente_pago' || requestedStatus === 'nueva'
			? requestedStatus
			: 'nueva';

	const sb = getServiceSupabase();
	if (sb) {
		const { error } = await sb.from('solicitudes').insert({
			id,
			tipo,
			payload: body,
			user_id: userId,
			email,
			status,
			created_at
		});

		if (error) {
			console.error('[solicitud] supabase insert failed', error.message);
			return json({ error: 'No se pudo registrar la solicitud.' }, { status: 500 });
		}

		if (userId) {
			await upsertVehiculoFromPayload(userId, body).catch(() => null);
		}

		if (email) {
			sendSolicitudReceivedEmail({
				to: email,
				solicitudId: id,
				tipo,
				nombre: typeof body.nombre === 'string' ? body.nombre : null,
				accessToken
			}).catch((e) => console.error('[solicitud] email', e));
		}

		const otraParte =
			typeof body.otraParteEmail === 'string' ? body.otraParteEmail.trim().toLowerCase() : '';
		if (otraParte && otraParte !== email) {
			sendOtraParteInviteEmail({
				to: otraParte,
				fromNombre: typeof body.nombre === 'string' ? body.nombre : 'Un usuario',
				solicitudId: id,
				accessToken
			}).catch((e) => console.error('[solicitud] invite email', e));
		}

		return json({
			ok: true,
			id,
			accessToken,
			message: 'Solicitud registrada correctamente.',
			cuentaUrl: userId ? `/cuenta/tramites/${id}` : null,
			pagoUrl: `/pago/${id}?t=${encodeURIComponent(accessToken)}`
		});
	}

	const isProdLike = Boolean(env.VERCEL || env.NODE_ENV === 'production');
	if (isProdLike) {
		return json(
			{ error: 'Almacén de solicitudes no configurado (SUPABASE_*).' },
			{ status: 503 }
		);
	}

	await saveLocalFallback({
		id,
		tipo,
		data: body,
		user_id: userId,
		email,
		created_at
	});

	return json({
		ok: true,
		id,
		accessToken,
		message: 'Solicitud registrada correctamente (modo demostración local).',
		cuentaUrl: userId ? `/cuenta/tramites/${id}` : null,
		pagoUrl: `/pago/${id}?t=${encodeURIComponent(accessToken)}`
	});
};
