<script lang="ts">
	import TramiteWizard from '$lib/components/TramiteWizard.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { getStaticSeo } from '$lib/seo/site';

	const seo = getStaticSeo('/tramitar/notificacion-venta')!;
</script>

<SeoHead title={seo.title} description={seo.description} path={seo.path} />

<TramiteWizard
	title="Notificación de venta"
	tipo="notificacion-venta"
	variant="notificacion-venta"
	steps={['Vehículo', 'Solicitante', 'Dirección y documentos', 'Resumen']}
/>
