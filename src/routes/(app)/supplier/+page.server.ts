import { fail } from '@sveltejs/kit'
import { requireAdmin, requireUser } from '$lib/auth'
import { pesanDb } from '$lib/format'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	await requireUser(locals)

	const { data, error } = await locals.supabase
		.from('supplier')
		.select('id, nama, kontak, alamat, supplier_bahan_baku(count)')
		.order('nama')

	if (error) console.error('Supplier: gagal memuat:', error.message)

	const supplier = (data ?? []).map((s) => ({
		id: s.id as string,
		nama: s.nama as string,
		kontak: (s.kontak as string | null) ?? '',
		alamat: (s.alamat as string | null) ?? '',
		jumlahBahan: (s.supplier_bahan_baku as { count: number }[] | null)?.[0]?.count ?? 0
	}))

	return { supplier }
}

export const actions: Actions = {
	delete: async ({ locals, request }) => {
		await requireAdmin(locals)
		const fd = await request.formData()
		const id = String(fd.get('id') ?? '')

		const { error } = await locals.supabase.from('supplier').delete().eq('id', id)
		if (error) return fail(400, { message: pesanDb(error) })

		return { deleted: true }
	}
}
