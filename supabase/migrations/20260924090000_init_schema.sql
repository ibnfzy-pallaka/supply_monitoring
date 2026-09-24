-- ================================================================
-- Migration: Schema awal Sistem Persediaan Bahan Baku
-- Studi kasus: Kopi Waskita Makassar
-- Tanggal: 2026-09-24
--
-- Cara pakai:
--   1. Via Supabase Dashboard > SQL Editor: paste seluruh isi file ini, Run.
--   2. Via Supabase CLI (project sudah di-link):
--        npx supabase db push
--
-- Setelah migration:
--   1. Buat user admin pertama via Dashboard > Authentication > Add user,
--      lalu jalankan:
--        update public.profiles set role = 'admin' where email = 'email-admin@contoh.com';
--   2. User baru yang mendaftar otomatis ber-role 'staff' (lihat trigger
--      on_auth_user_created), admin tinggal mengubah role bila perlu.
-- ================================================================

-- ---------------- Extension ----------------
create extension if not exists "pgcrypto";

-- ---------------- 1. Enum role ----------------
do $$ begin
	create type public.user_role as enum ('admin', 'staff');
exception
	when duplicate_object then null;
end $$;

-- ---------------- 2. Profil user (extends auth.users) ----------------
create table if not exists public.profiles (
	id uuid primary key references auth.users(id) on delete cascade,
	email text not null,
	nama text not null,
	role public.user_role not null default 'staff',
	aktif boolean not null default true,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

-- ---------------- 3. Kategori bahan baku ----------------
create table if not exists public.kategori (
	id uuid primary key default gen_random_uuid(),
	nama text not null unique,
	deskripsi text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

-- ---------------- 4. Supplier ----------------
create table if not exists public.supplier (
	id uuid primary key default gen_random_uuid(),
	nama text not null,
	kontak text,
	alamat text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

-- ---------------- 5. Bahan baku ----------------
create table if not exists public.bahan_baku (
	id uuid primary key default gen_random_uuid(),
	kode text not null unique,
	nama text not null,
	kategori_id uuid references public.kategori(id) on delete restrict,
	satuan text not null, -- contoh: kg, gram, liter, ml, pcs, pack
	stok_minimum numeric not null default 0 check (stok_minimum >= 0),
	stok_aktual numeric not null default 0 check (stok_aktual >= 0),
	harga_satuan numeric not null default 0 check (harga_satuan >= 0),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

-- Relasi supplier <-> bahan yang disuplai (lihat dokumen: "daftar bahan yang disuplai")
create table if not exists public.supplier_bahan_baku (
	supplier_id uuid not null references public.supplier(id) on delete cascade,
	bahan_baku_id uuid not null references public.bahan_baku(id) on delete cascade,
	primary key (supplier_id, bahan_baku_id)
);

-- ---------------- 6. Transaksi barang masuk (pembelian/penerimaan) ----------------
create table if not exists public.transaksi_masuk (
	id uuid primary key default gen_random_uuid(),
	tanggal date not null default current_date,
	supplier_id uuid references public.supplier(id) on delete restrict,
	bahan_baku_id uuid not null references public.bahan_baku(id) on delete restrict,
	qty numeric not null check (qty > 0),
	harga_satuan numeric not null default 0 check (harga_satuan >= 0),
	keterangan text,
	dibuat_oleh uuid references public.profiles(id) on delete set null,
	created_at timestamptz not null default now()
);

-- ---------------- 7. Transaksi barang keluar (pemakaian operasional) ----------------
create table if not exists public.transaksi_keluar (
	id uuid primary key default gen_random_uuid(),
	tanggal date not null default current_date,
	bahan_baku_id uuid not null references public.bahan_baku(id) on delete restrict,
	qty numeric not null check (qty > 0),
	keterangan text,
	dibuat_oleh uuid references public.profiles(id) on delete set null,
	created_at timestamptz not null default now()
);

-- ---------------- 8. Stock opname (penyesuaian stok fisik) ----------------
create table if not exists public.stock_opname (
	id uuid primary key default gen_random_uuid(),
	tanggal date not null default current_date,
	bahan_baku_id uuid not null references public.bahan_baku(id) on delete restrict,
	stok_sistem numeric not null,
	stok_fisik numeric not null check (stok_fisik >= 0),
	selisih numeric generated always as (stok_fisik - stok_sistem) stored,
	alasan text not null,
	dibuat_oleh uuid references public.profiles(id) on delete set null,
	created_at timestamptz not null default now()
);

-- ---------------- 9. Notifikasi stok minimum ----------------
create table if not exists public.notifikasi (
	id uuid primary key default gen_random_uuid(),
	bahan_baku_id uuid references public.bahan_baku(id) on delete cascade,
	pesan text not null,
	dibaca boolean not null default false,
	created_at timestamptz not null default now()
);

-- ---------------- 10. Audit trail ----------------
create table if not exists public.audit_log (
	id bigint generated always as identity primary key,
	aktor uuid references public.profiles(id) on delete set null,
	aksi text not null, -- INSERT | UPDATE | DELETE
	tabel text not null,
	record_id text,
	data_lama jsonb,
	data_baru jsonb,
	created_at timestamptz not null default now()
);

-- ---------------- Index ----------------
create index if not exists idx_bahan_kategori on public.bahan_baku(kategori_id);
create index if not exists idx_bahan_kode on public.bahan_baku(kode);
create index if not exists idx_masuk_bahan_tanggal on public.transaksi_masuk(bahan_baku_id, tanggal);
create index if not exists idx_keluar_bahan_tanggal on public.transaksi_keluar(bahan_baku_id, tanggal);
create index if not exists idx_opname_bahan on public.stock_opname(bahan_baku_id);
create index if not exists idx_notifikasi_dibaca on public.notifikasi(dibaca, created_at desc);
create index if not exists idx_audit_tabel_record on public.audit_log(tabel, record_id);

-- ================================================================
-- FUNGSI & TRIGGER
-- ================================================================

-- Auto-update kolom updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
	new.updated_at = now();
	return new;
end;
$$;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated
	before update on public.profiles
	for each row execute function public.set_updated_at();

drop trigger if exists trg_kategori_updated on public.kategori;
create trigger trg_kategori_updated
	before update on public.kategori
	for each row execute function public.set_updated_at();

drop trigger if exists trg_supplier_updated on public.supplier;
create trigger trg_supplier_updated
	before update on public.supplier
	for each row execute function public.set_updated_at();

drop trigger if exists trg_bahan_updated on public.bahan_baku;
create trigger trg_bahan_updated
	before update on public.bahan_baku
	for each row execute function public.set_updated_at();

-- Barang masuk: otomatis menambah stok
create or replace function public.apply_transaksi_masuk()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	update public.bahan_baku
	set stok_aktual = stok_aktual + new.qty
	where id = new.bahan_baku_id;
	return new;
end;
$$;

drop trigger if exists trg_masuk_tambah_stok on public.transaksi_masuk;
create trigger trg_masuk_tambah_stok
	after insert on public.transaksi_masuk
	for each row execute function public.apply_transaksi_masuk();

-- Barang keluar: validasi stok cukup, lalu otomatis mengurangi stok
create or replace function public.apply_transaksi_keluar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	v_stok numeric;
begin
	select stok_aktual into v_stok
	from public.bahan_baku
	where id = new.bahan_baku_id
	for update;

	if v_stok is null then
		raise exception 'Bahan baku tidak ditemukan';
	end if;

	if v_stok < new.qty then
		raise exception 'Stok tidak mencukupi (tersedia %, diminta %)', v_stok, new.qty;
	end if;

	update public.bahan_baku
	set stok_aktual = stok_aktual - new.qty
	where id = new.bahan_baku_id;

	return new;
end;
$$;

drop trigger if exists trg_keluar_kurangi_stok on public.transaksi_keluar;
create trigger trg_keluar_kurangi_stok
	after insert on public.transaksi_keluar
	for each row execute function public.apply_transaksi_keluar();

-- Stock opname: samakan stok sistem dengan hasil fisik
create or replace function public.apply_stock_opname()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	update public.bahan_baku
	set stok_aktual = new.stok_fisik
	where id = new.bahan_baku_id;
	return new;
end;
$$;

drop trigger if exists trg_opname_sesuaikan_stok on public.stock_opname;
create trigger trg_opname_sesuaikan_stok
	after insert on public.stock_opname
	for each row execute function public.apply_stock_opname();

-- Notifikasi otomatis saat stok turun menyentuh/melewati batas minimum
create or replace function public.check_stok_minimum()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	if new.stok_aktual <= new.stok_minimum
		and old.stok_aktual > old.stok_minimum then
		insert into public.notifikasi (bahan_baku_id, pesan)
		values (
			new.id,
			format(
				'Stok %s (%s) mencapai batas minimum: sisa %s %s',
				new.nama, new.kode, new.stok_aktual, new.satuan
			)
		);
	end if;
	return new;
end;
$$;

drop trigger if exists trg_notif_stok_minimum on public.bahan_baku;
create trigger trg_notif_stok_minimum
	after update of stok_aktual, stok_minimum on public.bahan_baku
	for each row execute function public.check_stok_minimum();

-- Audit trail generik (catat siapa mengubah apa)
create or replace function public.log_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	insert into public.audit_log (aktor, aksi, tabel, record_id, data_lama, data_baru)
	values (
		auth.uid(),
		tg_op,
		tg_table_name,
		coalesce(new.id::text, old.id::text),
		case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
		case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
	);
	return coalesce(new, old);
end;
$$;

drop trigger if exists trg_audit_profiles on public.profiles;
create trigger trg_audit_profiles
	after insert or update or delete on public.profiles
	for each row execute function public.log_audit();

drop trigger if exists trg_audit_kategori on public.kategori;
create trigger trg_audit_kategori
	after insert or update or delete on public.kategori
	for each row execute function public.log_audit();

drop trigger if exists trg_audit_supplier on public.supplier;
create trigger trg_audit_supplier
	after insert or update or delete on public.supplier
	for each row execute function public.log_audit();

drop trigger if exists trg_audit_bahan on public.bahan_baku;
create trigger trg_audit_bahan
	after insert or update or delete on public.bahan_baku
	for each row execute function public.log_audit();

drop trigger if exists trg_audit_masuk on public.transaksi_masuk;
create trigger trg_audit_masuk
	after insert or update or delete on public.transaksi_masuk
	for each row execute function public.log_audit();

drop trigger if exists trg_audit_keluar on public.transaksi_keluar;
create trigger trg_audit_keluar
	after insert or update or delete on public.transaksi_keluar
	for each row execute function public.log_audit();

drop trigger if exists trg_audit_opname on public.stock_opname;
create trigger trg_audit_opname
	after insert or update or delete on public.stock_opname
	for each row execute function public.log_audit();

-- Profil otomatis untuk user auth baru (default role: staff)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	insert into public.profiles (id, email, nama, role)
	values (
		new.id,
		new.email,
		coalesce(new.raw_user_meta_data ->> 'nama', split_part(new.email, '@', 1)),
		'staff'
	);
	return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
	after insert on auth.users
	for each row execute function public.handle_new_user();

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================

-- Helper: role user yang sedang login
create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
	select role from public.profiles where id = auth.uid();
$$;

alter table public.profiles enable row level security;
alter table public.kategori enable row level security;
alter table public.supplier enable row level security;
alter table public.bahan_baku enable row level security;
alter table public.supplier_bahan_baku enable row level security;
alter table public.transaksi_masuk enable row level security;
alter table public.transaksi_keluar enable row level security;
alter table public.stock_opname enable row level security;
alter table public.notifikasi enable row level security;
alter table public.audit_log enable row level security;

-- ---- profiles ----
drop policy if exists "Admin kelola semua profil" on public.profiles;
create policy "Admin kelola semua profil"
	on public.profiles for all
	using (public.current_role() = 'admin')
	with check (public.current_role() = 'admin');

drop policy if exists "User baca profil sendiri" on public.profiles;
create policy "User baca profil sendiri"
	on public.profiles for select
	using (auth.uid() = id);

-- ---- master data: baca semua user login, tulis hanya admin ----
drop policy if exists "User login baca kategori" on public.kategori;
create policy "User login baca kategori"
	on public.kategori for select
	using (auth.role() = 'authenticated');

drop policy if exists "Admin tulis kategori" on public.kategori;
create policy "Admin tulis kategori"
	on public.kategori for all
	using (public.current_role() = 'admin')
	with check (public.current_role() = 'admin');

drop policy if exists "User login baca supplier" on public.supplier;
create policy "User login baca supplier"
	on public.supplier for select
	using (auth.role() = 'authenticated');

drop policy if exists "Admin tulis supplier" on public.supplier;
create policy "Admin tulis supplier"
	on public.supplier for all
	using (public.current_role() = 'admin')
	with check (public.current_role() = 'admin');

drop policy if exists "User login baca bahan baku" on public.bahan_baku;
create policy "User login baca bahan baku"
	on public.bahan_baku for select
	using (auth.role() = 'authenticated');

drop policy if exists "Admin tulis bahan baku" on public.bahan_baku;
create policy "Admin tulis bahan baku"
	on public.bahan_baku for all
	using (public.current_role() = 'admin')
	with check (public.current_role() = 'admin');

drop policy if exists "User login baca relasi supplier-bahan" on public.supplier_bahan_baku;
create policy "User login baca relasi supplier-bahan"
	on public.supplier_bahan_baku for select
	using (auth.role() = 'authenticated');

drop policy if exists "Admin tulis relasi supplier-bahan" on public.supplier_bahan_baku;
create policy "Admin tulis relasi supplier-bahan"
	on public.supplier_bahan_baku for all
	using (public.current_role() = 'admin')
	with check (public.current_role() = 'admin');

-- ---- transaksi: baca semua user login, input oleh staff/admin, hapus-ubah admin ----
drop policy if exists "User login baca transaksi masuk" on public.transaksi_masuk;
create policy "User login baca transaksi masuk"
	on public.transaksi_masuk for select
	using (auth.role() = 'authenticated');

drop policy if exists "Staff input transaksi masuk" on public.transaksi_masuk;
create policy "Staff input transaksi masuk"
	on public.transaksi_masuk for insert
	with check (auth.role() = 'authenticated');

drop policy if exists "Admin ubah-hapus transaksi masuk" on public.transaksi_masuk;
create policy "Admin ubah-hapus transaksi masuk"
	on public.transaksi_masuk for update using (public.current_role() = 'admin')
	with check (public.current_role() = 'admin');

drop policy if exists "Admin hapus transaksi masuk" on public.transaksi_masuk;
create policy "Admin hapus transaksi masuk"
	on public.transaksi_masuk for delete
	using (public.current_role() = 'admin');

drop policy if exists "User login baca transaksi keluar" on public.transaksi_keluar;
create policy "User login baca transaksi keluar"
	on public.transaksi_keluar for select
	using (auth.role() = 'authenticated');

drop policy if exists "Staff input transaksi keluar" on public.transaksi_keluar;
create policy "Staff input transaksi keluar"
	on public.transaksi_keluar for insert
	with check (auth.role() = 'authenticated');

drop policy if exists "Admin ubah-hapus transaksi keluar" on public.transaksi_keluar;
create policy "Admin ubah-hapus transaksi keluar"
	on public.transaksi_keluar for update using (public.current_role() = 'admin')
	with check (public.current_role() = 'admin');

drop policy if exists "Admin hapus transaksi keluar" on public.transaksi_keluar;
create policy "Admin hapus transaksi keluar"
	on public.transaksi_keluar for delete
	using (public.current_role() = 'admin');

-- ---- stock opname: baca semua user login, tulis hanya admin ----
drop policy if exists "User login baca stock opname" on public.stock_opname;
create policy "User login baca stock opname"
	on public.stock_opname for select
	using (auth.role() = 'authenticated');

drop policy if exists "Admin tulis stock opname" on public.stock_opname;
create policy "Admin tulis stock opname"
	on public.stock_opname for all
	using (public.current_role() = 'admin')
	with check (public.current_role() = 'admin');

-- ---- notifikasi: baca & tandai dibaca oleh semua user login ----
drop policy if exists "User login baca notifikasi" on public.notifikasi;
create policy "User login baca notifikasi"
	on public.notifikasi for select
	using (auth.role() = 'authenticated');

drop policy if exists "User login tandai notifikasi dibaca" on public.notifikasi;
create policy "User login tandai notifikasi dibaca"
	on public.notifikasi for update
	using (auth.role() = 'authenticated')
	with check (auth.role() = 'authenticated');

-- ---- audit log: hanya admin yang bisa baca ----
drop policy if exists "Admin baca audit log" on public.audit_log;
create policy "Admin baca audit log"
	on public.audit_log for select
	using (public.current_role() = 'admin');

-- ================================================================
-- SEED: kategori awal sesuai studi kasus kedai kopi
-- ================================================================
insert into public.kategori (nama, deskripsi) values
	('Kopi', 'Biji kopi, bubuk kopi, dan turunannya'),
	('Susu & Dairy', 'Susu segar, UHT, krimer, dan produk dairy'),
	('Sirup & Pemanis', 'Sirup rasa, gula aren, gula pasir'),
	('Kemasan', 'Cup, tutup, sedotan, paper bag, dus'),
	('Lainnya', 'Bahan pendukung operasional lainnya')
on conflict (nama) do nothing;
