<script lang="ts">
	import { SOLICITUD_STATUS_LABELS, type SolicitudStatus } from '$lib/supabase/types';

	let {
		status,
		label
	}: {
		status: string;
		label?: string;
	} = $props();

	const text = $derived(
		label || SOLICITUD_STATUS_LABELS[status as SolicitudStatus] || status
	);
	const tone = $derived(
		['nueva', 'pendiente_pago', 'pagada', 'en_curso', 'realizada', 'cancelada'].includes(status)
			? status
			: 'otro'
	);
</script>

<span class="status-badge tone-{tone}">{text}</span>

<style>
	.status-badge {
		display: inline-block;
		padding: 2px 8px;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 700;
		line-height: 1.35;
		white-space: nowrap;
	}
	/* Tonos tenues: fondo pastel + texto suave */
	.tone-nueva {
		background: #e4eef8;
		color: #3a6b9a;
	}
	.tone-pendiente_pago {
		background: #fcecd9;
		color: #a05f20;
	}
	.tone-pagada {
		background: #e2f3f4;
		color: #2a7a80;
	}
	.tone-en_curso {
		background: #f8f1d4;
		color: #8a7420;
	}
	.tone-realizada {
		background: #e4f3ea;
		color: #2f7a4f;
	}
	.tone-cancelada {
		background: #f8e4e4;
		color: #a05050;
	}
	.tone-otro {
		background: #e8eef3;
		color: #5a6b7d;
	}
</style>
