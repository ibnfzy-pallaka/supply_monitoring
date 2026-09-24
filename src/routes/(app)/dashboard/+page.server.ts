import { requireUser } from '$lib/auth'
import type { PageServerLoad } from './$types'

/** Rentang N hari terakhir, termasuk hari ini, sebagai YYYY-MM-DD[]. */
function rentangHari(n: number): string[] {
	const hasil: string[] = []
	for (let i = n - 1; i >= 0; i--) {
		const d = new Date()
		d.setDate(d.getDate() - i)
		hasil.push(d.toISOString().slice(0, 10))
	}
	return hasil
}

export const load: PageServerLoad = async ({ locals }) => {
	const { profile } = await requireUser(locals)

	const hari = rentangHari(14)
	const mulai = hari[0]
	const hariIni = hari[hari.length - 1]

	const [bahanRes, notifRes, masukRes, keluarRes] = await Promise.all([
		locals.supabase
			.from('bahan_baku')
			.select('kode, nama, satuan, stok_aktual, stok_minimum')
			.order('nama'),
		locals.supabase
			.from('notifikasi')
			.select('id', { count: 'exact', head: true })
			.eq('dibaca', false),
		locals.supabase
			.from('transaksi_masuk')
			.select('tanggal, qty')
			.gte('tanggal', mulai),
		locals.supabase
			.from('transaksi_keluar')
			.select('tanggal, qty')
			.gte('tanggal', mulai)
	])

	if (bahanRes.error) console.error('Dashboard: gagal memuat bahan baku:', bahanRes.error.message)

	const daftar = (bahanRes.data ?? []).map((b) => ({
		kode: b.kode as string,
		nama: b.nama as string,
		satuan: b.satuan as string,
		stokAktual: Number(b.stok_aktual),
		stokMinimum: Number(b.stok_minimum)
	}))
	const kritis = daftar.filter((b) => b.stokAktual <= b.stokMinimum)

	// Agregasi masuk/keluar per hari untuk grafik 14 hari.
	const peta = new Map<string, { masuk: number; keluar: number }>(
		hari.map((h) => [h, { masuk: 0, keluar: 0 }])
	)
	for (const t of masukRes.data ?? []) {
		const k = t.tanggal as string
		if (peta.has(k)) peta.get(k)!.masuk += Number(t.qty)
	}
	for (const t of keluarRes.data ?? []) {
		const k = t.tanggal as string
		if (peta.has(k)) peta.get(k)!.keluar += Number(t.qty)
	}
	const grafik = hari.map((h) => ({ tanggal: h, ...peta.get(h)! }))

	const masukHariIni = grafik[grafik.length - 1].masuk
	const keluarHariIni = grafik[grafik.length - 1].keluar

	return {
		profile,
		totalBahan: daftar.length,
		kritis,
		notifBelumDibaca: notifRes.count ?? 0,
		masukHariIni,
		keluarHariIni,
		grafik
	}
}
