<script lang="ts">
	import StatusBadge from '$lib/components/gestor/StatusBadge.svelte';
	import {
		BUCKET_DEFAULT_STATUS,
		BUCKET_LABELS,
		KANBAN_COLUMN_LIMIT,
		classifyTramiteBucket,
		type TramiteBucket
	} from '$lib/gestor/board';
	import type { TramiteBoard, TramiteResumen } from '$lib/gestor/tramites';
	import {
		SOLICITUD_STATUSES,
		SOLICITUD_STATUS_LABELS,
		SOLICITUD_TIPO_LABELS
	} from '$lib/supabase/types';

	let {
		board,
		canChangeStatus = false,
		listHref
	}: {
		board: TramiteBoard;
		canChangeStatus?: boolean;
		listHref: string;
	} = $props();

	const columns: TramiteBucket[] = ['por_hacer', 'en_curso', 'hecho'];

	let cards = $state<TramiteResumen[]>([]);
	let saving = $state<string | null>(null);
	let err = $state<string | null>(null);
	let dragId = $state<string | null>(null);
	let dragOver = $state<TramiteBucket | null>(null);

	// Al recargar la página (filtro, navegación) el tablero del servidor manda.
	$effect(() => {
		cards = [...board.por_hacer, ...board.en_curso, ...board.hecho];
	});

	function inBucket(bucket: TramiteBucket) {
		return cards.filter((t) => classifyTramiteBucket(t.status) === bucket);
	}

	function tipoLabel(tipo: string) {
		return SOLICITUD_TIPO_LABELS[tipo] || tipo;
	}

	function clienteHref(t: TramiteResumen) {
		if (t.userId) return `/gestor/cliente/${t.userId}`;
		if (t.email) return `/gestor/cliente/anonimo?email=${encodeURIComponent(t.email)}`;
		return null;
	}

	async function applyStatus(id: string, status: string) {
		const current = cards.find((t) => t.id === id);
		if (!current || current.status === status) return;

		const previous = current.status;
		cards = cards.map((t) => (t.id === id ? { ...t, status } : t));
		saving = id;
		err = null;

		try {
			const res = await fetch('/api/gestor/solicitud-status', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id, status })
			});
			const body = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(body.error || 'No se pudo cambiar el estado');
		} catch (e) {
			cards = cards.map((t) => (t.id === id ? { ...t, status: previous } : t));
			err = e instanceof Error ? e.message : 'No se pudo cambiar el estado';
		} finally {
			saving = null;
		}
	}

	function onDragStart(e: DragEvent, id: string) {
		if (!canChangeStatus) return;
		dragId = id;
		e.dataTransfer?.setData('text/plain', id);
		if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
	}

	function onDragOver(e: DragEvent, bucket: TramiteBucket) {
		if (!canChangeStatus || !dragId) return;
		e.preventDefault();
		dragOver = bucket;
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
	}

	function onDrop(e: DragEvent, bucket: TramiteBucket) {
		if (!canChangeStatus) return;
		e.preventDefault();
		const id = dragId || e.dataTransfer?.getData('text/plain') || '';
		dragId = null;
		dragOver = null;
		if (!id) return;
		const current = cards.find((t) => t.id === id);
		if (!current || classifyTramiteBucket(current.status) === bucket) return;
		void applyStatus(id, BUCKET_DEFAULT_STATUS[bucket]);
	}
</script>

{#if err}
	<p class="err" role="alert">{err}</p>
{/if}

<div class="board">
	{#each columns as bucket}
		{@const items = inBucket(bucket)}
		<section
			class="column"
			class:drop-target={dragOver === bucket}
			role="group"
			aria-label={BUCKET_LABELS[bucket]}
			ondragover={(e) => onDragOver(e, bucket)}
			ondragleave={() => (dragOver = null)}
			ondrop={(e) => onDrop(e, bucket)}
		>
			<header class="col-head">
				<h2>{BUCKET_LABELS[bucket]}</h2>
				<span class="count">{items.length}</span>
			</header>

			<div class="cards">
				{#each items.slice(0, KANBAN_COLUMN_LIMIT) as t (t.id)}
					{@const cliente = clienteHref(t)}
					<article
						class="card"
						class:saving={saving === t.id}
						class:cancelada={t.status === 'cancelada'}
						draggable={canChangeStatus}
						ondragstart={(e) => onDragStart(e, t.id)}
						ondragend={() => {
							dragId = null;
							dragOver = null;
						}}
					>
						<div class="card-top">
							<span class="tipo">{tipoLabel(t.tipo)}</span>
							<StatusBadge status={t.status} />
						</div>

						<p class="meta">{new Date(t.createdAt).toLocaleDateString('es-ES')}</p>

						<p class="cliente">
							{#if cliente}
								<a href={cliente}>{t.email || 'Ver cliente'}</a>
							{:else}
								{t.email || 'Sin cliente'}
							{/if}
						</p>

						{#if t.matricula}
							<p class="matricula">{t.matricula}</p>
						{/if}

						{#if t.solicitaFactura && !t.facturaEmitida}
							<p class="badge warn">Factura pendiente</p>
						{/if}

						<div class="card-foot">
							{#if canChangeStatus}
								<label class="status-select">
									<span class="sr-only">Estado de {tipoLabel(t.tipo)}</span>
									<select
										value={t.status}
										disabled={saving === t.id}
										onchange={(e) => applyStatus(t.id, e.currentTarget.value)}
									>
										{#each SOLICITUD_STATUSES as st}
											<option value={st}>{SOLICITUD_STATUS_LABELS[st]}</option>
										{/each}
									</select>
								</label>
							{/if}
							<a class="open" href="/gestor/{t.id}">Abrir</a>
						</div>
					</article>
				{:else}
					<p class="empty">Sin trámites.</p>
				{/each}

				{#if items.length > KANBAN_COLUMN_LIMIT}
					<a class="more" href={listHref}>
						Ver los {items.length - KANBAN_COLUMN_LIMIT} restantes en lista
					</a>
				{/if}
			</div>
		</section>
	{/each}
</div>

<style>
	.err {
		background: #fde8e8;
		color: #9b1c1c;
		padding: 10px 12px;
		border-radius: 8px;
		margin: 0 0 16px;
	}
	.board {
		display: grid;
		grid-template-columns: repeat(3, minmax(240px, 1fr));
		gap: 16px;
		align-items: start;
	}
	.column {
		background: #eef3f7;
		border: 1px solid #d8e0e8;
		border-radius: 12px;
		padding: 12px;
		min-height: 160px;
	}
	.column.drop-target {
		border-color: #00c6d1;
		background: #e2f6f8;
	}
	.col-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		margin-bottom: 12px;
	}
	.col-head h2 {
		margin: 0;
		font-size: 0.95rem;
		color: #003050;
	}
	.count {
		background: #003050;
		color: #fff;
		border-radius: 999px;
		padding: 2px 10px;
		font-size: 0.75rem;
		font-weight: 700;
	}
	.cards {
		display: grid;
		gap: 10px;
	}
	.card {
		background: #fff;
		border: 1px solid #d8e0e8;
		border-radius: 10px;
		padding: 12px;
		display: grid;
		gap: 6px;
		cursor: grab;
	}
	.card.saving {
		opacity: 0.6;
	}
	.card.cancelada {
		border-left: 3px solid #9aa7b4;
	}
	.card-top {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 8px;
	}
	.tipo {
		font-weight: 700;
		color: #003050;
		font-size: 0.9rem;
	}
	.badge {
		display: inline-block;
		padding: 2px 8px;
		border-radius: 999px;
		font-size: 0.7rem;
		font-weight: 700;
		margin: 0;
	}
	.badge.warn {
		background: #fff3cd;
		color: #7a5b00;
		justify-self: start;
	}
	.meta,
	.cliente,
	.matricula {
		margin: 0;
		font-size: 0.8rem;
		color: #5a6b7d;
		overflow-wrap: anywhere;
	}
	.matricula {
		font-weight: 700;
		color: #1a2b3c;
	}
	.card-foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		margin-top: 4px;
	}
	.status-select select {
		border: 1px solid #c5d0da;
		border-radius: 8px;
		padding: 5px 6px;
		font: inherit;
		font-size: 0.78rem;
		background: #fff;
	}
	.open {
		color: #003050;
		font-weight: 700;
		text-decoration: none;
		font-size: 0.82rem;
	}
	.empty {
		margin: 0;
		padding: 16px 0;
		text-align: center;
		color: #5a6b7d;
		font-size: 0.85rem;
	}
	.more {
		font-size: 0.8rem;
		font-weight: 700;
		color: #003050;
		text-decoration: none;
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}

	@media (max-width: 900px) {
		.board {
			grid-template-columns: 1fr;
		}
		.card {
			cursor: default;
		}
	}
</style>
