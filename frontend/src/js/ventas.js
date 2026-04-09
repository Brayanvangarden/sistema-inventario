let carrito = [];
let clienteSeleccionado = null;
let metodoPagoSeleccionado = null;
let nombreMetodoPago = "";

// 🔍 BUSCAR PRODUCTOS
async function buscarProductos() {
  const textoBuscar = document.getElementById("busqueda").value.trim();
  const lista = document.getElementById("sugerencias");

  if (textoBuscar.length < 1) {
    lista.style.display = "none";
    lista.innerHTML = "";
    return;
  }

  try {
    const res = await fetch(
      `http://localhost:3000/api/inventario?buscar=${encodeURIComponent(textoBuscar)}`,
    );
    if (!res.ok) throw new Error("Error al buscar");
    const data = await res.json();

    lista.innerHTML = "";

    if (data.length === 0) {
      lista.innerHTML =
        '<li style="padding: 8px 12px; color: #888;">Sin resultados</li>';
      lista.style.display = "block";
      return;
    }

    const items = data
      .map(
        (p) => `
      <li
        onclick="seleccionarProducto(${p.id}, '${p.producto}', ${p.precio_venta})"
        style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee;"
        onmouseover="this.style.background='#f0f0f0'"
        onmouseout="this.style.background='white'"
      >
        <strong>${p.producto}</strong>
        <span style="float: right; color: #555;">₡${parseFloat(p.precio_venta).toFixed(2)}</span>
      </li>
    `,
      )
      .join("");

    lista.innerHTML = items;
    lista.style.display = "block";
  } catch (e) {
    mostrarToast("Error al buscar productos", "error");
  }
}

async function buscarClientes() {
  const texto = document.getElementById("busquedaCliente").value.trim();
  const lista = document.getElementById("sugerenciasCliente");

  if (texto.length < 1) {
    lista.style.display = "none";
    clienteSeleccionado = null;
    return;
  }

  const res = await fetch(`http://localhost:3000/api/personas?buscar=${texto}`);
  const data = await res.json();

  lista.innerHTML = "";

  data.forEach((p) => {
    const li = document.createElement("li");

    li.innerHTML = `${p.nombre} ${p.apellido}`;

    li.style.padding = "8px";
    li.style.cursor = "pointer";

    li.addEventListener("click", () => {
      seleccionarCliente(p);
    });

    lista.appendChild(li);
  });

  lista.style.display = "block";
}

function seleccionarCliente(p) {
  clienteSeleccionado = p;

  document.getElementById("busquedaCliente").value =
    `${p.nombre} ${p.apellido}`;

  document.getElementById("sugerenciasCliente").style.display = "none";
}

// ✅ SELECCIONAR PRODUCTO DESDE EL DROPDOWN
function seleccionarProducto(id, nombre, precio) {
  agregarCarrito(id, nombre, precio);
  document.getElementById("busqueda").value = "";
  document.getElementById("sugerencias").style.display = "none";
}

// Cerrar dropdown al hacer clic fuera
document.addEventListener("click", function (e) {
  const input = document.getElementById("busqueda");
  const lista = document.getElementById("sugerencias");

  // Si la vista de ventas no está cargada, no hacer nada
  if (!input || !lista) return;

  if (!input.contains(e.target) && !lista.contains(e.target)) {
    lista.style.display = "none";
  }
});

// ➕ AGREGAR AL CARRITO
function agregarCarrito(id, nombre, precio) {
  const existe = carrito.find((p) => p.id === id);
  if (existe) {
    existe.cantidad++;
  } else {
    carrito.push({ id, nombre, precio, cantidad: 1 });
  }
  renderCarrito();
}

// 🛒 RENDER CARRITO
function renderCarrito() {
  const tabla = document.getElementById("carrito");
  tabla.innerHTML = "";
  let total = 0;

  const filas = carrito
    .map((p, index) => {
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
    })
    .join("");

  tabla.innerHTML = filas;
  document.getElementById("total").innerText = total.toFixed(2);
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
// verificar stock 

async function verificarStock() {
  const res = await fetch('http://localhost:3000/api/inventario/verificar-stock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productos: carrito.map(p => ({ id: p.id, cantidad: p.cantidad })) })
  });
  return res.json(); // Esperas un objeto con info de stock
}


// 💰 REALIZAR VENTA
async function procesarVenta() {
  if (carrito.length === 0) {
    mostrarToast("Carrito vacío", "error");
    return;
  }

  // Verificar stock antes de crear la factura
  const stockInfo = await verificarStock();

  // Supongamos que stockInfo tiene un array de productos sin stock:
  const productosSinStock = stockInfo.noStock; // Ejemplo: [{ id: 3, nombre: 'Producto X' }, ...]

  if (productosSinStock && productosSinStock.length > 0) {
    // Mostrar el primer producto sin stock
    mostrarToast(`El artículo ${productosSinStock[0].nombre} no hay stock`, "error");
    return; // Detener el proceso
  }

  try {
    // Crear la factura
    const resCrearFactura = await fetch('http://localhost:3000/api/ventas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_persona: clienteSeleccionado ? clienteSeleccionado.id : null,
        id_usuario: 1,
        productos: carrito.map(p => ({
          id_producto: p.id,
          cantidad: p.cantidad
        }))
      })
    });

    const dataFactura = await resCrearFactura.json();
    if (!resCrearFactura.ok) {
      mostrarToast(dataFactura.error || "Error al crear factura", "error");
      return;
    }

    // Guardar el ID de la factura
    window.idFacturaActual = dataFactura.id_factura;

    // Mostrar método de pago y esperar a que el usuario seleccione
    mostrarMetodoPago();

  } catch (error) {
    console.error(error);
    mostrarToast("Error en la venta", "error");
  }
}

// Función auxiliar para calcular el total
function calcularTotal() {
  return carrito.reduce((acc, p) => acc + p.precio * p.cantidad, 0);
}
//
function mostrarMetodoPago() {
  document.getElementById('metodosPago').style.display = 'block';
}
//
async function seleccionarMetodo(idMetodo) {
  // Ocultar el selector
  document.getElementById('metodosPago').style.display = 'none';

  // Asignar el método y nombre
  metodoPagoSeleccionado = idMetodo;
  switch (idMetodo) {
    case 1:
      nombreMetodoPago = "Efectivo";
      break;
    case 2:
      nombreMetodoPago = "Sinpe";
      break;
    case 3:
      nombreMetodoPago = "Transferencia";
      break;
    case 4:
      nombreMetodoPago = "Tarjeta";
      break;
    default:
      nombreMetodoPago = "";
  }

  // Enviar pago
  try {
    const resPagar = await fetch(`http://localhost:3000/api/ventas/pagar/${window.idFacturaActual}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_metodo_pago: idMetodo })
    });

    const dataPagar = await resPagar.json();
    if (!resPagar.ok) {
      mostrarToast(dataPagar.error || "Error al pagar factura", "error");
      return;
    }

    // Generar y mostrar el ticket final
    const detalle = `
      <p><strong>Cliente:</strong> ${clienteSeleccionado ? clienteSeleccionado.nombre : 'N/A'}</p>
      <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Productos:</strong></p>
      <ul>
        ${carrito.map(p => `<li>${p.cantidad} x ${p.nombre} - ₡${(p.precio * p.cantidad).toFixed(2)}</li>`).join('')}
      </ul>
      <p><strong>Total:</strong> ₡${calcularTotal().toFixed(2)}</p>
      <p><strong>Método de pago:</strong> ${nombreMetodoPago}</p>
    `;

    mostrarTicket(detalle);
    // Limpia carrito
    carrito = [];
    renderCarrito();
    mostrarToast("Venta realizada correctamente 💰");

  } catch (error) {
    console.error(error);
    mostrarToast("Error en la venta", "error");
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

function mostrarTicket(detalleCompra) {
  document.getElementById('detalleTicket').innerHTML = detalleCompra;
  document.getElementById('ticket').style.display = 'block';
}

function cerrarTicket() {
  document.getElementById('ticket').style.display = 'none';
}

function imprimirTicket() {
  const ticketContenido = document.getElementById('ticket').innerHTML;
  const ventanaImpresion = window.open('', '', 'width=800,height=600');
  ventanaImpresion.document.write('<html><head><title>Ticket</title></head><body>');
  ventanaImpresion.document.write(ticketContenido);
  ventanaImpresion.document.write('</body></html>');
  ventanaImpresion.document.close();
  ventanaImpresion.print();
}

function cerrarMetodoPago() {
  const divMetodoPago = document.getElementById('metodosPago');
  divMetodoPago.style.display = 'none';
}

window.seleccionarProducto = seleccionarProducto;
window.agregarCarrito = agregarCarrito;
window.cambiarCantidad = cambiarCantidad;
window.eliminarItem = eliminarItem;

