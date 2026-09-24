import type { Handle } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createSupabaseServerClient(event.cookies)

	// Helper akses session yang aman (refresh token otomatis via cookie exchange)
	event.locals.safeGetSession = async () => {
		const {
			data: { user }
		} = await event.locals.supabase.auth.getUser()

		if (!user) {
			return { session: null, user: null }
		}

		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession()

		return { session, user }
	}

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version'
		}
	})
}
