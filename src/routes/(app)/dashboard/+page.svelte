<script lang="ts">
	import { formatJumlah } from '$lib/format'

	let { data } = $props()

	const sapaan = $derived(
		new Date().getHours() < 11
			? 'Selamat pagi'
			: new Date().getHours() < 15
				? 'Selamat siang'
				: 'Selamat sore'
	)

	// ----- Ringkasan kata: satu kalimat status, tanpa angka raksasa. -----
	// Angka kritis dipindah jadi badge kecil di kepala tabel peringatan.
	const ringkasan = $derived.by(() => {
		if (data.totalBahan === 0) {
			return {
				kritis: false,
				judul: 'Belum ada bahan baku tercatat.',
				detail: 'Mulai dengan menambahkan satu item lewat menu Bahan Baku.',
				cta: { label: 'Tambah bahan baku', href: '/bahan-baku/baru' }
			}
		}
		if (data.kritis.length > 0) {
			return {
				kritis: true,
				judul: 'Ada bahan yang perlu dipesan hari ini.',
				detail: `${data.kritis.length} bahan berada di bawah batas minimum — lihat daftarnya di bawah sebelum jam sibuk.`,
				cta: { label: 'Buka daftar bahan baku', href: '/bahan-baku' }
			}
		}
		return {
			kritis: false,
			judul: 'Semua stok di atas batas minimum.',
			detail: 'Tidak ada yang perlu dipesan hari ini — aktivitas tercatat di bawah.',
			cta: { label: 'Buka daftar bahan baku', href: '/bahan-baku' }
		}
	})

	// Strip metrik ringkas — label kecil, angka sedang. Bukan hero.
	const metrik = $derived([
		{ nilai: data.totalBahan, label: 'Jenis bahan baku', tegang: false },
		{ nilai: data.masukHariIni, label: 'Masuk hari ini', tegang: false },
		{ nilai: data.keluarHariIni, label: 'Keluar hari ini', tegang: false },
		{
			nilai: data.notifBelumDibaca,
			label: 'Notifikasi belum dibaca',
			tegang: data.notifBelumDibaca > 0
		}
	])

	// ----- Grafik batang dua arah: masuk ke atas, keluar ke bawah -----
	const W = 640
	const H = 180
	const MID = H / 2

	const maks = $derived(Math.max(1, ...data.grafik.map((g) => Math.max(g.masuk, g.keluar))))

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

	const totalMasuk = $derived(data.grafik.reduce((a, g) => a + g.masuk, 0))
	const totalKeluar = $derived(data.grafik.reduce((a, g) => a + g.keluar, 0))
</script>

<svelte:head>
	<title>Dashboard — Kopi Waskita</title>
</svelte:head>

<!-- ============ Kepala: sapaan + kalimat status (bukan angka raksasa) ============ -->
<header class="kepala">
	<p class="sapaan">{sapaan}, {data.profile.nama}.</p>
	<div class="kepala__baris">
		<h1 class="kepala__judul">{ringkasan.judul}</h1>
		<a class="link-aksi kepala__cta" href={ringkasan.cta.href}>{ringkasan.cta.label} →</a>
	</div>
	<p class="kepala__detail">{ringkasan.detail}</p>
</header>

<!-- ============ Strip metrik ringkas ============ -->
<ul class="metrik" style="--kolom: {metrik.length}">
	{#each metrik as m (m.label)}
		<li class:tegang={m.tegang}>
			<span class="nilai">{formatJumlah(m.nilai)}</span>
			<span class="label">{m.label}</span>
		</li>
	{/each}
</ul>

<!-- ============ Panel 1: peringatan stok minimum (memimpin halaman) ============ -->
<section class="panel sksi">
	<div class="sksi__kepala">
		<h2 class="sksi__judul">Peringatan stok minimum</h2>
		{#if data.kritis.length > 0}
			<span class="hitung">{data.kritis.length} bahan</span>
		{/if}
	</div>

	{#if data.kritis.length === 0}
		<p class="kosong">
			{data.totalBahan === 0
				? 'Belum ada data bahan baku. Tambahkan lewat menu Bahan Baku.'
				: 'Semua stok dalam kondisi aman — tidak ada bahan di bawah batas minimum.'}
		</p>
	{:else}
		<div class="tabel-wrap">
			<table class="table tabel-kritis">
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
							<td class="kode">{b.kode}</td>
							<td>{b.nama}</td>
							<td class="num">{formatJumlah(b.stokAktual)} {b.satuan}</td>
							<td class="num">{formatJumlah(b.stokMinimum)} {b.satuan}</td>
							<td>
								<span
									class="badge"
									class:badge--danger={b.stokAktual === 0}
									class:badge--warn={b.stokAktual !== 0}
								>
									{b.stokAktual === 0 ? 'habis' : 'menipis'}
								</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</section>

<!-- ============ Panel 2: pergerakan stok ============ -->
<section class="panel sksi">
	<div class="sksi__kepala">
		<h2 class="sksi__judul">Pergerakan stok — 14 hari terakhir</h2>
		{#if !data.grafik.every((g) => g.masuk === 0 && g.keluar === 0)}
			<span class="rentang">masuk {formatJumlah(totalMasuk)} · keluar {formatJumlah(totalKeluar)}</span>
		{/if}
	</div>

	{#if data.grafik.every((g) => g.masuk === 0 && g.keluar === 0)}
		<p class="kosong">Belum ada transaksi dalam 14 hari terakhir — grafik akan terisi seiring pencatatan.</p>
	{:else}
		<div class="grafik-wrap">
			<figure class="grafik">
				<svg
					viewBox="0 0 {W} {H}"
					role="img"
					aria-label="Grafik batang jumlah barang masuk dan keluar per hari, 14 hari terakhir"
				>
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
				</figcaption>
			</figure>
		</div>
	{/if}
</section>

<style>
	/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 */
	/* Hallmark · genre: editorial · macrostructure: Workbench (app variant) · tone: utilitarian
	 * theme: Almanac (sistem terkunci — pertahankan warna & font) · enrichment: none (app page)
	 * nav: N3 side-rail (layout, di luar scope) · footer: none (halaman app)
	 * audience: staf & pemilik kedai · use: pantau stok & tangani kritis sekilas
	 * axes: paper-band: light (>85%) · display-style: roman-serif · accent-hue: warm (62°)
	 * knobs: hero=none (angka raksasa dihapus) · angka kritis=badge kecil di kepala tabel
	 * nav/footer: netral (shell app) · motion: bar-reveal (1) + row-rule-hover (1)
	 * contrast: pass (40–41) · honest: pass (46) · chrome: pass (47) · tokens: pass (48)
	 * responsive: pass (49) · mobile: pass (34, 50–55)
	 */

	/* ---------- Kepala halaman: kalimat memimpin, bukan angka ---------- */
	.kepala {
		margin-bottom: var(--space-xl);
	}

	.sapaan {
		color: var(--color-muted);
		font-size: var(--text-sm);
		margin-bottom: var(--space-sm);
	}

	.kepala__baris {
		display: flex;
		align-items: baseline; /* gate 36 — sejajar baseline teks judul & tautan */
		justify-content: space-between;
		flex-wrap: wrap;
		gap: var(--space-sm) var(--space-lg);
	}

	.kepala__judul {
		margin: 0;
		font-size: var(--text-xl);
		font-weight: 600;
		letter-spacing: -0.01em;
		overflow-wrap: anywhere; /* gate 51 */
		min-width: 0;
	}

	.kepala__cta {
		white-space: nowrap; /* gate 49 */
		flex-shrink: 0;
	}

	.kepala__detail {
		color: var(--color-muted);
		font-size: var(--text-sm);
		max-width: 60ch;
		margin-top: var(--space-xs);
	}

	/* ---------- Strip metrik ringkas: hairline, angka sedang ---------- */
	.metrik {
		list-style: none;
		margin: 0 0 var(--space-xl);
		padding: 0;
		display: grid;
		grid-template-columns: repeat(var(--kolom), minmax(0, 1fr));
		border-block: var(--rule-hair) solid var(--color-rule);
	}

	.metrik li {
		display: flex;
		flex-direction: column;
		gap: var(--space-3xs);
		padding: var(--space-md) var(--space-lg) var(--space-md) 0;
	}

	.metrik li + li {
		border-left: var(--rule-hair) solid var(--color-rule);
		padding-left: var(--space-lg);
	}

	.metrik .nilai {
		font-size: var(--text-lg);
		font-weight: 700;
		color: var(--color-ink);
		font-variant-numeric: tabular-nums;
		line-height: 1.2;
	}

	.metrik li.tegang .nilai {
		color: var(--color-danger);
	}

	.metrik .label {
		font-size: var(--text-xs);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-muted);
	}

	/* ---------- Panel (Workbench: permukaan berdiri di atas paper-2) ---------- */
	.sksi {
		margin-bottom: var(--space-lg);
	}

	.sksi:last-child {
		margin-bottom: 0;
	}

	.sksi__kepala {
		display: flex;
		align-items: center; /* gate 36 — judul + badge sejajar vertikal */
		justify-content: space-between;
		flex-wrap: wrap;
		gap: var(--space-sm);
		margin-bottom: var(--space-md);
		padding-bottom: var(--space-sm);
		border-bottom: var(--rule-hair) solid var(--color-rule);
	}

	.sksi__judul {
		margin: 0;
		font-size: var(--text-md);
		color: var(--color-ink);
		overflow-wrap: anywhere; /* gate 51 */
		min-width: 0;
	}

	/* Badge hitung — angka kritis diperkecil, bukan hero */
	.hitung {
		display: inline-flex;
		align-items: center;
		align-self: flex-start;
		padding: var(--space-3xs) var(--space-sm);
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: 0.04em;
		border-radius: var(--radius-sm);
		border: var(--rule-hair) solid var(--color-danger);
		color: var(--color-danger);
		background: var(--color-paper-2);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.rentang {
		font-size: var(--text-xs);
		color: var(--color-muted);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.kosong {
		color: var(--color-muted);
		font-size: var(--text-sm);
		margin: 0;
		padding: var(--space-xs) 0;
	}

	.tabel-wrap {
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		max-width: 100%;
	}

	/* Baris kritis: rule accent tipis di kiri (satu sinyal), teks kode tabular */
	.tabel-kritis tbody tr {
		border-left: var(--space-3xs) solid transparent;
		transition: border-color var(--dur-short) var(--ease-out);
	}

	.tabel-kritis tbody tr:hover {
		border-left-color: var(--color-accent);
	}

	.kode {
		font-variant-numeric: tabular-nums;
		color: var(--color-ink-2);
		white-space: nowrap;
	}

	/* ---------- Grafik ---------- */
	.grafik-wrap {
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}

	.grafik {
		margin: 0;
		min-width: 22rem; /* grafik tetap terbaca; scroll horizontal bila sempit */
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
		transform-box: fill-box;
		transform-origin: bottom;
		animation: batang-reveal var(--dur-long) var(--ease-out) both;
	}

	.batang-keluar {
		fill: var(--color-ink-2);
		transform-box: fill-box;
		transform-origin: top;
		animation: batang-reveal var(--dur-long) var(--ease-out) both;
	}

	@keyframes batang-reveal {
		from {
			opacity: 0;
			transform: scaleY(0.4);
		}

		to {
			opacity: 1;
			transform: none;
		}
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

	/* ---------- Responsif ---------- */
	@media (max-width: 40rem) {
		.metrik {
			grid-template-columns: 1fr;
		}

		.metrik li {
			padding: var(--space-sm) 0;
		}

		.metrik li + li {
			border-left: none;
			border-top: var(--rule-hair) solid var(--color-rule);
			padding-left: 0;
		}

		.kepala__baris {
			flex-direction: column;
			align-items: flex-start;
		}

		.hitung {
			align-self: auto;
		}

		.rentang {
			white-space: normal;
		}
	}

	/* reduced motion — bar reveal jadi crossfade, tanpa scale */
	@media (prefers-reduced-motion: reduce) {
		.batang-masuk,
		.batang-keluar {
			animation: batang-reveal-reduced 150ms linear both;
		}

		@keyframes batang-reveal-reduced {
			from {
				opacity: 0;
			}

			to {
				opacity: 1;
			}
		}
	}
</style>
