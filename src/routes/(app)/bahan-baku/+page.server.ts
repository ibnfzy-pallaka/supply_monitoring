import { fail, redirect } from '@sveltejs/kit'
import { requireUser, requireAdmin } from '$lib/auth'
import { pesanDb } from '$lib/format'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, url }) => {
	await requireUser(locals)

	const q = (url.searchParams.get('q') ?? '').trim()
	const kategoriId = url.searchParams.get('kategori') ?? ''

	let query = locals.supabase
		.from('bahan_baku')
		.select(
			'id, kode, nama, satuan, stok_minimum, stok_aktual, harga_satuan, kategori_id, kategori(nama)'
		)
		.order('nama')

	if (q) {
		const bersih = q.replace(/[,%]/g, ' ')
		query = query.or(`kode.ilike.%${bersih}%,nama.ilike.%${bersih}%`)
	}
	if (kategoriId) query = query.eq('kategori_id', kategoriId)

	const [bahanRes, kategoriRes] = await Promise.all([
		query,
		locals.supabase.from('kategori').select('id, nama').order('nama')
	])

	if (bahanRes.error) console.error('Bahan baku: gagal memuat:', bahanRes.error.message)

	const bahan = (bahanRes.data ?? []).map((b) => ({
		id: b.id as string,
		kode: b.kode as string,
		nama: b.nama as string,
		satuan: b.satuan as string,
		stokMinimum: Number(b.stok_minimum),
		stokAktual: Number(b.stok_aktual),
		hargaSatuan: Number(b.harga_satuan),
		kategoriId: b.kategori_id as string | null,
		kategoriNama: ((b.kategori as unknown as { nama: string } | null)?.nama) ?? '—'
	}))

	return {
		bahan,
		kategori: kategoriRes.data ?? [],
		q,
		kategoriId
	}
}

export const actions: Actions = {
	delete: async ({ locals, request }) => {
		await requireAdmin(locals)
		const fd = await request.formData()
		const id = String(fd.get('id') ?? '')

		const { error } = await locals.supabase.from('bahan_baku').delete().eq('id', id)
		if (error) return fail(400, { message: pesanDb(error) })

		return { deleted: true }
	}
}
