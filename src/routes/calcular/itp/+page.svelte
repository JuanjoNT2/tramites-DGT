<script lang="ts">
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { getStaticSeo } from '$lib/seo/site';

	const seo = getStaticSeo('/calcular/itp')!;
</script>

<SeoHead title={seo.title} description={seo.description} path={seo.path} />

<section class="section">
	<div class="wrap card pad">
		<h1>Calculadora de ITP</h1>
		<p>Próximamente. Usa la <a href="/calcular/precio-transferencia">calculadora de precio de transferencia</a>.</p>
	</div>
</section>

<style>
	.pad {
		padding: 40px;
		max-width: 560px;
		margin: 0 auto;
	}
	a {
		color: var(--accent);
		font-weight: 600;
	}
</style>
