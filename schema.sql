-- ============================================================================
-- DATABASE SCHEMA: ERP COFFEE SHOP
-- RDBMS: PostgreSQL (Compatible with MySQL 8+ / Standard ANSI SQL with minor tweaks)
-- Modules:
--   1. Master Data & Lookup
--   2. Finance & Accounting (CoA, Jurnal Umum, Transaksi Kas, Aset Tetap)
--   3. HCM (Karyawan, Absensi, Payroll, Penilaian Kinerja)
--   4. Inventory (Kategori, Unit, Master Bahan Baku, Lokasi, Mutasi Stok, Opname)
--   5. Procurement (Supplier, Purchase Order, Penerimaan Barang / GRN)
-- ============================================================================

-- Ekstensi UUID (opsional jika menggunakan UUID di masa depan)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. BASE / LOOKUP TABLES
-- ============================================================================

-- Departemen dalam Coffee Shop (e.g., Bar & Floor, Kitchen, Back Office, Management)
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Posisi / Jabatan (e.g., Head Barista, Junior Barista, Cashier, Store Manager)
CREATE TABLE job_positions (
    id SERIAL PRIMARY KEY,
    department_id INT NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    title VARCHAR(100) NOT NULL,
    base_salary_min DECIMAL(15, 2) DEFAULT 0.00,
    base_salary_max DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Kategori Bahan Baku / Barang (e.g., Beans, Dairy, Syrups, Bakery, Packaging)
CREATE TABLE item_categories (
    id SERIAL PRIMARY KEY,
    category_code VARCHAR(30) NOT NULL UNIQUE,
    category_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Satuan Ukuran / UoM (e.g., GR, KG, ML, L, PCS, BOX)
CREATE TABLE item_units (
    id SERIAL PRIMARY KEY,
    unit_code VARCHAR(20) NOT NULL UNIQUE,
    unit_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Lokasi Penyimpanan Fisik (e.g., Gudang Kering, Bar Station, Cold Storage)
CREATE TABLE stock_locations (
    id SERIAL PRIMARY KEY,
    location_code VARCHAR(30) NOT NULL UNIQUE,
    location_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. FINANCE & ACCOUNTING MODULE (BAGIAN 1: CoA)
-- ============================================================================

-- Chart of Accounts (Bagan Akun Standar)
CREATE TABLE chart_of_accounts (
    id SERIAL PRIMARY KEY,
    account_code VARCHAR(30) NOT NULL UNIQUE,
    account_name VARCHAR(150) NOT NULL,
    account_type VARCHAR(30) NOT NULL CHECK (account_type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
    normal_balance VARCHAR(10) NOT NULL CHECK (normal_balance IN ('DEBIT', 'CREDIT')),
    parent_id INT REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    is_reconciliation BOOLEAN DEFAULT FALSE, -- Ditandai untuk akun Kas/Bank
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_coa_code ON chart_of_accounts(account_code);
CREATE INDEX idx_coa_type ON chart_of_accounts(account_type);

-- ============================================================================
-- 3. HCM (HUMAN CAPITAL MANAGEMENT) MODULE
-- ============================================================================

-- Data Master Pegawai
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    employee_code VARCHAR(30) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    id_card_number VARCHAR(50), -- NIK KTP
    gender VARCHAR(10) CHECK (gender IN ('MALE', 'FEMALE')),
    phone VARCHAR(25),
    email VARCHAR(100) UNIQUE,
    address TEXT,
    hire_date DATE NOT NULL,
    employment_status VARCHAR(30) NOT NULL DEFAULT 'PROBATION' 
        CHECK (employment_status IN ('FULL_TIME', 'PART_TIME', 'PROBATION', 'CONTRACT', 'RESIGNED')),
    position_id INT NOT NULL REFERENCES job_positions(id) ON DELETE RESTRICT,
    base_salary DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    bank_name VARCHAR(50),
    bank_account_number VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_emp_code ON employees(employee_code);

-- Catatan Kehadiran & Shift (Absensi)
CREATE TABLE attendances (
    id BIGSERIAL PRIMARY KEY,
    employee_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    shift_name VARCHAR(50) NOT NULL, -- e.g., 'Opening (07:00 - 15:00)', 'Closing (15:00 - 23:00)'
    check_in TIMESTAMP WITH TIME ZONE,
    check_out TIMESTAMP WITH TIME ZONE,
    attendance_status VARCHAR(20) NOT NULL DEFAULT 'PRESENT'
        CHECK (attendance_status IN ('PRESENT', 'LATE', 'ABSENT', 'SICK', 'ON_LEAVE')),
    late_minutes INT DEFAULT 0,
    overtime_hours DECIMAL(4, 2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_employee_date UNIQUE (employee_id, attendance_date)
);

CREATE INDEX idx_attendance_date ON attendances(attendance_date);

-- Komponen Gaji (Master Tunjangan & Potongan)
CREATE TABLE salary_components (
    id SERIAL PRIMARY KEY,
    component_name VARCHAR(100) NOT NULL,
    component_type VARCHAR(20) NOT NULL CHECK (component_type IN ('EARNING', 'DEDUCTION')),
    is_taxable BOOLEAN DEFAULT FALSE,
    is_fixed BOOLEAN DEFAULT TRUE, -- TRUE jika nominal tetap, FALSE jika dihitung dinamis (misal: lembur/kehadiran)
    coa_account_id INT NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. FINANCE & ACCOUNTING MODULE (BAGIAN 2: JURNAL UMUM & TRANSAKSI)
-- ============================================================================

-- Header Jurnal Umum (Double-Entry General Journal)
CREATE TABLE journal_entries (
    id BIGSERIAL PRIMARY KEY,
    entry_number VARCHAR(50) NOT NULL UNIQUE, -- e.g., 'JV/2026/09/0001'
    entry_date DATE NOT NULL,
    reference_type VARCHAR(50) NOT NULL, -- 'MANUAL', 'PURCHASE_RECEIPT', 'PAYROLL', 'CASH_TX', 'DEPRECIATION', 'STOCK_ADJUSTMENT'
    reference_id BIGINT,                -- Relasi polimorfik ke ID sumber transaksi
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'POSTED', 'CANCELLED')),
    created_by INT REFERENCES employees(id) ON DELETE SET NULL,
    posted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_je_date ON journal_entries(entry_date);
CREATE INDEX idx_je_ref ON journal_entries(reference_type, reference_id);

-- Baris Debit & Credit Jurnal Umum (Double-entry Lines)
CREATE TABLE journal_entry_lines (
    id BIGSERIAL PRIMARY KEY,
    journal_entry_id BIGINT NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id INT NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    debit DECIMAL(15, 2) NOT NULL DEFAULT 0.00 CHECK (debit >= 0),
    credit DECIMAL(15, 2) NOT NULL DEFAULT 0.00 CHECK (credit >= 0),
    memo VARCHAR(255),
    CONSTRAINT chk_debit_or_credit CHECK (debit > 0 OR credit > 0)
);

CREATE INDEX idx_jel_entry ON journal_entry_lines(journal_entry_id);
CREATE INDEX idx_jel_account ON journal_entry_lines(account_id);

-- Transaksi Kas & Bank (Petty Cash / Kas Kasir Coffee Shop)
CREATE TABLE cash_transactions (
    id BIGSERIAL PRIMARY KEY,
    transaction_number VARCHAR(50) NOT NULL UNIQUE,
    account_id INT NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT, -- Akun Kas / Bank
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('CASH_IN', 'CASH_OUT', 'TRANSFER')),
    category VARCHAR(100) NOT NULL, -- e.g., 'SETORAN_PENJUALAN', 'KAS_KECIL_OPERASIONAL', 'BAYAR_SUPPLIER'
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    recipient_or_payer VARCHAR(150),
    notes TEXT,
    journal_entry_id BIGINT REFERENCES journal_entries(id) ON DELETE SET NULL,
    created_by INT REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cashtx_date ON cash_transactions(transaction_date);

-- Aset Tetap (Fixed Assets) seperti Mesin Espresso, Grinder, POS, Chiller
CREATE TABLE fixed_assets (
    id SERIAL PRIMARY KEY,
    asset_code VARCHAR(50) NOT NULL UNIQUE,
    asset_name VARCHAR(150) NOT NULL,
    acquisition_date DATE NOT NULL,
    acquisition_cost DECIMAL(15, 2) NOT NULL CHECK (acquisition_cost > 0),
    salvage_value DECIMAL(15, 2) NOT NULL DEFAULT 0.00 CHECK (salvage_value >= 0), -- Nilai residu
    useful_life_months INT NOT NULL CHECK (useful_life_months > 0), -- Umur ekonomis (bulan)
    depreciation_method VARCHAR(30) NOT NULL DEFAULT 'STRAIGHT_LINE' 
        CHECK (depreciation_method IN ('STRAIGHT_LINE', 'DOUBLE_DECLINING')),
    accumulated_depreciation DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    asset_account_id INT NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,          -- Akun Aset
    accum_deprec_account_id INT NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,   -- Akun Akumulasi Penyusutan
    deprec_expense_account_id INT NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT, -- Akun Beban Penyusutan
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISPOSED', 'WRITTEN_OFF')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Riwayat Penyusutan Aset Tetap Bulanan
CREATE TABLE fixed_asset_depreciations (
    id BIGSERIAL PRIMARY KEY,
    asset_id INT NOT NULL REFERENCES fixed_assets(id) ON DELETE CASCADE,
    period_date DATE NOT NULL, -- Bulan & tahun penyusutan
    depreciation_amount DECIMAL(15, 2) NOT NULL CHECK (depreciation_amount > 0),
    journal_entry_id BIGINT REFERENCES journal_entries(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 5. HCM (LANJUTAN: PAYROLL & PENILAIAN KINERJA)
-- ============================================================================

-- Header Penggajian Karyawan (Payroll Slip)
CREATE TABLE payrolls (
    id BIGSERIAL PRIMARY KEY,
    payroll_number VARCHAR(50) NOT NULL UNIQUE,
    employee_id INT NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    gross_earnings DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    total_deductions DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    net_salary DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (payment_status IN ('DRAFT', 'APPROVED', 'PAID')),
    journal_entry_id BIGINT REFERENCES journal_entries(id) ON DELETE SET NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payroll_emp_period ON payrolls(employee_id, period_start, period_end);

-- Rincian Komponen Gaji pada Slip Payroll
CREATE TABLE payroll_items (
    id BIGSERIAL PRIMARY KEY,
    payroll_id BIGINT NOT NULL REFERENCES payrolls(id) ON DELETE CASCADE,
    salary_component_id INT NOT NULL REFERENCES salary_components(id) ON DELETE RESTRICT,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount >= 0)
);

-- Penilaian Kinerja Karyawan (Performance Appraisal)
CREATE TABLE performance_appraisals (
    id SERIAL PRIMARY KEY,
    employee_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    reviewer_id INT NOT NULL REFERENCES employees(id) ON DELETE RESTRICT, -- Store Manager / Supervisor
    evaluation_period VARCHAR(50) NOT NULL, -- e.g., 'Q3-2026', 'Semester 1 2026'
    evaluation_date DATE NOT NULL,
    speed_and_accuracy_score DECIMAL(3, 1) CHECK (speed_and_accuracy_score BETWEEN 1.0 AND 5.0), -- Kecepatan racik
    beverage_quality_score DECIMAL(3, 1) CHECK (beverage_quality_score BETWEEN 1.0 AND 5.0),   -- Konsistensi rasa & latte art
    customer_service_score DECIMAL(3, 1) CHECK (customer_service_score BETWEEN 1.0 AND 5.0),   -- Hospitality / Senyum Salam Sapa
    discipline_score DECIMAL(3, 1) CHECK (discipline_score BETWEEN 1.0 AND 5.0),                 -- Absensi & ketepatan waktu
    cleanliness_score DECIMAL(3, 1) CHECK (cleanliness_score BETWEEN 1.0 AND 5.0),              -- Standar Bar hygiene
    final_score DECIMAL(3, 1) NOT NULL,
    feedback_notes TEXT,
    development_plan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 6. INVENTORY MODULE (BAGIAN 1: MASTER ITEM)
-- ============================================================================

-- Master Barang (Bahan Baku, Packaging, Produk Jadi)
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    item_code VARCHAR(50) NOT NULL UNIQUE,
    item_name VARCHAR(150) NOT NULL,
    category_id INT NOT NULL REFERENCES item_categories(id) ON DELETE RESTRICT,
    unit_id INT NOT NULL REFERENCES item_units(id) ON DELETE RESTRICT,
    item_type VARCHAR(30) NOT NULL CHECK (item_type IN ('RAW_MATERIAL', 'PACKAGING', 'FINISHED_GOOD', 'SEMI_FINISHED')),
    cost_price DECIMAL(15, 2) NOT NULL DEFAULT 0.00, -- Harga pokok rata-rata (Moving Average Cost)
    selling_price DECIMAL(15, 2) DEFAULT 0.00,      -- Jika dijual langsung (retail bean, merchandise, bottled drinks)
    
    -- Parameter Safety Stock & Reorder
    safety_stock_level DECIMAL(12, 3) NOT NULL DEFAULT 0.000 CHECK (safety_stock_level >= 0),
    reorder_point DECIMAL(12, 3) NOT NULL DEFAULT 0.000 CHECK (reorder_point >= 0),
    maximum_stock_level DECIMAL(12, 3) DEFAULT NULL,
    
    -- Akun Akuntansi untuk Integrasi Otomatis
    inventory_account_id INT NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT, -- Akun Persediaan
    cogs_account_id INT NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,      -- Akun HPP (Beban Pokok Penjualan)
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_item_code ON items(item_code);
CREATE INDEX idx_item_category ON items(category_id);

-- ============================================================================
-- 7. PROCUREMENT MODULE
-- ============================================================================

-- Data Master Supplier / Vendor (Roastery, Distributor Susu, Sirup, Cup)
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    supplier_code VARCHAR(50) NOT NULL UNIQUE,
    supplier_name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(25),
    email VARCHAR(100),
    address TEXT,
    payment_terms_days INT NOT NULL DEFAULT 0, -- 0 = Cash/COD, 7, 14, 30 hari tempo
    payable_account_id INT NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT, -- Default: Hutang Dagang
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Purchase Order (PO Header)
CREATE TABLE purchase_orders (
    id BIGSERIAL PRIMARY KEY,
    po_number VARCHAR(50) NOT NULL UNIQUE, -- e.g., 'PO/2026/09/0001'
    supplier_id INT NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT' 
        CHECK (status IN ('DRAFT', 'CONFIRMED', 'PARTIALLY_RECEIVED', 'COMPLETED', 'CANCELLED')),
    subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_by INT REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_po_number ON purchase_orders(po_number);
CREATE INDEX idx_po_supplier ON purchase_orders(supplier_id);

-- Purchase Order Items (Detail Barang yang dipesan)
CREATE TABLE purchase_order_items (
    id BIGSERIAL PRIMARY KEY,
    purchase_order_id BIGINT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    item_id INT NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
    ordered_quantity DECIMAL(12, 3) NOT NULL CHECK (ordered_quantity > 0),
    received_quantity DECIMAL(12, 3) NOT NULL DEFAULT 0.000 CHECK (received_quantity >= 0),
    unit_price DECIMAL(15, 2) NOT NULL CHECK (unit_price >= 0),
    subtotal DECIMAL(15, 2) NOT NULL CHECK (subtotal >= 0)
);

CREATE INDEX idx_poi_po ON purchase_order_items(purchase_order_id);

-- Penerimaan Barang (Goods Receipt Note / Surat Penerimaan)
CREATE TABLE goods_receipts (
    id BIGSERIAL PRIMARY KEY,
    receipt_number VARCHAR(50) NOT NULL UNIQUE, -- e.g., 'GRN/2026/09/0001'
    purchase_order_id BIGINT NOT NULL REFERENCES purchase_orders(id) ON DELETE RESTRICT,
    delivery_note_number VARCHAR(100), -- No Surat Jalan Vendor
    receipt_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    received_by INT NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('DRAFT', 'SUBMITTED', 'CANCELLED')),
    journal_entry_id BIGINT REFERENCES journal_entries(id) ON DELETE SET NULL, -- Jurnal otomatis pengakuan persediaan & hutang
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_grn_po ON goods_receipts(purchase_order_id);

-- Detail Penerimaan Barang Fisik
CREATE TABLE goods_receipt_items (
    id BIGSERIAL PRIMARY KEY,
    goods_receipt_id BIGINT NOT NULL REFERENCES goods_receipts(id) ON DELETE CASCADE,
    po_item_id BIGINT NOT NULL REFERENCES purchase_order_items(id) ON DELETE RESTRICT,
    item_id INT NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
    quantity_received DECIMAL(12, 3) NOT NULL CHECK (quantity_received > 0),
    unit_cost DECIMAL(15, 2) NOT NULL CHECK (unit_cost >= 0),
    batch_number VARCHAR(50),
    expiry_date DATE, -- Sangat krusial untuk Fresh Milk, whipping cream, biji kopi roast date
    notes TEXT
);

-- ============================================================================
-- 8. INVENTORY MODULE (BAGIAN 2: MUTASI STOK & OPNAME)
-- ============================================================================

-- Buku Besar Stok / Mutasi Stok (Stock Ledger)
CREATE TABLE stock_mutations (
    id BIGSERIAL PRIMARY KEY,
    mutation_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    item_id INT NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
    location_id INT NOT NULL REFERENCES stock_locations(id) ON DELETE RESTRICT,
    mutation_type VARCHAR(30) NOT NULL CHECK (mutation_type IN (
        'IN_PROCUREMENT',      -- Masuk dari Penerimaan Barang (GRN)
        'IN_ADJUSTMENT',       -- Masuk dari Penyesuaian Opname
        'OUT_SALES_POS',       -- Keluar dari Penjualan POS (Resep/Bahan Terpakai)
        'OUT_WASTE_SPOILAGE',  -- Keluar karena basi/rusak (misal susu basi, kalibrasi espresso terbuang)
        'OUT_ADJUSTMENT',      -- Keluar dari Penyesuaian Opname
        'TRANSFER_IN',         -- Masuk dari mutasi antar gudang/bar
        'TRANSFER_OUT'         -- Keluar dari mutasi antar gudang/bar
    )),
    in_quantity DECIMAL(12, 3) NOT NULL DEFAULT 0.000 CHECK (in_quantity >= 0),
    out_quantity DECIMAL(12, 3) NOT NULL DEFAULT 0.000 CHECK (out_quantity >= 0),
    balance_quantity DECIMAL(12, 3) NOT NULL, -- Saldo fisik terkini di lokasi setelah mutasi
    unit_cost DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    reference_type VARCHAR(50), -- e.g., 'GOODS_RECEIPT', 'POS_SALE', 'STOCK_OPNAME', 'WASTE_LOG'
    reference_id BIGINT,        -- ID dokumen asal
    journal_entry_id BIGINT REFERENCES journal_entries(id) ON DELETE SET NULL, -- Jurnal finansial terkait jika timbul HPP/Beban Waste
    created_by INT REFERENCES employees(id) ON DELETE SET NULL,
    notes TEXT,
    CONSTRAINT chk_qty_mutation CHECK (in_quantity > 0 OR out_quantity > 0)
);

CREATE INDEX idx_sm_item_loc ON stock_mutations(item_id, location_id);
CREATE INDEX idx_sm_date ON stock_mutations(mutation_date);
CREATE INDEX idx_sm_ref ON stock_mutations(reference_type, reference_id);

-- Stock Opname Fisik (Audit Berkala Bulanan/Mingguan)
CREATE TABLE stock_opnames (
    id BIGSERIAL PRIMARY KEY,
    opname_number VARCHAR(50) NOT NULL UNIQUE,
    location_id INT NOT NULL REFERENCES stock_locations(id) ON DELETE RESTRICT,
    opname_date DATE NOT NULL,
    conducted_by INT NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('DRAFT', 'COMPLETED', 'CANCELLED')),
    journal_entry_id BIGINT REFERENCES journal_entries(id) ON DELETE SET NULL, -- Jurnal selisih inventaris
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Rincian Hasil Perhitungan Fisik vs Sistem
CREATE TABLE stock_opname_items (
    id BIGSERIAL PRIMARY KEY,
    stock_opname_id BIGINT NOT NULL REFERENCES stock_opnames(id) ON DELETE CASCADE,
    item_id INT NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
    system_qty DECIMAL(12, 3) NOT NULL,
    physical_qty DECIMAL(12, 3) NOT NULL,
    difference_qty DECIMAL(12, 3) NOT NULL, -- physical_qty - system_qty
    unit_cost DECIMAL(15, 2) NOT NULL,
    difference_value DECIMAL(15, 2) NOT NULL, -- difference_qty * unit_cost
    reason TEXT
);

-- ============================================================================
-- 9. HELPER VIEWS UNTUK OPERASIONAL COFFEE SHOP
-- ============================================================================

-- View: Monitoring Bahan Baku di Bawah Batas Safety Stock (Alert Reorder)
CREATE OR REPLACE VIEW view_low_stock_alert AS
SELECT 
    i.id AS item_id,
    i.item_code,
    i.item_name,
    c.category_name,
    u.unit_code,
    COALESCE(SUM(sm.in_quantity - sm.out_quantity), 0) AS current_stock,
    i.safety_stock_level,
    i.reorder_point,
    CASE 
        WHEN COALESCE(SUM(sm.in_quantity - sm.out_quantity), 0) <= i.safety_stock_level THEN 'CRITICAL'
        WHEN COALESCE(SUM(sm.in_quantity - sm.out_quantity), 0) <= i.reorder_point THEN 'REORDER_NEEDED'
        ELSE 'SAFE'
    END AS stock_status
FROM items i
JOIN item_categories c ON i.category_id = c.id
JOIN item_units u ON i.unit_id = u.id
LEFT JOIN stock_mutations sm ON i.id = sm.item_id
WHERE i.is_active = TRUE
GROUP BY i.id, i.item_code, i.item_name, c.category_name, u.unit_code, i.safety_stock_level, i.reorder_point;

-- View: Neraca Saldo / Trial Balance Akuntansi
CREATE OR REPLACE VIEW view_trial_balance AS
SELECT 
    coa.id AS account_id,
    coa.account_code,
    coa.account_name,
    coa.account_type,
    coa.normal_balance,
    COALESCE(SUM(jel.debit), 0.00) AS total_debit,
    COALESCE(SUM(jel.credit), 0.00) AS total_credit,
    CASE 
        WHEN coa.normal_balance = 'DEBIT' THEN COALESCE(SUM(jel.debit - jel.credit), 0.00)
        ELSE COALESCE(SUM(jel.credit - jel.debit), 0.00)
    END AS ending_balance
FROM chart_of_accounts coa
LEFT JOIN journal_entry_lines jel ON coa.id = jel.account_id
LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id AND je.status = 'POSTED'
GROUP BY coa.id, coa.account_code, coa.account_name, coa.account_type, coa.normal_balance;
