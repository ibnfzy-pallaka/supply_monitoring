import { fail, redirect } from '@sveltejs/kit'
import { ensureProfile } from '$lib/auth'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, url }) => {
	const { user } = await locals.safeGetSession()
	if (user) redirect(303, '/dashboard')
	return { nonaktif: url.searchParams.get('nonaktif') === '1' }
}

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData()
		const username = String(formData.get('username') ?? '').trim().toLowerCase()
		const password = String(formData.get('password') ?? '')

		if (!username || !password) {
			return fail(400, { error: 'Username dan password wajib diisi.', username })
		}

		// Virtual email mapping untuk Supabase Auth
		const email = username.includes('@') ? username : `${username}@waskita.local`

		const { data, error } = await locals.supabase.auth.signInWithPassword({ email, password })
		if (error || !data.user) {
			return fail(401, { error: 'Username atau password salah.', username })
		}

		const profile = await ensureProfile(locals, data.user)
		if (profile && !profile.aktif) {
			await locals.supabase.auth.signOut()
			return fail(403, { error: 'Akun Anda dinonaktifkan. Hubungi owner.', username })
		}

		redirect(303, '/dashboard')
	}
}
