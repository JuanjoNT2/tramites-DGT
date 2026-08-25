<script lang="ts" module>
	let listboxSeq = 0;
</script>

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
	let activeIndex = $state(-1);
	let listEl: HTMLUListElement | undefined = $state();

	const listboxId = `search-select-${++listboxSeq}`;

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

	const activeOptionId = $derived(
		open && activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined
	);

	$effect(() => {
		void queryNorm;
		void canSearch;
		void ranked.length;
		// Nada preseleccionado: el primer ArrowDown cae en la mejor coincidencia.
		activeIndex = -1;
	});

	function pick(v: string) {
		value = v;
		query = '';
		open = false;
		activeIndex = -1;
		onChange?.(v);
	}

	function uniqueExactMatch(): string | null {
		const q = query.trim().toLowerCase();
		if (!q) return null;
		const matches = options.filter((o) => o.label.toLowerCase() === q);
		return matches.length === 1 ? matches[0].value : null;
	}

	function commitTyped(): boolean {
		const exact = uniqueExactMatch();
		if (exact) {
			pick(exact);
			return true;
		}
		return false;
	}

	function clear() {
		value = '';
		query = '';
		open = true;
		activeIndex = -1;
		onChange?.('');
	}

	function onFocus() {
		if (disabled) return;
		open = true;
		// Empezar búsqueda limpia; la selección sigue visible en el placeholder
		query = '';
	}

	function onBlur() {
		commitTyped();
		setTimeout(() => {
			open = false;
		}, 180);
	}

	function scrollActive() {
		const el = listEl?.querySelector<HTMLElement>('[aria-selected="true"]');
		el?.scrollIntoView({ block: 'nearest' });
	}

	function onKeyDown(e: KeyboardEvent) {
		if (disabled) return;

		if (e.key === 'Escape') {
			e.preventDefault();
			open = false;
			return;
		}

		if (e.key === 'Tab') {
			commitTyped();
			return;
		}

		if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
			e.preventDefault();
			if (!open) open = true;
			if (ranked.length === 0) return;
			if (e.key === 'ArrowDown') {
				activeIndex = activeIndex < 0 ? 0 : Math.min(activeIndex + 1, ranked.length - 1);
			} else {
				activeIndex = activeIndex < 0 ? ranked.length - 1 : Math.max(activeIndex - 1, 0);
			}
			queueMicrotask(scrollActive);
			return;
		}

		if (e.key === 'Enter') {
			if (open && activeIndex >= 0 && ranked[activeIndex]) {
				e.preventDefault();
				pick(ranked[activeIndex].value);
				return;
			}
			if (commitTyped()) {
				e.preventDefault();
				return;
			}
			if (open && ranked.length === 1) {
				e.preventDefault();
				pick(ranked[0].value);
			}
		}
	}
</script>

<div class="search-select" class:disabled>
	<input
		type="text"
		class="input"
		role="combobox"
		placeholder={inputPlaceholder}
		bind:value={query}
		{disabled}
		onfocus={onFocus}
		oninput={() => {
			if (!disabled) open = true;
		}}
		onblur={onBlur}
		onkeydown={onKeyDown}
		autocomplete="off"
		aria-autocomplete="list"
		aria-haspopup="listbox"
		aria-expanded={open && !disabled}
		aria-controls={listboxId}
		aria-activedescendant={activeOptionId}
		spellcheck="false"
	/>
	{#if open && !disabled}
		<ul class="list" role="listbox" id={listboxId} bind:this={listEl}>
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
				{#each ranked as opt, i (opt.value)}
					<li
						role="option"
						id={`${listboxId}-opt-${i}`}
						aria-selected={i === activeIndex}
						class:active={i === activeIndex}
						data-testid="search-select-option"
						onmousedown={(e) => e.preventDefault()}
						onclick={() => pick(opt.value)}
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								pick(opt.value);
							}
						}}
					>
						<span class="label">{opt.label}</span>
						{#if opt.hint}
							<span class="hint">{opt.hint}</span>
						{/if}
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

	.list [role='option'] {
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

	.list [role='option']:hover,
	.list [role='option'].active {
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
