<script lang="ts">
	import TramiteWizard from '$lib/components/TramiteWizard.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { getStaticSeo } from '$lib/seo/site';

	const seo = getStaticSeo('/tramitar/baja-temporal')!;
</script>

<SeoHead title={seo.title} description={seo.description} path={seo.path} />

<TramiteWizard
	title="Baja temporal de vehículo"
	tipo="baja-temporal"
	variant="baja-temporal"
	steps={['Vehículo', 'Solicitante', 'Dirección y documentos', 'Resumen']}
/>
