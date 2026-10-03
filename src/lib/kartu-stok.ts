/**
 * Logika kartu stok — dipisah dari loader agar bisa diuji & dipakai ulang
 * (mis. oleh laporan/cetak atau verifikasi konsistensi).
 */

export type JenisMutasi = 'masuk' | 'keluar' | 'opname'

/** Baris mutasi mentah dari DB, sebelum dihitung saldo berjalannya. */
export type MutasiMentah = {
	tanggal: string
	jenis: JenisMutasi
	/** Untuk jenis masuk/keluar: kuantitas. */
	qty?: number
	/** Untuk jenis opname: stok sistem (saldo sebelum) & stok fisik (saldo sesudah). */
	stokSistem?: number
	stokFisik?: number
	keterangan: string
	createdAt: string
}

export type BarisKartu = {
	tanggal: string
	jenis: JenisMutasi
	/** Perubahan terhadap saldo (+ masuk, − keluar, Δ untuk opname). */
	delta: number
	keterangan: string
	sisa: number
}

export type HasilKartu = {
	kartu: BarisKartu[]
	/** Saldo sebelum mutasi pertama dalam periode. */
	stokAwal: number
	/** Saldo setelah mutasi terakhir dalam periode. */
	stokAkhir: number
	/** Selisih stokAkhir vs saldo acuan (0 = konsisten). */
	selisih: number
	/** true bila stokAkhir === saldo acuan. */
	konsisten: boolean
}

/**
 * Urutkan mutasi secara stabil: tanggal → waktu pembuatan → jenis
 * (masuk → opname → keluar) agar urutan pada hari yang sama deterministik.
 */
const urutanJenis: Record<JenisMutasi, number> = { masuk: 0, opname: 1, keluar: 2 }

export function urutkanMutasi(a: MutasiMentah, b: MutasiMentah): number {
	if (a.tanggal !== b.tanggal) return a.tanggal < b.tanggal ? -1 : 1
	if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1
	return urutanJenis[a.jenis] - urutanJenis[b.jenis]
}

/**
 * Delta satu mutasi terhadap saldo (konstan, tidak bergantung saldo berjalan).
 * - masuk  : +qty
 * - keluar : −qty
 * - opname : stok_fisik − stok_sistem  (opname menyetel saldo secara absolut;
 *            stok_sistem tersimpan saat pencatatan sebagai saldo sebelum opname)
 */
export function deltaMutasi(m: MutasiMentah): number {
	if (m.jenis === 'masuk') return m.qty ?? 0
	if (m.jenis === 'keluar') return -(m.qty ?? 0)
	if (m.stokSistem == null || m.stokFisik == null) return 0
	return m.stokFisik - m.stokSistem
}

/**
 * Hitung kartu stok untuk satu periode.
 *
 * `stokAkhirAcuan` = saldo yang seharusnya di akhir periode. Di loader dihitung
 * dari stok_aktual terkini dikurangi seluruh mutasi SETELAH periode. Bila
 * periode mencakup hari ini, nilainya = stok_aktual.
 *
 *   stok_awal  = stokAkhirAcuan − Σ(delta semua mutasi dalam periode)
 *   sisa[i]    = stok_awal + Σ(delta mutasi ke-1..ke-i)
 *   selisih    = stokAkhir − stokAkhirAcuan   → 0 bila data konsisten
 */
export function hitungKartuStok(mutasi: MutasiMentah[], stokAkhirAcuan: number): HasilKartu {
	const urut = [...mutasi].sort(urutkanMutasi)

	const totalDelta = urut.reduce((acc, m) => acc + deltaMutasi(m), 0)
	const stokAwal = stokAkhirAcuan - totalDelta

	let sisa = stokAwal
	const kartu: BarisKartu[] = urut.map((m) => {
		const delta = deltaMutasi(m)
		sisa += delta
		return { tanggal: m.tanggal, jenis: m.jenis, delta, keterangan: m.keterangan, sisa }
	})

	const selisih = sisa - stokAkhirAcuan
	return {
		kartu,
		stokAwal,
		stokAkhir: sisa,
		selisih,
		konsisten: Math.abs(selisih) < 1e-9
	}
}

/**
 * Verifikasi: apakah saldo akhir kartu stok sama dengan stok nyata?
 * Dipakai untuk laporan konsistensi (poin 2).
 */
export function verifikasiKonsistensi(hasil: HasilKartu, stokNyata: number) {
	return {
		stokKartu: hasil.stokAkhir,
		stokNyata,
		selisih: hasil.stokAkhir - stokNyata,
		konsisten: Math.abs(hasil.stokAkhir - stokNyata) < 1e-9
	}
}
