<script lang="ts">
	import TramiteLanding from '$lib/components/TramiteLanding.svelte';
</script>

<svelte:head>
	<title>Duplicado de Carnet | Trámites DGT Online</title>
</svelte:head>

<TramiteLanding
	title="Duplicado de carnet de conducir"
	description="Solicita el duplicado de tu permiso de conducir por pérdida, robo o deterioro."
	tramitarPath="/tramitar/duplicado-carnet"
	steps={[
		'Indica el motivo del duplicado',
		'Introduce tus datos personales',
		'Sube foto de tu DNI',
		'Pago y envío a domicilio'
	]}
/>
