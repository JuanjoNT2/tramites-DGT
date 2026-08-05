<script lang="ts">
	import PasswordInput from '$lib/components/ui/PasswordInput.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<h1>Seguridad</h1>
<p class="lead">
	Cambia la contraseña de tu cuenta{#if data.email} (<strong>{data.email}</strong>){/if}.
</p>

{#if form && 'ok' in form && form.ok}
	<p class="ok" role="status">{form.message}</p>
{/if}
{#if form?.error}
	<p class="err" role="alert">{form.error}</p>
{/if}

<form method="POST" class="form card">
	<PasswordInput
		name="currentPassword"
		label="Contraseña actual"
		autocomplete="current-password"
		minlength={6}
	/>
	<PasswordInput
		name="password"
		label="Nueva contraseña"
		autocomplete="new-password"
		minlength={8}
	/>
	<PasswordInput
		name="password2"
		label="Repetir nueva contraseña"
		autocomplete="new-password"
		minlength={8}
	/>
	<button type="submit" class="btn">Guardar contraseña</button>
</form>

<p class="hint">
	Si no recuerdas la actual, cierra sesión y usa
	<a href="/recuperar-password">recuperar contraseña</a>.
</p>

<style>
	h1 {
		margin: 0 0 8px;
		color: #003050;
	}
	.lead {
		color: #5a6b7d;
		margin: 0 0 20px;
	}
	.form {
		display: grid;
		gap: 14px;
		max-width: 420px;
		padding: 20px;
		background: #fff;
		border: 1px solid #d8e0e8;
		border-radius: 12px;
	}
	.btn {
		justify-self: start;
		padding: 10px 16px;
		background: #00c6d1;
		color: #003050;
		font-weight: 700;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font: inherit;
	}
	.ok {
		background: #e8f5ee;
		color: #0f5132;
		padding: 10px 12px;
		border-radius: 8px;
		margin-bottom: 12px;
	}
	.err {
		background: #fde8e8;
		color: #9b1c1c;
		padding: 10px 12px;
		border-radius: 8px;
		margin-bottom: 12px;
	}
	.hint {
		margin-top: 16px;
		font-size: 0.9rem;
		color: #5a6b7d;
	}
</style>
