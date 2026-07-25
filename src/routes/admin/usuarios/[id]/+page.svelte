<script lang="ts">
	import AdminShell from '$lib/components/admin/AdminShell.svelte';
	import { resolveDateRange } from '$lib/admin/dates';
	import { page } from '$app/state';
	import type { PageData } from './$types';
	import { SOLICITUD_TIPO_LABELS, SOLICITUD_STATUS_LABELS } from '$lib/supabase/types';
	import type { SolicitudStatus } from '$lib/supabase/types';

	let { data }: { data: PageData } = $props();
	const range = $derived(resolveDateRange(page.url));
	const p = $derived(data.profile);
</script>

<AdminShell {range} title="Detalle de usuario">
	<p class="back"><a href="/admin/usuarios?{page.url.searchParams}">← Volver a usuarios</a></p>

	<section class="card">
		<h2>Perfil</h2>
		<dl class="grid">
			<div><dt>Email</dt><dd>{p.email || '—'}</dd></div>
			<div><dt>Nombre</dt><dd>{p.full_name || '—'}</dd></div>
			<div><dt>Teléfono</dt><dd>{p.telefono || '—'}</dd></div>
			<div><dt>NIF</dt><dd>{p.nif || '—'}</dd></div>
			<div><dt>Rol</dt><dd><code>{p.role}</code></dd></div>
			<div><dt>Alta</dt><dd>{new Date(p.created_at).toLocaleString('es-ES')}</dd></div>
			<div><dt>ID</dt><dd class="mono">{p.id}</dd></div>
		</dl>
		<p class="note">
			Los roles no se cambian desde la web. Usa <code>npm run seed:demo-users</code> o Supabase
			Dashboard / SQL.
		</p>
	</section>

	<section class="card">
		<h2>Vehículos ({data.vehiculos.length})</h2>
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
							<td>{v.matricula}</td>
							<td>{v.tipo}</td>
							<td>{v.marca || '—'}</td>
							<td>{v.modelo || '—'}</td>
							<td class="mono">{v.bastidor || '—'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			<p class="empty">Sin vehículos registrados.</p>
		{/if}
	</section>

	<section class="card">
		<h2>Trámites ({data.solicitudes.length})</h2>
		{#if data.solicitudes.length}
			<table>
				<thead>
					<tr>
						<th>Fecha</th>
						<th>Tipo</th>
						<th>Estado</th>
						<th>Matrícula</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each data.solicitudes as s}
						<tr>
							<td>{new Date(s.created_at).toLocaleString('es-ES')}</td>
							<td>{SOLICITUD_TIPO_LABELS[s.tipo] || s.tipo}</td>
							<td>{SOLICITUD_STATUS_LABELS[s.status as SolicitudStatus] || s.status}</td>
							<td>{String(s.payload?.matricula ?? '—')}</td>
							<td><a href="/gestor/{s.id}">Ver en gestor</a></td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			<p class="empty">Sin trámites.</p>
		{/if}
	</section>
</AdminShell>

<style>
	.back {
		margin: 0 0 16px;
	}
	.back a {
		color: #003050;
		font-weight: 600;
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
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 12px;
		margin: 0 0 16px;
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
	.mono {
		font-family: ui-monospace, monospace;
		font-size: 0.8rem;
		word-break: break-all;
	}
	.note {
		margin: 12px 0 0;
		font-size: 0.85rem;
		color: #5a6b7d;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}
	th,
	td {
		text-align: left;
		padding: 10px 8px;
		border-bottom: 1px solid #e8eef3;
	}
	th {
		font-size: 0.75rem;
		text-transform: uppercase;
		color: #5a6b7d;
	}
	.empty {
		color: #5a6b7d;
		margin: 0;
	}
	a {
		color: #003050;
		font-weight: 600;
	}
</style>
