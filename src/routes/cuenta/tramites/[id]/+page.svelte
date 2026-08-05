<script lang="ts">
	import type { PageData } from './$types';
	import { payloadFieldsForDisplay } from '$lib/gestor/payload-display';
	import { SOLICITUD_TIPO_LABELS, SOLICITUD_STATUS_LABELS } from '$lib/supabase/types';
	import type { SolicitudStatus } from '$lib/supabase/types';

	let { data }: { data: PageData } = $props();
	const s = $derived(data.item);
	let uploading = $state(false);
	let uploadMsg = $state<string | null>(null);

	const fields = $derived(
		payloadFieldsForDisplay((s.payload || {}) as Record<string, unknown>)
	);

	async function uploadDoc(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		uploading = true;
		uploadMsg = null;
		try {
			const fd = new FormData();
			fd.set('solicitud_id', s.id);
			fd.set('file', file);
			const res = await fetch('/api/cuenta/documentos', { method: 'POST', body: fd });
			const body = await res.json();
			if (!res.ok) throw new Error(body.error || 'Error');
			uploadMsg = 'Documento subido. Recarga para verlo.';
			location.reload();
		} catch (err) {
			uploadMsg = err instanceof Error ? err.message : 'Error';
		} finally {
			uploading = false;
		}
	}
</script>

<p class="back"><a href="/cuenta/tramites?estado=en_curso">← Volver</a></p>

<header class="head">
	<div>
		<h1>{SOLICITUD_TIPO_LABELS[s.tipo] || s.tipo}</h1>
		<p class="sub">
			{SOLICITUD_STATUS_LABELS[s.status as SolicitudStatus] || s.status} ·
			{new Date(s.created_at).toLocaleString('es-ES')}
		</p>
		{#if data.pagoUrl}
			<p class="pay-cta">
				<a class="btn" href={data.pagoUrl}>Pagar / reintentar pago</a>
			</p>
		{/if}
	</div>
</header>

<section class="card">
	<h2>Datos del trámite</h2>
	{#if fields.length}
		<table>
			<tbody>
				{#each fields as row}
					<tr>
						<th>{row.label}</th>
						<td>{row.value}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{:else}
		<p class="empty">No hay datos del formulario para mostrar.</p>
	{/if}
</section>

<section class="card">
	<h2>Documentos</h2>
	<ul class="docs">
		{#each data.docs as d}
			<li>
				<a href={`/api/cuenta/documentos?download=${d.id}`}>{d.nombre}</a>
				<small>{new Date(d.created_at).toLocaleString('es-ES')}</small>
			</li>
		{:else}
			<li class="empty">Sin documentos.</li>
		{/each}
	</ul>
	{#if data.canUpload}
		<label class="upload">
			Subir documento
			<input type="file" onchange={uploadDoc} disabled={uploading} />
		</label>
		{#if uploadMsg}<p class="msg">{uploadMsg}</p>{/if}
	{:else}
		<p class="empty">No se pueden subir documentos en el estado actual.</p>
	{/if}
</section>

<style>
	.back a {
		color: #003050;
		font-weight: 600;
		text-decoration: none;
	}
	.head {
		margin: 16px 0 20px;
	}
	h1 {
		margin: 0 0 4px;
		color: #003050;
	}
	.sub {
		margin: 0;
		color: #5a6b7d;
	}
	.pay-cta {
		margin: 12px 0 0;
	}
	.pay-cta .btn {
		display: inline-flex;
		padding: 10px 14px;
		background: #00c6d1;
		color: #003050;
		font-weight: 800;
		border-radius: 8px;
		text-decoration: none;
	}
	.card {
		background: #fff;
		border: 1px solid #d8e0e8;
		border-radius: 12px;
		padding: 16px 18px;
		margin-bottom: 16px;
	}
	h2 {
		margin: 0 0 12px;
		font-size: 1rem;
		color: #003050;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}
	th,
	td {
		text-align: left;
		padding: 8px 6px;
		border-bottom: 1px solid #e8eef3;
		vertical-align: top;
		overflow-wrap: anywhere;
	}
	th {
		width: 36%;
		color: #5a6b7d;
		font-weight: 600;
	}
	.docs {
		list-style: none;
		margin: 0 0 12px;
		padding: 0;
	}
	.docs li {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		padding: 8px 0;
		border-bottom: 1px solid #e8eef3;
	}
	.empty {
		color: #5a6b7d;
		margin: 0;
	}
	.upload {
		display: grid;
		gap: 6px;
		font-weight: 600;
		font-size: 0.9rem;
	}
	.msg {
		background: #e8f5ee;
		color: #0f5132;
		padding: 10px;
		border-radius: 8px;
	}
</style>
