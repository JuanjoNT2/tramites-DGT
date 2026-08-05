<script lang="ts">
	import PasswordInput from '$lib/components/ui/PasswordInput.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const emailValue = $derived(
		form && 'email' in form && typeof form.email === 'string'
			? form.email
			: data.email || ''
	);
	const needsConfirm = $derived(
		Boolean(form && 'needsConfirm' in form && form.needsConfirm)
	);
</script>

<svelte:head>
	<title>Iniciar sesión | Trámites DGT Online</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="section">
	<div class="wrap auth card pad">
		<h1>Iniciar sesión</h1>
		<p class="lead">
			{#if data.next && data.next !== '/' && data.next.startsWith('/tramitar')}
				Accede a tu cuenta para continuar el trámite donde lo dejaste.
			{:else}
				Accede a tu cuenta para asociar trámites y consultar el estado.
			{/if}
		</p>

		{#if form && 'ok' in form && form.ok}
			<p class="ok" role="status">{form.message}</p>
		{:else if form?.error}
			<p class="err" role="alert">{form.error}</p>
			{#if needsConfirm}
				<form method="POST" action="?/resend" class="resend">
					<input type="hidden" name="email" value={emailValue} />
					<button type="submit" class="btn-link">Reenviar correo de confirmación</button>
				</form>
			{/if}
		{:else if data.urlError === 'invite'}
			<p class="err" role="alert">
				El enlace de invitación no es válido o ha caducado. Pide una nueva invitación o
				<a href="/registro">regístrate</a>.
			</p>
		{:else if data.urlError === 'recovery'}
			<p class="err" role="alert">
				El enlace para restablecer la contraseña no es válido o ya se usó. Gmail a veces lo abre
				solo y lo invalida. <a href="/recuperar-password">Solicita uno nuevo</a>, ábrelo y pulsa
				<strong>Continuar</strong> en la pantalla siguiente.
			</p>
		{:else if data.urlError === 'confirm'}
			<p class="err" role="alert">
				No se pudo verificar el enlace del correo. Puede haber caducado o haberse usado ya.
				<a href="/recuperar-password">Recuperar contraseña</a>
				·
				<a href="/registro">Registrarse</a>
			</p>
		{/if}

		<form method="POST" action="?/login" class="form">
			<input type="hidden" name="next" value={data.next} />
			<label>
				Email
				<input type="email" name="email" required autocomplete="email" value={emailValue} />
			</label>
			<PasswordInput name="password" autocomplete="current-password" minlength={6} />
			<button type="submit" class="btn">Entrar</button>
		</form>

		<p class="alt">
			<a href="/recuperar-password">¿Olvidaste la contraseña?</a>
		</p>
		<p class="alt">
			¿No tienes cuenta? <a href="/registro">Regístrate</a>
		</p>
	</div>
</section>

<style>
	.auth {
		max-width: 420px;
		margin: 48px auto;
		padding: 32px 28px;
	}
	h1 {
		margin: 0 0 10px;
		color: var(--navy, #003050);
	}
	.lead {
		color: #5a6b7d;
		margin: 0 0 24px;
		line-height: 1.45;
	}
	.form {
		display: grid;
		gap: 16px;
	}
	label {
		display: grid;
		gap: 6px;
		font-weight: 600;
		font-size: 0.9rem;
	}
	input {
		width: 100%;
		box-sizing: border-box;
		padding: 10px 12px;
		border: 1px solid #c5d0da;
		border-radius: 8px;
		font: inherit;
	}
	.err {
		background: #fde8e8;
		color: #9b1c1c;
		padding: 10px 12px;
		border-radius: 8px;
		margin-bottom: 16px;
	}
	.ok {
		background: #e6f6ed;
		color: #0f5132;
		padding: 10px 12px;
		border-radius: 8px;
		margin-bottom: 16px;
	}
	.resend {
		margin: -8px 0 16px;
	}
	.btn-link {
		background: none;
		border: none;
		padding: 0;
		font: inherit;
		color: var(--navy, #003050);
		text-decoration: underline;
		cursor: pointer;
		font-weight: 600;
	}
	.alt {
		margin-top: 20px;
		font-size: 0.95rem;
	}
	.alt:last-child {
		margin-bottom: 0;
	}
</style>
