<script lang="ts">
	import { page } from '$app/state';
	import { loginUrl } from '$lib/auth/urls';
	import { validateEmail } from '$lib/utils/validators';

	let {
		email,
		returnPath = '',
		exists = $bindable(false),
		mode = 'prompt'
	}: {
		email: string;
		returnPath?: string;
		exists?: boolean;
		mode?: 'prompt' | 'reminder';
	} = $props();

	let checking = $state(false);
	let accountExists = $state(false);
	let lastQueried = '';
	let timer: ReturnType<typeof setTimeout> | null = null;

	const loggedIn = $derived(Boolean(page.data.user));
	const emailNorm = $derived(email.trim().toLowerCase());
	const emailValid = $derived(Boolean(emailNorm) && validateEmail(emailNorm) === null);
	const nextPath = $derived(
		(returnPath || page.url.pathname).startsWith('/')
			? returnPath || page.url.pathname
			: `/${returnPath || page.url.pathname}`
	);
	const loginHref = $derived(loginUrl(nextPath, emailNorm));
	const recoverHref = $derived(
		`/recuperar-password${emailNorm ? `?email=${encodeURIComponent(emailNorm)}` : ''}`
	);

	const showBanner = $derived(emailValid && !loggedIn);

	function syncExists(v: boolean) {
		accountExists = v;
		exists = v;
	}

	function queryEmail(trimmed: string) {
		if (loggedIn || !trimmed || validateEmail(trimmed)) {
			checking = false;
			syncExists(false);
			lastQueried = '';
			return;
		}
		if (trimmed === lastQueried) return;

		checking = true;
		if (timer) clearTimeout(timer);
		timer = setTimeout(async () => {
			try {
				const res = await fetch('/api/auth/email-exists', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email: trimmed })
				});
				const data = (await res.json().catch(() => ({}))) as { exists?: boolean };
				if (!res.ok || email.trim().toLowerCase() !== trimmed) return;
				lastQueried = trimmed;
				syncExists(Boolean(data.exists));
			} catch {
				if (email.trim().toLowerCase() === trimmed) syncExists(false);
			} finally {
				if (email.trim().toLowerCase() === trimmed) checking = false;
			}
		}, 350);
	}

	$effect(() => {
		const trimmed = emailNorm;
		const valid = emailValid;
		const session = loggedIn;
		if (session || !valid) {
			if (timer) clearTimeout(timer);
			checking = false;
			syncExists(false);
			lastQueried = '';
			return;
		}
		queryEmail(trimmed);
		return () => {
			if (timer) clearTimeout(timer);
		};
	});
</script>

{#if showBanner}
	<div class="notice" class:soft={!accountExists} class:reminder={mode === 'reminder'} role="status">
		{#if accountExists}
			<p>
				Este correo ya tiene una cuenta. Debes
				<a href={loginHref}>iniciar sesión</a>
				para continuar el trámite
				{#if mode !== 'reminder'}
					(o <a href={recoverHref}>recuperar la contraseña</a> si la has olvidado)
				{/if}.
			</p>
			<div class="actions">
				<a class="btn" href={loginHref}>Iniciar sesión</a>
				<a class="btn ghost" href={recoverHref}>Recuperar contraseña</a>
			</div>
		{:else}
			<p>
				{#if checking}
					Comprobando si ya tienes cuenta…
				{:else if mode === 'reminder'}
					Al continuar se creará tu cuenta (si aún no la tienes) y te enviaremos la contraseña por
					email para seguir el trámite y recibir avisos.
				{:else}
					¿Ya tienes cuenta? Inicia sesión para reutilizar tus datos. Si no, al continuar crearemos
					tu cuenta y te enviaremos la contraseña por email.
				{/if}
			</p>
			{#if !checking}
				<div class="actions">
					<a class="btn ghost" href={loginHref}>Iniciar sesión</a>
				</div>
			{/if}
		{/if}
	</div>
{/if}

<style>
	.notice {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 12px 16px;
		margin: 0 0 20px;
		padding: 14px 16px;
		background: #fff8e8;
		border-left: 3px solid #e6a800;
		border-radius: 8px;
		box-sizing: border-box;
		width: 100%;
	}
	.notice.soft {
		background: #e8f7f8;
		border-left-color: #00a8b3;
	}
	.notice.reminder {
		margin: 0 0 18px;
	}
	.notice p {
		margin: 0;
		flex: 1 1 220px;
		font-size: 14px;
		line-height: 1.45;
		color: #3d4f5f;
	}
	.notice a {
		color: #003050;
		font-weight: 700;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.notice :global(.btn) {
		flex: 0 0 auto;
		text-decoration: none;
		padding: 10px 16px;
		font-size: 14px;
		font-weight: 700;
	}
</style>
