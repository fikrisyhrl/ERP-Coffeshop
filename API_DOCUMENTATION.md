# Dokumentasi Resmi API Backend ERP Coffee Shop

Dokumentasi lengkap REST API untuk sistem ERP Coffee Shop (Node.js, Express.js, Sequelize ORM, PostgreSQL Supabase / MySQL).

- **Base URL Server**: `http://localhost:5000`
- **Base API Prefix**: `http://localhost:5000/api`
- **Content-Type**: `application/json`

---

## 📌 Daftar Isi Modul
1. [Sistem & Health Check](#1-sistem--health-check)
2. [Autentikasi & Hak Akses (Auth & User)](#2-autentikasi--hak-akses-auth--user)
3. [Master Data Bahan Baku (Barang)](#3-master-data-bahan-baku-barang)
4. [Manajemen Stok & Mutasi (Inventory)](#4-manajemen-stok--mutasi-inventory)
5. [Pengadaan & Supplier (Procurement)](#5-pengadaan--supplier-procurement)
6. [Keuangan & Akuntansi (Finance & Accounting)](#6-keuangan--akuntansi-finance--accounting)
7. [SDM & Penggajian (HCM & Payroll)](#7-sdm--penggajian-hcm--payroll)

---

## 1. Sistem & Health Check

### 1.1 Health Check Server
- **Endpoint**: `GET /health`
- **Deskripsi**: Memeriksa status uptime dan kesehatan server backend.
- **Respons (200 OK)**:
```json
{
  "status": "OK",
  "timestamp": "2026-10-15T02:30:00.000Z",
  "uptime": 124.5
}
```

### 1.2 Info Root API
- **Endpoint**: `GET /api`
- **Deskripsi**: Informasi dasar API dan daftar modul yang tersedia.
- **Respons (200 OK)**:
```json
{
  "success": true,
  "message": "Selamat datang di API Sistem ERP Coffee Shop",
  "dashboard_ui": "Untuk membuka antarmuka visual website (UI), silakan akses http://localhost:5000",
  "version": "1.0.0",
  "available_modules": {
    "master_barang": "/api/barang",
    "inventory": "/api/inventory",
    "procurement": "/api/procurement",
    "hcm_payroll": "/api/hcm/payroll",
    "finance_accounting": "/api/finance"
  }
}
```

---

## 2. Autentikasi & Hak Akses (Auth & User)

### 2.1 Login Pengguna
- **Endpoint**: `POST /api/auth/login` (atau `POST /api/users/login`)
- **Request Body**:
```json
{
  "username": "manager",
  "password": "manager123"
}
```
- **Respons (200 OK)**:
```json
{
  "success": true,
  "message": "Selamat datang, Fikri (Store Manager & Owner)! Berhasil masuk sebagai MANAGER.",
  "data": {
    "id_user": 1,
    "nama_lengkap": "Fikri (Store Manager & Owner)",
    "username": "manager",
    "role": "MANAGER",
    "role_name": "Manager / Owner",
    "allowed_modules": ["dashboard", "finance", "hcm", "procurement", "inventory", "users"],
    "can_manage_users": true
  }
}
```

### 2.2 Register Pengguna Baru
- **Endpoint**: `POST /api/auth/register`
- **Request Body**:
```json
{
  "nama_lengkap": "Doni Barista",
  "username": "doni_barista",
  "password": "password123",
  "role": "HR"
}
```
- **Role Valid**: `MANAGER`, `FINANCE`, `HR`, `PROCUREMENT`

### 2.3 Ambil Semua Pengguna
- **Endpoint**: `GET /api/users`
- **Deskripsi**: Mengambil daftar seluruh pengguna sistem ERP.
- **Respons (200 OK)**:
```json
{
  "success": true,
  "message": "Daftar pengguna sistem ERP",
  "data": [
    {
      "id_user": 1,
      "nama_lengkap": "Fikri (Store Manager & Owner)",
      "username": "manager",
      "role": "MANAGER",
      "is_active": true
    }
  ]
}
```

### 2.4 Detail Pengguna
- **Endpoint**: `GET /api/users/:id`

### 2.5 Update Pengguna
- **Endpoint**: `PUT /api/users/:id`
- **Request Body**:
```json
{
  "nama_lengkap": "Fikri Syahrial",
  "role": "MANAGER",
  "is_active": true
}
```

### 2.6 Hapus Pengguna
- **Endpoint**: `DELETE /api/users/:id`

---

## 3. Master Data Bahan Baku (Barang)

### 3.1 Ambil Semua Barang
- **Endpoint**: `GET /api/barang`
- **Query Params**:
  - `kategori` *(opsional)*: filter berdasarkan kategori (contoh: `Coffee Beans`, `Dairy`, `Syrup`)
  - `search` *(opsional)*: cari berdasarkan nama barang
- **Respons (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id_barang": 1,
      "nama_barang": "Arabica Gayo Wine Roasted Beans",
      "kategori": "Coffee Beans",
      "satuan": "gr",
      "stok_saat_ini": 1500,
      "batas_safety_stock": 2000,
      "harga_satuan": 350.00,
      "supplier_id": 1
    }
  ]
}
```

### 3.2 Ambil Detail Barang
- **Endpoint**: `GET /api/barang/:id`

### 3.3 Tambah Barang Baru
- **Endpoint**: `POST /api/barang`
- **Request Body**:
```json
{
  "nama_barang": "Matcha Uji Premium Powder",
  "kategori": "Powder",
  "satuan": "gr",
  "stok_saat_ini": 1000,
  "batas_safety_stock": 1500,
  "harga_satuan": 450,
  "supplier_id": 1
}
```

### 3.4 Update Data Barang
- **Endpoint**: `PUT /api/barang/:id`

### 3.5 Hapus Data Barang
- **Endpoint**: `DELETE /api/barang/:id`

---

## 4. Manajemen Stok & Mutasi (Inventory)

### 4.1 Catat Pemakaian Stok (Mutasi Keluar) & Pemicu Auto-PO
- **Endpoint**: `POST /api/inventory/mutasi-keluar`
- **Deskripsi**: Mencatat pemakaian stok harian (penjualan kasir POS, kerusakan, expired). Jika sisa stok berada di bawah `batas_safety_stock`, sistem otomatis membuat draf Purchase Order (PO).
- **Request Body**:
```json
{
  "id_barang": 1,
  "jumlah_keluar": 500,
  "tipe_mutasi": "OUT_SALES_POS",
  "referensi_tipe": "POS_ORDER",
  "referensi_id": 101,
  "keterangan": "Pemakaian espresso 25 cups latte"
}
```
- **Respons (200 OK)**:
```json
{
  "success": true,
  "message": "Mutasi keluar berhasil dicatat",
  "data": {
    "stok_sebelumnya": 2000,
    "jumlah_keluar": 500,
    "stok_sekarang": 1500,
    "safety_stock_alert": true,
    "auto_po_created": true,
    "po_nomor": "PO-REQ-8492"
  }
}
```

### 4.2 Riwayat Seluruh Mutasi Stok
- **Endpoint**: `GET /api/inventory/mutasi`

### 4.3 Kartu Stok Per Barang
- **Endpoint**: `GET /api/inventory/kartu-stok/:id_barang`
- **Deskripsi**: Menampilkan kartu stok lengkap berupa arus masuk, keluar, sisa saldo stok, dan HPP berjalan.

---

## 5. Pengadaan & Supplier (Procurement)

### 5.1 Ambil Semua Supplier
- **Endpoint**: `GET /api/procurement/supplier`

### 5.2 Tambah Supplier Baru
- **Endpoint**: `POST /api/procurement/supplier`
- **Request Body**:
```json
{
  "nama_supplier": "PT Sumber Dairy Sejahtera",
  "kontak_person": "Linda Kusuma",
  "telepon": "0819-8765-4321",
  "email": "sales@sumberdairy.co.id",
  "alamat": "Kawasan Industri Cikarang Blok B2"
}
```

### 5.3 Ambil Daftar Purchase Order (PO)
- **Endpoint**: `GET /api/procurement/po`
- **Query Params**:
  - `status` *(opsional)*: `DRAFT`, `PENDING_APPROVAL`, `CONFIRMED`, `RECEIVED`, `CANCELLED`

### 5.4 Buat Purchase Order (Manual)
- **Endpoint**: `POST /api/procurement/po`
- **Request Body**:
```json
{
  "supplier_id": 1,
  "catatan": "Pengadaan stok biji kopi untuk restock weekend",
  "items": [
    {
      "id_barang": 1,
      "jumlah_pesan": 5000,
      "harga_satuan_estimasi": 350
    }
  ]
}
```

### 5.5 Ajukan PO ke Finance
- **Endpoint**: `PATCH /api/procurement/po/:id/ajukan-finance`

### 5.6 Konfirmasi PO Langsung
- **Endpoint**: `PATCH /api/procurement/po/:id/konfirmasi`

### 5.7 Penerimaan Barang (Goods Receipt / GRN)
- **Endpoint**: `POST /api/procurement/terima-barang`
- **Deskripsi**: Memproses barang datang dari supplier. Otomatis:
  1. Menambah stok bahan baku.
  2. Menghitung ulang **HPP Moving Average** (Weighted Average Cost).
  3. Menerbitkan invoice tagihan hutang dagang di modul Finance.
- **Request Body**:
```json
{
  "po_id": 1,
  "nomor_surat_jalan": "SJ/ROASTERY/2026/099",
  "diterima_oleh": "Head Barista Dimas",
  "items": [
    {
      "po_item_id": 1,
      "id_barang": 1,
      "jumlah_diterima": 5000,
      "harga_beli_satuan": 360
    }
  ]
}
```

---

## 6. Keuangan & Akuntansi (Finance & Accounting)

### 6.1 Bagan Akun (Chart of Accounts / CoA)
- **Inisialisasi Standar CoA**: `POST /api/finance/seed-coa`
- **Daftar Seluruh CoA**: `GET /api/finance/coa`

### 6.2 Jurnal Umum (General Ledger)
- **Ambil Riwayat Jurnal**: `GET /api/finance/jurnal`
- **Catat Jurnal Manual (Balanced)**: `POST /api/finance/jurnal/manual`
  - Body:
```json
{
  "keterangan": "Biaya Listrik & Air Bulan Ini",
  "lines": [
    { "akun_id": 7, "debet": 1500000, "kredit": 0 },
    { "akun_id": 2, "debet": 0, "kredit": 1500000 }
  ]
}
```

### 6.3 Otorisasi Pengajuan Pembelian Procurement
- **Daftar Pengajuan Menunggu Persetujuan**: `GET /api/finance/pengajuan-po?status=PENDING_APPROVAL`
- **Setujui Pengajuan PO**: `PATCH /api/finance/pengajuan-po/:id/setujui`
  - Body:
```json
{
  "disetujui_oleh": "Finance Manager Fikri",
  "catatan_finance": "Anggaran belanja disetujui. Silakan order ke supplier."
}
```
- **Tolak Pengajuan PO**: `PATCH /api/finance/pengajuan-po/:id/tolak`
  - Body:
```json
{
  "ditolak_oleh": "Finance Manager Fikri",
  "alasan_penolakan": "Arus kas diprioritaskan untuk payroll minggu ini."
}
```

### 6.4 Manajemen Tagihan & Hutang Dagang (Invoices)
- **Daftar Invoice**: `GET /api/finance/invoices`
- **Buat Invoice Tagihan**: `POST /api/finance/invoices`
- **Bayar & Lunasi Invoice**: `PATCH /api/finance/invoices/:id/bayar`
  - Otomatis membuat entri Jurnal Pembayaran: Debet Hutang Usaha, Kredit Kas/Bank.
  - Body:
```json
{
  "metode_pembayaran": "TRANSFER_BCA",
  "akun_kas_id": 2,
  "dibayar_oleh": "Staff Finance"
}
```

### 6.5 Arus Kas & Saldo Uang Realtime
- **Cek Saldo Kas Toko & Bank**: `GET /api/finance/cash-balance`
- **Catat Mutasi Kas (Pemasukan Kasir / Modal)**: `POST /api/finance/cash-mutation`
  - Body:
```json
{
  "tipe_transaksi": "PENJUALAN_KASIR",
  "akun_id": 1,
  "nominal": 4500000,
  "keterangan": "Pemasukan kasir shift pagi & malam"
}
```

---

## 7. SDM & Penggajian (HCM & Payroll)

### 7.1 Master Data Pegawai
- **Daftar Semua Pegawai**: `GET /api/hcm/pegawai` (atau `GET /api/hcm/payroll/pegawai`)
- **Tambah Pegawai Baru**: `POST /api/hcm/pegawai`
  - Body:
```json
{
  "nama_lengkap": "Siti Nurhaliza",
  "jabatan": "Junior Barista",
  "departemen": "Bar & Floor",
  "gaji_pokok": 3800000,
  "status_kerja": "FULL_TIME",
  "nama_bank": "BCA",
  "telepon": "081234567890"
}
```
- **Hapus Pegawai**: `DELETE /api/hcm/pegawai/:id`

### 7.2 Data Absensi
- **Daftar Riwayat Absensi**: `GET /api/hcm/absensi`

### 7.3 Perhitungan & Slip Gaji (Payroll)
- **Generate Data Demo Simulasi**: `POST /api/hcm/payroll/seed-demo`
- **Hitung Slip Gaji Otomatis**: `POST /api/hcm/payroll/hitung/:pegawai_id`
  - Rumus: `Gaji Bersih = Gaji Pokok + Tunjangan Kehadiran + Upah Lembur - Denda Telat`
  - Body (opsional parameter kustom):
```json
{
  "bulan": 10,
  "tahun": 2026,
  "target_hari_kerja": 24,
  "nominal_tunjangan_kehadiran": 500000,
  "tarif_potongan_per_menit": 2000,
  "tarif_lembur_per_jam": 25000
}
```
- **Riwayat Seluruh Slip Gaji**: `GET /api/hcm/payroll/list`
- **Detail Satu Slip Gaji**: `GET /api/hcm/payroll/slip/:payroll_id`
- **Jurnal Otomatis Pembayaran Gaji**: `POST /api/finance/jurnal/payroll`
  - Debet Beban Gaji Karyawan, Kredit Kas/Bank BCA.
