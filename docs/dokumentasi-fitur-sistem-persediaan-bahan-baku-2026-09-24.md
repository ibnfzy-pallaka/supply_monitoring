# Dokumentasi Fitur: Sistem Informasi Persediaan Bahan Baku Berbasis Web


| Field          | Nilai                                                                               |
| -------------- | ----------------------------------------------------------------------------------- |
| Tanggal dibuat | 2026-09-24                                                                          |
| Status         | Draft                                                                               |
| Sumber         | `PROPOSAL ANGEL 1 (1).docx` — Proposal Skripsi (Studi Kasus: Kopi Waskita Makassar) |
| Prioritas      | Tinggi                                                                              |
| Estimasi total | 30-40 hari kerja                                                                    |


---

## Ringkasan

Dokumen ini merinci fitur-fitur yang dibutuhkan untuk membangun **Sistem Informasi Persediaan Bahan Baku Berbasis Web** pada Kopi Waskita Makassar. Sistem ini menggantikan pencatatan persediaan bahan baku (kopi, susu, sirup, dll.) yang masih manual dengan sistem terpusat yang memantau stok, transaksi masuk/keluar, dan laporan persediaan secara akurat dan real-time.

## Latar Belakang Sistem

Berdasarkan proposal, permasalahan yang ada saat ini:

- Pencatatan persediaan bahan baku masih **manual** sehingga rawan kesalahan (human error).
- Tidak ada visibilitas stok secara **real-time** — pemilik kesulitan mengetahui sisa stok bahan baku.
- Terjadi **kekurangan (stockout)** bahan baku saat operasional berjalan karena tidak ada peringatan dini.
- Sulit menghasilkan **laporan** persediaan yang cepat dan akurat untuk pengambilan keputusan.

## Tujuan &amp; Sasaran

- [ ] Pencatatan persediaan bahan baku terdigitalisasi (tidak lagi manual/kertas).
- [ ] Stok bahan baku dapat dipantau real-time oleh pemilik/pengelola.
- [ ] Terdapat peringatan otomatis saat stok mencapai batas minimum (reorder point).
- [ ] Laporan persediaan (barang masuk, keluar, sisa stok) dapat dihasilkan dengan cepat dan akurat.
- [ ] Mengurangi terjadinya stockout bahan baku saat operasional kedai.

## Scope

### Dalam Scope

- Manajemen data bahan baku, kategori, dan supplier.
- Transaksi barang masuk (pembelian/penerimaan) dan barang keluar (pemakaian/penjualan).
- Monitoring stok real-time dan notifikasi stok minimum.
- Laporan persediaan (harian, bulanan, periode) + export PDF.
- Manajemen user dan hak akses (role-based).
- Dashboard ringkasan persediaan.

### Di Luar Scope

- Aplikasi mobile native (hanya web, responsif via browser).
- Integrasi pembayaran / POS (point of sale).
- Perhitungan keuangan lengkap (laba-rugi, hutang-piutang).
- Prediksi kebutuhan bahan baku dengan metode forecasting (mis. EOQ) — bisa jadi pengembangan lanjutan.
- Manajemen produk jadi/menu — fokus hanya pada **bahan baku**.

## Teknologi &amp; Tools (Disarankan)

> Proposal tidak menetapkan stack spesifik. Berikut usulan stack yang lazim untuk skripsi sistem persediaan berbasis web.


| Kategori            | Teknologi                                                            |
| ------------------- | -------------------------------------------------------------------- |
| Backend             | Serverless Supabase                                                  |
| Frontend            | SvelteKit                                                            |
| Database            | Supabase                                                             |
| Diagram             | UML (Use Case, Activity, Sequence, ERD) — sesuai BAB II proposal     |
| Metode Pengembangan | Waterfall (Analisis → Desain → Implementasi → Testing → Maintenance) |


---

## Modul &amp; Breakdown Fitur

### 1. Autentikasi &amp; Manajemen User


| No  | Fitur                  | Deskripsi                                                                                             | Estimasi | Status  |
| --- | ---------------------- | ----------------------------------------------------------------------------------------------------- | -------- | ------- |
| 1.1 | Login / Logout         | Halaman login dengan validasi kredensial. Sesi aman (session/logout).                                 | 3 jam    | - \[ \] |
| 1.2 | Manajemen User (CRUD)  | Admin dapat menambah, mengubah, nonaktifkan akun user.                                                | 4 jam    | - \[ \] |
| 1.3 | Role &amp; Hak Akses   | Minimal 2 role: **Admin/Pemilik** (akses penuh) dan **Staff/Karyawan** (input transaksi, lihat stok). | 5 jam    | - \[ \] |
| 1.4 | Reset / ganti password | Ganti password sendiri; admin reset password staff.                                                   | 2 jam    | - \[ \] |


### 2. Master Data Bahan Baku


| No  | Fitur                  | Deskripsi                                                                                                                     | Estimasi | Status  |
| --- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------- | ------- |
| 2.1 | CRUD Bahan Baku        | Tambah/edit/hapus data bahan baku: kode, nama, kategori, satuan (kg, liter, pcs), stok minimum (reorder point), harga satuan. | 6 jam    | - \[ \] |
| 2.2 | CRUD Kategori          | Pengelompokan bahan baku (mis. kopi, susu, sirup, kemasan).                                                                   | 3 jam    | - \[ \] |
| 2.3 | CRUD Supplier / Vendor | Data pemasok bahan baku: nama, kontak, alamat, daftar bahan yang disuplai.                                                    | 4 jam    | - \[ \] |
| 2.4 | Pencarian &amp; filter | Pencarian bahan baku berdasarkan nama/kode; filter per kategori.                                                              | 2 jam    | - \[ \] |


### 3. Transaksi Persediaan


| No  | Fitur                           | Deskripsi                                                                                        | Estimasi | Status  |
| --- | ------------------------------- | ------------------------------------------------------------------------------------------------ | -------- | ------- |
| 3.1 | Barang Masuk (Pembelian)        | Record penerimaan bahan baku: tanggal, supplier, bahan, qty, harga. Otomatis menambah stok.      | 6 jam    | - \[ \] |
| 3.2 | Barang Keluar (Pemakaian)       | Record pemakaian bahan baku untuk operasional harian. Otomatis mengurangi stok.                  | 6 jam    | - \[ \] |
| 3.3 | Penyesuaian Stok (Stock Opname) | Koreksi stok hasil pencatatan fisik; mencatat selisih dan alasannya.                             | 4 jam    | - \[ \] |
| 3.4 | Kartu Stok (Stock Card)         | Riwayat pergerakan per bahan baku (masuk, keluar, sisa) per periode.                             | 5 jam    | - \[ \] |
| 3.5 | Validasi transaksi              | Cegah input stok keluar melebihi stok tersedia; validasi form (qty &gt; 0, bahan wajib dipilih). | 3 jam    | - \[ \] |


### 4. Monitoring &amp; Notifikasi Stok


| No  | Fitur                     | Deskripsi                                                                                                     | Estimasi | Status  |
| --- | ------------------------- | ------------------------------------------------------------------------------------------------------------- | -------- | ------- |
| 4.1 | Dashboard                 | Ringkasan: total bahan, total stok, bahan di bawah batas minimum, transaksi hari ini, grafik pergerakan stok. | 8 jam    | - \[ \] |
| 4.2 | Monitoring stok real-time | Tabel stok semua bahan dengan indikator status (aman / menipis / habis).                                      | 4 jam    | - \[ \] |
| 4.3 | Notifikasi stok minimum   | Peringatan (badge/notifikasi) saat stok ≤ reorder point; saran pengadaan.                                     | 5 jam    | - \[ \] |


### 5. Laporan


| No  | Fitur                          | Deskripsi                                                                             | Estimasi | Status  |
| --- | ------------------------------ | ------------------------------------------------------------------------------------- | -------- | ------- |
| 5.1 | Laporan barang masuk           | Rekap pembelian per periode (harian/bulanan/custom), dengan filter &amp; total nilai. | 4 jam    | - \[ \] |
| 5.2 | Laporan barang keluar          | Rekap pemakaian bahan baku per periode.                                               | 4 jam    | - \[ \] |
| 5.3 | Laporan persediaan (sisa stok) | Nilai persediaan akhir per bahan/per kategori.                                        | 4 jam    | - \[ \] |
| 5.4 | Export PDF/Excel               | Cetak &amp; unduh laporan dalam format PDF (dan/atau Excel).                          | 5 jam    | - \[ \] |


### 6. Keamanan &amp; Utilitas Sistem


| No  | Fitur                         | Deskripsi                                                                      | Estimasi | Status  |
| --- | ----------------------------- | ------------------------------------------------------------------------------ | -------- | ------- |
| 6.1 | Proteksi akses per role       | Middleware membatasi menu &amp; aksi sesuai role.                              | 3 jam    | - \[ \] |
| 6.2 | Audit trail / log aktivitas   | Catat siapa melakukan perubahan data (opsional tapi dianjurkan untuk skripsi). | 4 jam    | - \[ \] |
| 6.3 | Backup &amp; restore database | Prosedur backup reguler database.                                              | 2 jam    | - \[ \] |


---

## Urutan Eksekusi (Sesuai Metode Waterfall)

### Fase 1: Analisis Kebutuhan (Estimasi: 3 hari)

1. Wawancara/observasi proses bisnis Kopi Waskita Makassar.
2. Finalisasi kebutuhan fungsional &amp; non-fungsional (dokumen ini sebagai baseline).
3. Menyusun Use Case Diagram &amp; skenario.

### Fase 2: Desain Sistem (Estimasi: 5 hari)

1. Desain arsitektur &amp; ERD database (tabel: users, roles, bahan\_baku, kategori, supplier, transaksi\_masuk, transaksi\_keluar, stock\_opname, notifikasi).
2. Desain UI/UX (mockup halaman: login, dashboard, master data, transaksi, laporan).
3. Activity &amp; Sequence Diagram untuk proses kunci.

### Fase 3: Implementasi (Estimasi: 15-20 hari)

1. Setup project &amp; database migration.
2. Modul 1: Autentikasi &amp; Manajemen User.
3. Modul 2: Master Data (bahan baku, kategori, supplier).
4. Modul 3: Transaksi (masuk, keluar, opname, kartu stok).
5. Modul 4: Dashboard &amp; notifikasi stok minimum.
6. Modul 5: Laporan &amp; export PDF.

### Fase 4: Testing (Estimasi: 4-5 hari)

1. Unit testing per modul (black box testing).
2. Integration testing alur transaksi → stok → laporan.
3. UAT (User Acceptance Test) bersama pemilik kedai.

### Fase 5: Deployment &amp; Maintenance (Estimasi: 2 hari)

1. Deploy ke hosting/server.
2. Pelatihan penggunaan untuk pemilik &amp; staff.
3. Dokumentasi manual pengguna.

## Risiko &amp; Catatan

- **Data awal (migration stok) akurat**: Hasil stock opname awal harus benar sebelum sistem digunakan; jika salah, seluruh laporan ikut salah. Lakukan stock opname fisik dahulu.
- **Perubahan kebutuhan di tengah jalan**: Metode Waterfall kaku terhadap perubahan; bekukan scope (dokumen ini) sebelum desain dimulai.
- **Satuan bahan baku beragam** (kg, liter, pcs): Desain field `satuan` dan jangan melakukan penjumlahan lintas satuan.
- **Konektivitas di lokasi kedai**: Jika internet tidak stabil, pertimbangkan hosting lokal (LAN) atau hosting murah; UI harus ringan.
- **Proposal hanya sampai BAB III**: Detail use case/ERD pada proposal perlu dikonfirmasi ke penulis proposal bila ada perbedaan dengan dokumen ini.

## Acceptance Criteria

- [ ] Semua role dapat login sesuai hak aksesnya; staff tidak dapat mengakses menu admin.
- [ ] CRUD bahan baku, kategori, dan supplier berfungsi penuh dengan validasi.
- [ ] Transaksi barang masuk/keluar otomatis memperbarui stok secara konsisten.
- [ ] Notifikasi muncul otomatis ketika stok menyentuh batas minimum.
- [ ] Laporan masuk, keluar, dan sisa stok akurat sesuai data transaksi (angka cocok dengan kartu stok).
- [ ] Laporan dapat di-export ke PDF.
- [ ] Sistem lolos black box testing dan UAT bersama pemilik Kopi Waskita Makassar.

---

## Referensi

- `PROPOSAL ANGEL  1  (1).docx` — Proposal skripsi (sumber utama dokumen ini)
- BAB II proposal: teori Sistem Informasi, Persediaan, Web, Waterfall, UML
- BAB III proposal: penggambaran sistem &amp; analisis kebutuhan

