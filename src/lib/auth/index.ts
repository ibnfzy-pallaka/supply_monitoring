import { error, redirect } from '@sveltejs/kit'
import type { User } from '@supabase/supabase-js'
import { getSupabaseAdminClient } from '$lib/supabase/server'

export type Profile = {
	id: string
	email: string
	username: string
	nama: string
	role: 'owner' | 'staff'
	aktif: boolean
}

const PROFILE_COLUMNS = 'id, email, nama, role, aktif'

export async function getProfile(locals: App.Locals, userId: string): Promise<Profile | null> {
	const { data } = await locals.supabase
		.from('profiles')
		.select(PROFILE_COLUMNS)
		.eq('id', userId)
		.single()
	if (!data) return null
	const rawEmail = (data.email as string) ?? ''
	const username = rawEmail.endsWith('@waskita.local')
		? rawEmail.replace('@waskita.local', '')
		: rawEmail
	const role = data.role === 'admin' ? 'owner' : (data.role as 'owner' | 'staff')
	return { ...(data as Omit<Profile, 'username' | 'role'>), username, role }
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
	const rawEmail = (data.email as string) ?? ''
	const username = rawEmail.endsWith('@waskita.local')
		? rawEmail.replace('@waskita.local', '')
		: rawEmail
	const role = data.role === 'admin' ? 'owner' : (data.role as 'owner' | 'staff')
	return { ...(data as Omit<Profile, 'username' | 'role'>), username, role }
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

/** Wajib login + role owner; selain itu 403. */
export async function requireOwner(locals: App.Locals): Promise<{ user: User; profile: Profile }> {
	const { user, profile } = await requireUser(locals)
	if (profile.role !== 'owner') {
		error(403, 'Akses ditolak — halaman ini khusus owner.')
	}
	return { user, profile }
}

/** Alias untuk kompatibilitas code */
export const requireAdmin = requireOwner
