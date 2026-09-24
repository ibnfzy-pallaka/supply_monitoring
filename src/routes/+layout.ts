import type { LayoutLoad } from './$types'
import { getSupabaseBrowserClient } from '$lib/supabase/client'

export const load: LayoutLoad = async ({ depends }) => {
	depends('supabase:auth')

	const supabase = getSupabaseBrowserClient()

	const {
		data: { session }
	} = await supabase.auth.getSession()

	return { supabase, session }
}
