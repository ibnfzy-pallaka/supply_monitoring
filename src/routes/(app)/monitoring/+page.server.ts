import { requireUser } from '$lib/auth'
import { embedPertama } from '$lib/format'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	await requireUser(locals)

	const { data, error } = await locals.supabase
		.from('bahan_baku')
		.select('id, kode, nama, satuan, stok_minimum, stok_aktual, harga_satuan, kategori(nama)')
		.order('nama')

	if (error) console.error('Monitoring: gagal memuat:', error.message)

	const bahan = (data ?? []).map((b) => {
		const stokAktual = Number(b.stok_aktual)
		const stokMinimum = Number(b.stok_minimum)
		const hargaSatuan = Number(b.harga_satuan)
		const status = stokAktual <= 0 ? 'habis' : stokAktual <= stokMinimum ? 'menipis' : 'aman'
		// Saran pengadaan: cukup untuk satu siklus pemakaian di atas minimum.
		const saran = stokAktual <= stokMinimum ? Math.max(stokMinimum * 2 - stokAktual, stokMinimum) : null
		return {
			id: b.id as string,
			kode: b.kode as string,
			nama: b.nama as string,
			satuan: b.satuan as string,
			stokAktual,
			stokMinimum,
			hargaSatuan,
			kategoriNama: embedPertama<{ nama: string }>(b.kategori)?.nama ?? '—',
			status: status as 'habis' | 'menipis' | 'aman',
			saran,
			estimasi: saran !== null ? saran * hargaSatuan : null
		}
	})

	return {
		bahan,
		ringkasan: {
			total: bahan.length,
			aman: bahan.filter((b) => b.status === 'aman').length,
			menipis: bahan.filter((b) => b.status === 'menipis').length,
			habis: bahan.filter((b) => b.status === 'habis').length,
			nilaiPersediaan: bahan.reduce((acc, b) => acc + b.stokAktual * b.hargaSatuan, 0),
			estimasiPengadaan: bahan.reduce((acc, b) => acc + (b.estimasi ?? 0), 0)
		}
	}
}
