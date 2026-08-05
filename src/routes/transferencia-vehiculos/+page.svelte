<script lang="ts">
	import TramiteLanding from '$lib/components/TramiteLanding.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { getStaticSeo, serviceJsonLd } from '$lib/seo/site';

	const seo = getStaticSeo('/transferencia-vehiculos')!;
</script>

<SeoHead
	title={seo.title}
	description={seo.description}
	path={seo.path}
	image="/images/services/transferencia.webp"
	jsonLd={serviceJsonLd({
		name: 'Transferencia de Vehículos',
		description: seo.description,
		path: seo.path
	})}
/>

<TramiteLanding
	tramite="transferencia"
	title="Transferencia de vehículos: rápido y seguro"
	description="Cambia la titularidad de tu vehículo 100% online, sin desplazamientos. Servicio disponible los 365 días del año."
	tramitarPath="/tramitar/transferencia"
	calcPath="/calcular/precio-transferencia"
	steps={[
		'Datos del vehículo y presupuesto',
		'Datos del comprador',
		'Datos del vendedor',
		'Sube la documentación',
		'Revisa y paga online'
	]}
/>
