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

	// ----- Hero Stat-Led: angka paling mendesak memimpin halaman -----
	const hero = $derived.by(() => {
		if (data.kritis.length > 0) {
			const nama = data.kritis
				.slice(0, 2)
				.map((b) => b.nama)
				.join(' dan ')
			const sisa = data.kritis.length > 2 ? `, +${data.kritis.length - 2} lainnya` : ''
			return {
				angka: data.kritis.length,
				kritis: true,
				kalimat: 'bahan di bawah minimum.',
				kualifikasi: `${nama}${sisa} berada di bawah batas minimum — atur pengadaan sebelum habis.`,
				cta: { label: 'Lihat saran pengadaan', href: '/monitoring' },
				pakaiTotal: false
			}
		}
		if (data.totalBahan === 0) {
			return {
				angka: 0,
				kritis: false,
				kalimat: 'jenis bahan baku tercatat.',
				kualifikasi: 'Belum ada data bahan baku — mulai dengan menambahkan satu item.',
				cta: { label: 'Tambah bahan baku', href: '/bahan-baku/baru' },
				pakaiTotal: false
			}
		}
		return {
			angka: data.totalBahan,
			kritis: false,
			kalimat: 'jenis bahan baku terpantau.',
			kualifikasi: 'Semua stok di atas batas minimum — tidak ada yang perlu dipesan hari ini.',
			cta: { label: 'Buka daftar bahan baku', href: '/bahan-baku' },
			pakaiTotal: true
		}
	})

	// Strip metrik pendukung — tanpa duplikasi angka yang sudah jadi hero
	const metrik = $derived([
		...(hero.pakaiTotal
			? []
			: [{ nilai: data.totalBahan, label: 'Jenis bahan baku', nol: false }]),
		{ nilai: data.masukHariIni, label: 'Masuk hari ini', nol: false },
		{ nilai: data.keluarHariIni, label: 'Keluar hari ini', nol: false },
		{
			nilai: data.notifBelumDibaca,
			label: 'Notifikasi belum dibaca',
			nol: data.notifBelumDibaca > 0
		}
	])

	// ----- Number tick: 0 → target, ~500ms, ease-out; reduced-motion: final langsung -----
	let angkaTampil = $state(0)

	$effect(() => {
		const target = hero.angka
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			angkaTampil = target
			return
		}
		const mulai = performance.now()
		const durasi = 500
		let raf = 0
		const step = (now: number) => {
			const t = Math.min(1, (now - mulai) / durasi)
			const e = 1 - Math.pow(1 - t, 4)
			angkaTampil = Math.round(target * e)
			if (t < 1) raf = requestAnimationFrame(step)
		}
		raf = requestAnimationFrame(step)
		return () => cancelAnimationFrame(raf)
	})

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
	<p class="sapaan">{sapaan}, {data.profile.nama}.</p>
	<h1>
		<span class="figure" class:kritis={hero.kritis}>{formatJumlah(angkaTampil)}</span>
		<span class="kalimat">{hero.kalimat}</span>
	</h1>
	<p class="kualifikasi">{hero.kualifikasi}</p>
	<a class="btn btn--ghost" href={hero.cta.href}>{hero.cta.label} →</a>
</section>

<ul class="metrik" style="--kolom: {metrik.length}">
	{#each metrik as m (m.label)}
		<li class:nol={m.nol}>
			<span class="nilai">{formatJumlah(m.nilai)}</span>
			<span class="label">{m.label}</span>
		</li>
	{/each}
</ul>

<section class="sksi">
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

<section class="sksi">
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

<style>
	/* Hallmark · pre-emit critique: P5 H4 E5 S5 R5 V5 */
	/* Hallmark · genre: editorial · macrostructure: Stat-Led · tone: utilitarian
	 * theme: Almanac (override user: "pertahankan warna saja") · enrichment: none
	 * nav: N3 side-rail (layout, di luar scope) · footer: none (halaman app)
	 * audience: staf & pemilik kedai · use: pantau & tangani stok kritis
	 * axes: paper-band: light (>85%) · display-style: roman-serif · accent-hue: warm (60°)
	 * motion: number-tick hero (500ms ease-out; reduced-motion: final value)
	 */

	/* ---------- Hero: angka memimpin, kata melengkapi ---------- */
	.hero {
		margin-bottom: var(--space-xl);
	}

	.sapaan {
		color: var(--color-muted);
		font-size: var(--text-sm);
		margin-bottom: var(--space-sm);
	}

	.hero h1 {
		margin: 0;
		display: grid;
		gap: var(--space-3xs);
	}

	.figure {
		font-family: var(--font-display);
		font-size: var(--text-stat);
		font-weight: 600;
		line-height: 1;
		letter-spacing: -0.02em;
		color: var(--color-ink);
		font-variant-numeric: tabular-nums;
	}

	.figure.kritis {
		color: var(--color-danger);
	}

	.kalimat {
		font-size: var(--text-xl);
		line-height: 1.15;
		max-width: 22ch;
	}

	.kualifikasi {
		color: var(--color-muted);
		font-size: var(--text-sm);
		max-width: 52ch;
		margin: var(--space-md) 0 var(--space-lg);
	}

	/* ---------- Strip metrik: hairline, bukan kartu ---------- */
	.metrik {
		list-style: none;
		margin: 0 0 var(--space-2xl);
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

	.metrik li.nol .nilai {
		color: var(--color-danger);
	}

	.metrik .label {
		font-size: var(--text-xs);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-muted);
	}

	/* ---------- Seksyen berhairline (tanpa kartu) ---------- */
	.sksi {
		margin-bottom: var(--space-2xl);
	}

	.sksi:last-child {
		margin-bottom: 0;
	}

	.sksi h2 {
		margin: 0 0 var(--space-md);
		padding-bottom: var(--space-sm);
		border-bottom: var(--rule-hair) solid var(--color-rule);
		font-size: var(--text-md);
		color: var(--color-ink);
	}

	.kosong {
		color: var(--color-muted);
		font-size: var(--text-sm);
		margin: 0;
		padding: var(--space-xs) 0;
	}

	.tabel-wrap {
		overflow-x: auto;
	}

	/* ---------- Grafik ---------- */
	.grafik {
		margin: var(--space-md) 0 0;
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

		.rentang {
			margin-left: 0;
		}
	}
</style>
