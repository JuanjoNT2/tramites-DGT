<script lang="ts">
	let {
		options,
		value = $bindable(''),
		placeholder = 'Buscar…'
	}: {
		options: { value: string; label: string }[];
		value?: string;
		placeholder?: string;
	} = $props();

	let query = $state('');
	let open = $state(false);

	const filtered = $derived(
		options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())).slice(0, 12)
	);

	const selectedLabel = $derived(options.find((o) => o.value === value)?.label ?? '');

	function pick(v: string) {
		value = v;
		query = '';
		open = false;
	}
</script>

<div class="search-select">
	<input
		type="text"
		class="input"
		placeholder={selectedLabel || placeholder}
		bind:value={query}
		onfocus={() => (open = true)}
		onblur={() => setTimeout(() => (open = false), 150)}
		autocomplete="off"
	/>
	{#if open && filtered.length > 0}
		<ul class="list" role="listbox">
			{#each filtered as opt (opt.value)}
				<li>
					<button type="button" onclick={() => pick(opt.value)}>{opt.label}</button>
				</li>
			{/each}
		</ul>
	{/if}
	{#if value}
		<button type="button" class="clear" onclick={() => (value = '')} aria-label="Limpiar">×</button>
	{/if}
</div>

<style>
	.search-select {
		position: relative;
	}

	.input {
		width: 100%;
		height: 48px;
		padding: 0 36px 0 14px;
		border: 1.5px solid var(--border);
		border-radius: var(--radius);
		font-size: 16px;
		background: #fff;
	}

	.input:focus {
		outline: none;
		border-color: var(--border-focus);
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
	}

	.list {
		position: absolute;
		z-index: 20;
		top: calc(100% + 4px);
		left: 0;
		right: 0;
		background: #fff;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		box-shadow: var(--shadow-lg);
		max-height: 240px;
		overflow-y: auto;
		list-style: none;
	}

	.list button {
		width: 100%;
		text-align: left;
		padding: 12px 14px;
		border: none;
		background: none;
		font-size: 15px;
		cursor: pointer;
	}

	.list button:hover {
		background: var(--primary-dim);
	}

	.clear {
		position: absolute;
		right: 10px;
		top: 50%;
		transform: translateY(-50%);
		border: none;
		background: none;
		font-size: 20px;
		color: var(--text3);
		cursor: pointer;
		line-height: 1;
	}
</style>
