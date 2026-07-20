<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		goto('/aviso-legal', { replaceState: true });
	});
</script>

<p>Redirigiendo al <a href="/aviso-legal">aviso legal</a>…</p>
