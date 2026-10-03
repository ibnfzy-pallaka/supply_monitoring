/**
 * Verifikasi konsistensi kartu stok (poin 2).
 *
 * Membandingkan saldo akhir kartu stok (dihitung dengan logika yang sama
 * seperti loader) terhadap `bahan_baku.stok_aktual` untuk SELURUH bahan,
 * mencakup transaksi masuk, keluar, DAN stock opname.
 *
 * Jalankan:
 *   node --experimental-strip-types scripts/verifikasi-kartu-stok.ts
 * atau bila didukung langsung:
 *   node scripts/verifikasi-kartu-stok.ts
 *
 * Membaca kredensial dari .env (SUPABASE_SERVICE_ROLE_KEY untuk bypass RLS).
 * TIDAK mengubah data apa pun — hanya baca.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { hitungKartuStok, type MutasiMentah } from '../src/lib/kartu-stok.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function bacaEnv(): Record<string, string> {
	const txt = readFileSync(join(root, '.env'), 'utf8')
	const env: Record<string, string> = {}
	for (const line of txt.split('\n')) {
		const t = line.trim()
		if (!t || t.startsWith('#')) continue
		const i = t.indexOf('=')
		if (i < 0) continue
		env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
	}
	return env
}

const env = bacaEnv()
const url = env.PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.PUBLIC_SUPABASE_ANON_KEY
if (!url || !key) {
	console.error('Kredensial Supabase tidak ditemukan di .env')
	process.exit(2)
}

const headers = { apikey: key, Authorization: `Bearer ${key}` }

async function q(path: string): Promise<any[]> {
	const res = await fetch(`${url}/rest/v1/${path}`, { headers })
	if (!res.ok) throw new Error(`${path} → ${res.status} ${await res.text()}`)
	return res.json()
}

type Bahan = { id: string; kode: string; nama: string; satuan: string; stok_aktual: number }

function toMutasi(
	masuk: any[],
	keluar: any[],
	opname: any[]
): MutasiMentah[] {
	return [
		...masuk.map((t) => ({
			tanggal: t.tanggal as string,
			jenis: 'masuk' as const,
			qty: Number(t.qty),
			keterangan: '',
			createdAt: (t.created_at as string) ?? ''
		})),
		...keluar.map((t) => ({
			tanggal: t.tanggal as string,
			jenis: 'keluar' as const,
			qty: Number(t.qty),
			keterangan: '',
			createdAt: (t.created_at as string) ?? ''
		})),
		...opname.map((o) => ({
			tanggal: o.tanggal as string,
			jenis: 'opname' as const,
			stokSistem: Number(o.stok_sistem),
			stokFisik: Number(o.stok_fisik),
			keterangan: '',
			createdAt: (o.created_at as string) ?? ''
		}))
	]
}

async function main() {
	const bahan = (await q('bahan_baku?select=id,kode,nama,satuan,stok_aktual&order=nama')) as Bahan[]
	const semuaMasuk = await q('transaksi_masuk?select=bahan_baku_id,tanggal,qty,created_at')
	const semuaKeluar = await q('transaksi_keluar?select=bahan_baku_id,tanggal,qty,created_at')
	const semuaOpname = await q(
		'stock_opname?select=bahan_baku_id,tanggal,stok_sistem,stok_fisik,created_at'
	)

	const kelompok = (rows: any[]) => {
		const map = new Map<string, any[]>()
		for (const r of rows) {
			const k = r.bahan_baku_id as string
			if (!map.has(k)) map.set(k, [])
			map.get(k)!.push(r)
		}
		return map
	}
	const mMasuk = kelompok(semuaMasuk)
	const mKeluar = kelompok(semuaKeluar)
	const mOpname = kelompok(semuaOpname)

	let ok = 0
	let beda = 0
	const gagal: string[] = []

	console.log('='.repeat(78))
	console.log('VERIFIKASI KONSISTENSI KARTU STOK')
	console.log('saldo akhir kartu stok  vs  bahan_baku.stok_aktual')
	console.log('='.repeat(78))
	console.log(
		'kode'.padEnd(22) +
			'kartu'.padStart(14) +
			'aktual'.padStart(14) +
			'selisih'.padStart(14) +
			'  status'
	)
	console.log('-'.repeat(78))

	for (const b of bahan) {
		const mutasi = toMutasi(
			mMasuk.get(b.id) ?? [],
			mKeluar.get(b.id) ?? [],
			mOpname.get(b.id) ?? []
		)
		const hasil = hitungKartuStok(mutasi, Number(b.stok_aktual))
		const selisih = hasil.stokAkhir - Number(b.stok_aktual)
		const konsisten = Math.abs(selisih) < 1e-9

		if (konsisten) ok++
		else {
			beda++
			gagal.push(b.kode)
		}

		console.log(
			b.kode.padEnd(22) +
				String(Number(hasil.stokAkhir)).padStart(14) +
				String(Number(b.stok_aktual)).padStart(14) +
				String(selisih).padStart(14) +
				'  ' +
				(konsisten ? 'OK' : 'BEDA')
		)
	}

	console.log('-'.repeat(78))
	console.log(`Total bahan: ${bahan.length} · konsisten: ${ok} · beda: ${beda}`)
	if (beda > 0) {
		console.log(`\nBahan dengan selisih: ${gagal.join(', ')}`)
		console.log(
			'Catatan: selisih wajar terjadi bila stok diubah langsung (bukan lewat\n' +
				'transaksi/opname), mis. edit manual kolom stok_aktual di database.'
		)
		process.exit(1)
	}
	console.log('\nSemua bahan konsisten — kartu stok cocok dengan stok aktual.')
}

main().catch((e) => {
	console.error('Gagal verifikasi:', e.message)
	process.exit(2)
})
