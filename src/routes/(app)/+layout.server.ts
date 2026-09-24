import { requireUser } from '$lib/auth'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals }) => {
	const { profile } = await requireUser(locals)

	const { count } = await locals.supabase
		.from('notifikasi')
		.select('id', { count: 'exact', head: true })
		.eq('dibaca', false)

	return { profile, notifBelumDibaca: count ?? 0 }
}
