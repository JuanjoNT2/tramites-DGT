<script lang="ts">
	let {
		current,
		total,
		labels = []
	}: {
		current: number;
		total: number;
		labels?: string[];
	} = $props();

	const pct = $derived(Math.round((current / total) * 100));
</script>

<div class="progress">
	<div class="meta">
		<span class="step">Paso {current} de {total}</span>
		{#if labels[current - 1]}<span class="label">{labels[current - 1]}</span>{/if}
	</div>
	<div class="bar"><div class="fill" style="width: {pct}%"></div></div>
</div>

<style>
	.progress {
		margin-bottom: 32px;
	}

	.meta {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 8px;
		gap: 12px;
	}

	.step {
		font-size: 13px;
		font-weight: 700;
		color: var(--brand-teal);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.label {
		font-size: 14px;
		font-weight: 600;
		color: var(--text2);
	}

	.bar {
		height: 6px;
		background: var(--border);
		border-radius: 3px;
		overflow: hidden;
	}

	.fill {
		height: 100%;
		background: var(--brand-teal);
		border-radius: 3px;
		transition: width 0.35s var(--ease);
	}
</style>
