<script lang="ts">
	import { browser } from '$app/environment';
	import { beforeNavigate } from '$app/navigation';
	import type { PageData } from './$types';
	import DateInput from '$lib/components/ui/DateInput.svelte';
	import NifInput from '$lib/components/ui/NifInput.svelte';
	import { namePartsFromProfile } from '$lib/cuenta/profile-prefill';
	import { provinces, streetTypes } from '$lib/data/provinces';
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
		tipoVia: string;
		calle: string;
		numero: string;
		piso: string;
		puerta: string;
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
			tipoVia: data.direccion.tipoVia || 'Calle',
			calle: data.direccion.calle,
			numero: data.direccion.numero,
			piso: data.direccion.piso,
			puerta: data.direccion.puerta,
			cp: data.direccion.cp,
			ciudad: data.direccion.ciudad || data.direccion.municipio,
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
	let tipoVia = $state(saved.tipoVia);
	let calle = $state(saved.calle);
	let numero = $state(saved.numero);
	let piso = $state(saved.piso);
	let puerta = $state(saved.puerta);
	let cp = $state(saved.cp);
	let ciudad = $state(saved.ciudad);
	let provincia = $state(saved.provincia);
	let nifFrontalOk = $state(data.nifDocs.frontal);
	let nifTraseroOk = $state(data.nifDocs.trasero);
	let nifUploading = $state<'nif_frontal' | 'nif_trasero' | null>(null);

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
		tipoVia,
		calle,
		numero,
		piso,
		puerta,
		cp,
		ciudad,
		provincia
	} satisfies Draft);

	const dirty = $derived(editing && JSON.stringify(current) !== JSON.stringify(saved));

	const sexoLabel = $derived(
		sexoOptions.find((s) => s.value === saved.sexo)?.label || saved.sexo || '—'
	);

	const viaLabel = $derived(
		[saved.tipoVia, saved.calle, saved.numero && `nº ${saved.numero}`, saved.piso, saved.puerta]
			.filter(Boolean)
			.join(' ') || '—'
	);

	function formatFecha(iso: string): string {
		if (!iso.trim()) return '—';
		const d = parseDateInput(iso);
		if (!d) return iso;
		return d.toLocaleDateString('es-ES');
	}

	function applyDraft(d: Draft) {
		nombre = d.nombre;
		apellido1 = d.apellido1;
		apellido2 = d.apellido2;
		telefono = d.telefono;
		nif = d.nif;
		sexo = d.sexo;
		fechaNacimiento = d.fechaNacimiento;
		tipoVia = d.tipoVia;
		calle = d.calle;
		numero = d.numero;
		piso = d.piso;
		puerta = d.puerta;
		cp = d.cp;
		ciudad = d.ciudad;
		provincia = d.provincia;
	}

	function startEdit() {
		msg = null;
		err = null;
		applyDraft(saved);
		editing = true;
	}

	function cancelEdit() {
		if (dirty && !confirm('Tienes cambios sin guardar. ¿Descartarlos?')) return;
		applyDraft(saved);
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
					direccion: {
						tipoVia,
						calle,
						numero,
						piso,
						puerta,
						cp,
						ciudad,
						municipio: ciudad,
						localidad: ciudad,
						provincia
					}
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

	async function uploadNif(key: 'nif_frontal' | 'nif_trasero', fileList: FileList | null) {
		const file = fileList?.[0];
		if (!file) return;
		nifUploading = key;
		msg = null;
		err = null;
		try {
			const fd = new FormData();
			fd.set('file', file, file.name);
			fd.set('tipo', key);
			const res = await fetch('/api/cuenta/perfil/documentos', { method: 'POST', body: fd });
			const body = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(body.error || 'No se pudo subir');
			if (key === 'nif_frontal') nifFrontalOk = true;
			else nifTraseroOk = true;
			msg = 'Imagen del NIF guardada. Se usará por defecto en tus trámites.';
		} catch (e) {
			err = e instanceof Error ? e.message : 'Error al subir';
		} finally {
			nifUploading = null;
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
		<label>
			Tipo de vía
			<select bind:value={tipoVia}>
				{#each streetTypes as t}
					<option value={t}>{t}</option>
				{/each}
			</select>
		</label>
		<label>
			Nombre de la vía
			<input bind:value={calle} autocomplete="address-line1" />
		</label>
		<div class="row-3">
			<label>
				Nº
				<input bind:value={numero} />
			</label>
			<label>
				Piso
				<input bind:value={piso} />
			</label>
			<label>
				Puerta
				<input bind:value={puerta} />
			</label>
		</div>
		<label>
			Código postal
			<input bind:value={cp} autocomplete="postal-code" maxlength="5" inputmode="numeric" />
		</label>
		<label>
			Municipio / Ciudad
			<input bind:value={ciudad} autocomplete="address-level2" />
		</label>
		<label>
			Provincia
			<select bind:value={provincia} autocomplete="address-level1">
				<option value="">—</option>
				{#each provinces as p}
					<option value={p}>{p}</option>
				{/each}
			</select>
		</label>
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
			<div><dt>Dirección</dt><dd>{viaLabel}</dd></div>
			<div><dt>Código postal</dt><dd>{saved.cp || '—'}</dd></div>
			<div><dt>Municipio</dt><dd>{saved.ciudad || '—'}</dd></div>
			<div><dt>Provincia</dt><dd>{saved.provincia || '—'}</dd></div>
		</dl>
	</section>
{/if}

<section class="card docs">
	<h2>Documento de identidad</h2>
	<p class="docs-sub">
		Se carga por defecto en los trámites como NIF del titular / solicitante.
	</p>
	<div class="doc-grid">
		<label class="doc-slot">
			<span>NIF frontal {nifFrontalOk ? '✓' : ''}</span>
			<input
				type="file"
				accept="image/*,application/pdf"
				disabled={nifUploading !== null}
				onchange={(e) =>
					uploadNif('nif_frontal', (e.currentTarget as HTMLInputElement).files)}
			/>
			{#if nifUploading === 'nif_frontal'}<small>Subiendo…</small>{/if}
		</label>
		<label class="doc-slot">
			<span>NIF trasero {nifTraseroOk ? '✓' : ''}</span>
			<input
				type="file"
				accept="image/*,application/pdf"
				disabled={nifUploading !== null}
				onchange={(e) =>
					uploadNif('nif_trasero', (e.currentTarget as HTMLInputElement).files)}
			/>
			{#if nifUploading === 'nif_trasero'}<small>Subiendo…</small>{/if}
		</label>
	</div>
</section>

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
	.docs {
		margin-top: 16px;
	}
	.docs h2 {
		margin: 0 0 6px;
		font-size: 1.05rem;
		color: #003050;
	}
	.docs-sub {
		margin: 0 0 12px;
		font-size: 0.85rem;
		color: #5a6b7d;
	}
	.doc-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}
	.doc-slot {
		display: grid;
		gap: 6px;
		font-weight: 600;
		font-size: 0.85rem;
		padding: 10px;
		border: 1px dashed #c5d0da;
		border-radius: 8px;
	}
	.doc-slot input {
		font-size: 0.8rem;
	}
	.form {
		display: grid;
		gap: 12px;
	}
	.row-3 {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 10px;
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
	@media (max-width: 520px) {
		.row-3,
		.doc-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
