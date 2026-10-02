/**
 * Utilitas sortir tabel sisi-klien yang bisa dipakai ulang.
 *
 * Dipakai bersama state `sortKey`/`sortDir` di komponen:
 *   let sortKey = $state('tanggal')
 *   let sortDir = $state<SortDir>('asc')
 *   const baris = $derived(sortir(data.transaksi, sortKey, sortDir))
 *   function gantiSort(kolom: string) {
 *     sortDir = arahBerikut(sortKey, kolom, sortDir)
 *     sortKey = kolom
 *   }
 *   <SortableTh kolom="tanggal" aktif={sortKey} dir={sortDir} klik={gantiSort}>Tanggal</SortableTh>
 */

export type SortDir = 'asc' | 'desc'

/**
 * Nilai yang bisa dibandingkan. Tanggal dikenali dari string ISO (YYYY-MM-DD).
 * Nilai kosong/null selalu diletakkan di akhir, apa pun arahnya.
 */
function nilaiBanding(v: unknown): string | number | null {
	if (v === null || v === undefined || v === '') return null
	if (typeof v === 'number') return v
	if (v instanceof Date) return v.getTime()
	if (typeof v === 'string') {
		// Tanggal ISO (YYYY-MM-DD atau dengan waktu) → bandingkan sebagai waktu.
		if (/^\d{4}-\d{2}-\d{2}/.test(v)) {
			const t = new Date(v + (v.length === 10 ? 'T00:00:00' : '')).getTime()
			if (!Number.isNaN(t)) return t
		}
		return v.toLowerCase()
	}
	return String(v).toLowerCase()
}

/**
 * Urutkan salinan array `items` berdasarkan `key` dan arah `dir`.
 * Tidak memodifikasi array asli. Stabil terhadap nilai yang sama.
 */
export function sortir<T>(items: T[], key: keyof T | string, dir: SortDir): T[] {
	if (!items.length) return items
	const k = key as keyof T
	const arah = dir === 'asc' ? 1 : -1

	return items
		.map((item, index) => ({ item, index }))
		.sort((a, b) => {
			const va = nilaiBanding(a.item[k])
			const vb = nilaiBanding(b.item[k])
			// Kosong selalu di akhir.
			if (va === null && vb === null) return a.index - b.index
			if (va === null) return 1
			if (vb === null) return -1
			if (va < vb) return -1 * arah
			if (va > vb) return 1 * arah
			return a.index - b.index
		})
		.map((x) => x.item)
}

/**
 * Arah berikutnya saat header kolom yang sama diklik lagi,
 * atau 'asc' saat berpindah ke kolom baru.
 */
export function arahBerikut(kolomSekarang: string, kolomBaru: string, dir: SortDir): SortDir {
	return kolomSekarang === kolomBaru && dir === 'asc' ? 'desc' : 'asc'
}
