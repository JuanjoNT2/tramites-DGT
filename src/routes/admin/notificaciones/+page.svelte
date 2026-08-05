<script lang="ts">
	import AdminShell from '$lib/components/admin/AdminShell.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const emailValue = $derived(
		form && 'email' in form && form.email ? form.email : data.email
	);
</script>

<AdminShell range={data.range} title="Notificaciones">
	<p class="intro">
		Correo que recibe avisos automáticos cuando se registra un usuario o se confirma una venta
		(pago de un trámite).
	</p>

	{#if data.loadError}
		<p class="warn" role="status">{data.loadError}</p>
	{/if}

	{#if form && 'ok' in form && form.ok}
		<p class="ok" role="status">{form.message}</p>
	{:else if form && 'error' in form && form.error}
		<p class="err" role="alert">{form.error}</p>
	{/if}

	<section class="card">
		<form method="POST" class="form">
			<label>
				Email de notificaciones
				<input
					type="email"
					name="email"
					required
					autocomplete="email"
					value={emailValue}
					placeholder={data.defaultEmail}
				/>
			</label>
			<p class="hint">Por defecto: {data.defaultEmail}</p>
			<button type="submit" class="btn">Guardar</button>
		</form>
	</section>

	<section class="card list">
		<h2>Avisos activos</h2>
		<ul>
			<li><strong>Nuevo registro</strong> — nombre, apellidos y email del usuario.</li>
			<li>
				<strong>Venta pagada</strong> — cliente, trámite, referencia e importe cuando el pago
				queda confirmado (Stripe o Redsys).
			</li>
		</ul>
	</section>
</AdminShell>

<style>
	.intro {
		margin: 0 0 16px;
		color: #5a6b7d;
		max-width: 560px;
		line-height: 1.5;
	}
	.card {
		background: #fff;
		border: 1px solid #d8e0e8;
		border-radius: 12px;
		padding: 18px;
		max-width: 520px;
		margin-bottom: 16px;
	}
	.form {
		display: grid;
		gap: 10px;
	}
	label {
		display: grid;
		gap: 6px;
		font-weight: 700;
		font-size: 0.85rem;
		color: #003050;
	}
	input {
		padding: 10px 12px;
		border: 1px solid #c5d0da;
		border-radius: 8px;
		font: inherit;
	}
	.hint {
		margin: 0;
		font-size: 0.8rem;
		color: #5a6b7d;
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
	.list h2 {
		margin: 0 0 10px;
		font-size: 1rem;
		color: #003050;
	}
	.list ul {
		margin: 0;
		padding-left: 1.2rem;
		color: #3a4a5a;
		line-height: 1.55;
		font-size: 0.92rem;
	}
	.ok {
		background: #e8f5ee;
		color: #0f5132;
		padding: 10px 12px;
		border-radius: 8px;
		max-width: 520px;
	}
	.err {
		background: #fde8e8;
		color: #9b1c1c;
		padding: 10px 12px;
		border-radius: 8px;
		max-width: 520px;
	}
	.warn {
		background: #fff4e5;
		color: #7a4b00;
		padding: 10px 12px;
		border-radius: 8px;
		max-width: 520px;
	}
</style>
