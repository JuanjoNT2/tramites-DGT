<script lang="ts">
	let {
		label,
		error = null,
		hint = null,
		required = false,
		children
	}: {
		label: string;
		error?: string | null;
		hint?: string | null;
		required?: boolean;
		children: import('svelte').Snippet;
	} = $props();
</script>

<div class="field" class:has-error={!!error}>
	<label class="label">
		{label}
		{#if required}<span class="req">*</span>{/if}
	</label>
	{#if hint}<p class="hint">{hint}</p>{/if}
	{@render children()}
	{#if error}<p class="error" role="alert">{error}</p>{/if}
</div>

<style>
	.field {
		margin-bottom: 20px;
	}

	.label {
		display: block;
		font-size: 14px;
		font-weight: 700;
		color: var(--ink);
		margin-bottom: 6px;
	}

	.req {
		color: var(--error);
	}

	.hint {
		font-size: 13px;
		color: var(--text3);
		margin-bottom: 8px;
		line-height: 1.4;
	}

	:global(.field input),
	:global(.field select),
	:global(.field textarea) {
		width: 100%;
		height: 48px;
		padding: 0 14px;
		border: 1.5px solid var(--border);
		border-radius: var(--radius);
		font-size: 16px;
		color: var(--ink);
		background: #fff;
		transition: border-color 0.15s, box-shadow 0.15s;
	}

	:global(.field textarea) {
		height: auto;
		min-height: 100px;
		padding: 12px 14px;
		resize: vertical;
	}

	:global(.field input:focus),
	:global(.field select:focus),
	:global(.field textarea:focus) {
		outline: none;
		border-color: var(--border-focus);
		box-shadow: 0 0 0 3px rgba(0, 87, 166, 0.2);
	}

	.has-error :global(input),
	.has-error :global(select),
	.has-error :global(textarea) {
		border-color: var(--error);
	}

	.error {
		font-size: 13px;
		color: var(--error);
		margin-top: 6px;
		font-weight: 500;
	}
</style>
