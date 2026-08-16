<script lang="ts">
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { getStaticSeo } from '$lib/seo/site';

	const seo = getStaticSeo('/politica-de-devoluciones')!;
</script>

<SeoHead title={seo.title} description={seo.description} path={seo.path} />

<section class="section">
	<div class="wrap card pad">
		<h1>Política de devoluciones</h1>
		<p class="legal">
			Los servicios de tramitación se prestan a medida. Si el expediente aún no se ha iniciado ante
			la DGT, Hacienda u otro organismo, puedes solicitar la cancelación y el reembolso del importe
			pagado (salvo tasas ya abonadas a terceros).
		</p>
		<p class="legal">
			Una vez iniciado el trámite o pagadas tasas oficiales, no es posible devolver esos importes.
			Los errores en los datos facilitados por el usuario no dan derecho a reembolso de tasas ya
			ingresadas.
		</p>
		<p class="legal">
			Para solicitar una devolución, escribe a
			<a href="mailto:info@tramitesdgtonline.com">info@tramitesdgtonline.com</a> indicando la
			referencia del trámite. Responderemos en un plazo máximo de 14 días naturales.
		</p>
	</div>
</section>

<style>
	.pad {
		max-width: 720px;
		margin: 0 auto;
		padding: 40px;
	}
	h1 {
		font-size: 28px;
		font-weight: 800;
		margin-bottom: 16px;
	}
	.legal {
		color: var(--text2);
		line-height: 1.6;
		margin-bottom: 14px;
	}
	.legal a {
		color: var(--accent);
		font-weight: 700;
	}
</style>
