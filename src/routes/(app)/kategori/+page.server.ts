import { fail } from '@sveltejs/kit'
import { requireAdmin, requireUser } from '$lib/auth'
import { ambil, pesanDb } from '$lib/format'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, url }) => {
	await requireUser(locals)

	const editId = url.searchParams.get('edit') ?? ''

	const { data, error } = await locals.supabase.from('kategori').select('*').order('nama')
	if (error) console.error('Kategori: gagal memuat:', error.message)

	const kategori = (data ?? []).map((k) => ({
		id: k.id as string,
		nama: k.nama as string,
		deskripsi: (k.deskripsi as string | null) ?? ''
	}))

	return {
		kategori,
		editing: kategori.find((k) => k.id === editId) ?? null
	}
}

export const actions: Actions = {
	create: async ({ locals, request }) => {
		await requireAdmin(locals)
		const fd = await request.formData()
		const nama = ambil(fd, 'nama')
		const deskripsi = ambil(fd, 'deskripsi')

		if (!nama) return fail(400, { message: 'Nama kategori wajib diisi.' })

		const { error } = await locals.supabase
			.from('kategori')
			.insert({ nama, deskripsi: deskripsi || null })
		if (error) return fail(400, { message: pesanDb(error) })

		return { created: 'Kategori ditambahkan.' }
	},

	update: async ({ locals, request }) => {
		await requireAdmin(locals)
		const fd = await request.formData()
		const id = ambil(fd, 'id')
		const nama = ambil(fd, 'nama')
		const deskripsi = ambil(fd, 'deskripsi')

		if (!id || !nama) return fail(400, { message: 'Nama kategori wajib diisi.' })

		const { error } = await locals.supabase
			.from('kategori')
			.update({ nama, deskripsi: deskripsi || null })
			.eq('id', id)
		if (error) return fail(400, { message: pesanDb(error) })

		return { updated: 'Kategori diperbarui.' }
	},

	delete: async ({ locals, request }) => {
		await requireAdmin(locals)
		const fd = await request.formData()
		const id = ambil(fd, 'id')

		const { error } = await locals.supabase.from('kategori').delete().eq('id', id)
		if (error) return fail(400, { message: pesanDb(error) })

		return { deleted: 'Kategori dihapus.' }
	}
}
