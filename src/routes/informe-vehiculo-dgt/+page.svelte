<script lang="ts">
	import TramiteLanding from '$lib/components/TramiteLanding.svelte';
</script>

<svelte:head>
	<title>Informe de Vehículo DGT | Trámites DGT Online</title>
</svelte:head>

<TramiteLanding
	title="Informe de vehículo DGT"
	description="Solicita el informe de tráfico emitido por la DGT. Conoce cargas, reservas de dominio e historial."
	tramitarPath="/tramitar/informe-dgt"
	steps={[
		'Introduce matrícula o bastidor',
		'Confirma datos del solicitante',
		'Pago online',
		'Recibe el informe por email'
	]}
/>
