-- ================================================================
-- Migration: Fitur Lupa Password — Pengajuan Reset oleh Admin Gudang
-- Studi kasus: Kopi Waskita Makassar
-- Tanggal: 2026-10-02
--
-- Alur:
--   - Admin Gudang (staff) lupa password → ajukan reset dari halaman
--     publik /lupa-password (cukup masukkan username).
--   - Pengajuan tersimpan berstatus 'menunggu' dan muncul sebagai
--     notifikasi di akun Owner.
--   - Owner menyetujui → password direset ke '12345678' (via service role).
--   - Owner yang lupa → diarahkan menghubungi developer (tidak ada pengajuan).
--
-- Cara pakai:
--   Dashboard > SQL Editor: paste seluruh isi file ini, Run.
--   Atau: npx supabase db push
-- ================================================================

-- ---------------- Enum status pengajuan ----------------
do $$ begin
	create type public.status_pengajuan as enum ('menunggu', 'disetujui', 'ditolak');
exception
	when duplicate_object then null;
end $$;

-- ---------------- Tabel pengajuan reset password ----------------
create table if not exists public.pengajuan_reset_password (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles(id) on delete cascade,
	username text not null,
	nama text not null,
	status public.status_pengajuan not null default 'menunggu',
	catatan text, -- alasan/catatan opsional dari pengaju atau owner
	dibaca_owner boolean not null default false,
	diproses_oleh uuid references public.profiles(id) on delete set null,
	diproses_at timestamptz,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index if not exists idx_pengajuan_status on public.pengajuan_reset_password(status, created_at desc);
create index if not exists idx_pengajuan_user on public.pengajuan_reset_password(user_id);

-- Auto-update updated_at
drop trigger if exists trg_pengajuan_updated on public.pengajuan_reset_password;
create trigger trg_pengajuan_updated
	before update on public.pengajuan_reset_password
	for each row execute function public.set_updated_at();

-- ---------------- RLS ----------------
alter table public.pengajuan_reset_password enable row level security;

-- Owner (admin) dapat melihat & memproses semua pengajuan
drop policy if exists "Owner kelola pengajuan reset" on public.pengajuan_reset_password;
create policy "Owner kelola pengajuan reset"
	on public.pengajuan_reset_password for all
	using (public.current_role() = 'admin')
	with check (public.current_role() = 'admin');

-- Pengaju (belum login) mengirim lewat server (service role) — tidak perlu policy
-- untuk anon/insert dari klien. Server memakai service role yang melewati RLS.

-- Cegah pengajuan ganda 'menunggu' untuk user yang sama (satu pengajuan aktif).
create unique index if not exists uniq_pengajuan_menunggu
	on public.pengajuan_reset_password(user_id)
	where status = 'menunggu';
