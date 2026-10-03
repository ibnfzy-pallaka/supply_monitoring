import { requireUser } from '$lib/auth'
import {
	deltaMutasi,
	hitungKartuStok,
	type MutasiMentah
} from '$lib/kartu-stok'
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

	let kartu: ReturnType<typeof hitungKartuStok>['kartu'] = []
	let stokAwal = 0
	let stokAkhir = 0
	let stokAktual = 0
	let selisih = 0
	let konsisten = true

	if (bahanId) {
		const filters = { bahan_baku_id: bahanId }
		const gte = dari || '0001-01-01'
		const lte = sampai || '9999-12-31'

		const [masukRes, keluarRes, opnameRes] = await Promise.all([
			locals.supabase
				.from('transaksi_masuk')
				.select('tanggal, qty, keterangan, created_at')
				.match(filters)
				.gte('tanggal', gte)
				.lte('tanggal', lte),
			locals.supabase
				.from('transaksi_keluar')
				.select('tanggal, qty, keterangan, created_at')
				.match(filters)
				.gte('tanggal', gte)
				.lte('tanggal', lte),
			locals.supabase
				.from('stock_opname')
				.select('tanggal, stok_sistem, stok_fisik, alasan, created_at')
				.match(filters)
				.gte('tanggal', gte)
				.lte('tanggal', lte)
		])

		const bahanRow = bahanRes.data?.find((b) => b.id === bahanId)
		stokAktual = Number(bahanRow?.stok_aktual ?? 0)

		const inRange: MutasiMentah[] = [
			...(masukRes.data ?? []).map((t) => ({
				tanggal: t.tanggal as string,
				jenis: 'masuk' as const,
				qty: Number(t.qty),
				keterangan: (t.keterangan as string | null) ?? '',
				createdAt: (t.created_at as string | null) ?? ''
			})),
			...(keluarRes.data ?? []).map((t) => ({
				tanggal: t.tanggal as string,
				jenis: 'keluar' as const,
				qty: Number(t.qty),
				keterangan: (t.keterangan as string | null) ?? '',
				createdAt: (t.created_at as string | null) ?? ''
			})),
			...(opnameRes.data ?? []).map((o) => ({
				tanggal: o.tanggal as string,
				jenis: 'opname' as const,
				stokSistem: Number(o.stok_sistem),
				stokFisik: Number(o.stok_fisik),
				keterangan: (o.alasan as string | null) ?? '',
				createdAt: (o.created_at as string | null) ?? ''
			}))
		]

		// Saldo acuan di akhir periode. Bila periode dibatasi tanggal lampau,
		// buang pengaruh mutasi setelah periode dengan mundur dari stok_aktual.
		let stokAkhirAcuan = stokAktual
		if (sampai && sampai < hariIniIso()) {
			const [masukAfter, keluarAfter, opnameAfter] = await Promise.all([
				locals.supabase
					.from('transaksi_masuk')
					.select('qty')
					.match(filters)
					.gt('tanggal', sampai),
				locals.supabase
					.from('transaksi_keluar')
					.select('qty')
					.match(filters)
					.gt('tanggal', sampai),
				locals.supabase
					.from('stock_opname')
					.select('stok_sistem, stok_fisik')
					.match(filters)
					.gt('tanggal', sampai)
			])

			const sesudah: MutasiMentah[] = [
				...(masukAfter.data ?? []).map((t) => ({
					tanggal: '',
					jenis: 'masuk' as const,
					qty: Number(t.qty),
					keterangan: '',
					createdAt: ''
				})),
				...(keluarAfter.data ?? []).map((t) => ({
					tanggal: '',
					jenis: 'keluar' as const,
					qty: Number(t.qty),
					keterangan: '',
					createdAt: ''
				})),
				...(opnameAfter.data ?? []).map((o) => ({
					tanggal: '',
					jenis: 'opname' as const,
					stokSistem: Number(o.stok_sistem),
					stokFisik: Number(o.stok_fisik),
					keterangan: '',
					createdAt: ''
				}))
			]

			stokAkhirAcuan = stokAktual - sesudah.reduce((a, m) => a + deltaMutasi(m), 0)
		}

		const hasil = hitungKartuStok(inRange, stokAkhirAcuan)
		kartu = hasil.kartu
		stokAwal = hasil.stokAwal
		stokAkhir = hasil.stokAkhir
		selisih = stokAkhir - stokAktual
		konsisten = Math.abs(selisih) < 1e-9
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
		kartu,
		stokAwal,
		stokAkhir,
		stokAktual,
		selisih,
		konsisten
	}
}

function hariIniIso(): string {
	return new Date().toISOString().slice(0, 10)
}
