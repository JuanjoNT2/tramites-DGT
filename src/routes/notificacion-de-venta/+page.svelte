<script lang="ts">
	import TramiteLanding from '$lib/components/TramiteLanding.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { getStaticSeo, serviceJsonLd } from '$lib/seo/site';

	const seo = getStaticSeo('/notificacion-de-venta')!;
</script>

<SeoHead
	title={seo.title}
	description={seo.description}
	path={seo.path}
	image="/images/services/transferencia.webp"
	jsonLd={serviceJsonLd({
		name: 'Notificación de venta',
		description: seo.description,
		path: seo.path
	})}
/>

<TramiteLanding
	tramite="notificacion-venta"
	title="Notificación de venta de vehículo"
	description="Notifica la venta de tu vehículo ante la DGT 100% online y evita responsabilidades posteriores."
	tramitarPath="/tramitar/notificacion-venta"
	steps={[
		'Indica los datos del vehículo',
		'Datos del comprador',
		'Datos del vendedor',
		'Sube la documentación',
		'Pago y confirmación'
	]}
/>
