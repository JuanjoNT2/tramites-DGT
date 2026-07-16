import { json, type RequestHandler } from '@sveltejs/kit';
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

export const POST: RequestHandler = async ({ request }) => {
	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Petición inválida' }, { status: 400 });
	}

	const dir = path.join(process.cwd(), '.data');
	if (!existsSync(dir)) await mkdir(dir, { recursive: true });
	const file = path.join(dir, 'solicitudes.json');

	let entries: { id: string; tipo: string; data: Record<string, unknown>; created_at: string }[] =
		[];
	if (existsSync(file)) entries = JSON.parse(await readFile(file, 'utf-8'));

	const entry = {
		id: crypto.randomUUID(),
		tipo: (body.tipo as string) ?? 'desconocido',
		data: body,
		created_at: new Date().toISOString()
	};
	entries.push(entry);
	await writeFile(file, JSON.stringify(entries, null, 2));

	return json({
		ok: true,
		id: entry.id,
		message: 'Solicitud registrada correctamente (modo demostración).'
	});
};
