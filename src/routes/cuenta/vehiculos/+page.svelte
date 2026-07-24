<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let items = $state(data.items);
	let matricula = $state('');
	let tipo = $state('coche');
	let marca = $state('');
	let modelo = $state('');
	let msg = $state<string | null>(null);
	let err = $state<string | null>(null);

	$effect(() => {
		items = data.items;
	});

	async function add(e: Event) {
		e.preventDefault();
		msg = null;
		err = null;
		const res = await fetch('/api/cuenta/vehiculos', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ matricula, tipo, marca, modelo })
		});
		const body = await res.json();
		if (!res.ok) {
			err = body.error || 'Error';
			return;
		}
		items = [body.item, ...items];
		matricula = '';
		marca = '';
		modelo = '';
		msg = 'Vehículo añadido';
	}

	async function remove(id: string) {
		if (!confirm('¿Eliminar este vehículo?')) return;
		const res = await fetch(`/api/cuenta/vehiculos?id=${id}`, { method: 'DELETE' });
		if (!res.ok) {
			err = 'No se pudo eliminar';
			return;
		}
		items = items.filter((v) => v.id !== id);
	}
</script>

<header class="head">
	<h1>Mis vehículos</h1>
	<p class="sub">Guarda matrículas y datos para reutilizarlos en trámites.</p>
</header>

{#if msg}<p class="ok">{msg}</p>{/if}
{#if err}<p class="err">{err}</p>{/if}

<form class="form card" onsubmit={add}>
	<label>Matrícula<input bind:value={matricula} required placeholder="3990WDS" /></label>
	<label
		>Tipo
		<select bind:value={tipo}>
			<option value="coche">Coche</option>
			<option value="moto">Moto</option>
			<option value="vmp">VMP</option>
			<option value="otro">Otro</option>
		</select>
	</label>
	<label>Marca<input bind:value={marca} /></label>
	<label>Modelo<input bind:value={modelo} /></label>
	<button type="submit" class="btn">Añadir</button>
</form>

<div class="table-wrap">
	<table>
		<thead>
			<tr>
				<th>Matrícula</th>
				<th>Tipo</th>
				<th>Marca</th>
				<th>Modelo</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#each items as v}
				<tr>
					<td>{v.matricula}</td>
					<td>{v.tipo}</td>
					<td>{v.marca || '—'}</td>
					<td>{v.modelo || '—'}</td>
					<td><button type="button" class="link" onclick={() => remove(v.id)}>Eliminar</button></td>
				</tr>
			{:else}
				<tr><td colspan="5">No tienes vehículos guardados.</td></tr>
			{/each}
		</tbody>
	</table>
</div>

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
	}
	.card {
		background: #fff;
		border: 1px solid #d8e0e8;
		border-radius: 12px;
		padding: 16px;
		margin-bottom: 16px;
	}
	.form {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 12px;
		align-items: end;
	}
	label {
		display: grid;
		gap: 4px;
		font-weight: 600;
		font-size: 0.85rem;
	}
	input,
	select {
		padding: 8px 10px;
		border: 1px solid #c5d0da;
		border-radius: 8px;
		font: inherit;
	}
	.btn {
		padding: 10px 14px;
		background: #00c6d1;
		color: #003050;
		font-weight: 700;
		border: none;
		border-radius: 8px;
		cursor: pointer;
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
	}
	.link {
		background: none;
		border: none;
		color: #9b1c1c;
		font-weight: 700;
		cursor: pointer;
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
