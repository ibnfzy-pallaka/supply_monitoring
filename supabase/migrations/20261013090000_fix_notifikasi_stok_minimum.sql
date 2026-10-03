-- ================================================================
-- Migration: Perbaikan notifikasi stok minimum
-- Tanggal: 2026-10-13
--
-- Masalah yang diperbaiki:
--   1. Trigger lama hanya menyala pada UPDATE dan hanya saat stok BARU
--      MELEWATI batas minimum (transisi old > min -> new <= min).
--      Akibatnya bahan baru yang sudah <= minimum (mis. dibuat dengan
--      stok 0) tidak pernah memicu notifikasi.
--   2. Tidak ada notifikasi saat INSERT bahan_baku.
--   3. Berpotensi duplikat: satu kondisi bisa menghasilkan banyak notifikasi.
--
-- Solusi:
--   - Fungsi tunggal `catat_notifikasi_stok()` yang membuat SATU notifikasi
--     belum-dibaca per bahan (idempoten / anti-duplikat).
--   - Dipicu pada INSERT dan UPDATE stok_aktual/stok_minimum bahan_baku.
--   - Backfill: buat notifikasi untuk semua bahan yang SAAT INI
--     stok_aktual <= stok_minimum dan belum punya notifikasi belum-dibaca.
-- ================================================================

-- ---------------- Bersihkan duplikat lama ----------------
-- Sisakan HANYA notifikasi belum-dibaca TERBARU per bahan; sisanya dihapus.
-- Wajib dilakukan sebelum membuat unique index di bawah.
delete from public.notifikasi n
using public.notifikasi n2
where n.bahan_baku_id = n2.bahan_baku_id
	and n.dibaca = false
	and n2.dibaca = false
	and n.bahan_baku_id is not null
	and (n.created_at < n2.created_at
		or (n.created_at = n2.created_at and n.id < n2.id));

-- ---------------- Index bantu anti-duplikat ----------------
-- Satu bahan hanya boleh punya satu notifikasi belum dibaca.
-- (NULL tidak dianggap sama oleh unique index, jadi bahan_baku_id NULL aman.)
create unique index if not exists uq_notifikasi_belum_dibaca_per_bahan
	on public.notifikasi (bahan_baku_id)
	where dibaca = false;

-- ---------------- Fungsi notifikasi (idempoten) ----------------
create or replace function public.catat_notifikasi_stok()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	v_ada boolean;
begin
	-- Hanya berlaku bila stok menyentuh/melewati batas minimum.
	if new.stok_aktual > new.stok_minimum then
		return new;
	end if;

	-- Cegah duplikat: lewati bila sudah ada notifikasi belum dibaca.
	select exists (
		select 1 from public.notifikasi
		where bahan_baku_id = new.id and dibaca = false
	) into v_ada;

	if v_ada then
		return new;
	end if;

	insert into public.notifikasi (bahan_baku_id, pesan)
	values (
		new.id,
		format(
			'Stok %s (%s) mencapai batas minimum: sisa %s %s',
			new.nama, new.kode, new.stok_aktual, new.satuan
		)
	)
	on conflict (bahan_baku_id) where dibaca = false do nothing;

	return new;
end;
$$;

-- Ganti trigger lama: dulu hanya "after update of stok_aktual, stok_minimum".
drop trigger if exists trg_notif_stok_minimum on public.bahan_baku;

drop trigger if exists trg_notif_stok_insert on public.bahan_baku;
create trigger trg_notif_stok_insert
	after insert on public.bahan_baku
	for each row execute function public.catat_notifikasi_stok();

drop trigger if exists trg_notif_stok_update on public.bahan_baku;
create trigger trg_notif_stok_update
	after update of stok_aktual, stok_minimum on public.bahan_baku
	for each row execute function public.catat_notifikasi_stok();

-- ---------------- Backfill notifikasi yang terlewat ----------------
-- Buat notifikasi untuk bahan yang saat ini <= minimum dan belum punya
-- notifikasi belum-dibaca. Idempoten: aman dijalankan berulang.
insert into public.notifikasi (bahan_baku_id, pesan)
select
	b.id,
	format(
		'Stok %s (%s) mencapai batas minimum: sisa %s %s',
		b.nama, b.kode, b.stok_aktual, b.satuan
	)
from public.bahan_baku b
where b.stok_aktual <= b.stok_minimum
	and not exists (
		select 1 from public.notifikasi n
		where n.bahan_baku_id = b.id and n.dibaca = false
	)
on conflict (bahan_baku_id) where dibaca = false do nothing;
