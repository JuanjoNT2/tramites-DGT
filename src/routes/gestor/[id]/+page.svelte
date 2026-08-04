<script lang="ts">
	import type { PageData } from './$types';
	import type { SolicitudStatus } from '$lib/supabase/types';
	import { payloadFieldsForDisplay } from '$lib/gestor/payload-display';

	let { data }: { data: PageData } = $props();
	let s = $state(data.item);
	let docs = $state(data.docs);
	let status = $state(String(data.item.status));
	let msg = $state<string | null>(null);
	let err = $state<string | null>(null);
	let uploading = $state(false);

	$effect(() => {
		s = data.item;
		docs = data.docs;
		status = String(data.item.status);
	});

	const fields = $derived(payloadFieldsForDisplay((s.payload || {}) as Record<string, unknown>));

	async function changeStatus() {
		msg = null;
		err = null;
		const res = await fetch('/api/admin/solicitud-status', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id: s.id, status })
		});
		const body = await res.json();
		if (!res.ok) {
			err = body.error || 'Error';
			return;
		}
		s = body.item;
		msg = 'Estado actualizado (el ciudadano recibe notificación).';
	}

	async function uploadDoc(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		uploading = true;
		err = null;
		try {
			const fd = new FormData();
			fd.set('solicitud_id', s.id);
			fd.set('file', file);
			const res = await fetch('/api/cuenta/documentos', { method: 'POST', body: fd });
			const body = await res.json();
			if (!res.ok) throw new Error(body.error || 'Error');
			docs = [body.item, ...docs];
			msg = 'Documento subido';
		} catch (e) {
			err = e instanceof Error ? e.message : 'Error';
		} finally {
			uploading = false;
		}
	}
</script>

<p class="back"><a href="/gestor/tramites?vista=pendientes">← Volver a trámites</a></p>

<header class="head">
	<div>
		<h1>{data.label}</h1>
		<p class="sub">ID {s.id}</p>
	</div>
	<div class="actions">
		<a class="btn ghost" href={`/gestor/api/export/excel?id=${s.id}`}>Descargar Excel</a>
		<a class="btn" href={`/gestor/api/export/pdf?id=${s.id}`}>Descargar PDF</a>
	</div>
</header>

{#if msg}<p class="ok">{msg}</p>{/if}
{#if err}<p class="err">{err}</p>{/if}

<dl class="meta">
	<div><dt>Estado</dt><dd>{data.statusLabels[s.status as SolicitudStatus] || s.status}</dd></div>
	<div><dt>Email</dt><dd>{s.email || '—'}</dd></div>
	<div>
		<dt>Cliente</dt>
		<dd>
			{#if s.user_id}
				<a href="/gestor/cliente/{s.user_id}">Ver ficha del cliente</a>
			{:else}
				anónimo
			{/if}
		</dd>
	</div>
	<div><dt>Fecha</dt><dd>{new Date(s.created_at).toLocaleString('es-ES')}</dd></div>
</dl>

{#if data.canChangeStatus}
	<section class="card">
		<h2>Cambiar estado (solo admin)</h2>
		<div class="status-row">
			<select bind:value={status}>
				{#each data.statuses as st}
					<option value={st}>{data.statusLabels[st]}</option>
				{/each}
			</select>
			<button type="button" class="btn" onclick={changeStatus}>Guardar estado</button>
		</div>
	</section>
{/if}

{#if data.citizen}
	<section class="card">
		<h2>Datos del cliente</h2>
		<table>
			<tbody>
				<tr><th>Nombre</th><td>{data.citizen.full_name || '—'}</td></tr>
				<tr><th>Email</th><td>{data.citizen.email || '—'}</td></tr>
				<tr><th>Teléfono</th><td>{data.citizen.telefono || '—'}</td></tr>
				<tr><th>NIF</th><td>{data.citizen.nif || '—'}</td></tr>
			</tbody>
		</table>
	</section>
{/if}

<section class="card">
	<h2>Vehículos del cliente ({data.vehiculos.length})</h2>
	{#if data.vehiculos.length}
		<table>
			<thead>
				<tr>
					<th>Matrícula</th>
					<th>Tipo</th>
					<th>Marca</th>
					<th>Modelo</th>
					<th>Bastidor</th>
				</tr>
			</thead>
			<tbody>
				{#each data.vehiculos as v}
					<tr>
						<td>
							{v.matricula}
							{#if String(s.payload?.matricula ?? '').toUpperCase() === v.matricula.toUpperCase()}
								<span class="tag">de este trámite</span>
							{/if}
						</td>
						<td>{v.tipo}</td>
						<td>{v.marca || '—'}</td>
						<td>{v.modelo || '—'}</td>
						<td>{v.bastidor || '—'}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{:else}
		<p class="empty">
			{#if s.user_id}
				Este usuario no tiene vehículos registrados en su cuenta.
			{:else}
				Solicitud anónima: no hay cuenta vinculada. Revisa la matrícula en el formulario.
			{/if}
		</p>
		{#if s.payload?.matricula}
			<p class="hint">Matrícula del trámite: <strong>{String(s.payload.matricula)}</strong></p>
		{/if}
	{/if}
</section>

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
		<p class="empty">No hay datos de formulario en esta solicitud.</p>
	{/if}
</section>

<section class="card">
	<h2>Documentos</h2>
	<ul class="docs">
		{#each docs as d}
			<li class="doc-row">
				{#if d.mime?.startsWith('image/')}
					<a class="thumb" href={`/api/cuenta/documentos?download=${d.id}`} target="_blank" rel="noopener">
						<img src={`/api/cuenta/documentos?download=${d.id}`} alt={d.nombre} />
					</a>
				{:else}
					<div class="thumb pdf" aria-hidden="true">PDF</div>
				{/if}
				<div class="doc-meta">
					<a href={`/api/cuenta/documentos?download=${d.id}`}>{d.nombre}</a>
					<small>{d.uploaded_by} · {new Date(d.created_at).toLocaleString('es-ES')}</small>
					<a class="dl" href={`/api/cuenta/documentos?download=${d.id}`}>Descargar</a>
				</div>
			</li>
		{:else}
			<li class="empty">Sin documentos.</li>
		{/each}
	</ul>
	<label class="upload">
		Subir documento
		<input type="file" onchange={uploadDoc} disabled={uploading} />
	</label>
</section>

<style>
	.back {
		margin: 0 0 16px;
	}
	.back a {
		color: #003050;
		font-weight: 600;
		text-decoration: none;
	}
	.head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 16px;
		margin-bottom: 20px;
		flex-wrap: wrap;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	h1 {
		margin: 0 0 4px;
		color: #003050;
	}
	.sub {
		margin: 0;
		color: #5a6b7d;
		font-size: 0.85rem;
		word-break: break-all;
	}
	.btn {
		display: inline-flex;
		align-items: center;
		padding: 8px 14px;
		background: #00c6d1;
		color: #003050;
		font-weight: 700;
		border-radius: 8px;
		text-decoration: none;
		border: none;
		cursor: pointer;
		font: inherit;
	}
	.btn.ghost {
		background: #fff;
		border: 1px solid #c5d0da;
		color: #003050;
	}
	.btn.ghost:hover {
		background: #f4f7fa;
	}
	.meta {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: 12px;
		margin: 0 0 20px;
	}
	.meta div {
		background: #fff;
		border: 1px solid #d8e0e8;
		border-radius: 10px;
		padding: 12px 14px;
	}
	dt {
		font-size: 0.75rem;
		color: #5a6b7d;
		font-weight: 700;
		text-transform: uppercase;
	}
	dd {
		margin: 4px 0 0;
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
		font-weight: 600;
	}
	.status-row {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
		align-items: center;
	}
	select {
		padding: 8px 10px;
		border-radius: 8px;
		border: 1px solid #c5d0da;
		font: inherit;
	}
	.docs {
		list-style: none;
		margin: 0 0 12px;
		padding: 0;
		display: grid;
		gap: 12px;
	}
	.doc-row {
		display: flex;
		gap: 12px;
		align-items: center;
		padding: 10px;
		background: #f8fafc;
		border-radius: 10px;
		border: 1px solid #e8eef3;
	}
	.thumb {
		width: 72px;
		height: 72px;
		border-radius: 8px;
		overflow: hidden;
		flex-shrink: 0;
		background: #e8eef3;
		display: flex;
		align-items: center;
		justify-content: center;
		text-decoration: none;
	}
	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.thumb.pdf {
		font-size: 0.7rem;
		font-weight: 800;
		color: #5a6b7d;
	}
	.doc-meta {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}
	.doc-meta a {
		font-weight: 700;
		color: #003050;
		word-break: break-word;
	}
	.doc-meta small {
		color: #5a6b7d;
	}
	.doc-meta .dl {
		font-size: 0.85rem;
		font-weight: 600;
		color: #00a8b3;
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
	.hint {
		margin: 8px 0 0;
		font-size: 0.9rem;
		color: #5a6b7d;
	}
	.tag {
		display: inline-block;
		margin-left: 8px;
		padding: 2px 8px;
		border-radius: 999px;
		background: #e0f7fa;
		color: #006064;
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
	}
	.upload {
		display: grid;
		gap: 6px;
		font-weight: 600;
		font-size: 0.9rem;
	}
	.ok {
		background: #e8f5ee;
		color: #0f5132;
		padding: 10px;
		border-radius: 8px;
	}
	.err {
		background: #fde8e8;
		color: #9b1c1c;
		padding: 10px;
		border-radius: 8px;
	}
</style>
