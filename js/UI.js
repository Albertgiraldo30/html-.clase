/**
 * UI.js - Renderizado, animaciones e interactividad
 */
class ParkingUI {
  constructor(parking) {
    this.parking = parking;
    this.activeTab = 'dashboard';
    this.searchResult = null;
    this.pendingExit = null;
    this.init();
  }

  init() {
    this.bindNav();
    this.bindForms();
    this.bindSearch();
    this.renderAll();
    this.startClock();
    setInterval(() => this.refreshDynamicData(), 30000);
  }

  // ─── NAVEGACIÓN ──────────────────────────────
  bindNav() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeTab = btn.dataset.tab;
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        document.getElementById(`tab-${this.activeTab}`).classList.add('active');
        this.renderTab(this.activeTab);
      });
    });
  }

  renderTab(tab) {
    switch (tab) {
      case 'dashboard':   this.renderDashboard(); break;
      case 'spots':       this.renderSpots(); break;
      case 'queue':       this.renderQueue(); break;
      case 'history':     this.renderHistory(); break;
      case 'tree':        this.renderTree(); break;
      case 'payments':    this.renderPayments(); break;
    }
  }

  renderAll() {
    this.renderDashboard();
    this.renderSpots();
    this.renderQueue();
    this.renderHistory();
    this.renderTree();
    this.renderPayments();
  }

  refreshDynamicData() {
    this.renderTab(this.activeTab);
    this.updateHeaderStats();
  }

  // ─── FORMULARIOS ─────────────────────────────
  bindForms() {
    // Formulario de entrada
    document.getElementById('form-entry').addEventListener('submit', e => {
      e.preventDefault();
      const plate  = document.getElementById('entry-plate').value.trim();
      const type   = document.getElementById('entry-type').value;
      const driver = document.getElementById('entry-driver').value.trim();

      if (!plate || !driver) return this.showToast('Completa todos los campos', 'error');

      const result = this.parking.vehicleEntry(plate, type, driver);
      if (result.success) {
        this.showToast(result.message, result.queued ? 'warning' : 'success');
        e.target.reset();
        this.renderAll();
        this.updateHeaderStats();
      } else {
        this.showToast(result.message, 'error');
      }
    });

    // Formulario de salida
    document.getElementById('form-exit').addEventListener('submit', e => {
      e.preventDefault();
      const plate   = document.getElementById('exit-plate').value.trim();
      const method  = document.getElementById('exit-method').value;

      if (!plate) return this.showToast('Ingresa la placa del vehículo', 'error');

      const vehicle = this.parking.spots.get(plate.toUpperCase());
      if (!vehicle) return this.showToast(`Vehículo ${plate.toUpperCase()} no está en el parqueadero`, 'error');

      // Mostrar preview del cobro
      const preview = this.parking.payments.calculateCost(vehicle);
      this.pendingExit = { plate: plate.toUpperCase(), method };
      this.showPaymentModal(preview, method);
    });

    // Confirmar pago
    document.getElementById('btn-confirm-pay').addEventListener('click', () => {
      if (!this.pendingExit) return;
      const result = this.parking.vehicleExit(this.pendingExit.plate, this.pendingExit.method);
      this.closeModal('modal-payment');
      this.pendingExit = null;
      document.getElementById('form-exit').reset();

      if (result.success) {
        this.showToast(result.message, 'success');
        this.showReceiptModal(result.payment);
        this.renderAll();
        this.updateHeaderStats();
      } else {
        this.showToast(result.message, 'error');
      }
    });

    document.getElementById('btn-cancel-pay').addEventListener('click', () => {
      this.closeModal('modal-payment');
      this.pendingExit = null;
    });

    document.getElementById('btn-close-receipt').addEventListener('click', () => {
      this.closeModal('modal-receipt');
    });

    document.getElementById('btn-print-receipt').addEventListener('click', () => {
      window.print();
    });
  }

  // ─── BÚSQUEDA BST ─────────────────────────────
  bindSearch() {
    document.getElementById('btn-search').addEventListener('click', () => {
      const plate = document.getElementById('search-plate').value.trim();
      if (!plate) return this.showToast('Ingresa una placa para buscar', 'error');
      const result = this.parking.searchVehicle(plate);
      this.renderSearchResult(result, plate.toUpperCase());
    });
    document.getElementById('search-plate').addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('btn-search').click();
    });
  }

  renderSearchResult(vehicle, plate) {
    const container = document.getElementById('search-result');
    if (!vehicle) {
      container.innerHTML = `
        <div class="search-empty">
          <span class="search-icon">🔍</span>
          <p>No se encontró el vehículo <strong>${plate}</strong> en el árbol BST.</p>
        </div>`;
      return;
    }
    const inParking = this.parking.spots.has(plate);
    const rate = this.parking.payments.rates[vehicle.type];
    container.innerHTML = `
      <div class="search-card">
        <div class="search-card-header">
          <span class="vehicle-icon-lg">${rate.icon}</span>
          <div>
            <h3>${vehicle.plate}</h3>
            <span class="badge ${inParking ? 'badge-green' : 'badge-gray'}">${inParking ? '🟢 En parqueadero' : '⚫ Historial'}</span>
          </div>
        </div>
        <div class="info-grid">
          <div class="info-item"><span>Conductor</span><strong>${vehicle.driverName}</strong></div>
          <div class="info-item"><span>Tipo</span><strong>${rate.name}</strong></div>
          <div class="info-item"><span>Ingreso</span><strong>${this.formatTime(vehicle.entryTime)}</strong></div>
          ${vehicle.spotId ? `<div class="info-item"><span>Espacio</span><strong>A${String(vehicle.spotId).padStart(2,'0')}</strong></div>` : ''}
        </div>
      </div>`;
  }

  // ─── DASHBOARD ────────────────────────────────
  renderDashboard() {
    const s = this.parking.getStats();
    document.getElementById('stat-occupied').textContent  = s.occupied;
    document.getElementById('stat-available').textContent = s.available;
    document.getElementById('stat-waiting').textContent   = s.waiting;
    document.getElementById('stat-revenue').textContent   = this.parking.payments.formatCurrency(s.todayRevenue);
    document.getElementById('stat-registered').textContent = s.totalRegistered;
    document.getElementById('stat-events').textContent    = s.eventCount;

    // Barra de ocupación
    const bar = document.getElementById('occupancy-bar');
    const pct = document.getElementById('occupancy-pct');
    bar.style.width = `${s.occupancyRate}%`;
    bar.className = `occ-fill ${s.occupancyRate >= 90 ? 'occ-red' : s.occupancyRate >= 60 ? 'occ-yellow' : 'occ-green'}`;
    pct.textContent = `${s.occupancyRate}% ocupado`;

    this.updateHeaderStats();
    this.renderRecentEvents();
  }

  updateHeaderStats() {
    const s = this.parking.getStats();
    document.getElementById('header-occupied').textContent  = `${s.occupied}/${s.capacity}`;
    document.getElementById('header-waiting').textContent   = s.waiting;
  }

  renderRecentEvents() {
    const events = this.parking.getEventHistory(6);
    const container = document.getElementById('recent-events');
    if (!events.length) {
      container.innerHTML = '<p class="empty-msg">No hay eventos recientes.</p>';
      return;
    }
    container.innerHTML = events.map(ev => `
      <div class="event-item event-${ev.type.toLowerCase()}">
        <span class="event-icon">${ev.type === 'ENTRY' ? '🟢' : ev.type === 'EXIT' ? '🔴' : '⏳'}</span>
        <div class="event-body">
          <strong>${ev.plate}</strong>
          <p>${ev.message}</p>
        </div>
        <span class="event-time">${this.timeAgo(ev.timestamp)}</span>
      </div>`).join('');
  }

  // ─── MAPA DE ESPACIOS ─────────────────────────
  renderSpots() {
    const spots = this.parking.getSpotLayout();
    const container = document.getElementById('spots-grid');
    container.innerHTML = spots.map(spot => `
      <div class="spot ${spot.occupied ? 'spot-occupied' : 'spot-free'}" 
           title="${spot.occupied ? spot.plate : 'Libre'}"
           onclick="${spot.occupied ? `parkingUI.quickExit('${spot.plate}')` : ''}">
        <span class="spot-label">${spot.label}</span>
        ${spot.occupied
          ? `<span class="spot-plate">${spot.plate}</span><span class="spot-status">🚗</span>`
          : `<span class="spot-status">✓</span>`}
      </div>`).join('');
  }

  quickExit(plate) {
    document.getElementById('exit-plate').value = plate;
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-tab="dashboard"]').classList.add('active');
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('tab-dashboard').classList.add('active');
    this.activeTab = 'dashboard';
    this.renderDashboard();
    document.getElementById('form-exit').scrollIntoView({ behavior: 'smooth' });
    this.showToast(`Placa ${plate} cargada en salida`, 'info');
  }

  // ─── COLA DE ESPERA ───────────────────────────
  renderQueue() {
    const queue = this.parking.getWaitingQueue();
    const container = document.getElementById('queue-list');
    if (!queue.length) {
      container.innerHTML = '<p class="empty-msg">✅ No hay vehículos en espera.</p>';
      return;
    }
    container.innerHTML = queue.map((v, i) => {
      const rate = this.parking.payments.rates[v.type];
      return `
        <div class="queue-item" style="animation-delay:${i * 0.1}s">
          <div class="queue-pos">#${i + 1}</div>
          <span class="queue-icon">${rate.icon}</span>
          <div class="queue-info">
            <strong>${v.plate}</strong>
            <span>${v.driverName} · ${rate.name}</span>
            <small>En espera desde: ${this.formatTime(v.entryTime)}</small>
          </div>
        </div>`;
    }).join('');
  }

  // ─── HISTORIAL (PILA) ─────────────────────────
  renderHistory() {
    const events = this.parking.getEventHistory(50);
    const container = document.getElementById('history-list');
    if (!events.length) {
      container.innerHTML = '<p class="empty-msg">No hay eventos registrados aún.</p>';
      return;
    }
    container.innerHTML = events.map(ev => {
      const icons = { ENTRY: '🟢', EXIT: '🔴', QUEUED: '⏳' };
      const labels = { ENTRY: 'Entrada', EXIT: 'Salida', QUEUED: 'En Cola' };
      return `
        <div class="history-item">
          <div class="history-icon">${icons[ev.type] || '📋'}</div>
          <div class="history-body">
            <div class="history-header">
              <strong>${ev.plate}</strong>
              <span class="history-badge badge-${ev.type.toLowerCase()}">${labels[ev.type]}</span>
            </div>
            <p>${ev.message}</p>
            ${ev.cost ? `<span class="history-cost">${this.parking.payments.formatCurrency(ev.cost)}</span>` : ''}
          </div>
          <span class="history-time">${this.formatDateTime(ev.timestamp)}</span>
        </div>`;
    }).join('');
  }

  // ─── ÁRBOL BST ────────────────────────────────
  renderTree() {
    const treeData = this.parking.getTreeData();
    const inOrder  = this.parking.getInOrderVehicles();
    const container = document.getElementById('tree-visual');
    const inOrderEl = document.getElementById('tree-inorder');

    if (!treeData) {
      container.innerHTML = '<p class="empty-msg">El árbol BST está vacío. Registra vehículos para verlos aquí.</p>';
      inOrderEl.innerHTML = '';
      return;
    }

    container.innerHTML = `<div class="bst-wrapper">${this._renderNode(treeData)}</div>`;

    inOrderEl.innerHTML = inOrder.map(v => {
      const rate = this.parking.payments.rates[v.type];
      return `<span class="inorder-chip">${rate.icon} ${v.plate}</span>`;
    }).join(' → ');
  }

  _renderNode(node) {
    if (!node) return '';
    const inParking = this.parking.spots.has(node.key);
    const rate = this.parking.payments.rates[node.vehicle.type] || this.parking.payments.rates.car;
    return `
      <div class="bst-node-wrap">
        <div class="bst-node ${inParking ? 'bst-active' : ''}" title="${node.vehicle.driverName}">
          <span class="bst-icon">${rate.icon}</span>
          <span class="bst-plate">${node.key}</span>
        </div>
        ${(node.left || node.right) ? `
          <div class="bst-children">
            <div class="bst-child bst-left">${node.left ? this._renderNode(node.left) : '<div class="bst-null">∅</div>'}</div>
            <div class="bst-child bst-right">${node.right ? this._renderNode(node.right) : '<div class="bst-null">∅</div>'}</div>
          </div>` : ''}
      </div>`;
  }

  // ─── PAGOS ────────────────────────────────────
  renderPayments() {
    const history = this.parking.payments.history;
    const stats   = this.parking.payments.getStats();
    const rates   = this.parking.payments.rates;

    document.getElementById('pay-total-revenue').textContent = this.parking.payments.formatCurrency(stats.totalRevenue);
    document.getElementById('pay-today-count').textContent   = stats.todayPayments;
    document.getElementById('pay-avg-stay').textContent      = `${Math.floor(stats.avgStay / 60)}h ${stats.avgStay % 60}m`;

    // Tarifas actuales
    const rateContainer = document.getElementById('rates-display');
    rateContainer.innerHTML = Object.entries(rates).map(([key, r]) => `
      <div class="rate-card">
        <span class="rate-icon">${r.icon}</span>
        <div class="rate-info">
          <strong>${r.name}</strong>
          <span>${this.parking.payments.formatCurrency(r.perHour)}/hora</span>
        </div>
        <div class="rate-edit">
          <input type="number" id="rate-${key}" value="${r.perHour}" min="500" step="500">
          <button onclick="parkingUI.updateRate('${key}')">✔</button>
        </div>
      </div>`).join('');

    // Historial de pagos
    const payList = document.getElementById('payment-history');
    if (!history.length) {
      payList.innerHTML = '<p class="empty-msg">No hay pagos registrados aún.</p>';
      return;
    }
    payList.innerHTML = history.slice(0, 20).map(p => `
      <div class="pay-row">
        <div class="pay-plate">${p.rateIcon} <strong>${p.vehiclePlate}</strong></div>
        <div class="pay-detail">
          <span>${p.driverName}</span>
          <span class="pay-duration">⏱ ${p.durationText}</span>
        </div>
        <div class="pay-method">${p.paymentMethod}</div>
        <div class="pay-amount">${this.parking.payments.formatCurrency(p.cost)}</div>
        <div class="pay-date">${this.formatDateTime(p.paidAt)}</div>
      </div>`).join('');
  }

  updateRate(type) {
    const input = document.getElementById(`rate-${type}`);
    const val   = parseInt(input.value);
    if (isNaN(val) || val < 500) return this.showToast('Tarifa inválida (mín. $500)', 'error');
    this.parking.payments.updateRate(type, val);
    this.showToast(`Tarifa actualizada: ${this.parking.payments.formatCurrency(val)}/hora`, 'success');
    this.renderPayments();
  }

  // ─── MODALES ──────────────────────────────────
  showPaymentModal(bill, method) {
    const fmt = v => this.parking.payments.formatCurrency(v);
    document.getElementById('modal-pay-plate').textContent    = bill.vehiclePlate;
    document.getElementById('modal-pay-driver').textContent   = bill.driverName;
    document.getElementById('modal-pay-entry').textContent    = this.formatDateTime(bill.entryTime);
    document.getElementById('modal-pay-duration').textContent = bill.durationText;
    document.getElementById('modal-pay-rate').textContent     = `${fmt(bill.ratePerHour)}/hora`;
    document.getElementById('modal-pay-total').textContent    = fmt(bill.cost);
    document.getElementById('modal-pay-method').textContent   = method;
    document.getElementById('modal-payment').classList.add('open');
  }

  showReceiptModal(payment) {
    const fmt = v => this.parking.payments.formatCurrency(v);
    const receipt = document.getElementById('receipt-content');
    receipt.innerHTML = `
      <div class="receipt">
        <div class="receipt-header">
          <h2>🅿️ ParkSmart</h2>
          <p>Sistema de Parqueadero</p>
          <hr>
          <p><small>${new Date().toLocaleString('es-CO')}</small></p>
          <p><small>ID: ${payment.paymentId}</small></p>
        </div>
        <div class="receipt-body">
          <div class="receipt-row"><span>Vehículo</span><span>${payment.rateIcon} ${payment.vehiclePlate}</span></div>
          <div class="receipt-row"><span>Conductor</span><span>${payment.driverName}</span></div>
          <div class="receipt-row"><span>Tipo</span><span>${payment.rateName}</span></div>
          <hr>
          <div class="receipt-row"><span>Ingreso</span><span>${this.formatDateTime(payment.entryTime)}</span></div>
          <div class="receipt-row"><span>Salida</span><span>${this.formatDateTime(payment.exitTime)}</span></div>
          <div class="receipt-row"><span>Duración</span><span>${payment.durationText}</span></div>
          <div class="receipt-row"><span>Tarifa</span><span>${fmt(payment.ratePerHour)}/hora</span></div>
          <hr>
          <div class="receipt-row receipt-total"><span>TOTAL</span><span>${fmt(payment.cost)}</span></div>
          <div class="receipt-row"><span>Método</span><span>${payment.paymentMethod}</span></div>
        </div>
        <div class="receipt-footer"><p>¡Gracias por usar ParkSmart!</p></div>
      </div>`;
    document.getElementById('modal-receipt').classList.add('open');
  }

  closeModal(id) {
    document.getElementById(id).classList.remove('open');
  }

  // ─── RELOJ Y UTILIDADES ───────────────────────
  startClock() {
    const update = () => {
      const now = new Date();
      const el  = document.getElementById('live-clock');
      if (el) el.textContent = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };
    update();
    setInterval(update, 1000);
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    toast.innerHTML = `<span>${icons[type] || '📢'}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 3500);
  }

  formatTime(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  }

  formatDateTime(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  timeAgo(iso) {
    if (!iso) return '';
    const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (diff < 60)  return `hace ${diff}s`;
    if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
    return `hace ${Math.floor(diff / 3600)}h`;
  }
}
