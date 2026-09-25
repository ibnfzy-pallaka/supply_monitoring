import { fail } from '@sveltejs/kit'
import { requireAdmin } from '$lib/auth'
import { getSupabaseAdminClient } from '$lib/supabase/server'
import { ambil } from '$lib/format'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	await requireAdmin(locals)

	const { data, error } = await locals.supabase
		.from('profiles')
		.select('id, email, nama, role, aktif, created_at')
		.order('nama')

	if (error) console.error('Manajemen user: gagal memuat:', error.message)

	return {
		users: (data ?? []).map((u) => {
			const rawEmail = (u.email as string) ?? ''
			const username = rawEmail.endsWith('@waskita.local')
				? rawEmail.replace('@waskita.local', '')
				: rawEmail
			const dbRole = u.role as string
			const role = (dbRole === 'admin' ? 'owner' : dbRole) as 'owner' | 'staff'
			return {
				id: u.id as string,
				username,
				nama: u.nama as string,
				role,
				aktif: u.aktif as boolean
			}
		})
	}
}

export const actions: Actions = {
	create: async ({ locals, request }) => {
		const { user } = await requireAdmin(locals)
		const fd = await request.formData()

		const nama = ambil(fd, 'nama')
		const username = ambil(fd, 'username').toLowerCase().replace(/\s+/g, '')
		const password = String(fd.get('password') ?? '')
		const roleInput = ambil(fd, 'role')
		const role = roleInput === 'owner' || roleInput === 'admin' ? 'admin' : 'staff'
		const displayRole = role === 'admin' ? 'owner' : 'staff'

		if (!nama || !username) return fail(400, { message: 'Nama dan username wajib diisi.' })
		if (password.length < 6)
			return fail(400, { message: 'Password minimal 6 karakter.' })

		const email = username.includes('@') ? username : `${username}@waskita.local`

		const admin = getSupabaseAdminClient()
		const { data: baru, error } = await admin.auth.admin.createUser({
			email,
			password,
			email_confirm: true,
			user_metadata: { nama }
		})
		if (error || !baru.user)
			return fail(400, { message: error?.message ?? 'Gagal membuat akun.' })

		// Trigger DB membuat profil default 'staff' — naikkan bila diminta owner.
		if (role === 'admin') {
			const { error: roleErr } = await locals.supabase
				.from('profiles')
				.update({ role: 'admin' })
				.eq('id', baru.user.id)
			if (roleErr) return fail(400, { message: 'Akun dibuat, tetapi peran owner gagal diset.' })
		}

		return { created: `Akun ${username} dibuat sebagai ${displayRole}.` }
	},

	update: async ({ locals, request }) => {
		const { user, profile } = await requireAdmin(locals)
		const fd = await request.formData()

		const id = ambil(fd, 'id')
		const nama = ambil(fd, 'nama')
		const roleInput = ambil(fd, 'role')
		const role = roleInput === 'owner' || roleInput === 'admin' ? 'admin' : 'staff'
		const aktif = fd.get('aktif') === 'on'

		if (!id || !nama) return fail(400, { message: 'Nama wajib diisi.' })

		// Cegah owner mengunci akunnya sendiri.
		if (id === user.id && (role !== (profile.role === 'owner' ? 'admin' : profile.role) || !aktif))
			return fail(400, {
				message: 'Anda tidak bisa mengubah peran/status akun sendiri — minta owner lain.'
			})

		const { error } = await locals.supabase
			.from('profiles')
			.update({ nama, role, aktif })
			.eq('id', id)
		if (error) return fail(400, { message: 'Gagal menyimpan perubahan profil.' })

		return { updated: 'Profil user diperbarui.' }
	},

	resetPassword: async ({ locals, request }) => {
		const { user } = await requireAdmin(locals)
		const fd = await request.formData()

		const id = ambil(fd, 'id')
		const password = String(fd.get('password') ?? '')

		if (id === user.id)
			return fail(400, { message: 'Untuk ganti password sendiri, gunakan halaman Profil.' })
		if (password.length < 6) return fail(400, { message: 'Password baru minimal 6 karakter.' })

		const admin = getSupabaseAdminClient()
		const { error } = await admin.auth.admin.updateUserById(id, { password })
		if (error) return fail(400, { message: error.message })

		return { updated: 'Password berhasil direset — beritahukan ke pemilik akun.' }
	}
}
