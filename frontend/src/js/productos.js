// 🔄 CARGAR PRODUCTOS
let paginaActual = 1;
const limite = 15;

async function cargarProductos() {
    const res = await fetch(`http://localhost:3000/api/productos?page=${paginaActual}&limit=${limite}`);
    const data = await res.json();

    const tabla = document.getElementById('tablaProductos');
    tabla.innerHTML = '';

    data.forEach(p => {
        tabla.innerHTML += `
            <tr>
                <td>${p.nombre}</td>
                <td>${p.codigo}</td>
                <td>${p.categoria}</td>
                <td>${p.precio_venta}</td>
                <td>
                    <button onclick="editar(${p.id}, '${p.nombre}', '${p.codigo}', ${p.id_categoria}, ${p.precio_compra}, ${p.precio_venta})">✏️</button>
                    <button onclick="eliminar(${p.id})">🗑️</button>
                </td>
            </tr>
        `;
    });
}

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
    document.getElementById('paginaInfo').innerText = `Página ${paginaActual}`;
}

async function cargarCategorias() {
    try {
        const res = await fetch('http://localhost:3000/api/categorias');
        const data = await res.json();

        const select = document.getElementById('categoria');
        select.innerHTML = '<option value="">Seleccione categoría</option>';

        data.forEach(c => {
            select.innerHTML += `
                <option value="${c.id}">${c.nombre}</option>
            `;
        });

    } catch (error) {
        console.error(error);
        alert('Error cargando categorías');
    }
}

// ➕ MOSTRAR FORM
function mostrarFormulario() {
    document.getElementById('formulario').style.display = 'block';
}

// ❌ CANCELAR
function cancelar() {
    limpiar();
    document.getElementById('formulario').style.display = 'none';
}

// 🧹 LIMPIAR
function limpiar() {
    document.getElementById('idProducto').value = '';
    document.getElementById('nombre').value = '';
    document.getElementById('codigo').value = '';
    document.getElementById('categoria').value = '';
    document.getElementById('precio_compra').value = '';
    document.getElementById('precio_venta').value = '';
}

// 💾 GUARDAR (INSERT / UPDATE)
async function guardarProducto() {
    const id = document.getElementById('idProducto').value;

    const producto = {
        nombre: document.getElementById('nombre').value,
        codigo: document.getElementById('codigo').value,
        id_categoria: document.getElementById('categoria').value,
        precio_compra: document.getElementById('precio_compra').value,
        precio_venta: document.getElementById('precio_venta').value
    };

    let res;

    if (id) {
        res = await fetch(`http://localhost:3000/api/productos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(producto)
        });
    } else {
        res = await fetch('http://localhost:3000/api/productos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(producto)
        });
    }

    // 🔥 esperar respuesta real
    const data = await res.json();
    console.log(data);

    cancelar();

    // 🔥 ahora sí refresca
    await cargarProductos();
}

// ✏️ EDITAR
function editar(id, nombre, codigo, id_categoria, precio_compra, precio_venta) {
    mostrarFormulario();

    document.getElementById('idProducto').value = id;
    document.getElementById('nombre').value = nombre;
    document.getElementById('codigo').value = codigo;
    document.getElementById('categoria').value = id_categoria;
    document.getElementById('precio_compra').value = precio_compra;
    document.getElementById('precio_venta').value = precio_venta;
}

// 🗑️ ELIMINAR
async function eliminar(id) {
    if (!confirm('¿Eliminar producto?')) return;

    await fetch(`http://localhost:3000/api/productos/${id}`, {
        method: 'DELETE'
    });

    cargarProductos();
}