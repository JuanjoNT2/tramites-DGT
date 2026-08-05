<script lang="ts">
	import { goto } from '$app/navigation';
	import { getSupabaseBrowser } from '$lib/supabase/browser';
	import type { PageData } from './$types';
	import { onMount } from 'svelte';

	let { data }: { data: PageData } = $props();
	let status = $state('Completando acceso…');
	let failed = $state(false);

	onMount(async () => {
		const sb = getSupabaseBrowser();
		if (!sb) {
			failed = true;
			status = 'Auth no configurada en el cliente.';
			return;
		}

		// PKCE / query ya resuelto en el server → no debería llegar aquí con sesión
		const hash = window.location.hash.replace(/^#/, '');
		if (!hash) {
			// Sin hash ni params útiles: enlace inválido
			const kind = data.isRecovery ? 'recovery' : data.isInvite ? 'invite' : 'confirm';
			await goto(`/login?error=${kind}`, { replaceState: true });
			return;
		}

		const params = new URLSearchParams(hash);
		const access_token = params.get('access_token');
		const refresh_token = params.get('refresh_token');
		const type = params.get('type');

		if (!access_token || !refresh_token) {
			failed = true;
			status = 'Enlace incompleto. Solicita uno nuevo.';
			const kind =
				type === 'recovery' || data.isRecovery
					? 'recovery'
					: type === 'invite' || data.isInvite
						? 'invite'
						: 'confirm';
			setTimeout(() => goto(`/login?error=${kind}`, { replaceState: true }), 1500);
			return;
		}

		const { error } = await sb.auth.setSession({ access_token, refresh_token });
		if (error) {
			console.error('[auth/callback] setSession', error.message);
			failed = true;
			status = 'No se pudo validar el enlace.';
			const kind =
				type === 'recovery' || data.isRecovery
					? 'recovery'
					: type === 'invite' || data.isInvite
						? 'invite'
						: 'confirm';
			setTimeout(() => goto(`/login?error=${kind}`, { replaceState: true }), 1500);
			return;
		}

		const dest =
			type === 'recovery' || data.isRecovery
				? '/auth/actualizar-password'
				: type === 'invite' || data.isInvite
					? '/registro?invite=1'
					: data.next || '/';
		await goto(dest, { replaceState: true });
	});
</script>

<section class="section">
	<div class="wrap card">
		<p class:err={failed} role="status">{status}</p>
		{#if failed}
			<p><a href="/login">Ir a iniciar sesión</a> · <a href="/recuperar-password">Recuperar contraseña</a></p>
		{/if}
	</div>
</section>

<style>
	.card {
		max-width: 420px;
		margin: 48px auto;
		padding: 28px 24px;
		background: #fff;
		border: 1px solid #d8e0e8;
		border-radius: 14px;
	}
	.err {
		color: #9b1c1c;
	}
	a {
		color: #003050;
		font-weight: 700;
	}
</style>
