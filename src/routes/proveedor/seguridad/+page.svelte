<script lang="ts">
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<h1>Cambiar contraseña</h1>
<p class="lead">
	Actualiza la contraseña de tu cuenta{#if data.email}
		(<strong>{data.email}</strong>){/if}.
</p>

{#if form && 'ok' in form && form.ok}
	<p class="ok" role="status">{form.message}</p>
{/if}
{#if form?.error}
	<p class="err" role="alert">{form.error}</p>
{/if}

<form method="POST" class="form">
	<label>
		Contraseña actual
		<input
			type="password"
			name="currentPassword"
			required
			minlength="6"
			autocomplete="current-password"
		/>
	</label>
	<label>
		Nueva contraseña
		<input type="password" name="password" required minlength="8" autocomplete="new-password" />
	</label>
	<label>
		Repetir contraseña
		<input type="password" name="password2" required minlength="8" autocomplete="new-password" />
	</label>
	<button type="submit" class="btn">Guardar contraseña</button>
</form>

<p class="hint">
	Si no recuerdas la actual, cierra sesión y usa
	<a href="/recuperar-password">recuperar contraseña</a>.
</p>

<style>
	h1 {
		margin: 0 0 8px;
		color: #000038;
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
	label {
		display: grid;
		gap: 6px;
		font-weight: 600;
		font-size: 0.9rem;
	}
	input {
		padding: 10px 12px;
		border: 1px solid #c5d0da;
		border-radius: 8px;
		font: inherit;
	}
	.btn {
		justify-self: start;
		padding: 10px 16px;
		background: #397ab2;
		color: #fff;
		font-weight: 700;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font: inherit;
	}
	.ok {
		background: #e4f3ea;
		color: #2f7a4f;
		padding: 10px 12px;
		border-radius: 8px;
		margin-bottom: 12px;
	}
	.err {
		background: #f8e4e4;
		color: #a05050;
		padding: 10px 12px;
		border-radius: 8px;
		margin-bottom: 12px;
	}
	.hint {
		margin-top: 16px;
		font-size: 0.9rem;
		color: #5a6b7d;
	}
	.hint a {
		color: #397ab2;
		font-weight: 700;
	}
</style>
