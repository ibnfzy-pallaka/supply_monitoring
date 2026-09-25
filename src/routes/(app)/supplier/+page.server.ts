import { fail } from '@sveltejs/kit'
import { requireAdmin, requireUser } from '$lib/auth'
import { ambil, pesanDb } from '$lib/format'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, url }) => {
	await requireUser(locals)

	const editId = url.searchParams.get('edit') ?? ''

	const [supplierRes, bahanRes] = await Promise.all([
		locals.supabase
			.from('supplier')
			.select('id, nama, kontak, alamat, supplier_bahan_baku(count)')
			.order('nama'),
		locals.supabase.from('bahan_baku').select('id, kode, nama, satuan').order('nama')
	])

	if (supplierRes.error) console.error('Supplier: gagal memuat:', supplierRes.error.message)

	const supplier = (supplierRes.data ?? []).map((s) => ({
		id: s.id as string,
		nama: s.nama as string,
		kontak: (s.kontak as string | null) ?? '',
		alamat: (s.alamat as string | null) ?? '',
		jumlahBahan: (s.supplier_bahan_baku as { count: number }[] | null)?.[0]?.count ?? 0
	}))

	let editing: {
		id: string
		nama: string
		kontak: string
		alamat: string
		bahanTerpilih: string[]
	} | null = null

	if (editId) {
		const target = supplier.find((s) => s.id === editId)
		if (target) {
			const { data: relasi } = await locals.supabase
				.from('supplier_bahan_baku')
				.select('bahan_baku_id')
				.eq('supplier_id', editId)
			editing = {
				id: target.id,
				nama: target.nama,
				kontak: target.kontak,
				alamat: target.alamat,
				bahanTerpilih: (relasi ?? []).map((r) => r.bahan_baku_id as string)
			}
		}
	}

	return {
		supplier,
		semuaBahan: bahanRes.data ?? [],
		editing
	}
}

export const actions: Actions = {
	create: async ({ locals, request }) => {
		await requireAdmin(locals)
		const fd = await request.formData()

		const nama = ambil(fd, 'nama')
		const kontak = ambil(fd, 'kontak')
		const alamat = ambil(fd, 'alamat')
		const pilihBahan = fd.getAll('bahan').map(String)

		if (!nama) return fail(400, { message: 'Nama supplier wajib diisi.' })

		const { data: baru, error } = await locals.supabase
			.from('supplier')
			.insert({ nama, kontak: kontak || null, alamat: alamat || null })
			.select('id')
			.single()
		if (error || !baru) return fail(400, { message: error ? pesanDb(error) : 'Gagal menyimpan supplier.' })

		if (pilihBahan.length > 0) {
			const relasi = pilihBahan.map((bahan_baku_id) => ({
				supplier_id: baru.id as string,
				bahan_baku_id
			}))
			const { error: relErr } = await locals.supabase.from('supplier_bahan_baku').insert(relasi)
			if (relErr) return fail(400, { message: pesanDb(relErr) })
		}

		return { created: 'Supplier ditambahkan.' }
	},

	update: async ({ locals, request }) => {
		await requireAdmin(locals)
		const fd = await request.formData()

		const id = ambil(fd, 'id')
		const nama = ambil(fd, 'nama')
		const kontak = ambil(fd, 'kontak')
		const alamat = ambil(fd, 'alamat')
		const pilih = fd.getAll('bahan').map(String)

		if (!id || !nama) return fail(400, { message: 'Nama supplier wajib diisi.' })

		const { error: err } = await locals.supabase
			.from('supplier')
			.update({ nama, kontak: kontak || null, alamat: alamat || null })
			.eq('id', id)
		if (err) return fail(400, { message: pesanDb(err) })

		// Sinkronkan relasi: hapus yang dilepas, tambah yang baru dicentang.
		const relasiRes = await locals.supabase
			.from('supplier_bahan_baku')
			.select('bahan_baku_id')
			.eq('supplier_id', id)
		const ada = (relasiRes.data ?? []).map((r) => r.bahan_baku_id as string)

		const lepas = ada.filter((bId) => !pilih.includes(bId))
		const tambah = pilih.filter((bId) => !ada.includes(bId))

		if (lepas.length > 0) {
			const { error: delErr } = await locals.supabase
				.from('supplier_bahan_baku')
				.delete()
				.eq('supplier_id', id)
				.in('bahan_baku_id', lepas)
			if (delErr) return fail(400, { message: pesanDb(delErr) })
		}

		if (tambah.length > 0) {
			const { error: addErr } = await locals.supabase
				.from('supplier_bahan_baku')
				.insert(tambah.map((bId) => ({ supplier_id: id, bahan_baku_id: bId })))
			if (addErr) return fail(400, { message: pesanDb(addErr) })
		}

		return { updated: 'Perubahan supplier tersimpan.' }
	},

	delete: async ({ locals, request }) => {
		await requireAdmin(locals)
		const fd = await request.formData()
		const id = String(fd.get('id') ?? '')

		const { error } = await locals.supabase.from('supplier').delete().eq('id', id)
		if (error) return fail(400, { message: pesanDb(error) })

		return { deleted: true }
	}
}
