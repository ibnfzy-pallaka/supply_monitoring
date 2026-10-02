-- ================================================================
-- Migration: Sumber Pembayaran pada Barang Masuk
-- Studi kasus: Kopi Waskita Makassar
-- Tanggal: 2026-10-10
--
-- Menambahkan pilihan sumber pembayaran (tunai/transfer) pada tiap
-- catatan barang masuk (transaksi_masuk). Data lama otomatis diisi
-- 'tunai' sebagai default.
--
-- Cara pakai:
--   Dashboard > SQL Editor: paste seluruh isi file ini, Run.
--   Atau: npx supabase db push
-- ================================================================

-- ---------------- Enum sumber pembayaran ----------------
do $$ begin
	create type public.sumber_pembayaran as enum ('tunai', 'transfer');
exception
	when duplicate_object then null;
end $$;

-- ---------------- Kolom di transaksi_masuk ----------------
alter table public.transaksi_masuk
	add column if not exists sumber_pembayaran public.sumber_pembayaran
	not null default 'tunai';

-- Index ringan untuk rekap per sumber pembayaran (opsional).
create index if not exists idx_masuk_pembayaran
	on public.transaksi_masuk(sumber_pembayaran);
