/**
 * ÁRBOL BINARIO DE BÚSQUEDA (BST)
 * Usado para almacenar y buscar vehículos por número de placa.
 * Búsqueda eficiente O(log n) en caso promedio.
 */
class BSTNode {
  constructor(vehicle) {
    this.vehicle = vehicle;       // Datos del vehículo
    this.key = vehicle.plate;    // Llave de búsqueda: placa
    this.left = null;
    this.right = null;
    this.height = 1;             // Para visualización
  }
}

class BST {
  constructor() {
    this.root = null;
    this.count = 0;
  }

  // Insertar un vehículo en el árbol
  insert(vehicle) {
    const key = vehicle.plate.toUpperCase();
    vehicle.plate = key;
    
    if (this.search(key)) return false; // No duplicados
    
    this.root = this._insertNode(this.root, vehicle, 1);
    this.count++;
    return true;
  }

  _insertNode(node, vehicle, depth) {
    if (node === null) {
      const newNode = new BSTNode(vehicle);
      newNode.depth = depth;
      return newNode;
    }

    if (vehicle.plate < node.key) {
      node.left = this._insertNode(node.left, vehicle, depth + 1);
    } else if (vehicle.plate > node.key) {
      node.right = this._insertNode(node.right, vehicle, depth + 1);
    }

    return node;
  }

  // Buscar vehículo por placa
  search(plate) {
    if (!plate) return null;
    return this._searchNode(this.root, plate.toUpperCase());
  }

  _searchNode(node, plate) {
    if (node === null) return null;
    if (plate === node.key) return node.vehicle;
    if (plate < node.key) return this._searchNode(node.left, plate);
    return this._searchNode(node.right, plate);
  }

  // Eliminar vehículo por placa
  delete(plate) {
    const key = plate.toUpperCase();
    if (!this.search(key)) return false;
    this.root = this._deleteNode(this.root, key);
    this.count--;
    return true;
  }

  _deleteNode(node, plate) {
    if (node === null) return null;

    if (plate < node.key) {
      node.left = this._deleteNode(node.left, plate);
    } else if (plate > node.key) {
      node.right = this._deleteNode(node.right, plate);
    } else {
      // Nodo encontrado
      if (node.left === null) return node.right;
      if (node.right === null) return node.left;

      // Nodo con dos hijos: obtener sucesor in-order (mínimo del subárbol derecho)
      const successor = this._minNode(node.right);
      node.key = successor.key;
      node.vehicle = successor.vehicle;
      node.right = this._deleteNode(node.right, successor.key);
    }
    return node;
  }

  _minNode(node) {
    while (node.left !== null) node = node.left;
    return node;
  }

  // Recorrido In-Order (retorna vehículos ordenados por placa)
  inOrder() {
    const result = [];
    this._inOrderTraversal(this.root, result);
    return result;
  }

  _inOrderTraversal(node, result) {
    if (node !== null) {
      this._inOrderTraversal(node.left, result);
      result.push(node.vehicle);
      this._inOrderTraversal(node.right, result);
    }
  }

  // Recorrido Pre-Order
  preOrder() {
    const result = [];
    this._preOrderTraversal(this.root, result);
    return result;
  }

  _preOrderTraversal(node, result) {
    if (node !== null) {
      result.push(node.vehicle);
      this._preOrderTraversal(node.left, result);
      this._preOrderTraversal(node.right, result);
    }
  }

  // Obtener estructura del árbol para visualización
  getTreeStructure() {
    return this._buildTreeData(this.root, null, 0, 'root');
  }

  _buildTreeData(node, parent, depth, position) {
    if (node === null) return null;
    return {
      key: node.key,
      vehicle: node.vehicle,
      depth: depth,
      position: position,
      left: this._buildTreeData(node.left, node.key, depth + 1, 'left'),
      right: this._buildTreeData(node.right, node.key, depth + 1, 'right')
    };
  }

  // Altura del árbol
  height() {
    return this._getHeight(this.root);
  }

  _getHeight(node) {
    if (node === null) return 0;
    return 1 + Math.max(this._getHeight(node.left), this._getHeight(node.right));
  }

  isEmpty() {
    return this.root === null;
  }

  size() {
    return this.count;
  }

  clear() {
    this.root = null;
    this.count = 0;
  }
}
