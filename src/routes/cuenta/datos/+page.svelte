<script lang="ts">
	import type { PageData } from './$types';
	import DateInput from '$lib/components/ui/DateInput.svelte';
	import NifInput from '$lib/components/ui/NifInput.svelte';
	import { namePartsFromProfile } from '$lib/cuenta/profile-prefill';
	import { sexoOptions } from '$lib/data/tramite-options';
	import {
		todayIso,
		validateDate,
		validateNifNie,
		validatePhone,
		validateRequired
	} from '$lib/utils/validators';

	let { data }: { data: PageData } = $props();

	const initialNames = namePartsFromProfile(data.profile);
	let nombre = $state(initialNames.nombre);
	let apellido1 = $state(initialNames.apellido1);
	let apellido2 = $state(initialNames.apellido2);
	let telefono = $state(data.profile?.telefono || '');
	let nif = $state(data.profile?.nif || '');
	let sexo = $state(data.sexo || '');
	let fechaNacimiento = $state(data.fechaNacimiento || '');
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
			validateRequired(nombre, 'El nombre') ||
			validateRequired(apellido1, 'El primer apellido') ||
			validateRequired(apellido2, 'El segundo apellido') ||
			validatePhone(telefono) ||
			validateNifNie(nif) ||
			(fechaNacimiento.trim()
				? validateDate(fechaNacimiento, {
						label: 'La fecha de nacimiento',
						required: true,
						max: todayIso()
					})
				: null);
		if (err) {
			saving = false;
			return;
		}
		try {
			const res = await fetch('/api/cuenta/perfil', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					nombre,
					apellido1,
					apellido2,
					telefono,
					nif,
					sexo: sexo.trim() || null,
					fecha_nacimiento: fechaNacimiento.trim() || null,
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
		Nombre *
		<input bind:value={nombre} required autocomplete="given-name" />
	</label>
	<label>
		Primer apellido *
		<input bind:value={apellido1} required autocomplete="family-name" />
	</label>
	<label>
		Segundo apellido *
		<input bind:value={apellido2} required autocomplete="additional-name" />
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
	<label>
		Sexo
		<span class="hint">Se reutiliza en trámites que lo pidan</span>
		<select bind:value={sexo}>
			<option value="">—</option>
			{#each sexoOptions as s}
				<option value={s.value}>{s.label}</option>
			{/each}
		</select>
	</label>
	<label>
		Fecha de nacimiento
		<span class="hint">Se reutiliza en trámites que la pidan</span>
		<DateInput bind:value={fechaNacimiento} max={todayIso()} />
	</label>
	<label>Calle<input bind:value={calle} autocomplete="street-address" /></label>
	<label>Código postal<input bind:value={cp} autocomplete="postal-code" /></label>
	<label>Ciudad<input bind:value={ciudad} autocomplete="address-level2" /></label>
	<label>Provincia<input bind:value={provincia} autocomplete="address-level1" /></label>
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
	input,
	select {
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
