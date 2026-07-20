<script lang="ts">
	import NoticiasList from '$lib/components/NoticiasList.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { getPostsPage } from '$lib/data/posts';
	import { getStaticSeo } from '$lib/seo/site';

	const { items, page, totalPages } = getPostsPage(1);
	const seo = getStaticSeo('/noticias')!;
</script>

<SeoHead title={seo.title} description={seo.description} path={seo.path} />

<NoticiasList {items} {page} {totalPages} />
