<script lang="ts">
	import type { PageData } from './$types';
	import type { SolicitudDocPeticion, SolicitudDocumento, SolicitudStatus } from '$lib/supabase/types';
	import { payloadFieldsForDisplay } from '$lib/gestor/payload-display';
	import {
		facturaClienteFromPayload,
		facturaEmitidaFromPayload,
		formatFacturaDireccion,
		solicitaFacturaFromPayload
	} from '$lib/tramite/factura-cliente';
	import { DOC_ACCEPT, documentGroupsForSolicitud } from '$lib/tramite/documentos';
	import {
		DOC_REJECTION_REASONS,
		displayDocNombre,
		documentoCubreSlot,
		peticionAbiertaPorTipo
	} from '$lib/tramite/doc-peticiones';

	let { data }: { data: PageData } = $props();
	let s = $state(data.item);
	let docs = $state(data.docs);
	let peticiones = $state(data.peticiones);
	let status = $state(String(data.item.status));
	let msg = $state<string | null>(null);
	let err = $state<string | null>(null);
	let uploading = $state(false);
	let facturando = $state(false);
	let notifying = $state(false);
	let rejectingId = $state<string | null>(null);
	let rejectReasonId = $state<string>('borrosa');
	let rejectExtra = $state('');
	let otroLabel = $state('');
	let otroMotivo = $state('');

	$effect(() => {
		s = data.item;
		docs = data.docs;
		peticiones = data.peticiones;
		status = String(data.item.status);
	});

	const payload = $derived((s.payload || {}) as Record<string, unknown>);
	const fields = $derived(payloadFieldsForDisplay(payload));
	const pideFactura = $derived(solicitaFacturaFromPayload(payload));
	const facturaEmitida = $derived(facturaEmitidaFromPayload(payload));
	const factura = $derived(facturaClienteFromPayload(payload));
	const canNotify = $derived(Boolean(s.user_id || s.email));
	const docGroups = $derived(documentGroupsForSolicitud(s.tipo, payload));

	function slotState(slotId: string): 'recibido' | 'solicitado' | 'rechazado' | 'falta' {
		const pet = peticionAbiertaPorTipo(peticiones, slotId);
		if (pet?.kind === 'rechazado') return 'rechazado';
		if (docs.some((d) => documentoCubreSlot(d, slotId))) return 'recibido';
		if (pet) return 'solicitado';
		return 'falta';
	}

	function mergePeticion(item: SolicitudDocPeticion) {
		peticiones = [
			item,
			...peticiones.filter(
				(p) => p.id !== item.id && !(p.status === 'abierta' && p.doc_type === item.doc_type)
			)
		];
	}

	function avisoFeedback(body: { emailSent?: boolean; emailSkipped?: string | null; inboxSkipped?: string | null }) {
		const parts = ['Aviso enviado'];
		if (body.inboxSkipped === 'sin_cuenta') parts.push('sin bandeja (no hay cuenta)');
		if (body.emailSkipped === 'sin_email') parts.push('sin email');
		else if (body.emailSent === false) parts.push('email no enviado');
		else if (body.emailSent) parts.push('email enviado');
		return parts.join(' · ');
	}

	async function enviarPeticion(payloadBody: Record<string, unknown>) {
		notifying = true;
		msg = null;
		err = null;
		try {
			const res = await fetch('/api/gestor/documentos/peticion', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ solicitudId: s.id, ...payloadBody })
			});
			const body = await res.json();
			if (!res.ok) throw new Error(body.error || body.message || 'No se pudo enviar el aviso');
			if (body.item) mergePeticion(body.item);
			msg = avisoFeedback(body);
			return true;
		} catch (e) {
			err = e instanceof Error ? e.message : 'Error';
			return false;
		} finally {
			notifying = false;
		}
	}

	async function solicitarSlot(docType: string, motivo?: string, docLabel?: string) {
		if (!canNotify) return false;
		return enviarPeticion({
			kind: 'pendiente',
			docType,
			motivo: motivo || undefined,
			docLabel: docLabel || undefined
		});
	}

	async function solicitarOtro() {
		const label = otroLabel.trim();
		if (!label) {
			err = 'Indica el nombre del documento';
			return;
		}
		const ok = await solicitarSlot('otro', otroMotivo.trim() || undefined, label);
		if (ok) {
			otroLabel = '';
			otroMotivo = '';
		}
	}

	async function rechazarDoc(d: SolicitudDocumento) {
		const ok = await enviarPeticion({
			kind: 'rechazado',
			documentoId: d.id,
			reasonId: rejectReasonId,
			motivo: rejectExtra.trim() || undefined
		});
		if (ok) {
			docs = docs.map((item) =>
				item.id === d.id
					? { ...item, status: 'rechazado', rejection_reason: rejectExtra || rejectReasonId }
					: item
			);
			rejectingId = null;
			rejectExtra = '';
			rejectReasonId = 'borrosa';
		}
	}

	async function emitirFactura(enviarEmail: boolean) {
		facturando = true;
		msg = null;
		err = null;
		try {
			const res = await fetch('/gestor/api/factura', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ solicitudId: s.id, enviarEmail })
			});
			const body = await res.json();
			if (!res.ok) throw new Error(body.message || body.error || 'Error al emitir la factura');
			if (body.item) s = body.item;
			msg = body.warning
				? body.warning
				: enviarEmail
					? `Factura ${body.numero} emitida y enviada.`
					: `Factura ${body.numero} emitida.`;
			window.open(`/gestor/api/factura?id=${encodeURIComponent(s.id)}`, '_blank');
		} catch (e) {
			err = e instanceof Error ? e.message : 'Error';
		} finally {
			facturando = false;
		}
	}

	async function changeStatus() {
		msg = null;
		err = null;
		const res = await fetch('/api/admin/solicitud-status', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id: s.id, status })
		});
		const body = await res.json();
		if (!res.ok) {
			err = body.error || 'Error';
			return;
		}
		s = body.item;
		msg = 'Estado actualizado (el ciudadano recibe notificación).';
	}

	async function uploadDoc(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		uploading = true;
		err = null;
		try {
			const fd = new FormData();
			fd.set('solicitud_id', s.id);
			fd.set('file', file);
			const res = await fetch('/api/cuenta/documentos', { method: 'POST', body: fd });
			const body = await res.json();
			if (!res.ok) throw new Error(body.error || 'Error');
			docs = [body.item, ...docs];
			msg = 'Documento subido';
		} catch (e) {
			err = e instanceof Error ? e.message : 'Error';
		} finally {
			uploading = false;
		}
	}
</script>

<p class="back"><a href="/gestor/tramites?vista=pendientes">← Volver a trámites</a></p>

<header class="head">
	<div>
		<h1>{data.label}</h1>
		<p class="sub">ID {s.id}</p>
	</div>
	<div class="actions">
		<a class="btn excel" href={`/gestor/api/export/excel?id=${s.id}`}>Descargar Excel</a>
		<a class="btn" href={`/gestor/api/export/pdf?id=${s.id}`}>Descargar PDF</a>
	</div>
</header>

{#if msg}<p class="ok">{msg}</p>{/if}
{#if err}<p class="err">{err}</p>{/if}

{#if pideFactura}
	<section class="card factura" class:emitida={facturaEmitida}>
		<h2>{facturaEmitida ? 'Factura emitida' : 'Factura pendiente de emitir'}</h2>
		<p class="factura-lead">
			{#if facturaEmitida}
				Nº <strong>{String(payload.facturaNumero)}</strong>
				· {payload.facturaEmitidaAt
					? new Date(String(payload.facturaEmitidaAt)).toLocaleString('es-ES')
					: ''}
				{#if payload.facturaEmitidaPor}
					· por {String(payload.facturaEmitidaPor)}
				{/if}
			{:else}
				El cliente pidió factura del servicio de gestoría. Revísala y emítela cuando el pago esté
				confirmado.
			{/if}
		</p>
		<dl class="factura-datos">
			<div><dt>Razón social</dt><dd>{factura.razonSocial || '—'}</dd></div>
			<div><dt>NIF/CIF</dt><dd>{factura.nif || '—'}</dd></div>
			<div><dt>Email</dt><dd>{factura.email || '—'}</dd></div>
			<div><dt>Dirección</dt><dd>{formatFacturaDireccion(factura)}</dd></div>
		</dl>
		<div class="factura-actions">
			{#if facturaEmitida}
				<a class="btn" href="/gestor/api/factura?id={s.id}">Descargar PDF</a>
				<button type="button" class="btn ghost" onclick={() => emitirFactura(true)} disabled={facturando}>
					{facturando ? 'Enviando…' : 'Reenviar por email'}
				</button>
			{:else}
				<button type="button" class="btn" onclick={() => emitirFactura(true)} disabled={facturando}>
					{facturando ? 'Emitiendo…' : 'Emitir y enviar'}
				</button>
				<button type="button" class="btn ghost" onclick={() => emitirFactura(false)} disabled={facturando}>
					Solo descargar
				</button>
			{/if}
		</div>
	</section>
{/if}

<dl class="meta">
	<div><dt>Estado</dt><dd>{data.statusLabels[s.status as SolicitudStatus] || s.status}</dd></div>
	<div><dt>Fecha</dt><dd>{new Date(s.created_at).toLocaleString('es-ES')}</dd></div>
	<div>
		<dt>Cliente</dt>
		<dd>
			{#if s.user_id}
				<a href="/gestor/cliente/{s.user_id}">Ver ficha del cliente</a>
			{:else}
				no registrado
			{/if}
		</dd>
	</div>
	<div class="email">
		<dt>Email</dt>
		<dd>{s.email || '—'}</dd>
	</div>
</dl>

{#if data.canChangeStatus}
	<section class="card">
		<h2>Cambiar estado (solo admin)</h2>
		<div class="status-row">
			<select bind:value={status}>
				{#each data.statuses as st}
					<option value={st}>{data.statusLabels[st]}</option>
				{/each}
			</select>
			<button type="button" class="btn" onclick={changeStatus}>Guardar estado</button>
		</div>
	</section>
{/if}

{#if data.citizen}
	<section class="card">
		<h2>Datos del cliente</h2>
		<table>
			<tbody>
				<tr><th>Nombre</th><td>{data.citizen.full_name || '—'}</td></tr>
				<tr><th>Email</th><td>{data.citizen.email || '—'}</td></tr>
				<tr><th>Teléfono</th><td>{data.citizen.telefono || '—'}</td></tr>
				<tr><th>NIF</th><td>{data.citizen.nif || '—'}</td></tr>
			</tbody>
		</table>
	</section>
{/if}

<section class="card">
	<h2>Vehículos del cliente ({data.vehiculos.length})</h2>
	{#if data.vehiculos.length}
		<table>
			<thead>
				<tr>
					<th>Matrícula</th>
					<th>Tipo</th>
					<th>Marca</th>
					<th>Modelo</th>
					<th>Bastidor</th>
				</tr>
			</thead>
			<tbody>
				{#each data.vehiculos as v}
					<tr>
						<td>
							{v.matricula}
							{#if String(s.payload?.matricula ?? '').toUpperCase() === v.matricula.toUpperCase()}
								<span class="tag">de este trámite</span>
							{/if}
						</td>
						<td>{v.tipo}</td>
						<td>{v.marca || '—'}</td>
						<td>{v.modelo || '—'}</td>
						<td>{v.bastidor || '—'}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{:else}
		<p class="empty">
			{#if s.user_id}
				Este usuario no tiene vehículos registrados en su cuenta.
			{:else}
				Solicitud sin registro: no hay cuenta vinculada. Revisa la matrícula en el formulario.
			{/if}
		</p>
		{#if s.payload?.matricula}
			<p class="hint">Matrícula del trámite: <strong>{String(s.payload.matricula)}</strong></p>
		{/if}
	{/if}
</section>

<section class="card">
	<h2>Datos del trámite</h2>
	{#if fields.length}
		<table>
			<tbody>
				{#each fields as row}
					<tr>
						<th>{row.label}</th>
						<td>{row.value}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{:else}
		<p class="empty">No hay datos de formulario en esta solicitud.</p>
	{/if}
</section>

<section class="card">
	<h2>Documentos</h2>
	{#if !canNotify}
		<p class="hint">
			Este trámite no tiene cuenta ni email: no se puede notificar al ciudadano una petición o un
			rechazo.
		</p>
	{/if}

	{#each docGroups as group}
		<div class="slot-group">
			<h3>{group.title}</h3>
			<ul class="slots">
				{#each group.slots as slot}
					{@const st = slotState(slot.id)}
					<li class="slot-row" class:ok={st === 'recibido'} class:warn={st === 'solicitado'} class:bad={st === 'rechazado'}>
						<div>
							<strong>{slot.label}</strong>
							{#if slot.required}<span class="tag">obligatorio</span>{/if}
							<small>
								{#if st === 'recibido'}Recibido
								{:else if st === 'solicitado'}Solicitado al cliente
								{:else if st === 'rechazado'}Rechazado — falta nueva foto
								{:else}Pendiente de aportar{/if}
							</small>
						</div>
						{#if st !== 'recibido'}
							<button
								type="button"
								class="btn ghost"
								disabled={!canNotify || notifying}
								onclick={() => solicitarSlot(slot.id)}
							>
								{st === 'solicitado' || st === 'rechazado' ? 'Reenviar aviso' : 'Solicitar'}
							</button>
						{/if}
					</li>
				{/each}
			</ul>
		</div>
	{/each}

	<div class="otro-box">
		<h3>Otro documento</h3>
		<p class="hint">Pide algo que no esté en el catálogo (p. ej. autorización, denuncia, contrato).</p>
		<div class="otro-row">
			<input type="text" bind:value={otroLabel} maxlength={160} placeholder="Nombre del documento" disabled={!canNotify} />
			<input type="text" bind:value={otroMotivo} maxlength={500} placeholder="Instrucciones (opcional)" disabled={!canNotify} />
			<button type="button" class="btn" disabled={!canNotify || notifying || !otroLabel.trim()} onclick={solicitarOtro}>
				Solicitar
			</button>
		</div>
	</div>

	<ul class="docs">
		{#each docs as d}
			<li class="doc-row" class:rechazado={d.status === 'rechazado'}>
				{#if d.mime?.startsWith('image/')}
					<a class="thumb" href={`/api/cuenta/documentos?download=${d.id}`} target="_blank" rel="noopener">
						<img src={`/api/cuenta/documentos?download=${d.id}`} alt={displayDocNombre(d.nombre)} />
					</a>
				{:else}
					<div class="thumb pdf" aria-hidden="true">PDF</div>
				{/if}
				<div class="doc-meta">
					<a href={`/api/cuenta/documentos?download=${d.id}`}>{displayDocNombre(d.nombre)}</a>
					<small>
						{d.uploaded_by} · {new Date(d.created_at).toLocaleString('es-ES')}
						{#if d.status === 'rechazado'}
							· rechazado{d.rejection_reason ? `: ${d.rejection_reason}` : ''}
						{/if}
					</small>
					<a class="dl" href={`/api/cuenta/documentos?download=${d.id}`}>Descargar</a>
					{#if d.status !== 'rechazado'}
						{#if rejectingId === d.id}
							<div class="reject-form">
								<select bind:value={rejectReasonId}>
									{#each DOC_REJECTION_REASONS as r}
										<option value={r.id}>{r.label}</option>
									{/each}
								</select>
								<input type="text" bind:value={rejectExtra} maxlength={500} placeholder="Detalle para el cliente (opcional)" />
								<div class="reject-actions">
									<button type="button" class="btn danger" disabled={!canNotify || notifying} onclick={() => rechazarDoc(d)}>
										Confirmar rechazo
									</button>
									<button type="button" class="btn ghost" onclick={() => (rejectingId = null)}>Cancelar</button>
								</div>
							</div>
						{:else}
							<button
								type="button"
								class="btn ghost danger-ghost"
								disabled={!canNotify || notifying}
								onclick={() => {
									rejectingId = d.id;
									rejectReasonId = 'borrosa';
									rejectExtra = '';
								}}
							>
								Rechazar (DGT)
							</button>
						{/if}
					{/if}
				</div>
			</li>
		{:else}
			<li class="empty">Sin documentos.</li>
		{/each}
	</ul>
	<label class="upload">
		Subir documento
		<input type="file" accept={DOC_ACCEPT} onchange={uploadDoc} disabled={uploading} />
	</label>
</section>

<style>
	.back {
		margin: 0 0 16px;
	}
	.back a {
		color: #003050;
		font-weight: 600;
		text-decoration: none;
	}
	.head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 16px;
		margin-bottom: 20px;
		flex-wrap: wrap;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	h1 {
		margin: 0 0 4px;
		color: #003050;
	}
	.sub {
		margin: 0;
		color: #5a6b7d;
		font-size: 0.85rem;
		word-break: break-all;
	}
	.btn {
		display: inline-flex;
		align-items: center;
		padding: 8px 14px;
		background: #00c6d1;
		color: #003050;
		font-weight: 700;
		border-radius: 8px;
		text-decoration: none;
		border: none;
		cursor: pointer;
		font: inherit;
	}
	.btn.excel {
		background: #217346;
		color: #fff;
		border: 1px solid #1a5c38;
	}
	.btn.excel:hover {
		background: #1a5c38;
		color: #fff;
	}
	.btn.ghost {
		background: #e8eef3;
	}
	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.factura {
		border-color: #f0b429;
		background: #fffbeb;
	}
	.factura.emitida {
		border-color: #86d4a8;
		background: #f0fdf4;
	}
	.factura-lead {
		margin: 0 0 12px;
		color: #5a6b7d;
		font-size: 0.9rem;
	}
	.factura-datos {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 10px 16px;
		margin: 0 0 14px;
	}
	.factura-datos dt {
		font-size: 0.72rem;
	}
	.factura-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.meta {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 12px;
		margin: 0 0 20px;
	}
	.meta div {
		background: #fff;
		border: 1px solid #d8e0e8;
		border-radius: 10px;
		padding: 12px 14px;
		min-width: 0;
	}
	.meta .email {
		grid-column: 1 / -1;
	}
	dt {
		font-size: 0.75rem;
		color: #5a6b7d;
		font-weight: 700;
		text-transform: uppercase;
	}
	dd {
		margin: 4px 0 0;
		overflow-wrap: anywhere;
		word-break: break-word;
	}
	@media (max-width: 720px) {
		.meta {
			grid-template-columns: 1fr;
		}
		.factura-datos {
			grid-template-columns: 1fr;
		}
	}
	.card {
		background: #fff;
		border: 1px solid #d8e0e8;
		border-radius: 12px;
		padding: 16px 18px;
		margin-bottom: 16px;
	}
	h2 {
		margin: 0 0 12px;
		font-size: 1rem;
		color: #003050;
	}
	h3 {
		margin: 0 0 8px;
		font-size: 0.9rem;
		color: #003050;
	}
	.slot-group {
		margin-bottom: 14px;
	}
	.slots {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 8px;
	}
	.slot-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
		padding: 10px 12px;
		border: 1px solid #e8eef3;
		border-radius: 10px;
		background: #f8fafc;
	}
	.slot-row.ok {
		border-color: #86d4a8;
		background: #f0fdf4;
	}
	.slot-row.warn {
		border-color: #f0b429;
		background: #fffbeb;
	}
	.slot-row.bad {
		border-color: #f0a0a0;
		background: #fef2f2;
	}
	.slot-row strong {
		display: block;
	}
	.slot-row small {
		display: block;
		margin-top: 2px;
		color: #5a6b7d;
	}
	.otro-box {
		margin: 8px 0 16px;
		padding: 12px;
		border: 1px dashed #c5d0da;
		border-radius: 10px;
	}
	.otro-row {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.otro-row input {
		flex: 1 1 160px;
		padding: 8px 10px;
		border-radius: 8px;
		border: 1px solid #c5d0da;
		font: inherit;
	}
	.doc-row.rechazado {
		border-color: #f0a0a0;
		background: #fef2f2;
	}
	.reject-form {
		display: grid;
		gap: 8px;
		margin-top: 8px;
	}
	.reject-form input,
	.reject-form select {
		width: 100%;
	}
	.reject-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.btn.danger {
		background: #9b1c1c;
		color: #fff;
	}
	.btn.danger-ghost {
		color: #9b1c1c;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}
	th,
	td {
		text-align: left;
		padding: 8px 6px;
		border-bottom: 1px solid #e8eef3;
		vertical-align: top;
	}
	th {
		width: 30%;
		color: #5a6b7d;
		font-weight: 600;
	}
	.status-row {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
		align-items: center;
	}
	select {
		padding: 8px 10px;
		border-radius: 8px;
		border: 1px solid #c5d0da;
		font: inherit;
	}
	.docs {
		list-style: none;
		margin: 0 0 12px;
		padding: 0;
		display: grid;
		gap: 12px;
	}
	.doc-row {
		display: flex;
		gap: 12px;
		align-items: center;
		padding: 10px;
		background: #f8fafc;
		border-radius: 10px;
		border: 1px solid #e8eef3;
	}
	.thumb {
		width: 72px;
		height: 72px;
		border-radius: 8px;
		overflow: hidden;
		flex-shrink: 0;
		background: #e8eef3;
		display: flex;
		align-items: center;
		justify-content: center;
		text-decoration: none;
	}
	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.thumb.pdf {
		font-size: 0.7rem;
		font-weight: 800;
		color: #5a6b7d;
	}
	.doc-meta {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}
	.doc-meta a {
		font-weight: 700;
		color: #003050;
		word-break: break-word;
	}
	.doc-meta small {
		color: #5a6b7d;
	}
	.doc-meta .dl {
		font-size: 0.85rem;
		font-weight: 600;
		color: #00a8b3;
	}
	.docs li {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		padding: 8px 0;
		border-bottom: 1px solid #e8eef3;
	}
	.empty {
		color: #5a6b7d;
	}
	.hint {
		margin: 8px 0 0;
		font-size: 0.9rem;
		color: #5a6b7d;
	}
	.tag {
		display: inline-block;
		margin-left: 8px;
		padding: 2px 8px;
		border-radius: 999px;
		background: #e0f7fa;
		color: #006064;
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
	}
	.upload {
		display: grid;
		gap: 6px;
		font-weight: 600;
		font-size: 0.9rem;
	}
	.ok {
		background: #e8f5ee;
		color: #0f5132;
		padding: 10px;
		border-radius: 8px;
	}
	.err {
		background: #fde8e8;
		color: #9b1c1c;
		padding: 10px;
		border-radius: 8px;
	}
</style>
