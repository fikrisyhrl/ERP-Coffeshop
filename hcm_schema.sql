-- ============================================================================
-- SKEMA REAL HUMAN RESOURCE (HCM & PAYROLL) - ERP COFFEE SHOP
-- RDBMS: PostgreSQL (Supabase SQL Editor Compatible)
-- ============================================================================

-- 1. BERSIHKAN TABEL LAMA JIKA ADA (Mencegah konflik kolom versi lama)
DROP TABLE IF EXISTS payroll_items CASCADE;
DROP TABLE IF EXISTS payrolls CASCADE;
DROP TABLE IF EXISTS attendances CASCADE;
DROP TABLE IF EXISTS performance_appraisals CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS job_positions CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- ============================================================================
-- 2. TABEL DEPARTEMEN (departments)
-- ============================================================================
CREATE TABLE departments (
    id_departemen SERIAL PRIMARY KEY,
    nama_departemen VARCHAR(100) NOT NULL UNIQUE,
    deskripsi TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. TABEL POSISI / JABATAN (job_positions)
-- ============================================================================
CREATE TABLE job_positions (
    id_posisi SERIAL PRIMARY KEY,
    departemen_id INT NOT NULL REFERENCES departments(id_departemen) ON DELETE CASCADE,
    nama_jabatan VARCHAR(100) NOT NULL,
    gaji_pokok_standar DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. TABEL DATA MASTER PEGAWAI (employees)
-- ============================================================================
CREATE TABLE employees (
    id_pegawai SERIAL PRIMARY KEY,
    kode_pegawai VARCHAR(30) NOT NULL UNIQUE,
    nama_lengkap VARCHAR(150) NOT NULL,
    email VARCHAR(100),
    telepon VARCHAR(30),
    posisi_id INT NOT NULL REFERENCES job_positions(id_posisi) ON DELETE RESTRICT,
    status_kerja VARCHAR(30) NOT NULL DEFAULT 'FULL_TIME',
    gaji_pokok DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    nama_bank VARCHAR(50) DEFAULT 'BCA',
    nomor_rekening VARCHAR(50),
    tanggal_masuk DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_emp_kode_pegawai ON employees(kode_pegawai);
CREATE INDEX idx_emp_posisi_id ON employees(posisi_id);

-- ============================================================================
-- 5. TABEL ABSENSI & KEHADIRAN (attendances)
-- ============================================================================
CREATE TABLE attendances (
    id_absensi BIGSERIAL PRIMARY KEY,
    pegawai_id INT NOT NULL REFERENCES employees(id_pegawai) ON DELETE CASCADE,
    tanggal_absensi DATE NOT NULL,
    nama_shift VARCHAR(50) DEFAULT 'Shift Normal',
    jam_masuk TIMESTAMP WITH TIME ZONE,
    jam_keluar TIMESTAMP WITH TIME ZONE,
    status_kehadiran VARCHAR(30) NOT NULL DEFAULT 'HADIR',
    menit_terlambat INT NOT NULL DEFAULT 0,
    jam_lembur DECIMAL(4, 2) NOT NULL DEFAULT 0.00,
    catatan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_att_pegawai ON attendances(pegawai_id);
CREATE INDEX idx_att_tanggal ON attendances(tanggal_absensi);

-- ============================================================================
-- 6. TABEL SLIP GAJI & PAYROLL (payrolls)
-- ============================================================================
CREATE TABLE payrolls (
    id_payroll BIGSERIAL PRIMARY KEY,
    nomor_slip VARCHAR(50) NOT NULL UNIQUE,
    pegawai_id INT NOT NULL REFERENCES employees(id_pegawai) ON DELETE CASCADE,
    bulan INT NOT NULL,
    tahun INT NOT NULL,
    periode_mulai DATE NOT NULL,
    periode_selesai DATE NOT NULL,
    total_hari_kerja_target INT DEFAULT 24,
    total_hadir INT DEFAULT 0,
    total_menit_terlambat INT DEFAULT 0,
    total_jam_lembur DECIMAL(4, 2) DEFAULT 0.00,
    total_pendapatan DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    total_potongan DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    gaji_bersih DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    status_pembayaran VARCHAR(30) DEFAULT 'DRAFT',
    tanggal_bayar TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payroll_pegawai ON payrolls(pegawai_id);

-- ============================================================================
-- 7. TABEL RINCIAN ITEM GAJI (payroll_items)
-- ============================================================================
CREATE TABLE payroll_items (
    id_payroll_item BIGSERIAL PRIMARY KEY,
    payroll_id BIGINT NOT NULL REFERENCES payrolls(id_payroll) ON DELETE CASCADE,
    nama_komponen VARCHAR(100) NOT NULL,
    tipe_komponen VARCHAR(30) NOT NULL,
    nominal DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    keterangan VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payroll_item_payroll ON payroll_items(payroll_id);

-- ============================================================================
-- 8. SEED DATA AWAL: DEPARTEMEN COFFEE SHOP
-- ============================================================================
INSERT INTO departments (id_departemen, nama_departemen, deskripsi) VALUES
(1, 'Management', 'Pengelola & Operasional Store'),
(2, 'Bar & Floor', 'Barista, Espresso Station, & Layanan Tamu'),
(3, 'Roastery', 'Roasting Biji Kopi & Quality Control'),
(4, 'Kitchen & Food', 'Dapur, Makanan Ringan, & Pastry'),
(5, 'Supply & Warehouse', 'Logistik, Gudang, & Pengadaan Bahan'),
(6, 'Back Office', 'Finance, Kasir & HR People Operations'),
(7, 'Maintenance', 'Kebersihan, Utilitas, & Perawatan Toko')
ON CONFLICT (id_departemen) DO UPDATE SET 
    nama_departemen = EXCLUDED.nama_departemen, 
    deskripsi = EXCLUDED.deskripsi;

-- ============================================================================
-- 9. SEED DATA AWAL: POSISI JABATAN
-- ============================================================================
INSERT INTO job_positions (id_posisi, departemen_id, nama_jabatan, gaji_pokok_standar) VALUES
(1, 1, 'Store Manager & Owner', 8500000.00),
(2, 2, 'Head Barista & QC', 5200000.00),
(3, 2, 'Senior Barista & Latte Artist', 4500000.00),
(4, 2, 'Junior Barista', 3800000.00),
(5, 2, 'Head Cashier & POS', 3900000.00),
(6, 3, 'Master Coffee Roaster', 6000000.00),
(7, 4, 'Kitchen Head Cook', 5500000.00),
(8, 4, 'Pastry & Bakery Chef', 4800000.00),
(9, 5, 'Inventory & Warehouse Officer', 4200000.00),
(10, 6, 'Finance & Cashier Supervisor', 5000000.00),
(11, 7, 'General Utility & Dishwasher', 3200000.00),
(12, 6, 'HR & People Operations', 4700000.00)
ON CONFLICT (id_posisi) DO UPDATE SET 
    nama_jabatan = EXCLUDED.nama_jabatan, 
    gaji_pokok_standar = EXCLUDED.gaji_pokok_standar;

-- ============================================================================
-- 10. SEED DATA AWAL: 12 KARYAWAN AKTIF KAFEINA COFFEE SHOP
-- ============================================================================
INSERT INTO employees (id_pegawai, kode_pegawai, nama_lengkap, email, telepon, posisi_id, status_kerja, gaji_pokok, nama_bank, nomor_rekening, is_active) VALUES
(1, 'EMP-001', 'Fikri Syahrial', 'fikri.manager@kafeinaerp.com', '0812-1111-2222', 1, 'FULL_TIME', 8500000.00, 'BCA', '5270111222', true),
(2, 'EMP-002', 'Dimas Pratama', 'dimas.barista@kafeinaerp.com', '0812-9876-5432', 2, 'FULL_TIME', 5200000.00, 'BCA', '5270123456', true),
(3, 'EMP-003', 'Sarah Nabila', 'sarah.latte@kafeinaerp.com', '0813-2233-4455', 3, 'FULL_TIME', 4500000.00, 'Mandiri', '131009876543', true),
(4, 'EMP-004', 'Rizky Ramadhan', 'rizky.barista@kafeinaerp.com', '0819-3344-5566', 4, 'FULL_TIME', 3800000.00, 'BRI', '012345678901', true),
(5, 'EMP-005', 'Anisa Rahmawati', 'anisa.cashier@kafeinaerp.com', '0818-4455-6677', 5, 'FULL_TIME', 3900000.00, 'BCA', '5270998877', true),
(6, 'EMP-006', 'Bayu Nugroho', 'bayu.roaster@kafeinaerp.com', '0857-5566-7788', 6, 'FULL_TIME', 6000000.00, 'BNI', '0897654321', true),
(7, 'EMP-007', 'Hendra Wijaya', 'hendra.kitchen@kafeinaerp.com', '0877-6677-8899', 7, 'FULL_TIME', 5500000.00, 'BCA', '5270334455', true),
(8, 'EMP-008', 'Dewi Sartika', 'dewi.pastry@kafeinaerp.com', '0812-7788-9900', 8, 'FULL_TIME', 4800000.00, 'Mandiri', '131005544332', true),
(9, 'EMP-009', 'Agus Santoso', 'agus.inventory@kafeinaerp.com', '0821-8899-0011', 9, 'FULL_TIME', 4200000.00, 'BRI', '012344556677', true),
(10, 'EMP-010', 'Maya Lestari', 'maya.finance@kafeinaerp.com', '0813-9900-1122', 10, 'FULL_TIME', 5000000.00, 'BCA', '5270667788', true),
(11, 'EMP-011', 'Rudi Hartono', 'rudi.utility@kafeinaerp.com', '0852-0011-2233', 11, 'FULL_TIME', 3200000.00, 'BRI', '012388990011', true),
(12, 'EMP-012', 'Siti Aisyah', 'siti.hr@kafeinaerp.com', '0819-1122-3344', 12, 'FULL_TIME', 4700000.00, 'BNI', '0897112233', true)
ON CONFLICT (id_pegawai) DO UPDATE SET
    nama_lengkap = EXCLUDED.nama_lengkap,
    gaji_pokok = EXCLUDED.gaji_pokok,
    posisi_id = EXCLUDED.posisi_id;

-- ============================================================================
-- 11. RE-SYNC SEQUENCE GENERATOR ID (Agar ID auto-increment tidak bentrok)
-- ============================================================================
SELECT setval(pg_get_serial_sequence('departments', 'id_departemen'), COALESCE(MAX(id_departemen), 1)) FROM departments;
SELECT setval(pg_get_serial_sequence('job_positions', 'id_posisi'), COALESCE(MAX(id_posisi), 1)) FROM job_positions;
SELECT setval(pg_get_serial_sequence('employees', 'id_pegawai'), COALESCE(MAX(id_pegawai), 1)) FROM employees;
