<script lang="ts">
	import TramiteWizard from '$lib/components/TramiteWizard.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { getStaticSeo } from '$lib/seo/site';

	const seo = getStaticSeo('/tramitar/duplicado-carnet')!;

</script>

<SeoHead title={seo.title} description={seo.description} path={seo.path} />

<TramiteWizard
	title="Duplicado de carnet de conducir"
	tipo="duplicado-carnet"
	variant="duplicado"
	steps={['Motivo', 'Solicitante', 'Dirección', 'Resumen']}
/>
