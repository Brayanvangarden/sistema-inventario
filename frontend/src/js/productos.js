// 🔄 VARIABLES GLOBALES
let paginaActual = 1;
const limite = 15;

// 🔄 CARGAR PRODUCTOS
async function cargarProductos() {
  try {
    const res = await fetch(
      `http://localhost:3000/api/productos?page=${paginaActual}&limit=${limite}`,
    );
    const data = await res.json();

    const tabla = document.getElementById("tablaProductos");
    tabla.innerHTML = "";

    data.forEach((p) => {
      tabla.innerHTML += `
                <tr>
                    <td>${p.nombre}</td>
                    <td>${p.codigo}</td>
                    <td>${p.categoria || "Sin categoría"}</td>
                    <td>${p.precio_venta}</td>
                    <td>
                        <button onclick="editar(${p.id}, \`${p.nombre}\`, \`${p.codigo}\`, ${p.id_categoria}, ${p.precio_compra}, ${p.precio_venta})">✏️</button>
                        <button onclick="eliminar(${p.id})">🗑️</button>
                    </td>
                </tr>
            `;
    });
  } catch (error) {
    console.error(error);
    alert("Error cargando productos");
  }
}

// 🔄 PAGINACIÓN
function siguiente() {
  paginaActual++;
  cargarProductos();
  actualizarInfo();
}

function anterior() {
  if (paginaActual > 1) {
    paginaActual--;
    cargarProductos();
    actualizarInfo();
  }
}

function actualizarInfo() {
  document.getElementById("paginaInfo").innerText = `Página ${paginaActual}`;
}

// 📂 CARGAR CATEGORÍAS
async function cargarCategorias() {
  try {
    const res = await fetch("http://localhost:3000/api/categorias");
    const data = await res.json();

    const select = document.getElementById("categoria");
    select.innerHTML = '<option value="">Seleccione categoría</option>';

    data.forEach((c) => {
      select.innerHTML += `<option value="${c.id}">${c.nombre}</option>`;
    });
  } catch (error) {
    console.error(error);
    alert("Error cargando categorías");
  }
}

// ➕ MOSTRAR FORMULARIO
function mostrarFormulario() {
  document.getElementById("formulario").style.display = "block";
}

// ❌ CANCELAR
function cancelar() {
  limpiar();
  document.getElementById("formulario").style.display = "none";

  const titulo = document.querySelector("#formulario h3");
  if (titulo) titulo.remove();
}

// 🧹 LIMPIAR FORM
function limpiar() {
  document.getElementById("idProducto").value = "";
  document.getElementById("nombre").value = "";
  document.getElementById("codigo").value = "";
  document.getElementById("categoria").value = "";
  document.getElementById("precio_compra").value = "";
  document.getElementById("precio_venta").value = "";
}

// 💾 GUARDAR (INSERT / UPDATE)
async function guardarProducto() {
  try {
    const id = document.getElementById("idProducto").value;

    const producto = {
      nombre: document.getElementById("nombre").value,
      codigo: document.getElementById("codigo").value,
      id_categoria: document.getElementById("categoria").value,
      precio_compra: document.getElementById("precio_compra").value,
      precio_venta: document.getElementById("precio_venta").value,
    };

    let res;

    if (id) {
      // ✏️ UPDATE
      res = await fetch(`http://localhost:3000/api/productos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(producto),
      });
    } else {
      // ➕ INSERT
      res = await fetch("http://localhost:3000/api/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(producto),
      });
    }

    const data = await res.json();

    if (!res.ok) {
      mostrarToast(data.error || "Error al guardar", "error");
      return;
    }

    if (id) {
      mostrarToast("Producto actualizado correctamente 💄");
    } else {
      mostrarToast("Producto creado correctamente 💅");
    }

    cancelar();
    await cargarProductos();
  } catch (error) {
    console.error(error);
    alert("Error guardando producto");
  }
}

// ✏️ EDITAR PRODUCTO
function editar(id, nombre, codigo, id_categoria, precio_compra, precio_venta) {
  mostrarFormulario();

  // título dinámico
  const tituloExistente = document.querySelector("#formulario h3");
  if (tituloExistente) tituloExistente.remove();

  const titulo = document.createElement("h3");
  titulo.innerText = "✏️ Editando producto";
  document.getElementById("formulario").prepend(titulo);

  // llenar campos
  document.getElementById("idProducto").value = id;
  document.getElementById("nombre").value = nombre;
  document.getElementById("codigo").value = codigo;

  // ⚠️ esperar a que carguen categorías
  setTimeout(() => {
    document.getElementById("categoria").value = id_categoria;
  }, 100);

  document.getElementById("precio_compra").value = precio_compra;
  document.getElementById("precio_venta").value = precio_venta;
}

// 🗑️ ELIMINAR
async function eliminar(id) {
  if (!confirm("¿Eliminar producto?")) return;

  try {
    await fetch(`http://localhost:3000/api/productos/${id}`, {
      method: "DELETE",
    });

    cargarProductos();
  } catch (error) {
    console.error(error);
    alert("Error eliminando producto");
  }
}

function mostrarToast(mensaje, tipo = "success") {
  const toast = document.getElementById("toast");

  toast.innerText = mensaje;

  // colores dinámicos
  if (tipo === "success") {
    toast.style.background = "#ff4da6"; // rosado
  } else {
    toast.style.background = "#dc3545"; // rojo
  }

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}
