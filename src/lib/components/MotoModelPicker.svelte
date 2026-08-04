<script lang="ts">
	import FormField from '$lib/components/ui/FormField.svelte';
	import SearchSelect from '$lib/components/ui/SearchSelect.svelte';
	import brandsData from '$lib/data/vehicle-moto-brands.json';

	let {
		marcaId = $bindable(''),
		marcaNombre = $bindable(''),
		modeloId = $bindable(''),
		modeloNombre = $bindable(''),
		cilindrada = $bindable(''),
		errors = {}
	}: {
		marcaId?: string;
		marcaNombre?: string;
		modeloId?: string;
		modeloNombre?: string;
		cilindrada?: string;
		errors?: {
			marca?: string | null;
			modelo?: string | null;
			cilindrada?: string | null;
		};
	} = $props();

	const brandOptions = brandsData.map((b) => ({ value: b.id, label: b.name }));

	let models = $state<{ id: string; label: string }[]>([]);
	let allowCustom = $state(false);
	let useCustom = $state(false);
	let loadingModels = $state(false);
	let loadError = $state<string | null>(null);
	let customModelo = $state('');

	const modelOptions = $derived(models.map((m) => ({ value: m.id, label: m.label })));
	const showCustom = $derived(allowCustom || useCustom);

	function syncBrandName(id: string) {
		marcaNombre = brandsData.find((b) => b.id === id)?.name ?? '';
	}

	function onMarcaChange(id: string) {
		syncBrandName(id);
		modeloId = '';
		modeloNombre = '';
		customModelo = '';
		loadError = null;
		allowCustom = false;
		useCustom = false;
	}

	function onModeloChange(id: string) {
		customModelo = '';
		modeloNombre = models.find((m) => m.id === id)?.label ?? '';
	}

	// Hidrata modelos al tener marca (incluye restauración de borrador).
	$effect(() => {
		const id = marcaId;
		syncBrandName(id);
		if (!id) {
			models = [];
			allowCustom = false;
			loadingModels = false;
			return;
		}

		let cancelled = false;
		loadingModels = true;
		loadError = null;

		fetch(`/api/vehicles/moto/models?marcaId=${encodeURIComponent(id)}`)
			.then(async (res) => {
				const data = await res.json().catch(() => ({}));
				if (!res.ok) throw new Error(data?.message ?? 'No se pudieron cargar modelos');
				if (cancelled) return;
				models = data.models ?? [];
				allowCustom = Boolean(data.allowCustom) || models.length === 0;
			})
			.catch((e) => {
				if (cancelled) return;
				models = [];
				allowCustom = true;
				loadError = e instanceof Error ? e.message : 'Error al cargar modelos';
			})
			.finally(() => {
				if (!cancelled) loadingModels = false;
			});

		return () => {
			cancelled = true;
		};
	});

	$effect(() => {
		if (!modeloId || !models.length) return;
		const label = models.find((m) => m.id === modeloId)?.label;
		if (label) modeloNombre = label;
	});

	function onCustomModeloInput() {
		modeloId = '';
		modeloNombre = customModelo.trim();
	}
</script>

<FormField
	label="Marca"
	error={errors.marca}
	hint="Catálogo público de motos (NHTSA) + marcas del mercado español"
	required
>
	<SearchSelect
		options={brandOptions}
		bind:value={marcaId}
		placeholder="Buscar marca…"
		maxResults={40}
		minChars={2}
		onChange={onMarcaChange}
	/>
</FormField>

{#if showCustom && !loadingModels}
	<FormField
		label="Modelo"
		error={errors.modelo}
		hint={allowCustom
			? 'Escribe el modelo exacto (esta marca no tiene listado completo)'
			: 'Escribe el modelo exacto'}
		required
	>
		<input
			bind:value={customModelo}
			oninput={onCustomModeloInput}
			placeholder="Ej: Ninja 650, MT-07, Liberty 125…"
			autocomplete="off"
		/>
	</FormField>
	{#if !allowCustom && models.length > 0}
		<button type="button" class="linkish" onclick={() => (useCustom = false)}>
			Volver al listado ({models.length} modelos)
		</button>
	{/if}
{:else}
	<FormField
		label="Modelo"
		error={errors.modelo}
		hint={loadingModels
			? 'Cargando modelos…'
			: models.length
				? `${models.length} modelos. Busca el exacto.`
				: 'Elige una marca para ver los modelos'}
		required
	>
		<SearchSelect
			options={modelOptions}
			bind:value={modeloId}
			placeholder={marcaId ? 'Buscar modelo…' : 'Primero elige marca'}
			disabled={!marcaId || loadingModels}
			maxResults={40}
			minChars={1}
			emptyText="Sin coincidencias. Prueba otra búsqueda."
			onChange={onModeloChange}
		/>
	</FormField>
	{#if models.length > 0}
		<button type="button" class="linkish" onclick={() => (useCustom = true)}>
			¿No encuentras tu modelo? Escríbelo
		</button>
	{/if}
{/if}

<FormField
	label="Cilindrada (cc)"
	error={errors.cilindrada}
	hint="Obligatoria para valoración Hacienda (tablas por tramo de cc)"
	required
>
	<input
		type="text"
		inputmode="numeric"
		pattern="[0-9]*"
		bind:value={cilindrada}
		placeholder="Ej: 650"
		autocomplete="off"
	/>
</FormField>

{#if marcaNombre && modeloNombre}
	<div class="meta" aria-live="polite">
		<p><strong>{marcaNombre}</strong> · {modeloNombre}{#if cilindrada} · {cilindrada} cc{/if}</p>
	</div>
{/if}

{#if loadError}
	<p class="err">{loadError}</p>
{/if}

<style>
	.meta {
		margin: 8px 0 16px;
		padding: 14px 16px;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: #f8fafc;
		font-size: 14px;
	}

	.meta p {
		margin: 0;
	}

	.err {
		color: #b91c1c;
		font-size: 14px;
		margin: 0 0 12px;
	}

	.linkish {
		display: inline-block;
		margin: -4px 0 16px;
		border: none;
		background: none;
		padding: 0;
		color: var(--primary);
		font-size: 13px;
		cursor: pointer;
		text-decoration: underline;
	}
</style>
