<script lang="ts">
	import AdminShell from '$lib/components/admin/AdminShell.svelte';
	import { rangeQuery } from '$lib/admin/dates';

	let { data } = $props();
	const q = $derived(rangeQuery(data.range));
	const maxSessions = $derived(Math.max(...data.channels.map((c) => c.sessions), 1));
</script>

<svelte:head>
	<title>Admin · Canales</title>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<AdminShell range={data.range} title="Canales de adquisición">
	<div class="actions">
		<a class="btn" href="/admin/api/export/csv?type=channels&{q}">Export CSV</a>
	</div>

	<section class="panel">
		<p class="help">
			Dimensión GA4 <code>sessionDefaultChannelGroup</code> (Organic Search, Paid Search, Direct…).
		</p>
		<table>
			<thead>
				<tr>
					<th>Canal</th>
					<th>Sesiones</th>
					<th>Usuarios</th>
					<th>Engaged</th>
					<th>Conversiones</th>
					<th>Eventos</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each data.channels as c}
					<tr>
						<td>{c.channel}</td>
						<td>{c.sessions.toLocaleString('es-ES')}</td>
						<td>{c.users.toLocaleString('es-ES')}</td>
						<td>{c.engagedSessions.toLocaleString('es-ES')}</td>
						<td>{c.conversions.toLocaleString('es-ES')}</td>
						<td>{c.eventCount.toLocaleString('es-ES')}</td>
						<td class="bar-cell">
							<div class="bar" style="width: {(c.sessions / maxSessions) * 100}%"></div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</section>
</AdminShell>

<style>
	.actions {
		margin-bottom: 14px;
	}
	.btn {
		display: inline-flex;
		height: 38px;
		align-items: center;
		padding: 0 14px;
		background: #003050;
		color: #fff;
		border-radius: 6px;
		font-weight: 700;
		font-size: 13px;
	}
	.panel {
		background: #fff;
		border: 1px solid #e2e8f0;
		border-radius: 10px;
		padding: 18px;
		overflow-x: auto;
	}
	.help {
		font-size: 13px;
		color: #5a6b7d;
		margin: 0 0 14px;
	}
	code {
		background: #f1f5f9;
		padding: 2px 6px;
		border-radius: 4px;
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
		white-space: nowrap;
	}
	th {
		color: #5a6b7d;
		font-size: 12px;
	}
	.bar-cell {
		min-width: 120px;
	}
	.bar {
		height: 8px;
		background: #00c6d1;
		border-radius: 4px;
	}
</style>
