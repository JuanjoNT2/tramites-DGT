<script lang="ts">
	import type { PageData } from './$types';
	import type { SolicitudStatus } from '$lib/supabase/types';
	import StatusBadge from '$lib/components/gestor/StatusBadge.svelte';
	import { payloadFieldsForDisplay } from '$lib/gestor/payload-display';
	import { displayDocNombre } from '$lib/tramite/doc-peticiones';

	let { data }: { data: PageData } = $props();

	let s = $state(data.item);
	let status = $state(String(data.item.status));
	let guardando = $state(false);
	let msg = $state<string | null>(null);
	let err = $state<string | null>(null);

	$effect(() => {
		s = data.item;
		status = String(data.item.status);
	});

	const fields = $derived(payloadFieldsForDisplay((s.payload || {}) as Record<string, unknown>));

	async function cambiarEstado(next: string) {
		if (guardando || next === String(s.status)) return;
		guardando = true;
		msg = null;
		err = null;
		const previo = String(s.status);
		status = next;
		try {
			const res = await fetch('/api/proveedor/solicitud-status', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: s.id, status: next })
			});
			const body = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(body.error || 'No se pudo cambiar el estado');
			s = { ...s, status: next };
			msg = 'Estado actualizado. El cliente ha recibido el aviso.';
		} catch (e) {
			status = previo;
			err = e instanceof Error ? e.message : 'Error';
		} finally {
			guardando = false;
		}
	}
</script>

<header class="head">
	<div>
		<p class="back"><a href="/proveedor">← Volver al listado</a></p>
		<h1>{data.label}</h1>
		<p class="sub">Referencia {s.id}</p>
	</div>
	<StatusBadge status={String(s.status)} />
</header>

{#if msg}<p class="aviso">{msg}</p>{/if}
{#if err}<p class="aviso err">{err}</p>{/if}

<section class="card">
	<h2>Estado</h2>
	<label class="field">
		<span>Cambiar estado</span>
		<select
			value={status}
			disabled={guardando}
			onchange={(e) => cambiarEstado((e.currentTarget as HTMLSelectElement).value)}
		>
			{#each data.statuses as st}
				<option value={st}>{data.statusLabels[st as SolicitudStatus]}</option>
			{/each}
		</select>
	</label>
</section>

<section class="card">
	<h2>Datos de la solicitud</h2>
	<dl>
		<div class="row">
			<dt>Fecha de alta</dt>
			<dd>{new Date(s.created_at).toLocaleString('es-ES')}</dd>
		</div>
		<div class="row">
			<dt>Email de contacto</dt>
			<dd>{s.email || '—'}</dd>
		</div>
		{#each fields as f (f.key)}
			<div class="row">
				<dt>{f.label}</dt>
				<dd>{f.value || '—'}</dd>
			</div>
		{/each}
	</dl>
</section>

<section class="card">
	<h2>Documentos</h2>
	{#if data.docs.length}
		<ul class="docs">
			{#each data.docs as d (d.id)}
				<li>
					<a href={`/api/cuenta/documentos?download=${d.id}`} target="_blank" rel="noopener">
						{displayDocNombre(d.nombre)}
					</a>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="empty">El cliente todavía no ha subido documentos.</p>
	{/if}
</section>

<style>
	.head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 16px;
		flex-wrap: wrap;
		margin-bottom: 20px;
	}
	.back {
		margin: 0 0 8px;
		font-size: 0.85rem;
	}
	.back a {
		color: #397ab2;
		font-weight: 700;
		text-decoration: none;
	}
	h1 {
		margin: 0 0 6px;
		color: #000038;
		font-size: 1.4rem;
	}
	.sub {
		margin: 0;
		color: #5a6b7d;
		font-size: 0.85rem;
		overflow-wrap: anywhere;
	}
	.card {
		background: #fff;
		border: 1px solid #d8e0e8;
		border-radius: 12px;
		padding: 18px 20px;
		margin-bottom: 16px;
	}
	h2 {
		margin: 0 0 14px;
		color: #000038;
		font-size: 1rem;
	}
	.field {
		display: grid;
		gap: 4px;
		font-size: 0.8rem;
		font-weight: 600;
		color: #5a6b7d;
		max-width: 280px;
	}
	.field select {
		padding: 8px 10px;
		border: 1px solid #c5d0da;
		border-radius: 8px;
		font: inherit;
		font-size: 0.9rem;
		background: #fff;
	}
	dl {
		margin: 0;
		display: grid;
		gap: 2px;
	}
	.row {
		display: grid;
		grid-template-columns: minmax(140px, 34%) 1fr;
		gap: 12px;
		padding: 8px 0;
		border-bottom: 1px solid #eef2f6;
	}
	dt {
		font-size: 0.78rem;
		font-weight: 700;
		color: #5a6b7d;
	}
	dd {
		margin: 0;
		font-size: 0.9rem;
		overflow-wrap: anywhere;
	}
	.docs {
		margin: 0;
		padding-left: 18px;
		display: grid;
		gap: 6px;
		font-size: 0.9rem;
	}
	.docs a {
		color: #397ab2;
		font-weight: 700;
	}
	.empty {
		margin: 0;
		color: #5a6b7d;
		font-size: 0.9rem;
	}
	.aviso {
		background: #e4f3ea;
		color: #2f7a4f;
		padding: 10px 12px;
		border-radius: 8px;
		font-size: 0.88rem;
	}
	.aviso.err {
		background: #f8e4e4;
		color: #a05050;
	}
	@media (max-width: 640px) {
		.row {
			grid-template-columns: 1fr;
			gap: 2px;
		}
	}
</style>
