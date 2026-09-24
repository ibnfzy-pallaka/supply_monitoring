import { requireUser } from '$lib/auth'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, url }) => {
	await requireUser(locals)

	const bahanId = url.searchParams.get('bahan') ?? ''
	const dari = url.searchParams.get('dari') ?? ''
	const sampai = url.searchParams.get('sampai') ?? ''

	const bahanRes = await locals.supabase
		.from('bahan_baku')
		.select('id, kode, nama, satuan, stok_aktual')
		.order('nama')

	const kartu: {
		tanggal: string
		jenis: 'masuk' | 'keluar'
		qty: number
		keterangan: string
		sisa: number
	}[] = []

	if (bahanId) {
		const filters = { bahan_baku_id: bahanId }

		const [masukRes, keluarRes] = await Promise.all([
			locals.supabase
				.from('transaksi_masuk')
				.select('tanggal, qty, keterangan')
				.match(filters)
				.gte('tanggal', dari || '0001-01-01')
				.lte('tanggal', sampai || '9999-12-31')
				.order('tanggal')
				.order('created_at'),
			locals.supabase
				.from('transaksi_keluar')
				.select('tanggal, qty, keterangan')
				.match(filters)
				.gte('tanggal', dari || '0001-01-01')
				.lte('tanggal', sampai || '9999-12-31')
				.order('tanggal')
				.order('created_at')
		])

		const stokAwalSaatIni =
			Number(bahanRes.data?.find((b) => b.id === bahanId)?.stok_aktual ?? 0)
		const totalMasuk = (masukRes.data ?? []).reduce((a, t) => a + Number(t.qty), 0)
		const totalKeluar = (keluarRes.data ?? []).reduce((a, t) => a + Number(t.qty), 0)
		let sisa = stokAwalSaatIni - totalMasuk + totalKeluar // stok awal periode

		const semua: { tanggal: string; jenis: 'masuk' | 'keluar'; qty: number; keterangan: string }[] = [
			...(masukRes.data ?? []).map((t) => ({
				tanggal: t.tanggal as string,
				jenis: 'masuk' as const,
				qty: Number(t.qty),
				keterangan: (t.keterangan as string | null) ?? ''
			})),
			...(keluarRes.data ?? []).map((t) => ({
				tanggal: t.tanggal as string,
				jenis: 'keluar' as const,
				qty: Number(t.qty),
				keterangan: (t.keterangan as string | null) ?? ''
			}))
		].sort((a, b) => (a.tanggal === b.tanggal ? 0 : a.tanggal < b.tanggal ? -1 : 1))

		for (const t of semua) {
			sisa += t.jenis === 'masuk' ? t.qty : -t.qty
			kartu.push({ ...t, sisa })
		}
	}

	return {
		bahan: (bahanRes.data ?? []).map((b) => ({
			id: b.id as string,
			kode: b.kode as string,
			nama: b.nama as string,
			satuan: b.satuan as string,
			stokAktual: Number(b.stok_aktual)
		})),
		bahanId,
		dari,
		sampai,
		kartu
	}
}
