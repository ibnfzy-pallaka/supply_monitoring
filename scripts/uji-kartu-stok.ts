/**
 * Uji cepat logika kartu stok (murni, tanpa DB).
 * Jalankan: node --experimental-strip-types scripts/uji-kartu-stok.ts
 */
import { hitungKartuStok, deltaMutasi, type MutasiMentah } from '../src/lib/kartu-stok.ts'

let lulus = 0
let gagal = 0

function eq(nama: string, dapat: number, harus: number) {
	if (Math.abs(dapat - harus) < 1e-9) {
		lulus++
		console.log(`  OK   ${nama}: ${dapat}`)
	} else {
		gagal++
		console.log(`  GAGAL ${nama}: dapat ${dapat}, harus ${harus}`)
	}
}

console.log('1) Hanya masuk/keluar')
{
	const m: MutasiMentah[] = [
		{ tanggal: '2026-01-01', jenis: 'masuk', qty: 10, keterangan: '', createdAt: 'a' },
		{ tanggal: '2026-01-02', jenis: 'keluar', qty: 4, keterangan: '', createdAt: 'b' },
		{ tanggal: '2026-01-03', jenis: 'masuk', qty: 20, keterangan: '', createdAt: 'c' }
	]
	const h = hitungKartuStok(m, 26)
	eq('stokAwal', h.stokAwal, 0)
	eq('stokAkhir', h.stokAkhir, 26)
	eq('selisih', h.selisih, 0)
	eq('sisa baris-3', h.kartu[2].sisa, 26)
}

console.log('2) Dengan opname (set absolut)')
{
	const m: MutasiMentah[] = [
		{ tanggal: '2026-01-01', jenis: 'masuk', qty: 100, keterangan: '', createdAt: 'a' },
		{
			tanggal: '2026-01-02',
			jenis: 'opname',
			stokSistem: 100,
			stokFisik: 90,
			keterangan: 'susut',
			createdAt: 'b'
		},
		{ tanggal: '2026-01-03', jenis: 'keluar', qty: 10, keterangan: '', createdAt: 'c' }
	]
	const h = hitungKartuStok(m, 80)
	eq('stokAwal', h.stokAwal, 0)
	eq('opname delta', deltaMutasi(m[1]), -10)
	eq('stokAkhir', h.stokAkhir, 80)
	eq('konsisten', h.konsisten ? 1 : 0, 1)
}

console.log('3) Kasus nyata BJ-ARABIKA')
{
	const m: MutasiMentah[] = [
		{ tanggal: '2026-09-26', jenis: 'masuk', qty: 100, keterangan: '', createdAt: '1' },
		{ tanggal: '2026-09-26', jenis: 'keluar', qty: 10, keterangan: '', createdAt: '2' },
		{
			tanggal: '2026-09-26',
			jenis: 'opname',
			stokSistem: 90,
			stokFisik: 90,
			keterangan: '',
			createdAt: '3'
		},
		{ tanggal: '2026-10-02', jenis: 'keluar', qty: 89, keterangan: '', createdAt: '4' },
		{ tanggal: '2026-10-03', jenis: 'masuk', qty: 1000, keterangan: '', createdAt: '5' },
		{
			tanggal: '2026-10-03',
			jenis: 'opname',
			stokSistem: 1001,
			stokFisik: 100,
			keterangan: '',
			createdAt: '6'
		}
	]
	const h = hitungKartuStok(m, 100)
	eq('stokAkhir = aktual', h.stokAkhir, 100)
	eq('stokAwal', h.stokAwal, 0)
	eq('konsisten', h.konsisten ? 1 : 0, 1)
}

console.log('4a) Tanggal sama, createdAt sama → masuk sebelum keluar (tie-break)')
{
	const m: MutasiMentah[] = [
		{ tanggal: '2026-01-01', jenis: 'keluar', qty: 5, keterangan: '', createdAt: 'sama' },
		{ tanggal: '2026-01-01', jenis: 'masuk', qty: 10, keterangan: '', createdAt: 'sama' }
	]
	const h = hitungKartuStok(m, 5)
	eq('baris-1 jenis masuk', h.kartu[0].jenis === 'masuk' ? 1 : 0, 1)
}

console.log('4b) Tanggal sama, createdAt beda → ikut waktu pembuatan')
{
	const m: MutasiMentah[] = [
		{ tanggal: '2026-01-01', jenis: 'masuk', qty: 10, keterangan: '', createdAt: '2026-01-01T10:00' },
		{ tanggal: '2026-01-01', jenis: 'keluar', qty: 5, keterangan: '', createdAt: '2026-01-01T09:00' }
	]
	const h = hitungKartuStok(m, 5)
	eq('baris-1 keluar (lebih awal)', h.kartu[0].jenis === 'keluar' ? 1 : 0, 1)
}

console.log(`\nHasil: ${lulus} lulus, ${gagal} gagal`)
process.exit(gagal > 0 ? 1 : 0)
