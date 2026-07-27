<script lang="ts">
	import AdminShell from '$lib/components/admin/AdminShell.svelte';

	let { data } = $props();
	const maxCount = $derived(Math.max(...data.funnel.map((s) => s.count), 1));
</script>

<svelte:head>
	<title>Admin · Funnel</title>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<AdminShell range={data.range} title="Embudo de conversión">
	<p class="help">
		Eventos del periodo ({data.totalEvents.toLocaleString('es-ES')} crudos): form_started → pasos →
		enviado → pago. Abandonos: {data.counts.form_abandoned.toLocaleString('es-ES')}.
	</p>

	<section class="panel">
		<h2>Embudo</h2>
		<ul class="funnel">
			{#each data.funnel as step, i}
				<li>
					<div class="meta">
						<strong>{step.label}</strong>
						<span class="count">{step.count.toLocaleString('es-ES')}</span>
						{#if step.dropOffPct != null}
							<span class="drop" class:warn={step.dropOffPct > 0}>
								{step.dropOffPct > 0 ? `−${step.dropOffPct}%` : '0%'} vs anterior
							</span>
						{:else if i === 0}
							<span class="drop">base</span>
						{/if}
					</div>
					<div class="bar-track">
						<div class="bar" style="width: {(step.count / maxCount) * 100}%"></div>
					</div>
				</li>
			{/each}
		</ul>
	</section>

	<section class="panel">
		<h2>Última página (page_view / form_abandoned)</h2>
		<table>
			<thead>
				<tr>
					<th>page_path</th>
					<th>page_view</th>
					<th>form_abandoned</th>
				</tr>
			</thead>
			<tbody>
				{#each data.pages as p}
					<tr>
						<td class="mono">{p.path}</td>
						<td>{p.views.toLocaleString('es-ES')}</td>
						<td>{p.abandoned.toLocaleString('es-ES')}</td>
					</tr>
				{:else}
					<tr>
						<td colspan="3">Sin datos en el periodo.</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</section>
</AdminShell>

<style>
	.help {
		font-size: 13px;
		color: #5a6b7d;
		margin: 0 0 14px;
	}
	.panel {
		background: #fff;
		border: 1px solid #e2e8f0;
		border-radius: 10px;
		padding: 18px;
		margin-bottom: 16px;
		overflow-x: auto;
	}
	h2 {
		margin: 0 0 14px;
		font-size: 16px;
		font-weight: 800;
		color: #003050;
	}
	.funnel {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 12px;
	}
	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 10px;
		margin-bottom: 6px;
		font-size: 13px;
	}
	.count {
		font-weight: 800;
		color: #003050;
	}
	.drop {
		color: #5a6b7d;
		font-size: 12px;
	}
	.drop.warn {
		color: #b45309;
		font-weight: 700;
	}
	.bar-track {
		height: 8px;
		background: #eef2f6;
		border-radius: 999px;
		overflow: hidden;
	}
	.bar {
		height: 100%;
		background: #00c6d1;
		border-radius: 999px;
		min-width: 0;
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
		font-weight: 700;
	}
	.mono {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 12px;
	}
</style>
