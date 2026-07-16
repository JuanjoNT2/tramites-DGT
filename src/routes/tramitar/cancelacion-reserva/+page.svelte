<script lang="ts">
	import TramiteWizard from '$lib/components/TramiteWizard.svelte';
</script>

<TramiteWizard
	title="Cancelación reserva de dominio"
	tipo="cancelacion-reserva"
	variant="cancelacion"
	steps={['Vehículo', 'Propietario', 'Carta de pago', 'Documentación', 'Resumen', 'Pago']}
/>
