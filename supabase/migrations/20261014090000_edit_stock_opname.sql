-- ================================================================
-- Migration: Izinkan edit/koreksi stock opname (salah input)
-- Studi kasus: Kopi Waskita Makassar
-- Tanggal: 2026-10-14
--
-- Permintaan client: Admin Gudang (role 'staff') harus bisa mengedit data
-- stock opname yang sudah diinput bila terjadi salah input.
--
-- Dampak stok:
--   Trigger lama `trg_opname_sesuaikan_stok` hanya jalan AFTER INSERT,
--   sehingga mengedit baris opname TIDAK menyesuaikan stok bahan_baku.
--   Migration ini menambah trigger AFTER UPDATE supaya stok kembali sinkron
--   dengan nilai `stok_fisik` terbaru pada baris yang diedit.
--
--   apply_stock_opname men-set stok_aktual = new.stok_fisik, jadi aman untuk
--   insert maupun update (idempotent terhadap nilai fisik yang sama).
-- ================================================================

-- ---- 1. Jalankan penyesuaian stok juga saat UPDATE ----
-- Ganti trigger insert-only menjadi insert + update.
drop trigger if exists trg_opname_sesuaikan_stok on public.stock_opname;
create trigger trg_opname_sesuaikan_stok
	after insert or update on public.stock_opname
	for each row execute function public.apply_stock_opname();

-- ---- 2. Pastikan audit trail tetap mencatat UPDATE (sudah ada dari init) ----
-- (trg_audit_opname sudah mencakup insert / update / delete — tidak diubah.)
