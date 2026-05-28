# 🚗 ParkSmart: Sistema Inteligente de Parqueadero

¡Bienvenido a **ParkSmart**! Este es un sistema interactivo y premium de gestión y control de parqueaderos, diseñado bajo un esquema web moderno en modo oscuro con efectos *glassmorphism*. 

El objetivo principal de este proyecto es demostrar la aplicación práctica de **Estructuras de Datos Clásicas** combinadas con un flujo financiero completo para un negocio real.

---

## 🛠️ Estructuras de Datos Implementadas

El sistema está construido alrededor de tres estructuras de datos fundamentales implementadas en JavaScript puro:

### 1. 🔵 Cola (Queue) - Gestión de Espera (FIFO)
* **Archivo:** `js/structures/Queue.js`
* **Lógica:** *First-In, First-Out* (Primero en entrar, primero en salir).
* **Uso:** Cuando el parqueadero llega a su límite de capacidad (20 vehículos), los nuevos vehículos entrantes son encolados de manera ordenada.
* **Automatización:** Al liberar un espacio de estacionamiento mediante una salida, el primer vehículo en la cola de espera ingresa automáticamente, calculando su marca de tiempo en ese instante.

### 2. 🟡 Pila (Stack) - Historial de Movimientos (LIFO)
* **Archivo:** `js/structures/Stack.js`
* **Lógica:** *Last-In, First-Out* (Último en entrar, primero en salir).
* **Uso:** Almacena todos los sucesos de importancia en tiempo real (entradas, salidas y adiciones a la cola de espera).
* **Capacidad:** Soporta hasta 200 eventos concurrentes, eliminando el evento más antiguo si se supera el límite. Muestra siempre las actividades más recientes en la parte superior.

### 3. 🟢 Árbol Binario de Búsqueda (BST) - Registro General
* **Archivo:** `js/structures/BST.js`
* **Lógica:** Árbol ordenado mediante la placa como llave única alfabética.
* **Uso:** Cada vehículo registrado es guardado en el árbol para posibilitar búsquedas optimizadas con complejidad **O(log n)**.
* **Visualización:** Cuenta con un panel interactivo que dibuja el árbol de manera jerárquica con sus hijos izquierdos y derechos, junto con el recorrido **In-Order** (placas ordenadas alfabéticamente).

---

## 💳 Sistema de Pagos Integrado

El sistema de cobro calcula el costo exacto de estadía al instante del egreso:
* **Tarifas base configurables:**
  * 🚗 **Automóvil:** $3.000 COP / hora (o fracción por minuto)
  * 🏍️ **Motocicleta:** $1.500 COP / hora
  * 🚛 **Camión/Bus:** $6.000 COP / hora
* **Métodos de pago admitidos:** Efectivo, Tarjeta Débito, Tarjeta Crédito, Nequi, Daviplata y PSE.
* **Generador de Recibos:** Emite un recibo digital detallado con identificador único que permite su impresión directamente en formato de ticketera.

---

## 📂 Estructura del Repositorio

```bash
parking-system/
├── index.html              # Estructura principal y componentes visuales
├── css/
│   └── styles.css          # Estilos CSS premium (Dark mode, Variables, Glassmorphism)
└── js/
    ├── structures/
    │   ├── Queue.js        # Clase de Cola FIFO
    │   ├── Stack.js        # Clase de Pila LIFO
    │   └── BST.js          # Clase de Árbol Binario de Búsqueda (y Nodos)
    ├── PaymentSystem.js    # Lógica y matemáticas financieras
    ├── ParkingSystem.js    # Controlador y orquestador maestro
    └── UI.js               # Renderizados, eventos del DOM, modales y notificaciones
```

---

## 💻 Instalación y Ejecución Local

Si deseas probar o desplegar el proyecto localmente, sigue estos pasos:

1. **Clona este repositorio:**
   ```bash
   git clone https://github.com/Albertgiraldo30/html-.clase.git
   cd html-.clase
   ```

2. **Ejecuta un servidor local:**
   Puedes usar el módulo HTTP nativo de Python para levantarlo rápidamente en el puerto 3000:
   ```bash
   python -m http.server 3000
   ```

3. **Abre la aplicación:**
   Entra en tu navegador favorito a la dirección:
   [http://localhost:3000](http://localhost:3000)

---

## ✨ Características Premium
* **Mapa Interactivo:** Los espacios de parqueo cambian de color (`libre: verde`, `ocupado: rojo`). Al dar clic sobre uno ocupado, se carga de inmediato en la caja de salida para un cobro veloz.
* **Notificaciones dinámicas:** Avisos flotantes (*Toasts*) visuales e intuitivos para cada acción.
* **Estadísticas Dinámicas:** Contadores en vivo para la capacidad total, ingresos brutos, tiempo promedio de estadía y altura actual del árbol binario.
