import { requireUser } from '$lib/auth'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals }) => {
	const { profile } = await requireUser(locals)

	const { count } = await locals.supabase
		.from('notifikasi')
		.select('id', { count: 'exact', head: true })
		.eq('dibaca', false)

	// Owner juga melihat pengajuan reset password yang belum diproses.
	let pengajuanMenunggu = 0
	if (profile.role === 'owner') {
		const { count: c } = await locals.supabase
			.from('pengajuan_reset_password')
			.select('id', { count: 'exact', head: true })
			.eq('status', 'menunggu')
		pengajuanMenunggu = c ?? 0
	}

	return { profile, notifBelumDibaca: (count ?? 0) + pengajuanMenunggu }
}
