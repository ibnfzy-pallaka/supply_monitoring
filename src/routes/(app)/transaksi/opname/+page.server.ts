import { fail } from '@sveltejs/kit'
import { requireAdmin, requireUser } from '$lib/auth'
import { angka, ambil, embedPertama, pesanDb } from '$lib/format'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	await requireUser(locals)

	const [opnameRes, bahanRes] = await Promise.all([
		locals.supabase
			.from('stock_opname')
			.select(
				'id, tanggal, stok_sistem, stok_fisik, selisih, alasan, bahan_baku(nama, satuan)'
			)
			.order('tanggal', { ascending: false })
			.order('created_at', { ascending: false })
			.limit(100),
		locals.supabase
			.from('bahan_baku')
			.select('id, kode, nama, satuan, stok_aktual')
			.order('nama')
	])

	if (opnameRes.error) console.error('Stock opname: gagal memuat:', opnameRes.error.message)

	return {
		opname: (opnameRes.data ?? []).map((o) => {
			const bahan = embedPertama<{ nama: string; satuan: string }>(o.bahan_baku)
			return {
				id: o.id as string,
				tanggal: o.tanggal as string,
				stokSistem: Number(o.stok_sistem),
				stokFisik: Number(o.stok_fisik),
				selisih: Number(o.selisih),
				alasan: o.alasan as string,
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
		}))
	}
}

export const actions: Actions = {
	default: async ({ locals, request }) => {
		const { user } = await requireAdmin(locals)
		const fd = await request.formData()

		const tanggal = ambil(fd, 'tanggal')
		const bahanId = ambil(fd, 'bahan_baku_id')
		const stokFisik = angka(fd, 'stok_fisik')
		const alasan = ambil(fd, 'alasan')

		if (!tanggal || !bahanId) return fail(400, { message: 'Tanggal dan bahan wajib dipilih.' })
		if (stokFisik === null || stokFisik < 0)
			return fail(400, { message: 'Stok fisik tidak boleh negatif.' })
		if (!alasan) return fail(400, { message: 'Alasan penyesuaian wajib diisi.' })

		const { data: bahan } = await locals.supabase
			.from('bahan_baku')
			.select('stok_aktual')
			.eq('id', bahanId)
			.single()
		if (!bahan) return fail(400, { message: 'Bahan tidak ditemukan.' })

		const { error } = await locals.supabase.from('stock_opname').insert({
			tanggal,
			bahan_baku_id: bahanId,
			stok_sistem: Number(bahan.stok_aktual),
			stok_fisik: stokFisik,
			alasan,
			dibuat_oleh: user.id
		})
		if (error) return fail(400, { message: pesanDb(error) })

		return { success: 'Stock opname tersimpan — stok sistem disesuaikan.' }
	}
}
