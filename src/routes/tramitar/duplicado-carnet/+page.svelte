<script lang="ts">
	import TramiteWizard from '$lib/components/TramiteWizard.svelte';
</script>

<TramiteWizard
	title="Duplicado de carnet de conducir"
	tipo="duplicado-carnet"
	variant="duplicado"
	steps={['Motivo', 'Solicitante', 'Dirección', 'Resumen', 'Pago']}
/>
