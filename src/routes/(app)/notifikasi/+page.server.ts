import { fail } from '@sveltejs/kit'
import { requireUser } from '$lib/auth'
import { ambil, embedPertama } from '$lib/format'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	await requireUser(locals)

	const { data, error } = await locals.supabase
		.from('notifikasi')
		.select('id, pesan, dibaca, created_at, bahan_baku(nama, kode, satuan, stok_aktual, stok_minimum)')
		.order('created_at', { ascending: false })
		.limit(100)

	if (error) console.error('Notifikasi: gagal memuat:', error.message)

	return {
		notifikasi: (data ?? []).map((n) => {
			const bahan = embedPertama<{
				nama: string
				kode: string
				satuan: string
				stok_aktual: number
				stok_minimum: number
			}>(n.bahan_baku)
			return {
				id: n.id as string,
				pesan: n.pesan as string,
				dibaca: n.dibaca as boolean,
				waktu: n.created_at as string,
				bahanNama: bahan?.nama ?? null,
				bahanKode: bahan?.kode ?? null,
				stokAktual: bahan ? Number(bahan.stok_aktual) : null,
				stokMinimum: bahan ? Number(bahan.stok_minimum) : null
			}
		})
	}
}

export const actions: Actions = {
	baca: async ({ locals, request }) => {
		await requireUser(locals)
		const fd = await request.formData()
		const id = ambil(fd, 'id')

		if (!id) return fail(400, { message: 'Notifikasi tidak valid.' })

		const { error } = await locals.supabase
			.from('notifikasi')
			.update({ dibaca: true })
			.eq('id', id)
		if (error) return fail(400, { message: 'Gagal menandai notifikasi.' })

		return { success: 'Notifikasi ditandai dibaca.' }
	},

	bacaSemua: async ({ locals }) => {
		await requireUser(locals)

		const { error } = await locals.supabase
			.from('notifikasi')
			.update({ dibaca: true })
			.eq('dibaca', false)
		if (error) return fail(400, { message: 'Gagal menandai semua notifikasi.' })

		return { success: 'Semua notifikasi ditandai dibaca.' }
	}
}
