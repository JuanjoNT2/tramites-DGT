<script lang="ts">
	let {
		open = false,
		confirmLabel = 'Continuar al pago',
		oncancel,
		onconfirm
	}: {
		open?: boolean;
		confirmLabel?: string;
		oncancel: () => void;
		onconfirm: () => void;
	} = $props();

	function onKeydown(e: KeyboardEvent) {
		if (!open) return;
		if (e.key === 'Escape') oncancel();
	}
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
	<div class="overlay" role="presentation" onclick={oncancel}>
		<div
			class="modal"
			role="dialog"
			tabindex="-1"
			aria-modal="true"
			aria-labelledby="confirm-datos-title"
			onclick={(e) => e.stopPropagation()}
		>
			<h2 id="confirm-datos-title">Comprueba tus datos</h2>
			<p>
				Por favor, asegúrate de que los datos son correctos y que son verídicos. Un error en el
				nombre, el NIF, la matrícula o la documentación puede retrasar o invalidar el trámite ante la
				DGT.
			</p>
			<div class="actions">
				<button type="button" class="ghost" onclick={oncancel}>Revisar datos</button>
				<button type="button" class="ok" onclick={onconfirm}>{confirmLabel}</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 400;
		background: rgba(0, 24, 40, 0.55);
		display: grid;
		place-items: center;
		padding: 16px;
	}
	.modal {
		width: min(480px, 100%);
		background: #fff;
		border-radius: 14px;
		border: 1px solid #d8e0e8;
		box-shadow: 0 18px 50px rgba(0, 0, 0, 0.28);
		padding: 28px 24px 22px;
		outline: none;
	}
	h2 {
		margin: 0 0 12px;
		font-size: 1.25rem;
		color: #003050;
	}
	p {
		margin: 0 0 22px;
		color: #5a6b7d;
		line-height: 1.5;
		font-size: 0.98rem;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		justify-content: flex-end;
	}
	button {
		font: inherit;
		font-weight: 800;
		border-radius: 10px;
		padding: 11px 16px;
		cursor: pointer;
	}
	.ghost {
		background: #fff;
		color: #003050;
		border: 1px solid #c5d0da;
	}
	.ok {
		background: #00c6d1;
		color: #003050;
		border: none;
	}
</style>
