import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getServiceSupabase } from '$lib/supabase/admin';
import { isRedsysConfigured } from '$lib/server/redsys';
import { SOLICITUD_STATUS_LABELS, SOLICITUD_TIPO_LABELS } from '$lib/supabase/types';
import type { Solicitud, SolicitudStatus } from '$lib/supabase/types';
import {
	canAccessPagoSolicitud,
	getPayloadAccessToken,
	resolveStoredAmount
} from '$lib/pago/access';

function summaryRows(payload: Record<string, unknown>): { label: string; value: string }[] {
	const rows: { label: string; value: string }[] = [];
	const push = (label: string, value: unknown) => {
		if (value == null || value === '') return;
		rows.push({ label, value: String(value) });
	};

	push('Matrícula', payload.matricula);
	push('Bastidor', payload.bastidor);
	push('Tipo de vehículo', payload.tipoVehiculo);
	push('Marca', payload.marcaNombre || payload.vmpMarca || payload.marca);
	push('Modelo', payload.modeloNombre || payload.vmpModelo || payload.modelo);
	push('Nº serie VMP', payload.vmpNumSerie);
	push('Motivo', payload.motivoDuplicado);
	push('Nombre', [payload.nombre, payload.apellido1, payload.apellido2].filter(Boolean).join(' '));
	push('NIF/NIE', payload.nif);
	push('Email', payload.email);
	push('Teléfono', payload.telefono);
	push('Rol', payload.rol);
	push('Provincia', payload.provincia);
	push('Municipio', payload.municipio || payload.localidad);
	push(
		'Dirección',
		[payload.tipoVia, payload.direccion, payload.numero].filter(Boolean).join(' ') ||
			payload.direccion
	);
	push('CP', payload.cp);
	push('Envío', payload.tipoEnvio);

	return rows;
}

function resolveLines(payload: Record<string, unknown>): { label: string; amount: number }[] {
	const raw = payload.priceLines;
	if (!Array.isArray(raw)) return [];
	return raw
		.map((l) => {
			const row = l as { label?: string; amount?: number };
			return {
				label: String(row.label || 'Concepto'),
				amount: Number(row.amount) || 0
			};
		})
		.filter((l) => l.amount > 0 || l.label);
}

export const load: PageServerLoad = async ({ params, url, locals }) => {
	const sb = getServiceSupabase();
	if (!sb) throw error(503, 'Supabase no configurado');

	const { data, error: qErr } = await sb
		.from('solicitudes')
		.select('*')
		.eq('id', params.id)
		.maybeSingle();

	if (qErr || !data) throw error(404, 'Solicitud no encontrada');

	const sol = data as Solicitud;
	const token = url.searchParams.get('t');

	if (
		!canAccessPagoSolicitud({
			sol,
			userId: locals.user?.id,
			token
		})
	) {
		throw error(
			403,
			'No tienes acceso a este pago. Usa el enlace del email o inicia sesión con la cuenta que creó el trámite.'
		);
	}

	const payload = (sol.payload || {}) as Record<string, unknown>;
	const amount = resolveStoredAmount(sol);
	const lines = resolveLines(payload);
	const tipoLabel = SOLICITUD_TIPO_LABELS[sol.tipo] || sol.tipo;
	const alreadyPaid = sol.status === 'pagada' || sol.status === 'realizada';
	const statusLabel =
		SOLICITUD_STATUS_LABELS[sol.status as SolicitudStatus] || String(sol.status);
	const accessToken = getPayloadAccessToken(payload);

	return {
		solicitud: {
			id: sol.id,
			tipo: sol.tipo,
			tipoLabel,
			status: sol.status,
			statusLabel,
			email: sol.email,
			createdAt: sol.created_at
		},
		summary: summaryRows(payload),
		amount,
		lines,
		gatewayReady: isRedsysConfigured(),
		alreadyPaid,
		description: tipoLabel,
		accessToken
	};
};
