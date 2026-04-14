// 🔐 PROTEGER ACCESO
const usuarioGuardado = localStorage.getItem("usuario");

if (!usuarioGuardado) {
  window.location.href = "login.html";
}

// 👤 MOSTRAR USUARIO
try {
  const user = JSON.parse(usuarioGuardado);

  if (user && user.usuario) {
    const userInfo = document.getElementById("userInfo");
    if (userInfo) {
      userInfo.innerText = `👤 ${user.usuario} (${user.rol})`;
    }
  }
} catch (error) {
  console.error("Error leyendo usuario", error);
}
async function cargarHome() {
  try {
    // Traer todas las facturas
    const res = await fetch("http://localhost:3000/api/ventas");
    const data = await res.json();

    const hoy = new Date().toLocaleDateString("en-CA");

    // Stats
    const ventasHoy = data.filter(
      (f) => new Date(f.fecha).toLocaleDateString("en-CA") === hoy,
    );
    const totalHoy = ventasHoy.reduce((sum, f) => sum + parseFloat(f.total), 0);
    const pendientes = data.filter((f) => f.estado === "PENDIENTE").length;

    document.getElementById("statVentasHoy").innerText = ventasHoy.length;
    document.getElementById("statTotalHoy").innerText =
      `₡${totalHoy.toFixed(2)}`;
    document.getElementById("statPendientes").innerText = pendientes;

    // Stock bajo
    const resInv = await fetch("http://localhost:3000/api/inventario");
    const invData = await resInv.json();
    const stockBajo = invData.filter((i) => i.stock <= i.stock_minimo).length;
    document.getElementById("statStockBajo").innerText = stockBajo;

    // Gráfico últimos 7 días
    const dias = [];
    const totales = [];

    for (let i = 6; i >= 0; i--) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - i);
      const fechaStr = fecha.toLocaleDateString("en-CA");
      const label = fecha.toLocaleDateString("es-CR", {
        weekday: "short",
        day: "numeric",
      });

      const totalDia = data
        .filter(
          (f) => new Date(f.fecha).toLocaleDateString("en-CA") === fechaStr,
        )
        .reduce((sum, f) => sum + parseFloat(f.total), 0);

      dias.push(label);
      totales.push(totalDia);
    }

    const ctx = document.getElementById("graficoVentas").getContext("2d");

    new Chart(ctx, {
      type: "bar",
      data: {
        labels: dias,
        datasets: [
          {
            label: "Ventas (₡)",
            data: totales,
            backgroundColor: "#e879f9",
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `₡${ctx.parsed.y.toFixed(2)}`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (val) => `₡${val}`,
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Error cargando home:", error);
  }
}

// 🚪 LOGOUT
function logout() {
  localStorage.removeItem("usuario");
  window.location.href = "login.html";
}

// 📦 CARGAR VISTAS DINÁMICAS
async function cargarVista(vista) {
  try {
    const res = await fetch(`../views/${vista}.html`);

    if (!res.ok) throw new Error("No se encontró la vista");

    const html = await res.text();
    document.getElementById("contenido").innerHTML = html;

    // 👇 lógica específica
    if (vista === "productos") {
      setTimeout(() => {
        cargarProductos();
        cargarCategorias(); // 🔥 IMPORTANTE
        actualizarInfo();
      }, 50);
    }

    if (vista === "personas") {
      setTimeout(() => {
        cargarPersonas();
      }, 50);
    }
    if (vista === "usuarios") {
      setTimeout(async () => {
        await cargarPersonasSelect(); // Cargamos primero el combo
        await cargarUsuarios(); // Luego la tabla
      }, 50);
    }

    if (vista === "inventario") {
      setTimeout(() => {
        cargarInventario();
        cargarProductosInventario();
      }, 50);
    }

    if (vista === "ventas") {
      setTimeout(() => {
        buscarProductos();
      }, 50);
    }
    if (vista === "facturas") {
      setTimeout(() => {
        cargarFacturas();
      }, 50);
    }

    if (vista === "factura_detalle") {
      setTimeout(() => {
        cargarDetalleFactura();
      }, 50);
    }
    if (vista === "ventas") {
    }

    if (vista === "proveedores") {
      setTimeout(async () => {
        await cargarProveedores(); 
      }, 50);
    }

    if (vista === "home") {
      setTimeout(() => {
        cargarHome();
      }, 50);
    }
  } catch (error) {
    console.error("Error cargando vista:", error);
    alert("Error cargando vista");
  }
}
document.addEventListener("DOMContentLoaded", () => {
  cargarVista("home");
});