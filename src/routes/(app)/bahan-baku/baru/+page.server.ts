import { fail, redirect } from '@sveltejs/kit'
import { requireAdmin } from '$lib/auth'
import { ambil, angka, pesanDb } from '$lib/format'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	await requireAdmin(locals)
	const { data, error } = await locals.supabase.from('kategori').select('id, nama').order('nama')
	if (error) console.error('Baru bahan: gagal memuat kategori:', error.message)
	return { kategori: data ?? [] }
}

export const actions: Actions = {
	default: async ({ locals, request }) => {
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

		const { error } = await locals.supabase.from('bahan_baku').insert({
			kode,
			nama,
			kategori_id: kategoriId,
			satuan,
			stok_minimum: stokMinimum,
			harga_satuan: hargaSatuan,
			stok_aktual: 0
		})
		if (error) return fail(400, { message: pesanDb(error) })

		redirect(303, '/bahan-baku')
	}
}
