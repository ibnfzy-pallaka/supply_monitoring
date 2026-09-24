import { fail } from '@sveltejs/kit'
import { error } from '@sveltejs/kit'
import { requireAdmin } from '$lib/auth'
import { ambil, pesanDb } from '$lib/format'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, params }) => {
	await requireAdmin(locals)

	const [supplierRes, relasiRes, bahanRes] = await Promise.all([
		locals.supabase
			.from('supplier')
			.select('id, nama, kontak, alamat')
			.eq('id', params.id)
			.single(),
		locals.supabase
			.from('supplier_bahan_baku')
			.select('bahan_baku_id')
			.eq('supplier_id', params.id),
		locals.supabase.from('bahan_baku').select('id, kode, nama, satuan').order('nama')
	])

	if (supplierRes.error || !supplierRes.data) error(404, 'Supplier tidak ditemukan.')

	return {
		supplier: {
			id: supplierRes.data.id as string,
			nama: supplierRes.data.nama as string,
			kontak: (supplierRes.data.kontak as string | null) ?? '',
			alamat: (supplierRes.data.alamat as string | null) ?? ''
		},
		bahanTerpilih: (relasiRes.data ?? []).map((r) => r.bahan_baku_id as string),
		semuaBahan: bahanRes.data ?? []
	}
}

export const actions: Actions = {
	default: async ({ locals, params, request }) => {
		await requireAdmin(locals)
		const fd = await request.formData()

		const nama = ambil(fd, 'nama')
		const kontak = ambil(fd, 'kontak')
		const alamat = ambil(fd, 'alamat')
		const pilih = fd.getAll('bahan').map(String)

		if (!nama) return fail(400, { message: 'Nama supplier wajib diisi.' })

		const { error: err } = await locals.supabase
			.from('supplier')
			.update({ nama, kontak: kontak || null, alamat: alamat || null })
			.eq('id', params.id)
		if (err) return fail(400, { message: pesanDb(err) })

		// Sinkronkan relasi: hapus yang dilepas, tambah yang baru dicentang.
		const relasiRes = await locals.supabase
			.from('supplier_bahan_baku')
			.select('bahan_baku_id')
			.eq('supplier_id', params.id)
		const ada = (relasiRes.data ?? []).map((r) => r.bahan_baku_id as string)

		const lepas = ada.filter((id) => !pilih.includes(id))
		const tambah = pilih.filter((id) => !ada.includes(id))

		if (lepas.length > 0) {
			const { error: delErr } = await locals.supabase
				.from('supplier_bahan_baku')
				.delete()
				.eq('supplier_id', params.id)
				.in('bahan_baku_id', lepas)
			if (delErr) return fail(400, { message: pesanDb(delErr) })
		}

		if (tambah.length > 0) {
			const { error: addErr } = await locals.supabase
				.from('supplier_bahan_baku')
				.insert(tambah.map((id) => ({ supplier_id: params.id, bahan_baku_id: id })))
			if (addErr) return fail(400, { message: pesanDb(addErr) })
		}

		return { success: 'Perubahan tersimpan.' }
	}
}
