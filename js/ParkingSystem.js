/**
 * LÓGICA PRINCIPAL DEL PARQUEADERO
 * Coordina Cola, Pila, BST y Sistema de Pagos.
 */
class ParkingSystem {
  constructor(capacity = 20) {
    this.capacity     = capacity;
    this.spots        = new Map();        // Espacios ocupados: placa → vehículo
    this.waitingQueue = new Queue();      // Cola de espera (FIFO)
    this.eventStack   = new Stack(200);  // Historial de eventos (LIFO)
    this.vehicleTree  = new BST();       // Registro de vehículos (BST)
    this.payments     = new PaymentSystem();
    this.spotLayout   = this._generateSpots(capacity);
  }

  // Generar mapa de espacios con IDs
  _generateSpots(n) {
    const layout = {};
    for (let i = 1; i <= n; i++) {
      layout[i] = { id: i, label: `A${String(i).padStart(2, '0')}`, occupied: false, plate: null };
    }
    return layout;
  }

  // Obtener el primer espacio libre
  _getFreeSpot() {
    for (const id in this.spotLayout) {
      if (!this.spotLayout[id].occupied) return parseInt(id);
    }
    return null;
  }

  // ─────────────────────────────────────────────
  // ENTRADA DE VEHÍCULO
  // ─────────────────────────────────────────────
  vehicleEntry(plate, type, driverName) {
    const key = plate.toUpperCase().trim();

    // Validar que no esté ya adentro
    if (this.spots.has(key)) {
      return { success: false, message: `El vehículo ${key} ya se encuentra en el parqueadero.` };
    }

    const vehicle = {
      plate: key,
      type,
      driverName,
      entryTime: new Date().toISOString(),
      spotId: null,
    };

    const freeSpot = this._getFreeSpot();

    if (freeSpot !== null) {
      // Hay espacio: ingresar directamente
      vehicle.spotId = freeSpot;
      this.spots.set(key, vehicle);
      this.spotLayout[freeSpot].occupied = true;
      this.spotLayout[freeSpot].plate    = key;
      this.vehicleTree.insert({ ...vehicle });

      this.eventStack.push({
        type:    'ENTRY',
        plate:   key,
        spot:    `A${String(freeSpot).padStart(2, '0')}`,
        driver:  driverName,
        vtype:   type,
        message: `Vehículo ${key} ingresó al espacio A${String(freeSpot).padStart(2, '0')}`,
      });

      return {
        success: true,
        queued:  false,
        vehicle,
        spot: freeSpot,
        message: `✅ ${key} ingresó al espacio A${String(freeSpot).padStart(2, '0')}`,
      };
    } else {
      // Parqueadero lleno: agregar a la cola de espera
      const position = this.waitingQueue.enqueue(vehicle);
      this.eventStack.push({
        type:    'QUEUED',
        plate:   key,
        driver:  driverName,
        vtype:   type,
        message: `Vehículo ${key} agregado a la cola de espera (posición #${position})`,
      });

      return {
        success: true,
        queued:  true,
        vehicle,
        position,
        message: `⏳ Parqueadero lleno. ${key} en cola, posición #${position}`,
      };
    }
  }

  // ─────────────────────────────────────────────
  // SALIDA DE VEHÍCULO
  // ─────────────────────────────────────────────
  vehicleExit(plate, paymentMethod = 'Efectivo') {
    const key = plate.toUpperCase().trim();

    if (!this.spots.has(key)) {
      return { success: false, message: `Vehículo ${key} no encontrado en el parqueadero.` };
    }

    const vehicle  = this.spots.get(key);
    const payment  = this.payments.processPayment(vehicle, paymentMethod);
    const spotId   = vehicle.spotId;

    // Liberar espacio
    this.spots.delete(key);
    this.spotLayout[spotId].occupied = false;
    this.spotLayout[spotId].plate    = null;

    // Registrar en la pila de eventos
    this.eventStack.push({
      type:    'EXIT',
      plate:   key,
      spot:    `A${String(spotId).padStart(2, '0')}`,
      driver:  vehicle.driverName,
      vtype:   vehicle.type,
      cost:    payment.cost,
      message: `Vehículo ${key} salió. Cobro: ${this.payments.formatCurrency(payment.cost)}`,
    });

    // Si hay vehículos en la cola, asignar el espacio liberado
    let nextVehicle = null;
    if (!this.waitingQueue.isEmpty()) {
      nextVehicle       = this.waitingQueue.dequeue();
      nextVehicle.spotId    = spotId;
      nextVehicle.entryTime = new Date().toISOString();
      this.spots.set(nextVehicle.plate, nextVehicle);
      this.spotLayout[spotId].occupied = true;
      this.spotLayout[spotId].plate    = nextVehicle.plate;
      this.vehicleTree.insert({ ...nextVehicle });

      this.eventStack.push({
        type:    'ENTRY',
        plate:   nextVehicle.plate,
        spot:    `A${String(spotId).padStart(2, '0')}`,
        driver:  nextVehicle.driverName,
        vtype:   nextVehicle.type,
        message: `${nextVehicle.plate} (de la cola) ingresó al espacio liberado A${String(spotId).padStart(2, '0')}`,
      });
    }

    return {
      success:     true,
      payment,
      nextVehicle,
      message:     `✅ ${key} salió. Total: ${this.payments.formatCurrency(payment.cost)}`,
    };
  }

  // ─────────────────────────────────────────────
  // BÚSQUEDA POR PLACA (BST)
  // ─────────────────────────────────────────────
  searchVehicle(plate) {
    const result = this.vehicleTree.search(plate);
    return result;
  }

  // ─────────────────────────────────────────────
  // ESTADÍSTICAS GENERALES
  // ─────────────────────────────────────────────
  getStats() {
    const payStats = this.payments.getStats();
    return {
      capacity:        this.capacity,
      occupied:        this.spots.size,
      available:       this.capacity - this.spots.size,
      occupancyRate:   Math.round((this.spots.size / this.capacity) * 100),
      waiting:         this.waitingQueue.size(),
      totalRegistered: this.vehicleTree.size(),
      treeHeight:      this.vehicleTree.height(),
      eventCount:      this.eventStack.size(),
      ...payStats,
    };
  }

  getOccupiedVehicles() {
    return Array.from(this.spots.values());
  }

  getWaitingQueue() {
    return this.waitingQueue.toArray();
  }

  getEventHistory(n = 15) {
    return this.eventStack.getTop(n);
  }

  getSpotLayout() {
    return Object.values(this.spotLayout);
  }

  getTreeData() {
    return this.vehicleTree.getTreeStructure();
  }

  getInOrderVehicles() {
    return this.vehicleTree.inOrder();
  }
}
