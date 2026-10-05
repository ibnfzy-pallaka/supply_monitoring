-- ================================================================
-- Migration: Balik arah sinkronisasi harga (transaksi -> bahan baku)
-- Studi kasus: Kopi Waskita Makassar
-- Tanggal: 2026-10-13
--
-- Latar belakang / permintaan terbaru client:
--   1. Saat harga master (bahan_baku.harga_satuan) diubah, harga pada
--      riwayat transaksi_masuk TIDAK lagi ikut berubah. (Batalkan efek
--      migration 20261012090000 yang lama.)
--   2. Sebaliknya: saat mencatat transaksi_masuk dengan harga satuan,
--      harga master bahan_baku.harga_satuan untuk bahan tsb ikut
--      ter-update ke harga transaksi terbaru.
--
-- Catatan: harga pada transaksi_masuk kini bersifat snapshot historis
-- (tidak ditimpa), sedangkan bahan_baku menyimpan harga terkini.
-- ================================================================

-- ---------------- 1. Hentikan sinkron bahan -> transaksi ----------------
-- Hapus trigger lama dari migration 20261012090000.
drop trigger if exists trg_sinkron_harga_bahan on public.bahan_baku;
drop function if exists public.sinkron_harga_ke_transaksi_masuk();

-- ---------------- 2. Sinkron transaksi -> bahan ----------------
-- Saat transaksi_masuk dicatat, perbarui harga master bahan baku.
create or replace function public.sinkron_harga_dari_transaksi_masuk()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	update public.bahan_baku
	set harga_satuan = new.harga_satuan
	where id = new.bahan_baku_id
		and harga_satuan is distinct from new.harga_satuan;
	return new;
end;
$$;

-- Insert: harga master mengikuti transaksi terbaru.
drop trigger if exists trg_sinkron_harga_dari_masuk on public.transaksi_masuk;
create trigger trg_sinkron_harga_dari_masuk
	after insert on public.transaksi_masuk
	for each row execute function public.sinkron_harga_dari_transaksi_masuk();

-- Update: bila harga transaksi diubah, harga master ikut menyesuaikan.
drop trigger if exists trg_sinkron_harga_dari_masuk_upd on public.transaksi_masuk;
create trigger trg_sinkron_harga_dari_masuk_upd
	after update of harga_satuan on public.transaksi_masuk
	for each row execute function public.sinkron_harga_dari_transaksi_masuk();
