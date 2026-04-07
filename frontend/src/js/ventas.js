let carrito = [];

// 🔍 BUSCAR PRODUCTOS
async function buscarProductos() {
    const textoBuscar = document.getElementById('busqueda').value;
    const res = await fetch(`/api/productos?buscar=${encodeURIComponent(textoBuscar)}`);
    const data = await res.json();

    const tabla = document.getElementById('listaProductos');
    tabla.innerHTML = '';

    data.forEach(p => {
        tabla.innerHTML += `
            <tr>
                <td>${p.nombre}</td>
                <td>${p.precio_venta}</td>
                <td>
                    <button onclick="agregarCarrito(${p.id}, '${p.nombre}', ${p.precio_venta})">➕</button>
                </td>
            </tr>
        `;
    });
}

// ➕ AGREGAR AL CARRITO
function agregarCarrito(id, nombre, precio) {
    const existe = carrito.find(p => p.id === id);

    if (existe) {
        existe.cantidad++;
    } else {
        carrito.push({ id, nombre, precio, cantidad: 1 });
    }

    renderCarrito();
}

// 🛒 RENDER CARRITO
function renderCarrito() {
    const tabla = document.getElementById('carrito');
    tabla.innerHTML = '';

    let total = 0;

    carrito.forEach((p, index) => {
        const subtotal = p.precio * p.cantidad;
        total += subtotal;

        tabla.innerHTML += `
            <tr>
                <td>${p.nombre}</td>
                <td>
                    <input type="number" value="${p.cantidad}" min="1"
                        onchange="cambiarCantidad(${index}, this.value)">
                </td>
                <td>${p.precio}</td>
                <td>${subtotal}</td>
                <td>
                    <button onclick="eliminarItem(${index})">❌</button>
                </td>
            </tr>
        `;
    });

    document.getElementById('total').innerText = total;
}

// 🔄 CAMBIAR CANTIDAD
function cambiarCantidad(index, cantidad) {
    carrito[index].cantidad = parseInt(cantidad);
    renderCarrito();
}

// ❌ ELIMINAR
function eliminarItem(index) {
    carrito.splice(index, 1);
    renderCarrito();
}

// 💰 REALIZAR VENTA
async function realizarVenta() {
    if (carrito.length === 0) {
        mostrarToast("Carrito vacío", "error");
        return;
    }

    const productos = carrito.map(p => ({
        id_producto: p.id,
        cantidad: p.cantidad
    }));

    const body = {
        id_persona: document.getElementById('cliente').value || null,
        id_usuario: 1, // 🔥 luego lo sacas del login
        id_metodo_pago: 1,
        productos
    };

    try {
        const res = await fetch('http://localhost:3000/api/ventas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (!res.ok) {
            mostrarToast(data.error, "error");
            return;
        }

        mostrarToast("Venta realizada 💰");

        carrito = [];
        renderCarrito();

    } catch (error) {
        console.error(error);
        mostrarToast("Error de conexión", "error");
    }
}

// 🔔 TOAST
function mostrarToast(mensaje, tipo = "success") {
    const toast = document.getElementById("toast");

    toast.innerText = mensaje;
    toast.style.background = tipo === "error" ? "#dc3545" : "#28a745";

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}