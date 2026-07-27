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

	function clearFuelAndModel() {
		combustibleId = '';
		combustibleNombre = '';
		fuels = [];
		clearModel();
	}

	function clearModel() {
		modeloId = '';
		modeloNombre = '';
		modeloMeta = null;
		models = [];
	}

	async function onMarcaChange(id: string) {
		syncBrandName(id);
		clearFuelAndModel();
		loadError = null;
		if (!id) return;

		loadingFuels = true;
		try {
			const res = await fetch(`/api/vehicles/fuels?marcaId=${encodeURIComponent(id)}`);
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data?.message ?? 'No se pudieron cargar combustibles');
			fuels = data.fuels ?? [];
		} catch (e) {
			fuels = [];
			loadError = e instanceof Error ? e.message : 'Error al cargar combustibles';
		} finally {
			loadingFuels = false;
		}
	}

	async function onCombustibleChange(id: string) {
		combustibleNombre = fuels.find((f) => f.id === id)?.name ?? '';
		clearModel();
		loadError = null;
		if (!marcaId || !id) return;

		loadingModels = true;
		try {
			const res = await fetch(
				`/api/vehicles/models?marcaId=${encodeURIComponent(marcaId)}&combustibleId=${encodeURIComponent(id)}`
			);
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data?.message ?? 'No se pudieron cargar modelos');
			models = data.models ?? [];
		} catch (e) {
			models = [];
			loadError = e instanceof Error ? e.message : 'Error al cargar modelos';
		} finally {
			loadingModels = false;
		}
	}

	function onModeloChange(id: string) {
		const model = models.find((m) => m.id === id) ?? null;
		modeloMeta = model;
		modeloNombre = model?.label ?? '';
	}
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
