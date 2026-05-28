/**
 * COLA (Queue) - Estructura FIFO
 * Usada para gestionar vehículos en espera de un espacio libre.
 * El primer vehículo en llegar es el primero en entrar (FIFO).
 */
class Queue {
  constructor() {
    this.items = [];
    this.frontIndex = 0;
  }

  // Encolar: agregar vehículo al final de la cola
  enqueue(item) {
    this.items.push(item);
    return this.size();
  }

  // Desencolar: sacar el primer vehículo de la cola
  dequeue() {
    if (this.isEmpty()) return null;
    const item = this.items[this.frontIndex];
    this.frontIndex++;
    // Limpiar memoria cada 20 operaciones
    if (this.frontIndex > 20) {
      this.items = this.items.slice(this.frontIndex);
      this.frontIndex = 0;
    }
    return item;
  }

  // Ver el primer elemento sin sacarlo
  peek() {
    if (this.isEmpty()) return null;
    return this.items[this.frontIndex];
  }

  isEmpty() {
    return this.frontIndex >= this.items.length;
  }

  size() {
    return this.items.length - this.frontIndex;
  }

  // Obtener todos los elementos como array
  toArray() {
    return this.items.slice(this.frontIndex);
  }

  clear() {
    this.items = [];
    this.frontIndex = 0;
  }
}
