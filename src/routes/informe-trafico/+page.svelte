<script lang="ts">
	import TramiteLanding from '$lib/components/TramiteLanding.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { getStaticSeo, serviceJsonLd } from '$lib/seo/site';

	const seo = getStaticSeo('/informe-trafico')!;
</script>

<SeoHead
	title={seo.title}
	description={seo.description}
	path={seo.path}
	image="/images/services/informe.webp"
	jsonLd={serviceJsonLd({
		name: 'Informe de Vehículo DGT',
		description: seo.description,
		path: seo.path
	})}
/>

<TramiteLanding
	tramite="informe"
	title="Informe de vehículo DGT"
	description="Solicita el informe de tráfico emitido por la DGT. Conoce cargas, reservas de dominio e historial."
	tramitarPath="/tramitar/informe-dgt"
	steps={[
		'Introduce la matrícula del vehículo',
		'Confirma tus datos de contacto',
		'Adjunta NIF y paga online',
		'Recibe el informe por email'
	]}
/>
