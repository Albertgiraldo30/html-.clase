/**
 * PILA (Stack) - Estructura LIFO
 * Usada para registrar el historial de movimientos del parqueadero.
 * El último movimiento registrado es el primero en consultarse (LIFO).
 */
class Stack {
  constructor(maxSize = 100) {
    this.items = [];
    this.maxSize = maxSize;
  }

  // Apilar: agregar un evento al tope de la pila
  push(item) {
    if (this.items.length >= this.maxSize) {
      // Remover el elemento más antiguo si se excede el límite
      this.items.shift();
    }
    this.items.push({
      ...item,
      timestamp: new Date().toISOString()
    });
    return this.size();
  }

  // Desapilar: remover y retornar el elemento del tope
  pop() {
    if (this.isEmpty()) return null;
    return this.items.pop();
  }

  // Ver el tope sin removerlo
  peek() {
    if (this.isEmpty()) return null;
    return this.items[this.items.length - 1];
  }

  isEmpty() {
    return this.items.length === 0;
  }

  size() {
    return this.items.length;
  }

  // Obtener los últimos N elementos (más recientes primero)
  getTop(n = 10) {
    return [...this.items].reverse().slice(0, n);
  }

  toArray() {
    return [...this.items].reverse();
  }

  clear() {
    this.items = [];
  }
}
