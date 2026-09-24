import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	// Landing publik: anon melihat branding; yang sudah login langsung
	// masuk ke workspace.
	const { user } = await locals.safeGetSession()
	if (user) redirect(303, '/dashboard')
	return {}
}
