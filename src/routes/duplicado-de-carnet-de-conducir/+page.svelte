<script lang="ts">
	import TramiteLanding from '$lib/components/TramiteLanding.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { getStaticSeo, serviceJsonLd } from '$lib/seo/site';

	const seo = getStaticSeo('/duplicado-de-carnet-de-conducir')!;
</script>

<SeoHead
	title={seo.title}
	description={seo.description}
	path={seo.path}
	image="/images/services/duplicado.webp"
	jsonLd={serviceJsonLd({
		name: 'Duplicado Carnet Conducir',
		description: seo.description,
		path: seo.path
	})}
/>

<TramiteLanding
	tramite="duplicado"
	title="Duplicado de carnet de conducir"
	description="Solicita el duplicado de tu permiso de conducir por pérdida, robo o deterioro."
	tramitarPath="/tramitar/duplicado-carnet"
	steps={[
		'Indica el motivo del duplicado',
		'Introduce tus datos personales',
		'Sube foto de tu DNI',
		'Pago y envío a domicilio'
	]}
/>
