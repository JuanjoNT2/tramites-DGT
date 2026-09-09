<script lang="ts">
	import type { DatePreset, DateRange } from '$lib/admin/types';
	import { formatRangeLabel, normalizePreset, rangeQuery, toIsoWeekValue } from '$lib/admin/dates';

	let {
		range,
		title,
		children
	}: {
		range: DateRange;
		title: string;
		children: import('svelte').Snippet;
	} = $props();

	const q = $derived(rangeQuery(range));
	const periodLabel = $derived(formatRangeLabel(range));
	const currentYear = new Date().getFullYear();

	let preset = $state<DatePreset>(normalizePreset(range.preset));

	$effect(() => {
		preset = normalizePreset(range.preset);
	});

	const links = [
		{ href: '/admin', label: 'Overview' },
		{ href: '/admin/canales', label: 'Canales' },
		{ href: '/admin/eventos', label: 'Eventos' },
		{ href: '/admin/funnel', label: 'Funnel' },
		{ href: '/admin/conexiones', label: 'Conexiones' },
		{ href: '/admin/etiquetado', label: 'Etiquetado' },
		{ href: '/admin/datalayer', label: 'Data layer' },
		{ href: '/admin/usuarios', label: 'Usuarios' },
		{ href: '/admin/notificaciones', label: 'Notificaciones' }
	];

	function withRange(href: string) {
		return `${href}?${q}`;
	}
</script>

<div class="admin">
	<aside class="side">
		<div class="brand">Analítica GA4</div>
		<nav>
			{#each links as l}
				<a href={withRange(l.href)}>{l.label}</a>
			{/each}
		</nav>
		<form method="POST" action="/admin/api/logout" class="logout">
			<button type="submit">Cerrar sesión</button>
		</form>
	</aside>
	<div class="main">
		<header class="top">
			<div>
				<h1>{title}</h1>
				<p class="period">{periodLabel}</p>
			</div>
			<form class="filters" method="GET">
				<label class="field">
					<span>Ver por</span>
					<select name="preset" bind:value={preset}>
						<option value="day">Día</option>
						<option value="week">Semana</option>
						<option value="month">Mes</option>
						<option value="year">Año</option>
					</select>
				</label>
				<div class="range-fields">
					{#if preset === 'day'}
						<label class="field">
							<span>Desde</span>
							<input type="date" name="start" value={range.startDate} />
						</label>
						<span class="sep" aria-hidden="true">→</span>
						<label class="field">
							<span>Hasta</span>
							<input type="date" name="end" value={range.endDate} />
						</label>
					{:else if preset === 'week'}
						<label class="field">
							<span>Desde</span>
							<input
								type="week"
								name="start"
								value={toIsoWeekValue(range.startDate)}
								placeholder="AAAA-WSS"
							/>
						</label>
						<span class="sep" aria-hidden="true">→</span>
						<label class="field">
							<span>Hasta</span>
							<input
								type="week"
								name="end"
								value={toIsoWeekValue(range.endDate)}
								placeholder="AAAA-WSS"
							/>
						</label>
					{:else if preset === 'month'}
						<label class="field">
							<span>Desde</span>
							<input type="month" name="start" value={range.startDate.slice(0, 7)} />
						</label>
						<span class="sep" aria-hidden="true">→</span>
						<label class="field">
							<span>Hasta</span>
							<input type="month" name="end" value={range.endDate.slice(0, 7)} />
						</label>
					{:else}
						<label class="field">
							<span>Desde</span>
							<input
								class="year"
								type="number"
								name="start"
								inputmode="numeric"
								min="2018"
								max={currentYear}
								step="1"
								value={range.startDate.slice(0, 4)}
							/>
						</label>
						<span class="sep" aria-hidden="true">→</span>
						<label class="field">
							<span>Hasta</span>
							<input
								class="year"
								type="number"
								name="end"
								inputmode="numeric"
								min="2018"
								max={currentYear}
								step="1"
								value={range.endDate.slice(0, 4)}
							/>
						</label>
					{/if}
				</div>
				<button type="submit" class="btn">Aplicar</button>
			</form>
		</header>
		<div class="content">
			{@render children()}
		</div>
	</div>
</div>

<style>
	.admin {
		display: grid;
		grid-template-columns: 220px 1fr;
		min-height: 100vh;
		background: #f4f7fa;
		color: #1a2b3c;
		font-family: 'Open Sans', system-ui, sans-serif;
	}
	.side {
		background: #003050;
		color: #fff;
		padding: 24px 16px;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}
	.brand {
		font-weight: 800;
		font-size: 15px;
		color: #00c6d1;
	}
	nav {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	nav a {
		padding: 10px 12px;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
	}
	nav a:hover {
		background: rgba(0, 198, 209, 0.15);
		color: #00c6d1;
	}
	.logout {
		margin-top: auto;
	}
	.logout button {
		width: 100%;
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.25);
		color: #fff;
		padding: 10px;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 600;
	}
	.main {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.top {
		display: flex;
		justify-content: space-between;
		gap: 16px;
		align-items: center;
		padding: 20px 28px;
		flex-wrap: wrap;
		background: #fff;
		border-bottom: 1px solid #e2e8f0;
	}
	h1 {
		font-size: 22px;
		font-weight: 800;
		margin: 0;
	}
	.period {
		margin: 4px 0 0;
		font-size: 13px;
		color: #5a6b7d;
	}
	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		align-items: flex-end;
	}
	.range-fields {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		align-items: flex-end;
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.field span {
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: #5a6b7d;
	}
	.sep {
		padding-bottom: 8px;
		color: #94a3b8;
		font-weight: 700;
	}
	.filters select,
	.filters input {
		height: 36px;
		border: 1px solid #cbd5e1;
		border-radius: 6px;
		padding: 0 10px;
		font: inherit;
		background: #fff;
		min-width: 0;
	}
	.filters input[type='month'],
	.filters input[type='week'] {
		min-width: 10.5rem;
	}
	.filters input.year {
		width: 5.75rem;
	}
	.filters .btn {
		height: 36px;
		padding: 0 16px;
		background: #003050;
		color: #fff;
		border: none;
		border-radius: 6px;
		font-weight: 700;
		cursor: pointer;
	}
	.content {
		padding: 24px 28px 48px;
	}
	@media (max-width: 900px) {
		.admin {
			grid-template-columns: 1fr;
		}
		.side {
			flex-direction: row;
			flex-wrap: wrap;
			align-items: center;
		}
		nav {
			flex-direction: row;
			flex-wrap: wrap;
		}
		.logout {
			margin-top: 0;
		}
	}
</style>
