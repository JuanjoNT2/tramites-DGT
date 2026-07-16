<script lang="ts">
	import AdminShell from '$lib/components/admin/AdminShell.svelte';
	import { rangeQuery } from '$lib/admin/dates';

	let { data } = $props();
	const q = $derived(rangeQuery(data.range));
</script>

<svelte:head>
	<title>Admin · Eventos</title>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<AdminShell range={data.range} title="Eventos y conversiones">
	<div class="toolbar">
		<div class="tabs">
			<a class:active={data.only === 'all'} href="/admin/eventos?{q}&only=all">Todos</a>
			<a class:active={data.only === 'conversions'} href="/admin/eventos?{q}&only=conversions"
				>Conversiones</a
			>
			<a class:active={data.only === 'user'} href="/admin/eventos?{q}&only=user">Usuario</a>
		</div>
		<a class="btn" href="/admin/api/export/csv?type=events&{q}&only={data.only}">Export CSV</a>
	</div>

	<section class="panel">
		{#each data.events as e}
			<article class="event">
				<header>
					<strong>{e.eventName}</strong>
					{#if e.isConversion}<span class="pill">conversión</span>{/if}
				</header>
				<p>
					{e.eventCount.toLocaleString('es-ES')} eventos · {e.users.toLocaleString('es-ES')} usuarios
				</p>
				{#if e.byChannel.length}
					<details>
						<summary>Segmentación por canal</summary>
						<ul>
							{#each e.byChannel as ch}
								<li>
									{ch.channel}: {ch.eventCount.toLocaleString('es-ES')}
								</li>
							{/each}
						</ul>
					</details>
				{/if}
			</article>
		{/each}
	</section>
</AdminShell>

<style>
	.toolbar {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
		margin-bottom: 14px;
	}
	.tabs {
		display: flex;
		gap: 6px;
	}
	.tabs a {
		padding: 8px 12px;
		border-radius: 6px;
		background: #fff;
		border: 1px solid #e2e8f0;
		font-size: 13px;
		font-weight: 700;
		color: #5a6b7d;
	}
	.tabs a.active {
		background: #003050;
		border-color: #003050;
		color: #fff;
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
		display: grid;
		gap: 10px;
	}
	.event {
		background: #fff;
		border: 1px solid #e2e8f0;
		border-radius: 10px;
		padding: 14px 16px;
	}
	header {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.pill {
		font-size: 11px;
		font-weight: 800;
		background: #e8f8f5;
		color: #0f6b56;
		padding: 2px 8px;
		border-radius: 999px;
	}
	p {
		margin: 6px 0 0;
		font-size: 13px;
		color: #5a6b7d;
	}
	details {
		margin-top: 10px;
		font-size: 13px;
	}
	summary {
		cursor: pointer;
		font-weight: 700;
		color: #003050;
	}
	ul {
		margin: 8px 0 0;
		padding-left: 18px;
		color: #1a2b3c;
	}
</style>
