<script lang="ts">
	import type { PageData } from './$types';
	import { SOLICITUD_TIPO_LABELS, SOLICITUD_STATUS_LABELS } from '$lib/supabase/types';
	import type { SolicitudStatus } from '$lib/supabase/types';

	let { data }: { data: PageData } = $props();

	function tipoLabel(t: string) {
		return SOLICITUD_TIPO_LABELS[t] || t;
	}
	function statusLabel(s: string) {
		return SOLICITUD_STATUS_LABELS[s as SolicitudStatus] || s;
	}
</script>

<header class="head">
	<h1>Mis trámites</h1>
	<nav class="tabs">
		<a href="/cuenta/tramites?estado=en_curso" class:active={data.estado === 'en_curso'}>En curso</a>
		<a href="/cuenta/tramites?estado=realizados" class:active={data.estado === 'realizados'}
			>Realizados</a
		>
		<a href="/cuenta/tramites?estado=todos" class:active={data.estado === 'todos'}>Todos</a>
	</nav>
</header>

<div class="table-wrap">
	<table>
		<thead>
			<tr>
				<th>Fecha</th>
				<th>Tipo</th>
				<th>Matrícula</th>
				<th>Estado</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#each data.items as s}
				<tr>
					<td>{new Date(s.created_at).toLocaleString('es-ES')}</td>
					<td>{tipoLabel(s.tipo)}</td>
					<td>{String(s.payload?.matricula ?? '—')}</td>
					<td><code>{statusLabel(String(s.status))}</code></td>
					<td><a href={`/cuenta/tramites/${s.id}`}>Ver</a></td>
				</tr>
			{:else}
				<tr><td colspan="5">No hay trámites en este filtro.</td></tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.head {
		margin-bottom: 16px;
	}
	h1 {
		margin: 0 0 12px;
		color: #003050;
	}
	.tabs {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}
	.tabs a {
		padding: 8px 12px;
		border-radius: 999px;
		background: #fff;
		border: 1px solid #d8e0e8;
		text-decoration: none;
		color: #1a2b3c;
		font-weight: 600;
		font-size: 0.85rem;
	}
	.tabs a.active {
		background: #003050;
		color: #fff;
		border-color: #003050;
	}
	.table-wrap {
		overflow: auto;
		background: #fff;
		border: 1px solid #d8e0e8;
		border-radius: 12px;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}
	th,
	td {
		text-align: left;
		padding: 12px 14px;
		border-bottom: 1px solid #e8eef3;
	}
	th {
		background: #f4f7fa;
		font-size: 0.75rem;
		text-transform: uppercase;
		color: #5a6b7d;
	}
	a {
		font-weight: 700;
		color: #003050;
	}
</style>
