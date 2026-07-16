<script lang="ts">
	import NoticiasList from '$lib/components/NoticiasList.svelte';
	import { getPostsPage } from '$lib/data/posts';

	const { items, page, totalPages } = getPostsPage(1);
</script>

<svelte:head>
	<title>Noticias | Trámites DGT Online</title>
	<meta
		name="description"
		content="Mantente informado con las últimas noticias sobre trámites DGT, transferencia de vehículos, etiquetas medioambientales e informes de tráfico."
	/>
	<link rel="canonical" href="https://tramitesdgtonline.com/noticias/" />
</svelte:head>

<NoticiasList {items} {page} {totalPages} />
