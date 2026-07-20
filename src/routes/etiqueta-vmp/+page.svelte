<script lang="ts">
	import TramiteLanding from '$lib/components/TramiteLanding.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { getStaticSeo, serviceJsonLd } from '$lib/seo/site';

	const seo = getStaticSeo('/etiqueta-vmp')!;
</script>

<SeoHead
	title={seo.title}
	description={seo.description}
	path={seo.path}
	image="/images/services/etiqueta-vmp.webp"
	jsonLd={serviceJsonLd({
		name: 'Etiqueta VMP (patinete)',
		description: seo.description,
		path: seo.path
	})}
/>

<TramiteLanding
	tramite="etiqueta-vmp"
	title="Etiqueta identificativa VMP (patinete)"
	description="Gestiona la inscripción de tu patinete eléctrico y recibe la etiqueta identificativa DGT. Paso previo al seguro obligatorio."
	tramitarPath="/tramitar/etiqueta-vmp"
	steps={[
		'Indica si tu VMP está certificado y sus datos (serie / certificado)',
		'Introduce tus datos como titular o tutor legal',
		'Elige dirección y tipo de envío de la etiqueta',
		'Confirma, paga y recibe la etiqueta en casa'
	]}
/>
