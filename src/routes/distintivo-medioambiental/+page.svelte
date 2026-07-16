<script lang="ts">
	import TramiteLanding from '$lib/components/TramiteLanding.svelte';
</script>

<svelte:head>
	<title>Etiqueta Medioambiental | Trámites DGT Online</title>
</svelte:head>

<TramiteLanding
	title="Etiqueta medioambiental DGT"
	description="Consigue la etiqueta medioambiental oficial para tu vehículo. 100% online, envío a domicilio."
	tramitarPath="/tramitar/etiqueta"
	steps={[
		'Introduce la matrícula de tu vehículo',
		'Confirma tus datos de contacto',
		'Realiza el pago seguro',
		'Recibe la etiqueta en tu domicilio'
	]}
/>
