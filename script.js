const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyI4TwH2l1rrjl5-wR27HRNjRu7jzroC8W5Buf8UasI7Qq2yg0ruGnx9SEzrU5wQTorpA/exec";

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
    const url = `${APPS_SCRIPT_URL}?action=validateLogin&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      handleLoginSuccess(data);
    } else {
      showMessage(data.message || "Credenciales incorrectas", "error");
    }
  } catch (error) {
    console.error("Error en la solicitud:", error);
    showMessage("Error al conectar con el servidor. Intente nuevamente.", "error");
  }
});

function handleLoginSuccess(data) {
  showMessage("Inicio de sesión exitoso! Redirigiendo...", "success");
  
  // Guardar datos de sesión
  localStorage.setItem('userEmail', data.email);
  localStorage.setItem('userRole', data.role);
  localStorage.setItem('isLoggedIn', 'true');
  
  // Redirigir después de 1.5 segundos
  setTimeout(() => {
    window.location.href = "dashboard.html";
  }, 1500);
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
