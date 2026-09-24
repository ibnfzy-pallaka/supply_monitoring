import { fail } from '@sveltejs/kit'
import { requireUser } from '$lib/auth'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	const { profile } = await requireUser(locals)
	return { profile }
}

export const actions: Actions = {
	default: async ({ locals, request }) => {
		await requireUser(locals)
		const fd = await request.formData()

		const password = String(fd.get('password') ?? '')
		const ulang = String(fd.get('ulang') ?? '')

		if (password.length < 6) return fail(400, { message: 'Password baru minimal 6 karakter.' })
		if (password !== ulang) return fail(400, { message: 'Konfirmasi password tidak sama.' })

		const { error } = await locals.supabase.auth.updateUser({ password })
		if (error) return fail(400, { message: error.message })

		return { success: 'Password berhasil diperbarui.' }
	}
}
