<script lang="ts">
	import { enhance } from '$app/forms'
	import { page } from '$app/state'

	let { data, children } = $props()

	const nav = [
		{ href: '/dashboard', label: 'Dashboard', adminOnly: false },
		{ href: '/bahan-baku', label: 'Bahan Baku', adminOnly: false },
		{ href: '/kategori', label: 'Kategori', adminOnly: false },
		{ href: '/supplier', label: 'Supplier', adminOnly: false },
		{ href: '/transaksi', label: 'Transaksi', adminOnly: false },
		{ href: '/monitoring', label: 'Monitoring', adminOnly: false },
		{ href: '/laporan', label: 'Laporan', adminOnly: false },
		{ href: '/notifikasi', label: 'Notifikasi', adminOnly: false },
		{ href: '/users', label: 'Manajemen User', adminOnly: true },
		{ href: '/audit', label: 'Log Aktivitas', adminOnly: true }
	]

	const visibleNav = $derived(nav.filter((n) => !n.adminOnly || data.profile.role === 'admin'))
	const current = $derived(page.url.pathname)
</script>

<svelte:head>
	<title>Sistem Persediaan Bahan Baku — Kopi Waskita</title>
</svelte:head>

<div class="shell">
	<aside class="sidebar">
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

		<nav aria-label="Utama">
			{#each visibleNav as item (item.href)}
				<a
					href={item.href}
					class:active={current === item.href || (item.href !== '/dashboard' && current.startsWith(item.href + '/'))}
				>
					{item.label}
					{#if item.href === '/notifikasi' && data.notifBelumDibaca > 0}
						<span class="notif-badge">{data.notifBelumDibaca}</span>
					{/if}
				</a>
			{/each}
		</nav>

		<div class="userbox">
			<a class="who" href="/profil" title="Profil & ganti password">
				<strong>{data.profile.nama}</strong>
				<span>{data.profile.role === 'admin' ? 'Admin' : 'Staff'} · Profil</span>
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
		background: var(--color-accent);
		color: var(--color-accent-ink);
		font-size: var(--text-xs);
		font-weight: 700;
		min-width: 1.4em;
		padding: 0 0.35em;
		border-radius: 999px;
		text-align: center;
		line-height: 1.4;
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
		cursor: pointer;
		transition: background-color var(--dur-short) var(--ease-out);
	}

	.logout:hover {
		background: var(--color-ink-2);
		color: var(--color-paper);
	}

	.content {
		background: var(--color-paper-2);
		padding: var(--space-2xl);
	}

	@media (max-width: 54rem) {
		.shell {
			grid-template-columns: 1fr;
		}

		.sidebar {
			flex-direction: row;
			align-items: center;
			flex-wrap: wrap;
		}

		nav {
			flex-direction: row;
			flex-wrap: wrap;
		}

		.userbox {
			border-top: none;
			margin-left: auto;
			padding-top: 0;
		}
	}
</style>
