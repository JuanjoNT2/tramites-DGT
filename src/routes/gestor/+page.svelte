<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function label(tipo: string) {
		return data.labels[tipo] || tipo;
	}
</script>

<header class="head">
	<div>
		<h1>Solicitudes</h1>
		<p class="sub">Documentación de formularios agrupada por tipo de trámite.</p>
	</div>
	<div class="exports">
		<a
			class="btn"
			href={`/gestor/api/export/csv?tipo=${encodeURIComponent(data.tipo)}`}
			>CSV</a
		>
		<a
			class="btn secondary"
			href={`/gestor/api/export/excel?tipo=${encodeURIComponent(data.tipo)}`}
			>Excel</a
		>
	</div>
</header>

{#if data.error}
	<p class="err">{data.error}</p>
{/if}

<nav class="tabs" aria-label="Tipos de solicitud">
	<a href="/gestor?tipo=todos" class:active={data.tipo === 'todos'}>
		Todos
		<span>{Object.values(data.counts).reduce((a, b) => a + b, 0)}</span>
	</a>
	{#each data.tipos as t}
		<a href={`/gestor?tipo=${t}`} class:active={data.tipo === t}>
			{label(t)}
			<span>{data.counts[t] ?? 0}</span>
		</a>
	{/each}
</nav>

<div class="table-wrap">
	<table>
		<thead>
			<tr>
				<th>Fecha</th>
				<th>Tipo</th>
				<th>Email</th>
				<th>Matrícula</th>
				<th>Estado</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#each data.items as s (s.id)}
				<tr>
					<td>{new Date(s.created_at).toLocaleString('es-ES')}</td>
					<td>{label(s.tipo)}</td>
					<td>{s.email || '—'}</td>
					<td>{String(s.payload?.matricula ?? '—')}</td>
					<td><code>{s.status}</code></td>
					<td class="row-actions">
						<a href={`/gestor/${s.id}`}>Ver</a>
						<a href={`/gestor/api/export/pdf?id=${s.id}`}>PDF</a>
					</td>
				</tr>
			{:else}
				<tr>
					<td colspan="6">No hay solicitudes en este filtro.</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 16px;
		margin-bottom: 20px;
		flex-wrap: wrap;
	}
	h1 {
		margin: 0 0 6px;
		color: #003050;
	}
	.sub {
		margin: 0;
		color: #5a6b7d;
	}
	.exports {
		display: flex;
		gap: 8px;
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
		font-size: 0.9rem;
	}
	.btn.secondary {
		background: #fff;
		border: 1px solid #c5d0da;
	}
	.err {
		background: #fde8e8;
		color: #9b1c1c;
		padding: 10px 12px;
		border-radius: 8px;
	}
	.tabs {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-bottom: 16px;
	}
	.tabs a {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		background: #fff;
		border: 1px solid #d8e0e8;
		border-radius: 999px;
		text-decoration: none;
		color: #1a2b3c;
		font-size: 0.85rem;
		font-weight: 600;
	}
	.tabs a.active {
		background: #003050;
		color: #fff;
		border-color: #003050;
	}
	.tabs span {
		opacity: 0.7;
		font-size: 0.8rem;
	}
	.table-wrap {
		overflow: auto;
		background: #fff;
		border-radius: 12px;
		border: 1px solid #d8e0e8;
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
		letter-spacing: 0.04em;
		color: #5a6b7d;
	}
	.row-actions {
		display: flex;
		gap: 12px;
	}
	.row-actions a {
		font-weight: 700;
		color: #003050;
	}
</style>
