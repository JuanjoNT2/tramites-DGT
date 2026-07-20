<script lang="ts">
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { getStaticSeo } from '$lib/seo/site';

	const seo = getStaticSeo('/calcular/valor-venal')!;
</script>

<SeoHead title={seo.title} description={seo.description} path={seo.path} />

<section class="section">
	<div class="wrap card pad">
		<h1>Valor venal en Hacienda</h1>
		<p>Calculadora en preparación. Modo demostración.</p>
	</div>
</section>

<style>
	.pad {
		padding: 40px;
		max-width: 560px;
		margin: 0 auto;
	}
</style>
