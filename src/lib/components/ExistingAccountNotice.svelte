<script lang="ts">
	import { page } from '$app/state';
	import { validateEmail } from '$lib/utils/validators';

	let {
		email,
		returnPath = '',
		exists = $bindable(false),
		/** prompt = paso solicitante; reminder = resumen/pago */
		mode = 'prompt'
	}: {
		email: string;
		returnPath?: string;
		exists?: boolean;
		mode?: 'prompt' | 'reminder';
	} = $props();

	let checking = $state(false);
	let lastChecked = $state('');
	/** Email para el que el usuario pulsó «continuar sin iniciar sesión» */
	let dismissedEmail = $state('');

	const loggedIn = $derived(Boolean(page.data.user));
	const emailNorm = $derived(email.trim().toLowerCase());
	const dismissed = $derived(Boolean(dismissedEmail) && dismissedEmail === emailNorm);
	const nextPath = $derived(
		(returnPath || page.url.pathname).startsWith('/')
			? returnPath || page.url.pathname
			: `/${returnPath || page.url.pathname}`
	);
	const loginHref = $derived(
		`/login?next=${encodeURIComponent(nextPath)}&email=${encodeURIComponent(emailNorm)}`
	);

	$effect(() => {
		if (loggedIn) {
			exists = false;
			checking = false;
			lastChecked = '';
			return;
		}

		const trimmed = email.trim().toLowerCase();
		if (!trimmed || validateEmail(trimmed)) {
			exists = false;
			checking = false;
			lastChecked = '';
			return;
		}

		if (trimmed === lastChecked) return;

		checking = true;
		const handle = setTimeout(async () => {
			try {
				const res = await fetch('/api/auth/email-exists', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email: trimmed })
				});
				const data = (await res.json().catch(() => ({}))) as {
					exists?: boolean;
				};
				if (email.trim().toLowerCase() !== trimmed) return;
				exists = Boolean(data.exists);
				lastChecked = trimmed;
			} catch {
				if (email.trim().toLowerCase() === trimmed) exists = false;
			} finally {
				if (email.trim().toLowerCase() === trimmed) checking = false;
			}
		}, 450);

		return () => clearTimeout(handle);
	});
</script>

{#if mode === 'prompt'}
	{#if checking && !exists}
		<p class="checking" role="status">Comprobando si ya tienes cuenta…</p>
	{:else if exists && !dismissed}
		<div class="notice" role="status">
			<p>
				Este correo ya tiene una cuenta. Inicia sesión para reutilizar tus datos y ver tus
				trámites, o continúa sin iniciar sesión.
			</p>
			<div class="actions">
				<a class="btn" href={loginHref}>Iniciar sesión</a>
				<button
					type="button"
					class="btn ghost"
					onclick={() => {
						dismissedEmail = emailNorm;
					}}
				>
					Continuar sin iniciar sesión
				</button>
			</div>
		</div>
	{/if}
{:else if !loggedIn}
	{#if exists}
		<div class="notice reminder" role="status">
			<p>
				Este correo ya tiene cuenta. Si inicias sesión, este trámite quedará en tu historial y
				podrás reutilizar tus datos la próxima vez.
			</p>
			<a class="btn" href={loginHref}>Iniciar sesión</a>
		</div>
	{:else if email.trim() && !validateEmail(email)}
		<div class="notice soft" role="status">
			<p>
				¿Tienes cuenta? Inicia sesión para guardar este trámite en tu área personal. También
				puedes pagar sin iniciar sesión.
			</p>
			<a class="btn ghost" href={loginHref}>Iniciar sesión</a>
		</div>
	{/if}
{/if}

<style>
	.checking {
		margin: -8px 0 16px;
		font-size: 13px;
		color: var(--text3, #5a6b7d);
	}
	.notice {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 12px 16px;
		margin: -4px 0 20px;
		padding: 14px 16px;
		background: #fff8e8;
		border-left: 3px solid #e6a800;
		border-radius: var(--radius, 8px);
	}
	.notice.soft {
		background: var(--primary-dim, #eef7f8);
		border-left-color: var(--brand-teal, #00c6d1);
	}
	.notice.reminder {
		margin: 0 0 18px;
	}
	.notice p {
		margin: 0;
		flex: 1 1 220px;
		font-size: 14px;
		line-height: 1.45;
		color: var(--text2, #3d4f5f);
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.notice .btn {
		flex: 0 0 auto;
		text-decoration: none;
		padding: 10px 16px;
		font-size: 14px;
		font-weight: 700;
	}
</style>
