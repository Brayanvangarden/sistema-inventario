let paginaActualPersonas = 1;
const limitePersonas = 10;

async function cargarPersonas() {
  paginaActualPersonas = 1;
  await fetchPersonas();
}

async function fetchPersonas() {
  try {
    const termino = encodeURIComponent(
      document.getElementById("filtroPersona")?.value.trim() || ""
    );

    const url = `http://localhost:3000/api/personas?buscar=${termino}&page=${paginaActualPersonas}&limit=${limitePersonas}`;

    const res  = await fetch(url);
    const data = await res.json();

    const tabla = document.getElementById("tablaPersonas");
    tabla.innerHTML = "";

    if (data.length === 0) {
      tabla.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#999; padding:20px;">No se encontraron personas</td></tr>`;
      actualizarInfoPersonas();
      return;
    }

    data.forEach((p) => {
      tabla.innerHTML += `
        <tr>
          <td>${p.nombre}</td>
          <td>${p.apellido}</td>
          <td>${p.cedula}</td>
          <td>${p.telefono}</td>
          <td>${p.correo}</td>
          <td>${p.direccion}</td>
          <td>
            <button onclick="editarPersona(${p.id}, \`${p.nombre}\`, \`${p.apellido}\`, \`${p.cedula}\`, \`${p.telefono}\`, \`${p.correo}\`, \`${p.direccion}\`)">✏️</button>
            <button onclick="eliminarPersona(${p.id})">🗑️</button>
          </td>
        </tr>
      `;
    });

    actualizarInfoPersonas();

  } catch (error) {
    console.error(error);
    mostrarToast("Error cargando personas", "error");
  }
}

function siguientePersonas() {
  paginaActualPersonas++;
  fetchPersonas();
}

function anteriorPersonas() {
  if (paginaActualPersonas > 1) {
    paginaActualPersonas--;
    fetchPersonas();
  }
}

function actualizarInfoPersonas() {
  document.getElementById("paginaInfoPersonas").innerText = `Página ${paginaActualPersonas}`;
}

// ➕ MOSTRAR FORM
function mostrarFormulario() {
    document.getElementById("formulario").style.display = "block";
}

// ❌ CANCELAR
function cancelarPersona() {
    limpiarPersona();
    document.getElementById("formulario").style.display = "none";
}

// 🧹 LIMPIAR
function limpiarPersona() {
    document.getElementById("idPersona").value = "";
    document.getElementById("nombre").value = "";
    document.getElementById("apellido").value = "";
    document.getElementById("cedula").value = "";
    document.getElementById("telefono").value = "";
    document.getElementById("correo").value = "";
    document.getElementById("direccion").value = "";
}

// 💾 GUARDAR (CREATE / UPDATE)
async function guardarPersona() {
    const id = document.getElementById("idPersona").value;

    const persona = {
        nombre: document.getElementById("nombre").value,
        apellido: document.getElementById("apellido").value,
        cedula: document.getElementById("cedula").value,
        telefono: document.getElementById("telefono").value,
        correo: document.getElementById("correo").value,
        direccion: document.getElementById("direccion").value,
    };

    try {
        let res;

        if (id) {
            // ✏️ UPDATE
            res = await fetch(`http://localhost:3000/api/personas/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(persona),
            });
        } else {
            // ➕ CREATE
            res = await fetch("http://localhost:3000/api/personas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(persona),
            });
        }

        const data = await res.json();

        if (!res.ok) {
            mostrarToast(data.error || "Error", "error");
            return;
        }

        mostrarToast(id ? "✏️ Persona actualizada" : "✅ Persona creada");

        cancelarPersona();
        await cargarPersonas();
    } catch (error) {
        console.error(error);
        mostrarToast("Error de conexión", "error");
    }
}

// ✏️ EDITAR
function editarPersona(
    id,
    nombre,
    apellido,
    cedula,
    telefono,
    correo,
    direccion,
) {
    mostrarFormulario();

    document.getElementById("idPersona").value = id;
    document.getElementById("nombre").value = nombre;
    document.getElementById("apellido").value = apellido;
    document.getElementById("cedula").value = cedula;
    document.getElementById("telefono").value = telefono;
    document.getElementById("correo").value = correo;
    document.getElementById("direccion").value = direccion;
}

// 🗑️ CONTROL DE ELIMINACIÓN
let personaAEliminar = null;

// 👉 SOLO abre el modal
function eliminarPersona(id) {
    personaAEliminar = id;
    document.getElementById("modalEliminar").style.display = "flex";
}

// 👉 AQUÍ sí elimina
async function confirmarEliminarPersona() {
    const res = await fetch(
        `http://localhost:3000/api/personas/${personaAEliminar}`,
        {
            method: "DELETE",
        },
    );

    const data = await res.json();

    if (!res.ok) {
        mostrarToast(data.error || "Error", "error");
        return;
    }

    mostrarToast("🗑️ Persona eliminada");
    cerrarModal();
    cargarPersonas();
}

// ❌ CERRAR MODAL
function cerrarModal() {
    document.getElementById("modalEliminar").style.display = "none";
}

// 🔔 TOAST
function mostrarToast(mensaje, tipo = "success") {
    const toast = document.getElementById("toast");

    toast.innerText = mensaje;

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
