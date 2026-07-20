<script lang="ts">
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { faqPageJsonLd, getStaticSeo } from '$lib/seo/site';

	const faqs = [
		{
			q: '¿Cuánto tarda una transferencia de vehículo?',
			a: 'Una vez completados los datos y el pago, el permiso de circulación suele llegar en 15-20 días laborables.'
		},
		{
			q: '¿Puedo hacer el trámite desde el móvil?',
			a: 'Sí, todos nuestros formularios están optimizados para móvil y tablet.'
		},
		{
			q: '¿Qué documentos necesito?',
			a: 'DNI de comprador y vendedor, ficha técnica, permiso de circulación y contrato de compraventa.'
		},
		{
			q: '¿El precio incluye el ITP?',
			a: 'Sí, nuestro presupuesto incluye el Impuesto de Transmisiones Patrimoniales, tasas DGT y tramitación.'
		}
	];

	const seo = getStaticSeo('/preguntas-frecuentes')!;
</script>

<SeoHead
	title={seo.title}
	description={seo.description}
	path={seo.path}
	jsonLd={faqPageJsonLd(faqs)}
/>

<section class="section">
	<div class="wrap">
		<h1>Preguntas frecuentes</h1>
		<div class="faqs">
			{#each faqs as f}
				<details class="card item">
					<summary>{f.q}</summary>
					<p>{f.a}</p>
				</details>
			{/each}
		</div>
	</div>
</section>

<style>
	h1 {
		font-size: 32px;
		font-weight: 800;
		margin-bottom: 28px;
	}
	.faqs {
		display: grid;
		gap: 12px;
		max-width: 720px;
	}
	.item {
		padding: 0;
		overflow: hidden;
	}
	summary {
		padding: 18px 20px;
		font-weight: 700;
		cursor: pointer;
		list-style: none;
	}
	summary::-webkit-details-marker {
		display: none;
	}
	p {
		padding: 0 20px 18px;
		color: var(--text2);
		line-height: 1.55;
		font-size: 15px;
	}
</style>
