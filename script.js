// Configuración - Reemplaza con tu URL de Apps Script
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxdu_8HRUUFtomk2Dwdm8u-DcV4B6dRUhxrgn0ZfBFgvTvi21UhvziT3-cqOiI1qs09iQ/exec";

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('message');
    
    messageDiv.textContent = "Verificando credenciales...";
    messageDiv.className = "message";
    
    // Llamada a la API de Apps Script
    fetch(`${APPS_SCRIPT_URL}?action=validateLogin`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email: email,
            password: password
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor');
        }
        return response.json();
    })
    .then(data => handleLoginSuccess(data))
    .catch(error => handleLoginFailure(error));
});

function handleLoginSuccess(response) {
    const messageDiv = document.getElementById('message');
    
    if (response.success) {
        messageDiv.textContent = "Inicio de sesión exitoso! Redirigiendo...";
        messageDiv.className = "message success";
        
        // Guardar datos de sesión
        localStorage.setItem('userEmail', response.email);
        localStorage.setItem('userRole', response.role);
        localStorage.setItem('isLoggedIn', 'true');
        
        // Redirigir al dashboard
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1500);
    } else {
        messageDiv.textContent = response.message || "Credenciales incorrectas";
        messageDiv.className = "message error";
    }
}

function handleLoginFailure(error) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = "Error al conectar con el servidor. Intente nuevamente.";
    messageDiv.className = "message error";
    console.error("Error:", error);
}