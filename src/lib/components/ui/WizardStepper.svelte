<script lang="ts">
	let {
		current,
		labels,
		errorSteps = [],
		onchange
	}: {
		current: number;
		labels: string[];
		/** Pasos (1-based) con errores tras intento de envío */
		errorSteps?: number[];
		onchange: (step: number) => void;
	} = $props();

	const total = $derived(labels.length);
	const errorSet = $derived(new Set(errorSteps));
</script>

<nav class="stepper" aria-label="Pasos del formulario">
	<ol>
		{#each labels as label, i}
			{@const n = i + 1}
			{@const isActive = n === current}
			{@const isDone = n < current}
			{@const hasError = errorSet.has(n)}
			<li>
				<button
					type="button"
					class="step"
					class:active={isActive}
					class:done={isDone}
					class:error={hasError}
					aria-current={isActive ? 'step' : undefined}
					onclick={() => onchange(n)}
				>
					<span class="num" aria-hidden="true">{n}</span>
					<span class="lbl">{label}</span>
				</button>
				{#if n < total}
					<span class="connector" class:filled={n < current} aria-hidden="true"></span>
				{/if}
			</li>
		{/each}
	</ol>
</nav>

<style>
	.stepper {
		margin-bottom: 28px;
	}

	ol {
		list-style: none;
		display: flex;
		align-items: flex-start;
		gap: 0;
		margin: 0;
		padding: 0;
		width: 100%;
	}

	li {
		display: flex;
		align-items: flex-start;
		flex: 1;
		min-width: 0;
	}

	li:last-child {
		flex: 0 1 auto;
	}

	.step {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		border: none;
		background: transparent;
		cursor: pointer;
		padding: 0;
		min-width: 0;
		color: var(--text3);
		font: inherit;
		text-align: center;
	}

	.num {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		font-size: 14px;
		font-weight: 800;
		border: 2px solid #c5d0da;
		background: #fff;
		color: #5a6b7d;
		transition:
			background 0.2s var(--ease),
			border-color 0.2s var(--ease),
			color 0.2s var(--ease),
			box-shadow 0.2s var(--ease);
	}

	.lbl {
		font-size: 12px;
		font-weight: 700;
		line-height: 1.25;
		max-width: 88px;
		color: inherit;
	}

	.step.active {
		color: var(--brand-navy);
	}

	.step.active .num {
		background: var(--brand-teal);
		border-color: var(--brand-teal);
		color: var(--brand-navy);
		box-shadow: 0 0 0 4px rgba(0, 198, 209, 0.22);
	}

	.step.done .num {
		background: var(--brand-navy);
		border-color: var(--brand-navy);
		color: #fff;
	}

	.step.done {
		color: var(--brand-navy);
	}

	.step.error .num {
		border-color: var(--error);
		color: var(--error);
		background: #fff5f5;
	}

	.step.error {
		color: var(--error);
	}

	.connector {
		flex: 1;
		height: 2px;
		margin: 17px 6px 0;
		background: #d8e0e8;
		min-width: 12px;
	}

	.connector.filled {
		background: var(--brand-navy);
	}

	@media (max-width: 640px) {
		.lbl {
			font-size: 11px;
			max-width: 64px;
		}
		.num {
			width: 32px;
			height: 32px;
			font-size: 13px;
		}
		.connector {
			margin-top: 15px;
		}
	}
</style>
