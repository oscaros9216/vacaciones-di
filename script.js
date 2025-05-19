// Configuración
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyI4TwH2l1rrjl5-wR27HRNjRu7jzroC8W5Buf8UasI7Qq2yg0ruGnx9SEzrU5wQTorpA/exec";

// Debug: Verificar que el script se carga
console.log("Script cargado correctamente");
document.getElementById('debugInfo').textContent = "Script cargado: OK";

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    console.log("Formulario enviado");
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('message');
    const debugDiv = document.getElementById('debugInfo');
    
    // Debug: Mostrar valores capturados
    debugDiv.innerHTML += `<p>Intentando login con: ${email} / ${password}</p>`;
    console.log("Intentando login con:", email, password);

    // Validación básica del cliente
    if (!email || !password) {
        showMessage("Por favor complete todos los campos", "error");
        return;
    }
    
    showMessage("Verificando credenciales...", "info");
    debugDiv.innerHTML += "<p>Iniciando validación...</p>";

    try {
        // Debug: Mostrar URL que se usará
        const url = `${APPS_SCRIPT_URL}?action=validateLogin&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
        debugDiv.innerHTML += `<p>URL de solicitud: ${url}</p>`;
        console.log("URL de solicitud:", url);

        const response = await fetch(url, {
            method: 'GET',
            redirect: 'follow',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            }
        });
        
        // Debug: Mostrar respuesta cruda
        debugDiv.innerHTML += `<p>Respuesta recibida. Status: ${response.status}</p>`;
        console.log("Respuesta recibida:", response);

        // Manejar redirección de Apps Script
        let data;
        if (response.redirected) {
            debugDiv.innerHTML += "<p>Detectada redirección, siguiendo...</p>";
            const redirectedResponse = await fetch(response.url);
            data = await redirectedResponse.json();
        } else {
            data = await response.json();
        }
        
        // Debug: Mostrar datos de respuesta
        debugDiv.innerHTML += `<p>Datos de respuesta: ${JSON.stringify(data)}</p>`;
        console.log("Datos de respuesta:", data);

        if (data.success) {
            handleLoginSuccess(data);
        } else {
            showMessage(data.message || "Credenciales incorrectas", "error");
        }
    } catch (error) {
        console.error("Error en la solicitud:", error);
        debugDiv.innerHTML += `<p style="color:red">Error: ${error.message}</p>`;
        showMessage("Error al conectar con el servidor. Intente nuevamente.", "error");
    }
});

function handleLoginSuccess(data) {
    console.log("Login exitoso:", data);
    document.getElementById('debugInfo').innerHTML += `<p>Login exitoso! Redirigiendo...</p>`;
    
    // Guardar datos de sesión
    localStorage.setItem('userEmail', data.email);
    localStorage.setItem('userRole', data.role);
    localStorage.setItem('isLoggedIn', 'true');
    
    // Verificar almacenamiento
    console.log("Datos guardados en localStorage:", {
        email: localStorage.getItem('userEmail'),
        role: localStorage.getItem('userRole'),
        isLoggedIn: localStorage.getItem('isLoggedIn')
    });
    
    showMessage("Inicio de sesión exitoso! Redirigiendo...", "success");
    
    // Redirigir después de 1.5 segundos
    setTimeout(() => {
        console.log("Redirigiendo a dashboard...");
        window.location.href = "dashboard.html";
    }, 1500);
}

function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    console.log("Mensaje mostrado:", text);
}
