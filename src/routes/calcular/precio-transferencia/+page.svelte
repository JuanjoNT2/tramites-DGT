<script lang="ts">
	import StepProgress from '$lib/components/ui/StepProgress.svelte';
	import FormField from '$lib/components/ui/FormField.svelte';
	import RadioCards from '$lib/components/ui/RadioCards.svelte';
	import SearchSelect from '$lib/components/ui/SearchSelect.svelte';
	import PriceSidebar from '$lib/components/ui/PriceSidebar.svelte';
	import { vehicleBrands, ccaaList, combustibles } from '$lib/data/vehicles';
	import { calculateTransferPrice } from '$lib/utils/pricing';

	const steps = ['Tipo de vehículo', 'Datos del vehículo', 'Operación', 'Resultado'];
	let step = $state(1);

	let tipoVehiculo = $state<'coche' | 'moto'>('coche');
	let marca = $state('');
	let modelo = $state('');
	let combustible = $state('');
	let fechaMatricula = $state('');
	let ccaaId = $state('');
	let precioVenta = $state(8000);
	let fechaVenta = $state('');
	let facturaEmpresa = $state('no');
	let incluirInforme = $state('si');

	const brandOptions = $derived(vehicleBrands.map((b) => ({ value: b.id, label: b.name })));
	const modelOptions = $derived(
		(vehicleBrands.find((b) => b.id === marca)?.models ?? []).map((m) => ({
			value: m,
			label: m
		}))
	);
	const ccaaOptions = ccaaList.map((c) => ({ value: c.id, label: c.name }));

	const breakdown = $derived(
		ccaaId && precioVenta > 0
			? calculateTransferPrice({
					precioVenta,
					ccaaId,
					tipoVehiculo,
					incluirInforme: incluirInforme === 'si'
				})
			: null
	);

	function next() {
		if (step < 4) step++;
	}
	function prev() {
		if (step > 1) step--;
	}
</script>

<svelte:head>
	<title>Calcular precio de transferencia | Trámites DGT Online</title>
</svelte:head>

<section class="section">
	<div class="wrap layout">
		<div class="main card pad">
			<StepProgress current={step} total={4} labels={steps} />
			<h1>Calcula el precio de una transferencia</h1>

			{#if step === 1}
				<FormField label="¿Qué tipo de vehículo es?" required>
					<RadioCards
						name="tipo"
						bind:value={tipoVehiculo}
						options={[
							{ value: 'coche', label: 'Coche', desc: 'Turismo, SUV, furgoneta…' },
							{ value: 'moto', label: 'Moto / sin carnet', desc: 'Motocicleta o ciclomotor' }
						]}
					/>
				</FormField>
			{:else if step === 2}
				<FormField label="Marca" required>
					<SearchSelect options={brandOptions} bind:value={marca} placeholder="Buscar marca…" />
				</FormField>
				<FormField label="Modelo" required>
					<SearchSelect
						options={modelOptions}
						bind:value={modelo}
						placeholder={marca ? 'Buscar modelo…' : 'Primero elige marca'}
					/>
				</FormField>
				<FormField label="Combustible" required>
					<select bind:value={combustible}>
						<option value="">Selecciona…</option>
						{#each combustibles as c}
							<option value={c}>{c}</option>
						{/each}
					</select>
				</FormField>
				<FormField label="Fecha primera matrícula" hint="Formato: dd/mm/aaaa" required>
					<input type="text" bind:value={fechaMatricula} placeholder="15/03/2018" />
				</FormField>
			{:else if step === 3}
				<FormField label="Comunidad Autónoma del comprador" required>
					<SearchSelect options={ccaaOptions} bind:value={ccaaId} placeholder="Buscar CCAA…" />
				</FormField>
				<FormField label="Precio de compraventa (€)" required>
					<input type="number" bind:value={precioVenta} min="0" step="100" />
				</FormField>
				<FormField label="Fecha de venta" required>
					<input type="date" bind:value={fechaVenta} />
				</FormField>
				<FormField label="¿Vendedor empresa/autónomo con factura?">
					<RadioCards
						name="factura"
						bind:value={facturaEmpresa}
						options={[
							{ value: 'si', label: 'Sí' },
							{ value: 'no', label: 'No' }
						]}
					/>
				</FormField>
				<FormField label="¿Incluir informe DGT del vehículo?">
					<RadioCards
						name="informe"
						bind:value={incluirInforme}
						options={[
							{ value: 'si', label: 'Sí, quiero informe' },
							{ value: 'no', label: 'No necesito informe' }
						]}
					/>
				</FormField>
			{:else}
				<div class="result">
					<p class="big">{breakdown ? `${breakdown.total.toLocaleString('es-ES')} €` : '—'}</p>
					<p class="sub">Presupuesto estimado de transferencia</p>
					<a class="btn big" href="/tramitar/transferencia">Tramitar ahora</a>
					<button type="button" class="btn ghost big" onclick={() => (step = 1)}>Nuevo cálculo</button>
				</div>
			{/if}

			{#if step < 4}
				<div class="nav-btns">
					{#if step > 1}<button type="button" class="btn ghost" onclick={prev}>Anterior</button>{/if}
					<button type="button" class="btn" onclick={next}>
						{step === 3 ? 'Ver resultado' : 'Siguiente'}
					</button>
				</div>
			{/if}
		</div>
		<PriceSidebar {breakdown} />
	</div>
</section>

<style>
	.layout {
		display: grid;
		grid-template-columns: 1fr 320px;
		gap: 24px;
		align-items: start;
	}

	.pad {
		padding: 32px;
	}

	h1 {
		font-size: 26px;
		font-weight: 800;
		margin-bottom: 28px;
		letter-spacing: -0.02em;
	}

	.nav-btns {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		margin-top: 32px;
		padding-top: 24px;
		border-top: 1px solid var(--border);
	}

	.result {
		text-align: center;
		padding: 24px 0;
	}

	.big {
		font-size: 48px;
		font-weight: 800;
		color: var(--primary);
	}

	.sub {
		color: var(--text2);
		margin: 8px 0 24px;
	}

	.result .btn {
		margin: 6px;
	}

	@media (max-width: 900px) {
		.layout {
			grid-template-columns: 1fr;
		}
	}
</style>
