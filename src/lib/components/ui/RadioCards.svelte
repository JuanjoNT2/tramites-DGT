<script lang="ts">
	let {
		options,
		value = $bindable(''),
		name
	}: {
		options: { value: string; label: string; desc?: string }[];
		value?: string;
		name: string;
	} = $props();
</script>

<div class="radios" role="radiogroup">
	{#each options as opt (opt.value)}
		<label class="radio-card" class:selected={value === opt.value}>
			<input type="radio" {name} value={opt.value} bind:group={value} />
			<span class="title">{opt.label}</span>
			{#if opt.desc}<span class="desc">{opt.desc}</span>{/if}
		</label>
	{/each}
</div>

<style>
	.radios {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 12px;
	}

	.radio-card {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 18px 16px;
		border: 2px solid var(--border);
		border-radius: var(--radius);
		cursor: pointer;
		transition: border-color 0.15s, background 0.15s;
		background: #fff;
	}

	.radio-card:hover {
		border-color: var(--primary-light);
	}

	.radio-card.selected {
		border-color: var(--accent);
		background: var(--primary-dim);
	}

	.radio-card input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}

	.title {
		font-size: 15px;
		font-weight: 700;
		color: var(--ink);
	}

	.desc {
		font-size: 13px;
		color: var(--text2);
		line-height: 1.4;
	}
</style>
