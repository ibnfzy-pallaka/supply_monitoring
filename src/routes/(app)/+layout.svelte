<script lang="ts">
	import { enhance } from '$app/forms'
	import { page } from '$app/state'

	let { data, children } = $props()

	let menuTerbuka = $state(false)

	const nav = [
		{ href: '/dashboard', label: 'Dashboard', ownerOnly: false },
		{ href: '/bahan-baku', label: 'Bahan Baku', ownerOnly: false },
		{ href: '/kategori', label: 'Kategori', ownerOnly: false },
		{ href: '/supplier', label: 'Supplier', ownerOnly: false },
		{ href: '/transaksi', label: 'Transaksi', ownerOnly: false },
		{ href: '/monitoring', label: 'Monitoring', ownerOnly: false },
		{ href: '/laporan', label: 'Laporan', ownerOnly: false },
		{ href: '/notifikasi', label: 'Notifikasi', ownerOnly: false },
		{ href: '/users', label: 'Manajemen User', ownerOnly: true }
	]

	const visibleNav = $derived(nav.filter((n) => !n.ownerOnly || data.profile.role === 'owner'))
	const current = $derived(page.url.pathname)

	// Tutup drawer menu mobile saat navigasi route berubah
	$effect(() => {
		const _ = page.url.pathname
		menuTerbuka = false
	})
</script>

<svelte:head>
	<title>Sistem Persediaan Bahan Baku — Kopi Waskita</title>
</svelte:head>

<!-- Header bar khusus mobile -->
<header class="mobile-topbar" aria-label="Navigasi ponsel">
	<div class="brand">
		<svg class="logo" viewBox="0 0 24 24" aria-hidden="true">
			<path d="M12 3.5c4.5 2.8 4.5 8.2 0 17-4.5-8.8-4.5-14.2 0-17Z" fill="none" stroke="currentColor" stroke-width="1.6"/>
			<path d="M12 5v15" stroke="currentColor" stroke-width="1.2"/>
		</svg>
		<div>
			<strong>Kopi Waskita</strong>
			<small>Persediaan Bahan Baku</small>
		</div>
	</div>

	<button
		type="button"
		class="menu-toggle"
		aria-label={menuTerbuka ? 'Tutup navigasi' : 'Buka navigasi'}
		aria-expanded={menuTerbuka}
		onclick={() => (menuTerbuka = !menuTerbuka)}
	>
		{#if menuTerbuka}
			<span class="icon">✕</span>
		{:else}
			<span class="icon">☰</span>
		{/if}
		<span class="menu-label">Menu</span>
		{#if (data.notifBelumDibaca ?? 0) > 0}
			<span class="notif-badge">{data.notifBelumDibaca}</span>
		{/if}
	</button>
</header>

<!-- Backdrop saat menu terbuka di mobile -->
{#if menuTerbuka}
	<button
		type="button"
		class="drawer-backdrop"
		aria-label="Tutup menu overlay"
		onclick={() => (menuTerbuka = false)}
	></button>
{/if}

<div class="shell">
	<aside class="sidebar" class:sidebar--open={menuTerbuka}>
		<div class="brand brand--desktop">
			<svg class="logo" viewBox="0 0 24 24" aria-hidden="true">
				<path d="M12 3.5c4.5 2.8 4.5 8.2 0 17-4.5-8.8-4.5-14.2 0-17Z" fill="none" stroke="currentColor" stroke-width="1.6"/>
				<path d="M12 5v15" stroke="currentColor" stroke-width="1.2"/>
			</svg>
			<div>
				<strong>Kopi Waskita</strong>
				<small>Persediaan Bahan Baku</small>
			</div>
		</div>

		<nav aria-label="Utama">
			{#each visibleNav as item (item.href)}
				<a
					href={item.href}
					class:active={current === item.href || (item.href !== '/dashboard' && current.startsWith(item.href + '/'))}
					onclick={() => (menuTerbuka = false)}
				>
					{item.label}
					{#if item.href === '/notifikasi'}
						<span class="notif-badge" class:notif-badge--nol={data.notifBelumDibaca === 0}>
							{data.notifBelumDibaca ?? 0}
						</span>
					{/if}
				</a>
			{/each}
		</nav>

		<div class="userbox">
			<a class="who" href="/profil" title="Profil & ganti password" onclick={() => (menuTerbuka = false)}>
				<strong>{data.profile.nama}</strong>
				<span>{data.profile.role === 'owner' ? 'Owner' : 'Staff'} · Profil</span>
			</a>
			<form
				method="POST"
				action="/logout"
				use:enhance={() => {
					return async ({ update }) => {
						await update()
					}
				}}
			>
				<button type="submit" class="logout">Keluar</button>
			</form>
		</div>
	</aside>

	<main class="content">
		{@render children()}
	</main>
</div>

<style>
	.shell {
		display: grid;
		grid-template-columns: 15rem minmax(0, 1fr);
		min-height: 100dvh;
	}

	.mobile-topbar {
		display: none;
	}

	.drawer-backdrop {
		display: none;
	}

	.sidebar {
		background: var(--color-ink);
		color: var(--color-paper);
		display: flex;
		flex-direction: column;
		padding: var(--space-lg) var(--space-md);
		gap: var(--space-xl);
	}

	.brand {
		display: flex;
		gap: var(--space-xs);
		align-items: center;
		padding: var(--space-3xs) var(--space-2xs);
	}

	.logo {
		width: 1.6rem;
		height: 1.6rem;
		color: var(--color-accent);
		flex-shrink: 0;
	}

	.brand strong {
		display: block;
		font-size: var(--text-sm);
	}

	.brand small {
		color: var(--color-rule);
		font-size: var(--text-xs);
	}

	nav {
		display: flex;
		flex-direction: column;
		gap: var(--space-2xs);
		flex: 1;
	}

	nav a {
		display: flex;
		align-items: center;
		color: var(--color-rule);
		text-decoration: none;
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-sm);
		font-size: var(--text-sm);
		white-space: nowrap;
		min-height: 44px;
		transition: background-color var(--dur-short) var(--ease-out);
	}

	nav a:hover {
		background: var(--color-ink-2);
		color: var(--color-paper);
	}

	nav a.active {
		background: var(--color-accent-deep);
		color: var(--color-accent-ink);
		font-weight: 700;
	}

	.notif-badge {
		display: inline-block;
		margin-left: auto;
		background: var(--color-mocha);
		color: var(--color-paper);
		font-size: var(--text-xs);
		font-weight: 700;
		min-width: 1.4em;
		padding: 0 0.35em;
		border-radius: 999px;
		text-align: center;
		line-height: 1.4;
	}

	.notif-badge--nol {
		background: var(--color-ink-2);
		color: var(--color-rule);
		font-weight: 400;
	}

	.userbox {
		border-top: var(--rule-hair) solid var(--color-ink-2);
		padding-top: var(--space-md);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
	}

	.who {
		display: block;
		text-decoration: none;
		color: inherit;
	}

	.who:hover strong {
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.who strong {
		display: block;
		font-size: var(--text-sm);
		color: var(--color-paper);
	}

	.who span {
		font-size: var(--text-xs);
		color: var(--color-rule);
	}

	.logout {
		background: transparent;
		border: var(--rule-hair) solid var(--color-ink-2);
		color: var(--color-rule);
		padding: var(--space-xs) var(--space-md);
		border-radius: var(--radius-sm);
		font-size: var(--text-sm);
		min-height: 44px;
		cursor: pointer;
		white-space: nowrap;
		transition: background-color var(--dur-short) var(--ease-out);
	}

	.logout:hover {
		background: var(--color-ink-2);
		color: var(--color-paper);
	}

	.content {
		background: var(--color-paper-2);
		padding: clamp(var(--space-md), 4vw, var(--space-2xl));
		min-width: 0;
	}

	/* Responsive Mobile & Tablet (< 54rem / ~864px) */
	@media (max-width: 54rem) {
		.shell {
			grid-template-columns: 1fr;
			display: block;
		}

		.mobile-topbar {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: var(--space-sm) var(--space-md);
			background: var(--color-ink);
			color: var(--color-paper);
			border-bottom: var(--rule-hair) solid var(--color-ink-2);
			position: sticky;
			top: 0;
			z-index: 40;
		}

		.menu-toggle {
			display: inline-flex;
			align-items: center;
			gap: var(--space-xs);
			background: var(--color-ink-2);
			color: var(--color-paper);
			border: var(--rule-hair) solid var(--color-rule);
			padding: var(--space-2xs) var(--space-sm);
			border-radius: var(--radius-sm);
			font-family: var(--font-body);
			font-size: var(--text-sm);
			cursor: pointer;
			min-height: 40px;
		}

		.menu-toggle .icon {
			font-size: 1.1rem;
			line-height: 1;
		}

		.menu-toggle .notif-badge {
			margin-left: var(--space-2xs);
		}

		.drawer-backdrop {
			display: block;
			position: fixed;
			inset: 0;
			background: color-mix(in srgb, var(--color-ink) 55%, transparent);
			z-index: 50;
			border: 0;
			padding: 0;
			cursor: pointer;
		}

		.brand--desktop {
			display: none;
		}

		.sidebar {
			position: fixed;
			top: 0;
			left: 0;
			bottom: 0;
			width: min(18rem, 85vw);
			z-index: 60;
			box-shadow: 4px 0 24px -4px color-mix(in srgb, var(--color-ink) 35%, transparent);
			transform: translateX(-100%);
			transition: transform var(--dur-short) var(--ease-out);
			overflow-y: auto;
			padding-top: var(--space-xl);
		}

		.sidebar.sidebar--open {
			transform: translateX(0);
		}

		.userbox {
			margin-top: auto;
		}
	}
</style>
