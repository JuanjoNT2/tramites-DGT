<script lang="ts">
	import TramiteWizard from '$lib/components/TramiteWizard.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { getStaticSeo } from '$lib/seo/site';

	const seo = getStaticSeo('/tramitar/informe-dgt')!;

</script>

<SeoHead title={seo.title} description={seo.description} path={seo.path} />

<TramiteWizard
	title="Informe de vehículo DGT"
	tipo="informe-dgt"
	variant="informe"
	steps={['Vehículo', 'Solicitante', 'Dirección y documentos', 'Resumen']}
/>
