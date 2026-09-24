<script lang="ts">
	import { formatJumlah, formatRupiah } from '$lib/format'

	let { data } = $props()

	const sapaan = $derived(
		new Date().getHours() < 11
			? 'Selamat pagi'
			: new Date().getHours() < 15
				? 'Selamat siang'
				: 'Selamat sore'
	)

	// ----- Grafik batang dua arah: masuk ke atas, keluar ke bawah -----
	const W = 640
	const H = 180
	const MID = H / 2

	const maks = $derived(
		Math.max(1, ...data.grafik.map((g) => Math.max(g.masuk, g.keluar)))
	)

	const batang = $derived(
		data.grafik.map((g, i) => {
			const lebar = W / data.grafik.length
			const x = i * lebar
			const tinggiMasuk = (g.masuk / maks) * (MID - 20)
			const tinggiKeluar = (g.keluar / maks) * (MID - 20)
			return {
				x: x + lebar * 0.2,
				w: lebar * 0.6,
				masuk: { y: MID - tinggiMasuk, h: tinggiMasuk },
				keluar: { y: MID, h: tinggiKeluar },
				label: g.tanggal.slice(8) + '/' + g.tanggal.slice(5, 7)
			}
		})
	)
</script>

<svelte:head>
	<title>Dashboard — Kopi Waskita</title>
</svelte:head>

<section class="hero">
	<h1>{sapaan}, {data.profile.nama}</h1>
	<p>
		Login sebagai
		<span class="badge" class:admin={data.profile.role === 'admin'}>
			{data.profile.role === 'admin' ? 'Admin / Pemilik' : 'Staff'}
		</span>
	</p>
</section>

<section class="stats">
	<div class="stat">
		<span class="angka">{data.totalBahan}</span>
		<span class="label">Jenis Bahan Baku</span>
	</div>
	<div class="stat" class:merah={data.kritis.length > 0}>
		<span class="angka">{data.kritis.length}</span>
		<span class="label">Stok di Bawah Minimum</span>
	</div>
	<div class="stat" class:merah={data.notifBelumDibaca > 0}>
		<span class="angka">{data.notifBelumDibaca}</span>
		<span class="label">Notifikasi Belum Dibaca</span>
	</div>
	<div class="stat">
		<span class="angka">{data.masukHariIni}</span>
		<span class="label">Masuk Hari Ini</span>
	</div>
	<div class="stat">
		<span class="angka">{data.keluarHariIni}</span>
		<span class="label">Keluar Hari Ini</span>
	</div>
</section>

<section class="panel">
	<h2>Pergerakan stok — 14 hari terakhir</h2>
	{#if data.grafik.every((g) => g.masuk === 0 && g.keluar === 0)}
		<p class="kosong">Belum ada transaksi dalam 14 hari terakhir — grafik akan terisi seiring pencatatan.</p>
	{:else}
		<figure class="grafik">
			<svg viewBox="0 0 {W} {H}" role="img" aria-label="Grafik batang jumlah barang masuk dan keluar per hari, 14 hari terakhir">
				<line x1="0" y1={MID} x2={W} y2={MID} class="axis" />
				{#each batang as b (b.label)}
					{#if b.masuk.h > 0}
						<rect x={b.x} y={b.masuk.y} width={b.w} height={b.masuk.h} rx="1" class="batang-masuk" />
					{/if}
					{#if b.keluar.h > 0}
						<rect x={b.x} y={b.keluar.y} width={b.w} height={b.keluar.h} rx="1" class="batang-keluar" />
					{/if}
				{/each}
			</svg>
			<figcaption>
				<span class="legenda"><i class="titik masuk"></i> masuk (qty)</span>
				<span class="legenda"><i class="titik keluar"></i> keluar (qty)</span>
				<span class="rentang">14 hari · total masuk {formatJumlah(data.grafik.reduce((a, g) => a + g.masuk, 0))} · total keluar {formatJumlah(data.grafik.reduce((a, g) => a + g.keluar, 0))}</span>
			</figcaption>
		</figure>
	{/if}
</section>

<section class="panel">
	<h2>Peringatan Stok Minimum</h2>

	{#if data.kritis.length === 0}
		<p class="kosong">
			{data.totalBahan === 0
				? 'Belum ada data bahan baku. Tambahkan lewat menu Bahan Baku.'
				: 'Semua stok dalam kondisi aman — tidak ada bahan di bawah batas minimum.'}
		</p>
	{:else}
		<div class="tabel-wrap">
			<table class="table">
				<thead>
					<tr>
						<th>Kode</th>
						<th>Nama Bahan</th>
						<th class="num">Stok</th>
						<th class="num">Minimum</th>
						<th>Status</th>
					</tr>
				</thead>
				<tbody>
					{#each data.kritis as b (b.kode)}
						<tr>
							<td>{b.kode}</td>
							<td>{b.nama}</td>
							<td class="num">{formatJumlah(b.stokAktual)} {b.satuan}</td>
							<td class="num">{formatJumlah(b.stokMinimum)} {b.satuan}</td>
							<td>
								<span class="badge" class:habis={b.stokAktual === 0}>
									{b.stokAktual === 0 ? 'habis' : 'menipis'}
								</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<p class="lihat-monitoring">
			Saran jumlah pengadaan tersedia di <a href="/monitoring">Monitoring</a>.
		</p>
	{/if}
</section>

<style>
	.hero h1 {
		margin: 0 0 var(--space-3xs);
		font-size: var(--text-xl);
		color: var(--color-ink);
	}

	.hero p {
		margin: 0;
		color: var(--color-muted);
		font-size: var(--text-sm);
	}

	.badge {
		display: inline-block;
		background: var(--color-paper-3);
		color: var(--color-muted);
		border-radius: var(--radius-sm);
		padding: var(--space-3xs) var(--space-sm);
		font-size: var(--text-xs);
		font-weight: 400;
	}

	.badge.admin {
		background: var(--color-paper);
		color: var(--color-accent-deep);
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
		gap: var(--space-md);
		margin: var(--space-xl) 0;
	}

	.stat {
		background: var(--color-paper);
		border: var(--rule-hair) solid var(--color-rule);
		border-radius: var(--radius-sm);
		padding: var(--space-lg) var(--space-xl);
		display: flex;
		flex-direction: column;
		gap: var(--space-3xs);
	}

	.stat.merah {
		border-color: var(--color-danger);
	}

	.angka {
		font-family: var(--font-display);
		font-size: var(--text-2xl);
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
		background: var(--color-paper);
		border: var(--rule-hair) solid var(--color-rule);
		border-radius: var(--radius-sm);
		padding: var(--space-lg) var(--space-xl);
		margin-bottom: var(--space-lg);
	}

	.panel h2 {
		margin: 0 0 var(--space-md);
		font-size: var(--text-md);
		color: var(--color-ink);
	}

	.kosong {
		color: var(--color-muted);
		font-size: var(--text-sm);
		margin: 0;
		padding: var(--space-3xs) 0 var(--space-sm);
	}

	.tabel-wrap {
		overflow-x: auto;
	}

	.badge.habis {
		background: var(--color-paper-2);
		color: var(--color-danger);
	}

	.lihat-monitoring {
		margin: var(--space-md) 0 0;
		font-size: var(--text-sm);
		color: var(--color-muted);
	}

	.grafik {
		margin: 0;
	}

	.grafik svg {
		width: 100%;
		height: auto;
		display: block;
	}

	.axis {
		stroke: var(--color-rule);
		stroke-width: 1;
	}

	.batang-masuk {
		fill: var(--color-accent);
	}

	.batang-keluar {
		fill: var(--color-ink-2);
	}

	figcaption {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-md);
		margin-top: var(--space-sm);
		font-size: var(--text-xs);
		color: var(--color-muted);
	}

	.legenda {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2xs);
	}

	.titik {
		width: 8px;
		height: 8px;
		border-radius: 2px;
		display: inline-block;
	}

	.titik.masuk {
		background: var(--color-accent);
	}

	.titik.keluar {
		background: var(--color-ink-2);
	}

	.rentang {
		margin-left: auto;
	}
</style>
