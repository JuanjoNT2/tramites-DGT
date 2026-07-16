<script lang="ts">
	import NoticiasList from '$lib/components/NoticiasList.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Noticias | Página {data.page} de {data.totalPages} | Trámites DGT Online</title>
	<meta
		name="description"
		content="Mantente informado con las últimas noticias sobre trámites DGT. Página {data.page} de {data.totalPages}."
	/>
	<link rel="canonical" href="https://tramitesdgtonline.com/noticias/page/{data.page}/" />
</svelte:head>

<NoticiasList items={data.items} page={data.page} totalPages={data.totalPages} />
