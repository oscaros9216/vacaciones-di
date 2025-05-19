// Configuración
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwu71XUy0a44Zn8lN0hainBg8P7Oqz8IJK1ymj9lMX2EMJVwu5FICihDkWv4QqME8jA5Q/exec";

document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const messageDiv = document.getElementById('message');
  
  // Validación básica del cliente
  if (!email || !password) {
    showMessage("Por favor complete todos los campos", "error");
    return;
  }
  
  showMessage("Verificando credenciales...", "info");
  
  try {
    // Construir URL con parámetros
    const url = new URL(APPS_SCRIPT_URL);
    url.searchParams.append('action', 'validateLogin');
    url.searchParams.append('email', email);
    url.searchParams.append('password', password);
    
    // Usar fetch con CORS mode
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow'
    });
    
    // Verificar si hubo redirección (comportamiento normal de Apps Script)
    if (response.redirected) {
      const redirectedResponse = await fetch(response.url);
      const data = await redirectedResponse.json();
      processLoginResponse(data);
    } else {
      const data = await response.json();
      processLoginResponse(data);
    }
  } catch (error) {
    console.error("Error en la solicitud:", error);
    showMessage("Error al conectar con el servidor. Intente nuevamente.", "error");
  }
});

function processLoginResponse(data) {
  if (data.success) {
    showMessage("Inicio de sesión exitoso! Redirigiendo...", "success");
    
    // Guardar datos de sesión
    localStorage.setItem('userEmail', data.data.email);
    localStorage.setItem('userRole', data.data.role);
    localStorage.setItem('isLoggedIn', 'true');
    
    // Redirigir después de 1.5 segundos
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1500);
  } else {
    showMessage(data.message || "Credenciales incorrectas", "error");
  }
}

function showMessage(text, type) {
  const messageDiv = document.getElementById('message');
  messageDiv.textContent = text;
  messageDiv.className = `message ${type}`;
  
  // Auto-ocultar mensajes después de 5 segundos (excepto success)
  if (type !== 'success') {
    setTimeout(() => {
      if (messageDiv.textContent === text) {
        messageDiv.textContent = '';
        messageDiv.className = 'message';
      }
    }, 5000);
  }
}
