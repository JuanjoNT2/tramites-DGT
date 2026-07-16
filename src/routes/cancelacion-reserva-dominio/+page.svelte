<script lang="ts">
	import TramiteLanding from '$lib/components/TramiteLanding.svelte';
</script>

<svelte:head>
	<title>Cancelación Reserva de Dominio | Trámites DGT Online</title>
</svelte:head>

<TramiteLanding
	title="Cancelación de reserva de dominio"
	description="Cancela la reserva de dominio de tu vehículo ante la entidad financiera."
	tramitarPath="/tramitar/cancelacion-reserva"
	steps={[
		'Datos del vehículo y entidad financiera',
		'Datos del titular',
		'Documentación',
		'Tramitación y confirmación'
	]}
/>
