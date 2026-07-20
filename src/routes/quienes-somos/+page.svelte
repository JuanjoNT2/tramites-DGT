<script lang="ts">
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { getStaticSeo } from '$lib/seo/site';

	const seo = getStaticSeo('/quienes-somos')!;
</script>

<SeoHead title={seo.title} description={seo.description} path={seo.path} />

<section class="section">
	<div class="wrap prose card pad">
		<h1>Quiénes somos</h1>
		<p>
			Trámites DGT Online es una plataforma que permite realizar trámites de vehículo de forma
			100% online, sin desplazamientos ni papeleo innecesario.
		</p>
		<p>
			Nuestro equipo de gestores tramita transferencias, informes DGT, etiquetas medioambientales
			y más, con un proceso guiado paso a paso diseñado para ser claro y rápido.
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
		font-size: 32px;
		font-weight: 800;
		margin-bottom: 20px;
	}
	p {
		font-size: 16px;
		line-height: 1.65;
		color: var(--text2);
		margin-bottom: 16px;
	}
</style>
