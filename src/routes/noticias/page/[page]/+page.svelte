<script lang="ts">
	import NoticiasList from '$lib/components/NoticiasList.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { pageTitle } from '$lib/seo/site';

	let { data } = $props();
</script>

<SeoHead
	title={pageTitle(`Noticias | Página ${data.page} de ${data.totalPages}`)}
	description={`Mantente informado con las últimas noticias sobre trámites DGT. Página ${data.page} de ${data.totalPages}.`}
	path={`/noticias/page/${data.page}`}
/>

<NoticiasList items={data.items} page={data.page} totalPages={data.totalPages} />
