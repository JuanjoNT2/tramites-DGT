<script lang="ts">
	let { phone = '+34 629 314 828' } = $props();
</script>

<div class="topbar">
	<div class="wrap topbar-in">
		<span>Trámites de vehículos 100% online · 365 días al año</span>
		<a href="tel:{phone.replace(/\s/g, '')}" class="phone">{phone}</a>
	</div>
</div>

<style>
	.topbar {
		background: var(--bg-navy);
		color: rgba(255, 255, 255, 0.9);
		font-size: 13px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	.topbar-in {
		display: flex;
		justify-content: space-between;
		align-items: center;
		height: 36px;
		gap: 12px;
	}

	.phone {
		font-weight: 700;
		color: var(--brand-teal);
		white-space: nowrap;
	}

	.phone:hover {
		text-decoration: underline;
	}

	@media (max-width: 600px) {
		.topbar-in span {
			display: none;
		}
		.topbar-in {
			justify-content: center;
		}
	}
</style>
