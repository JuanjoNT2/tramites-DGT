<script lang="ts">
	import FormField from '$lib/components/ui/FormField.svelte';
	import SearchSelect from '$lib/components/ui/SearchSelect.svelte';
	import brandsData from '$lib/data/vehicle-brands.json';

	export type ModeloMeta = {
		id: string;
		label: string;
		cilindrada: string;
		cilindros: string;
		combustible: string;
		potenciaKw: string;
		potenciaCv: string;
		potenciaCvf: string;
		precioBase: string;
		categoria: string;
	};

	let {
		marcaId = $bindable(''),
		marcaNombre = $bindable(''),
		combustibleId = $bindable(''),
		combustibleNombre = $bindable(''),
		modeloId = $bindable(''),
		modeloNombre = $bindable(''),
		modeloMeta = $bindable<ModeloMeta | null>(null),
		errors = {}
	}: {
		marcaId?: string;
		marcaNombre?: string;
		combustibleId?: string;
		combustibleNombre?: string;
		modeloId?: string;
		modeloNombre?: string;
		modeloMeta?: ModeloMeta | null;
		errors?: {
			marca?: string | null;
			combustible?: string | null;
			modelo?: string | null;
		};
	} = $props();

	const brandOptions = brandsData.map((b) => ({ value: b.id, label: b.name }));

	let fuels = $state<{ id: string; name: string }[]>([]);
	let models = $state<ModeloMeta[]>([]);
	let loadingFuels = $state(false);
	let loadingModels = $state(false);
	let loadError = $state<string | null>(null);

	const modelOptions = $derived(
		models.map((m) => ({
			value: m.id,
			label: m.label,
			hint: [
				m.cilindrada ? `${m.cilindrada} cc` : '',
				m.potenciaCv ? `${m.potenciaCv} CV` : '',
				m.categoria
			]
				.filter(Boolean)
				.join(' · ')
		}))
	);

	function syncBrandName(id: string) {
		marcaNombre = brandsData.find((b) => b.id === id)?.name ?? '';
	}

	/** Cambio manual de marca: limpia dependientes; las listas las hidrata el $effect. */
	function onMarcaChange(id: string) {
		syncBrandName(id);
		combustibleId = '';
		combustibleNombre = '';
		modeloId = '';
		modeloNombre = '';
		modeloMeta = null;
		loadError = null;
	}

	/** Cambio manual de combustible: limpia modelo; la lista la hidrata el $effect. */
	function onCombustibleChange(id: string) {
		combustibleNombre = fuels.find((f) => f.id === id)?.name ?? combustibleNombre;
		modeloId = '';
		modeloNombre = '';
		modeloMeta = null;
		loadError = null;
	}

	function onModeloChange(id: string) {
		const model = models.find((m) => m.id === id) ?? null;
		modeloMeta = model;
		modeloNombre = model?.label ?? '';
	}

	// Hidrata combustibles al tener marca (incluye restauración de borrador).
	$effect(() => {
		const id = marcaId;
		syncBrandName(id);
		if (!id) {
			fuels = [];
			loadingFuels = false;
			return;
		}

		let cancelled = false;
		loadingFuels = true;
		loadError = null;

		fetch(`/api/vehicles/fuels?marcaId=${encodeURIComponent(id)}`)
			.then(async (res) => {
				const data = await res.json().catch(() => ({}));
				if (!res.ok) throw new Error(data?.message ?? 'No se pudieron cargar combustibles');
				if (!cancelled) fuels = data.fuels ?? [];
			})
			.catch((e) => {
				if (cancelled) return;
				fuels = [];
				loadError = e instanceof Error ? e.message : 'Error al cargar combustibles';
			})
			.finally(() => {
				if (!cancelled) loadingFuels = false;
			});

		return () => {
			cancelled = true;
		};
	});

	// Hidrata modelos al tener marca + combustible (incluye borrador).
	$effect(() => {
		const mid = marcaId;
		const cid = combustibleId;
		if (!mid || !cid) {
			models = [];
			loadingModels = false;
			return;
		}

		let cancelled = false;
		loadingModels = true;
		loadError = null;

		fetch(
			`/api/vehicles/models?marcaId=${encodeURIComponent(mid)}&combustibleId=${encodeURIComponent(cid)}`
		)
			.then(async (res) => {
				const data = await res.json().catch(() => ({}));
				if (!res.ok) throw new Error(data?.message ?? 'No se pudieron cargar modelos');
				if (!cancelled) models = data.models ?? [];
			})
			.catch((e) => {
				if (cancelled) return;
				models = [];
				loadError = e instanceof Error ? e.message : 'Error al cargar modelos';
			})
			.finally(() => {
				if (!cancelled) loadingModels = false;
			});

		return () => {
			cancelled = true;
		};
	});

	// Sincroniza nombres/meta cuando llegan las listas tras un borrador.
	$effect(() => {
		if (!combustibleId || !fuels.length) return;
		const name = fuels.find((f) => f.id === combustibleId)?.name;
		if (name) combustibleNombre = name;
	});

	$effect(() => {
		if (!modeloId || !models.length) return;
		const model = models.find((m) => m.id === modeloId) ?? null;
		if (model) {
			modeloMeta = model;
			modeloNombre = model.label;
		}
	});
</script>

<FormField
	label="Marca"
	error={errors.marca}
	hint="Catálogo Hacienda (mismas tablas que tramitesdgtonline.com)"
	required
>
	<SearchSelect
		options={brandOptions}
		bind:value={marcaId}
		placeholder="Buscar o elegir marca…"
		maxResults={50}
		minChars={0}
		onChange={onMarcaChange}
	/>
</FormField>

<FormField
	label="Combustible"
	error={errors.combustible}
	hint={loadingFuels ? 'Cargando combustibles…' : undefined}
	required
>
	<select
		bind:value={combustibleId}
		disabled={!marcaId || loadingFuels}
		onchange={() => onCombustibleChange(combustibleId)}
	>
		<option value="">
			{marcaId ? 'Seleccione tipo de combustible' : 'Primero elige marca'}
		</option>
		{#each fuels as f (f.id)}
			<option value={f.id}>{f.name}</option>
		{/each}
	</select>
</FormField>

<FormField
	label="Modelo / versión"
	error={errors.modelo}
	hint={loadingModels
		? 'Cargando todas las versiones…'
		: models.length
			? `${models.length} versiones. Busca por cilindrada, CV o acabado.`
			: 'Elige marca y combustible para ver todas las versiones'}
	required
>
	<SearchSelect
		options={modelOptions}
		bind:value={modeloId}
		placeholder={combustibleId ? 'Buscar modelo o versión…' : 'Primero elige combustible'}
		disabled={!combustibleId || loadingModels}
		maxResults={40}
		minChars={0}
		emptyText="Sin coincidencias. Prueba otra búsqueda."
		onChange={onModeloChange}
	/>
</FormField>

{#if modeloMeta}
	<div class="meta" aria-live="polite">
		<p><strong>{marcaNombre}</strong> · {modeloMeta.label}</p>
		<ul>
			{#if modeloMeta.categoria}<li>Categoría: {modeloMeta.categoria}</li>{/if}
			{#if modeloMeta.cilindrada}<li>Cilindrada: {modeloMeta.cilindrada} cc</li>{/if}
			{#if modeloMeta.potenciaCv}
				<li>Potencia: {modeloMeta.potenciaCv} CV ({modeloMeta.potenciaKw} kW)</li>
			{/if}
			{#if modeloMeta.potenciaCvf}<li>Potencia fiscal: {modeloMeta.potenciaCvf} CVF</li>{/if}
			{#if modeloMeta.combustible}<li>Combustible: {modeloMeta.combustible}</li>{/if}
		</ul>
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
		margin: 0 0 8px;
	}

	.meta ul {
		margin: 0;
		padding-left: 18px;
		color: var(--text2);
		display: grid;
		gap: 2px;
	}

	.err {
		color: #b91c1c;
		font-size: 14px;
		margin: 0 0 12px;
	}
</style>
