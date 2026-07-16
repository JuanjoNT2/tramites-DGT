<script lang="ts">
	import AdminShell from '$lib/components/admin/AdminShell.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Admin · Data layer</title>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<AdminShell range={data.range} title="Configuración de capas de datos">
	<p class="intro">
		Contrato de <code>window.dataLayer</code> alineado con GTM → GA4. El sitio empuja estos eventos
		desde <code>src/lib/analytics/track.ts</code>. En GTM crea un trigger Custom Event por cada
		nombre y, para conversiones, márcalas en GA4.
	</p>

	{#each data.contract as item}
		<article class="card">
			<header>
				<h2><code>{item.event}</code></h2>
				{#if item.isConversion}<span class="pill">conversión GA4</span>{/if}
			</header>
			<p>{item.description}</p>
			<p class="meta"><strong>Trigger GTM:</strong> {item.gtmTrigger}</p>
			<p class="meta">
				<strong>Params obligatorios:</strong>
				{item.requiredParams.join(', ')}
			</p>
			{#if item.optionalParams.length}
				<p class="meta">
					<strong>Opcionales:</strong>
					{item.optionalParams.join(', ')}
				</p>
			{/if}
			<pre>{JSON.stringify(item.example, null, 2)}</pre>
		</article>
	{/each}
</AdminShell>

<style>
	.intro {
		font-size: 14px;
		color: #5a6b7d;
		line-height: 1.5;
		margin: 0 0 16px;
		max-width: 85ch;
	}
	.card {
		background: #fff;
		border: 1px solid #e2e8f0;
		border-radius: 10px;
		padding: 16px 18px;
		margin-bottom: 12px;
	}
	header {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 8px;
	}
	h2 {
		margin: 0;
		font-size: 15px;
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
		margin: 0 0 6px;
		font-size: 13px;
		color: #5a6b7d;
	}
	.meta {
		color: #1a2b3c;
	}
	code {
		background: #f1f5f9;
		padding: 2px 6px;
		border-radius: 4px;
	}
	pre {
		margin: 10px 0 0;
		background: #0f2433;
		color: #d7f6f8;
		padding: 12px;
		border-radius: 8px;
		font-size: 12px;
		overflow-x: auto;
	}
</style>
