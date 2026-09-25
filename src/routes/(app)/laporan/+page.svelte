<script lang="ts">
	import { page } from '$app/state'
	import { formatJumlah, formatRupiah, formatTanggal } from '$lib/format'
	import { judulLaporan } from '$lib/laporan'

	let { data } = $props()

	const laporan = $derived(data.laporan)

	const tab = [
		{ jenis: 'masuk', label: 'Barang Masuk' },
		{ jenis: 'keluar', label: 'Barang Keluar' },
		{ jenis: 'persediaan', label: 'Persediaan' }
	]

	function urlTab(jenis: string): string {
		const q = new URLSearchParams()
		q.set('jenis', jenis)
		if (page.url.searchParams.get('dari')) q.set('dari', page.url.searchParams.get('dari')!)
		if (page.url.searchParams.get('sampai')) q.set('sampai', page.url.searchParams.get('sampai')!)
		return `/laporan?${q}`
	}

	function urlCetak(): string {
		return `/laporan/cetak${page.url.search}`
	}
</script>

<svelte:head>
	<title>Laporan — Kopi Waskita</title>
</svelte:head>

<header class="page-head">
	<div>
		<h1>Laporan Persediaan</h1>
		<p class="sub">Rekap per periode — siap dicetak atau disimpan sebagai PDF.</p>
	</div>
	<a class="btn" href={urlCetak()} target="_blank" rel="noopener">Cetak / Simpan PDF</a>
</header>

<nav class="subnav" aria-label="Jenis laporan">
	{#each tab as t (t.jenis)}
		<a href={urlTab(t.jenis)} class:active={laporan.jenis === t.jenis}>{t.label}</a>
	{/each}
</nav>

<form class="filters" method="GET">
	<input type="hidden" name="jenis" value={laporan.jenis} />
	<label class="mini">Dari <input class="input" type="date" name="dari" value={laporan.dari} disabled={laporan.jenis === 'persediaan'} /></label>
	<label class="mini">Sampai <input class="input" type="date" name="sampai" value={laporan.sampai} disabled={laporan.jenis === 'persediaan'} /></label>
	<button class="btn btn--ghost" type="submit" disabled={laporan.jenis === 'persediaan'}>Terapkan</button>
	{#if page.url.searchParams.get('dari') || page.url.searchParams.get('sampai')}
		<a class="link-aksi" href={urlTab(laporan.jenis)}>Reset</a>
	{/if}
</form>

<div class="ringkas">
	<span class="judul">{judulLaporan(laporan.jenis)}</span>
	<span class="periode">
		{laporan.jenis === 'persediaan'
			? `Posisi ${formatTanggal(new Date().toISOString().slice(0, 10))}`
			: `${formatTanggal(laporan.dari)} — ${formatTanggal(laporan.sampai)}`}
	</span>
</div>

<section class="panel">
	{#if laporan.rows.length === 0}
		<p class="kosong">Tidak ada data pada periode ini.</p>
	{:else}
		<div class="tabel-wrap">
			<table class="table">
				{#if laporan.jenis === 'masuk'}
					<thead>
						<tr>
							<th>Tanggal</th>
							<th>Kode</th>
							<th>Bahan</th>
							<th>Supplier</th>
							<th class="num">Qty</th>
							<th class="num">Harga</th>
							<th class="num">Subtotal</th>
						</tr>
					</thead>
					<tbody>
						{#each laporan.rows as r, i (i)}
							<tr>
								<td>{formatTanggal(r.tanggal)}</td>
								<td>{r.kode}</td>
								<td>{r.bahan}</td>
								<td>{r.supplier}</td>
								<td class="num">{formatJumlah(r.qty)} {r.satuan}</td>
								<td class="num">{formatRupiah(r.harga)}</td>
								<td class="num">{formatRupiah(r.subtotal)}</td>
							</tr>
						{/each}
					</tbody>
					<tfoot>
						<tr>
							<th colspan="4" class="num">
								{laporan.jumlahTransaksi} transaksi · total {formatJumlah(laporan.totalQty)}
							</th>
							<th colspan="2" class="num">Total nilai masuk</th>
							<td class="num total">{formatRupiah(laporan.totalNilai)}</td>
						</tr>
					</tfoot>
				{:else if laporan.jenis === 'keluar'}
					<thead>
						<tr>
							<th>Tanggal</th>
							<th>Kode</th>
							<th>Bahan</th>
							<th class="num">Qty</th>
							<th>Keterangan</th>
						</tr>
					</thead>
					<tbody>
						{#each laporan.rows as r, i (i)}
							<tr>
								<td>{formatTanggal(r.tanggal)}</td>
								<td>{r.kode}</td>
								<td>{r.bahan}</td>
								<td class="num">{formatJumlah(r.qty)} {r.satuan}</td>
								<td>{r.keterangan}</td>
							</tr>
						{/each}
					</tbody>
					<tfoot>
						<tr>
							<th colspan="3" class="num">{laporan.jumlahTransaksi} transaksi</th>
							<th class="num total">{formatJumlah(laporan.totalQty)} total keluar</th>
							<th></th>
						</tr>
					</tfoot>
				{:else}
					<thead>
						<tr>
							<th>Kategori</th>
							<th>Kode</th>
							<th>Bahan</th>
							<th class="num">Stok</th>
							<th class="num">Minimum</th>
							<th class="num">Harga</th>
							<th class="num">Nilai</th>
						</tr>
					</thead>
					<tbody>
						{#each laporan.rows as r, i (i)}
							<tr>
								<td>{r.kategori}</td>
								<td>{r.kode}</td>
								<td>{r.bahan}</td>
								<td class="num">{formatJumlah(r.stok)} {r.satuan}</td>
								<td class="num">{formatJumlah(r.minimum)} {r.satuan}</td>
								<td class="num">{formatRupiah(r.harga)}</td>
								<td class="num">{formatRupiah(r.nilai)}</td>
							</tr>
						{/each}
					</tbody>
					<tfoot>
						<tr>
							<th colspan="3" class="num">{laporan.jumlahBahan} jenis bahan</th>
							<th colspan="2" class="num">Nilai persediaan</th>
							<th colspan="1" class="num">Total</th>
							<td class="num total">{formatRupiah(laporan.totalNilai)}</td>
						</tr>
					</tfoot>
				{/if}
			</table>
		</div>
	{/if}
</section>

<style>
	.subnav {
		display: flex;
		gap: var(--space-xs);
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
		border-bottom: var(--rule-hair) solid var(--color-rule);
		margin-bottom: var(--space-lg);
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

	.mini {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2xs);
		font-size: var(--text-xs);
		color: var(--color-muted);
	}

	@media (max-width: 40rem) {
		.mini {
			display: flex;
			flex-direction: column;
			align-items: stretch;
			width: 100%;
		}

		.mini .input {
			width: 100%;
		}
	}

	.ringkas {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--space-sm);
		margin-bottom: var(--space-md);
	}

	.judul {
		font-family: var(--font-display);
		font-size: var(--text-md);
		font-weight: 600;
	}

	.periode {
		font-size: var(--text-sm);
		color: var(--color-muted);
	}

	tfoot th {
		color: var(--color-ink);
		font-weight: 700;
		text-transform: none;
		letter-spacing: 0;
		border-top: var(--rule-hair) solid var(--color-ink);
		font-size: var(--text-sm);
	}

	tfoot .total {
		font-weight: 700;
		color: var(--color-accent-deep);
	}
</style>
