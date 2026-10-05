import { fail } from '@sveltejs/kit'
import { requireUser } from '$lib/auth'
import { angka, ambil, embedPertama, pesanDb } from '$lib/format'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, url }) => {
	const { user } = await requireUser(locals)

	const dari = url.searchParams.get('dari') ?? ''
	const sampai = url.searchParams.get('sampai') ?? ''

	let trxQuery = locals.supabase
		.from('transaksi_keluar')
		.select('id, tanggal, qty, keterangan, bahan_baku(nama, satuan), dibuat_oleh')
		.order('tanggal', { ascending: false })
		.order('created_at', { ascending: false })
		.limit(100)
	if (dari) trxQuery = trxQuery.gte('tanggal', dari)
	if (sampai) trxQuery = trxQuery.lte('tanggal', sampai)

	const [trxRes, bahanRes] = await Promise.all([
		trxQuery,
		locals.supabase
			.from('bahan_baku')
			.select('id, kode, nama, satuan, stok_aktual')
			.order('nama')
	])

	if (trxRes.error) console.error('Transaksi keluar: gagal memuat:', trxRes.error.message)

	return {
		transaksi: (trxRes.data ?? []).map((t) => {
			const bahan = embedPertama<{ nama: string; satuan: string }>(t.bahan_baku)
			return {
				id: t.id as string,
				tanggal: t.tanggal as string,
				qty: Number(t.qty),
				keterangan: (t.keterangan as string | null) ?? '',
				bahanNama: bahan?.nama ?? '—',
				satuan: bahan?.satuan ?? ''
			}
		}),
		bahan: (bahanRes.data ?? []).map((b) => ({
			id: b.id as string,
			kode: b.kode as string,
			nama: b.nama as string,
			satuan: b.satuan as string,
			stokAktual: Number(b.stok_aktual)
		})),
		dari,
		sampai
	}
}

export const actions: Actions = {
	default: async ({ locals, request }) => {
		const { user } = await requireUser(locals)
		const fd = await request.formData()

		const tanggal = ambil(fd, 'tanggal')
		const bahanId = ambil(fd, 'bahan_baku_id')
		const qty = angka(fd, 'qty')
		const keterangan = ambil(fd, 'keterangan')

		if (!tanggal || !bahanId) return fail(400, { message: 'Tanggal dan bahan wajib dipilih.' })
		if (qty === null || qty <= 0) return fail(400, { message: 'Qty harus lebih dari 0.' })

		// Cek stok lebih dulu agar pesan ramah — trigger DB tetap pengaman akhir.
		const { data: bahan } = await locals.supabase
			.from('bahan_baku')
			.select('nama, satuan, stok_aktual')
			.eq('id', bahanId)
			.single()
		if (bahan && Number(bahan.stok_aktual) < qty) {
			return fail(400, {
				message: `Stok ${bahan.nama} tidak mencukupi — tersisa ${Number(bahan.stok_aktual)} ${bahan.satuan}, diminta ${qty}.`
			})
		}

		const { error } = await locals.supabase.from('transaksi_keluar').insert({
			tanggal,
			bahan_baku_id: bahanId,
			qty,
			keterangan: keterangan || null,
			dibuat_oleh: user.id
		})
		if (error) {
			// Trigger melempar exception bila stok kurang saat race.
			if (error.message.includes('Stok tidak mencukupi'))
				return fail(400, { message: error.message })
			return fail(400, { message: pesanDb(error) })
		}

		return { success: `Barang keluar tercatat — stok berkurang ${qty}.` }
	}
}
