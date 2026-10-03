-- ================================================================
-- Migration: Stock opname hanya boleh diisi Admin Gudang (role 'staff')
-- Tanggal: 2026-10-13
--
-- Permintaan client: Admin Gudang yang mengisi form stock opname;
-- Owner TIDAK boleh mengisi (hanya melihat riwayat).
--
-- Pemetaan role di sistem:
--   DB 'admin'  -> UI 'Owner'
--   DB 'staff'  -> UI 'Admin Gudang'
--
-- Sebelumnya policy tulis memakai current_role() = 'admin' (khusus owner).
-- Sekarang: tulis hanya untuk 'staff'; owner TIDAK lagi punya akses tulis.
-- Baca tetap untuk semua user login.
-- ================================================================

-- Pastikan RLS aktif.
alter table public.stock_opname enable row level security;

-- ---- Baca: semua user login (tidak berubah) ----
drop policy if exists "User login baca stock opname" on public.stock_opname;
create policy "User login baca stock opname"
	on public.stock_opname for select
	using (auth.role() = 'authenticated');

-- ---- Tulis: HANYA admin gudang (role 'staff') ----
-- Hapus policy lama yang memberi owner akses tulis.
drop policy if exists "Admin tulis stock opname" on public.stock_opname;

drop policy if exists "Admin gudang tulis stock opname" on public.stock_opname;
create policy "Admin gudang tulis stock opname"
	on public.stock_opname for all
	using (public.current_role() = 'staff')
	with check (public.current_role() = 'staff');
