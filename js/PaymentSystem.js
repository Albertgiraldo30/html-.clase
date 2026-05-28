/**
 * SISTEMA DE PAGOS
 * Calcula tarifas según tipo de vehículo y tiempo de estadía.
 */
class PaymentSystem {
  constructor() {
    this.rates = {
      car:   { name: 'Automóvil', icon: '🚗', perHour: 3000,  perMinute: 50,  color: '#4f8ef7' },
      moto:  { name: 'Motocicleta', icon: '🏍️', perHour: 1500, perMinute: 25,  color: '#f7c948' },
      truck: { name: 'Camión/Bus', icon: '🚛', perHour: 6000,  perMinute: 100, color: '#f76b4f' },
    };
    this.history = []; // Historial de pagos
    this.totalRevenue = 0;
  }

  // Calcular costo de estadía
  calculateCost(vehicle, exitTime = null) {
    const entry = new Date(vehicle.entryTime);
    const exit  = exitTime ? new Date(exitTime) : new Date();
    const diffMs      = exit - entry;
    const diffMinutes = Math.ceil(diffMs / 60000); // redondear hacia arriba
    const diffHours   = diffMinutes / 60;

    const rate    = this.rates[vehicle.type] || this.rates.car;
    const cost    = Math.ceil(diffMinutes * rate.perMinute);
    const minutes = diffMinutes % 60;
    const hours   = Math.floor(diffMinutes / 60);

    return {
      vehiclePlate: vehicle.plate,
      vehicleType:  vehicle.type,
      driverName:   vehicle.driverName,
      entryTime:    entry,
      exitTime:     exit,
      durationMs:   diffMs,
      durationText: `${hours}h ${minutes}m`,
      durationMinutes: diffMinutes,
      ratePerHour:  rate.perHour,
      cost:         cost,
      rateName:     rate.name,
      rateIcon:     rate.icon,
    };
  }

  // Procesar pago y agregar al historial
  processPayment(vehicle, paymentMethod = 'Efectivo') {
    const bill = this.calculateCost(vehicle);
    const payment = {
      ...bill,
      paymentMethod,
      paymentId: `PAY-${Date.now()}`,
      paid: true,
      paidAt: new Date().toISOString(),
    };
    this.history.unshift(payment);
    this.totalRevenue += payment.cost;
    return payment;
  }

  // Formato de moneda colombiana (COP)
  formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  // Estadísticas del día
  getStats() {
    const today = new Date().toDateString();
    const todayPayments = this.history.filter(p =>
      new Date(p.paidAt).toDateString() === today
    );
    return {
      totalPayments:  this.history.length,
      todayPayments:  todayPayments.length,
      todayRevenue:   todayPayments.reduce((sum, p) => sum + p.cost, 0),
      totalRevenue:   this.totalRevenue,
      avgStay:        this.history.length > 0
        ? Math.round(this.history.reduce((s, p) => s + p.durationMinutes, 0) / this.history.length)
        : 0,
    };
  }

  updateRate(type, newRate) {
    if (this.rates[type]) {
      this.rates[type].perHour   = newRate;
      this.rates[type].perMinute = Math.round(newRate / 60);
    }
  }
}
