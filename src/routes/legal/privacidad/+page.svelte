<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		goto('/politica-de-privacidad', { replaceState: true });
	});
</script>

<p>Redirigiendo a la <a href="/politica-de-privacidad">política de privacidad</a>…</p>
