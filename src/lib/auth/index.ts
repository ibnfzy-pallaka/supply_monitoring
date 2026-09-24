import { error, redirect } from '@sveltejs/kit'
import type { User } from '@supabase/supabase-js'
import { getSupabaseAdminClient } from '$lib/supabase/server'

export type Profile = {
	id: string
	email: string
	nama: string
	role: 'admin' | 'staff'
	aktif: boolean
}

const PROFILE_COLUMNS = 'id, email, nama, role, aktif'

export async function getProfile(locals: App.Locals, userId: string): Promise<Profile | null> {
	const { data } = await locals.supabase
		.from('profiles')
		.select(PROFILE_COLUMNS)
		.eq('id', userId)
		.single()
	return (data as Profile | null) ?? null
}

/**
 * Ambil profil user; jika belum ada (mis. user dibuat sebelum trigger
 * on_auth_user_created terpasang), buat otomatis via service role (self-heal).
 */
export async function ensureProfile(locals: App.Locals, user: User): Promise<Profile | null> {
	const existing = await getProfile(locals, user.id)
	if (existing) return existing

	const admin = getSupabaseAdminClient()
	const { data, error: err } = await admin
		.from('profiles')
		.insert({
			id: user.id,
			email: user.email ?? '',
			nama:
				(user.user_metadata?.nama as string | undefined) ??
				(user.email ?? '').split('@')[0],
			role: 'staff'
		})
		.select(PROFILE_COLUMNS)
		.single()

	if (err) {
		console.error('Gagal membuat profil user:', err.message)
		return null
	}
	return data as Profile
}

/** Wajib login & akun aktif; selain itu redirect ke /login. */
export async function requireUser(locals: App.Locals): Promise<{ user: User; profile: Profile }> {
	const { user } = await locals.safeGetSession()
	if (!user) redirect(303, '/login')

	const profile = await ensureProfile(locals, user)
	if (!profile || !profile.aktif) {
		await locals.supabase.auth.signOut()
		redirect(303, '/login?nonaktif=1')
	}

	return { user, profile }
}

/** Wajib login + role admin; selain itu 403. */
export async function requireAdmin(locals: App.Locals): Promise<{ user: User; profile: Profile }> {
	const { user, profile } = await requireUser(locals)
	if (profile.role !== 'admin') {
		error(403, 'Akses ditolak — halaman ini khusus admin.')
	}
	return { user, profile }
}
