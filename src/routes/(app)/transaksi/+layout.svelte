<script lang="ts">
	import { page } from '$app/state'

	let { children } = $props()
</script>

<svelte:head>
	<title>Transaksi — Kopi Waskita</title>
</svelte:head>

<header class="page-head">
	<div>
		<h1>Transaksi Persediaan</h1>
		<p class="sub">
			Barang masuk menambah stok, barang keluar menguranginya — keduanya tercatat otomatis.
			Stock opname menyamakan angka sistem dengan hasil hitung fisik.
		</p>
	</div>
</header>

<nav class="subnav" aria-label="Jenis transaksi">
	<a href="/transaksi/masuk" class:active={page.url.pathname.startsWith('/transaksi/masuk')}>Barang Masuk</a>
	<a href="/transaksi/keluar" class:active={page.url.pathname.startsWith('/transaksi/keluar')}>Barang Keluar</a>
	<a href="/transaksi/opname" class:active={page.url.pathname.startsWith('/transaksi/opname')}>Stock Opname</a>
	<a href="/transaksi/kartu-stok" class:active={page.url.pathname.startsWith('/transaksi/kartu-stok')}>Kartu Stok</a>
</nav>

{@render children()}

<style>
	.subnav {
		display: flex;
		gap: var(--space-xs);
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
		border-bottom: var(--rule-hair) solid var(--color-rule);
		margin-bottom: var(--space-xl);
	}

	.subnav::-webkit-scrollbar {
		display: none;
	}

	.subnav a {
		padding: var(--space-sm) var(--space-md);
		font-size: var(--text-sm);
		color: var(--color-muted);
		text-decoration: none;
		border-bottom: 2px solid transparent;
		margin-bottom: -1px;
		white-space: nowrap;
		flex-shrink: 0;
		min-height: 44px;
		display: inline-flex;
		align-items: center;
		transition: color var(--dur-short) var(--ease-out), border-color var(--dur-short) var(--ease-out);
	}

	.subnav a:hover {
		color: var(--color-ink);
	}

	.subnav a.active {
		color: var(--color-accent-deep);
		border-bottom-color: var(--color-accent);
		font-weight: 700;
	}
</style>
