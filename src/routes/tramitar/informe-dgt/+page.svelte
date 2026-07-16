<script lang="ts">
	import TramiteWizard from '$lib/components/TramiteWizard.svelte';
</script>

<TramiteWizard
	title="Informe de vehículo DGT"
	tipo="informe-dgt"
	variant="informe"
	steps={['Vehículo', 'Solicitante', 'Dirección', 'Resumen', 'Pago']}
/>
