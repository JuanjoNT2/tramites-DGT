<script lang="ts">
	import TramiteWizard from '$lib/components/TramiteWizard.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { getStaticSeo } from '$lib/seo/site';

	const seo = getStaticSeo('/tramitar/etiqueta')!;

</script>

<SeoHead title={seo.title} description={seo.description} path={seo.path} />

<TramiteWizard
	title="Distintivo ambiental"
	tipo="etiqueta"
	variant="etiqueta"
	steps={['Vehículo', 'Solicitante', 'Dirección y documentos', 'Resumen']}
/>
