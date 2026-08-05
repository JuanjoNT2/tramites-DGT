<script lang="ts">
	import FormField from '$lib/components/ui/FormField.svelte';
	import NifInput from '$lib/components/ui/NifInput.svelte';
	import type { PartyData } from '$lib/cuenta/party-prefill';
	import { provinces, streetTypes } from '$lib/data/provinces';

	let {
		title,
		party = $bindable(),
		errors = {},
		showAutofill = false,
		onautofill
	}: {
		title: string;
		party: PartyData;
		errors?: Record<string, string | null | undefined>;
		showAutofill?: boolean;
		onautofill?: () => void;
	} = $props();
</script>

<section class="party">
	<div class="party-head">
		<h2>{title}</h2>
		{#if showAutofill && onautofill}
			<button type="button" class="btn ghost autofill" onclick={onautofill}>
				Autocompletar con mis datos
			</button>
		{/if}
	</div>
	<p class="info">
		Los datos deben coincidir con el documento de identidad. El email y teléfono se usan para
		comunicaciones del trámite.
	</p>

	<FormField label="Correo electrónico" error={errors.email} required>
		<input type="email" bind:value={party.email} autocomplete="email" />
	</FormField>
	<FormField
		label="NIF/NIE/CIF"
		error={errors.nif}
		hint="Escribe los dígitos: la letra se calcula sola. Si es NIE sin firma, adjunta pasaporte o permiso de conducir en documentos."
		required
	>
		<NifInput bind:value={party.nif} />
	</FormField>
	<div class="row-2">
		<FormField label="Nombre" error={errors.nombre} required>
			<input bind:value={party.nombre} autocomplete="given-name" />
		</FormField>
		<FormField label="Primer apellido" error={errors.apellido1} required>
			<input bind:value={party.apellido1} autocomplete="family-name" />
		</FormField>
	</div>
	<FormField label="Segundo apellido" error={errors.apellido2} required>
		<input bind:value={party.apellido2} autocomplete="additional-name" />
	</FormField>
	<FormField label="Teléfono" error={errors.telefono} required>
		<input type="tel" bind:value={party.telefono} inputmode="tel" placeholder="612345678" />
	</FormField>

	<h3>Dirección</h3>
	<FormField label="Provincia" error={errors.provincia} required>
		<select bind:value={party.provincia}>
			<option value="">Selecciona provincia</option>
			{#each provinces as p}
				<option value={p}>{p}</option>
			{/each}
		</select>
	</FormField>
	<FormField label="Municipio" error={errors.municipio} required>
		<input bind:value={party.municipio} autocomplete="address-level2" />
	</FormField>
	<div class="row-2">
		<FormField label="Tipo de vía" required>
			<select bind:value={party.tipoVia}>
				{#each streetTypes as t}
					<option value={t}>{t}</option>
				{/each}
			</select>
		</FormField>
		<FormField label="Nombre de la vía" error={errors.direccion} required>
			<input bind:value={party.direccion} autocomplete="address-line1" />
		</FormField>
	</div>
	<div class="row-3">
		<FormField label="Nº" error={errors.numero} required>
			<input bind:value={party.numero} />
		</FormField>
		<FormField label="Piso">
			<input bind:value={party.piso} />
		</FormField>
		<FormField label="Puerta">
			<input bind:value={party.puerta} />
		</FormField>
	</div>
	<FormField label="Código postal" error={errors.cp} required>
		<input bind:value={party.cp} maxlength="5" inputmode="numeric" autocomplete="postal-code" />
	</FormField>
</section>

<style>
	.party-head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		margin-bottom: 8px;
	}
	h2 {
		margin: 0;
		font-size: 1.1rem;
		color: #003050;
	}
	h3 {
		margin: 18px 0 10px;
		font-size: 0.95rem;
		color: #003050;
	}
	.info {
		color: var(--text2, #5a6b7d);
		font-size: 14px;
		margin: 0 0 14px;
		line-height: 1.45;
	}
	.autofill {
		font-size: 0.85rem;
		padding: 8px 12px;
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
