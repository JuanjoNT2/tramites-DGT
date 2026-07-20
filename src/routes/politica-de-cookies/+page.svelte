<script lang="ts">
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { getStaticSeo } from '$lib/seo/site';

	const seo = getStaticSeo('/politica-de-cookies')!;
</script>

<SeoHead title={seo.title} description={seo.description} path={seo.path} />

<section class="section">
	<div class="wrap card pad">
		<h1>Política de cookies</h1>
		<p class="legal">Documento legal en preparación. Versión demostración del nuevo sitio.</p>
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
	}
</style>
