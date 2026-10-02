import { fail } from '@sveltejs/kit'
import { requireUser } from '$lib/auth'
import { getSupabaseAdminClient } from '$lib/supabase/server'
import { ambil, embedPertama } from '$lib/format'
import type { Actions, PageServerLoad } from './$types'

/** Password default hasil reset oleh owner. */
const PASSWORD_DEFAULT = '12345678'

export const load: PageServerLoad = async ({ locals }) => {
	const { profile } = await requireUser(locals)
	const adalahOwner = profile.role === 'owner'

	const { data, error } = await locals.supabase
		.from('notifikasi')
		.select('id, pesan, dibaca, created_at, bahan_baku(nama, kode, satuan, stok_aktual, stok_minimum)')
		.order('created_at', { ascending: false })
		.limit(100)

	if (error) console.error('Notifikasi: gagal memuat:', error.message)

	// Pengajuan reset password hanya relevan untuk owner.
	let pengajuan: Array<{
		id: string
		username: string
		nama: string
		catatan: string | null
		waktu: string
		dibaca: boolean
	}> = []

	if (adalahOwner) {
		const { data: pj, error: errPj } = await locals.supabase
			.from('pengajuan_reset_password')
			.select('id, username, nama, catatan, status, dibaca_owner, created_at')
			.eq('status', 'menunggu')
			.order('created_at', { ascending: false })

		if (errPj) console.error('Pengajuan reset: gagal memuat:', errPj.message)

		pengajuan = (pj ?? []).map((p) => ({
			id: p.id as string,
			username: p.username as string,
			nama: p.nama as string,
			catatan: (p.catatan as string | null) ?? null,
			waktu: p.created_at as string,
			dibaca: p.dibaca_owner as boolean
		}))
	}

	return {
		adalahOwner,
		pengajuan,
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
	setujui: async ({ locals, request }) => {
		const { user, profile } = await requireUser(locals)
		if (profile.role !== 'owner')
			return fail(403, { message: 'Hanya owner yang dapat menyetujui pengajuan.' })

		const fd = await request.formData()
		const id = ambil(fd, 'id')
		if (!id) return fail(400, { message: 'Pengajuan tidak valid.' })

		// Pastikan pengajuan masih berstatus menunggu.
		const { data: pj } = await locals.supabase
			.from('pengajuan_reset_password')
			.select('id, user_id, username, status')
			.eq('id', id)
			.maybeSingle()

		if (!pj) return fail(404, { message: 'Pengajuan tidak ditemukan.' })
		if (pj.status !== 'menunggu')
			return fail(400, { message: 'Pengajuan ini sudah diproses sebelumnya.' })

		// Reset password ke default via service role.
		const admin = getSupabaseAdminClient()
		const { error: errReset } = await admin.auth.admin.updateUserById(pj.user_id as string, {
			password: PASSWORD_DEFAULT
		})
		if (errReset) return fail(400, { message: `Gagal reset password: ${errReset.message}` })

		const { error: errUpdate } = await locals.supabase
			.from('pengajuan_reset_password')
			.update({
				status: 'disetujui',
				dibaca_owner: true,
				diproses_oleh: user.id,
				diproses_at: new Date().toISOString()
			})
			.eq('id', id)
		if (errUpdate) return fail(400, { message: 'Password direset, tetapi status pengajuan gagal disimpan.' })

		return {
			success: `Password "${pj.username}" berhasil direset ke ${PASSWORD_DEFAULT}. Beritahukan ke pemilik akun.`
		}
	},

	tolak: async ({ locals, request }) => {
		const { user, profile } = await requireUser(locals)
		if (profile.role !== 'owner')
			return fail(403, { message: 'Hanya owner yang dapat menolak pengajuan.' })

		const fd = await request.formData()
		const id = ambil(fd, 'id')
		const catatan = ambil(fd, 'catatan')
		if (!id) return fail(400, { message: 'Pengajuan tidak valid.' })

		const { data: pj } = await locals.supabase
			.from('pengajuan_reset_password')
			.select('id, status')
			.eq('id', id)
			.maybeSingle()

		if (!pj) return fail(404, { message: 'Pengajuan tidak ditemukan.' })
		if (pj.status !== 'menunggu')
			return fail(400, { message: 'Pengajuan ini sudah diproses sebelumnya.' })

		const { error } = await locals.supabase
			.from('pengajuan_reset_password')
			.update({
				status: 'ditolak',
				dibaca_owner: true,
				catatan: catatan || null,
				diproses_oleh: user.id,
				diproses_at: new Date().toISOString()
			})
			.eq('id', id)
		if (error) return fail(400, { message: 'Gagal menolak pengajuan.' })

		return { success: 'Pengajuan reset password ditolak.' }
	},

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
