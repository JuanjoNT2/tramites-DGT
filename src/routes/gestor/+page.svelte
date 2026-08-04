<script lang="ts">
	import type { PageData } from './$types';
	import { SOLICITUD_STATUS_LABELS } from '$lib/supabase/types';
	import type { SolicitudStatus } from '$lib/supabase/types';

	let { data }: { data: PageData } = $props();

	const d = $derived(data.dashboard);
	const f = $derived(d.filters);
	const k = $derived(d.kpis);

	const evoClass = $derived(
		k.evolucionPct == null ? 'flat' : k.evolucionPct >= 0 ? 'up' : 'down'
	);

	function statusLabel(status: string) {
		return SOLICITUD_STATUS_LABELS[status as SolicitudStatus] || status;
	}

	function clienteHref(t: (typeof d.recentPendientes)[number]) {
		if (t.userId) return `/gestor/cliente/${t.userId}`;
		if (t.email) return `/gestor/cliente/anonimo?email=${encodeURIComponent(t.email)}`;
		return `/gestor/tramites?vista=pendientes&q=${encodeURIComponent(t.id.slice(0, 8))}`;
	}
</script>

<header class="head">
	<div>
		<h1>Dashboard gestor</h1>
		<p class="sub">
			Vista global de actividad, evolución y trabajo pendiente. Usa los filtros para comparar por
			mes o por tipo de trámite.
		</p>
	</div>
</header>

{#if d.error}
	<p class="err" role="alert">{d.error}</p>
{/if}

<section class="kpis" aria-label="Indicadores globales">
	<a class="kpi warn" href="/gestor/tramites?vista=pendientes">
		<span class="kpi-label">Pendientes</span>
		<strong class="kpi-value">{k.pendientes}</strong>
		<span class="kpi-hint">Ir a la cola →</span>
	</a>
	<a class="kpi ok" href="/gestor/tramites?vista=finalizados">
		<span class="kpi-label">Realizados con éxito</span>
		<strong class="kpi-value">{k.realizadas}</strong>
		<span class="kpi-hint">Total histórico →</span>
	</a>
	<a class="kpi" href="/gestor/usuarios?vista=todos">
		<span class="kpi-label">Usuarios</span>
		<strong class="kpi-value">{k.usuarios}</strong>
		<span class="kpi-hint">{k.usuariosConPendientes} con trámites en curso</span>
	</a>
	<a class="kpi" href="/gestor/usuarios?vista=sin_tramites">
		<span class="kpi-label">Sin trámites</span>
		<strong class="kpi-value">{k.sinTramites}</strong>
		<span class="kpi-hint">Cuentas sin solicitudes →</span>
	</a>
	<div class="kpi evo" class:up={evoClass === 'up'} class:down={evoClass === 'down'}>
		<span class="kpi-label">Evolución del mes</span>
		<strong class="kpi-value">
			{#if k.evolucionPct == null}
				—
			{:else}
				{k.evolucionPct > 0 ? '+' : ''}{k.evolucionPct}%
			{/if}
		</strong>
		<span class="kpi-hint">
			{k.realizadasMes} realizados este mes · {k.realizadasMesAnterior} el anterior · {k.creadasMes}
			nuevos
		</span>
	</div>
</section>

<section class="chart-panel" aria-label="Diagrama de barras">
	<div class="chart-head">
		<div>
			<h2>{d.chart.title}</h2>
			<p class="chart-sub">{d.chart.subtitle}</p>
		</div>
	</div>

	<form class="filters" method="GET">
		<label>
			Periodo
			<select name="rango" onchange={(e) => e.currentTarget.form?.requestSubmit()}>
				{#each d.rangoOptions as opt}
					<option value={opt.value} selected={String(f.rango) === opt.value}>{opt.label}</option>
				{/each}
			</select>
		</label>
		<label>
			Tipo de trámite
			<select name="tipo" onchange={(e) => e.currentTarget.form?.requestSubmit()}>
				{#each d.tipoOptions as opt}
					<option value={opt.value} selected={f.tipo === opt.value}>{opt.label}</option>
				{/each}
			</select>
		</label>
		<label>
			Métrica
			<select name="metrica" onchange={(e) => e.currentTarget.form?.requestSubmit()}>
				<option value="realizadas" selected={f.metrica === 'realizadas'}>Realizados con éxito</option>
				<option value="creadas" selected={f.metrica === 'creadas'}>Creados</option>
				<option value="pendientes" selected={f.metrica === 'pendientes'}
					>Pendientes (por fecha de alta)</option
				>
			</select>
		</label>
		<label>
			Agrupar
			<select name="agrupar" onchange={(e) => e.currentTarget.form?.requestSubmit()}>
				<option value="mes" selected={f.agrupar === 'mes'}>Por mes</option>
				<option value="tipo" selected={f.agrupar === 'tipo'}>Por tipo</option>
			</select>
		</label>
		<label>
			Ordenar
			<select name="orden" onchange={(e) => e.currentTarget.form?.requestSubmit()}>
				<option value="cronologico" selected={f.orden === 'cronologico'}>Cronológico</option>
				<option value="valor" selected={f.orden === 'valor'}>Mayor a menor</option>
				<option value="nombre" selected={f.orden === 'nombre'}>Nombre A–Z</option>
			</select>
		</label>
		<button type="submit" class="btn">Aplicar</button>
	</form>

	{#if d.chart.bars.every((b) => b.count === 0)}
		<p class="empty">No hay datos para estos filtros.</p>
	{:else}
		<div class="chart" role="img" aria-label={d.chart.title}>
			{#each d.chart.bars as bar}
				<div class="bar-col" title="{bar.label}: {bar.count}">
					<span class="bar-n">{bar.count}</span>
					<div class="bar-track">
						<span class="bar-fill" style="height: {(bar.count / d.chart.max) * 100}%"></span>
					</div>
					<span class="bar-label">{bar.label}</span>
				</div>
			{/each}
		</div>
	{/if}
</section>

<section class="split" aria-label="Accesos rápidos y pendientes">
	<div class="panel">
		<div class="panel-head">
			<h2>Trabajo pendiente</h2>
			<a href="/gestor/tramites?vista=pendientes">Ver cola completa</a>
		</div>
		{#if d.recentPendientes.length === 0}
			<p class="empty">No hay trámites pendientes.</p>
		{:else}
			<ul class="list">
				{#each d.recentPendientes as t}
					<li>
						<a href={clienteHref(t)}>
							<span class="list-tipo">{t.tipoLabel}</span>
							<span class="list-meta">
								{t.email || 'Sin email'}
								{#if t.matricula} · {t.matricula}{/if}
							</span>
							<span class="list-status">{statusLabel(t.status)}</span>
							<span class="list-date"
								>{new Date(t.createdAt).toLocaleDateString('es-ES')}</span
							>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	<div class="panel">
		<div class="panel-head">
			<h2>Accesos del gestor</h2>
		</div>
		<ul class="shortcuts">
			<li>
				<a href="/gestor/tramites?vista=pendientes">
					<strong>Cola de pendientes</strong>
					<span>{k.pendientes} trámites por gestionar</span>
				</a>
			</li>
			<li>
				<a href="/gestor/tramites?vista=finalizados">
					<strong>Trámites finalizados</strong>
					<span>{k.finalizados} cerrados (realizados o cancelados)</span>
				</a>
			</li>
			<li>
				<a href="/gestor/usuarios?vista=en_curso">
					<strong>Usuarios con trámites en curso</strong>
					<span>{k.usuariosConPendientes} usuarios activos</span>
				</a>
			</li>
			<li>
				<a href="/gestor/usuarios?vista=todos">
					<strong>Todos los usuarios</strong>
					<span>{k.usuarios} cuentas ciudadanas</span>
				</a>
			</li>
			<li>
				<a href="/gestor/api/export/csv?tipo=todos">
					<strong>Exportar CSV</strong>
					<span>Descarga el listado global</span>
				</a>
			</li>
		</ul>
	</div>
</section>

<style>
	.head {
		margin-bottom: 20px;
	}
	h1 {
		margin: 0 0 6px;
		color: #003050;
		font-size: 1.55rem;
	}
	h2 {
		margin: 0;
		color: #003050;
		font-size: 1.05rem;
	}
	.sub {
		margin: 0;
		color: #5a6b7d;
		font-size: 0.92rem;
		max-width: 44rem;
		line-height: 1.45;
	}
	.err {
		background: #fde8e8;
		color: #9b1c1c;
		padding: 10px 12px;
		border-radius: 8px;
		margin-bottom: 16px;
	}
	.kpis {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 12px;
		margin-bottom: 20px;
	}
	.kpi {
		background: #fff;
		border: 1px solid #d8e0e8;
		border-radius: 12px;
		padding: 14px 16px;
		display: grid;
		gap: 4px;
		text-decoration: none;
		color: inherit;
		min-width: 0;
		border-left: 4px solid #00c6d1;
	}
	.kpi.warn {
		border-left-color: #e6a23c;
	}
	.kpi.ok {
		border-left-color: #2f9e6b;
	}
	.kpi.evo {
		border-left-color: #8aa0b2;
		cursor: default;
	}
	.kpi.evo.up {
		border-left-color: #2f9e6b;
	}
	.kpi.evo.down {
		border-left-color: #c0392b;
	}
	a.kpi:hover {
		border-color: #00c6d1;
		box-shadow: 0 2px 10px rgba(0, 48, 80, 0.06);
	}
	.kpi-label {
		font-size: 0.72rem;
		font-weight: 800;
		color: #5a6b7d;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.kpi-value {
		font-size: 1.85rem;
		line-height: 1.1;
		color: #003050;
	}
	.kpi-hint {
		font-size: 0.78rem;
		color: #5a6b7d;
		line-height: 1.35;
	}
	.chart-panel,
	.panel {
		background: #fff;
		border: 1px solid #d8e0e8;
		border-radius: 12px;
		padding: 18px 20px;
	}
	.chart-panel {
		margin-bottom: 20px;
	}
	.chart-head {
		margin-bottom: 14px;
	}
	.chart-sub {
		margin: 4px 0 0;
		color: #5a6b7d;
		font-size: 0.85rem;
	}
	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		align-items: flex-end;
		margin-bottom: 20px;
		padding: 12px;
		background: #f4f7fa;
		border-radius: 10px;
	}
	.filters label {
		display: grid;
		gap: 4px;
		font-size: 0.75rem;
		font-weight: 700;
		color: #5a6b7d;
		min-width: 140px;
		flex: 1;
	}
	.filters select {
		padding: 8px 10px;
		border: 1px solid #c5d0da;
		border-radius: 8px;
		font: inherit;
		background: #fff;
	}
	.btn {
		padding: 9px 14px;
		background: #00c6d1;
		color: #003050;
		font-weight: 800;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font: inherit;
		font-size: 0.9rem;
	}
	.chart {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: minmax(56px, 1fr);
		gap: 10px;
		align-items: end;
		min-height: 240px;
		overflow-x: auto;
		padding-bottom: 4px;
	}
	.bar-col {
		display: grid;
		grid-template-rows: auto 1fr auto;
		gap: 6px;
		height: 240px;
		min-width: 0;
		justify-items: center;
	}
	.bar-n {
		font-size: 0.78rem;
		font-weight: 800;
		color: #003050;
	}
	.bar-track {
		width: 100%;
		max-width: 48px;
		height: 100%;
		background: #e8eef3;
		border-radius: 8px 8px 4px 4px;
		display: flex;
		align-items: flex-end;
		overflow: hidden;
	}
	.bar-fill {
		display: block;
		width: 100%;
		min-height: 0;
		background: linear-gradient(180deg, #00c6d1, #007f8a);
		border-radius: 8px 8px 0 0;
		transition: height 0.25s ease;
	}
	.bar-label {
		font-size: 0.68rem;
		color: #5a6b7d;
		text-align: center;
		line-height: 1.2;
		max-width: 100%;
		overflow-wrap: anywhere;
	}
	.empty {
		margin: 8px 0 0;
		color: #5a6b7d;
	}
	.split {
		display: grid;
		grid-template-columns: 1.4fr 1fr;
		gap: 16px;
	}
	.panel-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 12px;
		margin-bottom: 12px;
	}
	.panel-head a {
		font-size: 0.85rem;
		font-weight: 700;
		color: #003050;
		text-decoration: none;
	}
	.panel-head a:hover {
		text-decoration: underline;
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 8px;
	}
	.list a {
		display: grid;
		grid-template-columns: 1.2fr 1.4fr auto auto;
		gap: 8px;
		align-items: center;
		padding: 10px 12px;
		border: 1px solid #e8eef3;
		border-radius: 8px;
		text-decoration: none;
		color: inherit;
		font-size: 0.85rem;
	}
	.list a:hover {
		border-color: #00c6d1;
		background: #f7fbfc;
	}
	.list-tipo {
		font-weight: 700;
		color: #003050;
	}
	.list-meta {
		color: #5a6b7d;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.list-status {
		font-size: 0.72rem;
		font-weight: 700;
		color: #856404;
		background: #fff3cd;
		padding: 2px 8px;
		border-radius: 999px;
		white-space: nowrap;
	}
	.list-date {
		color: #5a6b7d;
		font-size: 0.78rem;
		white-space: nowrap;
	}
	.shortcuts {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 8px;
	}
	.shortcuts a {
		display: grid;
		gap: 2px;
		padding: 12px 14px;
		border: 1px solid #e8eef3;
		border-radius: 8px;
		text-decoration: none;
		color: inherit;
	}
	.shortcuts a:hover {
		border-color: #00c6d1;
		background: #f7fbfc;
	}
	.shortcuts strong {
		color: #003050;
		font-size: 0.92rem;
	}
	.shortcuts span {
		color: #5a6b7d;
		font-size: 0.8rem;
	}

	@media (max-width: 1100px) {
		.kpis {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
		.split {
			grid-template-columns: 1fr;
		}
		.list a {
			grid-template-columns: 1fr 1fr;
		}
	}
	@media (max-width: 700px) {
		.kpis {
			grid-template-columns: 1fr 1fr;
		}
		.filters label {
			min-width: 100%;
		}
	}
</style>
