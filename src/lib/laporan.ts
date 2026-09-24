import type { SupabaseClient } from '@supabase/supabase-js'
import { embedPertama } from '$lib/format'

export type JenisLaporan = 'masuk' | 'keluar' | 'persediaan'

export type BarisMasuk = {
	tanggal: string
	kode: string
	bahan: string
	satuan: string
	supplier: string
	qty: number
	harga: number
	subtotal: number
}

export type BarisKeluar = {
	tanggal: string
	kode: string
	bahan: string
	satuan: string
	qty: number
	keterangan: string
}

export type BarisPersediaan = {
	kategori: string
	kode: string
	bahan: string
	satuan: string
	stok: number
	minimum: number
	harga: number
	nilai: number
}

export type HasilLaporan =
	| {
			jenis: 'masuk'
			dari: string
			sampai: string
			rows: BarisMasuk[]
			totalQty: number
			totalNilai: number
			jumlahTransaksi: number
	  }
	| {
			jenis: 'keluar'
			dari: string
			sampai: string
			rows: BarisKeluar[]
			totalQty: number
			jumlahTransaksi: number
	  }
	| {
			jenis: 'persediaan'
			dari: string
			sampai: string
			rows: BarisPersediaan[]
			totalNilai: number
			jumlahBahan: number
	  }

function defaultDari(): string {
	const d = new Date()
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function hariIni(): string {
	return new Date().toISOString().slice(0, 10)
}

/** Satu sumber kebenaran untuk /laporan dan /laporan/cetak. */
export async function buatLaporan(
	supabase: SupabaseClient,
	params: { jenis: JenisLaporan; dari?: string; sampai?: string }
): Promise<HasilLaporan> {
	const dari = params.dari || defaultDari()
	const sampai = params.sampai || hariIni()

	if (params.jenis === 'masuk') {
		const { data, error } = await supabase
			.from('transaksi_masuk')
			.select('tanggal, qty, harga_satuan, bahan_baku(kode, nama, satuan), supplier(nama)')
			.gte('tanggal', dari)
			.lte('tanggal', sampai)
			.order('tanggal')
			.order('created_at')
		if (error) throw error

		const rows: BarisMasuk[] = (data ?? []).map((t) => {
			const bahan = embedPertama<{ kode: string; nama: string; satuan: string }>(t.bahan_baku)
			const sup = embedPertama<{ nama: string }>(t.supplier)
			const qty = Number(t.qty)
			const harga = Number(t.harga_satuan)
			return {
				tanggal: t.tanggal as string,
				kode: bahan?.kode ?? '—',
				bahan: bahan?.nama ?? '—',
				satuan: bahan?.satuan ?? '',
				supplier: sup?.nama ?? '—',
				qty,
				harga,
				subtotal: qty * harga
			}
		})

		return {
			jenis: 'masuk',
			dari,
			sampai,
			rows,
			totalQty: rows.reduce((a, r) => a + r.qty, 0),
			totalNilai: rows.reduce((a, r) => a + r.subtotal, 0),
			jumlahTransaksi: rows.length
		}
	}

	if (params.jenis === 'keluar') {
		const { data, error } = await supabase
			.from('transaksi_keluar')
			.select('tanggal, qty, keterangan, bahan_baku(kode, nama, satuan)')
			.gte('tanggal', dari)
			.lte('tanggal', sampai)
			.order('tanggal')
			.order('created_at')
		if (error) throw error

		const rows: BarisKeluar[] = (data ?? []).map((t) => {
			const bahan = embedPertama<{ kode: string; nama: string; satuan: string }>(t.bahan_baku)
			return {
				tanggal: t.tanggal as string,
				kode: bahan?.kode ?? '—',
				bahan: bahan?.nama ?? '—',
				satuan: bahan?.satuan ?? '',
				qty: Number(t.qty),
				keterangan: (t.keterangan as string | null) ?? '—'
			}
		})

		return {
			jenis: 'keluar',
			dari,
			sampai,
			rows,
			totalQty: rows.reduce((a, r) => a + r.qty, 0),
			jumlahTransaksi: rows.length
		}
	}

	const { data, error } = await supabase
		.from('bahan_baku')
		.select('kode, nama, satuan, stok_aktual, stok_minimum, harga_satuan, kategori(nama)')
		.order('nama')
	if (error) throw error

	const rows: BarisPersediaan[] = (data ?? []).map((b) => {
		const kategori = embedPertama<{ nama: string }>(b.kategori)?.nama ?? '—'
		const stok = Number(b.stok_aktual)
		const harga = Number(b.harga_satuan)
		return {
			kategori,
			kode: b.kode as string,
			bahan: b.nama as string,
			satuan: b.satuan as string,
			stok,
			minimum: Number(b.stok_minimum),
			harga,
			nilai: stok * harga
		}
	}).sort((a, b) => a.kategori.localeCompare(b.kategori) || a.bahan.localeCompare(b.bahan))

	return {
		jenis: 'persediaan',
		dari,
		sampai,
		rows,
		totalNilai: rows.reduce((a, r) => a + r.nilai, 0),
		jumlahBahan: rows.length
	}
}

export function teksPeriode(jenis: JenisLaporan, dari: string, sampai: string): string {
	if (jenis === 'persediaan') return 'Posisi per tanggal pencetakan'
	return `${dari} — ${sampai}`
}

export function judulLaporan(jenis: JenisLaporan): string {
	if (jenis === 'masuk') return 'Laporan Barang Masuk'
	if (jenis === 'keluar') return 'Laporan Barang Keluar'
	return 'Laporan Persediaan (Sisa Stok)'
}
