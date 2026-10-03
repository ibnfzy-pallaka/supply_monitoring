-- ================================================================
-- Migration: Sinkronisasi Harga Master ke Riwayat Transaksi Masuk
-- Studi kasus: Kopi Waskita Makassar
-- Tanggal: 2026-10-12
--
-- Latar belakang:
--   Kolom transaksi_masuk.harga_satuan menyimpan harga saat transaksi
--   dicatat (snapshot). Client meminta agar saat harga master
--   (bahan_baku.harga_satuan) diubah, harga pada seluruh riwayat
--   transaksi_masuk UNTUK BAHAN TERSEBUT ikut ter-update otomatis.
--
--   Catatan: ini menyimpang dari prinsip akuntansi historis (harga lama
--   seharusnya tetap). Dilakukan atas permintaan eksplisit client.
--
-- Ruang lingkup:
--   HANYA transaksi_masuk milik bahan yang diubah. Bahan lain TIDAK
--   tersentuh. transaksi_keluar / stock_opname tidak punya harga,
--   jadi tidak terpengaruh.
--
-- Cara pakai:
--   Dashboard > SQL Editor: paste seluruh isi file ini, Run.
--   Atau: npx supabase db push
-- ================================================================

-- Fungsi: saat harga_satuan bahan_baku berubah, samakan harga pada
-- semua transaksi_masuk milik bahan tersebut.
create or replace function public.sinkron_harga_ke_transaksi_masuk()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	-- Hanya bertindak bila harga benar-benar berubah.
	if new.harga_satuan is distinct from old.harga_satuan then
		update public.transaksi_masuk
		set harga_satuan = new.harga_satuan
		where bahan_baku_id = new.id;
	end if;
	return new;
end;
$$;

-- Trigger dijalankan setelah update pada bahan_baku.
drop trigger if exists trg_sinkron_harga_bahan on public.bahan_baku;
create trigger trg_sinkron_harga_bahan
	after update of harga_satuan on public.bahan_baku
	for each row execute function public.sinkron_harga_ke_transaksi_masuk();

-- ----------------------------------------------------------------
-- Opsional: samakan data lama dengan harga master terkini sekali.
-- Jalankan HANYA jika ingin langsung menyelaraskan riwayat yang ada.
-- Baris di bawah sengaja dikomentari agar tidak menimpa data historis
-- tanpa persetujuan. Buka komentar bila memang diinginkan.
-- ----------------------------------------------------------------
-- update public.transaksi_masuk tm
-- set harga_satuan = bb.harga_satuan
-- from public.bahan_baku bb
-- where tm.bahan_baku_id = bb.id;
