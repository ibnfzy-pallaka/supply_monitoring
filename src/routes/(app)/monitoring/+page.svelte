<script lang="ts">
	import { formatJumlah, formatRupiah, statusStok } from '$lib/format'

	let { data } = $props()

	const BADGE: Record<string, string> = { habis: 'danger', menipis: 'warn', aman: 'ok' }

	const perlu = $derived(data.bahan.filter((b) => b.status !== 'aman'))
</script>

<svelte:head>
	<title>Monitoring Stok — Kopi Waskita</title>
</svelte:head>

<header class="page-head">
	<div>
		<h1>Monitoring Stok</h1>
		<p class="sub">
			Status seluruh bahan dan saran pengadaan — diperbarui otomatis setiap transaksi tercatat.
		</p>
	</div>
</header>

<section class="stats">
	<div class="stat">
		<span class="angka">{data.ringkasan.total}</span>
		<span class="label">Jenis bahan</span>
	</div>
	<div class="stat">
		<span class="angka">{data.ringkasan.aman}</span>
		<span class="label">Aman</span>
	</div>
	<div class="stat" class:merah={data.ringkasan.menipis > 0}>
		<span class="angka">{data.ringkasan.menipis}</span>
		<span class="label">Menipis</span>
	</div>
	<div class="stat" class:merah={data.ringkasan.habis > 0}>
		<span class="angka">{data.ringkasan.habis}</span>
		<span class="label">Habis</span>
	</div>
	<div class="stat lebar">
		<span class="angka">{formatRupiah(data.ringkasan.nilaiPersediaan)}</span>
		<span class="label">Nilai persediaan saat ini</span>
	</div>
</section>

{#if perlu.length > 0}
	<section class="panel saran">
		<h2>Saran pengadaan</h2>
		<p class="penjelasan">
			Berapa banyak yang disarankan dibeli agar stok cukup di atas batas minimum untuk satu siklus
			pemakaian normal.
		</p>
		<div class="tabel-wrap">
			<table class="table">
				<thead>
					<tr>
						<th>Bahan</th>
						<th class="num">Sisa</th>
						<th class="num">Minimum</th>
						<th class="num">Saran beli</th>
						<th class="num">Estimasi biaya</th>
					</tr>
				</thead>
				<tbody>
					{#each perlu as b (b.id)}
						<tr>
							<td>{b.nama} <small class="kode">({b.kode})</small></td>
							<td class="num">{formatJumlah(b.stokAktual)} {b.satuan}</td>
							<td class="num">{formatJumlah(b.stokMinimum)} {b.satuan}</td>
							<td class="num saran-beli">{formatJumlah(b.saran ?? 0)} {b.satuan}</td>
							<td class="num">{formatRupiah(b.estimasi ?? 0)}</td>
						</tr>
					{/each}
				</tbody>
				<tfoot>
					<tr>
						<th colspan="4" class="num">Total estimasi pengadaan</th>
						<td class="num">{formatRupiah(data.ringkasan.estimasiPengadaan)}</td>
					</tr>
				</tfoot>
			</table>
		</div>
	</section>
{/if}

<section class="panel">
	<h2>Status seluruh bahan</h2>
	{#if data.bahan.length === 0}
		<p class="kosong">Belum ada data bahan baku.</p>
	{:else}
		<div class="tabel-wrap">
			<table class="table">
				<thead>
					<tr>
						<th>Kode</th>
						<th>Nama</th>
						<th>Kategori</th>
						<th class="num">Stok</th>
						<th class="num">Minimum</th>
						<th class="num">Nilai stok</th>
						<th>Status</th>
					</tr>
				</thead>
				<tbody>
					{#each data.bahan as b (b.id)}
						<tr>
							<td>{b.kode}</td>
							<td>{b.nama}</td>
							<td>{b.kategoriNama}</td>
							<td class="num">{formatJumlah(b.stokAktual)} {b.satuan}</td>
							<td class="num">{formatJumlah(b.stokMinimum)} {b.satuan}</td>
							<td class="num">{formatRupiah(b.stokAktual * b.hargaSatuan)}</td>
							<td>
								<span class="badge badge--{BADGE[statusStok(b.stokAktual, b.stokMinimum)]}">
									{statusStok(b.stokAktual, b.stokMinimum)}
								</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</section>

<style>
	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
		gap: var(--space-md);
		margin-bottom: var(--space-lg);
	}

	.stat {
		background: var(--color-paper);
		border: var(--rule-hair) solid var(--color-rule);
		border-radius: var(--radius-sm);
		padding: var(--space-md) var(--space-lg);
		display: flex;
		flex-direction: column;
		gap: var(--space-3xs);
	}

	.stat.merah {
		border-color: var(--color-danger);
	}

	.stat.lebar {
		grid-column: span 2;
	}

	.angka {
		font-family: var(--font-display);
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--color-ink);
		font-variant-numeric: tabular-nums;
	}

	.stat.merah .angka {
		color: var(--color-danger);
	}

	.label {
		font-size: var(--text-xs);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-muted);
	}

	.panel {
		margin-bottom: var(--space-lg);
	}

	.panel h2 {
		margin: 0 0 var(--space-md);
		font-size: var(--text-md);
	}

	.penjelasan {
		color: var(--color-muted);
		font-size: var(--text-sm);
		margin: 0 0 var(--space-md);
		max-width: var(--measure);
	}

	.saran-beli {
		font-weight: 700;
		color: var(--color-accent-deep);
	}

	.kode {
		color: var(--color-muted);
	}

	@media (max-width: 40rem) {
		.stat.lebar {
			grid-column: span 1;
		}
	}
</style>
