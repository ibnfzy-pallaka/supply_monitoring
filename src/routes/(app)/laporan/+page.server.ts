import { requireUser } from '$lib/auth'
import { buatLaporan, type JenisLaporan } from '$lib/laporan'
import type { PageServerLoad } from './$types'

const JENIS_VALID: JenisLaporan[] = ['masuk', 'keluar', 'persediaan']

export const load: PageServerLoad = async ({ locals, url }) => {
	await requireUser(locals)

	const paramJenis = url.searchParams.get('jenis') ?? 'masuk'
	const jenis: JenisLaporan = JENIS_VALID.includes(paramJenis as JenisLaporan)
		? (paramJenis as JenisLaporan)
		: 'masuk'

	const laporan = await buatLaporan(locals.supabase, {
		jenis,
		dari: url.searchParams.get('dari') ?? undefined,
		sampai: url.searchParams.get('sampai') ?? undefined
	})

	return { laporan }
}
