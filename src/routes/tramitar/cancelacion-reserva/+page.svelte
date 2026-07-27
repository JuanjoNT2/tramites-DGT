<script lang="ts">
	import TramiteWizard from '$lib/components/TramiteWizard.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { getStaticSeo } from '$lib/seo/site';

	const seo = getStaticSeo('/tramitar/cancelacion-reserva')!;

</script>

<SeoHead title={seo.title} description={seo.description} path={seo.path} />

<TramiteWizard
	title="Cancelación reserva de dominio"
	tipo="cancelacion-reserva"
	variant="cancelacion"
	steps={['Vehículo', 'Propietario', 'Documentación', 'Resumen']}
/>
