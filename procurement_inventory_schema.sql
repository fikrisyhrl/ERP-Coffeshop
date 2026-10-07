-- ============================================================================
-- SKEMA REAL PROCUREMENT, INVENTORY, & FINANCE - ERP COFFEE SHOP
-- RDBMS: PostgreSQL (Supabase Compatible)
-- ============================================================================

-- 1. BERSIHKAN TABEL LAMA DENGAN AMAN
DROP TABLE IF EXISTS journal_entry_lines CASCADE;
DROP TABLE IF EXISTS journal_entries CASCADE;
DROP TABLE IF EXISTS chart_of_accounts CASCADE;
DROP TABLE IF EXISTS stock_mutations CASCADE;
DROP TABLE IF EXISTS goods_receipt_items CASCADE;
DROP TABLE IF EXISTS goods_receipts CASCADE;
DROP TABLE IF EXISTS purchase_invoices CASCADE;
DROP TABLE IF EXISTS purchase_order_items CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS master_barang CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;

-- ============================================================================
-- 2. TABEL SUPPLIER (suppliers)
-- ============================================================================
CREATE TABLE suppliers (
    id_supplier SERIAL PRIMARY KEY,
    nama_supplier VARCHAR(150) NOT NULL,
    kontak_person VARCHAR(100),
    telepon VARCHAR(30),
    email VARCHAR(100),
    alamat TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. TABEL MASTER BARANG (master_barang)
-- ============================================================================
CREATE TABLE master_barang (
    id_barang SERIAL PRIMARY KEY,
    nama_barang VARCHAR(150) NOT NULL,
    kategori VARCHAR(100) NOT NULL,
    satuan VARCHAR(30) NOT NULL,
    stok_saat_ini DECIMAL(12, 3) NOT NULL DEFAULT 0.000,
    harga_satuan DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    batas_safety_stock DECIMAL(12, 3) NOT NULL DEFAULT 0.000,
    supplier_id INT REFERENCES suppliers(id_supplier) ON DELETE SET NULL,
    quality_grade VARCHAR(30) NOT NULL DEFAULT 'GRADE_A',
    stok_reject DECIMAL(12, 3) NOT NULL DEFAULT 0.000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mb_nama ON master_barang(nama_barang);
CREATE INDEX idx_mb_kategori ON master_barang(kategori);

-- ============================================================================
-- 4. TABEL PURCHASE ORDER (purchase_orders)
-- ============================================================================
CREATE TABLE purchase_orders (
    id_po BIGSERIAL PRIMARY KEY,
    nomor_po VARCHAR(50) NOT NULL UNIQUE,
    supplier_id INT NOT NULL REFERENCES suppliers(id_supplier) ON DELETE RESTRICT,
    tanggal_po DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_APPROVAL',
    total_estimasi DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    is_auto_generated BOOLEAN DEFAULT FALSE,
    catatan TEXT,
    disetujui_oleh VARCHAR(100),
    tanggal_approval TIMESTAMP WITH TIME ZONE,
    catatan_finance TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_po_nomor ON purchase_orders(nomor_po);
CREATE INDEX idx_po_status ON purchase_orders(status);

-- ============================================================================
-- 5. TABEL ITEM PURCHASE ORDER (purchase_order_items)
-- ============================================================================
CREATE TABLE purchase_order_items (
    id_po_item BIGSERIAL PRIMARY KEY,
    po_id BIGINT NOT NULL REFERENCES purchase_orders(id_po) ON DELETE CASCADE,
    id_barang INT NOT NULL REFERENCES master_barang(id_barang) ON DELETE RESTRICT,
    jumlah_pesan DECIMAL(12, 3) NOT NULL,
    jumlah_diterima DECIMAL(12, 3) NOT NULL DEFAULT 0.000,
    harga_satuan_estimasi DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_poi_po_id ON purchase_order_items(po_id);

-- ============================================================================
-- 6. TABEL INVOICE PEMBELIAN / TAGIHAN VENDOR (purchase_invoices)
-- ============================================================================
CREATE TABLE purchase_invoices (
    id_invoice BIGSERIAL PRIMARY KEY,
    nomor_invoice VARCHAR(50) NOT NULL UNIQUE,
    po_id BIGINT NOT NULL REFERENCES purchase_orders(id_po) ON DELETE CASCADE,
    supplier_id INT NOT NULL REFERENCES suppliers(id_supplier) ON DELETE RESTRICT,
    tanggal_invoice DATE NOT NULL DEFAULT CURRENT_DATE,
    tanggal_jatuh_tempo DATE NOT NULL,
    total_tagihan DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    status_pembayaran VARCHAR(30) NOT NULL DEFAULT 'UNPAID',
    metode_pembayaran VARCHAR(50),
    tanggal_bayar TIMESTAMP WITH TIME ZONE,
    dibayar_oleh VARCHAR(100),
    catatan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inv_nomor ON purchase_invoices(nomor_invoice);
CREATE INDEX idx_inv_status ON purchase_invoices(status_pembayaran);

-- ============================================================================
-- 7. TABEL PENERIMAAN BARANG / GOODS RECEIPT (goods_receipts)
-- ============================================================================
CREATE TABLE goods_receipts (
    id_penerimaan BIGSERIAL PRIMARY KEY,
    nomor_penerimaan VARCHAR(50) NOT NULL UNIQUE,
    po_id BIGINT NOT NULL REFERENCES purchase_orders(id_po) ON DELETE CASCADE,
    nomor_surat_jalan VARCHAR(100),
    tanggal_terima TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    diterima_oleh VARCHAR(100) NOT NULL,
    catatan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 8. TABEL ITEM PENERIMAAN BARANG (goods_receipt_items)
-- ============================================================================
CREATE TABLE goods_receipt_items (
    id_penerimaan_item BIGSERIAL PRIMARY KEY,
    penerimaan_id BIGINT NOT NULL REFERENCES goods_receipts(id_penerimaan) ON DELETE CASCADE,
    po_item_id BIGINT NOT NULL REFERENCES purchase_order_items(id_po_item) ON DELETE CASCADE,
    id_barang INT NOT NULL REFERENCES master_barang(id_barang) ON DELETE RESTRICT,
    jumlah_diterima DECIMAL(12, 3) NOT NULL,
    harga_beli_satuan DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    batch_number VARCHAR(50),
    tanggal_kadaluarsa DATE,
    quality_grade VARCHAR(30) NOT NULL DEFAULT 'GRADE_A',
    jumlah_lolos_qc DECIMAL(12, 3) NOT NULL DEFAULT 0.000,
    jumlah_reject_qc DECIMAL(12, 3) NOT NULL DEFAULT 0.000,
    catatan_qc TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 9. TABEL MUTASI STOK / KARTU STOK (stock_mutations)
-- ============================================================================
CREATE TABLE stock_mutations (
    id_mutasi BIGSERIAL PRIMARY KEY,
    id_barang INT NOT NULL REFERENCES master_barang(id_barang) ON DELETE CASCADE,
    tipe_mutasi VARCHAR(50) NOT NULL,
    jumlah_masuk DECIMAL(12, 3) NOT NULL DEFAULT 0.000,
    jumlah_keluar DECIMAL(12, 3) NOT NULL DEFAULT 0.000,
    saldo_akhir DECIMAL(12, 3) NOT NULL,
    harga_satuan DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    referensi_tipe VARCHAR(50),
    referensi_id BIGINT,
    keterangan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sm_barang ON stock_mutations(id_barang);

-- ============================================================================
-- 10. TABEL BAGAN AKUN / CHART OF ACCOUNTS (chart_of_accounts)
-- ============================================================================
CREATE TABLE chart_of_accounts (
    id_akun SERIAL PRIMARY KEY,
    kode_akun VARCHAR(30) NOT NULL UNIQUE,
    nama_akun VARCHAR(150) NOT NULL,
    tipe_akun VARCHAR(30) NOT NULL,
    saldo_normal VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 11. TABEL JURNAL UMUM (journal_entries)
-- ============================================================================
CREATE TABLE journal_entries (
    id_jurnal BIGSERIAL PRIMARY KEY,
    nomor_jurnal VARCHAR(50) NOT NULL UNIQUE,
    tanggal_jurnal DATE NOT NULL DEFAULT CURRENT_DATE,
    tipe_referensi VARCHAR(50) NOT NULL,
    referensi_id BIGINT,
    keterangan TEXT NOT NULL,
    total_debet DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    total_kredit DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'POSTED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 12. TABEL BARIS JURNAL (journal_entry_lines)
-- ============================================================================
CREATE TABLE journal_entry_lines (
    id_jurnal_line BIGSERIAL PRIMARY KEY,
    jurnal_id BIGINT NOT NULL REFERENCES journal_entries(id_jurnal) ON DELETE CASCADE,
    akun_id INT NOT NULL REFERENCES chart_of_accounts(id_akun) ON DELETE RESTRICT,
    debet DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    kredit DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    catatan VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 13. SEED MASTER DATA: SUPPLIERS
-- ============================================================================
INSERT INTO suppliers (id_supplier, nama_supplier, kontak_person, telepon, email, alamat) VALUES
(1, 'CV Nusantara Coffee Roastery', 'Budi Santoso', '0812-3456-7890', 'order@nusantararoastery.com', 'Jl. Raya Kopi No. 45, Bandung'),
(2, 'PT Sumber Dairy Sejahtera', 'Linda Kusuma', '0819-8765-4321', 'sales@sumberdairy.co.id', 'Kawasan Industri Cikarang Blok B2'),
(3, 'Distributor Sirup & Packaging', 'Hendra Tan', '0811-2233-4455', 'hendra@syruppackaging.id', 'Jl. Boulevard Kelapa Gading No. 12, Jakarta')
ON CONFLICT (id_supplier) DO NOTHING;

-- ============================================================================
-- 14. SEED MASTER DATA: BAHAN BAKU & INVENTORY (master_barang)
-- ============================================================================
INSERT INTO master_barang (id_barang, nama_barang, kategori, satuan, stok_saat_ini, harga_satuan, batas_safety_stock, supplier_id, quality_grade, stok_reject) VALUES
(1, 'Arabica Gayo Wine Roasted Beans', 'Coffee Beans', 'gr', 850.000, 350.00, 2000.000, 1, 'GRADE_A', 0.000),
(2, 'Greenfields Fresh Milk Pasteurized', 'Dairy', 'ml', 3000.000, 28.00, 10000.000, 2, 'GRADE_A', 0.000),
(3, 'Monin Salted Caramel Syrup 700ml', 'Syrup', 'ml', 450.000, 210.00, 1400.000, 3, 'GRADE_A', 0.000),
(4, 'Robusta Temanggung Natural Beans', 'Coffee Beans', 'gr', 3200.000, 180.00, 2500.000, 1, 'GRADE_A', 0.000),
(5, 'Hot Paper Cup 8oz Double Wall + Lid', 'Packaging', 'pcs', 180.000, 1250.00, 500.000, 3, 'GRADE_A', 0.000),
(6, 'Oatside Barista Blend Oat Milk 1L', 'Dairy', 'ml', 7000.000, 42.00, 6000.000, 2, 'GRADE_A', 0.000)
ON CONFLICT (id_barang) DO NOTHING;

-- ============================================================================
-- 15. SEED DATA AWAL: BAGAN AKUN STANDAR KAFEINA (Chart of Accounts)
-- ============================================================================
INSERT INTO chart_of_accounts (id_akun, kode_akun, nama_akun, tipe_akun, saldo_normal, is_active) VALUES
(1, '1-1001', 'Kas Kasir Toko (Petty Cash)', 'ASET', 'DEBET', true),
(2, '1-1020', 'Bank BCA Operasional Bisnis', 'ASET', 'DEBET', true),
(3, '1-1030', 'Persediaan Bahan Baku & Kopi', 'ASET', 'DEBET', true),
(4, '2-1001', 'Hutang Dagang / Supplier', 'KEWAJIBAN', 'KREDIT', true),
(5, '2-1002', 'Hutang Gaji & Upah Karyawan', 'KEWAJIBAN', 'KREDIT', true),
(6, '3-1001', 'Modal Pemilik Kafeina', 'EKUITAS', 'KREDIT', true),
(7, '4-1001', 'Pendapatan Penjualan Minuman & Makanan', 'PENDAPATAN', 'KREDIT', true),
(8, '5-1001', 'Beban Pokok Penjualan (HPP Bahan Baku)', 'BEBAN', 'DEBET', true),
(9, '6-1001', 'Beban Gaji & Upah Karyawan', 'BEBAN', 'DEBET', true),
(10, '6-1002', 'Beban Operasional, Listrik & Air', 'BEBAN', 'DEBET', true)
ON CONFLICT (id_akun) DO NOTHING;

-- ============================================================================
-- 16. SEED DATA AWAL: CONTOH PENGAJUAN PO PENDING APPROVAL FINANCE
-- ============================================================================
INSERT INTO purchase_orders (id_po, nomor_po, supplier_id, tanggal_po, status, total_estimasi, is_auto_generated, catatan) VALUES
(1, 'PO-2026-09-001', 1, CURRENT_DATE - 1, 'CONFIRMED', 1750000.00, false, 'Restock biji kopi reguler mingguan'),
(2, 'PO-2026-09-002', 2, CURRENT_DATE, 'PENDING_APPROVAL', 560000.00, true, 'Auto-PO: Safety stock Susu Segar tercapai')
ON CONFLICT (id_po) DO NOTHING;

INSERT INTO purchase_order_items (id_po_item, po_id, id_barang, jumlah_pesan, jumlah_diterima, harga_satuan_estimasi, subtotal) VALUES
(1, 1, 1, 5000.000, 0.000, 350.00, 1750000.00),
(2, 2, 2, 20000.000, 0.000, 28.00, 560000.00)
ON CONFLICT (id_po_item) DO NOTHING;

-- ============================================================================
-- 17. RE-SYNC SEQUENCE GENERATOR ID
-- ============================================================================
SELECT setval(pg_get_serial_sequence('suppliers', 'id_supplier'), COALESCE(MAX(id_supplier), 1)) FROM suppliers;
SELECT setval(pg_get_serial_sequence('master_barang', 'id_barang'), COALESCE(MAX(id_barang), 1)) FROM master_barang;
SELECT setval(pg_get_serial_sequence('purchase_orders', 'id_po'), COALESCE(MAX(id_po), 1)) FROM purchase_orders;
SELECT setval(pg_get_serial_sequence('purchase_order_items', 'id_po_item'), COALESCE(MAX(id_po_item), 1)) FROM purchase_order_items;
SELECT setval(pg_get_serial_sequence('chart_of_accounts', 'id_akun'), COALESCE(MAX(id_akun), 1)) FROM chart_of_accounts;
