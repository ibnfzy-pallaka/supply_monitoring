<script lang="ts">
	// Landing publik Supply Monitoring — anon dapat melihat,
	// data & tombol Masuk mengarah ke /login.
	// Semua fakta di halaman ini diambil dari dokumentasi fitur
	// (docs/dokumentasi-fitur-sistem-persediaan-bahan-baku-2026-09-24.md)
	// tanpa metrik atau testimoni karangan.
</script>

<svelte:head>
	<title>Supply Monitoring — Sistem Persediaan Bahan Baku Kopi Waskita</title>
	<meta
		name="description"
		content="Pencatatan persediaan bahan baku Kopi Waskita Makassar: stok real-time, transaksi masuk-keluar, peringatan stok minimum, dan laporan siap cetak."
	/>
</svelte:head>

<!-- ============ NAV · N6 Newspaper masthead ============ -->
<header class="mast">
	<p class="mast-line">
		<span>Sistem Informasi Persediaan Bahan Baku</span>
		<span aria-hidden="true">·</span>
		<span>Kopi Waskita Makassar</span>
		<span aria-hidden="true">·</span>
		<span class="mast-line__year">2026</span>
	</p>
	<h1 class="mast-name">
		<svg class="mast-mark" viewBox="0 0 24 24" aria-hidden="true">
			<!-- mark tangan: biji kopi dua sisi, stroke tunggal -->
			<path
				d="M12 3.5c4.5 2.8 4.5 8.2 0 17-4.5-8.8-4.5-14.2 0-17Z"
				fill="none"
				stroke="currentColor"
				stroke-width="1.6"
			/>
			<path d="M12 5v15" stroke="currentColor" stroke-width="1.2" />
		</svg>
		Supply Monitoring
	</h1>
	<nav class="mast-nav" aria-label="Utama">
		<ul>
			<li><a href="#fitur">Fitur</a></li>
			<li><a href="#alur">Alur kerja</a></li>
			<li><a class="masuk" href="/login">Masuk</a></li>
		</ul>
	</nav>
	<hr class="mast-rule" aria-hidden="true" />
</header>

<main>
	<!-- ============ HERO · kiri-bias, tinggi konten (bukan 100vh) ============ -->
	<section class="hero">
		<div class="hero__grid">
			<div class="hero__text">
				<p class="hero__kicker">Catatan persediaan, ditata ulang</p>
				<h2 class="hero__display">Buku catatan kedai, tanpa buku catatannya.</h2>
				<p class="hero__lede measure">
					Setiap bahan baku yang masuk dan terpakai di Kopi Waskita tercatat pada satu tempat —
					dengan stok yang selalu terkini, peringatan sebelum kehabisan, dan laporan yang bisa
					dicetak kapan pun dibutuhkan.
				</p>
				<div class="hero__cta">
					<a class="btn" href="/login">Masuk ke sistem</a>
					<a class="hero__cta-note" href="#masalah">Hal ini dibuat karena…</a>
				</div>
			</div>
		</div>
	</section>

	<!-- ============ MASALAH → SOLUSI · editorial, hairline list ============ -->
	<section class="masalah" id="masalah">
		<h2 class="sec-title">Empat hal yang dulu hanya bisa dikira</h2>
		<p class="sec-lede measure">
			Diambil langsung dari kondisi operasional sebelum sistem: pencatatan manual di kertas,
			yang berjalan baik sampai suatu hari tidak.
		</p>
		<ol class="masalah__list">
			<li>
				<strong>Stok tinggal berapa?</strong>
				<span>Tidak ada visibilitas sisa bahan — pemilik harus membuka lemari dan menghitung ulang.</span>
			</li>
			<li>
				<strong>Bahan habis mendadak.</strong>
				<span>Stockout terjadi saat operasional berjalan, karena tidak ada peringatan dini.</span>
			</li>
			<li>
				<strong>Salah catat, salah semua.</strong>
				<span>Pencatatan manual rawan human error — satu angka salah, rekap ikut salah.</span>
			</li>
			<li>
				<strong>Laporan menunggu.</strong>
				<span>Rekap persediaan butuh waktu lama untuk disusun, tepat saat keputusan harus diambil.</span>
			</li>
		</ol>
	</section>

	<!-- ============ BENTO · 8 sel, span tak rata ============ -->
	<section class="fitur" id="fitur">
		<h2 class="sec-title">Satu sistem, enam hal yang dikerjakan</h2>

		<div class="bento">
			<!-- sel utama 2×2: monitoring -->
			<article class="cell cell--2x2">
				<h3>Stok terkini, selalu</h3>
				<p>
					Tabel stok seluruh bahan dengan status tiap baris: aman, menipis, atau habis —
					diperbarui otomatis setiap transaksi tercatat.
				</p>
				<table class="contoh" aria-label="Contoh tampilan status stok">
					<thead>
						<tr><th>Bahan</th><th class="num">Sisa</th><th>Status</th></tr>
					</thead>
					<tbody>
						<tr>
							<td>Biji Arabika</td>
							<td class="num">8&nbsp;kg</td>
							<td><span class="badge badge--warn">menipis</span></td>
						</tr>
						<tr>
							<td>Susu UHT</td>
							<td class="num">24&nbsp;L</td>
							<td><span class="badge badge--ok">aman</span></td>
						</tr>
						<tr>
							<td>Cup 12&nbsp;oz</td>
							<td class="num">0&nbsp;pcs</td>
							<td><span class="badge badge--danger">habis</span></td>
						</tr>
					</tbody>
				</table>
				<p class="contoh__label">Contoh tampilan — bukan data aktual</p>
			</article>

			<!-- 1×1 -->
			<article class="cell">
				<h3>Peringatan stok minimum</h3>
				<p>Saat sisa menyentuh batas minimum, notifikasi muncul dengan saran pengadaan — sebelum kedai kehabisan di jam sibuk.</p>
			</article>

			<!-- 1×1 -->
			<article class="cell">
				<h3>Barang masuk &amp; keluar</h3>
				<p>Penerimaan dari supplier dan pemakaian harian tercatat per bahan, per tanggal. Stok ikut menyesuaikan otomatis.</p>
			</article>

			<!-- 2×1 lebar: laporan -->
			<article class="cell cell--2x1">
				<h3>Laporan, siap cetak</h3>
				<p>
					Rekap barang masuk, barang keluar, dan sisa stok per periode — harian, bulanan, atau
					rentang pilihan. Bisa diunduh sebagai PDF untuk arsip atau pertanggungjawaban.
				</p>
			</article>

			<!-- 1×1 -->
			<article class="cell">
				<h3>Hak akses dua peran</h3>
				<p>Owner melihat semuanya; staff mencatat transaksi dan memantau stok. Menu menyesuaikan peran yang masuk.</p>
			</article>

			<!-- 1×1 -->
			<article class="cell">
				<h3>Master data bahan</h3>
				<p>Kategori, satuan (kg, liter, pcs), harga satuan, dan data supplier — satu sumber kebenaran untuk semua modul.</p>
			</article>

			<!-- 1×1 -->
			<article class="cell">
				<h3>Kartu stok</h3>
				<p>Riwayat pergerakan tiap bahan per periode: masuk, keluar, sisa. Angka laporan selalu bisa ditelusuri ke sini.</p>
			</article>

			<!-- 1×1 -->
			<article class="cell">
				<h3>Stock opname</h3>
				<p>Hasil hitung fisik dicatat dengan selisih dan alasannya — sistem menyesuaikan, dan jejaknya tetap terlihat.</p>
			</article>
		</div>
	</section>

	<!-- ============ ALUR KERJA · 4 langkah bernomor (ordinal nyata) ============ -->
	<section class="alur" id="alur">
		<h2 class="sec-title">Sehari di kedai, dalam empat catatan</h2>
		<ol class="alur__steps">
			<li>
				<span class="alur__no" aria-hidden="true">1</span>
				<h3>Terima</h3>
				<p>Bahan datang dari supplier, dicatat — stok bertambah.</p>
			</li>
			<li>
				<span class="alur__no" aria-hidden="true">2</span>
				<h3>Periksa</h3>
				<p>Barista memakai bahan, dicatat — stok berkurang.</p>
			</li>
			<li>
				<span class="alur__no" aria-hidden="true">3</span>
				<h3>Terpingatkan</h3>
				<p>Sisa menyentuh minimum, sistem memperingatkan.</p>
			</li>
			<li>
				<span class="alur__no" aria-hidden="true">4</span>
				<h3>Baca laporan</h3>
				<p>Akhir bulan, rekap tercetak — tanpa menyusun ulang.</p>
			</li>
		</ol>
	</section>

	<!-- ============ CTA · satu tombol ============ -->
	<section class="cta">
		<p class="cta__line">Lemari sudah dihitung pagi ini?</p>
		<a class="btn" href="/login">Masuk ke sistem</a>
	</section>
</main>

<!-- ============ FOOTER · Ft4 dense colophon ============ -->
<footer class="kolofon">
	<p>
		Supply Monitoring · Sistem Informasi Persediaan Bahan Baku · Kopi Waskita Makassar ·
		dibangun dengan SvelteKit dan Supabase · catatan stok disimpan di satu basis data · 2026
	</p>
</footer>

<style>
	/* ===== masthead ===== */
	.mast {
		display: grid;
		gap: var(--space-2xs);
		padding: var(--space-xl) var(--page-gutter) 0;
		text-align: center;
	}

	.mast-line {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center; /* gate 36 */
		gap: var(--space-xs);
		margin: 0;
		font-size: var(--text-xs);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-muted);
	}

	.mast-name {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-sm);
		margin: 0;
		font-size: clamp(2rem, 5vw, 3.5rem);
		font-weight: 600;
		letter-spacing: -0.01em;
		color: var(--color-ink);
	}

	.mast-mark {
		width: 1em;
		height: 1em;
		color: var(--color-accent-deep);
	}

	.mast-nav ul {
		display: inline-flex;
		align-items: center;
		gap: var(--space-lg);
		list-style: none;
		margin: var(--space-xs) 0 0;
		padding: 0;
	}

	.mast-nav a {
		font-size: var(--text-sm);
		color: var(--color-ink-2);
		text-decoration: none;
		white-space: nowrap; /* gate 49 */
		border-bottom: var(--rule-hair) solid transparent;
		padding-bottom: var(--space-3xs);
		transition: border-color var(--dur-short) var(--ease-out);
	}

	.mast-nav a:hover,
	.mast-nav a:focus-visible {
		border-bottom-color: var(--color-accent);
	}

	.mast-nav .masuk {
		color: var(--color-accent-deep);
		font-weight: 700;
	}

	.mast-rule {
		border: 0;
		border-top: var(--rule-hair) solid var(--color-rule);
		border-bottom: var(--rule-hair) solid var(--color-rule);
		height: var(--rule-double);
		margin: var(--space-sm) 0 0;
	}

	/* ===== hero ===== */
	.hero {
		padding: var(--space-2xl) var(--page-gutter) var(--space-3xl);
	}

	.hero__grid {
		max-width: 72rem;
		margin-inline: auto;
	}

	.hero__kicker {
		font-size: var(--text-sm);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-muted);
		margin-bottom: var(--space-sm);
	}

	.hero__display {
		margin: 0 0 var(--space-md);
		font-size: clamp(2rem, 4.5vw, 3.6rem);
		font-weight: 600;
		letter-spacing: -0.015em;
		max-width: 18ch;
	}

	.hero__lede {
		color: var(--color-muted);
		margin-bottom: var(--space-lg);
	}

	.hero__cta {
		display: flex;
		align-items: center; /* gate 36 */
		flex-wrap: wrap;
		gap: var(--space-md);
	}

	.hero__cta-note {
		font-size: var(--text-sm);
		color: var(--color-neutral);
	}

	/* ===== section umum ===== */
	section {
		padding-inline: var(--page-gutter);
	}

	.sec-title {
		font-size: var(--text-xl);
		font-weight: 600;
		letter-spacing: -0.01em;
		margin: 0 0 var(--space-md);
	}

	.sec-lede {
		color: var(--color-muted);
		margin-bottom: var(--space-xl);
	}

	/* ===== masalah ===== */
	.masalah {
		padding-block: var(--space-2xl) var(--space-2xl);
		border-top: var(--rule-hair) solid var(--color-rule);
	}

	.masalah__list {
		margin: 0;
		padding: 0;
		list-style: none;
		max-width: var(--measure);
		display: grid;
		gap: 0;
	}

	.masalah__list li {
		display: grid;
		gap: var(--space-3xs);
		padding-block: var(--space-md);
		border-bottom: var(--rule-hair) solid var(--color-rule);
	}

	.masalah__list strong {
		font-family: var(--font-display);
		font-size: var(--text-md);
		font-weight: 600;
	}

	.masalah__list span {
		color: var(--color-muted);
	}

	/* ===== bento ===== */
	.fitur {
		padding-block: var(--space-2xl);
		border-top: var(--rule-hair) solid var(--color-rule);
	}

	.bento {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		grid-auto-rows: minmax(11rem, auto);
		gap: var(--space-md);
	}

	.cell {
		border: var(--rule-hair) solid var(--color-rule);
		border-radius: var(--radius-sm);
		padding: var(--space-lg);
		background: var(--color-paper);
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		/* reveal stagger — satu-shot per tile (index via nth) */
		opacity: 0;
		transform: translateY(8px);
		animation: cell-reveal var(--dur-long) var(--ease-out) forwards;
	}

	.cell:nth-child(1) { animation-delay: 0ms; }
	.cell:nth-child(2) { animation-delay: 60ms; }
	.cell:nth-child(3) { animation-delay: 120ms; }
	.cell:nth-child(4) { animation-delay: 180ms; }
	.cell:nth-child(5) { animation-delay: 240ms; }
	.cell:nth-child(6) { animation-delay: 300ms; }
	.cell:nth-child(7) { animation-delay: 360ms; }
	.cell:nth-child(8) { animation-delay: 420ms; }

	@keyframes cell-reveal {
		to {
			opacity: 1;
			transform: none;
		}
	}

	/* hover — satu sinyal: rule accent, tanpa scale/shadow (gate 13) */
	.cell:hover {
		border-color: var(--color-accent);
	}

	.cell h3 {
		margin: 0;
		font-size: var(--text-md);
		font-weight: 600;
	}

	.cell p {
		color: var(--color-muted);
		font-size: var(--text-sm);
	}

	.cell--2x2 {
		grid-column: span 2;
		grid-row: span 2;
	}

	.cell--2x1 {
		grid-column: span 2;
	}

	/* contoh tabel di sel utama */
	.contoh {
		margin-top: auto;
	}

	.contoh__label {
		font-size: var(--text-xs);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-neutral);
	}

	/* ===== alur ===== */
	.alur {
		padding-block: var(--space-2xl);
		border-top: var(--rule-hair) solid var(--color-rule);
	}

	.alur__steps {
		margin: 0;
		padding: 0;
		list-style: none;
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: var(--space-lg);
	}

	.alur__steps li {
		display: flex;
		flex-direction: column;
		gap: var(--space-2xs);
		border-top: var(--rule-hair) solid var(--color-ink);
		padding-top: var(--space-sm);
	}

	.alur__no {
		font-family: var(--font-display);
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--color-accent-deep);
	}

	.alur__steps h3 {
		margin: 0;
		font-size: var(--text-md);
	}

	.alur__steps p {
		color: var(--color-muted);
		font-size: var(--text-sm);
	}

	/* ===== cta ===== */
	.cta {
		padding-block: var(--space-2xl);
		border-top: var(--rule-hair) solid var(--color-rule);
		display: flex;
		flex-direction: column;
		align-items: flex-start; /* off-axis kiri — gate 6 */
		gap: var(--space-md);
	}

	.cta__line {
		font-family: var(--font-display);
		font-size: var(--text-lg);
		font-weight: 600;
	}

	/* ===== kolofon ===== */
	.kolofon {
		padding: var(--space-lg) var(--page-gutter) var(--space-2xl);
		border-top: var(--rule-hair) solid var(--color-rule);
	}

	.kolofon p {
		font-size: var(--text-xs);
		letter-spacing: 0.04em;
		color: var(--color-muted);
		max-width: 72ch;
	}

	/* ===== responsive ===== */
	@media (max-width: 60rem) {
		.bento {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.cell--2x2 {
			grid-column: span 2;
			grid-row: span 1;
		}

		.cell--2x1 {
			grid-column: span 2;
		}

		.alur__steps {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 40rem) {
		.hero {
			padding-block: var(--space-xl) var(--space-2xl);
		}

		.mast-nav ul {
			gap: var(--space-md);
		}

		.bento {
			grid-template-columns: 1fr;
		}

		.cell--2x2,
		.cell--2x1 {
			grid-column: span 1;
		}

		.alur__steps {
			grid-template-columns: 1fr;
		}

		.hero__cta {
			flex-direction: column;
			align-items: stretch;
		}

		.hero__cta .btn {
			width: 100%;
		}
	}

	/* reduced motion — reveal jadi crossfade, tanpa translate */
	@media (prefers-reduced-motion: reduce) {
		.cell {
			transform: none;
			animation: cell-reveal-reduced 150ms linear forwards;
		}

		@keyframes cell-reveal-reduced {
			from {
				opacity: 0;
			}

			to {
				opacity: 1;
			}
		}
	}
</style>
