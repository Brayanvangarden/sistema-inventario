/* =========================
   🌐 VARIABLES
========================= */
let paginaActualProveedores = 1;
const limiteProveedores = 15;
let proveedorAEliminar = null;


/* =========================
   🔄 CARGAR PROVEEDORES
========================= */
async function cargarProveedores() {
    try {
        const filtro = document.getElementById('filtroProveedor').value || '';

        const res = await fetch(
            `http://localhost:3000/api/proveedores?page=${paginaActualProveedores}&limit=${limiteProveedores}&empresa=${filtro}`
        );

        const data = await res.json();

        const tabla = document.getElementById('tablaProveedores');
        tabla.innerHTML = ''; // ✅ limpiar antes de llenar

        data.forEach(p => {  // ✅ iterar sobre el array
            tabla.innerHTML += `
                <tr>
                    <td>${p.empresa}</td>
                    <td>${p.nombre || '-'}</td>
                    <td>${p.telefono || '-'}</td>
                    <td>${p.correo || '-'}</td>
                    <td>${p.direccion || '-'}</td>
                    <td>
                        <button onclick="editarProveedor(${p.id}, ${p.id_persona}, \`${p.empresa}\`)">✏️</button>
                        <button onclick="eliminarProveedor(${p.id})">🗑️</button>
                    </td>
                </tr>
            `;
        });

        document.getElementById("paginaInfoProveedores").innerText =
            `Página ${paginaActualProveedores}`;

    } catch (error) {
        console.error(error);
        mostrarToastProveedor("Error cargando proveedores", "error");
    }
}

/* =========================
   📥 CARGAR PERSONAS SELECT
========================= */
async function cargarPersonasSelectProveedor(id_persona_actual = null) {
    try {
        const res = await fetch('http://localhost:3000/api/personas');
        const data = await res.json();

        const select = document.getElementById('id_persona_proveedor');

        let options = '<option value="">Seleccione persona</option>';

        data.forEach(p => {
            options += `
                <option value="${p.id}">
                    ${p.nombre} ${p.apellido}
                </option>
            `;
        });

        select.innerHTML = options;

        if (id_persona_actual !== null) {
            select.value = String(id_persona_actual);
        }

    } catch (error) {
        console.error(error);
        mostrarToastProveedor("Error cargando personas", "error");
    }
}


/* =========================
   ➕ MOSTRAR FORM
========================= */
function mostrarFormularioProveedor() {
    document.getElementById('formularioProveedor').style.display = 'block';
    cargarPersonasSelectProveedor();
}


/* =========================
   ❌ CANCELAR
========================= */
function cancelarProveedor() {
    limpiarProveedor();
    document.getElementById('formularioProveedor').style.display = 'none';
}


/* =========================
   🧹 LIMPIAR
========================= */
function limpiarProveedor() {
    document.getElementById('idProveedor').value = '';
    document.getElementById('empresa').value = '';
    document.getElementById('id_persona_proveedor').value = '';
}


/* =========================
   💾 GUARDAR (CREATE / UPDATE)
========================= */
async function guardarProveedor() {
    const id = document.getElementById('idProveedor').value;

    const proveedorData = {
        empresa: document.getElementById('empresa').value,
        id_persona: document.getElementById('id_persona_proveedor').value
    };

    if (!proveedorData.empresa || !proveedorData.id_persona) {
        mostrarToastProveedor("Todos los campos son obligatorios", "error");
        return;
    }

    try {
        let res;

        if (id) {
            // ✏️ UPDATE
            res = await fetch(`http://localhost:3000/api/proveedores/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(proveedorData)
            });
        } else {
            // ➕ CREATE
            res = await fetch('http://localhost:3000/api/proveedores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(proveedorData)
            });
        }

        const data = await res.json();

        if (!res.ok) {
            mostrarToastProveedor(data.error || "Error", "error");
            return;
        }

        mostrarToastProveedor(id ? "✏️ Proveedor actualizado" : "✅ Proveedor creado");

        cancelarProveedor();
        await cargarProveedores();

    } catch (error) {
        console.error(error);
        mostrarToastProveedor("Error de conexión", "error");
    }
}


/* =========================
   ✏️ EDITAR
========================= */
async function editarProveedor(id, id_persona, empresa) {
    mostrarFormularioProveedor();

    document.getElementById('idProveedor').value = id;
    document.getElementById('empresa').value = empresa;

    await cargarPersonasSelectProveedor(id_persona);
}


/* =========================
   🗑️ ELIMINAR
========================= */
function eliminarProveedor(id) {
    proveedorAEliminar = id;
    document.getElementById("modalEliminarProveedor").style.display = "flex";
}

async function confirmarEliminarProveedor() {
    try {
        const res = await fetch(`http://localhost:3000/api/proveedores/${proveedorAEliminar}`, {
            method: 'DELETE'
        });

        const data = await res.json();

        if (!res.ok) {
            mostrarToastProveedor(data.error || "Error", "error");
            return;
        }

        mostrarToastProveedor("🗑️ Proveedor eliminado");

        cerrarModalProveedor();
        await cargarProveedores();

    } catch (error) {
        console.error(error);
        mostrarToastProveedor("Error de conexión", "error");
    }
}


/* =========================
   ❌ CERRAR MODAL
========================= */
function cerrarModalProveedor() {
    document.getElementById("modalEliminarProveedor").style.display = "none";
}


/* =========================
   🔔 TOAST
========================= */
function mostrarToastProveedor(mensaje, tipo = "success") {
    const toast = document.getElementById("toastProveedor");

    toast.innerText = mensaje;

    toast.style.background = tipo === "success" ? "#28a745" : "#dc3545";

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}


/* =========================
   📄 PAGINACIÓN
========================= */
function siguienteProveedores() {
    paginaActualProveedores++;
    cargarProveedores();
}

function anteriorProveedores() {
    if (paginaActualProveedores > 1) {
        paginaActualProveedores--;
        cargarProveedores();
    }
}