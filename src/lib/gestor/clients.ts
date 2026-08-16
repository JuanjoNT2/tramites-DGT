import { getServiceSupabase } from '$lib/supabase/admin';
import {
	isEnCursoStatus,
	isRealizadoStatus,
	type Profile,
	type Solicitud
} from '$lib/supabase/types';

/** Vistas del panel de usuarios (ciudadanos de la web, no gestores). */
export type GestorVista = 'todos' | 'en_curso' | 'finalizados' | 'sin_tramites';

export type ClienteResumen = {
	userId: string | null;
	email: string | null;
	fullName: string | null;
	telefono: string | null;
	nif: string | null;
	pendingCount: number;
	doneCount: number;
	totalCount: number;
	lastAt: string | null;
	/** Matrículas recientes de sus trámites (máx 3) */
	matriculas: string[];
	/** true si no tiene cuenta Auth, solo solicitudes por email */
	anonimo: boolean;
};

const PENDING = new Set(['nueva', 'en_curso', 'pendiente_pago', 'pagada']);

export function classifySolicitud(status: string): 'pendiente' | 'finalizado' | 'otro' {
	if (isEnCursoStatus(status) || PENDING.has(status)) return 'pendiente';
	if (isRealizadoStatus(status) || status === 'cancelada') return 'finalizado';
	return 'otro';
}

export async function loadGestorClientes(vista: GestorVista, q = ''): Promise<{
	items: ClienteResumen[];
	counts: {
		todos: number;
		en_curso: number;
		finalizados: number;
		sin_tramites: number;
	};
	error: string | null;
}> {
	const emptyCounts = { todos: 0, en_curso: 0, finalizados: 0, sin_tramites: 0 };
	const sb = getServiceSupabase();
	if (!sb) {
		return { items: [], counts: emptyCounts, error: 'Supabase no configurado.' };
	}

	const [{ data: profiles, error: pErr }, { data: sols, error: sErr }] = await Promise.all([
		sb
			.from('profiles')
			.select('id, email, full_name, telefono, nif, role, created_at')
			.eq('role', 'user')
			.order('created_at', { ascending: false })
			.limit(5000),
		sb.from('solicitudes').select('*').order('created_at', { ascending: false }).limit(8000)
	]);

	if (pErr || sErr) {
		return {
			items: [],
			counts: emptyCounts,
			error: pErr?.message || sErr?.message || 'Error'
		};
	}

	const solicitudes = (sols ?? []) as Solicitud[];
	const profileList = (profiles ?? []) as Profile[];

	type Acc = {
		profile: Profile | null;
		email: string | null;
		pending: Solicitud[];
		done: Solicitud[];
		all: Solicitud[];
		anonimo: boolean;
	};

	const byUser = new Map<string, Acc>();

	for (const p of profileList) {
		byUser.set(p.id, {
			profile: p,
			email: p.email,
			pending: [],
			done: [],
			all: [],
			anonimo: false
		});
	}

	const anonByEmail = new Map<string, Acc>();

	for (const s of solicitudes) {
		const kind = classifySolicitud(String(s.status));
		if (s.user_id && byUser.has(s.user_id)) {
			const acc = byUser.get(s.user_id)!;
			acc.all.push(s);
			if (kind === 'pendiente') acc.pending.push(s);
			else if (kind === 'finalizado') acc.done.push(s);
			continue;
		}
		if (s.user_id && !byUser.has(s.user_id)) {
			// Perfil no-user (gestor/admin) o borrado: no listar como ciudadano
			continue;
		}
		const emailKey = (s.email || 'sin-email').toLowerCase();
		if (!anonByEmail.has(emailKey)) {
			anonByEmail.set(emailKey, {
				profile: null,
				email: s.email,
				pending: [],
				done: [],
				all: [],
				anonimo: true
			});
		}
		const acc = anonByEmail.get(emailKey)!;
		acc.all.push(s);
		if (kind === 'pendiente') acc.pending.push(s);
		else if (kind === 'finalizado') acc.done.push(s);
	}

	function toResumen(userId: string | null, acc: Acc): ClienteResumen {
		const mats = [
			...new Set(
				acc.all
					.map((s) => String(s.payload?.matricula ?? '').trim())
					.filter(Boolean)
			)
		].slice(0, 3);
		const last = acc.all[0]?.created_at ?? acc.profile?.created_at ?? null;
		return {
			userId,
			email: acc.profile?.email ?? acc.email,
			fullName: acc.profile?.full_name ?? null,
			telefono: acc.profile?.telefono ?? null,
			nif: acc.profile?.nif ?? null,
			pendingCount: acc.pending.length,
			doneCount: acc.done.length,
			totalCount: acc.all.length,
			lastAt: last,
			matriculas: mats,
			anonimo: acc.anonimo
		};
	}

	const todos: ClienteResumen[] = [];
	const enCurso: ClienteResumen[] = [];
	const finalizados: ClienteResumen[] = [];
	const sinTramites: ClienteResumen[] = [];

	for (const [id, acc] of byUser) {
		const row = toResumen(id, acc);
		todos.push(row);
		if (acc.pending.length > 0) enCurso.push(row);
		else if (acc.done.length > 0) finalizados.push(row);
		else sinTramites.push(row);
	}

	for (const [, acc] of anonByEmail) {
		const row = toResumen(null, acc);
		todos.push(row);
		if (acc.pending.length > 0) enCurso.push(row);
		else if (acc.done.length > 0) finalizados.push(row);
	}

	const sortByLast = (a: ClienteResumen, b: ClienteResumen) =>
		(b.lastAt || '').localeCompare(a.lastAt || '');

	todos.sort(sortByLast);
	enCurso.sort(sortByLast);
	finalizados.sort(sortByLast);
	sinTramites.sort((a, b) => (a.fullName || a.email || '').localeCompare(b.fullName || b.email || ''));

	const counts = {
		todos: todos.length,
		en_curso: enCurso.length,
		finalizados: finalizados.length,
		sin_tramites: sinTramites.length
	};

	let items =
		vista === 'en_curso'
			? enCurso
			: vista === 'finalizados'
				? finalizados
				: vista === 'sin_tramites'
					? sinTramites
					: todos;

	const query = q.trim().toLowerCase();
	if (query) {
		items = items.filter(
			(c) =>
				(c.email || '').toLowerCase().includes(query) ||
				(c.fullName || '').toLowerCase().includes(query) ||
				(c.nif || '').toLowerCase().includes(query) ||
				(c.userId || '').toLowerCase().includes(query) ||
				(c.telefono || '').toLowerCase().includes(query) ||
				c.matriculas.some((m) => m.toLowerCase().includes(query))
		);
	}

	return { items, counts, error: null };
}
