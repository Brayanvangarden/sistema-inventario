// ============================================================
// VARIABLES GLOBALES
// ============================================================
let carrito = [];
let clienteSeleccionado = null;
let metodoPagoSeleccionado = null;
let nombreMetodoPago = "";

// ============================================================
// BÚSQUEDA DE CLIENTES
// ============================================================
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
    li.addEventListener("click", () => seleccionarCliente(p));
    lista.appendChild(li);
  });

  lista.style.display = "block";
}

function seleccionarCliente(p) {
  clienteSeleccionado = p;
  document.getElementById("busquedaCliente").value = `${p.nombre} ${p.apellido}`;
  document.getElementById("sugerenciasCliente").style.display = "none";
}

// ============================================================
// BÚSQUEDA DE PRODUCTOS
// ============================================================
async function buscarProductos() {
  const textoBuscar = document.getElementById("busqueda").value.trim();
  const lista = document.getElementById("sugerencias");

  if (textoBuscar.length < 1) {
    lista.style.display = "none";
    lista.innerHTML = "";
    return;
  }

  try {
    // ✅ CORRECCIÓN: el backend usa "termino", no "buscar"
    const res = await fetch(
      `http://localhost:3000/api/inventario?termino=${encodeURIComponent(textoBuscar)}`
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

    lista.innerHTML = data
      .map((p) => {
        const sinStock = p.stock === 0;
        const stockBajo = p.stock > 0 && p.stock <= p.stock_minimo;

        const indicador = sinStock
          ? `<span style="color:#dc3545; font-size:11px; margin-left:6px;">● Sin stock</span>`
          : stockBajo
          ? `<span style="color:#FFC107; font-size:11px; margin-left:6px;">● Stock bajo (${p.stock})</span>`
          : `<span style="color:#28a745; font-size:11px; margin-left:6px;">● ${p.stock} disp.</span>`;

        return `
          <li
            onclick="seleccionarProducto(${p.id_producto}, '${p.producto}', ${p.precio_venta}, ${p.stock})"
            style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee; ${sinStock ? 'opacity:0.6;' : ''}"
            onmouseover="this.style.background='#f0f0f0'"
            onmouseout="this.style.background='white'"
          >
            <strong>${p.producto}</strong>
            ${indicador}
            <span style="float: right; color: #555;">₡${parseFloat(p.precio_venta).toFixed(2)}</span>
          </li>
        `;
      })
      .join("");

    lista.style.display = "block";
  } catch (e) {
    mostrarToast("Error al buscar productos", "error");
  }
}

// ✅ Ahora recibe también el stock disponible
function seleccionarProducto(id, nombre, precio, stockDisponible) {
  agregarCarrito(id, nombre, precio, stockDisponible);
  document.getElementById("busqueda").value = "";
  document.getElementById("sugerencias").style.display = "none";
}

// Cerrar dropdown al hacer clic fuera
document.addEventListener("click", function (e) {
  const input = document.getElementById("busqueda");
  const lista = document.getElementById("sugerencias");
  if (!input || !lista) return;
  if (!input.contains(e.target) && !lista.contains(e.target)) {
    lista.style.display = "none";
  }
});

// ============================================================
// CARRITO
// ============================================================
function agregarCarrito(id, nombre, precio, stockDisponible) {
  // Sin stock: bloquear completamente
  if (stockDisponible === 0) {
    mostrarToast(`❌ "${nombre}" no tiene stock disponible`, "error");
    return;
  }

  const existe = carrito.find((p) => p.id === id);

  if (existe) {
    // Validar que no supere el stock disponible
    if (existe.cantidad >= stockDisponible) {
      mostrarToast(
        `⚠️ Solo hay ${stockDisponible} unidad${stockDisponible === 1 ? "" : "es"} disponibles de "${nombre}"`,
        "error"
      );
      return;
    }
    existe.cantidad++;
  } else {
    carrito.push({ id, nombre, precio, cantidad: 1, stockDisponible });
  }

  renderCarrito();
}

function cambiarCantidad(index, cantidad) {
  const val = parseInt(cantidad);
  if (isNaN(val) || val < 1) return;

  const item = carrito[index];

  if (val > item.stockDisponible) {
    mostrarToast(
      `⚠️ Solo hay ${item.stockDisponible} unidad${item.stockDisponible === 1 ? "" : "es"} disponibles de "${item.nombre}"`,
      "error"
    );
    carrito[index].cantidad = item.stockDisponible;
    renderCarrito();
    return;
  }

  carrito[index].cantidad = val;
  renderCarrito();
}

function eliminarItem(index) {
  carrito.splice(index, 1);
  renderCarrito();
}

function renderCarrito() {
  const tabla = document.getElementById("carrito");
  let total = 0;

  tabla.innerHTML = carrito
    .map((p, index) => {
      const subtotal = p.precio * p.cantidad;
      total += subtotal;

      const stockBajo = p.stockDisponible <= 3;
      const advertencia = stockBajo
        ? `<span style="color:#FFC107; font-size:11px;"> (máx. ${p.stockDisponible})</span>`
        : "";

      return `
        <tr>
          <td>${p.nombre}${advertencia}</td>
          <td>
            <input type="number" value="${p.cantidad}" min="1" max="${p.stockDisponible}"
              onchange="cambiarCantidad(${index}, this.value)"
              style="width:60px;">
          </td>
          <td>₡${parseFloat(p.precio).toFixed(2)}</td>
          <td>₡${subtotal.toFixed(2)}</td>
          <td><button onclick="eliminarItem(${index})">❌</button></td>
        </tr>
      `;
    })
    .join("");

  document.getElementById("totalModal").innerText = total.toFixed(2);
}

function calcularTotal() {
  return carrito.reduce((acc, p) => acc + p.precio * p.cantidad, 0);
}

// ============================================================
// VERIFICACIÓN DE STOCK
// ============================================================
async function verificarStock() {
  const res = await fetch("http://localhost:3000/api/inventario/verificar-stock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productos: carrito.map((p) => ({ id: p.id, cantidad: p.cantidad })),
    }),
  });
  return res.json();
}

// ============================================================
// PROCESAR VENTA
// ============================================================
async function procesarVenta() {
  if (carrito.length === 0) {
    mostrarToast("El carrito está vacío", "error");
    return;
  }

  // Doble verificación en el backend justo antes de facturar
  let stockInfo;
  try {
    stockInfo = await verificarStock();
  } catch (e) {
    mostrarToast("Error al verificar stock", "error");
    return;
  }

  const productosSinStock = stockInfo.noStock;

  if (productosSinStock && productosSinStock.length > 0) {
    const p = productosSinStock[0];
    const msg =
      p.stockDisponible === 0
        ? `❌ "${p.nombre}" no tiene stock`
        : `⚠️ "${p.nombre}": pedís ${p.solicitado} pero solo hay ${p.stockDisponible}`;
    mostrarToast(msg, "error");
    return;
  }

  try {
    const resCrearFactura = await fetch("http://localhost:3000/api/ventas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_persona: clienteSeleccionado ? clienteSeleccionado.id : null,
        id_usuario: 1,
        productos: carrito.map((p) => ({
          id_producto: p.id,
          cantidad: p.cantidad,
        })),
      }),
    });

    const dataFactura = await resCrearFactura.json();

    if (!resCrearFactura.ok) {
      mostrarToast(dataFactura.error || "Error al crear factura", "error");
      return;
    }

    window.idFacturaActual = dataFactura.id_factura;
    mostrarMetodoPago();
  } catch (error) {
    console.error(error);
    mostrarToast("Error en la venta", "error");
  }
}

// ============================================================
// MÉTODOS DE PAGO
// ============================================================
function mostrarMetodoPago() {
  document.getElementById("totalMetodo").textContent = calcularTotal().toFixed(2);
  document.getElementById("pasoBotones").style.display = "flex";
  document.getElementById("efectivoContainer").style.display = "none";
  document.getElementById("metodosPago").style.display = "block";
}

function cerrarMetodoPago() {
  document.getElementById("metodosPago").style.display = "none";
}

function volverMetodos() {
  document.getElementById("efectivoContainer").style.display = "none";
  document.getElementById("pasoBotones").style.display = "flex";
}

async function seleccionarMetodo(idMetodo) {
  metodoPagoSeleccionado = idMetodo;

  if (idMetodo === 1) {
    nombreMetodoPago = "Efectivo";
    document.getElementById("pasoBotones").style.display = "none";
    document.getElementById("efectivoContainer").style.display = "block";
    document.getElementById("efectivo").value = "";
    document.getElementById("cambioContainer").style.display = "none";
    document.getElementById("cambio").textContent = "0.00";
    document.getElementById("btnConfirmarEfectivo").disabled = true;
    document.getElementById("btnConfirmarEfectivo").style.background = "#9E9E9E";
    document.getElementById("btnConfirmarEfectivo").style.cursor = "not-allowed";
    return;
  }

  const nombres = { 2: "Sinpe", 3: "Transferencia", 4: "Tarjeta" };
  nombreMetodoPago = nombres[idMetodo] || "";
  await ejecutarPago(idMetodo);
}

function actualizarCambio() {
  const efectivo = parseFloat(document.getElementById("efectivo").value);
  const total = calcularTotal();
  const cambio = efectivo - total;
  const btn = document.getElementById("btnConfirmarEfectivo");

  if (!isNaN(cambio) && cambio >= 0) {
    document.getElementById("cambio").textContent = cambio.toFixed(2);
    document.getElementById("cambioContainer").style.display = "block";
    btn.disabled = false;
    btn.style.background = "#4CAF50";
    btn.style.cursor = "pointer";
  } else {
    document.getElementById("cambioContainer").style.display = "none";
    btn.disabled = true;
    btn.style.background = "#9E9E9E";
    btn.style.cursor = "not-allowed";
  }
}

async function confirmarEfectivo() {
  const efectivo = parseFloat(document.getElementById("efectivo").value);
  const total = calcularTotal();

  if (isNaN(efectivo) || efectivo < total) {
    mostrarToast("El monto recibido es insuficiente", "error");
    return;
  }

  await ejecutarPago(1);
}

async function ejecutarPago(idMetodo) {
  try {
    const resPagar = await fetch(
      `http://localhost:3000/api/ventas/pagar/${window.idFacturaActual}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_metodo_pago: idMetodo }),
      }
    );

    const dataPagar = await resPagar.json();

    if (!resPagar.ok) {
      mostrarToast(dataPagar.error || "Error al pagar factura", "error");
      return;
    }

    document.getElementById("metodosPago").style.display = "none";

    const efectivoIngresado =
      idMetodo === 1
        ? parseFloat(document.getElementById("efectivo").value).toFixed(2)
        : null;
    const cambio =
      idMetodo === 1
        ? document.getElementById("cambio").textContent
        : null;

    const detalle = `
      <p><strong>Cliente:</strong> ${
        clienteSeleccionado
          ? clienteSeleccionado.nombre + " " + clienteSeleccionado.apellido
          : "Contado"
      }</p>
      <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Productos:</strong></p>
      <ul>
        ${carrito
          .map(
            (p) =>
              `<li>${p.cantidad} x ${p.nombre} — ₡${(p.precio * p.cantidad).toFixed(2)}</li>`
          )
          .join("")}
      </ul>
      <p><strong>Total:</strong> ₡${calcularTotal().toFixed(2)}</p>
      <p><strong>Método de pago:</strong> ${nombreMetodoPago}</p>
      ${
        idMetodo === 1
          ? `<p><strong>Efectivo recibido:</strong> ₡${efectivoIngresado}</p>
             <p><strong>Cambio:</strong> ₡${cambio}</p>`
          : ""
      }
    `;

    mostrarTicket(detalle);

    // Limpiar estado
    carrito = [];
    clienteSeleccionado = null;
    document.getElementById("busquedaCliente").value = "";
    renderCarrito();
    mostrarToast("Venta realizada correctamente 💰");
  } catch (error) {
    console.error(error);
    mostrarToast("Error en la venta", "error");
  }
}

// ============================================================
// TICKET
// ============================================================
function mostrarTicket(detalleCompra) {
  document.getElementById("detalleTicket").innerHTML = detalleCompra;
  document.getElementById("ticket").style.display = "block";
}

function cerrarTicket() {
  document.getElementById("ticket").style.display = "none";
}

function imprimirTicket() {
  const ticketContenido = document.getElementById("ticket").innerHTML;
  const ventanaImpresion = window.open("", "", "width=800,height=600");
  ventanaImpresion.document.write("<html><head><title>Ticket</title></head><body>");
  ventanaImpresion.document.write(ticketContenido);
  ventanaImpresion.document.write("</body></html>");
  ventanaImpresion.document.close();
  ventanaImpresion.print();
}

// ============================================================
// TOAST (NOTIFICACIONES)
// ============================================================
function mostrarToast(mensaje, tipo = "success") {
  const toast = document.getElementById("toast");
  toast.innerText = mensaje;
  toast.style.background = tipo === "error" ? "#dc3545" : "#28a745";
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

// ============================================================
// EXPORTAR FUNCIONES AL SCOPE GLOBAL (para uso en HTML inline)
// ============================================================
window.seleccionarProducto = seleccionarProducto;
window.agregarCarrito = agregarCarrito;
window.cambiarCantidad = cambiarCantidad;
window.eliminarItem = eliminarItem;