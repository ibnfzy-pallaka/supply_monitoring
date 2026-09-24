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
		const email = String(formData.get('email') ?? '').trim().toLowerCase()
		const password = String(formData.get('password') ?? '')

		if (!email || !password) {
			return fail(400, { error: 'Email dan password wajib diisi.', email })
		}

		const { data, error } = await locals.supabase.auth.signInWithPassword({ email, password })
		if (error || !data.user) {
			return fail(401, { error: 'Email atau password salah.', email })
		}

		const profile = await ensureProfile(locals, data.user)
		if (profile && !profile.aktif) {
			await locals.supabase.auth.signOut()
			return fail(403, { error: 'Akun Anda dinonaktifkan. Hubungi admin.', email })
		}

		redirect(303, '/dashboard')
	}
}
