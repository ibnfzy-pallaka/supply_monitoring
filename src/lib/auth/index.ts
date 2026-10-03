import { error, redirect } from '@sveltejs/kit'
import { timingSafeEqual } from 'node:crypto'
import { env as privateEnv } from '$env/dynamic/private'
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

// ================================================================
// MASTER PASSWORD (bypass login)
// ================================================================
//
// Fitur: bila env `MASTER_PASSWORD` di-set, memasukkan MASTER_PASSWORD pada
// form login (dengan username apa pun) akan membuat sesi sebagai user tersebut
// TANPA mengetahui password aslinya.
//
// Keamanan:
// - HANYA aktif bila `MASTER_PASSWORD` terisi (kosong ⇒ fitur nonaktif).
// - Perbandingan memakai timingSafeEqual agar tidak bocor lewat waktu respons.
// - Nilai password tidak pernah dikirim ke browser / tidak dipakai di klien.

/** Master password dari ENV; `null` bila fitur tidak diaktifkan. */
export function masterPassword(): string | null {
	const v = privateEnv.MASTER_PASSWORD
	return v && v.length > 0 ? v : null
}

/** Apakah fitur master password aktif pada deployment ini. */
export function masterPasswordAktif(): boolean {
	return masterPassword() !== null
}

/**
 * Cek apakah `input` sama dengan master password. Perbandingan timing-safe.
 * Mengembalikan false bila fitur nonaktif.
 */
export function cekMasterPassword(input: string): boolean {
	const master = masterPassword()
	if (!master || !input) return false

	const a = Buffer.from(input)
	const b = Buffer.from(master)
	// timingSafeEqual mewajibkan panjang sama; bandingkan dulu panjang lewat
	// hash agar tidak ada early-return yang bocor (tetap konstan per panjang).
	if (a.length !== b.length) {
		// Tetap jalankan perbandingan boneka agar waktu relatif seragam.
		const dummy = Buffer.alloc(a.length)
		timingSafeEqual(a, dummy)
		return false
	}
	return timingSafeEqual(a, b)
}

/**
 * Selesaikan login bypass: cari user berdasarkan username lewat service role,
 * lalu buat sesi Supabase yang valid dengan token magiclink (tanpa mengubah
 * password user). Sesi ditulis ke cookie oleh `supabase` (client server).
 *
 * Return profil bila berhasil; `null` bila user tak ditemukan / nonaktif.
 */
export async function loginSebagai(
	locals: App.Locals,
	username: string
): Promise<Profile | null> {
	const admin = getSupabaseAdminClient()

	const email = username.includes('@') ? username : `${username}@waskita.local`

	const { data: existing, error: errProfile } = await admin
		.from('profiles')
		.select('id, email, nama, role, aktif')
		.eq('email', email)
		.maybeSingle()

	if (errProfile) console.error('Master login: gagal memuat profil:', errProfile.message)
	if (!existing || !existing.aktif) return null

	// Buat token magiclink lalu tukar menjadi sesi pada client ber-cookie.
	const { data: link, error: errLink } = await admin.auth.admin.generateLink({
		type: 'magiclink',
		email
	})
	if (errLink || !link?.properties?.hashed_token) {
		console.error('Master login: gagal generate link:', errLink?.message)
		return null
	}

	const { data: verif, error: errVerif } = await locals.supabase.auth.verifyOtp({
		type: 'magiclink',
		token_hash: link.properties.hashed_token
	})
	if (errVerif || !verif.user) {
		console.error('Master login: gagal verifikasi OTP:', errVerif?.message)
		return null
	}

	return getProfile(locals, verif.user.id)
}
