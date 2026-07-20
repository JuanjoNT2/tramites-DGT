<script lang="ts">
	import TramiteLanding from '$lib/components/TramiteLanding.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { getStaticSeo, serviceJsonLd } from '$lib/seo/site';

	const seo = getStaticSeo('/distintivo-medioambiental')!;
</script>

<SeoHead
	title={seo.title}
	description={seo.description}
	path={seo.path}
	image="/images/services/etiqueta.webp"
	jsonLd={serviceJsonLd({
		name: 'Etiqueta Medioambiental',
		description: seo.description,
		path: seo.path
	})}
/>

<TramiteLanding
	tramite="etiqueta"
	title="Etiqueta medioambiental DGT"
	description="Consigue la etiqueta medioambiental oficial para tu vehículo. 100% online, envío a domicilio."
	tramitarPath="/tramitar/etiqueta"
	steps={[
		'Introduce la matrícula de tu vehículo',
		'Confirma tus datos de contacto',
		'Realiza el pago seguro',
		'Recibe la etiqueta en tu domicilio'
	]}
/>
