<script lang="ts">
	import TramiteWizard from '$lib/components/TramiteWizard.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { getStaticSeo } from '$lib/seo/site';

	const seo = getStaticSeo('/tramitar/duplicado-carnet')!;

</script>

<SeoHead title={seo.title} description={seo.description} path={seo.path} />

<TramiteWizard
	title="Duplicado permiso de circulación"
	tipo="duplicado-carnet"
	variant="duplicado"
	steps={['Vehículo y motivo', 'Solicitante', 'Dirección y documentos', 'Resumen']}
/>
