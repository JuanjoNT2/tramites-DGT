<script lang="ts">
	import TramiteLanding from '$lib/components/TramiteLanding.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { getStaticSeo, serviceJsonLd } from '$lib/seo/site';

	const seo = getStaticSeo('/cancelacion-de-reserva-de-dominio')!;
</script>

<SeoHead
	title={seo.title}
	description={seo.description}
	path={seo.path}
	image="/images/services/cancelacion.webp"
	jsonLd={serviceJsonLd({
		name: 'Cancelación de reserva de dominio',
		description: seo.description,
		path: seo.path
	})}
/>

<TramiteLanding
	tramite="cancelacion"
	title="Cancelación de reserva de dominio"
	description="Cancela la reserva de dominio de tu vehículo ante la entidad financiera."
	tramitarPath="/tramitar/cancelacion-reserva"
	steps={[
		'Datos del vehículo y entidad financiera',
		'Datos del titular',
		'Documentación',
		'Tramitación y confirmación'
	]}
/>
