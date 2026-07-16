<script lang="ts">
	import AdminShell from '$lib/components/admin/AdminShell.svelte';
	import { rangeQuery } from '$lib/admin/dates';

	let { data } = $props();
	const q = $derived(rangeQuery(data.range));
</script>

<svelte:head>
	<title>Admin · Conexiones</title>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<AdminShell range={data.range} title="Conexiones externas">
	<p class="intro">
		Cada fuente es independiente. El vínculo Google Ads ↔ GA4 en la consola de Google es opcional y
		mejora la atribución web; el conector Ads del panel lee la cuenta Ads por su API (histórico
		incluido).
	</p>

	<div class="grid">
		{#each data.connectors as c}
			<article class="card" class:ok={c.connected}>
				<header>
					<h2>{c.label}</h2>
					<span class="badge">{c.mode === 'live' ? 'Live' : 'Demo'}</span>
				</header>
				<p>{c.description}</p>
				<p class="detail">{c.detail}</p>
				{#if c.lastSync}
					<small>Última sync: {new Date(c.lastSync).toLocaleString('es-ES')}</small>
				{/if}
			</article>
		{/each}
	</div>

	<section class="panel">
		<div class="row">
			<h2>Google Ads · campañas</h2>
			<a class="btn" href="/admin/api/export/csv?type=ads&{q}">CSV</a>
		</div>
		<p class="src">Fuente: {data.ads.source}</p>
		<table>
			<thead>
				<tr>
					<th>Campaña</th>
					<th>Impresiones</th>
					<th>Clics</th>
					<th>Coste</th>
					<th>CTR</th>
				</tr>
			</thead>
			<tbody>
				{#each data.ads.rows as r}
					<tr>
						<td>{r.campaign}</td>
						<td>{r.impressions.toLocaleString('es-ES')}</td>
						<td>{r.clicks.toLocaleString('es-ES')}</td>
						<td>{r.cost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
						<td>{(r.ctr * 100).toFixed(2)}%</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</section>

	<section class="panel">
		<div class="row">
			<h2>Search Console · consultas</h2>
			<a class="btn" href="/admin/api/export/csv?type=gsc&{q}">CSV</a>
		</div>
		<p class="src">Fuente: {data.gsc.source}</p>
		<table>
			<thead>
				<tr>
					<th>Consulta</th>
					<th>Clics</th>
					<th>Impresiones</th>
					<th>CTR</th>
					<th>Posición</th>
				</tr>
			</thead>
			<tbody>
				{#each data.gsc.rows as r}
					<tr>
						<td>{r.query}</td>
						<td>{r.clicks.toLocaleString('es-ES')}</td>
						<td>{r.impressions.toLocaleString('es-ES')}</td>
						<td>{(r.ctr * 100).toFixed(2)}%</td>
						<td>{r.position.toFixed(1)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</section>
</AdminShell>

<style>
	.intro {
		font-size: 14px;
		color: #5a6b7d;
		margin: 0 0 18px;
		max-width: 80ch;
		line-height: 1.5;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 12px;
		margin-bottom: 20px;
	}
	.card {
		background: #fff;
		border: 1px solid #e2e8f0;
		border-radius: 10px;
		padding: 16px;
	}
	.card.ok {
		border-color: #9fd9cb;
	}
	header {
		display: flex;
		justify-content: space-between;
		gap: 8px;
		align-items: center;
		margin-bottom: 8px;
	}
	h2 {
		margin: 0;
		font-size: 15px;
		color: #003050;
	}
	.badge {
		font-size: 11px;
		font-weight: 800;
		padding: 3px 8px;
		border-radius: 999px;
		background: #fff7e6;
		color: #8a6d1d;
	}
	.card.ok .badge {
		background: #e8f8f5;
		color: #0f6b56;
	}
	.card p {
		margin: 0 0 8px;
		font-size: 13px;
		color: #5a6b7d;
		line-height: 1.45;
	}
	.detail {
		color: #1a2b3c !important;
		font-weight: 600;
	}
	small {
		font-size: 11px;
		color: #8896a6;
	}
	.panel {
		background: #fff;
		border: 1px solid #e2e8f0;
		border-radius: 10px;
		padding: 18px;
		margin-bottom: 16px;
		overflow-x: auto;
	}
	.row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 10px;
		margin-bottom: 6px;
	}
	.src {
		font-size: 12px;
		color: #8896a6;
		margin: 0 0 10px;
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
		font-size: 13px;
	}
	th,
	td {
		text-align: left;
		padding: 9px 8px;
		border-bottom: 1px solid #eef2f6;
	}
	th {
		color: #5a6b7d;
		font-size: 12px;
	}
</style>
