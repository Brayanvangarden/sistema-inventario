// 🔄 CARGAR USUARIOS
async function cargarUsuarios() {
    try {
        const res = await fetch('http://localhost:3000/api/usuarios');
        const data = await res.json();

        const tabla = document.getElementById('tablaUsuarios');
        tabla.innerHTML = '';

        data.forEach(u => {
            tabla.innerHTML += `
                <tr>
                    <td>${u.persona}</td>
                    <td>${u.usuario}</td>
                    <td>${u.correo || '-'}</td>
                    <td>${u.rol}</td>
                    <td>
                        <button onclick="editarUsuario(${u.id}, ${u.id_persona}, \`${u.usuario}\`, ${u.id_rol})">✏️</button>
                        <button onclick="eliminarUsuario(${u.id})">🗑️</button>
                    </td>
                </tr>
            `;
        });

    } catch (error) {
        console.error(error);
        mostrarToastUsuario("Error cargando usuarios", "error");
    }
}


/* =========================
   📥 CARGAR PERSONAS SELECT
========================= */
async function cargarPersonasSelect() {
    try {
        const res = await fetch('http://localhost:3000/api/personas');
        const data = await res.json();

        const select = document.getElementById('id_persona');
        select.innerHTML = '<option value="">Seleccione persona</option>';

        data.forEach(p => {
            select.innerHTML += `
                <option value="${p.id}">
                    ${p.nombre} ${p.apellido}
                </option>
            `;
        });

    } catch (error) {
        console.error(error);
        mostrarToastUsuario("Error cargando personas", "error");
    }
}



/* =========================
   ➕ MOSTRAR FORM
========================= */
function mostrarFormularioUsuario() {
    document.getElementById('formularioUsuario').style.display = 'block';
}



/* =========================
   ❌ CANCELAR
========================= */
function cancelarUsuario() {
    limpiarUsuario();
    document.getElementById('formularioUsuario').style.display = 'none';
}


/* =========================
   🧹 LIMPIAR
========================= */
function limpiarUsuario() {
    document.getElementById('idUsuario').value = '';
    document.getElementById('id_persona').value = '';
    document.getElementById('usuario').value = '';
    document.getElementById('contrasena').value = '';
    document.getElementById('id_rol').value = '';
}


/* =========================
   💾 GUARDAR (CREATE / UPDATE)
========================= */
async function guardarUsuario() {
    const id = document.getElementById('idUsuario').value;

    const usuarioData = {
        id_persona: document.getElementById('id_persona').value,
        usuario: document.getElementById('usuario').value,
        contrasena: document.getElementById('contrasena').value,
        id_rol: document.getElementById('id_rol').value
    };

    try {
        let res;

        if (id) {
            // ✏️ UPDATE
            res = await fetch(`http://localhost:3000/api/usuarios/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(usuarioData)
            });
        } else {
            // ➕ CREATE
            res = await fetch('http://localhost:3000/api/usuarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(usuarioData)
            });
        }

        const data = await res.json();

        if (!res.ok) {
            mostrarToastUsuario(data.error || "Error", "error");
            return;
        }

        mostrarToastUsuario(id ? "✏️ Usuario actualizado" : "✅ Usuario creado");

        cancelarUsuario();
        await cargarUsuarios();

    } catch (error) {
        console.error(error);
        mostrarToastUsuario("Error de conexión", "error");
    }
}



/* =========================
   ✏️ EDITAR
========================= */
function editarUsuario(id, id_persona, usuario, id_rol) {
    mostrarFormularioUsuario();

    document.getElementById('idUsuario').value = id;
    document.getElementById('id_persona').value = id_persona;
    document.getElementById('usuario').value = usuario;
    document.getElementById('id_rol').value = id_rol;

    // contraseña no se llena por seguridad
}



/* =========================
   🗑️ ELIMINAR (MODAL)
========================= */
let usuarioAEliminar = null;

function eliminarUsuario(id) {
    usuarioAEliminar = id;
    document.getElementById("modalEliminarUsuario").style.display = "flex";
}

async function confirmarEliminarUsuario() {
    try {
        const res = await fetch(`http://localhost:3000/api/usuarios/${usuarioAEliminar}`, {
            method: 'DELETE'
        });

        const data = await res.json();

        if (!res.ok) {
            mostrarToastUsuario(data.error || "Error", "error");
            return;
        }

        mostrarToastUsuario("🗑️ Usuario eliminado");

        cerrarModalUsuario();
        await cargarUsuarios();

    } catch (error) {
        console.error(error);
        mostrarToastUsuario("Error de conexión", "error");
    }
}

/* =========================
   ❌ CERRAR MODAL
========================= */
function cerrarModalUsuario() {
    document.getElementById("modalEliminarUsuario").style.display = "none";
}

/* =========================
   🔔 TOAST
========================= */
function mostrarToastUsuario(mensaje, tipo = "success") {
    const toast = document.getElementById("toastUsuario");

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