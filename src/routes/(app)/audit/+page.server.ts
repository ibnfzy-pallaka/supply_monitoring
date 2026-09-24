import { requireAdmin } from '$lib/auth'
import { embedPertama } from '$lib/format'
import type { PageServerLoad } from './$types'

const TABEL_DIKETAHUI = [
	'profiles',
	'kategori',
	'supplier',
	'bahan_baku',
	'transaksi_masuk',
	'transaksi_keluar',
	'stock_opname'
]

export const load: PageServerLoad = async ({ locals, url }) => {
	await requireAdmin(locals)

	const filterTabel = url.searchParams.get('tabel') ?? ''

	let query = locals.supabase
		.from('audit_log')
		.select('id, aktor, aksi, tabel, record_id, data_lama, data_baru, created_at, profiles(nama)')
		.order('created_at', { ascending: false })
		.limit(200)
	if (filterTabel && TABEL_DIKETAHUI.includes(filterTabel)) query = query.eq('tabel', filterTabel)

	const { data, error } = await query
	if (error) console.error('Audit: gagal memuat:', error.message)

	return {
		filterTabel,
		tabelOpsi: TABEL_DIKETAHUI,
		log: (data ?? []).map((l) => ({
			id: l.id as number,
			waktu: l.created_at as string,
			aksi: l.aksi as string,
			tabel: l.tabel as string,
			aktor: embedPertama<{ nama: string }>(l.profiles)?.nama ?? 'sistem',
			ringkas: (() => {
				const isi = (l.aksi === 'DELETE' ? l.data_lama : l.data_baru) as Record<string, unknown> | null
				if (!isi) return '—'
				const teks = JSON.stringify(isi)
				return teks.length > 120 ? teks.slice(0, 117) + '…' : teks
			})()
		}))
	}
}
