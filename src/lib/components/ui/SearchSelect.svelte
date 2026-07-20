<script lang="ts">
	let {
		options,
		value = $bindable(''),
		placeholder = 'Buscar…',
		disabled = false,
		maxResults = 40,
		emptyText = 'Sin resultados',
		onChange
	}: {
		options: { value: string; label: string; hint?: string }[];
		value?: string;
		placeholder?: string;
		disabled?: boolean;
		maxResults?: number;
		emptyText?: string;
		onChange?: (value: string) => void;
	} = $props();

	let query = $state('');
	let open = $state(false);

	const selected = $derived(options.find((o) => o.value === value));
	const selectedLabel = $derived(selected?.label ?? '');

	const filtered = $derived.by(() => {
		const q = query.trim().toLowerCase();
		const list = q
			? options.filter(
					(o) =>
						o.label.toLowerCase().includes(q) || (o.hint?.toLowerCase().includes(q) ?? false)
				)
			: options;
		return list.slice(0, maxResults);
	});

	const totalMatches = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return options.length;
		return options.filter(
			(o) => o.label.toLowerCase().includes(q) || (o.hint?.toLowerCase().includes(q) ?? false)
		).length;
	});

	function pick(v: string) {
		value = v;
		query = '';
		open = false;
		onChange?.(v);
	}

	function clear() {
		value = '';
		query = '';
		onChange?.('');
	}
</script>

<div class="search-select" class:disabled>
	<input
		type="text"
		class="input"
		placeholder={selectedLabel || placeholder}
		bind:value={query}
		{disabled}
		onfocus={() => {
			if (!disabled) open = true;
		}}
		onblur={() => setTimeout(() => (open = false), 150)}
		autocomplete="off"
		aria-autocomplete="list"
	/>
	{#if open && !disabled}
		<ul class="list" role="listbox">
			{#if filtered.length === 0}
				<li class="empty">{emptyText}</li>
			{:else}
				{#each filtered as opt (opt.value)}
					<li>
						<button type="button" onclick={() => pick(opt.value)}>
							<span class="label">{opt.label}</span>
							{#if opt.hint}
								<span class="hint">{opt.hint}</span>
							{/if}
						</button>
					</li>
				{/each}
				{#if totalMatches > filtered.length}
					<li class="more">Mostrando {filtered.length} de {totalMatches}. Afina la búsqueda.</li>
				{/if}
			{/if}
		</ul>
	{/if}
	{#if value && !disabled}
		<button type="button" class="clear" onclick={clear} aria-label="Limpiar">×</button>
	{/if}
</div>

<style>
	.search-select {
		position: relative;
	}

	.search-select.disabled {
		opacity: 0.65;
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
		max-height: 320px;
		overflow-y: auto;
		list-style: none;
	}

	.list button {
		width: 100%;
		text-align: left;
		padding: 10px 14px;
		border: none;
		background: none;
		font-size: 14px;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.list button:hover {
		background: var(--primary-dim);
	}

	.label {
		line-height: 1.35;
		color: var(--text);
	}

	.hint {
		font-size: 12px;
		color: var(--text3);
	}

	.empty,
	.more {
		padding: 12px 14px;
		font-size: 13px;
		color: var(--text3);
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
