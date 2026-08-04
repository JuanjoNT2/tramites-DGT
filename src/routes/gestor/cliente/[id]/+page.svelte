<script lang="ts">
	import type { PageData } from './$types';
	import type { SolicitudStatus } from '$lib/supabase/types';

	let { data }: { data: PageData } = $props();
	const p = $derived(data.profile);
	const c = $derived(data.contact);

	function statusLabel(status: string) {
		return data.statusLabels[status as SolicitudStatus] || status;
	}

	function tipoLabel(tipo: string) {
		return data.tipoLabels[tipo] || tipo;
	}
</script>

<p class="back"><a href="/gestor/usuarios?vista=todos">← Volver a usuarios</a></p>

<header class="head">
	<div>
		<h1>{c.nombre || p.full_name || p.email || 'Cliente'}</h1>
		<p class="sub">Ficha del ciudadano · no es la cuenta del gestor</p>
	</div>
</header>

<section class="card">
	<h2>Datos del usuario</h2>
	<dl class="grid">
		<div><dt>Nombre</dt><dd>{c.nombre || '—'}</dd></div>
		<div><dt>Teléfono</dt><dd>
			{c.telefono || '—'}
			{#if c.fromTramite.telefono}<span class="src">del trámite</span>{/if}
		</dd></div>
		<div><dt>NIF</dt><dd>
			{c.nif || '—'}
			{#if c.fromTramite.nif}<span class="src">del trámite</span>{/if}
		</dd></div>
		<div><dt>Alta</dt><dd>{new Date(p.created_at).toLocaleString('es-ES')}</dd></div>
		<div class="email"><dt>Email</dt><dd>{c.email || '—'}</dd></div>
	</dl>
	{#if !c.telefono && !c.nif}
		<p class="hint">
			Esta cuenta no tiene teléfono ni NIF guardados en el perfil ni en sus trámites vinculados.
		</p>
	{/if}
</section>

<section class="card card-tramites">
	<h2>
		<span class="badge badge-tramites">Trámites</span>
		En curso ({data.pendientes.length})
	</h2>
	{#if data.pendientes.length}
		<table>
			<thead>
				<tr>
					<th>Fecha</th>
					<th>Tipo</th>
					<th>Estado</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each data.pendientes as s}
					<tr>
						<td>{new Date(s.created_at).toLocaleString('es-ES')}</td>
						<td>{tipoLabel(s.tipo)}</td>
						<td>{statusLabel(String(s.status))}</td>
						<td><a href="/gestor/{s.id}">Abrir trámite</a></td>
					</tr>
				{/each}
			</tbody>
		</table>
	{:else}
		<p class="empty">Sin trámites pendientes.</p>
	{/if}
</section>

<section class="card card-tramites">
	<h2>
		<span class="badge badge-tramites">Trámites</span>
		Finalizados ({data.finalizados.length})
	</h2>
	{#if data.finalizados.length}
		<table>
			<thead>
				<tr>
					<th>Fecha</th>
					<th>Tipo</th>
					<th>Estado</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each data.finalizados as s}
					<tr>
						<td>{new Date(s.created_at).toLocaleString('es-ES')}</td>
						<td>{tipoLabel(s.tipo)}</td>
						<td>{statusLabel(String(s.status))}</td>
						<td><a href="/gestor/{s.id}">Abrir trámite</a></td>
					</tr>
				{/each}
			</tbody>
		</table>
	{:else}
		<p class="empty">Sin trámites finalizados.</p>
	{/if}
</section>

<section class="card card-vehiculos">
	<h2>
		<span class="badge badge-vehiculos">Vehículos</span>
		Del cliente ({data.vehiculos.length})
	</h2>
	<p class="hint">Vehículos asociados a la cuenta del ciudadano (no del gestor).</p>
	{#if data.vehiculos.length}
		<table>
			<thead>
				<tr>
					<th>Matrícula</th>
					<th>Tipo</th>
					<th>Marca</th>
					<th>Modelo</th>
				</tr>
			</thead>
			<tbody>
				{#each data.vehiculos as v}
					<tr>
						<td>{v.matricula}</td>
						<td>{v.tipo}</td>
						<td>{v.marca || '—'}</td>
						<td>{v.modelo || '—'}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{:else}
		<p class="empty">Sin vehículos registrados en la cuenta del cliente.</p>
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
		font-size: 0.9rem;
	}
	.card {
		background: #fff;
		border: 1px solid #d8e0e8;
		border-radius: 12px;
		padding: 16px 18px;
		margin-bottom: 16px;
	}
	.card-tramites {
		border-left: 4px solid #00c6d1;
		background: linear-gradient(90deg, rgba(0, 198, 209, 0.06), #fff 40%);
	}
	.card-vehiculos {
		border-left: 4px solid #003050;
		background: linear-gradient(90deg, rgba(0, 48, 80, 0.06), #fff 40%);
	}
	h2 {
		margin: 0 0 12px;
		font-size: 1rem;
		color: #003050;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
	}
	.badge {
		display: inline-flex;
		align-items: center;
		padding: 3px 9px;
		border-radius: 999px;
		font-size: 0.68rem;
		font-weight: 800;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}
	.badge-tramites {
		background: #e0f7fa;
		color: #006064;
	}
	.badge-vehiculos {
		background: #e3edf5;
		color: #003050;
	}
	.hint {
		margin: -4px 0 12px;
		font-size: 0.85rem;
		color: #5a6b7d;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 12px;
		margin: 0;
	}
	.grid > div {
		min-width: 0;
		padding: 10px 12px;
		background: #f8fafc;
		border-radius: 8px;
		border: 1px solid #e8eef3;
	}
	.grid .email {
		grid-column: 1 / -1;
	}
	dt {
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		color: #5a6b7d;
	}
	dd {
		margin: 4px 0 0;
		overflow-wrap: anywhere;
		word-break: break-word;
	}
	.src {
		display: inline-block;
		margin-left: 6px;
		padding: 1px 6px;
		border-radius: 999px;
		background: #e0f7fa;
		color: #006064;
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
	}
	@media (max-width: 560px) {
		.grid {
			grid-template-columns: 1fr;
		}
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
		font-size: 0.72rem;
		text-transform: uppercase;
		color: #5a6b7d;
	}
	.empty {
		color: #5a6b7d;
		margin: 0;
	}
	a {
		color: #003050;
		font-weight: 700;
		text-decoration: none;
	}
</style>
