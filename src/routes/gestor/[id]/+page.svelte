<script lang="ts">
	import type { PageData } from './$types';
	import type { SolicitudStatus } from '$lib/supabase/types';

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

	function entries(obj: Record<string, unknown>, prefix = ''): [string, string][] {
		const out: [string, string][] = [];
		for (const [k, v] of Object.entries(obj)) {
			const key = prefix ? `${prefix}.${k}` : k;
			if (v != null && typeof v === 'object' && !Array.isArray(v)) {
				out.push(...entries(v as Record<string, unknown>, key));
			} else if (Array.isArray(v)) {
				out.push([key, JSON.stringify(v)]);
			} else {
				out.push([key, v == null ? '' : String(v)]);
			}
		}
		return out;
	}

	const fields = $derived(entries(s.payload || {}));

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

<p class="back"><a href="/gestor">← Volver al listado</a></p>

<header class="head">
	<div>
		<h1>{data.label}</h1>
		<p class="sub">ID {s.id}</p>
	</div>
	<a class="btn" href={`/gestor/api/export/pdf?id=${s.id}`}>Descargar PDF</a>
</header>

{#if msg}<p class="ok">{msg}</p>{/if}
{#if err}<p class="err">{err}</p>{/if}

<dl class="meta">
	<div><dt>Estado</dt><dd>{data.statusLabels[s.status as SolicitudStatus] || s.status}</dd></div>
	<div><dt>Email</dt><dd>{s.email || '—'}</dd></div>
	<div><dt>Usuario</dt><dd>{s.user_id || 'anónimo'}</dd></div>
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
		<h2>Datos del ciudadano</h2>
		<table>
			<tbody>
				<tr><th>Nombre</th><td>{data.citizen.full_name || '—'}</td></tr>
				<tr><th>Email</th><td>{data.citizen.email || '—'}</td></tr>
				<tr><th>Teléfono</th><td>{data.citizen.telefono || '—'}</td></tr>
				<tr><th>NIF</th><td>{data.citizen.nif || '—'}</td></tr>
				<tr><th>Rol</th><td>{data.citizen.role}</td></tr>
			</tbody>
		</table>
	</section>
{/if}

<section class="card">
	<h2>Campos del formulario</h2>
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
</section>

<section class="card">
	<h2>Documentos</h2>
	<ul class="docs">
		{#each docs as d}
			<li>
				<a href={`/api/cuenta/documentos?download=${d.id}`}>{d.nombre}</a>
				<small>{d.uploaded_by} · {new Date(d.created_at).toLocaleString('es-ES')}</small>
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
