<script lang="ts">
	import TramiteLanding from '$lib/components/TramiteLanding.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { getStaticSeo, serviceJsonLd } from '$lib/seo/site';

	const seo = getStaticSeo('/duplicado-permiso-circulacion')!;
</script>

<SeoHead
	title={seo.title}
	description={seo.description}
	path={seo.path}
	image="/images/services/duplicado.webp"
	jsonLd={serviceJsonLd({
		name: 'Duplicado permiso de circulación',
		description: seo.description,
		path: seo.path
	})}
/>

<TramiteLanding
	tramite="duplicado"
	title="Duplicado del permiso de circulación"
	description="Solicita el duplicado del permiso de circulación de tu vehículo por pérdida, robo o deterioro."
	tramitarPath="/tramitar/duplicado-carnet"
	steps={[
		'Indica motivo y matrícula del vehículo',
		'Introduce tus datos como titular',
		'Sube NIF y documentación del permiso',
		'Pago y envío a domicilio'
	]}
/>
