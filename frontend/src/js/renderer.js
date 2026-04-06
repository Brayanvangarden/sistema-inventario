async function login() {
    try {
        const usuario = document.getElementById('usuario').value.trim();
        const contrasena = document.getElementById('contrasena').value.trim();

        // 🔎 Validación básica
        if (!usuario || !contrasena) {
            alert('Debe ingresar usuario y contraseña');
            return;
        }

        console.log("Click login");
        console.log("Usuario:", usuario);

        const res = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ usuario, contrasena })
        });

        console.log("Respuesta:", res);

        // ⚠️ Validar respuesta del servidor
        if (!res.ok) {
            const errorText = await res.text();
            console.error("Error servidor:", errorText);
            alert('Usuario o contraseña incorrectos');
            return;
        }

        const data = await res.json();
        console.log("Data:", data);

        // 💾 Guardar usuario (opcional, útil después)
        localStorage.setItem('usuario', JSON.stringify(data));

        // 🎉 Redirección al productos
        window.location.href = "dashboard.html";

    } catch (error) {
        console.error("Error en login:", error);
        alert('No se pudo conectar con el servidor');
    }
}