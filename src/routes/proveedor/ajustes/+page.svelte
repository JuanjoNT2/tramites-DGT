<script lang="ts">
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const ultimoEnvio = $derived(
		data.config.lastSentAt ? new Date(data.config.lastSentAt).toLocaleString('es-ES') : null
	);
</script>

<h1>Envío automático del Excel</h1>
<p class="lead">
	Recibe por email el Excel de los distintivos de cada periodo, sin tener que entrar al panel.
	Puedes desactivarlo cuando quieras: los botones de descarga y de envío manual seguirán
	funcionando igual.
</p>

{#if form && 'ok' in form && form.ok}
	<p class="ok" role="status">{form.message}</p>
{/if}
{#if form?.error}
	<p class="err" role="alert">{form.error}</p>
{/if}

<form method="POST" class="form">
	<label class="switch">
		<input type="checkbox" name="enabled" checked={data.config.enabled} />
		<span>Activar el envío automático</span>
	</label>

	<label>
		Frecuencia
		<select name="frecuencia" value={data.config.frecuencia}>
			{#each data.frecuencias as f (f.value)}
				<option value={f.value}>{f.label}</option>
			{/each}
		</select>
	</label>

	<label>
		Email de destino
		<input
			type="email"
			name="email"
			value={data.config.email ?? ''}
			placeholder={data.cuentaEmail || 'correo@ideauto.com'}
		/>
		<small>Si lo dejas vacío se envía a la dirección de tu cuenta.</small>
	</label>

	<button type="submit" class="btn">Guardar ajustes</button>
</form>

<p class="hint">
	{#if ultimoEnvio}
		Último envío automático: {ultimoEnvio}.
	{:else}
		Todavía no se ha realizado ningún envío automático.
	{/if}
	Cada periodo se manda cerrado: nunca se repiten ni se solapan trámites entre un envío y el
	siguiente.
</p>

<style>
	h1 {
		margin: 0 0 8px;
		color: #000038;
	}
	.lead {
		color: #5a6b7d;
		margin: 0 0 20px;
		max-width: 60ch;
	}
	.form {
		display: grid;
		gap: 16px;
		max-width: 460px;
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
		color: #1a2b3c;
	}
	.switch {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.switch input {
		width: 18px;
		height: 18px;
	}
	select,
	input[type='email'] {
		padding: 10px 12px;
		border: 1px solid #c5d0da;
		border-radius: 8px;
		font: inherit;
		background: #fff;
	}
	small {
		font-weight: 400;
		font-size: 0.78rem;
		color: #5a6b7d;
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
		font-size: 0.88rem;
		color: #5a6b7d;
		max-width: 60ch;
	}
</style>
