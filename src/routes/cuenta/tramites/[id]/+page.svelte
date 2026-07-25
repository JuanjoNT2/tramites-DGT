<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { SOLICITUD_TIPO_LABELS, SOLICITUD_STATUS_LABELS } from '$lib/supabase/types';
	import type { SolicitudStatus } from '$lib/supabase/types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const s = $derived(data.item);
	let payloadText = $state(JSON.stringify(data.item.payload ?? {}, null, 2));
	let uploading = $state(false);
	let uploadMsg = $state<string | null>(null);

	$effect(() => {
		payloadText = JSON.stringify(data.item.payload ?? {}, null, 2);
	});

	const HIDDEN_KEYS = new Set(['accessToken', 'raw', 'acceptPrivacy']);

	function entries(obj: Record<string, unknown>, prefix = ''): [string, string][] {
		const out: [string, string][] = [];
		for (const [k, v] of Object.entries(obj)) {
			if (HIDDEN_KEYS.has(k)) continue;
			const key = prefix ? `${prefix}.${k}` : k;
			if (v != null && typeof v === 'object' && !Array.isArray(v)) {
				out.push(...entries(v as Record<string, unknown>, key));
			} else {
				out.push([key, v == null ? '' : Array.isArray(v) ? JSON.stringify(v) : String(v)]);
			}
		}
		return out;
	}

	const fields = $derived(entries(s.payload || {}));

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

{#if form?.error}
	<p class="err">{form.error}</p>
{/if}
{#if form?.ok}
	<p class="ok">Cambios guardados.</p>
{/if}

<section class="card">
	<h2>Datos del formulario</h2>
	{#if data.canEdit}
		<form method="POST" action="?/save" class="edit">
			<label>
				Payload (JSON editable mientras el estado es «nueva»)
				<textarea name="payload_json" rows="14" bind:value={payloadText}></textarea>
			</label>
			<button type="submit" class="btn">Guardar cambios</button>
		</form>
	{:else}
		<table>
			<tbody>
				{#each fields as [k, v]}
					<tr>
						<th>{k}</th>
						<td>{v}</td>
					</tr>
				{/each}
			</tbody>
		</table>
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
	}
	th {
		width: 30%;
		color: #5a6b7d;
	}
	.edit {
		display: grid;
		gap: 12px;
	}
	textarea {
		width: 100%;
		font-family: ui-monospace, monospace;
		font-size: 0.8rem;
		padding: 10px;
		border: 1px solid #c5d0da;
		border-radius: 8px;
	}
	.btn {
		justify-self: start;
		padding: 10px 16px;
		background: #00c6d1;
		color: #003050;
		font-weight: 700;
		border: none;
		border-radius: 8px;
		cursor: pointer;
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
	}
	.upload {
		display: grid;
		gap: 6px;
		font-weight: 600;
		font-size: 0.9rem;
	}
	.err {
		background: #fde8e8;
		color: #9b1c1c;
		padding: 10px;
		border-radius: 8px;
	}
	.ok,
	.msg {
		background: #e8f5ee;
		color: #0f5132;
		padding: 10px;
		border-radius: 8px;
	}
</style>
