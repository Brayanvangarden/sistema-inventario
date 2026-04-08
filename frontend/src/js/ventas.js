let carrito = [];

// 🔍 BUSCAR PRODUCTOS
async function buscarProductos() {
  const textoBuscar = document.getElementById('busqueda').value.trim();
  const lista = document.getElementById('sugerencias');

  if (textoBuscar.length < 1) {
    lista.style.display = 'none';
    lista.innerHTML = '';
    return;
  }

  try {
    const res = await fetch(`http://localhost:3000/api/productos?buscar=${encodeURIComponent(textoBuscar)}`);
    if (!res.ok) throw new Error('Error al buscar');
    const data = await res.json();

    lista.innerHTML = '';

    if (data.length === 0) {
      lista.innerHTML = '<li style="padding: 8px 12px; color: #888;">Sin resultados</li>';
      lista.style.display = 'block';
      return;
    }

    const items = data.map(p => `
      <li
        onclick="seleccionarProducto(${p.id}, '${p.nombre}', ${p.precio_venta})"
        style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee;"
        onmouseover="this.style.background='#f0f0f0'"
        onmouseout="this.style.background='white'"
      >
        <strong>${p.nombre}</strong>
        <span style="float: right; color: #555;">₡${parseFloat(p.precio_venta).toFixed(2)}</span>
      </li>
    `).join('');

    lista.innerHTML = items;
    lista.style.display = 'block';

  } catch (e) {
    mostrarToast('Error al buscar productos', 'error');
  }
}

// ✅ SELECCIONAR PRODUCTO DESDE EL DROPDOWN
function seleccionarProducto(id, nombre, precio) {
  agregarCarrito(id, nombre, precio);
  document.getElementById('busqueda').value = '';
  document.getElementById('sugerencias').style.display = 'none';
}

// Cerrar dropdown al hacer clic fuera
document.addEventListener('click', function(e) {
  const input = document.getElementById('busqueda');
  const lista = document.getElementById('sugerencias');

  // Si la vista de ventas no está cargada, no hacer nada
  if (!input || !lista) return;

  if (!input.contains(e.target) && !lista.contains(e.target)) {
    lista.style.display = 'none';
  }
});

// ➕ AGREGAR AL CARRITO
function agregarCarrito(id, nombre, precio) {
  const existe = carrito.find(p => p.id === id);
  if (existe) {
    existe.cantidad++;
  } else {
    carrito.push({ id, nombre, precio, cantidad: 1 });
  }
  renderCarrito();
}

// 🛒 RENDER CARRITO
function renderCarrito() {
  const tabla = document.getElementById('carrito');
  tabla.innerHTML = '';
  let total = 0;

  const filas = carrito.map((p, index) => {
    const subtotal = p.precio * p.cantidad;
    total += subtotal;
    return `
      <tr>
        <td>${p.nombre}</td>
        <td>
          <input type="number" value="${p.cantidad}" min="1"
            onchange="cambiarCantidad(${index}, this.value)">
        </td>
        <td>₡${parseFloat(p.precio).toFixed(2)}</td>
        <td>₡${subtotal.toFixed(2)}</td>
        <td><button onclick="eliminarItem(${index})">❌</button></td>
      </tr>
    `;
  }).join('');

  tabla.innerHTML = filas;
  document.getElementById('total').innerText = total.toFixed(2);
}

// 🔄 CAMBIAR CANTIDAD
function cambiarCantidad(index, cantidad) {
  const val = parseInt(cantidad);
  if (isNaN(val) || val < 1) return;
  carrito[index].cantidad = val;
  renderCarrito();
}

// ❌ ELIMINAR
function eliminarItem(index) {
  carrito.splice(index, 1);
  renderCarrito();
}

// 💰 REALIZAR VENTA
async function realizarVenta() {
  if (carrito.length === 0) {
    mostrarToast("Carrito vacío", "error");
    return;
  }

  const body = {
    id_persona: document.getElementById('cliente').value || null,
    id_usuario: 1,
    id_metodo_pago: 1,
    productos: carrito.map(p => ({ id_producto: p.id, cantidad: p.cantidad }))
  };

  try {
    const res = await fetch('http://localhost:3000/api/ventas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      mostrarToast(data.error, "error");
      return;
    }

    mostrarToast("Venta realizada 💰");
    carrito = [];
    renderCarrito();

  } catch (error) {
    console.error(error);
    mostrarToast("Error de conexión", "error");
  }
}

// 🔔 TOAST
function mostrarToast(mensaje, tipo = "success") {
  const toast = document.getElementById("toast");
  toast.innerText = mensaje;
  toast.style.background = tipo === "error" ? "#dc3545" : "#28a745";
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

window.seleccionarProducto = seleccionarProducto;
window.agregarCarrito = agregarCarrito;
window.cambiarCantidad = cambiarCantidad;
window.eliminarItem = eliminarItem;
console.log("ventas.js cargado");