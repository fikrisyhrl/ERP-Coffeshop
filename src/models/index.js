const { sequelize } = require('../config/database');
const Barang = require('./Barang');
const Supplier = require('./Supplier');
const PurchaseOrder = require('./PurchaseOrder');
const PurchaseOrderItem = require('./PurchaseOrderItem');
const GoodsReceipt = require('./GoodsReceipt');
const GoodsReceiptItem = require('./GoodsReceiptItem');
const StockMutation = require('./StockMutation');

// HCM Models
const Department = require('./Department');
const JobPosition = require('./JobPosition');
const Employee = require('./Employee');
const Attendance = require('./Attendance');
const Payroll = require('./Payroll');
const PayrollItem = require('./PayrollItem');

// Finance & Accounting Models
const ChartOfAccount = require('./ChartOfAccount');
const JournalEntry = require('./JournalEntry');
const JournalEntryLine = require('./JournalEntryLine');

// ==========================================
// DEFINISI RELASI ANTAR MODEL
// ==========================================

// --- INVENTORY & PROCUREMENT ---
Supplier.hasMany(Barang, { foreignKey: 'supplier_id', as: 'supplied_items' });
Barang.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'default_supplier' });

Supplier.hasMany(PurchaseOrder, { foreignKey: 'supplier_id', as: 'purchase_orders' });
PurchaseOrder.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });

PurchaseOrder.hasMany(PurchaseOrderItem, { foreignKey: 'po_id', as: 'items', onDelete: 'CASCADE' });
PurchaseOrderItem.belongsTo(PurchaseOrder, { foreignKey: 'po_id' });

Barang.hasMany(PurchaseOrderItem, { foreignKey: 'id_barang' });
PurchaseOrderItem.belongsTo(Barang, { foreignKey: 'id_barang', as: 'barang' });

PurchaseOrder.hasMany(GoodsReceipt, { foreignKey: 'po_id', as: 'receipts' });
GoodsReceipt.belongsTo(PurchaseOrder, { foreignKey: 'po_id', as: 'purchase_order' });

GoodsReceipt.hasMany(GoodsReceiptItem, { foreignKey: 'penerimaan_id', as: 'items', onDelete: 'CASCADE' });
GoodsReceiptItem.belongsTo(GoodsReceipt, { foreignKey: 'penerimaan_id' });

Barang.hasMany(GoodsReceiptItem, { foreignKey: 'id_barang' });
GoodsReceiptItem.belongsTo(Barang, { foreignKey: 'id_barang', as: 'barang' });

PurchaseOrderItem.hasMany(GoodsReceiptItem, { foreignKey: 'po_item_id' });
GoodsReceiptItem.belongsTo(PurchaseOrderItem, { foreignKey: 'po_item_id' });

Barang.hasMany(StockMutation, { foreignKey: 'id_barang', as: 'mutations' });
StockMutation.belongsTo(Barang, { foreignKey: 'id_barang', as: 'barang' });

// --- HCM & PAYROLL ---
Department.hasMany(JobPosition, { foreignKey: 'departemen_id', as: 'positions' });
JobPosition.belongsTo(Department, { foreignKey: 'departemen_id', as: 'departemen' });

JobPosition.hasMany(Employee, { foreignKey: 'posisi_id', as: 'employees' });
Employee.belongsTo(JobPosition, { foreignKey: 'posisi_id', as: 'posisi' });

Employee.hasMany(Attendance, { foreignKey: 'pegawai_id', as: 'attendances' });
Attendance.belongsTo(Employee, { foreignKey: 'pegawai_id', as: 'pegawai' });

Employee.hasMany(Payroll, { foreignKey: 'pegawai_id', as: 'payrolls' });
Payroll.belongsTo(Employee, { foreignKey: 'pegawai_id', as: 'pegawai' });

Payroll.hasMany(PayrollItem, { foreignKey: 'payroll_id', as: 'items', onDelete: 'CASCADE' });
PayrollItem.belongsTo(Payroll, { foreignKey: 'payroll_id' });

// --- FINANCE & ACCOUNTING ---
JournalEntry.hasMany(JournalEntryLine, { foreignKey: 'jurnal_id', as: 'lines', onDelete: 'CASCADE' });
JournalEntryLine.belongsTo(JournalEntry, { foreignKey: 'jurnal_id' });

ChartOfAccount.hasMany(JournalEntryLine, { foreignKey: 'akun_id' });
JournalEntryLine.belongsTo(ChartOfAccount, { foreignKey: 'akun_id', as: 'akun' });

const db = {
  sequelize,
  Barang,
  Supplier,
  PurchaseOrder,
  PurchaseOrderItem,
  GoodsReceipt,
  GoodsReceiptItem,
  StockMutation,
  Department,
  JobPosition,
  Employee,
  Attendance,
  Payroll,
  PayrollItem,
  ChartOfAccount,
  JournalEntry,
  JournalEntryLine
};

module.exports = db;
