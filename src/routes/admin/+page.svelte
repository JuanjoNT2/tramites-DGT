<script lang="ts">
	import AdminShell from '$lib/components/admin/AdminShell.svelte';
	import { rangeQuery } from '$lib/admin/dates';

	let { data } = $props();
	const q = $derived(rangeQuery(data.range));
</script>

<svelte:head>
	<title>Admin · Overview</title>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<AdminShell range={data.range} title="Métricas generales">
	<div class="banner" class:live={data.overview.source === 'ga4'}>
		Fuente: {data.overview.source === 'ga4' ? 'GA4 (live)' : 'Demo (sin credenciales GA4)'}
	</div>

	<div class="kpis">
		<div class="kpi"><span>Usuarios</span><strong>{data.overview.activeUsers.toLocaleString('es-ES')}</strong></div>
		<div class="kpi"><span>Sesiones</span><strong>{data.overview.sessions.toLocaleString('es-ES')}</strong></div>
		<div class="kpi"><span>Vistas</span><strong>{data.overview.screenPageViews.toLocaleString('es-ES')}</strong></div>
		<div class="kpi"><span>Engaged</span><strong>{data.overview.engagedSessions.toLocaleString('es-ES')}</strong></div>
		<div class="kpi"><span>Conversiones</span><strong>{data.overview.conversions.toLocaleString('es-ES')}</strong></div>
		<div class="kpi"><span>Eventos</span><strong>{data.overview.eventCount.toLocaleString('es-ES')}</strong></div>
		<div class="kpi">
			<span>Engagement rate</span>
			<strong>{(data.overview.engagementRate * 100).toFixed(1)}%</strong>
		</div>
	</div>

	<div class="actions">
		<a class="btn" href="/admin/api/export/csv?type=overview&{q}">Export CSV</a>
		<a class="btn ghost" href="/admin/api/export/pdf?{q}">Export PDF informe</a>
	</div>

	<section class="panel">
		<h2>Top canales</h2>
		<table>
			<thead>
				<tr>
					<th>Canal</th>
					<th>Sesiones</th>
					<th>Usuarios</th>
					<th>Conversiones</th>
				</tr>
			</thead>
			<tbody>
				{#each data.channels as c}
					<tr>
						<td>{c.channel}</td>
						<td>{c.sessions.toLocaleString('es-ES')}</td>
						<td>{c.users.toLocaleString('es-ES')}</td>
						<td>{c.conversions.toLocaleString('es-ES')}</td>
					</tr>
				{/each}
			</tbody>
		</table>
		<a class="more" href="/admin/canales?{q}">Ver todos los canales →</a>
	</section>
</AdminShell>

<style>
	.banner {
		background: #fff7e6;
		border: 1px solid #f0d9a8;
		color: #8a6d1d;
		padding: 10px 14px;
		border-radius: 8px;
		font-size: 13px;
		font-weight: 600;
		margin-bottom: 18px;
	}
	.banner.live {
		background: #e8f8f5;
		border-color: #9fd9cb;
		color: #0f6b56;
	}
	.kpis {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 12px;
		margin-bottom: 18px;
	}
	.kpi {
		background: #fff;
		border: 1px solid #e2e8f0;
		border-radius: 10px;
		padding: 14px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.kpi span {
		font-size: 12px;
		color: #5a6b7d;
		font-weight: 600;
	}
	.kpi strong {
		font-size: 22px;
		color: #003050;
	}
	.actions {
		display: flex;
		gap: 10px;
		margin-bottom: 20px;
		flex-wrap: wrap;
	}
	.btn {
		display: inline-flex;
		align-items: center;
		height: 38px;
		padding: 0 14px;
		background: #003050;
		color: #fff;
		border-radius: 6px;
		font-weight: 700;
		font-size: 13px;
	}
	.btn.ghost {
		background: #fff;
		color: #003050;
		border: 1px solid #cbd5e1;
	}
	.panel {
		background: #fff;
		border: 1px solid #e2e8f0;
		border-radius: 10px;
		padding: 18px;
	}
	h2 {
		margin: 0 0 12px;
		font-size: 16px;
		color: #003050;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 13px;
	}
	th,
	td {
		text-align: left;
		padding: 10px 8px;
		border-bottom: 1px solid #eef2f6;
	}
	th {
		color: #5a6b7d;
		font-size: 12px;
	}
	.more {
		display: inline-block;
		margin-top: 12px;
		font-size: 13px;
		font-weight: 700;
		color: #008f99;
	}
</style>
