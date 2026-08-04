<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function clientHref(c: PageData['items'][number]) {
		if (c.userId) return `/gestor/cliente/${c.userId}`;
		const email = (c.email || '').trim();
		if (!email) return null;
		return `/gestor/cliente/anonimo?email=${encodeURIComponent(email)}`;
	}

	function qParam(vista: string) {
		const q = encodeURIComponent(data.q);
		return q ? `vista=${vista}&q=${q}` : `vista=${vista}`;
	}
</script>

<header class="head">
	<div>
		<h1>{data.title}</h1>
		<p class="sub">
			Ciudadanos de la web (no incluye gestores ni admins). Filtra por estado de sus trámites.
			Pulsa el nombre o <strong>Ver ficha</strong> para abrir los datos, trámites y vehículos de
			cada usuario.
		</p>
	</div>
	<div class="exports">
		<a class="btn secondary" href="/gestor/tramites?vista=pendientes">Ver cola de trámites</a>
		<a class="btn" href="/gestor/api/export/csv?tipo=todos">CSV trámites</a>
	</div>
</header>

{#if data.error}
	<p class="err">{data.error}</p>
{/if}

<nav class="tabs" aria-label="Filtro de usuarios">
	<a href="/gestor?{qParam('todos')}" class:active={data.vista === 'todos'}>
		Todos <span>{data.counts.todos}</span>
	</a>
	<a href="/gestor?{qParam('en_curso')}" class:active={data.vista === 'en_curso'}>
		Con trámites en curso <span>{data.counts.en_curso}</span>
	</a>
	<a href="/gestor?{qParam('finalizados')}" class:active={data.vista === 'finalizados'}>
		Trámites finalizados <span>{data.counts.finalizados}</span>
	</a>
	<a href="/gestor?{qParam('sin_tramites')}" class:active={data.vista === 'sin_tramites'}>
		Sin trámites <span>{data.counts.sin_tramites}</span>
	</a>
</nav>

<form class="filters" method="GET">
	<input type="hidden" name="vista" value={data.vista} />
	<label>
		Buscar usuario
		<input
			type="search"
			name="q"
			value={data.q}
			placeholder="email, nombre, NIF, teléfono, matrícula…"
		/>
	</label>
	<button type="submit" class="btn secondary">Filtrar</button>
</form>

<div class="table-wrap">
	<table>
		<thead>
			<tr>
				<th>Usuario</th>
				<th>Email</th>
				<th>Teléfono</th>
				<th>NIF</th>
				<th>En curso</th>
				<th>Finalizados</th>
				<th>Matrículas</th>
				<th>Última actividad</th>
				<th>Ficha</th>
			</tr>
		</thead>
		<tbody>
			{#each data.items as c}
				{@const href = clientHref(c)}
				<tr>
					<td>
						{#if href}
							<a class="name-link" href={href}>{c.fullName || 'Sin nombre'}</a>
						{:else}
							<strong>{c.fullName || '—'}</strong>
						{/if}
						{#if c.anonimo}<span class="tag">sin cuenta</span>{/if}
					</td>
					<td class="email">{c.email || '—'}</td>
					<td>{c.telefono || '—'}</td>
					<td>{c.nif || '—'}</td>
					<td>{c.pendingCount}</td>
					<td>{c.doneCount}</td>
					<td>{c.matriculas.join(', ') || '—'}</td>
					<td>
						{c.lastAt ? new Date(c.lastAt).toLocaleString('es-ES') : '—'}
					</td>
					<td class="action">
						{#if href}
							<a class="btn-ficha" href={href}>Ver ficha</a>
						{:else}
							<span class="muted">Sin enlace</span>
						{/if}
					</td>
				</tr>
			{:else}
				<tr>
					<td colspan="9" class="empty">No hay usuarios en esta vista.</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

{#if data.items.length}
	<ul class="cards" aria-label="Usuarios">
		{#each data.items as c}
			{@const href = clientHref(c)}
			<li class="card">
				<div class="card-top">
					{#if href}
						<a class="name-link" href={href}>{c.fullName || 'Sin nombre'}</a>
					{:else}
						<strong>{c.fullName || '—'}</strong>
					{/if}
					{#if c.anonimo}<span class="tag">sin cuenta</span>{/if}
				</div>
				<p class="email">{c.email || '—'}</p>
				<dl class="meta">
					<div><dt>Teléfono</dt><dd>{c.telefono || '—'}</dd></div>
					<div><dt>NIF</dt><dd>{c.nif || '—'}</dd></div>
					<div><dt>En curso</dt><dd>{c.pendingCount}</dd></div>
					<div><dt>Finalizados</dt><dd>{c.doneCount}</dd></div>
				</dl>
				{#if c.matriculas.length}
					<p class="mats">Matrículas: {c.matriculas.join(', ')}</p>
				{/if}
				{#if href}
					<a class="btn-ficha" href={href}>Ver ficha</a>
				{/if}
			</li>
		{/each}
	</ul>
{/if}

<style>
	.head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 16px;
		flex-wrap: wrap;
		margin-bottom: 20px;
	}
	h1 {
		margin: 0 0 6px;
		color: #003050;
		font-size: 1.5rem;
	}
	.sub {
		margin: 0;
		color: #5a6b7d;
		font-size: 0.9rem;
		max-width: 42rem;
	}
	.exports {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}
	.btn {
		display: inline-flex;
		padding: 8px 14px;
		background: #00c6d1;
		color: #003050;
		font-weight: 700;
		border-radius: 8px;
		text-decoration: none;
		border: none;
		cursor: pointer;
		font: inherit;
		font-size: 0.9rem;
	}
	.btn.secondary {
		background: #e8eef3;
	}
	.err {
		background: #fde8e8;
		color: #9b1c1c;
		padding: 10px 12px;
		border-radius: 8px;
	}
	.tabs {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-bottom: 16px;
	}
	.tabs a {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		border-radius: 999px;
		background: #fff;
		border: 1px solid #d8e0e8;
		color: #003050;
		text-decoration: none;
		font-weight: 600;
		font-size: 0.85rem;
	}
	.tabs a.active {
		background: #003050;
		color: #fff;
		border-color: #003050;
	}
	.tabs span {
		background: rgba(0, 0, 0, 0.08);
		padding: 2px 8px;
		border-radius: 999px;
		font-size: 0.75rem;
	}
	.tabs a.active span {
		background: rgba(255, 255, 255, 0.2);
	}
	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		align-items: flex-end;
		margin-bottom: 16px;
	}
	.filters label {
		display: grid;
		gap: 4px;
		font-size: 0.8rem;
		font-weight: 600;
		color: #5a6b7d;
	}
	.filters input {
		padding: 8px 10px;
		border: 1px solid #c5d0da;
		border-radius: 8px;
		font: inherit;
		min-width: 280px;
	}
	.table-wrap {
		overflow: auto;
		background: #fff;
		border: 1px solid #d8e0e8;
		border-radius: 12px;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}
	th,
	td {
		text-align: left;
		padding: 12px 14px;
		border-bottom: 1px solid #e8eef3;
		vertical-align: top;
	}
	th {
		background: #f4f7fa;
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #5a6b7d;
		white-space: nowrap;
	}
	th:last-child,
	td.action {
		position: sticky;
		right: 0;
		background: #fff;
		box-shadow: -6px 0 8px -6px rgba(0, 48, 80, 0.18);
	}
	th:last-child {
		background: #f4f7fa;
	}
	.empty {
		color: #5a6b7d;
		text-align: center;
		padding: 28px !important;
	}
	.tag {
		display: inline-block;
		margin-left: 6px;
		padding: 1px 6px;
		border-radius: 999px;
		background: #fff3cd;
		color: #856404;
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
	}
	.name-link {
		color: #003050;
		font-weight: 800;
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.name-link:hover {
		color: #00a8b0;
	}
	.email {
		overflow-wrap: anywhere;
		word-break: break-word;
	}
	.btn-ficha {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 7px 12px;
		background: #003050;
		color: #fff !important;
		font-weight: 700;
		font-size: 0.8rem;
		border-radius: 8px;
		text-decoration: none !important;
		white-space: nowrap;
	}
	.btn-ficha:hover {
		background: #004a6e;
	}
	.muted {
		color: #8a9aab;
		font-size: 0.8rem;
	}
	.cards {
		display: none;
		list-style: none;
		margin: 0;
		padding: 0;
		gap: 12px;
	}
	.card {
		background: #fff;
		border: 1px solid #d8e0e8;
		border-radius: 12px;
		padding: 14px 16px;
		display: grid;
		gap: 8px;
	}
	.card-top {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 6px;
	}
	.card .email {
		margin: 0;
		color: #5a6b7d;
		font-size: 0.9rem;
	}
	.meta {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
		margin: 0;
	}
	.meta dt {
		font-size: 0.68rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #5a6b7d;
	}
	.meta dd {
		margin: 2px 0 0;
		font-weight: 600;
	}
	.mats {
		margin: 0;
		font-size: 0.85rem;
		color: #5a6b7d;
	}
	.card .btn-ficha {
		justify-self: start;
		margin-top: 4px;
	}

	@media (max-width: 860px) {
		.table-wrap {
			display: none;
		}
		.cards {
			display: grid;
		}
		.filters input {
			min-width: 0;
			width: 100%;
		}
	}
</style>
