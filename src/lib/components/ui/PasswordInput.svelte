<script lang="ts">
	let {
		name = 'password',
		label = 'Contraseña',
		required = true,
		autocomplete = 'current-password',
		minlength = 6,
		value = ''
	}: {
		name?: string;
		label?: string;
		required?: boolean;
		autocomplete?: string;
		minlength?: number;
		value?: string;
	} = $props();

	let visible = $state(false);
</script>

<label class="pw-field">
	{label}
	<span class="wrap">
		<input
			type={visible ? 'text' : 'password'}
			{name}
			{required}
			{autocomplete}
			{minlength}
			{value}
		/>
		<button
			type="button"
			class="toggle"
			aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
			aria-pressed={visible}
			onclick={() => (visible = !visible)}
		>
			{#if visible}
				<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
					<path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
					<path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
					<line x1="1" y1="1" x2="23" y2="23" />
				</svg>
			{:else}
				<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
					<circle cx="12" cy="12" r="3" />
				</svg>
			{/if}
		</button>
	</span>
</label>

<style>
	.pw-field {
		display: grid;
		gap: 6px;
		font-weight: 600;
		font-size: 0.9rem;
	}

	.wrap {
		position: relative;
		display: block;
	}

	input {
		width: 100%;
		padding: 10px 44px 10px 12px;
		border: 1.5px solid #c5d0da;
		border-radius: 8px;
		font: inherit;
		font-weight: 400;
		background: #fff;
		color: var(--ink, #1a2b3c);
	}

	input:focus {
		outline: none;
		border-color: var(--border-focus, #00c6d1);
		box-shadow: 0 0 0 3px rgba(0, 198, 209, 0.2);
	}

	.toggle {
		position: absolute;
		right: 6px;
		top: 50%;
		transform: translateY(-50%);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border: none;
		background: transparent;
		color: #5a6b7d;
		cursor: pointer;
		border-radius: 6px;
		padding: 0;
	}

	.toggle:hover {
		color: var(--ink, #1a2b3c);
		background: rgba(0, 48, 80, 0.06);
	}

	.toggle:focus-visible {
		outline: 2px solid var(--border-focus, #00c6d1);
		outline-offset: 1px;
	}
</style>
