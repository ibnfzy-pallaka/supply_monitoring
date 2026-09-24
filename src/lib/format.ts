const rupiah = new Intl.NumberFormat('id-ID', {
	style: 'currency',
	currency: 'IDR',
	minimumFractionDigits: 0
})

const jumlah = new Intl.NumberFormat('id-ID')

export function formatRupiah(n: number): string {
	return rupiah.format(n)
}

export function formatJumlah(n: number): string {
	return jumlah.format(n)
}

export function formatTanggal(d: string | Date): string {
	const tgl = typeof d === 'string' ? new Date(d + (d.length === 10 ? 'T00:00:00' : '')) : d
	return tgl.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const hariIni = (): string => new Date().toISOString().slice(0, 10)

/**
 * Embed to-one PostgREST bisa berbentuk objek ATAU array — normalisasi keduanya.
 * Contoh: `embedPertama<{ nama: string }>(t.bahan_baku)?.nama`.
 */
export function embedPertama<T>(x: unknown): T | undefined {
	if (x == null) return undefined
	if (Array.isArray(x)) return (x[0] as T | undefined) ?? undefined
	return x as T
}

export type StatusStok = 'habis' | 'menipis' | 'aman'

export function statusStok(aktual: number, minimum: number): StatusStok {
	if (aktual <= 0) return 'habis'
	if (aktual <= minimum) return 'menipis'
	return 'aman'
}

/** Pesan ramah dari kode error Postgres/PostgREST. */
export function pesanDb(err: { code?: string; message: string }): string {
	if (err.code === '23505')
		return 'Data bentrok dengan yang sudah ada — kode/nama harus unik.'
	if (err.code === '23503')
		return 'Data masih dipakai oleh catatan lain dan tidak bisa dihapus.'
	if (err.code === '23502') return 'Ada field wajib yang belum diisi.'
	return `Gagal menyimpan: ${err.message}`
}

export function ambil(fd: FormData, key: string): string {
	return String(fd.get(key) ?? '').trim()
}

export function angka(fd: FormData, key: string): number | null {
	const raw = ambil(fd, key).replace(/\./g, '').replace(',', '.')
	if (raw === '') return null
	const n = Number(raw)
	return Number.isFinite(n) ? n : null
}
