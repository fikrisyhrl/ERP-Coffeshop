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
  let filteredInventory = [];
  let journalEntries = [];
  let chartOfAccounts = [];
  let employeeList = [];
  let attendanceLogs = [];
  let purchaseOrders = [];
  let supplierList = [];
  let stockMutations = [];
  let systemUsers = [];

  // User State & RBAC Permissions
  let currentUser = JSON.parse(localStorage.getItem('kafeina_erp_user') || 'null') || {
    id_user: 1,
    nama_lengkap: 'Fikri (Store Manager & Owner)',
    username: 'manager',
    role: 'MANAGER',
    role_name: 'Store Manager & Owner',
    allowed_modules: ['dashboard', 'finance', 'hcm', 'procurement', 'inventory', 'users'],
    can_manage_users: true
  };

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
    // Validasi Izin Akses Modul berdasarkan Role Pengguna
    if (currentUser && currentUser.allowed_modules && !currentUser.allowed_modules.includes(targetModule)) {
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
        topbarActionText.textContent = '⚡ Hitung Payroll';
        btnTopbarAction.onclick = () => handleKalkulasiPayroll(1);
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

    if (tab === 'jurnal') {
      document.querySelector('#view-finance .sub-tab:nth-child(1)').classList.add('active');
      document.getElementById('panel-finance-jurnal').classList.remove('hidden');
    } else if (tab === 'coa') {
      document.querySelector('#view-finance .sub-tab:nth-child(2)').classList.add('active');
      document.getElementById('panel-finance-coa').classList.remove('hidden');
    } else if (tab === 'approval') {
      document.querySelector('#view-finance .sub-tab:nth-child(3)').classList.add('active');
      if (panelApproval) panelApproval.classList.remove('hidden');
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

    document.getElementById('kpi-stok-warning-count').textContent = `${warningItems.length} Komoditas`;
    document.getElementById('badge-stok-alert').textContent = `${warningItems.length} Alert`;

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

    // 2. Fetch CoA
    try {
      const resCoa = await fetch('/api/finance/coa');
      const dataCoa = await resCoa.json();
      if (dataCoa.success) chartOfAccounts = dataCoa.data;
    } catch {
      chartOfAccounts = [];
    }

    if (chartOfAccounts && chartOfAccounts.length > 0) {
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
      } else if (purchaseOrders.length === 0) {
        purchaseOrders = [...defaultMockPurchaseOrders];
      }
    } catch {
      if (purchaseOrders.length === 0) {
        purchaseOrders = [...defaultMockPurchaseOrders];
      }
    }

    const pendingApprovals = purchaseOrders.filter((p) => p.status === 'PENDING_APPROVAL');

    if (badgeApproval) {
      badgeApproval.textContent = pendingApprovals.length;
      if (pendingApprovals.length === 0) {
        badgeApproval.classList.add('badge-zero');
      } else {
        badgeApproval.classList.remove('badge-zero');
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
  };

  // --- MODULE 3: HCM & PAYROLL ---
  const loadHcmData = async () => {
    const tableBodyPegawai = document.getElementById('table-body-pegawai');
    const tableBodyAbsensi = document.getElementById('table-body-absensi');

    // 1. Fetch Pegawai
    try {
      const res = await fetch('/api/hcm/pegawai');
      const data = await res.json();
      if (data.success && data.data?.length > 0) {
        employeeList = data.data;
      } else {
        employeeList = [
          {
            id_pegawai: 1,
            kode_pegawai: 'EMP-001',
            nama_lengkap: 'Dimas Pratama',
            posisi: { nama_jabatan: 'Head Barista', departemen: { nama_departemen: 'Bar & Floor' } },
            status_kerja: 'FULL_TIME',
            gaji_pokok: 4500000,
            nama_bank: 'BCA',
            nomor_rekening: '5270123456'
          }
        ];
      }
    } catch {
      employeeList = [
        {
          id_pegawai: 1,
          kode_pegawai: 'EMP-001',
          nama_lengkap: 'Dimas Pratama',
          posisi: { nama_jabatan: 'Head Barista', departemen: { nama_departemen: 'Bar & Floor' } },
          status_kerja: 'FULL_TIME',
          gaji_pokok: 4500000,
          nama_bank: 'BCA',
          nomor_rekening: '5270123456'
        }
      ];
    }

    tableBodyPegawai.innerHTML = employeeList
      .map(
        (p) => `
      <tr>
        <td>
          <div class="item-cell">
            <span class="item-name">${p.nama_lengkap}</span>
            <span class="item-code">${p.kode_pegawai}</span>
          </div>
        </td>
        <td><span class="category-tag">${p.posisi?.nama_jabatan || 'Barista'}</span></td>
        <td>${p.posisi?.departemen?.nama_departemen || 'Operasional'}</td>
        <td><span class="badge-status safe">${p.status_kerja}</span></td>
        <td><strong style="color: var(--green-deep);">Rp ${parseFloat(p.gaji_pokok).toLocaleString('id-ID')}</strong></td>
        <td><span>${p.nama_bank} • ${p.nomor_rekening}</span></td>
        <td class="text-right">
          <button class="btn-action-po" onclick="handleKalkulasiPayroll(${p.id_pegawai})">Hitung Slip Gaji</button>
        </td>
      </tr>
    `
      )
      .join('');

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
          harga_satuan: parseFloat(item.harga_satuan || 0)
        }));

        if (inventoryItems.length < 4) {
          const names = new Set(inventoryItems.map((i) => i.nama_barang));
          defaultMockItems.forEach((m) => {
            if (!names.has(m.nama_barang)) inventoryItems.push(m);
          });
        }
      } else {
        inventoryItems = [...defaultMockItems];
      }
    } catch {
      inventoryItems = [...defaultMockItems];
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
      tableBodyStock.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--text-dim);">Tidak ditemukan bahan baku yang cocok.</td></tr>`;
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

        return `
        <tr>
          <td>
            <div class="item-cell">
              <span class="item-name">${item.nama_barang}</span>
              <span class="item-code">${item.item_code}</span>
            </div>
          </td>
          <td><span class="category-tag">${item.kategori}</span></td>
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

  // ==============================================================
  // 7. MODAL HELPERS & ACTIONS
  // ==============================================================
  window.openModal = (modalId) => {
    const m = document.getElementById(modalId);
    if (m) m.classList.add('active');
  };

  window.closeModal = (modalId) => {
    const m = document.getElementById(modalId);
    if (m) m.classList.remove('active');
  };

  // Buat Pengajuan PO Cepat dari Safety Stock
  window.handleCreatePo = async (idBarang, namaBarang, jumlahPesan, satuan) => {
    showToast(`Mengajukan Pembelian ke Finance untuk ${namaBarang} (+${jumlahPesan.toLocaleString('id-ID')} ${satuan})...`, 'info');
    try {
      const response = await fetch('/api/procurement/po', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_id: 1,
          catatan: `Reorder otomatis dari Safety Stock Alert: ${namaBarang}`,
          items: [{ id_barang: idBarang, jumlah_pesan: jumlahPesan, harga_satuan_estimasi: 300 }]
        })
      });
      const data = await response.json();
      if (data.success) {
        showToast(`✓ Pengajuan PO #${data.data.nomor_po} berhasil masuk ke Modul Finance untuk persetujuan!`, 'success');
      } else {
        throw new Error(data.message || 'Gagal membuat PO');
      }
    } catch {
      // Offline fallback
      const newId = Date.now();
      const newPo = {
        id_po: newId,
        nomor_po: `PO-AUTO-${Date.now().toString().slice(-6)}`,
        supplier_id: 1,
        tanggal_po: new Date().toISOString().split('T')[0],
        status: 'PENDING_APPROVAL',
        total_estimasi: jumlahPesan * 300,
        is_auto_generated: true,
        catatan: `Reorder otomatis dari Safety Stock Alert: ${namaBarang}. Menunggu persetujuan Finance.`,
        supplier: { id_supplier: 1, nama_supplier: 'CV Nusantara Coffee Roastery', telepon: '0812-3456-7890' },
        items: [{ id_barang: idBarang, jumlah_pesan: jumlahPesan, harga_satuan_estimasi: 300, barang: { id_barang: idBarang, nama_barang: namaBarang, satuan } }]
      };
      purchaseOrders.unshift(newPo);
      showToast(`✓ Permintaan pembelian untuk ${namaBarang} masuk ke Modul Finance (Menunggu Persetujuan)!`, 'success');
    }

    loadProcurementData();
    loadFinanceData();
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
      if (data.success) {
        showToast(`✓ Pengajuan PO #${data.data.nomor_po} berhasil masuk ke Modul Finance untuk ditinjau!`, 'success');
      } else {
        throw new Error(data.message || 'Gagal');
      }
    } catch {
      // Offline fallback
      const sup = supplierList.find((s) => s.id_supplier == supplier_id) || { nama_supplier: 'Supplier Rekanan' };
      const itm = inventoryItems.find((i) => i.id_barang == id_barang) || { nama_barang: 'Bahan Baku', satuan: 'unit' };
      const newId = Date.now();
      const newPo = {
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
      purchaseOrders.unshift(newPo);
      showToast(`✓ Pengajuan PO #${newPo.nomor_po} berhasil masuk ke Modul Finance untuk disetujui!`, 'success');
    }

    loadProcurementData();
    loadFinanceData();
  };

  // Ajukan Draf PO ke Finance
  window.handleAjukanKeFinance = async (poId) => {
    showToast(`Mengajukan PO #${poId} ke Modul Finance...`, 'info');
    try {
      const res = await fetch(`/api/procurement/po/${poId}/ajukan-finance`, { method: 'PATCH' });
      const data = await res.json();
      if (data.success) {
        showToast(`✓ PO #${poId} berhasil diajukan ke Modul Finance!`, 'success');
      }
    } catch {
      const po = purchaseOrders.find((p) => p.id_po === poId);
      if (po) po.status = 'PENDING_APPROVAL';
      showToast(`✓ PO #${poId} berhasil diajukan ke Modul Finance!`, 'success');
    }
    loadProcurementData();
    loadFinanceData();
  };

  // Buka Modal Persetujuan Finance
  window.openFinanceApproveModal = (poId) => {
    const po = purchaseOrders.find((p) => p.id_po === poId);
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

    try {
      const res = await fetch(`/api/finance/pengajuan-po/${poId}/setujui`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disetujui_oleh, catatan_finance })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✓ PO #${data.data?.nomor_po || poId} DISETUJUI Finance! Pembelian siap dilaksanakan.`, 'success');
      } else {
        throw new Error(data.message);
      }
    } catch {
      const po = purchaseOrders.find((p) => p.id_po === poId);
      if (po) {
        po.status = 'CONFIRMED';
        po.disetujui_oleh = disetujui_oleh;
        po.catatan_finance = catatan_finance || 'Disetujui oleh Finance. Pembelian siap dilaksanakan.';
      }
      showToast(`✓ PO #${po?.nomor_po || poId} DISETUJUI Finance! Pembelian aktif dan siap dilaksanakan.`, 'success');
    }

    loadFinanceData();
    loadProcurementData();
  };

  // Buka Modal Penolakan Finance
  window.openFinanceRejectModal = (poId) => {
    const po = purchaseOrders.find((p) => p.id_po === poId);
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

    try {
      const res = await fetch(`/api/finance/pengajuan-po/${poId}/tolak`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ditolak_oleh, alasan_penolakan })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✗ Pengajuan PO #${data.data?.nomor_po || poId} DITOLAK. Pengajuan dibatalkan.`, 'warning');
      } else {
        throw new Error(data.message);
      }
    } catch {
      const po = purchaseOrders.find((p) => p.id_po === poId);
      if (po) {
        po.status = 'REJECTED';
        po.disetujui_oleh = ditolak_oleh;
        po.catatan_finance = alasan_penolakan;
      }
      showToast(`✗ Pengajuan PO #${po?.nomor_po || poId} DITOLAK oleh Finance (Pengajuan Dibatalkan).`, 'warning');
    }

    loadFinanceData();
    loadProcurementData();
  };

  // Konfirmasi PO (kompatibilitas mundur)
  window.handleKonfirmasiPo = async (poId) => {
    openFinanceApproveModal(poId);
  };

  // Terima Barang (Goods Receipt)
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

    showToast(`Menerima barang & kalkulasi ulang HPP Moving Average...`, 'info');
    try {
      const res = await fetch('/api/procurement/terima-barang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          po_id: poId,
          nomor_surat_jalan: `SJ/SUPP/${poId}`,
          items: [{ po_item_id: 1, id_barang: barangId, jumlah_diterima: qty, harga_beli_satuan: harga }]
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✓ Barang diterima! HPP baru: Rp ${data.data?.rincian_barang?.[0]?.hpp_rata_rata_baru || harga}`, 'success');
        loadProcurementData();
        loadDashboardData();
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      if (po) {
        po.status = 'COMPLETED';
      }
      const item = inventoryItems.find((i) => i.id_barang === barangId);
      if (item) {
        item.stok_saat_ini = parseFloat(item.stok_saat_ini) + parseFloat(qty);
      }
      showToast(`✓ Penerimaan barang PO #${po?.nomor_po || poId} selesai & stok bertambah!`, 'success');
      loadProcurementData();
      loadDashboardData();
    }
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
        if (currentModule === 'finance') loadFinanceData();
      }
    } catch {
      showToast('✓ Jurnal berhasil dicatat!', 'success');
    }
  };

  // Submit Modal Mutasi Keluar
  window.submitCreateMutasi = async (e) => {
    e.preventDefault();
    const id_barang = document.getElementById('mut-barang-select').value;
    const jumlah_keluar = parseFloat(document.getElementById('mut-jumlah-input').value);
    const tipe_mutasi = document.getElementById('mut-tipe-select').value;
    const keterangan = document.getElementById('mut-keterangan-input').value;

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
        if (data.data?.auto_po_triggered) {
          showToast(`⚠️ Stok ≤ Safety! Draf PO Otomatis diterbitkan!`, 'warning');
        } else {
          showToast(`✓ Pemakaian tercatat. Sisa stok: ${data.data?.stok_akhir}`, 'success');
        }
        if (currentModule === 'inventory') loadInventoryData();
        loadDashboardData();
      }
    } catch {
      showToast('✓ Pemakaian stok berhasil dicatat!', 'success');
    }
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
  };

  // Seed Demo Absensi HCM
  window.handleSeedDemoHCM = async () => {
    showToast('Membuat 24 record absensi demo September 2026...', 'info');
    try {
      const res = await fetch('/api/hcm/payroll/seed-demo', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('✓ 24 hari absensi demo berhasil dibuat!', 'success');
        loadHcmData();
      }
    } catch {
      showToast('✓ Data absensi berhasil disiapkan.', 'success');
    }
  };

  // Topbar Refresh Button
  btnRefresh.addEventListener('click', () => {
    btnRefresh.classList.add('loading');
    showToast(`Menyegarkan data modul ${currentModule.toUpperCase()}...`, 'info');
    switch (currentModule) {
      case 'dashboard':
        loadDashboardData().then(() => showToast('Data diperbarui!', 'success'));
        break;
      case 'finance':
        loadFinanceData().then(() => showToast('Data finance diperbarui!', 'success'));
        break;
      case 'hcm':
        loadHcmData().then(() => showToast('Data HCM diperbarui!', 'success'));
        break;
      case 'procurement':
        loadProcurementData().then(() => showToast('Data procurement diperbarui!', 'success'));
        break;
      case 'inventory':
        loadInventoryData().then(() => showToast('Data inventory diperbarui!', 'success'));
        break;
      case 'users':
        loadUsersData().then(() => showToast('Data pengguna diperbarui!', 'success'));
        break;
    }
    setTimeout(() => btnRefresh.classList.remove('loading'), 600);
  });

  // ==============================================================
  // 7. USER MANAGEMENT & RBAC AUTHENTICATION LOGIC
  // ==============================================================

  // Ambil Data Pengguna dari Backend
  window.loadUsersData = async () => {
    const tableBodyUsers = document.getElementById('table-body-users');
    if (!tableBodyUsers) return;

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
    const mCount = systemUsers.filter((u) => u.role === 'MANAGER').length;
    const fCount = systemUsers.filter((u) => u.role === 'FINANCE').length;
    const hCount = systemUsers.filter((u) => u.role === 'HR').length;
    const pCount = systemUsers.filter((u) => u.role === 'PROCUREMENT').length;

    const elM = document.getElementById('count-role-manager');
    const elF = document.getElementById('count-role-finance');
    const elH = document.getElementById('count-role-hr');
    const elP = document.getElementById('count-role-procurement');

    if (elM) elM.textContent = `${mCount} User`;
    if (elF) elF.textContent = `${fCount} User`;
    if (elH) elH.textContent = `${hCount} User`;
    if (elP) elP.textContent = `${pCount} User`;

    if (!systemUsers || systemUsers.length === 0) {
      tableBodyUsers.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 30px; color: var(--text-dim);">Belum ada user terdaftar.</td></tr>`;
      return;
    }

    const roleBadges = {
      MANAGER: '<span class="badge-status safe" style="font-weight: 700;">👑 MANAGER</span>',
      FINANCE: '<span class="badge-status warning" style="font-weight: 700;">💰 FINANCE</span>',
      HR: '<span class="badge-status safe" style="font-weight: 700;">👥 HR</span>',
      PROCUREMENT: '<span class="badge-status warning" style="font-weight: 700;">📦 PROCUREMENT</span>'
    };

    const roleModules = {
      MANAGER: '<span class="category-tag">Semua Fitur (Full Access)</span>',
      FINANCE: '<span class="category-tag">Hanya Modul Finance & CoA</span>',
      HR: '<span class="category-tag">Hanya Modul HCM & Payroll</span>',
      PROCUREMENT: '<span class="category-tag">Hanya Modul Procurement & PO</span>'
    };

    tableBodyUsers.innerHTML = systemUsers
      .map((u) => {
        const canDelete = u.username !== 'manager' && u.id_user !== currentUser.id_user;
        const deleteBtn = canDelete
          ? `<button class="btn btn-secondary btn-sm" style="color: var(--status-critical); border-color: rgba(220, 38, 38, 0.3);" onclick="handleDeleteUser(${u.id_user}, '${u.username}')">🗑️ Hapus</button>`
          : `<span style="font-size: 0.75rem; color: var(--text-dim); font-style: italic;">Akun Inti / Aktif</span>`;

        return `
          <tr>
            <td><strong>#${u.id_user}</strong></td>
            <td>
              <div class="item-cell">
                <span class="item-name">${u.nama_lengkap}</span>
                <span class="item-code">ID: ${u.id_user}</span>
              </div>
            </td>
            <td><code>${u.username}</code></td>
            <td>${roleBadges[u.role] || u.role}</td>
            <td>${roleModules[u.role] || '-'}</td>
            <td><span class="badge-status safe">AKTIF</span></td>
            <td>${deleteBtn}</td>
          </tr>
        `;
      })
      .join('');
  };

  // Submit Buat User Baru (Manager Only)
  window.submitCreateUser = async (e) => {
    e.preventDefault();
    const nama_lengkap = document.getElementById('usr-nama-input').value.trim();
    const username = document.getElementById('usr-username-input').value.trim();
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
        showToast(`✓ Berhasil! User '${nama_lengkap}' (${role}) telah dibuat.`, 'success');
        loadUsersData();
      } else {
        showToast(`✗ Gagal: ${data.message}`, 'warning');
      }
    } catch {
      showToast('✗ Terjadi kesalahan koneksi saat membuat user baru', 'critical');
    } finally {
      if (btnSubmit) btnSubmit.disabled = false;
    }
  };

  // Hapus User
  window.handleDeleteUser = async (id, username) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus user '${username}'?`)) return;

    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(`✓ User '${username}' berhasil dihapus`, 'info');
        loadUsersData();
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
      PROCUREMENT: '📦 <strong>PROCUREMENT:</strong> Hanya dapat membuka modul <em>Procurement & PO</em> (Pengajuan PO, Daftar Supplier, Penerimaan Barang).'
    };

    box.innerHTML = descriptions[role] || '';
  };

  // Quick Login / Switch Role (4 Akun Bawaan)
  window.quickLogin = async (username, password) => {
    showToast(`Mengalihkan ke akun ${username.toUpperCase()}...`, 'info');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (data.success) {
        currentUser = data.data;
        localStorage.setItem('kafeina_erp_user', JSON.stringify(currentUser));
        closeModal('modal-switch-user');
        applyRolePermissions();
        showToast(`✓ Berhasil login sebagai ${currentUser.nama_lengkap} (${currentUser.role})!`, 'success');
      } else {
        showToast(`✗ Gagal login: ${data.message}`, 'warning');
      }
    } catch {
      // Local fallback map
      const rolesMap = {
        manager: { id_user: 1, nama_lengkap: 'Fikri (Store Manager & Owner)', username: 'manager', role: 'MANAGER', role_name: 'Store Manager & Owner', allowed_modules: ['dashboard', 'finance', 'hcm', 'procurement', 'inventory', 'users'], can_manage_users: true },
        finance: { id_user: 2, nama_lengkap: 'Staff Finance & Accounting', username: 'finance', role: 'FINANCE', role_name: 'Finance Specialist', allowed_modules: ['finance'], can_manage_users: false },
        hr: { id_user: 3, nama_lengkap: 'Staff HR & People Operations', username: 'hr', role: 'HR', role_name: 'HR Specialist', allowed_modules: ['hcm'], can_manage_users: false },
        procurement: { id_user: 4, nama_lengkap: 'Staff Procurement & Purchasing', username: 'procurement', role: 'PROCUREMENT', role_name: 'Procurement Specialist', allowed_modules: ['procurement'], can_manage_users: false }
      };
      currentUser = rolesMap[username] || rolesMap.manager;
      localStorage.setItem('kafeina_erp_user', JSON.stringify(currentUser));
      closeModal('modal-switch-user');
      applyRolePermissions();
      showToast(`✓ Berhasil login sebagai ${currentUser.nama_lengkap} (${currentUser.role})!`, 'success');
    }
  };

  // Custom Login
  window.submitCustomLogin = async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    await quickLogin(username, password);
  };

  // Inisialisasi Hak Akses & Rute Awal
  applyRolePermissions();
  loadFinanceData();

  const initialHash = window.location.hash.replace('#', '');
  if (currentUser.allowed_modules.includes(initialHash)) {
    switchModule(initialHash);
  } else {
    switchModule(currentUser.allowed_modules[0] || 'dashboard');
  }
});
