const API = "http://localhost:3000/api/ventas";

// 🚀 Cargar facturas
async function cargarFacturas() {
  try {
    const res = await fetch(API);
    const data = await res.json();

    const tabla = document.getElementById("tablaFacturas");
    tabla.innerHTML = "";

    data.forEach((f) => {
      const fila = `
        <tr>
          <td>${f.id}</td>
          <td>${new Date(f.fecha).toLocaleString()}</td>
          <td>${f.cliente || "Contado"}</td>
          <td>${f.usuario}</td>
          <td>₡${parseFloat(f.total).toFixed(2)}</td>
          <td>${f.estado}</td>
          <td>
  <button onclick="verFactura(${f.id})"
    style="background:#2196F3; color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer;">
    👁 Ver
  </button>

  <button onclick="imprimirDesdeLista(${f.id})"
    style="background:#ff9800; color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; margin-left:5px;">
    🖨
  </button>
</td>
        </tr>
      `;
      tabla.innerHTML += fila;
    });
  } catch (error) {
    console.error(error);
    mostrarToast("Error al cargar facturas", "error");
  }
}

// 👉 Ir a ventas
function irAVentas() {
  window.cargarVista("ventas");
}

// 👉 Ver detalle
function verFactura(id) {
  sessionStorage.setItem("facturaId", id);
  cargarVista("factura_detalle");
}

// 🔔 Toast
function mostrarToast(msg, tipo = "success") {
  const toast = document.getElementById("toast");
  toast.innerText = msg;
  toast.style.background = tipo === "error" ? "#dc3545" : "#28a745";
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

// 🧾 DETALLE DE FACTURA
async function cargarDetalleFactura() {
  const id = parseInt(sessionStorage.getItem("facturaId"));
  if (!id) return;

  try {
    const res = await fetch("http://localhost:3000/api/ventas/detalle/todas");
    const data = await res.json();

    const factura = data.find((f) => f.id === id);

    if (!factura) {
      alert("Factura no encontrada");
      return;
    }

    // ✅ INFO DE LA FACTURA
    document.getElementById("infoFactura").innerHTML = `
      <div style="display:flex; justify-content:space-between; font-size:12px;">
        <span><strong>Factura #${factura.id}</strong></span>
        <span>${new Date(factura.fecha).toLocaleDateString()}</span>
      </div>
      <div style="font-size:12px; margin-top:4px;">
        <span>🕐 ${new Date(factura.fecha).toLocaleTimeString()}</span>
      </div>
      <div style="font-size:12px; margin-top:4px;">
        <span>👤 Cliente: ${factura.cliente || "Contado"}</span>
      </div>
      <div style="font-size:12px;">
        <span>🧑‍💼 Cajero: ${factura.usuario}</span>
      </div>
      <div style="font-size:12px;">
        <span>📌 Estado: <strong>${factura.estado}</strong></span>
      </div>
    `;

    // ✅ PRODUCTOS DEL DETALLE
    const detalleDiv = document.getElementById("detalle");
    detalleDiv.innerHTML = "";

    factura.detalles.forEach((d) => {
      detalleDiv.innerHTML += `
        <div style="display:grid; grid-template-columns:2fr 0.5fr 1fr 1fr; padding: 4px 0; border-bottom:1px dotted #eee; font-size:12px;">
          <span>${d.nombre}</span>
          <span style="text-align:center">${d.cantidad}</span>
          <span style="text-align:right">₡${parseFloat(d.precio).toFixed(2)}</span>
          <span style="text-align:right">₡${parseFloat(d.subtotal).toFixed(2)}</span>
        </div>
      `;
    });

    // ✅ TOTAL
    document.getElementById("total").innerText = parseFloat(
      factura.total,
    ).toFixed(2);
  } catch (error) {
    console.error(error);
    alert("Error al cargar factura");
  }
}

// 🔥 SOLO ejecutar si estás en esa vista
if (window.location.pathname.includes("factura_detalle.html")) {
  document.addEventListener("DOMContentLoaded", cargarDetalleFactura);
}

// Inicializar
document.addEventListener("DOMContentLoaded", cargarFacturas);

function volverFacturas() {
  cargarVista("facturas");
}

// ⬇ Descargar PDF del ticket
function descargarFactura() {
  const ticket = document.getElementById("ticketFactura");
  const id = sessionStorage.getItem("facturaId");

  const opciones = {
    margin: 10,
    filename: `Factura_${id}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "mm", format: "a5", orientation: "portrait" },
  };

  html2pdf().set(opciones).from(ticket).save();
}

// 📧 Reenviar factura por correo
async function reenviarFactura() {
  const id = sessionStorage.getItem("facturaId");

  if (!confirm("¿Desea reenviar la factura al correo del cliente?")) return;

  try {
    const res = await fetch(`http://localhost:3000/api/ventas/reenviar/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();

    if (res.ok) {
      mostrarToast(`✅ ${data.mensaje}`);
    } else {
      // 👇 Muestra el motivo, ej: "El cliente no tiene correo registrado"
      mostrarToast(`⚠️ ${data.error}`, "error");
    }
  } catch (error) {
    console.error(error);
    mostrarToast("No se pudo conectar con el servidor", "error");
  }
}

function imprimirFactura() {
  const contenido = document.getElementById("ticketFactura").innerHTML;

  const ventana = window.open("", "", "width=400,height=600");

  ventana.document.write(`
    <html>
      <head>
        <title>Imprimir Factura</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            padding: 10px;
          }
        </style>
      </head>
      <body>
        ${contenido}
      </body>
    </html>
  `);

  ventana.document.close();
  ventana.print();
}

async function imprimirDesdeLista(id) {
  try {
    const res = await fetch("http://localhost:3000/api/ventas/detalle/todas");
    const data = await res.json();

    const factura = data.find(f => f.id === id);
    if (!factura) return alert("Factura no encontrada");

    // 🧾 Generar HTML tipo ticket
    let html = `
      <div style="font-family:Courier New; font-size:12px;">
        <h3 style="text-align:center;">Factura #${factura.id}</h3>
        <p>Fecha: ${new Date(factura.fecha).toLocaleString()}</p>
        <p>Cliente: ${factura.cliente}</p>
        <p>Usuario: ${factura.usuario}</p>
        <hr/>
    `;

    factura.detalles.forEach(d => {
      html += `
        <p>${d.cantidad} x ${d.nombre} - ₡${parseFloat(d.subtotal).toFixed(2)}</p>
      `;
    });

    html += `
        <hr/>
        <h3>Total: ₡${parseFloat(factura.total).toFixed(2)}</h3>
      </div>
    `;

    const ventana = window.open('', '', 'width=400,height=600');

    ventana.document.write(html);
    ventana.document.close();
    ventana.print();

  } catch (error) {
    console.error(error);
    alert("Error al imprimir");
  }
}