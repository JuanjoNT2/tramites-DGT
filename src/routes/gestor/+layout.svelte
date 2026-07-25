<script lang="ts">
	import GestorShell from '$lib/components/gestor/GestorShell.svelte';
	let { data, children } = $props();
</script>

<svelte:head>
	<title>Panel gestor | Trámites DGT Online</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<GestorShell email={data.email} role={data.role} vista={data.vista}>
	{@render children()}
</GestorShell>
