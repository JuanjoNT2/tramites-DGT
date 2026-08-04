<script lang="ts">
	import PrivacyPolicyModal from './PrivacyPolicyModal.svelte';

	let {
		checked = $bindable(false),
		error = null
	}: {
		checked?: boolean;
		error?: string | null;
	} = $props();

	let open = $state(false);

	function openPolicy(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		open = true;
	}
</script>

<label class="check">
	<input type="checkbox" bind:checked />
	<span>
		Acepto la
		<a href="/politica-de-privacidad" onclick={openPolicy}>política de privacidad</a>
	</span>
</label>
{#if error}
	<p class="err">{error}</p>
{/if}

<PrivacyPolicyModal open={open} onclose={() => (open = false)} />

<style>
	.check {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		margin: 16px 0 8px;
		font-size: 14px;
		color: var(--text2, #1a2b3c);
		cursor: pointer;
		line-height: 1.45;
	}
	.check input {
		margin-top: 3px;
		flex-shrink: 0;
	}
	.check a {
		color: var(--primary, #003050);
		font-weight: 700;
		text-decoration: underline;
	}
	.err {
		color: #b42318;
		font-size: 13px;
		margin: 0 0 8px;
	}
</style>
