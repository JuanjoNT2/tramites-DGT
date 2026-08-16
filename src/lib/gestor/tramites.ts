import { getServiceSupabase } from '$lib/supabase/admin';
import { classifySolicitud } from '$lib/gestor/clients';
import { facturaEmitidaFromPayload, solicitaFacturaFromPayload } from '$lib/tramite/factura-cliente';
import type { Solicitud } from '$lib/supabase/types';

export type GestorTramiteVista = 'pendientes' | 'finalizados' | 'todos';

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

export async function loadGestorTramites(
	vista: GestorTramiteVista,
	q = ''
): Promise<{
	items: TramiteResumen[];
	counts: { pendientes: number; finalizados: number; todos: number };
	error: string | null;
}> {
	const sb = getServiceSupabase();
	if (!sb) {
		return {
			items: [],
			counts: { pendientes: 0, finalizados: 0, todos: 0 },
			error: 'Supabase no configurado.'
		};
	}

	const { data: sols, error } = await sb
		.from('solicitudes')
		.select('*')
		.order('created_at', { ascending: false })
		.limit(5000);

	if (error) {
		return {
			items: [],
			counts: { pendientes: 0, finalizados: 0, todos: 0 },
			error: error.message
		};
	}

	const all = ((sols ?? []) as Solicitud[]).map(toResumen);
	const pendientes = all.filter((t) => classifySolicitud(t.status) === 'pendiente');
	const finalizados = all.filter((t) => classifySolicitud(t.status) === 'finalizado');

	const counts = {
		pendientes: pendientes.length,
		finalizados: finalizados.length,
		todos: all.length
	};

	let items = vista === 'pendientes' ? pendientes : vista === 'finalizados' ? finalizados : all;

	const query = q.trim().toLowerCase();
	if (query) {
		items = items.filter(
			(t) =>
				t.id.toLowerCase().includes(query) ||
				t.tipo.toLowerCase().includes(query) ||
				t.status.toLowerCase().includes(query) ||
				(t.email || '').toLowerCase().includes(query) ||
				(t.matricula || '').toLowerCase().includes(query) ||
				(t.userId || '').toLowerCase().includes(query)
		);
	}

	return { items, counts, error: null };
}
