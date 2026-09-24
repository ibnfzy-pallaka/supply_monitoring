import { fail } from '@sveltejs/kit'
import { requireUser } from '$lib/auth'
import { angka, ambil, embedPertama, pesanDb } from '$lib/format'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await requireUser(locals)

	const [trxRes, bahanRes, supplierRes] = await Promise.all([
		locals.supabase
			.from('transaksi_masuk')
			.select(
				'id, tanggal, qty, harga_satuan, keterangan, bahan_baku(nama, satuan), supplier(nama), dibuat_oleh'
			)
			.order('tanggal', { ascending: false })
			.order('created_at', { ascending: false })
			.limit(100),
		locals.supabase.from('bahan_baku').select('id, kode, nama, satuan').order('nama'),
		locals.supabase.from('supplier').select('id, nama').order('nama')
	])

	if (trxRes.error) console.error('Transaksi masuk: gagal memuat:', trxRes.error.message)

	return {
		transaksi: (trxRes.data ?? []).map((t) => {
			const bahan = embedPertama<{ nama: string; satuan: string }>(t.bahan_baku)
			const sup = embedPertama<{ nama: string }>(t.supplier)
			return {
				id: t.id as string,
				tanggal: t.tanggal as string,
				qty: Number(t.qty),
				hargaSatuan: Number(t.harga_satuan),
				keterangan: (t.keterangan as string | null) ?? '',
				bahanNama: bahan?.nama ?? '—',
				satuan: bahan?.satuan ?? '',
				supplierNama: sup?.nama ?? '—'
			}
		}),
		bahan: bahanRes.data ?? [],
		supplier: supplierRes.data ?? []
	}
}

export const actions: Actions = {
	default: async ({ locals, request }) => {
		const { user } = await requireUser(locals)
		const fd = await request.formData()

		const tanggal = ambil(fd, 'tanggal')
		const bahanId = ambil(fd, 'bahan_baku_id')
		const supplierId = ambil(fd, 'supplier_id')
		const qty = angka(fd, 'qty')
		const hargaSatuan = angka(fd, 'harga_satuan')
		const keterangan = ambil(fd, 'keterangan')

		if (!tanggal || !bahanId) return fail(400, { message: 'Tanggal dan bahan wajib dipilih.' })
		if (qty === null || qty <= 0) return fail(400, { message: 'Qty harus lebih dari 0.' })
		if (hargaSatuan === null || hargaSatuan < 0)
			return fail(400, { message: 'Harga satuan tidak boleh negatif.' })

		const { error } = await locals.supabase.from('transaksi_masuk').insert({
			tanggal,
			bahan_baku_id: bahanId,
			supplier_id: supplierId || null,
			qty,
			harga_satuan: hargaSatuan,
			keterangan: keterangan || null,
			dibuat_oleh: user.id
		})
		if (error) return fail(400, { message: pesanDb(error) })

		return { success: `Barang masuk tercatat — stok bertambah ${qty}.` }
	}
}
