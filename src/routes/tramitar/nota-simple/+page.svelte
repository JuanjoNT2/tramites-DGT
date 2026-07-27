<script lang="ts">
	import TramiteWizard from '$lib/components/TramiteWizard.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { getStaticSeo } from '$lib/seo/site';

	const seo = getStaticSeo('/tramitar/nota-simple')!;
</script>

<SeoHead title={seo.title} description={seo.description} path={seo.path} />

<TramiteWizard
	title="Nota simple de vehículo"
	tipo="nota-simple"
	variant="nota-simple"
	steps={['Vehículo', 'Solicitante', 'Dirección y documentos', 'Resumen']}
/>
