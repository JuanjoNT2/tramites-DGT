import { error } from '@sveltejs/kit';
import { rangeBoundsIso } from '$lib/admin/dates';
import type { DateRange } from '$lib/admin/types';
import { PROVEEDOR_TIPOS, isProveedorTipo } from '$lib/proveedor/scope';
import { getServiceSupabase } from '$lib/supabase/admin';
import {
	SOLICITUD_STATUS_LABELS,
	type Solicitud,
	type SolicitudStatus
} from '$lib/supabase/types';

const MAX_ROWS = 5000;

export type ProveedorResumen = {
	id: string;
	status: string;
	email: string | null;
	matricula: string | null;
	nombre: string;
	distintivo: string | null;
	tipoEnvio: string | null;
	createdAt: string;
};

/** Solicitudes de distintivo ambiental creadas dentro del rango. */
export async function loadProveedorTramites(range: DateRange): Promise<Solicitud[]> {
	const sb = getServiceSupabase();
	if (!sb) throw error(503, 'Supabase no configurado');

	const { from, to } = rangeBoundsIso(range);
	const { data, error: err } = await sb
		.from('solicitudes')
		.select('*')
		.in('tipo', PROVEEDOR_TIPOS as readonly string[])
		.gte('created_at', from)
		.lte('created_at', to)
		.order('created_at', { ascending: false })
		.limit(MAX_ROWS);

	if (err) throw error(500, err.message);
	return (data ?? []) as Solicitud[];
}

/** Una solicitud concreta, solo si es de los tipos del proveedor. */
export async function loadProveedorTramiteById(id: string): Promise<Solicitud> {
	const sb = getServiceSupabase();
	if (!sb) throw error(503, 'Supabase no configurado');

	const { data, error: err } = await sb.from('solicitudes').select('*').eq('id', id).maybeSingle();
	if (err) throw error(500, err.message);
	if (!data) throw error(404, 'Solicitud no encontrada');
	const sol = data as Solicitud;
	if (!isProveedorTipo(sol.tipo)) throw error(404, 'Solicitud no encontrada');
	return sol;
}

function str(payload: Record<string, unknown>, key: string): string {
	const v = payload[key];
	return typeof v === 'string' ? v.trim() : v == null ? '' : String(v);
}

function nombreCompleto(payload: Record<string, unknown>): string {
	return [str(payload, 'nombre'), str(payload, 'apellido1'), str(payload, 'apellido2')]
		.filter(Boolean)
		.join(' ');
}

export function toProveedorResumen(s: Solicitud): ProveedorResumen {
	const payload = (s.payload || {}) as Record<string, unknown>;
	return {
		id: s.id,
		status: String(s.status),
		email: s.email,
		matricula: str(payload, 'matricula').toUpperCase() || null,
		nombre: nombreCompleto(payload),
		distintivo: str(payload, 'distintivoTipo') || null,
		tipoEnvio: str(payload, 'tipoEnvio') || null,
		createdAt: s.created_at
	};
}

/**
 * Fila del Excel de Ideauto: los datos que necesitan para fabricar el distintivo
 * y enviarlo, en vez de las columnas genéricas del export del gestor.
 */
export function proveedorExportRow(s: Solicitud): Record<string, unknown> {
	const payload = (s.payload || {}) as Record<string, unknown>;
	return {
		fecha: new Date(s.created_at).toLocaleString('es-ES'),
		referencia: s.id,
		estado: SOLICITUD_STATUS_LABELS[s.status as SolicitudStatus] || s.status,
		matricula: str(payload, 'matricula').toUpperCase(),
		bastidor: str(payload, 'bastidor').toUpperCase(),
		distintivo: str(payload, 'distintivoTipo'),
		nombre: str(payload, 'nombre'),
		apellido1: str(payload, 'apellido1'),
		apellido2: str(payload, 'apellido2'),
		nif: str(payload, 'nif').toUpperCase(),
		email: str(payload, 'email') || s.email || '',
		telefono: str(payload, 'telefono'),
		tipo_via: str(payload, 'tipoVia'),
		direccion: str(payload, 'direccion'),
		numero: str(payload, 'numero'),
		piso: str(payload, 'piso'),
		puerta: str(payload, 'puerta'),
		cp: str(payload, 'cp'),
		localidad: str(payload, 'localidad') || str(payload, 'pueblo'),
		municipio: str(payload, 'municipio'),
		provincia: str(payload, 'provincia'),
		tipo_envio: str(payload, 'tipoEnvio')
	};
}

/** Contadores por estado para la cabecera del panel. */
export function contarPorEstado(items: Solicitud[]): { status: string; label: string; count: number }[] {
	const counts = new Map<string, number>();
	for (const s of items) {
		const st = String(s.status);
		counts.set(st, (counts.get(st) || 0) + 1);
	}
	return [...counts.entries()]
		.sort((a, b) => b[1] - a[1])
		.map(([status, count]) => ({
			status,
			label: SOLICITUD_STATUS_LABELS[status as SolicitudStatus] || status,
			count
		}));
}
