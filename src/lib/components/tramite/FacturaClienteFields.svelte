<script lang="ts">
	import FormField from '$lib/components/ui/FormField.svelte';
	import NifInput from '$lib/components/ui/NifInput.svelte';
	import RadioCards from '$lib/components/ui/RadioCards.svelte';
	import { provinces, streetTypes } from '$lib/data/provinces';
	import {
		prefillFacturaFromSource,
		type FacturaClienteData,
		type FacturaClienteSource
	} from '$lib/tramite/factura-cliente';

	let {
		factura = $bindable(),
		source,
		errors = {}
	}: {
		factura: FacturaClienteData;
		source: FacturaClienteSource;
		errors?: Record<string, string | null | undefined>;
	} = $props();

	$effect(() => {
		if (factura.tipoCliente === 'particular' && factura.solicitarFactura !== 'no') {
			factura = { ...factura, solicitarFactura: 'no' };
		}
	});

	$effect(() => {
		if (factura.tipoCliente !== 'profesional' || factura.solicitarFactura !== 'si') return;
		const filled = prefillFacturaFromSource(factura, source);
		if (
			filled.razonSocial === factura.razonSocial &&
			filled.nif === factura.nif &&
			filled.email === factura.email &&
			filled.direccion === factura.direccion &&
			filled.cp === factura.cp
		) {
			return;
		}
		factura = filled;
	});
</script>

<section class="factura">
	<h2>Factura</h2>
	<p class="info">
		Si eres autónomo, SL u otra empresa puedes pedir factura de este trámite a tu nombre.
	</p>

	<FormField label="¿Cómo actúas en este trámite?" error={errors.tipoCliente} required>
		<RadioCards
			name="tipoCliente"
			bind:value={factura.tipoCliente}
			options={[
				{
					value: 'particular',
					label: 'Particular',
					desc: 'Persona física, sin actividad. No se emite factura.'
				},
				{
					value: 'profesional',
					label: 'Profesional / empresa',
					desc: 'Autónomo, SL u otra empresa. Puedes pedir factura a tu nombre.'
				}
			]}
		/>
	</FormField>

	{#if factura.tipoCliente === 'profesional'}
		<FormField label="¿Necesitas factura de este trámite?" error={errors.solicitarFactura} required>
			<RadioCards
				name="solicitarFactura"
				bind:value={factura.solicitarFactura}
				options={[
					{ value: 'si', label: 'Sí, quiero factura' },
					{ value: 'no', label: 'No, no la necesito' }
				]}
			/>
		</FormField>
	{/if}

	{#if factura.tipoCliente === 'profesional' && factura.solicitarFactura === 'si'}
		<p class="info">
			La emitiremos a estos datos tras el pago. Revísalos si la facturación no coincide con el
			titular del trámite.
		</p>
		<FormField label="Razón social / nombre fiscal" error={errors.facturaRazonSocial} required>
			<input bind:value={factura.razonSocial} autocomplete="organization" />
		</FormField>
		<FormField
			label="NIF / CIF"
			error={errors.facturaNif}
			hint="Escribe los dígitos: la letra se calcula sola"
			required
		>
			<NifInput bind:value={factura.nif} />
		</FormField>
		<FormField label="Email de factura" error={errors.facturaEmail} required>
			<input type="email" bind:value={factura.email} autocomplete="email" />
		</FormField>
		<div class="row-2">
			<FormField label="Tipo de vía" required>
				<select bind:value={factura.tipoVia}>
					{#each streetTypes as t}
						<option value={t}>{t}</option>
					{/each}
				</select>
			</FormField>
			<FormField label="Nombre de la vía" error={errors.facturaDireccion} required>
				<input bind:value={factura.direccion} autocomplete="address-line1" />
			</FormField>
		</div>
		<div class="row-3">
			<FormField label="Nº" error={errors.facturaNumeroVia} required>
				<input bind:value={factura.numeroVia} />
			</FormField>
			<FormField label="Piso">
				<input bind:value={factura.piso} />
			</FormField>
			<FormField label="Puerta">
				<input bind:value={factura.puerta} />
			</FormField>
		</div>
		<FormField label="Código postal" error={errors.facturaCp} required>
			<input bind:value={factura.cp} maxlength="5" inputmode="numeric" autocomplete="postal-code" />
		</FormField>
		<div class="row-2">
			<FormField label="Municipio" error={errors.facturaMunicipio} required>
				<input bind:value={factura.municipio} autocomplete="address-level2" />
			</FormField>
			<FormField label="Provincia" error={errors.facturaProvincia} required>
				<select bind:value={factura.provincia}>
					<option value="">Selecciona provincia</option>
					{#each provinces as p}
						<option value={p}>{p}</option>
					{/each}
				</select>
			</FormField>
		</div>
	{/if}
</section>

<style>
	.factura {
		margin: 24px 0 8px;
		padding-top: 8px;
		border-top: 1px solid var(--border, #e4ebf1);
	}
	h2 {
		margin: 0 0 8px;
		font-size: 1.1rem;
		color: #003050;
	}
	.info {
		color: var(--text2, #5a6b7d);
		font-size: 14px;
		margin: 0 0 14px;
		line-height: 1.45;
	}
	.row-2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
	}
	.row-3 {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 16px;
	}
	@media (max-width: 720px) {
		.row-2,
		.row-3 {
			grid-template-columns: 1fr;
		}
	}
</style>
