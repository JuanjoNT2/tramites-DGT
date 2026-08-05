<script lang="ts">
	import { browser } from '$app/environment';
	import { beforeNavigate } from '$app/navigation';
	import type { PageData } from './$types';
	import DateInput from '$lib/components/ui/DateInput.svelte';
	import NifInput from '$lib/components/ui/NifInput.svelte';
	import { namePartsFromProfile } from '$lib/cuenta/profile-prefill';
	import { sexoOptions } from '$lib/data/tramite-options';
	import {
		parseDateInput,
		todayIso,
		validateDate,
		validateNifNie,
		validatePhone,
		validateRequired
	} from '$lib/utils/validators';

	let { data }: { data: PageData } = $props();

	type Draft = {
		nombre: string;
		apellido1: string;
		apellido2: string;
		telefono: string;
		nif: string;
		sexo: string;
		fechaNacimiento: string;
		calle: string;
		cp: string;
		ciudad: string;
		provincia: string;
	};

	function draftFromData(): Draft {
		const names = namePartsFromProfile(data.profile);
		return {
			nombre: names.nombre,
			apellido1: names.apellido1,
			apellido2: names.apellido2,
			telefono: data.profile?.telefono || '',
			nif: data.profile?.nif || '',
			sexo: data.sexo || '',
			fechaNacimiento: data.fechaNacimiento || '',
			calle: data.direccion.calle,
			cp: data.direccion.cp,
			ciudad: data.direccion.ciudad,
			provincia: data.direccion.provincia
		};
	}

	let saved = $state<Draft>(draftFromData());
	let nombre = $state(saved.nombre);
	let apellido1 = $state(saved.apellido1);
	let apellido2 = $state(saved.apellido2);
	let telefono = $state(saved.telefono);
	let nif = $state(saved.nif);
	let sexo = $state(saved.sexo);
	let fechaNacimiento = $state(saved.fechaNacimiento);
	let calle = $state(saved.calle);
	let cp = $state(saved.cp);
	let ciudad = $state(saved.ciudad);
	let provincia = $state(saved.provincia);

	const incomplete = $derived(!saved.telefono.trim() || !saved.nif.trim());
	let editing = $state(incomplete);
	let msg = $state<string | null>(null);
	let err = $state<string | null>(null);
	let saving = $state(false);

	const current = $derived({
		nombre,
		apellido1,
		apellido2,
		telefono,
		nif,
		sexo,
		fechaNacimiento,
		calle,
		cp,
		ciudad,
		provincia
	} satisfies Draft);

	const dirty = $derived(editing && JSON.stringify(current) !== JSON.stringify(saved));

	const sexoLabel = $derived(
		sexoOptions.find((s) => s.value === saved.sexo)?.label || saved.sexo || '—'
	);

	function formatFecha(iso: string): string {
		if (!iso.trim()) return '—';
		const d = parseDateInput(iso);
		if (!d) return iso;
		return d.toLocaleDateString('es-ES');
	}

	function startEdit() {
		msg = null;
		err = null;
		nombre = saved.nombre;
		apellido1 = saved.apellido1;
		apellido2 = saved.apellido2;
		telefono = saved.telefono;
		nif = saved.nif;
		sexo = saved.sexo;
		fechaNacimiento = saved.fechaNacimiento;
		calle = saved.calle;
		cp = saved.cp;
		ciudad = saved.ciudad;
		provincia = saved.provincia;
		editing = true;
	}

	function cancelEdit() {
		if (dirty && !confirm('Tienes cambios sin guardar. ¿Descartarlos?')) return;
		nombre = saved.nombre;
		apellido1 = saved.apellido1;
		apellido2 = saved.apellido2;
		telefono = saved.telefono;
		nif = saved.nif;
		sexo = saved.sexo;
		fechaNacimiento = saved.fechaNacimiento;
		calle = saved.calle;
		cp = saved.cp;
		ciudad = saved.ciudad;
		provincia = saved.provincia;
		editing = incomplete;
		err = null;
		msg = null;
	}

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
			saved = { ...current };
			editing = false;
			msg = 'Datos actualizados';
		} catch (e) {
			err = e instanceof Error ? e.message : 'Error';
		} finally {
			saving = false;
		}
	}

	beforeNavigate(({ cancel }) => {
		if (!dirty) return;
		if (!confirm('Tienes cambios sin guardar. Si sales ahora se perderán. ¿Continuar?')) {
			cancel();
		}
	});

	$effect(() => {
		if (!browser) return;
		const onBeforeUnload = (e: BeforeUnloadEvent) => {
			if (!dirty) return;
			e.preventDefault();
			e.returnValue = '';
		};
		window.addEventListener('beforeunload', onBeforeUnload);
		return () => window.removeEventListener('beforeunload', onBeforeUnload);
	});
</script>

<header class="head">
	<div>
		<h1>Mis datos</h1>
		<p class="sub">Email de cuenta: {data.email}</p>
	</div>
	{#if !editing}
		<button type="button" class="btn" onclick={startEdit}>Editar</button>
	{/if}
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

{#if editing}
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
		<div class="actions">
			<button type="submit" class="btn" disabled={saving || !dirty}>
				{saving ? 'Guardando…' : 'Guardar'}
			</button>
			{#if !incomplete || dirty}
				<button type="button" class="btn ghost" onclick={cancelEdit} disabled={saving}>
					Cancelar
				</button>
			{/if}
		</div>
	</form>
{:else}
	<section class="card view">
		<dl>
			<div><dt>Email</dt><dd>{data.email || '—'}</dd></div>
			<div><dt>Nombre</dt><dd>{saved.nombre || '—'}</dd></div>
			<div><dt>Primer apellido</dt><dd>{saved.apellido1 || '—'}</dd></div>
			<div><dt>Segundo apellido</dt><dd>{saved.apellido2 || '—'}</dd></div>
			<div><dt>Móvil</dt><dd>{saved.telefono || '—'}</dd></div>
			<div><dt>NIF / NIE</dt><dd>{saved.nif || '—'}</dd></div>
			<div><dt>Sexo</dt><dd>{sexoLabel}</dd></div>
			<div><dt>Fecha de nacimiento</dt><dd>{formatFecha(saved.fechaNacimiento)}</dd></div>
			<div><dt>Calle</dt><dd>{saved.calle || '—'}</dd></div>
			<div><dt>Código postal</dt><dd>{saved.cp || '—'}</dd></div>
			<div><dt>Ciudad</dt><dd>{saved.ciudad || '—'}</dd></div>
			<div><dt>Provincia</dt><dd>{saved.provincia || '—'}</dd></div>
		</dl>
	</section>
{/if}

<style>
	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
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
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: 4px;
	}
	.btn {
		padding: 10px 16px;
		background: #00c6d1;
		color: #003050;
		font-weight: 700;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font: inherit;
	}
	.btn:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}
	.btn.ghost {
		background: #fff;
		border: 1px solid #c5d0da;
		color: #003050;
	}
	.view dl {
		display: grid;
		gap: 12px;
		margin: 0;
	}
	.view div {
		display: grid;
		gap: 2px;
		padding-bottom: 10px;
		border-bottom: 1px solid #e8eef3;
	}
	.view div:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}
	.view dt {
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: #5a6b7d;
	}
	.view dd {
		margin: 0;
		font-size: 0.98rem;
		color: #1a2b3c;
		overflow-wrap: anywhere;
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
