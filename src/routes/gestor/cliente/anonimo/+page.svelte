<script lang="ts">
	import type { PageData } from './$types';
	import type { SolicitudStatus } from '$lib/supabase/types';

	let { data }: { data: PageData } = $props();

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
		<h1>{data.email}</h1>
		<p class="sub">
			Cliente sin cuenta registrada · trámites enviados solo con email
		</p>
	</div>
</header>

<section class="card">
	<h2>Trámites en curso ({data.pendientes.length})</h2>
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

<section class="card">
	<h2>Trámites finalizados ({data.finalizados.length})</h2>
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
		word-break: break-all;
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
