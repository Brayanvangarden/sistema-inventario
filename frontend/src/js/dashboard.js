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
    setTimeout(() => {
        cargarUsuarios();
        cargarPersonasSelect(); // 🔥 clave
    }, 50);
    }

  } catch (error) {
    console.error("Error cargando vista:", error);
    alert("Error cargando vista");
  }
}
