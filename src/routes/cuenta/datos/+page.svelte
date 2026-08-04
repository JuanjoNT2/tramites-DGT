<script lang="ts">
	import type { PageData } from './$types';
	import NifInput from '$lib/components/ui/NifInput.svelte';
	import { validateNifNie, validatePhone, validateRequired } from '$lib/utils/validators';

	let { data }: { data: PageData } = $props();
	let full_name = $state(data.profile?.full_name || '');
	let telefono = $state(data.profile?.telefono || '');
	let nif = $state(data.profile?.nif || '');
	let calle = $state(data.direccion.calle);
	let cp = $state(data.direccion.cp);
	let ciudad = $state(data.direccion.ciudad);
	let provincia = $state(data.direccion.provincia);
	let msg = $state<string | null>(null);
	let err = $state<string | null>(null);
	let saving = $state(false);

	const incomplete = $derived(!data.profile?.telefono?.trim() || !data.profile?.nif?.trim());

	async function save(e: Event) {
		e.preventDefault();
		saving = true;
		msg = null;
		err =
			validateRequired(full_name, 'El nombre completo') ||
			validatePhone(telefono) ||
			validateNifNie(nif);
		if (err) {
			saving = false;
			return;
		}
		try {
			const res = await fetch('/api/cuenta/perfil', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					full_name,
					telefono,
					nif,
					direccion: { calle, cp, ciudad, provincia }
				})
			});
			const body = await res.json();
			if (!res.ok) throw new Error(body.error || 'Error');
			msg = 'Datos actualizados';
		} catch (e) {
			err = e instanceof Error ? e.message : 'Error';
		} finally {
			saving = false;
		}
	}
</script>

<header class="head">
	<h1>Mis datos</h1>
	<p class="sub">Email de cuenta: {data.email}</p>
</header>

{#if incomplete}
	<p class="warn" role="status">
		Completa móvil y NIF/NIE: son obligatorios en todos los perfiles registrados.
	</p>
{/if}
{#if !data.emailConfirmed}
	<p class="warn">Email no verificado.</p>
{/if}
{#if data.schemaHint}
	<p class="warn">{data.schemaHint}</p>
{/if}
{#if msg}<p class="ok">{msg}</p>{/if}
{#if err}<p class="err">{err}</p>{/if}

<form class="card form" onsubmit={save}>
	<label>
		Email
		<input type="email" value={data.email || ''} disabled readonly />
		<span class="hint">El email de la cuenta no se cambia aquí.</span>
	</label>
	<label>
		Nombre completo *
		<input bind:value={full_name} required autocomplete="name" />
	</label>
	<label>
		Móvil *
		<input bind:value={telefono} type="tel" required autocomplete="tel" placeholder="612345678" />
	</label>
	<label>
		NIF / NIE *
		<span class="hint">Escribe los dígitos: la letra se calcula sola</span>
		<NifInput bind:value={nif} required />
	</label>
	<label>Calle<input bind:value={calle} /></label>
	<label>Código postal<input bind:value={cp} /></label>
	<label>Ciudad<input bind:value={ciudad} /></label>
	<label>Provincia<input bind:value={provincia} /></label>
	<button type="submit" class="btn" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
</form>

<style>
	.head {
		margin-bottom: 16px;
	}
	h1 {
		margin: 0 0 6px;
		color: #003050;
	}
	.sub {
		margin: 0;
		color: #5a6b7d;
		overflow-wrap: anywhere;
	}
	.card {
		background: #fff;
		border: 1px solid #d8e0e8;
		border-radius: 12px;
		padding: 16px;
		max-width: 520px;
	}
	.form {
		display: grid;
		gap: 12px;
	}
	label {
		display: grid;
		gap: 4px;
		font-weight: 600;
		font-size: 0.85rem;
	}
	.hint {
		font-weight: 500;
		font-size: 0.75rem;
		color: #5a6b7d;
	}
	input {
		padding: 8px 10px;
		border: 1px solid #c5d0da;
		border-radius: 8px;
		font: inherit;
	}
	input:disabled {
		background: #f4f7fa;
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
	}
	.warn {
		background: #fff4e5;
		color: #7a4b00;
		padding: 10px;
		border-radius: 8px;
	}
	.ok {
		background: #e8f5ee;
		color: #0f5132;
		padding: 8px 10px;
		border-radius: 8px;
	}
	.err {
		background: #fde8e8;
		color: #9b1c1c;
		padding: 8px 10px;
		border-radius: 8px;
	}
</style>
