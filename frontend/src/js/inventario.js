// 🔄 CARGAR INVENTARIO
async function cargarInventario() {
  try {
    const termino = encodeURIComponent(
      document.getElementById("filtroInventario")?.value.trim() || ""
    );

    const res = await fetch(`http://localhost:3000/api/inventario?termino=${termino}`);
    const data = await res.json();

    const tabla = document.getElementById('tablaInventario');
    tabla.innerHTML = '';

    if (data.length === 0) {
      tabla.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#999; padding:20px;">No se encontraron productos</td></tr>`;
      return;
    }

    data.forEach(i => {
      let estado = '';
      if (i.stock <= i.stock_minimo) {
        estado = '🔴 Bajo';
      } else if (i.stock <= i.stock_minimo * 2) {
        estado = '🟡 Medio';
      } else {
        estado = '🟢 Alto';
      }

      tabla.innerHTML += `
        <tr>
          <td>${i.producto}</td>
          <td>${i.stock}</td>
          <td>${i.stock_minimo}</td>
          <td>${estado}</td>
          <td>
            <button onclick="editarInventario(${i.id}, ${i.id_producto}, ${i.stock}, ${i.stock_minimo})">✏️</button>
            <button onclick="eliminarInventario(${i.id})">🗑️</button>
          </td>
        </tr>
      `;
    });

  } catch (error) {
    console.error(error);
    mostrarToast("Error cargando inventario", "error");
  }
}

// ➕ CARGAR PRODUCTOS EN SELECT
async function cargarProductosInventario() {
    try {
        const res = await fetch('http://localhost:3000/api/productos');
        const data = await res.json();

        const select = document.getElementById('producto');
        select.innerHTML = '<option value="">Seleccione producto</option>';

        data.forEach(p => {
            select.innerHTML += `<option value="${p.id}">${p.nombre}</option>`;
        });

    } catch (error) {
        console.error(error);
        mostrarToast("Error cargando productos", "error");
    }
}


// ➕ MOSTRAR FORM
function mostrarFormularioInventario() {
    document.getElementById('formularioInventario').style.display = 'block';
}


//❌ CANCELAR
function cancelarInventario() {
    limpiarInventario();
    document.getElementById('formularioInventario').style.display = 'none';
}

//🧹 LIMPIAR
function limpiarInventario() {
    document.getElementById('idInventario').value = '';
    document.getElementById('producto').value = '';
    document.getElementById('stock').value = '';
    document.getElementById('stock_minimo').value = '';
}

// 💾 GUARDAR (CREATE / UPDATE)
async function guardarInventario() {
    const id = document.getElementById('idInventario').value;

    const inventario = {
        id_producto: document.getElementById('producto').value,
        stock: document.getElementById('stock').value,
        stock_minimo: document.getElementById('stock_minimo').value
    };

    try {
        let res;

        if (id) {
            // ✏️ UPDATE
            res = await fetch(`http://localhost:3000/api/inventario/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(inventario)
            });
        } else {
            // ➕ CREATE
            res = await fetch('http://localhost:3000/api/inventario', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(inventario)
            });
        }

        const data = await res.json();

        if (!res.ok) {
            mostrarToast(data.error || "Error", "error");
            return;
        }

        mostrarToast(id ? "✏️ Inventario actualizado" : "✅ Inventario creado");

        cancelarInventario();
        await cargarInventario();

    } catch (error) {
        console.error(error);
        mostrarToast("Error de conexión", "error");
    }
}


// ✏️ EDITAR
async function editarInventario(id, id_producto, stock, stock_minimo) {
    mostrarFormularioInventario();

    document.getElementById('idInventario').value = id;

    // 🔥 esperar a que carguen los productos
    await cargarProductosInventario();

    document.getElementById('producto').value = id_producto;

    document.getElementById('stock').value = stock;
    document.getElementById('stock_minimo').value = stock_minimo;
}



//🗑️ CONTROL ELIMINACIÓN
let inventarioAEliminar = null;

function eliminarInventario(id) {
    inventarioAEliminar = id;
    document.getElementById("modalEliminarInventario").style.display = "flex";
}



// ✅ CONFIRMAR ELIMINAR
async function confirmarEliminarInventario() {
    try {
        const res = await fetch(`http://localhost:3000/api/inventario/${inventarioAEliminar}`, {
            method: 'DELETE'
        });

        const data = await res.json();

        if (!res.ok) {
            mostrarToast(data.error || "Error al eliminar", "error");
            return;
        }

        mostrarToast("🗑️ Inventario eliminado");

        cerrarModalInventario();
        await cargarInventario();

    } catch (error) {
        console.error(error);
        mostrarToast("Error de conexión", "error");
    }
}

// ❌ CERRAR MODAL
function cerrarModalInventario() {
    document.getElementById("modalEliminarInventario").style.display = "none";
}

//🔔 TOAST
function mostrarToast(mensaje, tipo = "success") {
    const toast = document.getElementById("toast");

    toast.innerText = mensaje;

    if (tipo === "success") {
        toast.style.background = "#ff4da6";
    } else {
        toast.style.background = "#dc3545";
    }

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}