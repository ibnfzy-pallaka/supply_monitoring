import { json } from '@sveltejs/kit'
import { env as publicEnv } from '$env/dynamic/public'
import { env as privateEnv } from '$env/dynamic/private'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async () => {
	return json({
		status: 'ok',
		env: {
			PUBLIC_SUPABASE_URL: publicEnv.PUBLIC_SUPABASE_URL ? 'set' : 'MISSING',
			PUBLIC_SUPABASE_ANON_KEY: publicEnv.PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'MISSING',
			SUPABASE_SERVICE_ROLE_KEY: privateEnv.SUPABASE_SERVICE_ROLE_KEY ? 'set (server-only)' : 'MISSING'
		}
	})
}
