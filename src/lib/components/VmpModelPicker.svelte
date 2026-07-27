<script lang="ts">
	import FormField from '$lib/components/ui/FormField.svelte';
	import SearchSelect from '$lib/components/ui/SearchSelect.svelte';
	import catalog from '$lib/data/vmp-certificados.json';

	let {
		marcaId = $bindable(''),
		marcaNombre = $bindable(''),
		modeloId = $bindable(''),
		modeloNombre = $bindable(''),
		numCertificado = $bindable(''),
		errors = {}
	}: {
		marcaId?: string;
		marcaNombre?: string;
		modeloId?: string;
		modeloNombre?: string;
		numCertificado?: string;
		errors?: {
			marca?: string | null;
			modelo?: string | null;
			certificado?: string | null;
		};
	} = $props();

	const brandOptions = catalog.brands.map((b) => ({ value: b.id, label: b.name }));

	const modelOptions = $derived.by(() => {
		const brand = catalog.brands.find((b) => b.id === marcaId);
		if (!brand) return [];
		return brand.models.map((m) => ({
			value: m.id,
			label: m.label,
			hint: m.certificado
		}));
	});

	function onMarcaChange(id: string) {
		marcaNombre = catalog.brands.find((b) => b.id === id)?.name ?? '';
		modeloId = '';
		modeloNombre = '';
		numCertificado = '';
	}

	function onModeloChange(id: string) {
		const brand = catalog.brands.find((b) => b.id === marcaId);
		const model = brand?.models.find((m) => m.id === id);
		modeloNombre = model?.label ?? '';
		if (model?.certificado) numCertificado = model.certificado;
	}
</script>

<p class="hint-cat">
	Marcas y modelos del
	<a href={catalog.source} target="_blank" rel="noopener noreferrer">listado oficial DGT</a>
	de VMP certificados. Al elegir el modelo se rellena el nº de certificado (puedes corregirlo si
	figura otro en la chapa).
</p>

<FormField label="Marca" error={errors.marca} required>
	<SearchSelect
		options={brandOptions}
		bind:value={marcaId}
		placeholder="Buscar marca…"
		onChange={onMarcaChange}
	/>
</FormField>

<FormField label="Modelo / versión" error={errors.modelo} required>
	<SearchSelect
		options={modelOptions}
		bind:value={modeloId}
		placeholder={marcaId ? 'Buscar modelo…' : 'Elige primero la marca'}
		disabled={!marcaId}
		onChange={onModeloChange}
	/>
</FormField>

<FormField
	label="Número de certificado VMP"
	error={errors.certificado}
	hint="Figura en la placa de marcaje / ficha técnica (ej. A1158)."
	required
>
	<input bind:value={numCertificado} placeholder="A1158" />
</FormField>

<style>
	.hint-cat {
		font-size: 13px;
		color: var(--text2, #5a6b7d);
		line-height: 1.45;
		margin: 0 0 16px;
	}
	.hint-cat a {
		color: var(--brand-navy, #003050);
		font-weight: 700;
		text-decoration: underline;
	}
</style>
