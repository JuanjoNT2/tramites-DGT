<script lang="ts">
	let {
		options,
		value = $bindable(''),
		placeholder = 'Buscar…',
		disabled = false,
		maxResults = 40,
		minChars = 0,
		emptyText = 'Sin resultados',
		onChange
	}: {
		options: { value: string; label: string; hint?: string }[];
		value?: string;
		placeholder?: string;
		disabled?: boolean;
		maxResults?: number;
		/** Caracteres mínimos antes de mostrar sugerencias (0 = listar al enfocar). */
		minChars?: number;
		emptyText?: string;
		onChange?: (value: string) => void;
	} = $props();

	let query = $state('');
	let open = $state(false);

	const selected = $derived(options.find((o) => o.value === value));
	const selectedLabel = $derived(selected?.label ?? '');

	const queryNorm = $derived(query.trim().toLowerCase());
	const canSearch = $derived(minChars === 0 || queryNorm.length >= minChars);

	function score(label: string, hint: string | undefined, q: string): number {
		const l = label.toLowerCase();
		const h = hint?.toLowerCase() ?? '';
		if (l === q) return 1000;
		if (l.startsWith(q)) return 800 - Math.min(l.length, 100);
		const words = l.split(/[\s/._-]+/);
		if (words.some((w) => w.startsWith(q))) return 600;
		if (l.includes(q)) return 400 - l.indexOf(q);
		if (h.startsWith(q)) return 300;
		if (h.includes(q)) return 200;
		return 0;
	}

	const ranked = $derived.by(() => {
		if (!canSearch) return [] as { value: string; label: string; hint?: string }[];
		const q = queryNorm;
		if (!q) {
			return options.slice(0, maxResults);
		}
		return options
			.map((o) => ({ o, s: score(o.label, o.hint, q) }))
			.filter((x) => x.s > 0)
			.sort((a, b) => b.s - a.s || a.o.label.localeCompare(b.o.label, 'es'))
			.slice(0, maxResults)
			.map((x) => x.o);
	});

	const totalMatches = $derived.by(() => {
		if (!canSearch) return 0;
		const q = queryNorm;
		if (!q) return options.length;
		return options.filter((o) => score(o.label, o.hint, q) > 0).length;
	});

	const inputPlaceholder = $derived(
		selectedLabel
			? selectedLabel
			: minChars > 0
				? `${placeholder} (escribe para buscar)`
				: placeholder
	);

	function pick(v: string) {
		value = v;
		query = '';
		open = false;
		onChange?.(v);
	}

	function clear() {
		value = '';
		query = '';
		open = true;
		onChange?.('');
	}

	function onFocus() {
		if (disabled) return;
		open = true;
		// Empezar búsqueda limpia; la selección sigue visible en el placeholder
		query = '';
	}
</script>

<div class="search-select" class:disabled>
	<input
		type="text"
		class="input"
		placeholder={inputPlaceholder}
		bind:value={query}
		{disabled}
		onfocus={onFocus}
		oninput={() => {
			if (!disabled) open = true;
		}}
		onblur={() => setTimeout(() => (open = false), 180)}
		autocomplete="off"
		aria-autocomplete="list"
		spellcheck="false"
	/>
	{#if open && !disabled}
		<ul class="list" role="listbox">
			{#if !canSearch}
				<li class="empty">
					Escribe al menos {minChars} letra{minChars === 1 ? '' : 's'} para ver sugerencias
					{#if options.length > 0}
						({options.length.toLocaleString('es-ES')} opciones)
					{/if}
				</li>
			{:else if ranked.length === 0}
				<li class="empty">{queryNorm ? emptyText : 'Empieza a escribir para filtrar…'}</li>
			{:else}
				{#each ranked as opt (opt.value)}
					<li>
						<button type="button" onmousedown={(e) => e.preventDefault()} onclick={() => pick(opt.value)}>
							<span class="label">{opt.label}</span>
							{#if opt.hint}
								<span class="hint">{opt.hint}</span>
							{/if}
						</button>
					</li>
				{/each}
				{#if totalMatches > ranked.length}
					<li class="more">
						Mostrando {ranked.length} de {totalMatches.toLocaleString('es-ES')}. Sigue escribiendo para
						afinar.
					</li>
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
		max-height: 280px;
		overflow-y: auto;
		overscroll-behavior: contain;
		list-style: none;
		scrollbar-gutter: stable;
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
		line-height: 1.4;
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
