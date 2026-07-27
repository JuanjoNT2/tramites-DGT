<script lang="ts">
	import TramiteLanding from '$lib/components/TramiteLanding.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { getStaticSeo, serviceJsonLd } from '$lib/seo/site';

	const seo = getStaticSeo('/baja-temporal-vehiculo')!;
</script>

<SeoHead
	title={seo.title}
	description={seo.description}
	path={seo.path}
	image="/images/services/cancelacion.webp"
	jsonLd={serviceJsonLd({
		name: 'Baja temporal de vehículo',
		description: seo.description,
		path: seo.path
	})}
/>

<TramiteLanding
	tramite="baja-temporal"
	title="Baja temporal de vehículo"
	description="Tramita la baja temporal de tu vehículo ante la DGT sin citas ni desplazamientos."
	tramitarPath="/tramitar/baja-temporal"
	steps={[
		'Indica matrícula y tipo de vehículo',
		'Introduce tus datos de contacto',
		'Sube NIF y permiso de circulación',
		'Pago y confirmación del trámite'
	]}
/>
