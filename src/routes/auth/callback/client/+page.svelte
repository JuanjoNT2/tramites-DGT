<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { getSupabaseBrowser } from '$lib/supabase/browser';
	import { onMount } from 'svelte';

	let status = $state('Validando enlace…');
	let failed = $state(false);

	function destForType(type: string | null, next: string) {
		if (type === 'recovery' || next.includes('actualizar-password')) {
			return '/auth/actualizar-password';
		}
		if (type === 'invite' || next.includes('invite=1')) return '/registro?invite=1';
		if (next.startsWith('/')) return next;
		return '/cuenta';
	}

	onMount(async () => {
		const sb = getSupabaseBrowser();
		const next = page.url.searchParams.get('next') || '';
		const typeParam = page.url.searchParams.get('type');

		if (!sb) {
			failed = true;
			status = 'Auth no configurada.';
			return;
		}

		const hash = typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : '';
		if (hash && hash.includes('access_token')) {
			const params = new URLSearchParams(hash);
			const access_token = params.get('access_token');
			const refresh_token = params.get('refresh_token');
			const type = params.get('type') || typeParam;
			if (access_token && refresh_token) {
				const { error } = await sb.auth.setSession({ access_token, refresh_token });
				history.replaceState(null, '', window.location.pathname + window.location.search);
				if (error) {
					console.error('[auth/callback/client] setSession', error.message);
					failed = true;
					status = 'No se pudo validar el enlace.';
					await goto(
						`/login?error=${type === 'recovery' ? 'recovery' : type === 'invite' ? 'invite' : 'confirm'}`,
						{ replaceState: true }
					);
					return;
				}
				await goto(destForType(type, next), { replaceState: true, invalidateAll: true });
				return;
			}
		}

		failed = true;
		status = 'Enlace incompleto o ya usado.';
		const kind =
			typeParam === 'recovery' || next.includes('actualizar-password')
				? 'recovery'
				: typeParam === 'invite'
					? 'invite'
					: 'confirm';
		await goto(`/login?error=${kind}`, { replaceState: true });
	});
</script>

<section class="section">
	<div class="wrap card">
		<p class:err={failed} role="status">{status}</p>
		{#if failed}
			<p>
				<a href="/recuperar-password">Solicitar nuevo enlace</a>
				·
				<a href="/login">Iniciar sesión</a>
			</p>
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
