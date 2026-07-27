<script lang="ts">
	import TramiteLanding from '$lib/components/TramiteLanding.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { getStaticSeo, serviceJsonLd } from '$lib/seo/site';

	const seo = getStaticSeo('/nota-simple-vehiculo')!;
</script>

<SeoHead
	title={seo.title}
	description={seo.description}
	path={seo.path}
	image="/images/services/informe.webp"
	jsonLd={serviceJsonLd({
		name: 'Nota simple de vehículo',
		description: seo.description,
		path: seo.path
	})}
/>

<TramiteLanding
	tramite="nota-simple"
	title="Nota simple de vehículo"
	description="Solicita la nota simple registral del vehículo online y conoce su situación de forma rápida."
	tramitarPath="/tramitar/nota-simple"
	steps={[
		'Introduce matrícula (y bastidor si lo tienes)',
		'Confirma datos del solicitante',
		'Sube tu documentación',
		'Pago y recepción de la nota'
	]}
/>
