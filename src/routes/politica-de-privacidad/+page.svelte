<script lang="ts">
	import SeoHead from '$lib/components/SeoHead.svelte';
	import PrivacyPolicyContent from '$lib/components/legal/PrivacyPolicyContent.svelte';
	import { getStaticSeo } from '$lib/seo/site';

	const seo = getStaticSeo('/politica-de-privacidad')!;
</script>

<SeoHead title={seo.title} description={seo.description} path={seo.path} />

<section class="section">
	<div class="wrap card pad">
		<PrivacyPolicyContent />
	</div>
</section>

<style>
	.pad {
		max-width: 760px;
		margin: 0 auto;
		padding: 40px;
	}
</style>
