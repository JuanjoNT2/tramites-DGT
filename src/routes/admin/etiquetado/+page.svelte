<script lang="ts">
	import AdminShell from '$lib/components/admin/AdminShell.svelte';
	import { rangeQuery } from '$lib/admin/dates';

	let { data } = $props();
	const rq = $derived(rangeQuery(data.range));
</script>

<svelte:head>
	<title>Admin · Etiquetado</title>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<AdminShell range={data.range} title="Detalles de etiquetado">
	<form class="search" method="GET">
		<input type="hidden" name="preset" value={data.range.preset} />
		<input type="hidden" name="start" value={data.range.startDate} />
		<input type="hidden" name="end" value={data.range.endDate} />
		<input type="search" name="q" value={data.q} placeholder="Buscar path, trámite, page_type…" />
		<button type="submit">Buscar</button>
	</form>

	<section class="panel">
		<h2>Eventos canónicos</h2>
		<ul class="tags">
			{#each Object.values(data.events) as ev}
				<li><code>{ev}</code></li>
			{/each}
		</ul>
		<h2>CTA IDs</h2>
		<ul class="tags">
			{#each Object.values(data.ctaIds) as id}
				<li><code>{id}</code></li>
			{/each}
		</ul>
	</section>

	<section class="panel">
		<div class="row">
			<h2>Declaración por URL ({data.pages.length})</h2>
			<a class="btn" href="/admin/api/export/csv?type=tagging&{rq}">Export CSV</a>
		</div>
		<table>
			<thead>
				<tr>
					<th>Path</th>
					<th>Tipo</th>
					<th>Grupo</th>
					<th>Trámite</th>
					<th>Eventos</th>
					<th>CTAs</th>
				</tr>
			</thead>
			<tbody>
				{#each data.pages as p}
					<tr>
						<td><code>{p.path}</code></td>
						<td>{p.page_type}</td>
						<td>{p.content_group}</td>
						<td>{p.tramite || '—'}</td>
						<td>{p.events.join(', ')}</td>
						<td>{p.ctas.length ? p.ctas.join(', ') : '—'}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</section>
</AdminShell>

<style>
	.search {
		display: flex;
		gap: 8px;
		margin-bottom: 16px;
	}
	.search input {
		flex: 1;
		height: 38px;
		border: 1px solid #cbd5e1;
		border-radius: 6px;
		padding: 0 12px;
		font: inherit;
	}
	.search button {
		height: 38px;
		padding: 0 14px;
		border: none;
		border-radius: 6px;
		background: #003050;
		color: #fff;
		font-weight: 700;
		cursor: pointer;
	}
	.panel {
		background: #fff;
		border: 1px solid #e2e8f0;
		border-radius: 10px;
		padding: 18px;
		margin-bottom: 14px;
		overflow-x: auto;
	}
	.row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 10px;
		margin-bottom: 10px;
	}
	h2 {
		margin: 0 0 10px;
		font-size: 15px;
		color: #003050;
	}
	.tags {
		list-style: none;
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		padding: 0;
		margin: 0 0 16px;
	}
	.tags li code,
	td code {
		background: #f1f5f9;
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 12px;
	}
	.btn {
		display: inline-flex;
		height: 34px;
		align-items: center;
		padding: 0 12px;
		background: #003050;
		color: #fff;
		border-radius: 6px;
		font-weight: 700;
		font-size: 12px;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 12px;
	}
	th,
	td {
		text-align: left;
		padding: 8px 6px;
		border-bottom: 1px solid #eef2f6;
		vertical-align: top;
	}
	th {
		color: #5a6b7d;
	}
</style>
