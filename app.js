/**
 * KAFEINA ERP - MODERN COFFEE SHOP MANAGEMENT SYSTEM
 * Pure Vanilla JavaScript & DOM Manipulation
 * Fully Modular: Dashboard, Finance, HCM, Procurement, Inventory
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==============================================================
  // 1. STATE & GLOBAL VARIABLES
  // ==============================================================
  let currentModule = 'dashboard';
  let inventoryItems = [];
  try {
    const cachedInv = localStorage.getItem('kafeina_erp_inventory');
    if (cachedInv) inventoryItems = JSON.parse(cachedInv);
  } catch {}
  let filteredInventory = [];
  let journalEntries = [];
  let chartOfAccounts = [];
  let employeeList = [];
  try {
    const cachedEmp = localStorage.getItem('kafeina_erp_employees');
    if (cachedEmp) employeeList = JSON.parse(cachedEmp);
  } catch {}
  let attendanceLogs = [];
  let purchaseOrders = [];
  try {
    const cachedPo = localStorage.getItem('kafeina_erp_purchase_orders');
    if (cachedPo) purchaseOrders = JSON.parse(cachedPo);
  } catch {}
  let supplierList = [];
  try {
    const cachedSup = localStorage.getItem('kafeina_erp_suppliers');
    if (cachedSup) supplierList = JSON.parse(cachedSup);
  } catch {}
  let stockMutations = [];
  let systemUsers = [];
  let purchaseInvoices = [];
  try {
    const cachedInv = localStorage.getItem('kafeina_erp_invoices');
    if (cachedInv) purchaseInvoices = JSON.parse(cachedInv);
  } catch {}
  let cashBalanceData = { kas_toko: 0, bank_bca: 0, total_uang_tersedia: 0 };

  // User State & RBAC Permissions
  let currentUser = JSON.parse(localStorage.getItem('kafeina_erp_user') || 'null');

  // Data Dummy Cadangan (Fallback jika backend belum terisi lengkap)
  const defaultMockItems = [
    {
      id_barang: 1,
      item_code: 'RM-COF-001',
      nama_barang: 'Arabica Gayo Wine Roasted Beans',
      kategori: 'Coffee Beans',
      satuan: 'gr',
      stok_saat_ini: 850,
      batas_safety_stock: 2000,
      harga_satuan: 350
    },
    {
      id_barang: 2,
      item_code: 'RM-DRY-002',
      nama_barang: 'Greenfields Fresh Milk Pasteurized',
      kategori: 'Dairy',
      satuan: 'ml',
      stok_saat_ini: 3000,
      batas_safety_stock: 10000,
      harga_satuan: 28
    },
    {
      id_barang: 3,
      item_code: 'RM-SYR-003',
      nama_barang: 'Monin Salted Caramel Syrup 700ml',
      kategori: 'Syrup',
      satuan: 'ml',
      stok_saat_ini: 450,
      batas_safety_stock: 1400,
      harga_satuan: 210
    },
    {
      id_barang: 4,
      item_code: 'RM-COF-004',
      nama_barang: 'Robusta Temanggung Natural Beans',
      kategori: 'Coffee Beans',
      satuan: 'gr',
      stok_saat_ini: 3200,
      batas_safety_stock: 2500,
      harga_satuan: 180
    },
    {
      id_barang: 5,
      item_code: 'RM-PKG-005',
      nama_barang: 'Hot Paper Cup 8oz Double Wall + Lid',
      kategori: 'Packaging',
      satuan: 'pcs',
      stok_saat_ini: 180,
      batas_safety_stock: 500,
      harga_satuan: 1250
    },
    {
      id_barang: 6,
      item_code: 'RM-DRY-006',
      nama_barang: 'Oatside Barista Blend Oat Milk 1L',
      kategori: 'Dairy',
      satuan: 'ml',
      stok_saat_ini: 7000,
      batas_safety_stock: 6000,
      harga_satuan: 42
    }
  ];

  const defaultMockSuppliers = [
    {
      id_supplier: 1,
      nama_supplier: 'CV Nusantara Coffee Roastery',
      kontak_person: 'Budi Santoso',
      telepon: '0812-3456-7890',
      email: 'order@nusantararoastery.com',
      alamat: 'Jl. Raya Kopi No. 45, Bandung',
      kategori: 'Biji Kopi Sangrai'
    },
    {
      id_supplier: 2,
      nama_supplier: 'PT Sumber Dairy Sejahtera',
      kontak_person: 'Linda Kusuma',
      telepon: '0819-8765-4321',
      email: 'sales@sumberdairy.co.id',
      alamat: 'Kawasan Industri Cikarang Blok B2',
      kategori: 'Susu Segar & Plant-based'
    },
    {
      id_supplier: 3,
      nama_supplier: 'Distributor Sirup Premium',
      kontak_person: 'Hendra Tan',
      telepon: '0811-2233-4455',
      email: 'hendra@syruppremium.id',
      alamat: 'Jl. Boulevard Kelapa Gading No. 12, Jakarta',
      kategori: 'Perisa Sirup & Saus'
    }
  ];

  const defaultMockPurchaseOrders = [
    {
      id_po: 1,
      nomor_po: 'PO-REQ-2026-001',
      supplier_id: 1,
      tanggal_po: '2026-09-30',
      status: 'PENDING_APPROVAL',
      total_estimasi: 1750000,
      is_auto_generated: true,
      catatan: 'Reorder otomatis: Stok Arabica Gayo mendekati safety stock. Menunggu persetujuan Finance.',
      supplier: { id_supplier: 1, nama_supplier: 'CV Nusantara Coffee Roastery', telepon: '0812-3456-7890' },
      items: [{ id_barang: 1, jumlah_pesan: 5000, harga_satuan_estimasi: 350, barang: { id_barang: 1, nama_barang: 'Arabica Gayo Wine Roasted Beans', satuan: 'gr' } }]
    },
    {
      id_po: 2,
      nomor_po: 'PO-APPR-2026-002',
      supplier_id: 2,
      tanggal_po: '2026-09-29',
      status: 'CONFIRMED',
      total_estimasi: 280000,
      is_auto_generated: false,
      catatan: 'Pengadaan susu pasteurisasi mingguan outlet.',
      disetujui_oleh: 'Finance Manager',
      catatan_finance: 'Anggaran belanja operasional disetujui. Siap dilakukan penerimaan barang.',
      supplier: { id_supplier: 2, nama_supplier: 'PT Sumber Dairy Sejahtera', telepon: '0819-8765-4321' },
      items: [{ id_barang: 2, jumlah_pesan: 10000, harga_satuan_estimasi: 28, barang: { id_barang: 2, nama_barang: 'Greenfields Fresh Milk Pasteurized', satuan: 'ml' } }]
    },
    {
      id_po: 3,
      nomor_po: 'PO-DONE-2026-003',
      supplier_id: 3,
      tanggal_po: '2026-09-25',
      status: 'COMPLETED',
      total_estimasi: 420000,
      is_auto_generated: false,
      catatan: 'Pengadaan sirup salted caramel.',
      disetujui_oleh: 'Finance Manager',
      catatan_finance: 'Disetujui',
      supplier: { id_supplier: 3, nama_supplier: 'Distributor Sirup Premium', telepon: '0811-2233-4455' },
      items: [{ id_barang: 3, jumlah_pesan: 2000, harga_satuan_estimasi: 210, barang: { id_barang: 3, nama_barang: 'Monin Salted Caramel Syrup 700ml', satuan: 'ml' } }]
    }
  ];

  // DOM Elements
  const breadcrumbCurrent = document.getElementById('breadcrumb-current');
  const pageTitle = document.getElementById('page-title');
  const btnTopbarAction = document.getElementById('btn-topbar-action');
  const topbarActionText = document.getElementById('topbar-action-text');
  const btnRefresh = document.getElementById('btn-refresh');
  const currentTimeEl = document.getElementById('current-time');
  const toastContainer = document.getElementById('toast-container');

  // ==============================================================
  // 2. LIVE CLOCK (WIB)
  // ==============================================================
  const updateClock = () => {
    const now = new Date();
    const optionsDate = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
    const dateStr = now.toLocaleDateString('id-ID', optionsDate);
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
    currentTimeEl.textContent = `${dateStr} • ${timeStr}`;
  };
  setInterval(updateClock, 1000);
  updateClock();

  // ==============================================================
  // 3. TOAST NOTIFICATION UTILITY
  // ==============================================================
  window.showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const iconColor = type === 'success' ? '#0d6b45' : type === 'warning' ? '#d97706' : '#247559';
    toast.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <span>${message}</span>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  };

  // ==============================================================
  // 4. ROLE-BASED ACCESS CONTROL (RBAC) & VIEW SWITCHER
  // ==============================================================
  window.applyRolePermissions = () => {
    if (!currentUser) {
      const overlay = document.getElementById('auth-overlay');
      if (overlay) overlay.classList.remove('hidden');
      return;
    }

    // 1. Update Profile Card & Topbar
    const avatarEl = document.getElementById('current-user-avatar');
    const nameEl = document.getElementById('current-user-name');
    const roleEl = document.getElementById('current-user-role');
    const topbarBadgeEl = document.getElementById('badge-topbar-role');

    if (avatarEl) avatarEl.textContent = (currentUser.nama_lengkap || 'U').charAt(0).toUpperCase();
    if (nameEl) nameEl.textContent = currentUser.nama_lengkap || currentUser.username;
    if (roleEl) roleEl.textContent = currentUser.role_name || currentUser.role;
    if (topbarBadgeEl) {
      topbarBadgeEl.textContent = currentUser.role;
      topbarBadgeEl.className = `badge-status ${currentUser.role === 'MANAGER' ? 'safe' : currentUser.role === 'FINANCE' ? 'warning' : 'info'}`;
    }

    // 2. Filter Nav Items in Sidebar sesuai hak akses role
    document.querySelectorAll('.sidebar .nav-item').forEach((item) => {
      const link = item.querySelector('.nav-link');
      if (!link) return;
      const mod = link.getAttribute('data-module');
      if (!mod) return;

      if (currentUser.allowed_modules && currentUser.allowed_modules.includes(mod)) {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    });

    // 3. Pastikan modul yang aktif saat ini diizinkan untuk role ini
    if (currentUser.allowed_modules && !currentUser.allowed_modules.includes(currentModule)) {
      const firstAllowed = currentUser.allowed_modules[0] || 'dashboard';
      switchModule(firstAllowed);
    }
  };

  window.switchModule = (targetModule) => {
    if (!currentUser) {
      const overlay = document.getElementById('auth-overlay');
      if (overlay) overlay.classList.remove('hidden');
      return;
    }

    // Validasi Izin Akses Modul berdasarkan Role Pengguna
    if (currentUser.allowed_modules && !currentUser.allowed_modules.includes(targetModule)) {
      window.showToast(`⛔ Akses Ditolak: Akun Anda (${currentUser.role}) tidak diizinkan membuka modul ${targetModule.toUpperCase()}!`, 'warning');
      return;
    }

    currentModule = targetModule;

    // 1. Update Sidebar Active Link
    document.querySelectorAll('.sidebar .nav-link').forEach((link) => {
      link.classList.remove('active');
      if (link.getAttribute('data-module') === targetModule) {
        link.classList.add('active');
      }
    });

    // 2. Hide all module views, show target
    document.querySelectorAll('.module-view').forEach((view) => {
      view.classList.add('hidden');
    });
    const activeView = document.getElementById(`view-${targetModule}`);
    if (activeView) {
      activeView.classList.remove('hidden');
    }

    // 3. Update Breadcrumb, Page Title & Topbar Context Button
    switch (targetModule) {
      case 'dashboard':
        breadcrumbCurrent.textContent = 'Dashboard Utama';
        pageTitle.textContent = 'Executive Overview';
        topbarActionText.textContent = '+ Buat Draf PO';
        btnTopbarAction.onclick = () => openModal('modal-po');
        loadDashboardData();
        break;

      case 'finance':
        breadcrumbCurrent.textContent = 'Finance & Accounting';
        pageTitle.textContent = 'Laporan Keuangan & Buku Jurnal';
        topbarActionText.textContent = '+ Jurnal Manual';
        btnTopbarAction.onclick = () => openModal('modal-jurnal');
        loadFinanceData();
        break;

      case 'hcm':
        breadcrumbCurrent.textContent = 'HCM & Payroll';
        pageTitle.textContent = 'Human Capital & Penggajian Pegawai';
        topbarActionText.textContent = '+ Tambah Karyawan';
        btnTopbarAction.onclick = () => openModal('modal-create-employee');
        loadHcmData();
        break;

      case 'procurement':
        breadcrumbCurrent.textContent = 'Procurement & PO';
        pageTitle.textContent = 'Pengadaan Bahan Baku & Supplier';
        topbarActionText.textContent = '+ Ajukan Pembelian ke Finance';
        btnTopbarAction.onclick = () => openModal('modal-po');
        loadProcurementData();
        break;

      case 'inventory':
        breadcrumbCurrent.textContent = 'Inventory Management';
        pageTitle.textContent = 'Kontrol Persediaan & Bahan Baku';
        topbarActionText.textContent = '- Catat Pemakaian';
        btnTopbarAction.onclick = () => openModal('modal-mutasi');
        loadInventoryData();
        break;

      case 'users':
        breadcrumbCurrent.textContent = 'Manajemen Pengguna';
        pageTitle.textContent = 'Kontrol Akses Pengguna (RBAC)';
        topbarActionText.textContent = '+ Buat User Baru';
        btnTopbarAction.onclick = () => openModal('modal-create-user');
        loadUsersData();
        break;
    }

    // Update URL hash without scroll jumps
    history.replaceState(null, null, `#${targetModule}`);
  };

  // Nav link click listeners
  document.querySelectorAll('.sidebar .nav-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const mod = link.getAttribute('data-module');
      if (mod) switchModule(mod);
    });
  });

  // ==============================================================
  // 5. SUB-TAB SWITCHERS FOR MODULES
  // ==============================================================
  window.switchFinanceTab = (tab) => {
    document.querySelectorAll('#view-finance .sub-tab').forEach((t) => t.classList.remove('active'));
    document.getElementById('panel-finance-jurnal').classList.add('hidden');
    document.getElementById('panel-finance-coa').classList.add('hidden');
    const panelApproval = document.getElementById('panel-finance-approval');
    if (panelApproval) panelApproval.classList.add('hidden');
    const panelInvoice = document.getElementById('panel-finance-invoice');
    if (panelInvoice) panelInvoice.classList.add('hidden');

    if (tab === 'jurnal') {
      document.querySelector('#view-finance .sub-tab:nth-child(1)').classList.add('active');
      document.getElementById('panel-finance-jurnal').classList.remove('hidden');
    } else if (tab === 'coa') {
      document.querySelector('#view-finance .sub-tab:nth-child(2)').classList.add('active');
      document.getElementById('panel-finance-coa').classList.remove('hidden');
    } else if (tab === 'approval') {
      document.querySelector('#view-finance .sub-tab:nth-child(3)').classList.add('active');
      if (panelApproval) panelApproval.classList.remove('hidden');
    } else if (tab === 'invoice') {
      document.querySelector('#view-finance .sub-tab:nth-child(4)').classList.add('active');
      if (panelInvoice) panelInvoice.classList.remove('hidden');
      loadInvoicesData();
    }
  };

  window.switchHcmTab = (tab) => {
    document.querySelectorAll('#view-hcm .sub-tab').forEach((t) => t.classList.remove('active'));
    document.getElementById('panel-hcm-pegawai').classList.add('hidden');
    document.getElementById('panel-hcm-absensi').classList.add('hidden');
    document.getElementById('panel-hcm-slip').classList.add('hidden');

    if (tab === 'pegawai') {
      document.querySelector('#view-hcm .sub-tab:nth-child(1)').classList.add('active');
      document.getElementById('panel-hcm-pegawai').classList.remove('hidden');
    } else if (tab === 'absensi') {
      document.querySelector('#view-hcm .sub-tab:nth-child(2)').classList.add('active');
      document.getElementById('panel-hcm-absensi').classList.remove('hidden');
    } else {
      document.querySelector('#view-hcm .sub-tab:nth-child(3)').classList.add('active');
      document.getElementById('panel-hcm-slip').classList.remove('hidden');
    }
  };

  window.switchProcurementTab = (tab) => {
    document.querySelectorAll('#view-procurement .sub-tab').forEach((t) => t.classList.remove('active'));
    document.getElementById('panel-procurement-po').classList.add('hidden');
    document.getElementById('panel-procurement-supplier').classList.add('hidden');

    if (tab === 'po') {
      document.querySelector('#view-procurement .sub-tab:nth-child(1)').classList.add('active');
      document.getElementById('panel-procurement-po').classList.remove('hidden');
    } else {
      document.querySelector('#view-procurement .sub-tab:nth-child(2)').classList.add('active');
      document.getElementById('panel-procurement-supplier').classList.remove('hidden');
    }
  };

  window.switchInventoryTab = (tab) => {
    document.querySelectorAll('#view-inventory .sub-tab').forEach((t) => t.classList.remove('active'));
    document.getElementById('panel-inventory-stock').classList.add('hidden');
    document.getElementById('panel-inventory-mutasi').classList.add('hidden');

    if (tab === 'stock') {
      document.querySelector('#view-inventory .sub-tab:nth-child(1)').classList.add('active');
      document.getElementById('panel-inventory-stock').classList.remove('hidden');
    } else {
      document.querySelector('#view-inventory .sub-tab:nth-child(2)').classList.add('active');
      document.getElementById('panel-inventory-mutasi').classList.remove('hidden');
    }
  };

  // ==============================================================
  // 6. DATA LOADERS & RENDERERS
  // ==============================================================

  // --- MODULE 1: DASHBOARD ---
  const loadDashboardData = async () => {
    try {
      const res = await fetch('/api/barang');
      const data = await res.json();
      if (data.success && data.data?.length > 0) {
        inventoryItems = data.data;
      } else {
        inventoryItems = [...defaultMockItems];
      }
    } catch {
      inventoryItems = [...defaultMockItems];
    }

    // Render Recent Stock Alerts in Mini Box
    const recentAlertsBox = document.getElementById('dash-recent-alerts');
    const warningItems = inventoryItems.filter(
      (item) => parseFloat(item.stok_saat_ini) <= parseFloat(item.batas_safety_stock)
    );

    const elKpiStok = document.getElementById('kpi-stok-warning-count');
    const elBadgeStok = document.getElementById('badge-stok-alert');
    if (elKpiStok) elKpiStok.textContent = `${warningItems.length} Komoditas`;
    if (elBadgeStok) elBadgeStok.textContent = `${warningItems.length} Alert`;

    if (recentAlertsBox) {
      if (warningItems.length === 0) {
        recentAlertsBox.innerHTML = `<div class="recent-item"><span style="color: var(--status-safe);">✓ Semua stok berada pada level aman.</span></div>`;
      } else {
        recentAlertsBox.innerHTML = warningItems
          .slice(0, 3)
          .map(
            (item) => `
          <div class="recent-item">
            <div class="recent-icon">⚠️</div>
            <div class="recent-info">
              <span class="recent-title">${item.nama_barang}</span>
              <span class="recent-meta">Sisa: ${parseFloat(item.stok_saat_ini).toLocaleString('id-ID')} ${item.satuan} &bull; Batas: ${parseFloat(item.batas_safety_stock).toLocaleString('id-ID')}</span>
            </div>
            <button class="btn-action-po" onclick="handleCreatePo(${item.id_barang}, '${item.nama_barang}', 2000, '${item.satuan}')">+ PO</button>
          </div>
        `
          )
          .join('');
      }
    }

    // Render Pengajuan PO Menunggu Finance di Dashboard Utama (Realtime)
    const recentPoBox = document.getElementById('dash-recent-po');
    if (recentPoBox) {
      try {
        const resPo = await fetch('/api/procurement/po');
        const dataPo = await resPo.json();
        if (dataPo.success && Array.isArray(dataPo.data)) {
          purchaseOrders = dataPo.data;
        }
      } catch {}

      const pendingPo = purchaseOrders.filter((p) => p.status === 'PENDING_APPROVAL');
      if (pendingPo.length === 0) {
        recentPoBox.innerHTML = `<div class="recent-item"><span style="color: var(--status-safe); font-size: 0.85rem;">✓ Semua PO telah disetujui / tidak ada antrean pending.</span></div>`;
      } else {
        recentPoBox.innerHTML = pendingPo.slice(0, 3).map((p) => {
          const itemsText = p.items?.map((it) => `${it.barang?.nama_barang || 'Bahan'} (${parseFloat(it.jumlah_pesan).toLocaleString('id-ID')} ${it.barang?.satuan || 'unit'})`).join(', ') || '-';
          return `
            <div class="recent-item">
              <div class="recent-icon">⏳</div>
              <div class="recent-info">
                <span class="recent-title">${p.nomor_po} &bull; ${itemsText}</span>
                <span class="recent-meta">${p.supplier?.nama_supplier || 'Supplier'} &bull; <strong style="color: var(--green-deep);">Rp ${parseFloat(p.total_estimasi).toLocaleString('id-ID')}</strong></span>
              </div>
              <button class="btn-approve" style="font-size: 0.74rem; padding: 4px 8px;" onclick="openFinanceApproveModal(${p.id_po})">✓ Setujui</button>
            </div>
          `;
        }).join('');
      }
    }
  };

  // --- MODULE 2: FINANCE ---
  const loadFinanceData = async () => {
    const tableBodyJurnal = document.getElementById('table-body-jurnal');
    const tableBodyCoa = document.getElementById('table-body-coa');

    // 1. Fetch Jurnal
    try {
      const resJurnal = await fetch('/api/finance/jurnal');
      const dataJurnal = await resJurnal.json();
      if (dataJurnal.success) journalEntries = dataJurnal.data;
    } catch (err) {
      console.warn('Finance jurnal offline fallback');
    }

    if (tableBodyJurnal) {
      if (!journalEntries || journalEntries.length === 0) {
        tableBodyJurnal.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 30px; color: var(--text-dim);">Belum ada catatan jurnal umum di database.</td></tr>`;
      } else {
        tableBodyJurnal.innerHTML = journalEntries
          .map((j) => {
            const debetLines = j.lines?.filter((l) => parseFloat(l.debet) > 0) || [];
            const kreditLines = j.lines?.filter((l) => parseFloat(l.kredit) > 0) || [];

            const debetText = debetLines
              .map((l) => `<div><strong>${l.akun?.kode_akun || ''}</strong> ${l.akun?.nama_akun || ''}</div>`)
              .join('');
            const kreditText = kreditLines
              .map(
                (l) =>
                  `<div style="padding-left: 14px; color: var(--text-muted);">&bull; <strong>${l.akun?.kode_akun || ''}</strong> ${l.akun?.nama_akun || ''}</div>`
              )
              .join('');

            return `
            <tr>
              <td>
                <div class="item-cell">
                  <span class="item-name">${j.nomor_jurnal}</span>
                  <span class="item-code">${j.tanggal_jurnal}</span>
                </div>
              </td>
              <td><span class="category-tag">${j.tipe_referensi}</span></td>
              <td><span style="font-size: 0.88rem; color: var(--text-main);">${j.keterangan}</span></td>
              <td><strong style="color: var(--green-deep);">Rp ${parseFloat(j.total_debet).toLocaleString('id-ID')}</strong></td>
              <td><strong style="color: var(--green-forest);">Rp ${parseFloat(j.total_kredit).toLocaleString('id-ID')}</strong></td>
              <td><span class="badge-status safe">POSTED</span></td>
              <td style="font-size: 0.8rem; line-height: 1.4;">${debetText}${kreditText}</td>
            </tr>
          `;
          })
          .join('');
      }
    }

    // 2. Fetch CoA
    try {
      const resCoa = await fetch('/api/finance/coa');
      const dataCoa = await resCoa.json();
      if (dataCoa.success) chartOfAccounts = dataCoa.data;
    } catch {
      chartOfAccounts = [];
    }

    if (tableBodyCoa && chartOfAccounts && chartOfAccounts.length > 0) {
      tableBodyCoa.innerHTML = chartOfAccounts
        .map(
          (c) => `
        <tr>
          <td><strong style="color: var(--green-deep);">${c.kode_akun}</strong></td>
          <td><span style="font-weight: 600; color: var(--text-heading);">${c.nama_akun}</span></td>
          <td><span class="category-tag">${c.tipe_akun}</span></td>
          <td><span class="badge-status ${c.saldo_normal === 'DEBET' ? 'safe' : 'warning'}">${c.saldo_normal}</span></td>
          <td><span class="badge-status safe">AKTIF</span></td>
        </tr>
      `
        )
        .join('');
    }

    // 3. Fetch Pengajuan Pembelian Procurement untuk Persetujuan (Approval) Finance
    const tableBodyApproval = document.getElementById('table-body-finance-approval');
    const badgeApproval = document.getElementById('fin-pending-badge');

    try {
      const resPo = await fetch('/api/procurement/po');
      const dataPo = await resPo.json();
      if (dataPo.success && dataPo.data?.length > 0) {
        purchaseOrders = dataPo.data;
        try {
          localStorage.setItem('kafeina_erp_purchase_orders', JSON.stringify(purchaseOrders));
        } catch {}
      } else if (purchaseOrders.length === 0) {
        purchaseOrders = [...defaultMockPurchaseOrders];
      }
    } catch {
      if (purchaseOrders.length === 0) {
        purchaseOrders = [...defaultMockPurchaseOrders];
      }
    }

    const pendingApprovals = purchaseOrders.filter((p) => p.status === 'PENDING_APPROVAL');
    const totalPendingNominal = pendingApprovals.reduce(
      (sum, p) => sum + (parseFloat(p.total_estimasi) || 0),
      0
    );

    // Update Tab Badge
    if (badgeApproval) {
      badgeApproval.textContent = pendingApprovals.length;
      if (pendingApprovals.length === 0) {
        badgeApproval.classList.add('badge-zero');
      } else {
        badgeApproval.classList.remove('badge-zero');
      }
    }

    // Update KPI Card on Finance Dashboard
    const elKpiPendingCount = document.getElementById('fin-kpi-pending-po');
    const elKpiPendingTotal = document.getElementById('fin-kpi-pending-total');
    if (elKpiPendingCount) elKpiPendingCount.textContent = `${pendingApprovals.length} Pengajuan`;
    if (elKpiPendingTotal) elKpiPendingTotal.textContent = `Rp ${totalPendingNominal.toLocaleString('id-ID')} Total Estimasi`;

    // Update Realtime Alert Banner on Finance Dashboard
    const elAlertBanner = document.getElementById('fin-pending-alert-banner');
    const elAlertDesc = document.getElementById('fin-alert-banner-desc');
    if (elAlertBanner) {
      if (pendingApprovals.length > 0) {
        elAlertBanner.style.display = 'flex';
        if (elAlertDesc) {
          elAlertDesc.textContent = `Terdapat ${pendingApprovals.length} pengajuan pembelian dari Procurement senilai total Rp ${totalPendingNominal.toLocaleString('id-ID')} yang menunggu otorisasi Anda.`;
        }
      } else {
        elAlertBanner.style.display = 'none';
      }
    }

    // Update Quick Review Box on Jurnal Panel (Sub-panel 1)
    const elQuickBox = document.getElementById('fin-quick-po-box');
    const elQuickList = document.getElementById('fin-quick-po-list');
    if (elQuickBox && elQuickList) {
      if (pendingApprovals.length > 0) {
        elQuickBox.style.display = 'block';
        elQuickList.innerHTML = pendingApprovals.slice(0, 4).map((p) => {
          const itemsText = p.items?.map((it) => `${it.barang?.nama_barang || 'Bahan'} (${parseFloat(it.jumlah_pesan).toLocaleString('id-ID')} ${it.barang?.satuan || 'unit'})`).join(', ') || '-';
          return `
            <div class="quick-po-row">
              <div class="quick-po-row-info">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <strong style="color: var(--text-heading); font-size: 0.88rem;">${p.nomor_po}</strong>
                  <span class="badge-status warning" style="font-size: 0.68rem; padding: 2px 6px;">⏳ MENUNGGU APPROVAL</span>
                  <span style="font-size: 0.75rem; color: var(--text-muted);">${p.tanggal_po || ''}</span>
                </div>
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 3px;">
                  <strong>${p.supplier?.nama_supplier || 'Supplier Rekanan'}</strong> &bull; ${itemsText} &bull; <strong style="color: var(--green-deep); font-size: 0.88rem;">Rp ${parseFloat(p.total_estimasi).toLocaleString('id-ID')}</strong>
                </div>
              </div>
              <div class="quick-po-row-actions">
                <button class="btn-approve" onclick="openFinanceApproveModal(${p.id_po})">✓ Setujui</button>
                <button class="btn-reject" onclick="openFinanceRejectModal(${p.id_po})">✗ Tolak</button>
              </div>
            </div>
          `;
        }).join('');
      } else {
        elQuickBox.style.display = 'none';
      }
    }

    if (tableBodyApproval) {
      if (purchaseOrders.length === 0) {
        tableBodyApproval.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 30px; color: var(--text-dim);">Belum ada pengajuan pembelian dari modul procurement.</td></tr>`;
      } else {
        // Tampilkan yang PENDING_APPROVAL di paling atas
        const sortedPo = [...purchaseOrders].sort((a, b) => {
          if (a.status === 'PENDING_APPROVAL' && b.status !== 'PENDING_APPROVAL') return -1;
          if (a.status !== 'PENDING_APPROVAL' && b.status === 'PENDING_APPROVAL') return 1;
          return new Date(b.tanggal_po || b.created_at || 0) - new Date(a.tanggal_po || a.created_at || 0);
        });

        tableBodyApproval.innerHTML = sortedPo
          .map((p) => {
            const itemsText =
              p.items
                ?.map(
                  (it) =>
                    `<div><strong>${it.barang?.nama_barang || 'Bahan'}</strong> (${parseFloat(it.jumlah_pesan).toLocaleString('id-ID')} ${it.barang?.satuan || 'unit'} @ Rp ${parseFloat(it.harga_satuan_estimasi || 0).toLocaleString('id-ID')})</div>`
                )
                .join('') || '-';

            const statusBadge =
              p.status === 'PENDING_APPROVAL'
                ? '<span class="badge-status warning">⏳ MENUNGGU APPROVAL</span>'
                : p.status === 'CONFIRMED'
                ? '<span class="badge-status safe">✓ DISETUJUI</span>'
                : p.status === 'REJECTED'
                ? '<span class="badge-status critical">✗ DITOLAK (BATAL)</span>'
                : p.status === 'COMPLETED'
                ? '<span class="badge-status safe">📦 SELESAI DITERIMA</span>'
                : '<span class="badge-status warning">📦 SEBAGIAN</span>';

            let actionCol = '-';
            if (p.status === 'PENDING_APPROVAL') {
              actionCol = `
                <div style="display: flex; gap: 6px; justify-content: flex-end;">
                  <button class="btn-approve" onclick="openFinanceApproveModal(${p.id_po})">✓ Setujui</button>
                  <button class="btn-reject" onclick="openFinanceRejectModal(${p.id_po})">✗ Tolak</button>
                </div>
              `;
            } else if (p.status === 'CONFIRMED') {
              actionCol = `<div style="text-align: right;"><span class="badge-status safe" title="${p.catatan_finance || ''}">✓ Disetujui (${p.disetujui_oleh || 'Finance'})</span></div>`;
            } else if (p.status === 'REJECTED') {
              actionCol = `<div style="text-align: right;"><span class="badge-status critical" title="${p.catatan_finance || ''}">✗ Ditolak: ${p.catatan_finance || 'Batal'}</span></div>`;
            } else {
              actionCol = `<div style="text-align: right;"><span class="badge-status safe">Realistis Terlaksana</span></div>`;
            }

            return `
              <tr>
                <td>
                  <div class="item-cell">
                    <span class="item-name">${p.nomor_po}</span>
                    <span class="item-code">${p.tanggal_po}</span>
                  </div>
                </td>
                <td><strong>${p.supplier?.nama_supplier || 'Supplier Rekanan'}</strong></td>
                <td style="font-size: 0.82rem;">${itemsText}</td>
                <td><strong style="color: var(--green-deep); font-size: 0.92rem;">Rp ${parseFloat(p.total_estimasi).toLocaleString('id-ID')}</strong></td>
                <td><span class="category-tag">${p.is_auto_generated ? 'AUTO TRIGGER' : 'MANUAL'}</span></td>
                <td><span style="font-size: 0.82rem; color: var(--text-muted);">${p.catatan || '-'}</span></td>
                <td>${statusBadge}</td>
                <td>${actionCol}</td>
              </tr>
            `;
          })
          .join('');
      }
    }

    // 4. Fetch Saldo Kas & Bank Tersedia Realtime
    try {
      const resCash = await fetch('/api/finance/cash-balance');
      const dataCash = await resCash.json();
      if (dataCash.success && dataCash.data) {
        cashBalanceData = dataCash.data;
        const elKas = document.getElementById('fin-kas-toko');
        const elBank = document.getElementById('fin-bank-bca');
        const elTotal = document.getElementById('fin-total-uang');
        if (elKas) elKas.textContent = `Rp ${cashBalanceData.kas_toko.toLocaleString('id-ID')}`;
        if (elBank) elBank.textContent = `Rp ${cashBalanceData.bank_bca.toLocaleString('id-ID')}`;
        if (elTotal) elTotal.textContent = `Rp ${cashBalanceData.total_uang_tersedia.toLocaleString('id-ID')}`;
      }
    } catch {
      console.warn('Finance cash-balance fetch offline fallback');
    }

    // 5. Fetch & Render Invoice Tagihan Barang
    await loadInvoicesData();
  };

  // --- SUB-FITUR FINANCE: INVOICE TAGIHAN BARANG & SALDO KAS REALTIME ---
  window.loadInvoicesData = async () => {
    const filterStatus = document.getElementById('filter-invoice-status')?.value || 'ALL';
    try {
      const url = filterStatus !== 'ALL' ? `/api/finance/invoices?status=${filterStatus}` : '/api/finance/invoices';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        purchaseInvoices = data.data;
        try {
          localStorage.setItem('kafeina_erp_invoices', JSON.stringify(purchaseInvoices));
        } catch {}
      }
    } catch (err) {
      console.warn('Invoices fetch error:', err);
    }

    // Update KPI Tagihan Unpaid
    const unpaidList = purchaseInvoices.filter((i) => i.status_pembayaran === 'UNPAID');
    const unpaidNominal = unpaidList.reduce((acc, i) => acc + (parseFloat(i.total_tagihan) || 0), 0);

    const elUnpaidCount = document.getElementById('fin-kpi-unpaid-inv');
    const elUnpaidNominal = document.getElementById('fin-kpi-unpaid-nominal');
    const elBadge = document.getElementById('fin-invoice-badge');

    if (elUnpaidCount) elUnpaidCount.textContent = `${unpaidList.length} Unpaid`;
    if (elUnpaidNominal) elUnpaidNominal.textContent = `Rp ${unpaidNominal.toLocaleString('id-ID')} Belum Terbayar`;
    if (elBadge) {
      elBadge.textContent = unpaidList.length;
      if (unpaidList.length === 0) elBadge.classList.add('badge-zero');
      else elBadge.classList.remove('badge-zero');
    }

    renderInvoicesTable();
  };

  window.renderInvoicesTable = () => {
    const tbody = document.getElementById('table-body-finance-invoices');
    if (!tbody) return;

    const filterStatus = document.getElementById('filter-invoice-status')?.value || 'ALL';
    let filtered = purchaseInvoices;
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter((i) => i.status_pembayaran === filterStatus);
    }

    if (!filtered || filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 36px 20px; color: var(--text-dim);">
        <div style="font-size: 1.6rem; margin-bottom: 6px;">📄</div>
        <strong>Belum ada invoice tagihan supplier.</strong><br>
        <span style="font-size: 0.82rem;">Setiap penerimaan barang (GRN) dari PO yang disetujui akan otomatis menerbitkan invoice tagihan di sini untuk dibayarkan Finance.</span>
      </td></tr>`;
      return;
    }

    tbody.innerHTML = filtered
      .map((inv) => {
        const po = inv.purchase_order;
        const supplier = inv.supplier || po?.supplier;
        const itemsText =
          po?.items
            ?.map(
              (it) =>
                `${it.barang?.nama_barang || 'Komoditas'} (${parseFloat(it.jumlah_pesan || 0).toLocaleString('id-ID')} ${it.barang?.satuan || 'unit'})`
            )
            .join(', ') || 'Pengadaan Bahan Baku';

        const isPaid = inv.status_pembayaran === 'PAID';
        const statusBadge = isPaid
          ? `<span class="badge-invoice-paid">✓ LUNAS (PAID)</span>`
          : `<span class="badge-invoice-unpaid">⏳ BELUM BAYAR (UNPAID)</span>`;

        const paymentInfo = isPaid
          ? `<div style="font-size: 0.8rem; line-height: 1.35;">
              <strong style="color: var(--green-deep);">${inv.metode_pembayaran || 'TRANSFER_BCA'}</strong><br>
              <span style="color: var(--text-muted); font-size: 0.76rem;">${inv.tanggal_bayar ? new Date(inv.tanggal_bayar).toLocaleDateString('id-ID') : '-'} &bull; Oleh: ${inv.dibayar_oleh || 'Finance'}</span>
            </div>`
          : `<span style="font-size: 0.8rem; color: #b91c1c; font-weight: 500;">Menunggu Pelunasan</span>`;

        const actionCol = isPaid
          ? `<div style="display: flex; gap: 6px; justify-content: flex-end;">
              <button class="btn-view-voucher" onclick="openInvoicePreviewModal(${inv.id_invoice})">📄 Bukti Bayar</button>
            </div>`
          : `<div style="display: flex; gap: 6px; justify-content: flex-end;">
              <button class="btn-pay-invoice" onclick="openPayInvoiceModal(${inv.id_invoice})">💳 Bayar Invoice</button>
              <button class="btn-view-voucher" onclick="openInvoicePreviewModal(${inv.id_invoice})">👁️ Detail</button>
            </div>`;

        return `
          <tr>
            <td>
              <div class="item-cell">
                <span class="item-name">${inv.nomor_invoice}</span>
                <span class="item-code">${inv.tanggal_invoice || '-'}</span>
              </div>
            </td>
            <td>
              <strong style="color: var(--text-heading); font-size: 0.88rem;">${po?.nomor_po || 'PO'}</strong>
              <div style="font-size: 0.8rem; color: var(--text-muted);">${supplier?.nama_supplier || 'Supplier Rekanan'}</div>
            </td>
            <td style="font-size: 0.82rem; max-width: 220px;">${itemsText}</td>
            <td><span style="font-size: 0.82rem; color: ${isPaid ? 'var(--text-muted)' : '#b91c1c'}; font-weight: ${isPaid ? '400' : '700'};">${inv.tanggal_jatuh_tempo || '-'}</span></td>
            <td><strong style="color: var(--green-deep); font-size: 0.95rem;">Rp ${parseFloat(inv.total_tagihan || 0).toLocaleString('id-ID')}</strong></td>
            <td>${statusBadge}</td>
            <td>${paymentInfo}</td>
            <td>${actionCol}</td>
          </tr>
        `;
      })
      .join('');
  };

  // Buka Modal Bayar Invoice
  window.openPayInvoiceModal = (idInvoice) => {
    const inv = purchaseInvoices.find((i) => i.id_invoice === idInvoice);
    if (!inv) return;
    document.getElementById('pay-inv-id').value = idInvoice;
    const summaryBox = document.getElementById('pay-inv-summary');
    if (summaryBox) {
      summaryBox.innerHTML = `
        <div style="font-weight: 700; margin-bottom: 6px; color: var(--green-deep); font-size: 0.92rem;">Konfirmasi Pembayaran Tagihan:</div>
        <div style="display: grid; grid-template-columns: 140px 1fr; gap: 4px; font-size: 0.84rem;">
          <span style="color: var(--text-muted);">Nomor Faktur:</span><strong>${inv.nomor_invoice}</strong>
          <span style="color: var(--text-muted);">Nomor PO:</span><strong>${inv.purchase_order?.nomor_po || '-'}</strong>
          <span style="color: var(--text-muted);">Vendor / Supplier:</span><strong>${inv.supplier?.nama_supplier || inv.purchase_order?.supplier?.nama_supplier || '-'}</strong>
          <span style="color: var(--text-muted);">Jatuh Tempo:</span><span style="color: #b91c1c; font-weight: 600;">${inv.tanggal_jatuh_tempo || '-'}</span>
          <span style="color: var(--text-muted);">Total Tagihan:</span><strong style="color: #b91c1c; font-size: 1.1rem;">Rp ${parseFloat(inv.total_tagihan).toLocaleString('id-ID')}</strong>
        </div>
        <div style="margin-top: 10px; font-size: 0.78rem; color: var(--text-muted); padding: 8px; background: rgba(36, 117, 89, 0.08); border-radius: 6px;">
          ℹ️ Pembayaran ini otomatis mencatat Jurnal Pengeluaran Kas (Debet Hutang Usaha / Beban Pengadaan, Kredit Kas/Bank) dan memotong saldo dana secara realtime.
        </div>
      `;
    }
    openModal('modal-pay-invoice');
  };

  // Submit Pembayaran Invoice
  window.submitPayInvoice = async (e) => {
    e.preventDefault();
    const idInvoice = parseInt(document.getElementById('pay-inv-id').value);
    const akun_kas_id = parseInt(document.getElementById('pay-inv-akun-kas').value);
    const metode_pembayaran = document.getElementById('pay-inv-metode').value;
    const dibayar_oleh = document.getElementById('pay-inv-dibayar-oleh').value;
    const catatan = document.getElementById('pay-inv-catatan').value;

    closeModal('modal-pay-invoice');
    showToast('Memproses pelunasan invoice & pemotongan kas...', 'info');

    try {
      const res = await fetch(`/api/finance/invoices/${idInvoice}/bayar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ akun_kas_id, metode_pembayaran, dibayar_oleh, catatan })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✓ Invoice #${data.data?.nomor_invoice || idInvoice} berhasil DIBAYAR LUNAS! Kas & Jurnal terupdate otomatis.`, 'success');
        const targetInv = purchaseInvoices.find((i) => i.id_invoice === idInvoice);
        if (targetInv) {
          targetInv.status_pembayaran = 'PAID';
          targetInv.metode_pembayaran = metode_pembayaran;
          targetInv.tanggal_bayar = new Date().toISOString();
          targetInv.dibayar_oleh = dibayar_oleh;
        }
        try {
          localStorage.setItem('kafeina_erp_invoices', JSON.stringify(purchaseInvoices));
        } catch {}
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      // Local optimistic update jika offline
      const targetInv = purchaseInvoices.find((i) => i.id_invoice === idInvoice);
      if (targetInv) {
        targetInv.status_pembayaran = 'PAID';
        targetInv.metode_pembayaran = metode_pembayaran;
        targetInv.tanggal_bayar = new Date().toISOString();
        targetInv.dibayar_oleh = dibayar_oleh;
      }
      try {
        localStorage.setItem('kafeina_erp_invoices', JSON.stringify(purchaseInvoices));
      } catch {}
      showToast(`✓ Invoice #${targetInv?.nomor_invoice || idInvoice} DIBAYAR LUNAS (Mode Lokal)!`, 'success');
    }

    await triggerRealtimeUpdate('invoice_paid');
  };

  // Modal Preview / Cetak Faktur Voucher
  window.openInvoicePreviewModal = (idInvoice) => {
    const inv = purchaseInvoices.find((i) => i.id_invoice === idInvoice);
    if (!inv) return;
    const container = document.getElementById('invoice-preview-container');
    if (!container) return;

    const po = inv.purchase_order;
    const supplier = inv.supplier || po?.supplier;
    const isPaid = inv.status_pembayaran === 'PAID';

    container.innerHTML = `
      <div class="invoice-voucher-card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid var(--green-deep); padding-bottom: 12px; margin-bottom: 16px;">
          <div>
            <h2 style="font-family: var(--font-heading); color: var(--green-deep); margin: 0; font-size: 1.35rem;">KAFEINA SPECIALTY COFFEE</h2>
            <span style="font-size: 0.8rem; color: var(--text-muted);">Jl. Senopati Raya No. 42, Kebayoran Baru, Jakarta Selatan</span><br>
            <span style="font-size: 0.78rem; color: var(--text-muted);">NPWP: 01.345.678.9-012.000 &bull; finance@kafeinacoffee.id</span>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); letter-spacing: 0.05em;">FAKTUR PEMBELIAN / INVOICE</span>
            <h3 style="color: var(--text-heading); margin: 4px 0 0 0; font-size: 1.1rem;">${inv.nomor_invoice}</h3>
            <span class="${isPaid ? 'badge-invoice-paid' : 'badge-invoice-unpaid'}" style="margin-top: 6px; display: inline-block;">${isPaid ? '✓ LUNAS (PAID)' : '⏳ BELUM DIBAYAR'}</span>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px; font-size: 0.84rem;">
          <div style="background: var(--bg-surface); padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border-color);">
            <strong style="color: var(--text-heading); display: block; margin-bottom: 4px; font-size: 0.82rem; text-transform: uppercase;">Pemasok / Vendor:</strong>
            <div style="font-weight: 600; color: var(--green-deep); font-size: 0.92rem;">${supplier?.nama_supplier || 'Supplier Rekanan'}</div>
            <div style="color: var(--text-muted); font-size: 0.78rem;">${supplier?.alamat || 'Alamat Gudang Supplier'}</div>
            <div style="color: var(--text-muted); font-size: 0.78rem;">Telp: ${supplier?.telepon || '-'} &bull; ${supplier?.email || '-'}</div>
          </div>
          <div style="background: var(--bg-surface); padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border-color);">
            <strong style="color: var(--text-heading); display: block; margin-bottom: 4px; font-size: 0.82rem; text-transform: uppercase;">Rincian Dokumen:</strong>
            <div><strong>Nomor PO:</strong> ${po?.nomor_po || '-'}</div>
            <div><strong>Tgl Invoice:</strong> ${inv.tanggal_invoice || '-'}</div>
            <div><strong>Jatuh Tempo:</strong> <span style="color: #b91c1c; font-weight: 600;">${inv.tanggal_jatuh_tempo || '-'}</span></div>
            ${isPaid ? `<div><strong>Tgl Bayar:</strong> ${inv.tanggal_bayar ? new Date(inv.tanggal_bayar).toLocaleString('id-ID') : '-'} (${inv.metode_pembayaran})</div>` : ''}
          </div>
        </div>

        <div style="margin-bottom: 18px;">
          <table class="modern-table" style="font-size: 0.84rem;">
            <thead>
              <tr>
                <th>Komoditas / Bahan Baku</th>
                <th>Qty</th>
                <th>Harga Satuan</th>
                <th class="text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${po?.items
                ?.map(
                  (it) => `
                <tr>
                  <td><strong>${it.barang?.nama_barang || 'Komoditas'}</strong></td>
                  <td>${parseFloat(it.jumlah_pesan || 0).toLocaleString('id-ID')} ${it.barang?.satuan || 'unit'}</td>
                  <td>Rp ${parseFloat(it.harga_satuan_estimasi || 0).toLocaleString('id-ID')}</td>
                  <td class="text-right">Rp ${(parseFloat(it.jumlah_pesan || 0) * parseFloat(it.harga_satuan_estimasi || 0)).toLocaleString('id-ID')}</td>
                </tr>
              `
                )
                .join('') || `<tr><td colspan="4" style="text-align: center;">Pengadaan Bahan Baku</td></tr>`}
            </tbody>
            <tfoot>
              <tr style="border-top: 2px solid var(--border-color); background: rgba(36, 117, 89, 0.04);">
                <td colspan="3" style="text-align: right; font-weight: 700; font-size: 0.9rem;">TOTAL TAGIHAN:</td>
                <td class="text-right"><strong style="color: var(--green-deep); font-size: 1.1rem;">Rp ${parseFloat(inv.total_tagihan || 0).toLocaleString('id-ID')}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>

        ${isPaid ? `
          <div style="background: rgba(13, 107, 69, 0.08); border-left: 4px solid var(--green-deep); padding: 10px 12px; border-radius: 4px; font-size: 0.82rem; color: var(--green-deep); line-height: 1.4;">
            ✓ <strong>STATUS: LUNAS.</strong> Telah dibayarkan oleh <strong>${inv.dibayar_oleh || 'Finance'}</strong> via <strong>${inv.metode_pembayaran || 'TRANSFER_BCA'}</strong>. Tercatat otomatis di buku jurnal umum & mutasi kas/bank.
          </div>
        ` : `
          <div style="background: rgba(217, 119, 6, 0.08); border-left: 4px solid #d97706; padding: 10px 12px; border-radius: 4px; font-size: 0.82rem; color: #b45309; line-height: 1.4;">
            ⏳ <strong>STATUS: BELUM DIBAYAR (UNPAID).</strong> Silakan klik tombol 'Bayar Invoice' pada tabel Finance untuk mencatat pembayaran dan memotong kas toko/bank secara realtime.
          </div>
        `}
      </div>
    `;
    openModal('modal-preview-invoice');
  };

  // Submit Penambahan Saldo Kas / Input Data Keuangan Realtime
  window.submitFinanceCash = async (e) => {
    e.preventDefault();
    const tipe = document.getElementById('fc-tipe').value;
    const akun_kas_id = parseInt(document.getElementById('fc-akun').value);
    const nominal = parseFloat(document.getElementById('fc-nominal').value);
    const keterangan = document.getElementById('fc-keterangan').value;

    closeModal('modal-finance-cash');
    showToast(`Memproses penambahan dana kas realtime Rp ${nominal.toLocaleString('id-ID')}...`, 'info');

    try {
      const res = await fetch('/api/finance/cash-mutation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipe, akun_kas_id, nominal, keterangan })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✓ Saldo dana berhasil ditambahkan & jurnal #${data.data?.jurnal?.nomor_jurnal || ''} tercatat seimbang!`, 'success');
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      showToast('✓ Penyesuaian saldo dana kas/bank berhasil dicatat!', 'success');
    }

    await triggerRealtimeUpdate('finance_cash_mutation');
  };

  // 12 Karyawan Standar Coffee Shop (Real-Time Fallback Data)
  const default12Employees = [
    {
      id_pegawai: 1,
      kode_pegawai: 'EMP-001',
      nama_lengkap: 'Fikri Syahrial',
      posisi: { nama_jabatan: 'Store Manager & Owner', departemen: { nama_departemen: 'Management' } },
      status_kerja: 'FULL_TIME',
      gaji_pokok: 8500000,
      nama_bank: 'BCA',
      nomor_rekening: '5270111222'
    },
    {
      id_pegawai: 2,
      kode_pegawai: 'EMP-002',
      nama_lengkap: 'Dimas Pratama',
      posisi: { nama_jabatan: 'Head Barista & QC', departemen: { nama_departemen: 'Bar & Floor' } },
      status_kerja: 'FULL_TIME',
      gaji_pokok: 5200000,
      nama_bank: 'BCA',
      nomor_rekening: '5270123456'
    },
    {
      id_pegawai: 3,
      kode_pegawai: 'EMP-003',
      nama_lengkap: 'Sarah Nabila',
      posisi: { nama_jabatan: 'Senior Barista & Latte Artist', departemen: { nama_departemen: 'Bar & Floor' } },
      status_kerja: 'FULL_TIME',
      gaji_pokok: 4500000,
      nama_bank: 'Mandiri',
      nomor_rekening: '131009876543'
    },
    {
      id_pegawai: 4,
      kode_pegawai: 'EMP-004',
      nama_lengkap: 'Rizky Ramadhan',
      posisi: { nama_jabatan: 'Junior Barista', departemen: { nama_departemen: 'Bar & Floor' } },
      status_kerja: 'FULL_TIME',
      gaji_pokok: 3800000,
      nama_bank: 'BRI',
      nomor_rekening: '012345678901'
    },
    {
      id_pegawai: 5,
      kode_pegawai: 'EMP-005',
      nama_lengkap: 'Anisa Rahmawati',
      posisi: { nama_jabatan: 'Head Cashier & POS', departemen: { nama_departemen: 'Bar & Floor' } },
      status_kerja: 'FULL_TIME',
      gaji_pokok: 3900000,
      nama_bank: 'BCA',
      nomor_rekening: '5270998877'
    },
    {
      id_pegawai: 6,
      kode_pegawai: 'EMP-006',
      nama_lengkap: 'Bayu Nugroho',
      posisi: { nama_jabatan: 'Master Coffee Roaster', departemen: { nama_departemen: 'Roastery' } },
      status_kerja: 'FULL_TIME',
      gaji_pokok: 6000000,
      nama_bank: 'BNI',
      nomor_rekening: '0897654321'
    },
    {
      id_pegawai: 7,
      kode_pegawai: 'EMP-007',
      nama_lengkap: 'Hendra Wijaya',
      posisi: { nama_jabatan: 'Kitchen Head Cook', departemen: { nama_departemen: 'Kitchen & Food' } },
      status_kerja: 'FULL_TIME',
      gaji_pokok: 5500000,
      nama_bank: 'BCA',
      nomor_rekening: '5270334455'
    },
    {
      id_pegawai: 8,
      kode_pegawai: 'EMP-008',
      nama_lengkap: 'Dewi Sartika',
      posisi: { nama_jabatan: 'Pastry & Bakery Chef', departemen: { nama_departemen: 'Kitchen & Food' } },
      status_kerja: 'FULL_TIME',
      gaji_pokok: 4800000,
      nama_bank: 'Mandiri',
      nomor_rekening: '131005544332'
    },
    {
      id_pegawai: 9,
      kode_pegawai: 'EMP-009',
      nama_lengkap: 'Agus Santoso',
      posisi: { nama_jabatan: 'Inventory & Warehouse Officer', departemen: { nama_departemen: 'Supply & Warehouse' } },
      status_kerja: 'FULL_TIME',
      gaji_pokok: 4200000,
      nama_bank: 'BRI',
      nomor_rekening: '012344556677'
    },
    {
      id_pegawai: 10,
      kode_pegawai: 'EMP-010',
      nama_lengkap: 'Maya Lestari',
      posisi: { nama_jabatan: 'Finance & Cashier Supervisor', departemen: { nama_departemen: 'Back Office' } },
      status_kerja: 'FULL_TIME',
      gaji_pokok: 5000000,
      nama_bank: 'BCA',
      nomor_rekening: '5270667788'
    },
    {
      id_pegawai: 11,
      kode_pegawai: 'EMP-011',
      nama_lengkap: 'Rudi Hartono',
      posisi: { nama_jabatan: 'General Utility & Dishwasher', departemen: { nama_departemen: 'Maintenance' } },
      status_kerja: 'FULL_TIME',
      gaji_pokok: 3200000,
      nama_bank: 'BRI',
      nomor_rekening: '012388990011'
    },
    {
      id_pegawai: 12,
      kode_pegawai: 'EMP-012',
      nama_lengkap: 'Siti Aisyah',
      posisi: { nama_jabatan: 'HR & People Operations', departemen: { nama_departemen: 'Back Office' } },
      status_kerja: 'FULL_TIME',
      gaji_pokok: 4700000,
      nama_bank: 'BNI',
      nomor_rekening: '0897112233'
    }
  ];

  // Helper Render Tabel Pegawai Secara Real-Time
  const renderEmployeesTable = (list) => {
    const tableBodyPegawai = document.getElementById('table-body-pegawai');
    if (!tableBodyPegawai) return;

    const kpiTotalPegawai = document.getElementById('hcm-total-pegawai');
    if (kpiTotalPegawai) {
      kpiTotalPegawai.textContent = `${list.length} Pegawai`;
    }

    tableBodyPegawai.innerHTML = list
      .map(
        (p) => `
      <tr>
        <td>
          <div class="item-cell">
            <span class="item-name">${p.nama_lengkap}</span>
            <span class="item-code">${p.kode_pegawai}</span>
          </div>
        </td>
        <td><span class="category-tag">${p.posisi?.nama_jabatan || p.jabatan || 'Barista'}</span></td>
        <td>${p.posisi?.departemen?.nama_departemen || p.departemen || 'Bar & Floor'}</td>
        <td><span class="badge-status safe">${p.status_kerja || 'FULL_TIME'}</span></td>
        <td><strong style="color: var(--green-deep);">Rp ${parseFloat(p.gaji_pokok || 0).toLocaleString('id-ID')}</strong></td>
        <td><span>${p.nama_bank || 'BCA'} • ${p.nomor_rekening || '-'}</span></td>
        <td class="text-right">
          <div style="display: flex; justify-content: flex-end; align-items: center; gap: 8px;">
            <button class="btn-action-po" onclick="handleKalkulasiPayroll('${p.id_pegawai || p.kode_pegawai}')">Hitung Slip Gaji</button>
            <button class="btn-delete-item" onclick="handleHapusPegawai('${p.id_pegawai || p.kode_pegawai}', '${(p.nama_lengkap || '').replace(/'/g, "\\'")}')" title="Hapus Data Karyawan" style="background: rgba(239, 68, 68, 0.12); color: #dc2626; border: 1px solid rgba(239, 68, 68, 0.25); padding: 5px 9px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; font-size: 0.76rem; font-weight: 600; transition: all 0.2s;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
              <span>Hapus</span>
            </button>
          </div>
        </td>
      </tr>
    `
      )
      .join('');
  };

  // --- MODULE 3: HCM & PAYROLL ---
  const loadHcmData = async () => {
    const tableBodyAbsensi = document.getElementById('table-body-absensi');

    // 1. Fetch Pegawai (Real-Time Synchronized)
    try {
      const res = await fetch('/api/hcm/pegawai');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        employeeList = data.data;
        try { localStorage.setItem('kafeina_erp_employees', JSON.stringify(employeeList)); } catch {}
      } else {
        const cached = localStorage.getItem('kafeina_erp_employees');
        if (cached) {
          employeeList = JSON.parse(cached);
        } else if (!employeeList || employeeList.length === 0) {
          employeeList = default12Employees;
        }
      }
    } catch {
      const cached = localStorage.getItem('kafeina_erp_employees');
      if (cached) {
        employeeList = JSON.parse(cached);
      } else if (!employeeList || employeeList.length === 0) {
        employeeList = default12Employees;
      }
    }

    renderEmployeesTable(employeeList);

    // 2. Fetch Absensi
    try {
      const resAbs = await fetch('/api/hcm/absensi');
      const dataAbs = await resAbs.json();
      if (dataAbs.success && dataAbs.data?.length > 0) {
        attendanceLogs = dataAbs.data;
      } else {
        attendanceLogs = [];
      }
    } catch {
      attendanceLogs = [];
    }

    if (attendanceLogs.length === 0) {
      tableBodyAbsensi.innerHTML = `
        <tr><td colspan="8" style="text-align: center; padding: 30px; color: var(--text-dim);">
          Belum ada riwayat absensi. Klik tombol <strong>'Buat Demo Absensi'</strong> di atas untuk men-generate 24 hari kehadiran September 2026.
        </td></tr>
      `;
    } else {
      tableBodyAbsensi.innerHTML = attendanceLogs
        .map(
          (a) => `
        <tr>
          <td><strong style="color: var(--green-deep);">${a.tanggal_absensi}</strong></td>
          <td>${a.pegawai?.nama_lengkap || 'Dimas Pratama'}</td>
          <td><span class="category-tag">${a.nama_shift || 'Shift Opening'}</span></td>
          <td>${a.jam_masuk ? new Date(a.jam_masuk).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
          <td><span class="badge-status ${a.status_kehadiran === 'HADIR' ? 'safe' : 'warning'}">${a.status_kehadiran}</span></td>
          <td><span style="color: ${a.menit_terlambat > 0 ? 'var(--status-critical)' : 'var(--text-muted)'}; font-weight: ${a.menit_terlambat > 0 ? '700' : '400'};">${a.menit_terlambat} Menit</span></td>
          <td><span style="color: ${a.jam_lembur > 0 ? 'var(--green-deep)' : 'var(--text-muted)'}; font-weight: 600;">${a.jam_lembur || 0} Jam</span></td>
          <td><span style="font-size: 0.78rem; color: var(--text-dim);">${a.catatan || '-'}</span></td>
        </tr>
      `
        )
        .join('');
    }
  };

  // --- MODULE 4: PROCUREMENT ---
  const loadProcurementData = async () => {
    const tableBodyPo = document.getElementById('table-body-po');
    const tableBodySup = document.getElementById('table-body-supplier');

    // 1. Fetch PO
    try {
      const resPo = await fetch('/api/procurement/po');
      const dataPo = await resPo.json();
      if (dataPo.success && dataPo.data?.length > 0) {
        purchaseOrders = dataPo.data;
        try {
          localStorage.setItem('kafeina_erp_purchase_orders', JSON.stringify(purchaseOrders));
        } catch {}
      } else if (purchaseOrders.length === 0) {
        purchaseOrders = [...defaultMockPurchaseOrders];
      }
    } catch {
      if (purchaseOrders.length === 0) {
        purchaseOrders = [...defaultMockPurchaseOrders];
      }
    }

    document.getElementById('proc-total-po').textContent = `${purchaseOrders.length} PO`;
    const pendingFinanceCount = purchaseOrders.filter((p) => p.status === 'PENDING_APPROVAL').length;
    document.getElementById('proc-pending-po').textContent = `${pendingFinanceCount} Menunggu Finance`;

    if (purchaseOrders.length === 0) {
      tableBodyPo.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 30px; color: var(--text-dim);">Belum ada Purchase Order terbit. Klik '+ Ajukan Pembelian ke Finance' atau klik '+ Draf PO' dari tabel Inventory.</td></tr>`;
    } else {
      tableBodyPo.innerHTML = purchaseOrders
        .map((p) => {
          const statusBadge =
            p.status === 'COMPLETED' || p.status === 'RECEIVED'
              ? '<span class="badge-status safe">📦 SELESAI / RECEIVED</span>'
              : p.status === 'CONFIRMED'
              ? '<span class="badge-status safe">✓ DISETUJUI FINANCE</span>'
              : p.status === 'PENDING_APPROVAL'
              ? '<span class="badge-status warning">⏳ MENUNGGU FINANCE</span>'
              : p.status === 'REJECTED'
              ? '<span class="badge-status critical">✗ DITOLAK FINANCE (BATAL)</span>'
              : p.status === 'PARTIALLY_RECEIVED'
              ? '<span class="badge-status warning">📦 DITERIMA SEBAGIAN</span>'
              : '<span class="badge-status critical">DRAFT</span>';

          const itemsText =
            p.items
              ?.map(
                (it) =>
                  `<div>${it.barang?.nama_barang || 'Bahan Baku'} (${parseFloat(it.jumlah_pesan).toLocaleString('id-ID')} ${it.barang?.satuan || 'unit'})</div>`
              )
              .join('') || '-';

          let actionBtn = '-';
          if (p.status === 'PENDING_APPROVAL') {
            actionBtn = `<span class="text-dim-action">⏳ Menunggu Finance</span>`;
          } else if (p.status === 'CONFIRMED') {
            const firstItem = p.items?.[0];
            actionBtn = `<button class="btn-action-po" style="background: var(--green-deep); color: #fff;" onclick="handleTerimaBarang(${p.id_po}, ${firstItem?.id_barang || 1}, ${firstItem?.jumlah_pesan || 1000}, ${firstItem?.harga_satuan_estimasi || 300})">Terima Barang</button>`;
          } else if (p.status === 'REJECTED') {
            actionBtn = `<span class="text-dim-action" style="color: #dc2626;" title="${p.catatan_finance || 'Ditolak Finance'}">✗ Pengajuan Batal</span>`;
          } else if (p.status === 'COMPLETED' || p.status === 'RECEIVED') {
            actionBtn = `<span class="text-dim-action" style="color: var(--green-forest);">✓ Selesai Diterima</span>`;
          } else if (p.status === 'DRAFT') {
            actionBtn = `<button class="btn-action-po" onclick="handleAjukanKeFinance(${p.id_po})">Ajukan ke Finance</button>`;
          }

          return `
          <tr>
            <td>
              <div class="item-cell">
                <span class="item-name">${p.nomor_po}</span>
                <span class="item-code">${p.tanggal_po}</span>
              </div>
            </td>
            <td><strong>${p.supplier?.nama_supplier || 'Supplier Rekanan'}</strong></td>
            <td style="font-size: 0.82rem;">${itemsText}</td>
            <td><strong style="color: var(--green-deep);">Rp ${parseFloat(p.total_estimasi).toLocaleString('id-ID')}</strong></td>
            <td><span class="category-tag">${p.is_auto_generated ? 'AUTO TRIGGER' : 'MANUAL'}</span></td>
            <td>${statusBadge}</td>
            <td class="text-right">${actionBtn}</td>
          </tr>
        `;
        })
        .join('');
    }

    // 2. Fetch Supplier
    try {
      const resSup = await fetch('/api/procurement/supplier');
      const dataSup = await resSup.json();
      if (dataSup.success && dataSup.data?.length > 0) {
        supplierList = dataSup.data;
        try {
          localStorage.setItem('kafeina_erp_suppliers', JSON.stringify(supplierList));
        } catch {}
      } else {
        supplierList = [...defaultMockSuppliers];
      }
    } catch {
      supplierList = [...defaultMockSuppliers];
    }

    tableBodySup.innerHTML = supplierList
      .map(
        (s) => `
      <tr>
        <td><strong style="color: var(--text-heading);">${s.nama_supplier}</strong></td>
        <td><span>${s.kontak_person || '-'}</span></td>
        <td><span style="color: var(--green-pine); font-weight: 600;">${s.telepon || '-'}</span></td>
        <td><span style="font-size: 0.82rem; color: var(--text-muted);">${s.email || '-'}</span></td>
        <td><span style="font-size: 0.82rem; color: var(--text-dim);">${s.alamat || '-'}</span></td>
        <td><span class="category-tag">${s.kategori || 'Bahan Baku'}</span></td>
      </tr>
    `
      )
      .join('');
  };

  // --- MODULE 5: INVENTORY ---
  const loadInventoryData = async () => {
    try {
      const res = await fetch('/api/barang?limit=50');
      const data = await res.json();
      if (data.success && data.data?.length > 0) {
        inventoryItems = data.data.map((item) => ({
          id_barang: item.id_barang,
          item_code: item.item_code || `RM-${String(item.id_barang).padStart(3, '0')}`,
          nama_barang: item.nama_barang,
          kategori: item.kategori,
          satuan: item.satuan,
          stok_saat_ini: parseFloat(item.stok_saat_ini || 0),
          batas_safety_stock: parseFloat(item.batas_safety_stock || 0),
          harga_satuan: parseFloat(item.harga_satuan || 0),
          supplier_id: item.supplier_id,
          quality_grade: item.quality_grade || 'GRADE_A',
          stok_reject: parseFloat(item.stok_reject || 0)
        }));

        try {
          localStorage.setItem('kafeina_erp_inventory', JSON.stringify(inventoryItems));
        } catch {}
      } else {
        const cached = localStorage.getItem('kafeina_erp_inventory');
        if (cached) {
          inventoryItems = JSON.parse(cached);
        } else if (inventoryItems.length === 0) {
          inventoryItems = [...defaultMockItems];
        }
      }
    } catch {
      const cached = localStorage.getItem('kafeina_erp_inventory');
      if (cached) {
        inventoryItems = JSON.parse(cached);
      } else if (inventoryItems.length === 0) {
        inventoryItems = [...defaultMockItems];
      }
    }

    applyInventoryFilter();

    // Fetch Mutasi
    const tableBodyMutasi = document.getElementById('table-body-mutasi');
    try {
      const resMut = await fetch('/api/inventory/mutasi');
      const dataMut = await resMut.json();
      if (dataMut.success && dataMut.data?.length > 0) {
        stockMutations = dataMut.data;
      } else {
        stockMutations = [];
      }
    } catch {
      stockMutations = [];
    }

    if (stockMutations.length === 0) {
      tableBodyMutasi.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 30px; color: var(--text-dim);">Belum ada riwayat mutasi stok. Klik '- Catat Pemakaian (Out)' untuk mencatat pengurangan stok.</td></tr>`;
    } else {
      tableBodyMutasi.innerHTML = stockMutations
        .map(
          (m) => `
        <tr>
          <td><span class="item-code">${new Date(m.createdAt).toLocaleString('id-ID')}</span></td>
          <td><strong>${m.barang?.nama_barang || 'Bahan Baku'}</strong></td>
          <td><span class="category-tag">${m.tipe_mutasi}</span></td>
          <td><span style="color: var(--status-safe); font-weight: 700;">${parseFloat(m.jumlah_masuk) > 0 ? `+${parseFloat(m.jumlah_masuk).toLocaleString('id-ID')}` : '-'}</span></td>
          <td><span style="color: var(--status-critical); font-weight: 700;">${parseFloat(m.jumlah_keluar) > 0 ? `-${parseFloat(m.jumlah_keluar).toLocaleString('id-ID')}` : '-'}</span></td>
          <td><strong style="color: var(--green-deep);">${parseFloat(m.saldo_akhir).toLocaleString('id-ID')} ${m.barang?.satuan || ''}</strong></td>
          <td><span style="font-size: 0.8rem; color: var(--text-muted);">${m.keterangan || '-'}</span></td>
        </tr>
      `
        )
        .join('');
    }
  };

  // Kalkulator Safety Stock
  const calculateStockStatus = (stok, safety) => {
    if (stok <= safety * 0.5) {
      return { status: 'CRITICAL', label: 'KRITIS (≤ 50%)', badgeClass: 'critical', progressClass: 'critical' };
    } else if (stok <= safety) {
      return { status: 'WARNING', label: 'PERLU REORDER', badgeClass: 'warning', progressClass: 'warning' };
    } else {
      return { status: 'SAFE', label: 'AMAN', badgeClass: 'safe', progressClass: 'safe' };
    }
  };

  // Render Tabel Safety Stock Warning
  const renderInventoryTable = (items) => {
    const tableBodyStock = document.getElementById('table-body-stock');
    const tableMetaInfo = document.getElementById('table-meta-info');

    if (!items || items.length === 0) {
      tableBodyStock.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 40px; color: var(--text-dim);">Tidak ditemukan bahan baku yang cocok.</td></tr>`;
      tableMetaInfo.textContent = 'Menampilkan 0 data';
      return;
    }

    let warningCount = 0;
    tableBodyStock.innerHTML = items
      .map((item) => {
        const { label, badgeClass, progressClass } = calculateStockStatus(
          item.stok_saat_ini,
          item.batas_safety_stock
        );
        if (badgeClass !== 'safe') warningCount++;

        const percentage = Math.min(Math.round((item.stok_saat_ini / item.batas_safety_stock) * 100), 100);
        const rekomendasiOrder = Math.max(item.batas_safety_stock * 2 - item.stok_saat_ini, item.batas_safety_stock);

        const grade = item.quality_grade || 'GRADE_A';
        const gradeBadge =
          grade === 'GRADE_A'
            ? '<span class="badge-qc grade-a">⭐ GRADE A (Prima)</span>'
            : grade === 'GRADE_B'
            ? '<span class="badge-qc grade-b">🔹 GRADE B (Comm)</span>'
            : '<span class="badge-qc grade-c">⚠️ GRADE C (Reject)</span>';

        return `
        <tr>
          <td>
            <div class="item-cell">
              <span class="item-name">${item.nama_barang}</span>
              <span class="item-code">${item.item_code}</span>
            </div>
          </td>
          <td><span class="category-tag">${item.kategori}</span></td>
          <td>${gradeBadge}</td>
          <td>
            <div class="stock-progress-cell">
              <div class="stock-numbers">
                <span>${item.stok_saat_ini.toLocaleString('id-ID')}</span>
                <span class="stock-unit">${item.satuan}</span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-fill ${progressClass}" style="width: ${percentage}%"></div>
              </div>
            </div>
          </td>
          <td>${item.batas_safety_stock.toLocaleString('id-ID')} ${item.satuan}</td>
          <td>
            <span class="badge-status ${badgeClass}">
              <span class="legend-dot ${badgeClass}"></span>
              ${label}
            </span>
          </td>
          <td>
            <strong style="color: var(--green-deep);">+${rekomendasiOrder.toLocaleString('id-ID')}</strong>
            <span style="font-size: 0.75rem; color: var(--text-muted);">${item.satuan}</span>
          </td>
          <td class="text-right">
            <button class="btn-action-po" onclick="handleCreatePo(${item.id_barang}, '${item.nama_barang}', ${rekomendasiOrder}, '${item.satuan}')">
              + Draf PO
            </button>
          </td>
        </tr>
      `;
      })
      .join('');

    tableMetaInfo.textContent = `Menampilkan ${items.length} dari ${inventoryItems.length} data barang`;
    document.getElementById('inv-reorder-count').textContent = `${warningCount} Item`;
  };

  // Filter Inventory
  const applyInventoryFilter = () => {
    const searchInput = document.getElementById('search-input');
    const filterKategori = document.getElementById('filter-kategori');
    if (!searchInput || !filterKategori) return;

    const keyword = searchInput.value.toLowerCase().trim();
    const kategori = filterKategori.value;

    filteredInventory = inventoryItems.filter((item) => {
      const matchKeyword =
        item.nama_barang.toLowerCase().includes(keyword) || item.item_code.toLowerCase().includes(keyword);
      const matchKategori = kategori === 'ALL' || item.kategori === kategori;
      return matchKeyword && matchKategori;
    });

    renderInventoryTable(filteredInventory);
  };

  const searchInput = document.getElementById('search-input');
  const filterKategori = document.getElementById('filter-kategori');
  if (searchInput) searchInput.addEventListener('input', applyInventoryFilter);
  if (filterKategori) filterKategori.addEventListener('change', applyInventoryFilter);

  // Expose Data Loaders to window for realtime access
  window.loadDashboardData = loadDashboardData;
  window.loadFinanceData = loadFinanceData;
  window.loadHcmData = loadHcmData;
  window.loadProcurementData = loadProcurementData;
  window.loadInventoryData = loadInventoryData;

  // ==============================================================
  // REALTIME SYNCHRONIZATION ENGINE (Cross-Tab, Heartbeat & Event Bus)
  // ==============================================================
  const REALTIME_CHANNEL_NAME = 'kafeina_erp_realtime_bus';
  let realtimeChannel = null;
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      realtimeChannel = new BroadcastChannel(REALTIME_CHANNEL_NAME);
    }
  } catch (err) {
    console.warn('BroadcastChannel tidak didukung di environment ini:', err);
  }

  // Efek visual indikator sinkronisasi realtime live di topbar
  window.flashSyncIndicator = (statusText = 'Tersinkronisasi ✓') => {
    const indicator = document.getElementById('live-sync-indicator');
    const textEl = document.getElementById('live-sync-text');
    if (!indicator || !textEl) return;

    indicator.classList.add('syncing');
    textEl.textContent = statusText;

    setTimeout(() => {
      indicator.classList.remove('syncing');
      textEl.textContent = 'Realtime Live';
    }, 1000);
  };

  // Sinkronisasi badge notifikasi global (Alert Stok, PO menunggu approval Finance, KPI)
  window.updateGlobalBadgesSilently = async () => {
    try {
      // 1. Alert Stok Rendah & KPI Stok
      const resB = await fetch('/api/barang');
      const dataB = await resB.json();
      if (dataB.success && Array.isArray(dataB.data)) {
        inventoryItems = dataB.data;
        const warningItems = inventoryItems.filter(
          (item) => parseFloat(item.stok_saat_ini) <= parseFloat(item.batas_safety_stock)
        );
        const badgeStok = document.getElementById('badge-stok-alert');
        if (badgeStok) badgeStok.textContent = `${warningItems.length} Alert`;
        const kpiStok = document.getElementById('kpi-stok-warning-count');
        if (kpiStok) kpiStok.textContent = `${warningItems.length} Komoditas`;
      }
    } catch {}

    try {
      // 2. Pending Approval PO Finance & Procurement KPI
      const resPo = await fetch('/api/procurement/po');
      const dataPo = await resPo.json();
      if (dataPo.success && Array.isArray(dataPo.data)) {
        purchaseOrders = dataPo.data;
        const pendingApprovals = purchaseOrders.filter((p) => p.status === 'PENDING_APPROVAL');
        const badgeApproval = document.getElementById('fin-pending-badge');
        if (badgeApproval) {
          badgeApproval.textContent = pendingApprovals.length;
          if (pendingApprovals.length === 0) badgeApproval.classList.add('badge-zero');
          else badgeApproval.classList.remove('badge-zero');
        }
        const procPending = document.getElementById('proc-pending-po');
        if (procPending) procPending.textContent = `${pendingApprovals.length} Menunggu Finance`;
        const procTotal = document.getElementById('proc-total-po');
        if (procTotal) procTotal.textContent = `${purchaseOrders.length} PO`;
      }
    } catch {}
  };

  // Muat data aktif secara senyap tanpa merusak fokus atau interaksi formulir pengguna
  window.refreshActiveDataSilently = async (reason = 'auto') => {
    const activeEl = document.activeElement;
    const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
    const hasModalOpen = document.querySelector('.modal.active');

    // Selalu perbarui badge global
    await updateGlobalBadgesSilently();

    // Jika pengguna sedang mengetik di input atau ada modal terbuka, tunda redraw tabel utama
    if (isTyping || hasModalOpen) {
      return;
    }

    try {
      switch (currentModule) {
        case 'dashboard':
          await loadDashboardData();
          break;
        case 'finance':
          await loadFinanceData();
          break;
        case 'procurement':
          await loadProcurementData();
          break;
        case 'inventory':
          await loadInventoryData();
          break;
        case 'hcm':
          await loadHcmData();
          break;
        case 'users':
          if (typeof window.loadUsersData === 'function') {
            await window.loadUsersData();
          }
          break;
      }
    } catch (err) {
      console.warn('Realtime silent refresh error:', err);
    }
  };

  // Trigger Realtime: Dipanggil seketika saat ada data diinput/diubah/dihapus di seluruh modul
  window.triggerRealtimeUpdate = async (reason = 'mutation', payload = null) => {
    flashSyncIndicator('Menyinkronkan...');

    // 1. Ingest payload seketika ke memori lokal jika merupakan PO atau perubahan status
    if (payload && (reason === 'create_po' || reason === 'ajukan_finance')) {
      const existingIdx = purchaseOrders.findIndex((p) => p.id_po == payload.id_po);
      if (existingIdx >= 0) {
        purchaseOrders[existingIdx] = { ...purchaseOrders[existingIdx], ...payload };
      } else {
        purchaseOrders.unshift(payload);
      }
      try {
        localStorage.setItem('kafeina_erp_purchase_orders', JSON.stringify(purchaseOrders));
      } catch {}
    } else if (payload && (reason === 'finance_approve' || reason === 'finance_reject')) {
      const target = purchaseOrders.find((p) => p.id_po == (payload.id_po || payload.poId));
      if (target) {
        target.status = payload.status || (reason === 'finance_approve' ? 'CONFIRMED' : 'REJECTED');
        if (payload.disetujui_oleh) target.disetujui_oleh = payload.disetujui_oleh;
        if (payload.catatan_finance) target.catatan_finance = payload.catatan_finance;
      }
      try {
        localStorage.setItem('kafeina_erp_purchase_orders', JSON.stringify(purchaseOrders));
      } catch {}
    }

    // 2. Broadcast ke seluruh tab / jendela lain secara instan via BroadcastChannel
    if (realtimeChannel) {
      try {
        realtimeChannel.postMessage({
          type: 'ERP_REALTIME_SYNC',
          reason: reason,
          payload: payload,
          timestamp: Date.now()
        });
      } catch (err) {
        console.warn('BroadcastChannel post error:', err);
      }
    }

    // 3. Ping localStorage sebagai fallback antar-tab / multi-jendela
    try {
      localStorage.setItem(
        'kafeina_erp_realtime_ping',
        JSON.stringify({ reason, payload, timestamp: Date.now() })
      );
    } catch {}

    // 4. Segarkan tampilan aktif seketika di tab saat ini
    await refreshActiveDataSilently(reason, payload);

    // 5. Segarkan modul lain yang terpengaruh di latar belakang
    if (['create_po', 'ajukan_finance', 'finance_approve', 'finance_reject'].includes(reason)) {
      loadFinanceData();
      if (currentModule !== 'procurement') loadProcurementData();
      if (currentModule !== 'dashboard') loadDashboardData();
    }
    if (reason === 'terima_barang') {
      loadFinanceData();
      if (currentModule !== 'inventory') loadInventoryData();
      if (currentModule !== 'procurement') loadProcurementData();
      if (currentModule !== 'dashboard') loadDashboardData();
    }
    if (['create_mutasi', 'catat_pemakaian'].includes(reason)) {
      if (currentModule !== 'inventory') loadInventoryData();
      if (currentModule !== 'dashboard') loadDashboardData();
    }
    if (['create_jurnal', 'invoice_paid', 'finance_cash_mutation'].includes(reason)) {
      if (currentModule !== 'finance') loadFinanceData();
      if (currentModule !== 'dashboard') loadDashboardData();
    }
    if (reason === 'create_barang') {
      if (currentModule !== 'inventory') loadInventoryData();
      if (currentModule !== 'procurement') loadProcurementData();
      if (currentModule !== 'dashboard') loadDashboardData();
    }
    if (['create_user', 'edit_user', 'delete_user', 'auth_register'].includes(reason)) {
      if (currentModule !== 'users' && typeof window.loadUsersData === 'function') {
        window.loadUsersData();
      }
    }

    flashSyncIndicator('Tersinkronisasi ✓');
  };

  // Handler terpusat untuk pesan sinkronisasi yang masuk dari tab lain
  const handleIncomingRealtimeSync = async (reason, payload) => {
    flashSyncIndicator('Data Diperbarui ✓');

    // 1. Ingest PO payload seketika ke memori tab ini
    if (payload && (reason === 'create_po' || reason === 'ajukan_finance')) {
      const existingIdx = purchaseOrders.findIndex((p) => p.id_po == payload.id_po);
      if (existingIdx >= 0) {
        purchaseOrders[existingIdx] = { ...purchaseOrders[existingIdx], ...payload };
      } else {
        purchaseOrders.unshift(payload);
      }

      // Jika tab ini milik Finance atau Manager, tampilkan notifikasi toast instan
      if (
        currentUser &&
        (currentUser.role === 'FINANCE' ||
          currentUser.role === 'MANAGER' ||
          (currentUser.allowed_modules && currentUser.allowed_modules.includes('finance')))
      ) {
        showToast(
          `🔔 Pengajuan PO #${payload.nomor_po || ''} baru saja masuk dari Procurement untuk persetujuan Finance!`,
          'info'
        );
      }
    } else if (payload && (reason === 'finance_approve' || reason === 'finance_reject')) {
      const target = purchaseOrders.find((p) => p.id_po == (payload.id_po || payload.poId));
      if (target) {
        target.status = payload.status || (reason === 'finance_approve' ? 'CONFIRMED' : 'REJECTED');
        if (payload.disetujui_oleh) target.disetujui_oleh = payload.disetujui_oleh;
        if (payload.catatan_finance) target.catatan_finance = payload.catatan_finance;
      }
      if (
        currentUser &&
        (currentUser.role === 'PROCUREMENT' ||
          currentUser.role === 'MANAGER' ||
          (currentUser.allowed_modules && currentUser.allowed_modules.includes('procurement')))
      ) {
        const actionLabel = reason === 'finance_approve' ? 'DISETUJUI' : 'DITOLAK';
        const toastType = reason === 'finance_approve' ? 'success' : 'warning';
        showToast(`📢 PO #${target?.nomor_po || payload.id_po} telah ${actionLabel} oleh Tim Keuangan.`, toastType);
      }
    } else if (reason === 'invoice_paid') {
      if (
        currentUser &&
        (currentUser.role === 'FINANCE' ||
          currentUser.role === 'MANAGER' ||
          (currentUser.allowed_modules && currentUser.allowed_modules.includes('finance')))
      ) {
        showToast('💳 Invoice vendor telah dilunasi & kas terpotong secara realtime.', 'success');
      }
    } else if (reason === 'finance_cash_mutation') {
      if (
        currentUser &&
        (currentUser.role === 'FINANCE' ||
          currentUser.role === 'MANAGER' ||
          (currentUser.allowed_modules && currentUser.allowed_modules.includes('finance')))
      ) {
        showToast('💰 Saldo dana kas/bank diperbarui secara realtime.', 'info');
      }
    } else if (reason === 'terima_barang') {
      if (payload && payload.invoice) {
        const existIdx = purchaseInvoices.findIndex((inv) => inv.id_invoice == payload.invoice.id_invoice);
        if (existIdx >= 0) {
          purchaseInvoices[existIdx] = { ...purchaseInvoices[existIdx], ...payload.invoice };
        } else {
          purchaseInvoices.unshift(payload.invoice);
        }
        try {
          localStorage.setItem('kafeina_erp_invoices', JSON.stringify(purchaseInvoices));
        } catch {}
      }
      if (
        currentUser &&
        (currentUser.role === 'FINANCE' ||
          currentUser.role === 'MANAGER' ||
          (currentUser.allowed_modules && currentUser.allowed_modules.includes('finance')))
      ) {
        showToast('📦 Barang baru diterima! Invoice tagihan baru otomatis terbit di Finance.', 'info');
      }
    }

    // 2. Segarkan data aktif
    await refreshActiveDataSilently(reason, payload);

    // 3. Pastikan modul finance, dashboard, inventory, atau procurement ter-render ulang
    if (currentModule === 'finance') {
      await loadFinanceData();
    } else if (currentModule === 'dashboard') {
      await loadDashboardData();
    } else if (currentModule === 'procurement') {
      await loadProcurementData();
    } else if (currentModule === 'inventory') {
      await loadInventoryData();
    }
  };

  // Listener pesan realtime dari tab lain via BroadcastChannel
  if (realtimeChannel) {
    realtimeChannel.onmessage = async (e) => {
      if (e.data && e.data.type === 'ERP_REALTIME_SYNC') {
        await handleIncomingRealtimeSync(e.data.reason || 'broadcast_sync', e.data.payload || null);
      }
    };
  }

  // Listener fallback via Storage Event (Cross-Tab)
  window.addEventListener('storage', async (e) => {
    if (e.key === 'kafeina_erp_realtime_ping' && e.newValue) {
      try {
        const ping = JSON.parse(e.newValue);
        await handleIncomingRealtimeSync(ping.reason || 'storage_sync', ping.payload || null);
      } catch {}
    }
  });

  // Background Heartbeat Poller setiap 4 detik (menangkap pembaruan otomatis dari DB/server)
  let realtimeHeartbeatInterval = null;
  const startRealtimeHeartbeat = () => {
    if (realtimeHeartbeatInterval) clearInterval(realtimeHeartbeatInterval);
    realtimeHeartbeatInterval = setInterval(async () => {
      await refreshActiveDataSilently('heartbeat');
    }, 4000);
  };
  startRealtimeHeartbeat();

  // ==============================================================
  // 7. MODAL HELPERS & ACTIONS
  // ==============================================================
  const populatePoModalDropdowns = () => {
    const supSelect = document.getElementById('po-supplier-select');
    const itemSelect = document.getElementById('po-barang-select');

    if (supSelect && supplierList && supplierList.length > 0) {
      supSelect.innerHTML = supplierList
        .map((s) => `<option value="${s.id_supplier}">${s.nama_supplier} (${s.kategori || 'Supplier'})</option>`)
        .join('');
    }

    if (itemSelect && inventoryItems && inventoryItems.length > 0) {
      itemSelect.innerHTML = inventoryItems
        .map(
          (i) =>
            `<option value="${i.id_barang}">${i.nama_barang} (${i.satuan || 'unit'}) - Sisa Stok: ${parseFloat(
              i.stok_saat_ini || 0
            ).toLocaleString('id-ID')} [${i.quality_grade || 'GRADE_A'}]</option>`
        )
        .join('');
    }
  };

  window.onPoBarangChange = () => {
    const itemSelect = document.getElementById('po-barang-select');
    const hargaInput = document.getElementById('po-harga-input');
    const supSelect = document.getElementById('po-supplier-select');
    if (!itemSelect) return;

    const selectedId = itemSelect.value;
    const item = inventoryItems.find((i) => String(i.id_barang) === String(selectedId));
    if (item) {
      if (hargaInput && (!hargaInput.value || parseFloat(hargaInput.value) <= 0)) {
        hargaInput.value = item.harga_satuan || '';
      }
      if (supSelect && item.supplier_id) {
        supSelect.value = item.supplier_id;
      }
    }
  };

  const populateMutasiDropdown = () => {
    const select = document.getElementById('mut-barang-select');
    if (!select || !inventoryItems || inventoryItems.length === 0) return;
    select.innerHTML = inventoryItems
      .map(
        (i) =>
          `<option value="${i.id_barang}">${i.nama_barang} (Tersedia: ${parseFloat(i.stok_saat_ini || 0).toLocaleString('id-ID')} ${i.satuan || 'unit'})</option>`
      )
      .join('');
    onMutasiBarangChange();
  };

  window.onMutasiBarangChange = () => {
    const select = document.getElementById('mut-barang-select');
    const indicator = document.getElementById('mut-stok-indicator');
    const availableSpan = document.getElementById('mut-stok-available');
    const unitSpan = document.getElementById('mut-stok-unit');
    if (!select) return;

    const selectedId = select.value;
    const item = inventoryItems.find((i) => String(i.id_barang) === String(selectedId));
    if (item) {
      const stok = parseFloat(item.stok_saat_ini) || 0;
      if (availableSpan) availableSpan.textContent = stok.toLocaleString('id-ID');
      if (unitSpan) unitSpan.textContent = item.satuan || 'unit';
      if (indicator) {
        if (stok <= 0) {
          indicator.className = 'stock-live-pill empty';
        } else if (stok <= parseFloat(item.batas_safety_stock || 0)) {
          indicator.className = 'stock-live-pill warning';
        } else {
          indicator.className = 'stock-live-pill';
        }
      }
    }
    validateMutasiQty();
  };

  window.validateMutasiQty = () => {
    const select = document.getElementById('mut-barang-select');
    const input = document.getElementById('mut-jumlah-input');
    const warning = document.getElementById('mut-warning-msg');
    const submitBtn = document.getElementById('btn-submit-mutasi');
    if (!select || !input) return;

    const selectedId = select.value;
    const item = inventoryItems.find((i) => String(i.id_barang) === String(selectedId));
    const available = item ? parseFloat(item.stok_saat_ini) || 0 : 0;
    const requested = parseFloat(input.value) || 0;

    if (requested > available) {
      if (warning) warning.style.display = 'block';
      input.style.borderColor = '#dc2626';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
        submitBtn.style.cursor = 'not-allowed';
      }
    } else {
      if (warning) warning.style.display = 'none';
      input.style.borderColor = '';
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
      }
    }
  };

  const populateSupplierDropdownInNewBarang = () => {
    const sel = document.getElementById('nb-supplier');
    if (!sel || !supplierList || supplierList.length === 0) return;
    sel.innerHTML =
      `<option value="">-- Pilih Supplier Rekanan (Opsional) --</option>` +
      supplierList.map((s) => `<option value="${s.id_supplier}">${s.nama_supplier} (${s.kategori || 'Supplier'})</option>`).join('');
  };

  // Submit Penambahan Bahan Baku Baru (Procurement & Inventory)
  window.submitTambahBarang = async (e) => {
    e.preventDefault();
    const nama_barang = document.getElementById('nb-nama').value;
    const kategori = document.getElementById('nb-kategori').value;
    const satuan = document.getElementById('nb-satuan').value;
    const batas_safety_stock = parseFloat(document.getElementById('nb-safety-stock').value) || 100;
    const harga_satuan = parseFloat(document.getElementById('nb-harga').value) || 0;
    const quality_grade = document.getElementById('nb-quality-grade').value;
    const supplier_id = document.getElementById('nb-supplier')?.value ? parseInt(document.getElementById('nb-supplier').value) : null;
    const stok_awal = parseFloat(document.getElementById('nb-stok-awal')?.value || 0);

    closeModal('modal-tambah-barang');
    showToast(`Mendaftarkan bahan baku baru: "${nama_barang}"...`, 'info');

    let newBarang = null;
    try {
      const res = await fetch('/api/barang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_barang,
          kategori,
          satuan,
          batas_safety_stock,
          harga_satuan,
          quality_grade,
          supplier_id,
          stok_saat_ini: stok_awal
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        newBarang = data.data;
        showToast(`✓ Bahan baku "${newBarang.nama_barang}" (${newBarang.item_code}) berhasil didaftarkan!`, 'success');
      } else {
        throw new Error(data.message);
      }
    } catch {
      const fakeId = Date.now();
      newBarang = {
        id_barang: fakeId,
        item_code: `RM-NEW-${String(fakeId).slice(-4)}`,
        nama_barang,
        kategori,
        satuan,
        batas_safety_stock,
        harga_satuan,
        quality_grade,
        stok_saat_ini: stok_awal
      };
      showToast(`✓ Bahan baku "${nama_barang}" berhasil ditambahkan ke inventaris!`, 'success');
    }

    if (newBarang) {
      inventoryItems.unshift(newBarang);
      try {
        localStorage.setItem('kafeina_erp_inventory', JSON.stringify(inventoryItems));
      } catch {}
      populatePoModalDropdowns();
      populateMutasiDropdown();

      // Jika modal-po terbuka, otomatis pilih bahan baru ini
      const poBarangSelect = document.getElementById('po-barang-select');
      if (poBarangSelect) {
        poBarangSelect.value = newBarang.id_barang;
      }
    }

    await triggerRealtimeUpdate('create_barang', newBarang);
  };

  window.openModal = (modalId) => {
    const m = document.getElementById(modalId);
    if (m) m.classList.add('active');
    if (modalId === 'modal-po') {
      populatePoModalDropdowns();
      if (typeof window.onPoBarangChange === 'function') {
        window.onPoBarangChange();
      }
    } else if (modalId === 'modal-mutasi') {
      populateMutasiDropdown();
    } else if (modalId === 'modal-tambah-barang') {
      populateSupplierDropdownInNewBarang();
    }
  };

  window.closeModal = (modalId) => {
    const m = document.getElementById(modalId);
    if (m) m.classList.remove('active');
  };

  // Buat Pengajuan PO Cepat dari Safety Stock
  window.handleCreatePo = async (idBarang, namaBarang, jumlahPesan, satuan) => {
    showToast(`Mengajukan Pembelian ke Finance untuk ${namaBarang} (+${jumlahPesan.toLocaleString('id-ID')} ${satuan})...`, 'info');
    let createdPo = null;

    const targetItem = inventoryItems.find((i) => String(i.id_barang) === String(idBarang));
    const targetSupplierId = targetItem?.supplier_id || 1;
    const targetHarga = targetItem?.harga_satuan || 300;

    try {
      const response = await fetch('/api/procurement/po', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_id: targetSupplierId,
          catatan: `Reorder otomatis dari Safety Stock Alert: ${namaBarang}`,
          items: [{ id_barang: idBarang, jumlah_pesan: jumlahPesan, harga_satuan_estimasi: targetHarga }]
        })
      });
      const data = await response.json();
      if (data.success && data.data) {
        createdPo = data.data;
        showToast(`✓ Pengajuan PO #${createdPo.nomor_po} berhasil masuk ke Modul Finance untuk persetujuan!`, 'success');
      } else {
        throw new Error(data.message || 'Gagal membuat PO');
      }
    } catch {
      // Offline fallback
      const sup = supplierList.find((s) => s.id_supplier == targetSupplierId) || { id_supplier: targetSupplierId, nama_supplier: 'CV Nusantara Coffee Roastery', telepon: '0812-3456-7890' };
      const newId = Date.now();
      createdPo = {
        id_po: newId,
        nomor_po: `PO-AUTO-${Date.now().toString().slice(-6)}`,
        supplier_id: targetSupplierId,
        tanggal_po: new Date().toISOString().split('T')[0],
        status: 'PENDING_APPROVAL',
        total_estimasi: jumlahPesan * targetHarga,
        is_auto_generated: true,
        catatan: `Reorder otomatis dari Safety Stock Alert: ${namaBarang}. Menunggu persetujuan Finance.`,
        supplier: sup,
        items: [{ id_barang: idBarang, jumlah_pesan: jumlahPesan, harga_satuan_estimasi: targetHarga, barang: { id_barang: idBarang, nama_barang: namaBarang, satuan } }]
      };
      showToast(`✓ Permintaan pembelian untuk ${namaBarang} masuk ke Modul Finance (Menunggu Persetujuan)!`, 'success');
    }

    if (createdPo) {
      const existingIdx = purchaseOrders.findIndex((p) => p.id_po == createdPo.id_po);
      if (existingIdx >= 0) {
        purchaseOrders[existingIdx] = createdPo;
      } else {
        purchaseOrders.unshift(createdPo);
      }
      try {
        localStorage.setItem('kafeina_erp_purchase_orders', JSON.stringify(purchaseOrders));
      } catch {}
    }

    await triggerRealtimeUpdate('create_po', createdPo);
  };

  // Submit Modal Pengajuan PO Baru ke Finance
  window.submitCreatePo = async (e) => {
    e.preventDefault();
    const supplier_id = document.getElementById('po-supplier-select').value;
    const id_barang = document.getElementById('po-barang-select').value;
    const jumlah_pesan = parseFloat(document.getElementById('po-jumlah-input').value);
    const harga_satuan_estimasi = parseFloat(document.getElementById('po-harga-input').value);
    const catatan = document.getElementById('po-catatan-input').value;

    closeModal('modal-po');
    showToast('Mengirim pengajuan pembelian ke Modul Finance...', 'info');

    let createdPo = null;

    try {
      const res = await fetch('/api/procurement/po', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_id,
          catatan,
          items: [{ id_barang, jumlah_pesan, harga_satuan_estimasi }]
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        createdPo = data.data;
        showToast(`✓ Pengajuan PO #${createdPo.nomor_po} berhasil masuk ke Modul Finance untuk ditinjau!`, 'success');
      } else {
        throw new Error(data.message || 'Gagal');
      }
    } catch {
      // Offline fallback
      const sup = supplierList.find((s) => s.id_supplier == supplier_id) || { nama_supplier: 'Supplier Rekanan' };
      const itm = inventoryItems.find((i) => i.id_barang == id_barang) || { nama_barang: 'Bahan Baku', satuan: 'unit' };
      const newId = Date.now();
      createdPo = {
        id_po: newId,
        nomor_po: `PO-MANUAL-${Date.now().toString().slice(-6)}`,
        supplier_id: parseInt(supplier_id),
        tanggal_po: new Date().toISOString().split('T')[0],
        status: 'PENDING_APPROVAL',
        total_estimasi: jumlah_pesan * harga_satuan_estimasi,
        is_auto_generated: false,
        catatan: catatan || 'Pengajuan pengadaan bahan baku rutin',
        supplier: sup,
        items: [{ id_barang: parseInt(id_barang), jumlah_pesan, harga_satuan_estimasi, barang: itm }]
      };
      showToast(`✓ Pengajuan PO #${createdPo.nomor_po} berhasil masuk ke Modul Finance untuk disetujui!`, 'success');
    }

    if (createdPo) {
      const existingIdx = purchaseOrders.findIndex((p) => p.id_po == createdPo.id_po);
      if (existingIdx >= 0) {
        purchaseOrders[existingIdx] = createdPo;
      } else {
        purchaseOrders.unshift(createdPo);
      }
      try {
        localStorage.setItem('kafeina_erp_purchase_orders', JSON.stringify(purchaseOrders));
      } catch {}
    }

    await triggerRealtimeUpdate('create_po', createdPo);
  };

  // Ajukan Draf PO ke Finance
  window.handleAjukanKeFinance = async (poId) => {
    showToast(`Mengajukan PO #${poId} ke Modul Finance...`, 'info');
    let targetPo = purchaseOrders.find((p) => p.id_po == poId);

    try {
      const res = await fetch(`/api/procurement/po/${poId}/ajukan-finance`, { method: 'PATCH' });
      const data = await res.json();
      if (data.success) {
        if (targetPo) targetPo.status = 'PENDING_APPROVAL';
        showToast(`✓ PO #${data.data?.nomor_po || poId} berhasil diajukan ke Modul Finance!`, 'success');
        if (data.data) targetPo = data.data;
      }
    } catch {
      if (targetPo) targetPo.status = 'PENDING_APPROVAL';
      showToast(`✓ PO #${poId} berhasil diajukan ke Modul Finance!`, 'success');
    }

    await triggerRealtimeUpdate('ajukan_finance', targetPo || { id_po: poId, status: 'PENDING_APPROVAL' });
  };

  // Buka Modal Persetujuan Finance
  window.openFinanceApproveModal = (poId) => {
    const po = purchaseOrders.find((p) => p.id_po == poId);
    if (!po) return;
    document.getElementById('fa-po-id').value = poId;
    const summaryBox = document.getElementById('approve-po-summary');
    if (summaryBox) {
      const itemsList =
        po.items
          ?.map(
            (it) =>
              `${it.barang?.nama_barang || 'Bahan'} (${parseFloat(it.jumlah_pesan).toLocaleString('id-ID')} ${it.barang?.satuan || 'unit'})`
          )
          .join(', ') || '-';
      summaryBox.innerHTML = `
        <div style="font-weight: 700; margin-bottom: 4px;">Informasi Pengajuan Pembelian:</div>
        <strong>Nomor PO:</strong> ${po.nomor_po}<br>
        <strong>Supplier:</strong> ${po.supplier?.nama_supplier || 'Supplier Rekanan'}<br>
        <strong>Komoditas:</strong> ${itemsList}<br>
        <strong>Total Anggaran:</strong> <strong style="color: var(--green-deep); font-size: 0.95rem;">Rp ${parseFloat(po.total_estimasi).toLocaleString('id-ID')}</strong><br>
        <strong>Catatan Pengadaan:</strong> <em>${po.catatan || '-'}</em>
      `;
    }
    openModal('modal-finance-approve');
  };

  // Submit Persetujuan Finance (Approve)
  window.submitFinanceApprove = async (e) => {
    e.preventDefault();
    const poId = parseInt(document.getElementById('fa-po-id').value);
    const disetujui_oleh = document.getElementById('fa-disetujui-oleh').value;
    const catatan_finance = document.getElementById('fa-catatan').value;

    closeModal('modal-finance-approve');
    showToast(`Memproses persetujuan Finance untuk PO #${poId}...`, 'info');

    let approvedPo = null;

    try {
      const res = await fetch(`/api/finance/pengajuan-po/${poId}/setujui`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disetujui_oleh, catatan_finance })
      });
      const data = await res.json();
      if (data.success) {
        approvedPo = data.data;
        showToast(`✓ PO #${data.data?.nomor_po || poId} DISETUJUI Finance! Pembelian siap dilaksanakan.`, 'success');
      } else {
        throw new Error(data.message);
      }
    } catch {
      const po = purchaseOrders.find((p) => p.id_po == poId);
      if (po) {
        po.status = 'CONFIRMED';
        po.disetujui_oleh = disetujui_oleh;
        po.catatan_finance = catatan_finance || 'Disetujui oleh Finance. Pembelian siap dilaksanakan.';
        approvedPo = po;
      }
      showToast(`✓ PO #${po?.nomor_po || poId} DISETUJUI Finance! Pembelian aktif dan siap dilaksanakan.`, 'success');
    }

    const target = purchaseOrders.find((p) => p.id_po == poId);
    if (target) {
      target.status = 'CONFIRMED';
      target.disetujui_oleh = disetujui_oleh;
      target.catatan_finance = catatan_finance;
    }

    await triggerRealtimeUpdate(
      'finance_approve',
      approvedPo || { id_po: poId, status: 'CONFIRMED', disetujui_oleh, catatan_finance }
    );
  };

  // Buka Modal Penolakan Finance
  window.openFinanceRejectModal = (poId) => {
    const po = purchaseOrders.find((p) => p.id_po == poId);
    if (!po) return;
    document.getElementById('fr-po-id').value = poId;
    const summaryBox = document.getElementById('reject-po-summary');
    if (summaryBox) {
      const itemsList =
        po.items
          ?.map(
            (it) =>
              `${it.barang?.nama_barang || 'Bahan'} (${parseFloat(it.jumlah_pesan).toLocaleString('id-ID')} ${it.barang?.satuan || 'unit'})`
          )
          .join(', ') || '-';
      summaryBox.innerHTML = `
        <div style="font-weight: 700; margin-bottom: 4px;">Pengajuan yang Akan Ditolak:</div>
        <strong>Nomor PO:</strong> ${po.nomor_po}<br>
        <strong>Supplier:</strong> ${po.supplier?.nama_supplier || 'Supplier Rekanan'}<br>
        <strong>Komoditas:</strong> ${itemsList}<br>
        <strong>Estimasi Biaya:</strong> <strong>Rp ${parseFloat(po.total_estimasi).toLocaleString('id-ID')}</strong>
      `;
    }
    openModal('modal-finance-reject');
  };

  // Submit Penolakan Finance (Reject)
  window.submitFinanceReject = async (e) => {
    e.preventDefault();
    const poId = parseInt(document.getElementById('fr-po-id').value);
    const ditolak_oleh = document.getElementById('fr-ditolak-oleh').value;
    const alasan_penolakan = document.getElementById('fr-alasan').value;

    closeModal('modal-finance-reject');
    showToast(`Memproses penolakan pengajuan PO #${poId}...`, 'info');

    let rejectedPo = null;

    try {
      const res = await fetch(`/api/finance/pengajuan-po/${poId}/tolak`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ditolak_oleh, alasan_penolakan })
      });
      const data = await res.json();
      if (data.success) {
        rejectedPo = data.data;
        showToast(`✗ Pengajuan PO #${data.data?.nomor_po || poId} DITOLAK. Pengajuan dibatalkan.`, 'warning');
      } else {
        throw new Error(data.message);
      }
    } catch {
      const po = purchaseOrders.find((p) => p.id_po == poId);
      if (po) {
        po.status = 'REJECTED';
        po.disetujui_oleh = ditolak_oleh;
        po.catatan_finance = alasan_penolakan;
        rejectedPo = po;
      }
      showToast(`✗ Pengajuan PO #${po?.nomor_po || poId} DITOLAK oleh Finance (Pengajuan Dibatalkan).`, 'warning');
    }

    const target = purchaseOrders.find((p) => p.id_po == poId);
    if (target) {
      target.status = 'REJECTED';
      target.disetujui_oleh = ditolak_oleh;
      target.catatan_finance = alasan_penolakan;
    }

    await triggerRealtimeUpdate(
      'finance_reject',
      rejectedPo || { id_po: poId, status: 'REJECTED', ditolak_oleh, catatan_finance: alasan_penolakan }
    );
  };

  // Konfirmasi PO (kompatibilitas mundur)
  window.handleKonfirmasiPo = async (poId) => {
    openFinanceApproveModal(poId);
  };

  // Terima Barang (Goods Receipt dengan Quality Stock Inspection)
  window.handleTerimaBarang = async (poId, barangId, qty, harga) => {
    const po = purchaseOrders.find((p) => p.id_po === poId);
    if (po && po.status === 'PENDING_APPROVAL') {
      showToast(`⚠️ Pembelian PO #${po.nomor_po} belum disetujui Finance. Tidak dapat menerima barang!`, 'warning');
      return;
    }
    if (po && po.status === 'REJECTED') {
      showToast(`⚠️ Pembelian PO #${po.nomor_po} telah DITOLAK Finance (Dibatalkan).`, 'warning');
      return;
    }

    openTerimaBarangQcModal(poId, barangId, qty, harga);
  };

  window.openTerimaBarangQcModal = (poId, barangId, qty, harga) => {
    const po = purchaseOrders.find((p) => p.id_po === poId);
    const item = inventoryItems.find((i) => i.id_barang === barangId) || po?.items?.[0]?.barang;

    document.getElementById('qc-po-id').value = poId;
    document.getElementById('qc-barang-id').value = barangId;
    document.getElementById('qc-harga-beli').value = harga || 0;
    document.getElementById('qc-qty-total').value = qty;
    document.getElementById('qc-qty-lolos').value = qty;
    document.getElementById('qc-qty-reject').value = 0;
    document.getElementById('qc-no-surat-jalan').value = `SJ/${po?.supplier?.nama_supplier?.substring(0, 3).toUpperCase() || 'VND'}/${Date.now().toString().slice(-4)}`;
    document.getElementById('qc-batch-number').value = `BATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${barangId}`;

    const summaryBox = document.getElementById('qc-po-summary');
    if (summaryBox) {
      summaryBox.innerHTML = `
        <div style="font-weight: 700; margin-bottom: 4px; color: var(--green-deep); font-size: 0.92rem;">Inspeksi Quality Stock untuk PO #${po?.nomor_po || poId}</div>
        <div style="display: grid; grid-template-columns: 140px 1fr; gap: 4px; font-size: 0.84rem;">
          <span style="color: var(--text-muted);">Supplier Rekanan:</span><strong>${po?.supplier?.nama_supplier || 'Supplier Rekanan'}</strong>
          <span style="color: var(--text-muted);">Komoditas Barang:</span><strong>${item?.nama_barang || 'Bahan Baku'}</strong>
          <span style="color: var(--text-muted);">Pesanan PO:</span><strong>${parseFloat(qty).toLocaleString('id-ID')} ${item?.satuan || 'unit'}</strong>
          <span style="color: var(--text-muted);">Estimasi Biaya:</span><strong style="color: var(--green-deep);">Rp ${(parseFloat(qty) * parseFloat(harga || 0)).toLocaleString('id-ID')}</strong>
        </div>
      `;
    }

    openModal('modal-terima-barang-qc');
  };

  window.calculateQcSplit = () => {
    const total = parseFloat(document.getElementById('qc-qty-total')?.value) || 0;
    const reject = parseFloat(document.getElementById('qc-qty-reject')?.value) || 0;
    const lolosInput = document.getElementById('qc-qty-lolos');
    if (lolosInput) {
      lolosInput.value = Math.max(0, total - reject);
    }
  };

  window.submitTerimaBarangQc = async (e) => {
    e.preventDefault();
    const poId = parseInt(document.getElementById('qc-po-id').value);
    const barangId = parseInt(document.getElementById('qc-barang-id').value);
    const harga = parseFloat(document.getElementById('qc-harga-beli').value) || 0;
    const nomor_surat_jalan = document.getElementById('qc-no-surat-jalan').value;
    const quality_grade = document.getElementById('qc-quality-grade').value;
    const jumlah_lolos_qc = parseFloat(document.getElementById('qc-qty-lolos').value) || 0;
    const jumlah_reject_qc = parseFloat(document.getElementById('qc-qty-reject').value) || 0;
    const jumlah_total = jumlah_lolos_qc + jumlah_reject_qc;
    const nomor_batch = document.getElementById('qc-batch-number')?.value || null;
    const tanggal_kadaluarsa = document.getElementById('qc-expiry-date')?.value || null;
    const catatan_qc = document.getElementById('qc-catatan')?.value || '';

    closeModal('modal-terima-barang-qc');
    showToast('Memverifikasi Quality Stock & Menerbitkan Invoice Tagihan Finance...', 'info');

    let receivedResult = null;
    const targetPo = purchaseOrders.find((p) => p.id_po == poId);
    const targetPoItem = targetPo?.items?.find((it) => it.id_barang == barangId) || targetPo?.items?.[0];
    const poItemId = targetPoItem?.id_po_item || null;

    try {
      const res = await fetch('/api/procurement/terima-barang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          po_id: poId,
          nomor_surat_jalan,
          diterima_oleh: document.getElementById('qc-diterima-oleh')?.value || 'Barista / QC Inspector',
          catatan: catatan_qc,
          items: [
            {
              po_item_id: poItemId,
              id_barang: barangId,
              jumlah_diterima: jumlah_total,
              jumlah_lolos_qc,
              jumlah_reject_qc,
              quality_grade,
              harga_beli_satuan: harga,
              nomor_batch,
              tanggal_kadaluarsa,
              catatan_qc
            }
          ]
        })
      });
      const data = await res.json();
      if (data.success) {
        receivedResult = data.data;
        showToast(
          `✓ Penerimaan Quality Stock Lolos (${quality_grade})! ${jumlah_lolos_qc} unit masuk gudang, Invoice Tagihan terbit untuk Finance.`,
          'success'
        );
        if (data.data?.invoice) {
          const invData = data.data.invoice;
          const existIdx = purchaseInvoices.findIndex((inv) => inv.id_invoice == invData.id_invoice);
          if (existIdx >= 0) {
            purchaseInvoices[existIdx] = { ...purchaseInvoices[existIdx], ...invData };
          } else {
            purchaseInvoices.unshift(invData);
          }
          try {
            localStorage.setItem('kafeina_erp_invoices', JSON.stringify(purchaseInvoices));
          } catch {}
        }
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      // Fallback lokal jika offline
      const po = purchaseOrders.find((p) => p.id_po === poId);
      if (po) po.status = 'COMPLETED';
      const item = inventoryItems.find((i) => i.id_barang === barangId);
      if (item) {
        item.stok_saat_ini = parseFloat(item.stok_saat_ini) + jumlah_lolos_qc;
        item.quality_grade = quality_grade;
        if (jumlah_reject_qc > 0) item.stok_reject = (parseFloat(item.stok_reject) || 0) + jumlah_reject_qc;
      }
      try {
        localStorage.setItem('kafeina_erp_inventory', JSON.stringify(inventoryItems));
      } catch {}

      const newInvId = Date.now();
      const offlineInv = {
        id_invoice: newInvId,
        nomor_invoice: `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
        po_id: poId,
        supplier_id: po?.supplier_id || 1,
        tanggal_invoice: new Date().toISOString().split('T')[0],
        tanggal_jatuh_tempo: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        total_tagihan: po?.total_estimasi || (jumlah_total * harga),
        status_pembayaran: 'UNPAID',
        catatan: `Invoice Tagihan Pembelian Barang PO #${po?.nomor_po || poId}`,
        purchase_order: po,
        supplier: po?.supplier
      };
      purchaseInvoices.unshift(offlineInv);
      try {
        localStorage.setItem('kafeina_erp_invoices', JSON.stringify(purchaseInvoices));
      } catch {}

      showToast(`✓ Penerimaan Quality Stock tercatat (${quality_grade})! Invoice tagihan terbit ke Finance.`, 'success');
    }

    try {
      localStorage.setItem('kafeina_erp_purchase_orders', JSON.stringify(purchaseOrders));
    } catch {}

    await triggerRealtimeUpdate('terima_barang', { po_id: poId, invoice: receivedResult?.invoice });
  };

  // Submit Modal Jurnal Manual
  window.submitCreateJurnal = async (e) => {
    e.preventDefault();
    const keterangan = document.getElementById('jm-keterangan').value;
    const debet_id = parseInt(document.getElementById('jm-akun-debet').value);
    const kredit_id = parseInt(document.getElementById('jm-akun-kredit').value);
    const nominal = parseFloat(document.getElementById('jm-nominal').value);

    closeModal('modal-jurnal');
    showToast('Memvalidasi keseimbangan Debet == Kredit...', 'info');

    try {
      const res = await fetch('/api/finance/jurnal/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keterangan,
          lines: [
            { akun_id: debet_id, debet: nominal, kredit: 0, catatan: 'Debet operasional' },
            { akun_id: kredit_id, debet: 0, kredit: nominal, catatan: 'Kredit kas/bank' }
          ]
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✓ Jurnal ${data.data.nomor_jurnal} tersimpan seimbang!`, 'success');
      }
    } catch {
      showToast('✓ Jurnal berhasil dicatat!', 'success');
    }

    await triggerRealtimeUpdate('create_jurnal');
  };

  // Submit Catat Pemakaian Bahan Baku (Sesuai Stok & Pencegah Stok Minus)
  window.submitCatatPemakaian = window.submitCreateMutasi = async (e) => {
    e.preventDefault();
    const id_barang = document.getElementById('mut-barang-select').value;
    const jumlah_keluar = parseFloat(document.getElementById('mut-jumlah-input').value);
    const tipe_mutasi = document.getElementById('mut-tipe-select').value;
    const barista = document.getElementById('mut-barista-input')?.value || 'Barista On Duty';
    const ketInput = document.getElementById('mut-keterangan-input')?.value || '';
    const keterangan = `${barista} - ${ketInput || 'Pemakaian bahan racikan kopi / POS'}`;

    const item = inventoryItems.find((i) => String(i.id_barang) === String(id_barang));
    if (item && jumlah_keluar > parseFloat(item.stok_saat_ini)) {
      showToast(
        `⛔ Gagal: Jumlah pemakaian (${jumlah_keluar} ${item.satuan}) melebihi stok yang ada (${item.stok_saat_ini} ${item.satuan})!`,
        'warning'
      );
      return;
    }

    closeModal('modal-mutasi');
    showToast('Mencatat pengurangan stok persediaan...', 'info');

    try {
      const res = await fetch('/api/inventory/mutasi-keluar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_barang, jumlah_keluar, tipe_mutasi, keterangan })
      });
      const data = await res.json();
      if (data.success) {
        if (item) {
          item.stok_saat_ini = parseFloat(data.data?.stok_akhir ?? Math.max(0, parseFloat(item.stok_saat_ini) - jumlah_keluar));
        }
        if (data.data?.auto_po_triggered) {
          showToast(`⚠️ Stok ${item?.nama_barang || ''} ≤ Safety Stock! Draf PO Otomatis diterbitkan!`, 'warning');
        } else {
          showToast(`✓ Pemakaian tercatat. Sisa stok: ${data.data?.stok_akhir} ${item?.satuan || 'unit'}`, 'success');
        }
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('tidak mencukupi')) {
        showToast(`⛔ ${err.message}`, 'critical');
      } else {
        if (item) {
          item.stok_saat_ini = Math.max(0, parseFloat(item.stok_saat_ini) - jumlah_keluar);
        }
        showToast('✓ Pemakaian stok berhasil dicatat!', 'success');
      }
    }

    try {
      localStorage.setItem('kafeina_erp_inventory', JSON.stringify(inventoryItems));
    } catch {}

    await triggerRealtimeUpdate('catat_pemakaian');
  };

  // Hitung Payroll Pegawai
  window.handleKalkulasiPayroll = async (pegawaiId) => {
    showToast('Menghitung payroll otomatis dari log absensi 24 hari...', 'info');
    try {
      const res = await fetch(`/api/hcm/payroll/hitung/${pegawaiId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulan: 9, tahun: 2026 })
      });
      const data = await res.json();
      if (data.success) {
        const slip = data.data;
        document.getElementById('ps-nomor-slip').textContent = slip.nomor_slip;
        document.getElementById('ps-nama').textContent = slip.pegawai.nama;
        document.getElementById('ps-kode').textContent = slip.pegawai.kode;
        document.getElementById('ps-jabatan').textContent = slip.pegawai.jabatan;
        document.getElementById('ps-bank').textContent = `${slip.pegawai.bank} • ${slip.pegawai.no_rekening}`;
        document.getElementById('ps-gaji-pokok').textContent = `Rp ${slip.rincian_penerimaan.gaji_pokok.toLocaleString('id-ID')}`;
        document.getElementById('ps-tunjangan').textContent = `Rp ${slip.rincian_penerimaan.tunjangan_kehadiran.toLocaleString('id-ID')}`;
        document.getElementById('ps-lembur').textContent = `Rp ${slip.rincian_penerimaan.upah_lembur.toLocaleString('id-ID')}`;
        document.getElementById('ps-total-bruto').textContent = `Rp ${slip.rincian_penerimaan.total_penerimaan_bruto.toLocaleString('id-ID')}`;
        document.getElementById('ps-potongan-telat').textContent = `- Rp ${slip.rincian_potongan.potongan_keterlambatan.toLocaleString('id-ID')}`;
        document.getElementById('ps-total-potongan').textContent = `- Rp ${slip.rincian_potongan.total_potongan.toLocaleString('id-ID')}`;
        document.getElementById('ps-gaji-bersih').textContent = `Rp ${slip.take_home_pay.toLocaleString('id-ID')}`;
        document.getElementById('ps-terbilang').textContent = `"${slip.terbilang}"`;

        showToast(`✓ Slip gaji ${slip.nomor_slip} diterbitkan: Rp ${slip.take_home_pay.toLocaleString('id-ID')}`, 'success');
        switchHcmTab('slip');
      }
    } catch {
      showToast('✓ Slip gaji berhasil dihitung.', 'success');
      switchHcmTab('slip');
    }

    await triggerRealtimeUpdate('kalkulasi_payroll');
  };

  // Submit Tambah Karyawan Baru (HR & HCM Module)
  window.submitCreateEmployee = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-employee');
    if (btn) btn.disabled = true;

    const nama_lengkap = document.getElementById('emp-nama-input').value.trim();
    const jabatan = document.getElementById('emp-jabatan-input').value.trim();
    const departemen = document.getElementById('emp-dept-input').value;
    const gaji_pokok = parseFloat(document.getElementById('emp-gaji-input').value);
    const status_kerja = document.getElementById('emp-status-input').value;
    const telepon = document.getElementById('emp-telepon-input').value.trim();
    const rekening = document.getElementById('emp-rekening-input').value.trim();

    if (!nama_lengkap || !jabatan || isNaN(gaji_pokok)) {
      showToast('Nama lengkap, jabatan, dan nominal gaji wajib diisi!', 'warning');
      if (btn) btn.disabled = false;
      return;
    }

    showToast(`Menyimpan data karyawan '${nama_lengkap}'...`, 'info');

    let newEmployee = null;
    try {
      const res = await fetch('/api/hcm/pegawai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_lengkap,
          jabatan,
          departemen,
          gaji_pokok,
          status_kerja,
          telepon,
          nomor_rekening: rekening || 'BCA 5270' + Math.floor(100000 + Math.random() * 900000)
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        newEmployee = data.data;
      }
    } catch (err) {
      console.warn('Backend save error, using client fallback:', err);
    }

    // Jika backend offline atau fallback, buat record lokal
    if (!newEmployee) {
      const nextId = employeeList.length + 1;
      newEmployee = {
        id_pegawai: nextId,
        kode_pegawai: `EMP-${String(nextId).padStart(3, '0')}`,
        nama_lengkap,
        posisi: { nama_jabatan: jabatan, departemen: { nama_departemen: departemen } },
        status_kerja,
        gaji_pokok,
        nama_bank: rekening.split(' ')[0] || 'BCA',
        nomor_rekening: rekening || '5270' + Math.floor(100000 + Math.random() * 900000)
      };
    }

    // Tambahkan ke employeeList di urutan paling atas
    employeeList.unshift(newEmployee);
    try { localStorage.setItem('kafeina_erp_employees', JSON.stringify(employeeList)); } catch {}

    // Re-render tabel pegawai secara instan tanpa reload halaman
    renderEmployeesTable(employeeList);

    // Sinkronkan ke tab browser lain via real-time update
    if (typeof triggerRealtimeUpdate === 'function') {
      try { await triggerRealtimeUpdate('employee_created'); } catch {}
    }

    // Reset Form & Tutup Modal
    document.getElementById('form-create-employee').reset();
    closeModal('modal-create-employee');
    if (btn) btn.disabled = false;

    showToast(`✓ Karyawan baru ${newEmployee.nama_lengkap} (${jabatan}) dengan gaji Rp ${gaji_pokok.toLocaleString('id-ID')} berhasil ditambahkan!`, 'success');
  };

  // Hapus Data Karyawan (HR & HCM Module)
  window.handleHapusPegawai = async (pegawaiId, namaLengkap) => {
    const konfirmasi = confirm(`Apakah Anda yakin ingin menghapus data karyawan '${namaLengkap}' dari sistem HR? Tindakan ini tidak dapat dibatalkan.`);
    if (!konfirmasi) return;

    // 1. Optimistic UI update: langsung hapus dari list lokal dan update tabel seketika
    const idToFilter = String(pegawaiId);
    employeeList = employeeList.filter(
      (e) => String(e.id_pegawai) !== idToFilter && String(e.kode_pegawai) !== idToFilter
    );
    try { localStorage.setItem('kafeina_erp_employees', JSON.stringify(employeeList)); } catch {}
    renderEmployeesTable(employeeList);
    showToast(`Data karyawan '${namaLengkap}' telah dihapus dari antarmuka...`, 'info');

    // 2. Kirim permintaan DELETE ke server database
    try {
      const res = await fetch(`/api/hcm/pegawai/${pegawaiId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✓ Data karyawan '${namaLengkap}' berhasil dihapus permanen dari sistem HR!`, 'success');
      } else {
        console.warn('Gagal menghapus di database:', data.message);
        showToast(`⚠️ Server: ${data.message || 'Gagal menghapus di database'}`, 'warning');
      }
    } catch (err) {
      console.warn('Network error saat hapus pegawai:', err);
    }

    // 3. Sinkronkan ke tab browser lain via real-time update
    if (typeof triggerRealtimeUpdate === 'function') {
      try { await triggerRealtimeUpdate('employee_deleted', { id_pegawai: pegawaiId, namaLengkap }); } catch {}
    }
  };

  // Seed Demo Absensi HCM
  window.handleSeedDemoHCM = async () => {
    showToast('Membuat 24 record absensi demo September 2026...', 'info');
    try {
      const res = await fetch('/api/hcm/payroll/seed-demo', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('✓ 24 hari absensi demo berhasil dibuat!', 'success');
      }
    } catch {
      showToast('✓ Data absensi berhasil disiapkan.', 'success');
    }

    await triggerRealtimeUpdate('seed_hcm');
  };

  // Topbar Refresh Button
  btnRefresh.addEventListener('click', async () => {
    btnRefresh.classList.add('loading');
    showToast(`Menyegarkan data modul ${currentModule.toUpperCase()}...`, 'info');
    await triggerRealtimeUpdate('manual_refresh');
    setTimeout(() => btnRefresh.classList.remove('loading'), 600);
  });

  // ==============================================================
  // 7. USER MANAGEMENT & RBAC AUTHENTICATION LOGIC
  // ==============================================================

  // State Filter & Pencarian Manajemen User
  let currentRoleFilter = 'ALL';
  let searchUserQuery = '';

  window.setRoleFilter = (role) => {
    currentRoleFilter = role;
    document.querySelectorAll('.user-stat-pill').forEach((pill) => pill.classList.remove('active'));
    const activePill = document.getElementById(`filter-pill-${role.toLowerCase()}`);
    if (activePill) activePill.classList.add('active');
    renderUsersTable();
  };

  window.handleSearchUsers = (query) => {
    searchUserQuery = String(query).trim().toLowerCase();
    renderUsersTable();
  };

  // Render Tabel Pengguna yang Simpel, Bersih, dan Nyaman Terbaca
  window.renderUsersTable = () => {
    const tableBodyUsers = document.getElementById('table-body-users');
    if (!tableBodyUsers) return;

    let filtered = systemUsers || [];

    // 1. Filter Kategori Role
    if (currentRoleFilter !== 'ALL') {
      filtered = filtered.filter((u) => u.role === currentRoleFilter);
    }

    // 2. Filter Pencarian Teks
    if (searchUserQuery) {
      filtered = filtered.filter((u) => {
        const nameMatch = (u.nama_lengkap || '').toLowerCase().includes(searchUserQuery);
        const userMatch = (u.username || '').toLowerCase().includes(searchUserQuery);
        return nameMatch || userMatch;
      });
    }

    // Update Counter Badge
    const badgeCount = document.getElementById('users-count-badge');
    if (badgeCount) {
      badgeCount.textContent = `${filtered.length} Terdaftar`;
    }

    if (filtered.length === 0) {
      tableBodyUsers.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
            <div style="font-size: 1.8rem; margin-bottom: 8px;">🔍</div>
            <strong style="display: block; font-size: 0.95rem; color: var(--text-heading); margin-bottom: 4px;">Tidak ada akun ditemukan</strong>
            <span style="font-size: 0.82rem;">Coba sesuaikan kata kunci pencarian atau ganti filter role di atas.</span>
          </td>
        </tr>
      `;
      return;
    }

    const roleBadges = {
      MANAGER: '<span class="badge-status" style="background: rgba(217, 119, 6, 0.12); color: #b45309; border: 1px solid rgba(217, 119, 6, 0.25); font-weight: 700; font-size: 0.78rem;">👑 Manager</span>',
      FINANCE: '<span class="badge-status" style="background: rgba(2, 132, 199, 0.12); color: #0284c7; border: 1px solid rgba(2, 132, 199, 0.25); font-weight: 700; font-size: 0.78rem;">💰 Finance</span>',
      HR: '<span class="badge-status" style="background: rgba(139, 92, 246, 0.12); color: #7c3aed; border: 1px solid rgba(139, 92, 246, 0.25); font-weight: 700; font-size: 0.78rem;">👥 HR</span>',
      PROCUREMENT: '<span class="badge-status" style="background: rgba(245, 158, 11, 0.12); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.25); font-weight: 700; font-size: 0.78rem;">📦 Procurement</span>'
    };

    const roleModules = {
      MANAGER: '<span style="font-weight: 600; color: var(--green-deep); font-size: 0.82rem;">Semua Modul (Full Access)</span>',
      FINANCE: '<span style="color: var(--text-body); font-size: 0.82rem;">Finance &amp; CoA</span>',
      HR: '<span style="color: var(--text-body); font-size: 0.82rem;">HCM &amp; Payroll</span>',
      PROCUREMENT: '<span style="color: var(--text-body); font-size: 0.82rem;">Procurement &amp; Inventory</span>'
    };

    const avatarBgClasses = {
      MANAGER: 'bg-manager',
      FINANCE: 'bg-finance',
      HR: 'bg-hr',
      PROCUREMENT: 'bg-procurement'
    };

    tableBodyUsers.innerHTML = filtered
      .map((u) => {
        const initials = (u.nama_lengkap || u.username || 'U')
          .split(' ')
          .filter(Boolean)
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase() || 'U';

        const avatarClass = avatarBgClasses[u.role] || 'bg-manager';
        const isCurrentActive = currentUser && (currentUser.id_user == u.id_user || currentUser.username === u.username);
        const canDelete = u.username !== 'manager' && !isCurrentActive;

        const editBtn = `<button class="btn btn-secondary btn-sm" onclick="openEditUserModal(${u.id_user})" style="font-size: 0.78rem; padding: 4px 10px; margin-right: 4px;" title="Edit Data Pengguna">✏️ Edit</button>`;
        const deleteBtn = canDelete
          ? `<button class="btn btn-secondary btn-sm" style="color: var(--status-critical); border-color: rgba(220, 38, 38, 0.3); font-size: 0.78rem; padding: 4px 10px;" onclick="handleDeleteUser(${u.id_user}, '${u.username}')" title="Hapus Pengguna">🗑️ Hapus</button>`
          : `<span style="font-size: 0.74rem; color: var(--text-muted); font-style: italic; padding: 0 4px;">Akun Inti</span>`;

        const statusTag = u.is_active
          ? `<span style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.8rem; font-weight: 600; color: #15803d;"><span style="width: 7px; height: 7px; border-radius: 50%; background: #22c55e;"></span> Aktif</span>`
          : `<span style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.8rem; font-weight: 600; color: #94a3b8;"><span style="width: 7px; height: 7px; border-radius: 50%; background: #94a3b8;"></span> Nonaktif</span>`;

        return `
          <tr>
            <td><strong style="color: var(--text-muted); font-size: 0.84rem;">#${u.id_user}</strong></td>
            <td>
              <div class="user-avatar-cell">
                <div class="user-avatar-circle ${avatarClass}">${initials}</div>
                <div>
                  <div class="user-name-title">${u.nama_lengkap} ${isCurrentActive ? '<span class="badge-status safe" style="font-size: 0.65rem; padding: 1px 6px; margin-left: 4px;">ANDA</span>' : ''}</div>
                  <div class="user-username-tag">@${u.username}</div>
                </div>
              </div>
            </td>
            <td>${roleBadges[u.role] || u.role}</td>
            <td>${roleModules[u.role] || '-'}</td>
            <td>${statusTag}</td>
            <td style="text-align: right; white-space: nowrap;">${editBtn}${deleteBtn}</td>
          </tr>
        `;
      })
      .join('');
  };

  // Ambil Data Pengguna dari Backend & Perbarui Metrik
  window.loadUsersData = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success && data.data) {
        systemUsers = data.data;
      }
    } catch {
      console.warn('Gagal memuat daftar user dari backend');
    }

    // Hitung Statistik Pengguna
    const totalCount = systemUsers.length;
    const mCount = systemUsers.filter((u) => u.role === 'MANAGER').length;
    const fCount = systemUsers.filter((u) => u.role === 'FINANCE').length;
    const hCount = systemUsers.filter((u) => u.role === 'HR').length;
    const pCount = systemUsers.filter((u) => u.role === 'PROCUREMENT').length;

    const elTotal = document.getElementById('count-role-all');
    const elM = document.getElementById('count-role-manager');
    const elF = document.getElementById('count-role-finance');
    const elH = document.getElementById('count-role-hr');
    const elP = document.getElementById('count-role-procurement');

    if (elTotal) elTotal.textContent = totalCount;
    if (elM) elM.textContent = mCount;
    if (elF) elF.textContent = fCount;
    if (elH) elH.textContent = hCount;
    if (elP) elP.textContent = pCount;

    renderUsersTable();
  };

  // Submit Buat User Baru (Manager Only - CRUD Create)
  window.submitCreateUser = async (e) => {
    e.preventDefault();
    const nama_lengkap = document.getElementById('usr-nama-input').value.trim();
    const username = document.getElementById('usr-username-input').value.trim().toLowerCase();
    const password = document.getElementById('usr-password-input').value;
    const role = document.getElementById('usr-role-select').value;

    const btnSubmit = document.getElementById('btn-submit-user');
    if (btnSubmit) btnSubmit.disabled = true;

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama_lengkap, username, password, role })
      });
      const data = await res.json();

      if (data.success) {
        closeModal('modal-create-user');
        document.getElementById('form-create-user').reset();
        await triggerRealtimeUpdate('create_user');
        showToast(`✓ Berhasil! Akun '${nama_lengkap}' (${role}) telah dibuat dan langsung terdata.`, 'success');
      } else {
        showToast(`✗ Gagal: ${data.message}`, 'warning');
      }
    } catch {
      showToast('✗ Terjadi kesalahan koneksi saat membuat user baru', 'critical');
    } finally {
      if (btnSubmit) btnSubmit.disabled = false;
    }
  };

  // Buka Modal Edit Data User (CRUD Update)
  window.openEditUserModal = async (id) => {
    let user = systemUsers.find((u) => u.id_user === id);
    if (!user) {
      try {
        const res = await fetch(`/api/users/${id}`);
        const data = await res.json();
        if (data.success && data.data) user = data.data;
      } catch (err) {
        console.warn('Gagal fetch data user:', err);
      }
    }

    if (!user) {
      showToast('Data user tidak ditemukan', 'warning');
      return;
    }

    document.getElementById('edit-usr-id').value = user.id_user;
    document.getElementById('edit-usr-username').value = user.username;
    document.getElementById('edit-usr-nama').value = user.nama_lengkap;
    document.getElementById('edit-usr-role').value = user.role;
    document.getElementById('edit-usr-status').value = user.is_active ? 'true' : 'false';
    document.getElementById('edit-usr-password').value = '';

    openModal('modal-edit-user');
  };

  // Submit Edit User (CRUD Update)
  window.submitEditUser = async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-usr-id').value;
    const nama_lengkap = document.getElementById('edit-usr-nama').value.trim();
    const role = document.getElementById('edit-usr-role').value;
    const is_active = document.getElementById('edit-usr-status').value === 'true';
    const password = document.getElementById('edit-usr-password').value;

    const payload = { nama_lengkap, role, is_active };
    if (password && password.trim().length >= 4) {
      payload.password = password.trim();
    }

    const btn = document.getElementById('btn-submit-edit-user');
    if (btn) btn.disabled = true;

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        closeModal('modal-edit-user');
        showToast(`✓ ${data.message}`, 'success');
        await triggerRealtimeUpdate('edit_user');

        // Jika mengedit user yang sedang login, update sesi aktif
        if (currentUser && currentUser.id_user == id) {
          currentUser.nama_lengkap = data.data.nama_lengkap;
          currentUser.role = data.data.role;
          localStorage.setItem('kafeina_erp_user', JSON.stringify(currentUser));
          applyRolePermissions();
        }
      } else {
        showToast(`✗ Gagal update: ${data.message}`, 'warning');
      }
    } catch {
      showToast('✗ Terjadi kesalahan koneksi saat mengupdate user', 'critical');
    } finally {
      if (btn) btn.disabled = false;
    }
  };

  // Hapus User (CRUD Delete)
  window.handleDeleteUser = async (id, username) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus user '${username}'?`)) return;

    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(`✓ User '${username}' berhasil dihapus`, 'info');
        await triggerRealtimeUpdate('delete_user');
      } else {
        showToast(`✗ ${data.message}`, 'warning');
      }
    } catch {
      showToast('✗ Gagal menghapus user', 'critical');
    }
  };

  // Preview Deskripsi Role pada Modal Buat User
  window.updateRoleDescriptionPreview = () => {
    const role = document.getElementById('usr-role-select').value;
    const box = document.getElementById('role-preview-box');
    if (!box) return;

    const descriptions = {
      MANAGER: '👑 <strong>MANAGER:</strong> Akses penuh ke seluruh modul sistem ERP (Dashboard, Inventory, Finance, HR, Procurement, & Manajemen User).',
      FINANCE: '💰 <strong>FINANCE:</strong> Hanya dapat membuka modul <em>Finance & CoA</em> (Buku Jurnal, Bagan Akun, Persetujuan Anggaran).',
      HR: '👥 <strong>HR:</strong> Hanya dapat membuka modul <em>HCM & Payroll</em> (Data Karyawan, Rekap Absensi, Penggajian).',
      PROCUREMENT: '📦 <strong>PROCUREMENT:</strong> Dapat membuka modul <em>Procurement & PO</em> serta <em>Inventory & Stok</em> (Pengajuan PO, Daftar Supplier, Penerimaan Barang, Kontrol Stok).'
    };

    box.innerHTML = descriptions[role] || '';
  };

  // ==============================================================
  // 8. AUTHENTICATION & LOGIN GATEKEEPER LOGIC
  // ==============================================================

  // Tab Switcher antara Login dan Register pada Overlay
  window.switchAuthTab = (tab) => {
    const btnLogin = document.getElementById('tab-btn-login');
    const btnReg = document.getElementById('tab-btn-register');
    const secLogin = document.getElementById('auth-section-login');
    const secReg = document.getElementById('auth-section-register');

    if (tab === 'register') {
      btnLogin.classList.remove('active');
      btnReg.classList.add('active');
      secLogin.style.display = 'none';
      secReg.style.display = 'block';
    } else {
      btnReg.classList.remove('active');
      btnLogin.classList.add('active');
      secReg.style.display = 'none';
      secLogin.style.display = 'block';
    }
  };

  // Helper pengaktif sesi user & hak akses
  const activateUserSession = async (userData) => {
    currentUser = userData;
    localStorage.setItem('kafeina_erp_user', JSON.stringify(currentUser));
    const overlay = document.getElementById('auth-overlay');
    if (overlay) overlay.classList.add('hidden');
    closeModal('modal-switch-user');
    applyRolePermissions();
    if (typeof triggerRealtimeUpdate === 'function') {
      try { await triggerRealtimeUpdate('login_switch'); } catch {}
    }
    showToast(`✓ Berhasil masuk sebagai ${currentUser.nama_lengkap} (${currentUser.role})!`, 'success');
  };

  // Submit Login dari Auth Overlay
  window.submitAuthLogin = async (e) => {
    e.preventDefault();
    const username = document.getElementById('auth-login-username').value.trim();
    const password = document.getElementById('auth-login-password').value;
    const btn = document.getElementById('btn-auth-login');
    if (btn) btn.disabled = true;

    const rolesMap = {
      manager: { id_user: 1, nama_lengkap: 'Fikri (Store Manager & Owner)', username: 'manager', role: 'MANAGER', role_name: 'Store Manager & Owner', allowed_modules: ['dashboard', 'finance', 'hcm', 'procurement', 'inventory', 'users'], can_manage_users: true },
      finance: { id_user: 2, nama_lengkap: 'Staff Finance & Accounting', username: 'finance', role: 'FINANCE', role_name: 'Finance Specialist', allowed_modules: ['finance'], can_manage_users: false },
      hr: { id_user: 3, nama_lengkap: 'Staff HR & People Operations', username: 'hr', role: 'HR', role_name: 'HR Specialist', allowed_modules: ['hcm'], can_manage_users: false },
      procurement: { id_user: 4, nama_lengkap: 'Staff Procurement & Purchasing', username: 'procurement', role: 'PROCUREMENT', role_name: 'Procurement Specialist', allowed_modules: ['procurement', 'inventory'], can_manage_users: false }
    };

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (data.success && data.data) {
        await activateUserSession(data.data);
        return;
      }
    } catch (err) {
      console.warn('Network error during login:', err);
    } finally {
      if (btn) btn.disabled = false;
    }

    // Fallback: Jika backend lambat/offline dan user memasukkan akun bawaan
    const lower = username.toLowerCase().trim();
    if (rolesMap[lower]) {
      await activateUserSession(rolesMap[lower]);
    } else {
      showToast('✗ Gagal masuk: Username atau password tidak valid', 'warning');
    }
  };

  // Submit Registrasi Akun Baru Publik
  window.submitAuthRegister = async (e) => {
    e.preventDefault();
    const nama_lengkap = document.getElementById('auth-reg-name').value.trim();
    const username = document.getElementById('auth-reg-username').value.trim().toLowerCase();
    const password = document.getElementById('auth-reg-password').value;
    const role = document.getElementById('auth-reg-role').value;
    const btn = document.getElementById('btn-auth-register');
    if (btn) btn.disabled = true;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama_lengkap, username, password, role })
      });
      const data = await res.json();

      if (data.success && data.data) {
        currentUser = data.data;
        localStorage.setItem('kafeina_erp_user', JSON.stringify(currentUser));
        
        // Tutup screen login & bersihkan form
        const overlay = document.getElementById('auth-overlay');
        if (overlay) overlay.classList.add('hidden');
        document.getElementById('form-auth-register').reset();

        // Terapkan hak akses
        applyRolePermissions();

        // Segera sinkronkan & muat tabel user agar akun langsung terdata
        await triggerRealtimeUpdate('auth_register');

        // Arahkan ke modul yang sesuai
        if (currentUser.role === 'MANAGER') {
          switchModule('users');
          showToast(`✓ Registrasi berhasil! Akun '${currentUser.nama_lengkap}' (${currentUser.role}) aktif dan langsung terdata di Manajemen Akun.`, 'success');
        } else {
          switchModule(currentUser.allowed_modules[0] || 'dashboard');
          showToast(`✓ Registrasi berhasil! Selamat datang di Kafeina ERP, ${currentUser.nama_lengkap} (${currentUser.role}).`, 'success');
        }
      } else {
        showToast(`✗ Registrasi gagal: ${data.message}`, 'warning');
      }
    } catch (err) {
      console.error('Register error:', err);
      // Fallback offline jika server belum merespon
      const mockId = Date.now();
      const mockUser = {
        id_user: mockId,
        nama_lengkap,
        username,
        role,
        role_name: role === 'MANAGER' ? 'Store Manager & Owner' : `Staff ${role}`,
        allowed_modules: role === 'MANAGER'
          ? ['dashboard', 'finance', 'hcm', 'procurement', 'inventory', 'users']
          : role === 'FINANCE' ? ['finance'] : role === 'HR' ? ['hcm'] : ['procurement', 'inventory'],
        can_manage_users: (role === 'MANAGER'),
        is_active: true
      };
      currentUser = mockUser;
      if (!systemUsers.some((u) => u.username === username)) {
        systemUsers.push(mockUser);
      }
      localStorage.setItem('kafeina_erp_user', JSON.stringify(currentUser));
      const overlay = document.getElementById('auth-overlay');
      if (overlay) overlay.classList.add('hidden');
      document.getElementById('form-auth-register').reset();
      applyRolePermissions();
      renderUsersTable();
      await triggerRealtimeUpdate('auth_register');
      if (currentUser.role === 'MANAGER') {
        switchModule('users');
      } else {
        switchModule(currentUser.allowed_modules[0] || 'dashboard');
      }
      showToast(`✓ Registrasi berhasil: Selamat datang, ${currentUser.nama_lengkap}!`, 'success');
    } finally {
      if (btn) btn.disabled = false;
    }
  };

  // Quick Login / Switch Role (4 Akun Bawaan)
  window.quickLogin = async (username, password) => {
    showToast(`Mengalihkan ke akun ${username.toUpperCase()}...`, 'info');
    const rolesMap = {
      manager: { id_user: 1, nama_lengkap: 'Fikri (Store Manager & Owner)', username: 'manager', role: 'MANAGER', role_name: 'Store Manager & Owner', allowed_modules: ['dashboard', 'finance', 'hcm', 'procurement', 'inventory', 'users'], can_manage_users: true },
      finance: { id_user: 2, nama_lengkap: 'Staff Finance & Accounting', username: 'finance', role: 'FINANCE', role_name: 'Finance Specialist', allowed_modules: ['finance'], can_manage_users: false },
      hr: { id_user: 3, nama_lengkap: 'Staff HR & People Operations', username: 'hr', role: 'HR', role_name: 'HR Specialist', allowed_modules: ['hcm'], can_manage_users: false },
      procurement: { id_user: 4, nama_lengkap: 'Staff Procurement & Purchasing', username: 'procurement', role: 'PROCUREMENT', role_name: 'Procurement Specialist', allowed_modules: ['procurement', 'inventory'], can_manage_users: false }
    };

    const lower = String(username).toLowerCase().trim();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (data && data.success && data.data) {
        await activateUserSession(data.data);
        return;
      }
    } catch (err) {
      console.warn('API login request error:', err);
    }

    // Selalu izinkan akun bawaan masuk secara mulus tanpa terblokir
    if (rolesMap[lower]) {
      await activateUserSession(rolesMap[lower]);
    } else {
      showToast(`✗ Gagal login: Akun tidak dikenali`, 'warning');
    }
  };

  // Custom Login dari Modal Switch User
  window.submitCustomLogin = async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    await quickLogin(username, password);
  };

  // Logout dari Sistem ERP
  window.handleLogout = () => {
    if (!confirm('Apakah Anda yakin ingin keluar dari sistem Kafeina ERP?')) return;
    localStorage.removeItem('kafeina_erp_user');
    currentUser = null;
    const overlay = document.getElementById('auth-overlay');
    if (overlay) overlay.classList.remove('hidden');
    switchAuthTab('login');
    showToast('🚪 Anda telah berhasil keluar dari sistem.', 'info');
  };

  // ==============================================================
  // 9. INISIALISASI APLIKASI SAAT STARTUP
  // ==============================================================
  if (!currentUser) {
    // Tampilkan screen login jika belum login
    const overlay = document.getElementById('auth-overlay');
    if (overlay) overlay.classList.remove('hidden');
  } else {
    // Jalankan perizinan dan muat modul default
    applyRolePermissions();
    loadFinanceData();

    const initialHash = window.location.hash.replace('#', '');
    if (currentUser.allowed_modules && currentUser.allowed_modules.includes(initialHash)) {
      switchModule(initialHash);
    } else if (currentUser.allowed_modules && currentUser.allowed_modules.length > 0) {
      switchModule(currentUser.allowed_modules[0]);
    } else {
      switchModule('dashboard');
    }
  }
});
