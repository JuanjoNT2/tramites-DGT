import { json, type RequestHandler } from '@sveltejs/kit';
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { env } from '$env/dynamic/private';
import { getServiceSupabase } from '$lib/supabase/admin';
import { upsertVehiculoFromPayload } from '$lib/cuenta/data';

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
	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Petición inválida' }, { status: 400 });
	}

	const tipo = String(body.tipo ?? 'desconocido');
	const emailFromPayload =
		typeof body.email === 'string' && body.email.trim()
			? body.email.trim().toLowerCase()
			: null;
	const userId = locals.user?.id ?? null;
	const email = emailFromPayload || locals.user?.email || null;
	const id = crypto.randomUUID();
	const created_at = new Date().toISOString();

	const sb = getServiceSupabase();
	if (sb) {
		const { error } = await sb.from('solicitudes').insert({
			id,
			tipo,
			payload: body,
			user_id: userId,
			email,
			status: 'nueva',
			created_at
		});

		if (error) {
			console.error('[solicitud] supabase insert failed', error.message);
			return json({ error: 'No se pudo registrar la solicitud.' }, { status: 500 });
		}

		if (userId) {
			await upsertVehiculoFromPayload(userId, body).catch(() => null);
		}

		return json({
			ok: true,
			id,
			message: 'Solicitud registrada correctamente.',
			cuentaUrl: userId ? `/cuenta/tramites/${id}` : null
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
		message: 'Solicitud registrada correctamente (modo demostración local).',
		cuentaUrl: userId ? `/cuenta/tramites/${id}` : null
	});
};
