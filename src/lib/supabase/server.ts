import { createServerClient } from '@supabase/ssr'
import { env as publicEnv } from '$env/dynamic/public'
import { env as privateEnv } from '$env/dynamic/private'
import type { Cookies } from '@sveltejs/kit'
import type { SupabaseClient } from '@supabase/supabase-js'

export function createSupabaseServerClient(cookies: Cookies): SupabaseClient {
	return createServerClient(
		publicEnv.PUBLIC_SUPABASE_URL ?? '',
		publicEnv.PUBLIC_SUPABASE_ANON_KEY ?? '',
		{
			cookies: {
				getAll() {
					return cookies.getAll()
				},
				setAll(cookiesToSet) {
					try {
						cookiesToSet.forEach(({ name, value, options }) =>
							cookies.set(name, value, { ...options, path: '/' })
						)
					} catch {
						// Dipanggil dari Server Component — diabaikan, middleware/session
						// refresh yang akan menangani cookie.
					}
				}
			}
		}
	)
}

/**
 * Client dengan service_role key — melewati RLS & kebijakan auth.
 * HANYA untuk kebutuhan admin di server (mis. manajemen user).
 * Jangan pernah diimpor di kode yang berjalan di browser.
 */
export function getSupabaseAdminClient(): SupabaseClient {
	const url = publicEnv.PUBLIC_SUPABASE_URL
	const key = privateEnv.SUPABASE_SERVICE_ROLE_KEY

	if (!url || !key) {
		throw new Error('SUPABASE_SERVICE_ROLE_KEY atau PUBLIC_SUPABASE_URL belum di-set di environment')
	}

	return createServerClient(url, key, {
		cookies: {
			getAll() {
				return []
			},
			setAll() {
				// no-op: service role client tidak butuh session cookie
			}
		}
	})
}
