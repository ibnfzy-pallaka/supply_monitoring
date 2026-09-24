import { fail, redirect } from '@sveltejs/kit'
import { requireAdmin } from '$lib/auth'
import { ambil, pesanDb } from '$lib/format'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	await requireAdmin(locals)

	const { data } = await locals.supabase.from('bahan_baku').select('id, kode, nama, satuan').order('nama')
	return { semuaBahan: data ?? [] }
}

export const actions: Actions = {
	default: async ({ locals, request }) => {
		await requireAdmin(locals)
		const fd = await request.formData()

		const nama = ambil(fd, 'nama')
		const kontak = ambil(fd, 'kontak')
		const alamat = ambil(fd, 'alamat')
		const pilihBahan = fd.getAll('bahan').map(String)

		if (!nama) return fail(400, { message: 'Nama supplier wajib diisi.' })

		const { data: baru, error } = await locals.supabase
			.from('supplier')
			.insert({ nama, kontak: kontak || null, alamat: alamat || null })
			.select('id')
			.single()
		if (error || !baru) return fail(400, { message: error ? pesanDb(error) : 'Gagal menyimpan supplier.' })

		if (pilihBahan.length > 0) {
			const relasi = pilihBahan.map((bahan_baku_id) => ({
				supplier_id: baru.id as string,
				bahan_baku_id
			}))
			const { error: relErr } = await locals.supabase.from('supplier_bahan_baku').insert(relasi)
			if (relErr) return fail(400, { message: pesanDb(relErr) })
		}

		redirect(303, '/supplier')
	}
}
