import { createBrowserClient } from '@supabase/ssr'
import { env } from '$env/dynamic/public'
import type { SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | undefined

export function getSupabaseBrowserClient(): SupabaseClient {
	if (!client) {
		client = createBrowserClient(env.PUBLIC_SUPABASE_URL, env.PUBLIC_SUPABASE_ANON_KEY)
	}
	return client
}
