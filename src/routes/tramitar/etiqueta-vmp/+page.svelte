<script lang="ts">
	import TramiteWizard from '$lib/components/TramiteWizard.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { getStaticSeo } from '$lib/seo/site';

	const seo = getStaticSeo('/tramitar/etiqueta-vmp')!;
</script>

<SeoHead title={seo.title} description={seo.description} path={seo.path} />

<TramiteWizard
	title="Etiqueta VMP (patinete)"
	tipo="etiqueta-vmp"
	variant="etiqueta-vmp"
	steps={['Vehículo VMP', 'Solicitante', 'Dirección y envío', 'Resumen']}
/>
