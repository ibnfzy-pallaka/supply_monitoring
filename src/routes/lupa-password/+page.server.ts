import { fail } from '@sveltejs/kit'
import { getSupabaseAdminClient } from '$lib/supabase/server'
import { ambil } from '$lib/format'
import type { Actions, PageServerLoad } from './$types'

/** Pesan untuk owner yang lupa password — minta hubungi developer. */
const PESAN_OWNER =
	'Akun Owner tidak dapat direset melalui sistem. Silakan hubungi developer aplikasi untuk bantuan pemulihan akun.'

export const load: PageServerLoad = async () => {
	return {}
}

export const actions: Actions = {
	default: async ({ request }) => {
		const fd = await request.formData()
		const username = ambil(fd, 'username').toLowerCase().replace(/\s+/g, '')

		if (!username) {
			return fail(400, { error: 'Username wajib diisi.', username: '', tipe: null })
		}

		// Service role: halaman publik (belum login), perlu baca profil tanpa sesi.
		const admin = getSupabaseAdminClient()

		const email = username.includes('@') ? username : `${username}@waskita.local`
		const { data: profil, error: errProfil } = await admin
			.from('profiles')
			.select('id, email, nama, role, aktif')
			.eq('email', email)
			.maybeSingle()

		if (errProfil) console.error('Lupa password: gagal memuat profil:', errProfil.message)

		// Hindari enumerasi akun: username tak dikenal & akun nonaktif
		// sama-sama dijawab dengan pesan generik "pengajuan dikirim".
		if (!profil || !profil.aktif) {
			return {
				success: `Pengajuan reset password untuk "${username}" telah dikirim ke Owner. Silakan tunggu persetujuan.`,
				tipe: 'pengajuan',
				username: ''
			}
		}

		// Owner → arahkan hubungi developer.
		if (profil.role === 'admin') {
			return fail(403, { error: PESAN_OWNER, username: '', tipe: 'owner' })
		}

		// Sudah ada pengajuan menunggu? Beri tahu tanpa membuat duplikat.
		const { data: existing } = await admin
			.from('pengajuan_reset_password')
			.select('id')
			.eq('user_id', profil.id)
			.eq('status', 'menunggu')
			.maybeSingle()

		if (existing) {
			return {
				success:
					'Pengajuan reset password Anda sudah terkirim dan sedang menunggu persetujuan Owner.',
				tipe: 'pengajuan',
				username: ''
			}
		}

		const { error: errIns } = await admin.from('pengajuan_reset_password').insert({
			user_id: profil.id,
			username,
			nama: profil.nama as string
		})

		if (errIns) {
			console.error('Lupa password: gagal menyimpan pengajuan:', errIns.message)
			return fail(500, {
				error: 'Gagal mengirim pengajuan. Coba lagi beberapa saat lagi.',
				username,
				tipe: null
			})
		}

		return {
			success: `Pengajuan reset password untuk "${username}" telah dikirim ke Owner. Silakan tunggu persetujuan.`,
			tipe: 'pengajuan',
			username: ''
		}
	}
}
