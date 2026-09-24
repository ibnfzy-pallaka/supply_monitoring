<script lang="ts">
	import { formatJumlah, formatRupiah, formatTanggal } from '$lib/format'
	import { judulLaporan } from '$lib/laporan'

	let { data } = $props()

	const laporan = $derived(data.laporan)
	const dicetak = $derived(new Date().toISOString().slice(0, 10))
</script>

<svelte:head>
	<title>{judulLaporan(laporan.jenis)} — Cetak</title>
</svelte:head>

<div class="alat-cetak">
	<a class="link-aksi" href="/laporan?jenis={laporan.jenis}&dari={laporan.dari}&sampai={laporan.sampai}">← Kembali</a>
	<button class="btn" type="button" onclick={() => window.print()}>Simpan sebagai PDF</button>
</div>

<article class="kertas">
	<header class="kop">
		<div class="kop-brand">
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path d="M12 3.5c4.5 2.8 4.5 8.2 0 17-4.5-8.8-4.5-14.2 0-17Z" fill="none" stroke="currentColor" stroke-width="1.6"/>
				<path d="M12 5v15" stroke="currentColor" stroke-width="1.2"/>
			</svg>
			<div>
				<strong>Supply Monitoring</strong>
				<span>Sistem Informasi Persediaan Bahan Baku · Kopi Waskita Makassar</span>
			</div>
		</div>
		<hr />
		<h1>{judulLaporan(laporan.jenis)}</h1>
		<p class="periode">
			{laporan.jenis === 'persediaan'
				? `Posisi per ${formatTanggal(dicetak)}`
				: `Periode ${formatTanggal(laporan.dari)} — ${formatTanggal(laporan.sampai)}`}
		</p>
	</header>

	{#if laporan.rows.length === 0}
		<p class="kosong">Tidak ada data pada periode ini.</p>
	{:else}
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
						<th colspan="4" class="num">{laporan.jumlahTransaksi} transaksi · total {formatJumlah(laporan.totalQty)}</th>
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
						<th colspan="3" class="num">Nilai persediaan — total</th>
						<td class="num total">{formatRupiah(laporan.totalNilai)}</td>
					</tr>
				</tfoot>
			{/if}
		</table>
	{/if}

	<footer class="tanda-tangan">
		<p>Dicetak {formatTanggal(dicetak)} oleh {data.cetakOleh} · Supply Monitoring</p>
		<p class="kolofon">Supply Monitoring · Sistem Informasi Persediaan Bahan Baku · Kopi Waskita Makassar</p>
	</footer>
</article>

<style>
	.alat-cetak {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-lg);
		gap: var(--space-md);
	}

	.kertas {
		background: #fff;
		border: var(--rule-hair) solid var(--color-rule);
		border-radius: var(--radius-sm);
		padding: var(--space-2xl);
		max-width: 60rem;
		margin-inline: auto;
	}

	.kop-brand {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.kop-brand svg {
		width: 2rem;
		height: 2rem;
		color: var(--color-accent-deep);
		flex-shrink: 0;
	}

	.kop-brand strong {
		display: block;
		font-family: var(--font-display);
		font-size: var(--text-md);
	}

	.kop-brand span {
		font-size: var(--text-xs);
		color: var(--color-muted);
	}

	.kop hr {
		border: 0;
		border-top: var(--rule-hair) solid var(--color-rule);
		border-bottom: var(--rule-hair) solid var(--color-rule);
		height: var(--rule-double);
		margin: var(--space-sm) 0 var(--space-md);
	}

	.kop h1 {
		margin: 0;
		font-size: var(--text-lg);
	}

	.periode {
		margin: var(--space-2xs) 0 var(--space-lg);
		font-size: var(--text-sm);
		color: var(--color-muted);
	}

	.kosong {
		color: var(--color-muted);
		font-size: var(--text-sm);
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

	.tanda-tangan {
		display: flex;
		justify-content: space-between;
		gap: var(--space-md);
		margin-top: var(--space-xl);
		font-size: var(--text-xs);
		color: var(--color-muted);
	}

	.kolofon {
		text-align: right;
		max-width: 28rem;
	}

	/* ---------- Cetak: kertas polos, tanpa chrome ---------- */
	@page {
		margin: 1.4cm;
	}

	@media print {
		:global(.sidebar) {
			display: none !important;
		}

		:global(.shell) {
			display: block;
		}

		:global(.content) {
			padding: 0;
			background: #fff;
		}

		.alat-cetak {
			display: none;
		}

		.kertas {
			border: 0;
			padding: 0;
			max-width: none;
		}

		.kop-brand svg,
		tfoot .total {
			print-color-adjust: exact;
			-webkit-print-color-adjust: exact;
		}
	}
</style>
