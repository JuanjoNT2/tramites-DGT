import { getServiceSupabase } from '$lib/supabase/admin';
import { classifySolicitud } from '$lib/gestor/clients';
import { classifyTramiteBucket, type TramiteBucket } from '$lib/gestor/board';
import { PROVEEDOR_TIPOS } from '$lib/proveedor/scope';
import { facturaEmitidaFromPayload, solicitaFacturaFromPayload } from '$lib/tramite/factura-cliente';
import type { Solicitud } from '$lib/supabase/types';

export type GestorTramiteVista = 'pendientes' | 'finalizados' | 'todos';

export type TramiteBoard = Record<TramiteBucket, TramiteResumen[]>;

export type TramiteResumen = {
	id: string;
	tipo: string;
	status: string;
	email: string | null;
	userId: string | null;
	matricula: string | null;
	createdAt: string;
	updatedAt: string | null;
	solicitaFactura: boolean;
	facturaEmitida: boolean;
};

function toResumen(s: Solicitud): TramiteResumen {
	const payload = (s.payload || {}) as Record<string, unknown>;
	const mat = String(payload.matricula ?? '').trim();
	return {
		id: s.id,
		tipo: s.tipo,
		status: String(s.status),
		email: s.email,
		userId: s.user_id,
		matricula: mat || null,
		createdAt: s.created_at,
		updatedAt: s.updated_at ?? null,
		solicitaFactura: solicitaFacturaFromPayload(payload),
		facturaEmitida: facturaEmitidaFromPayload(payload)
	};
}

function matchesQuery(t: TramiteResumen, query: string): boolean {
	return (
		t.id.toLowerCase().includes(query) ||
		t.tipo.toLowerCase().includes(query) ||
		t.status.toLowerCase().includes(query) ||
		(t.email || '').toLowerCase().includes(query) ||
		(t.matricula || '').toLowerCase().includes(query) ||
		(t.userId || '').toLowerCase().includes(query)
	);
}

function emptyBoard(): TramiteBoard {
	return { por_hacer: [], en_curso: [], hecho: [] };
}

export async function loadGestorTramites(
	vista: GestorTramiteVista,
	q = ''
): Promise<{
	items: TramiteResumen[];
	board: TramiteBoard;
	counts: { pendientes: number; finalizados: number; todos: number };
	error: string | null;
}> {
	const sb = getServiceSupabase();
	if (!sb) {
		return {
			items: [],
			board: emptyBoard(),
			counts: { pendientes: 0, finalizados: 0, todos: 0 },
			error: 'Supabase no configurado.'
		};
	}

	// Los distintivos ambientales los lleva el proveedor externo, no el gestor
	const { data: sols, error } = await sb
		.from('solicitudes')
		.select('*')
		.not('tipo', 'in', `(${PROVEEDOR_TIPOS.join(',')})`)
		.order('created_at', { ascending: false })
		.limit(5000);

	if (error) {
		return {
			items: [],
			board: emptyBoard(),
			counts: { pendientes: 0, finalizados: 0, todos: 0 },
			error: error.message
		};
	}

	const query = q.trim().toLowerCase();
	const all = ((sols ?? []) as Solicitud[])
		.map(toResumen)
		.filter((t) => !query || matchesQuery(t, query));

	const pendientes = all.filter((t) => classifySolicitud(t.status) === 'pendiente');
	const finalizados = all.filter((t) => classifySolicitud(t.status) === 'finalizado');

	const counts = {
		pendientes: pendientes.length,
		finalizados: finalizados.length,
		todos: all.length
	};

	const board = emptyBoard();
	for (const t of all) board[classifyTramiteBucket(t.status)].push(t);

	const items = vista === 'pendientes' ? pendientes : vista === 'finalizados' ? finalizados : all;

	return { items, board, counts, error: null };
}
