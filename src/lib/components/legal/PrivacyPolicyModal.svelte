<script lang="ts">
	import PrivacyPolicyContent from './PrivacyPolicyContent.svelte';

	let {
		open = false,
		onclose
	}: {
		open?: boolean;
		onclose: () => void;
	} = $props();

	function onKeydown(e: KeyboardEvent) {
		if (open && e.key === 'Escape') onclose();
	}
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
	<div class="overlay" role="presentation" onclick={onclose}>
		<div
			class="modal"
			role="dialog"
			aria-modal="true"
			aria-labelledby="privacy-policy-heading"
			onclick={(e) => e.stopPropagation()}
		>
			<header class="head">
				<button type="button" class="close" onclick={onclose} aria-label="Cerrar">×</button>
			</header>
			<div class="body">
				<PrivacyPolicyContent />
			</div>
			<footer class="foot">
				<button type="button" class="ok" onclick={onclose}>Cerrar y volver al formulario</button>
			</footer>
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 350;
		background: rgba(0, 24, 40, 0.55);
		display: grid;
		place-items: center;
		padding: 16px;
	}
	.modal {
		width: min(720px, 100%);
		max-height: min(88vh, 900px);
		background: #fff;
		border-radius: 14px;
		border: 1px solid #d8e0e8;
		box-shadow: 0 18px 50px rgba(0, 0, 0, 0.28);
		display: flex;
		flex-direction: column;
		outline: none;
	}
	.head {
		display: flex;
		justify-content: flex-end;
		padding: 8px 10px 0;
		flex-shrink: 0;
	}
	.close {
		width: 40px;
		height: 40px;
		border: none;
		border-radius: 10px;
		background: transparent;
		font-size: 1.6rem;
		line-height: 1;
		color: #003050;
		cursor: pointer;
	}
	.close:hover {
		background: #f0f4f8;
	}
	.body {
		overflow: auto;
		padding: 0 28px 8px;
		-webkit-overflow-scrolling: touch;
	}
	.foot {
		padding: 14px 28px 20px;
		border-top: 1px solid #e6edf3;
		flex-shrink: 0;
	}
	.ok {
		width: 100%;
		padding: 12px 16px;
		border: none;
		border-radius: 10px;
		background: #00c6d1;
		color: #003050;
		font: inherit;
		font-weight: 800;
		cursor: pointer;
	}
	.ok:hover {
		filter: brightness(1.05);
	}
</style>
