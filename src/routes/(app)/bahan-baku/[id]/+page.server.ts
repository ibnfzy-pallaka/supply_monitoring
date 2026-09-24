import { fail } from '@sveltejs/kit'
import { requireAdmin } from '$lib/auth'
import { ambil, angka, pesanDb } from '$lib/format'
import { error } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, params }) => {
	await requireAdmin(locals)

	const [bahanRes, kategoriRes] = await Promise.all([
		locals.supabase
			.from('bahan_baku')
			.select('id, kode, nama, kategori_id, satuan, stok_minimum, stok_aktual, harga_satuan')
			.eq('id', params.id)
			.single(),
		locals.supabase.from('kategori').select('id, nama').order('nama')
	])

	if (bahanRes.error || !bahanRes.data) error(404, 'Bahan baku tidak ditemukan.')

	return {
		bahan: {
			id: bahanRes.data.id as string,
			kode: bahanRes.data.kode as string,
			nama: bahanRes.data.nama as string,
			kategoriId: bahanRes.data.kategori_id as string | null,
			satuan: bahanRes.data.satuan as string,
			stokMinimum: Number(bahanRes.data.stok_minimum),
			stokAktual: Number(bahanRes.data.stok_aktual),
			hargaSatuan: Number(bahanRes.data.harga_satuan)
		},
		kategori: kategoriRes.data ?? []
	}
}

export const actions: Actions = {
	default: async ({ locals, params, request }) => {
		await requireAdmin(locals)
		const fd = await request.formData()

		const kode = ambil(fd, 'kode')
		const nama = ambil(fd, 'nama')
		const kategoriId = ambil(fd, 'kategori_id')
		const satuan = ambil(fd, 'satuan')
		const stokMinimum = angka(fd, 'stok_minimum')
		const hargaSatuan = angka(fd, 'harga_satuan')

		if (!kode || !nama || !kategoriId || !satuan)
			return fail(400, { message: 'Kode, nama, kategori, dan satuan wajib diisi.' })
		if (stokMinimum === null || stokMinimum < 0)
			return fail(400, { message: 'Stok minimum harus angka ≥ 0.' })
		if (hargaSatuan === null || hargaSatuan < 0)
			return fail(400, { message: 'Harga satuan harus angka ≥ 0.' })

		const { error: err } = await locals.supabase
			.from('bahan_baku')
			.update({
				kode,
				nama,
				kategori_id: kategoriId,
				satuan,
				stok_minimum: stokMinimum,
				harga_satuan: hargaSatuan
			})
			.eq('id', params.id)
		if (err) return fail(400, { message: pesanDb(err) })

		return { success: 'Perubahan tersimpan.' }
	}
}
