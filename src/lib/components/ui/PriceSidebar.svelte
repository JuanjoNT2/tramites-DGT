<script lang="ts">
	import type { PriceBreakdown } from '$lib/utils/pricing';
	import { formatEur } from '$lib/utils/pricing';

	let { breakdown }: { breakdown: PriceBreakdown | null } = $props();
</script>

<aside class="sidebar card">
	<h3>Presupuesto estimado</h3>
	{#if breakdown}
		<div class="total">{formatEur(breakdown.total)}</div>
		<ul class="lines">
			<li><span>ITP ({Math.round(breakdown.itpRate * 100)}%)</span><span>{formatEur(breakdown.itpAmount)}</span></li>
			<li><span>Tasas DGT</span><span>{formatEur(breakdown.tasaDgt)}</span></li>
			{#if breakdown.informeDgt > 0}
				<li><span>Informe DGT</span><span>{formatEur(breakdown.informeDgt)}</span></li>
			{/if}
			<li><span>Tramitación</span><span>{formatEur(breakdown.tramitacion)}</span></li>
		</ul>
		<p class="note">* Estimación con datos de demostración. El importe final puede variar.</p>
	{:else}
		<div class="empty">Completa los datos para ver el presupuesto</div>
	{/if}
</aside>

<style>
	.sidebar {
		padding: 24px;
		position: sticky;
		top: 100px;
	}

	h3 {
		font-size: 14px;
		font-weight: 700;
		color: var(--text2);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 12px;
	}

	.total {
		font-size: 36px;
		font-weight: 800;
		color: var(--primary);
		letter-spacing: -0.03em;
		margin-bottom: 20px;
	}

	.lines {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.lines li {
		display: flex;
		justify-content: space-between;
		font-size: 14px;
		color: var(--text2);
		padding-bottom: 10px;
		border-bottom: 1px solid var(--border);
	}

	.lines li span:last-child {
		font-weight: 700;
		color: var(--ink);
	}

	.note {
		font-size: 11px;
		color: var(--text3);
		margin-top: 16px;
		line-height: 1.45;
	}

	.empty {
		font-size: 15px;
		color: var(--text3);
		padding: 20px 0;
		text-align: center;
	}
</style>
