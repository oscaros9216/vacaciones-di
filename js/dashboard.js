// Configuración global mejorada
const CONFIG = {
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbyI4TwH2l1rrjl5-wR27HRNjRu7jzroC8W5Buf8UasI7Qq2yg0ruGnx9SEzrU5wQTorpA/exec",
  DEBUG_MODE: true,
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000,
  REQUEST_TIMEOUT: 15000
};

// Referencias a elementos del DOM
const elements = {
  registerForm: document.getElementById('registerForm'),
  registerFormPanel: document.getElementById('registerFormPanel'),
  optionsPanel: document.getElementById('optionsPanel'),
  registerUserBtn: document.getElementById('registerUserBtn'),
  cancelBtn: document.getElementById('cancelBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  formMessage: document.getElementById('formMessage'),
  passwordStrength: document.getElementById('passwordStrength')
};

// Estado de la aplicación
const appState = {
  isSubmitting: false,
  currentRetries: 0
};

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  console.log('Dashboard cargado - Inicializando...');
  checkSession();
  initUI();
  console.log('Inicialización completada');
});

// Función mejorada para enviar datos al backend con manejo de errores
async function sendToGoogleScript(data) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);

  try {
    if (!navigator.onLine) {
      throw new Error("❌ No hay conexión a Internet. Por favor, verifica tu conexión.");
    }

    console.log("📤 Enviando datos:", data);

    const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data),
      redirect: 'follow',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    if (response.redirected) {
      const redirectedResponse = await fetch(response.url, {
        signal: controller.signal
      });
      return await redirectedResponse.json();
    }
    
    return await response.json();

  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error("⌛ El servidor tardó demasiado en responder. Por favor, intenta nuevamente.");
    }
    
    console.error("❌ Error completo:", error);
    throw new Error(`🚨 Error al enviar datos: ${error.message}`);
  }
}

// Manejo robusto del formulario de registro
async function handleFormSubmit(e) {
  e.preventDefault();
  
  if (appState.isSubmitting) return;
  appState.isSubmitting = true;
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  
  try {
    // Validaciones mejoradas
    const password = document.getElementById('password').value;
    if (password.length < 4) {
      throw new Error("La contraseña debe tener al menos 4 caracteres");
    }

    const email = document.getElementById('email').value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Por favor ingresa un email válido");
    }

    // Mostrar estado de carga
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Guardando...';
    showMessage("⏳ Guardando información...", "loading");

    // Preparar datos estructurados
    const formData = {
      action: 'saveUserData',
      timestamp: new Date().toISOString(),
      id: generateUserId(),
      rol: document.getElementById('userRole').value,
      nombre: document.getElementById('fullName').value.trim(),
      numero_colaborador: document.getElementById('employeeNumber').value,
      fecha_ingreso: document.getElementById('hireDate').value,
      email: email,
      contraseña: password,
      vacaciones: document.getElementById('vacationAuth').value,
      jefe_directo: document.getElementById('managerName').value?.trim(),
      correo_jefe: document.getElementById('managerEmail').value,
      titulo_evento: document.getElementById('eventTitle').value?.trim() || '',
      correos_invitados: document.getElementById('guestEmails').value?.trim() || '',
      descripcion: document.getElementById('description').value?.trim() || '',
      mensaje: document.getElementById('message').value?.trim() || ''
    };

    console.log("Datos a enviar:", formData);

    // Intentar enviar con reintentos
    let response;
    let lastError;
    
    for (let i = 0; i < CONFIG.MAX_RETRIES; i++) {
      try {
        response = await sendToGoogleScript(formData);
        break;
      } catch (error) {
        lastError = error;
        if (i < CONFIG.MAX_RETRIES - 1) {
          await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
          showMessage(`⚠️ Reintentando (${i + 1}/${CONFIG.MAX_RETRIES})...`, "warning");
        }
      }
    }

    if (!response) {
      throw lastError || new Error("Error desconocido al enviar datos");
    }

    console.log("Respuesta del servidor:", response);
    
    // Mostrar resultado exitoso
    showMessage("✅ " + (response.message || "Registro guardado exitosamente"), "success");
    setTimeout(() => {
      hideRegisterForm();
      resetForm();
    }, 1500);

  } catch (error) {
    console.error("Error en el formulario:", error);
    const errorMessage = error.message.includes("Failed to fetch") 
      ? "Error de conexión. Verifica tu internet e intenta nuevamente."
      : error.message;
    
    showMessage(`❌ ${errorMessage}`, "error");
    elements.registerForm.classList.add('shake');
    setTimeout(() => elements.registerForm.classList.remove('shake'), 500);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
    appState.isSubmitting = false;
    appState.currentRetries = 0;
  }
}

// [Funciones auxiliares se mantienen igual pero con mejoras]

function generateUserId() {
  return `USR-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
}

function showRegisterForm() {
  elements.optionsPanel.style.display = 'none';
  elements.registerFormPanel.style.display = 'block';
  document.getElementById('userId').value = generateUserId();
}

function hideRegisterForm() {
  elements.registerFormPanel.style.display = 'none';
  elements.optionsPanel.style.display = 'grid';
}

function resetForm() {
  elements.registerForm.reset();
  elements.passwordStrength.style.width = '0%';
  elements.passwordStrength.style.backgroundColor = '#e53e3e';
}

function checkSession() {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const userEmail = localStorage.getItem('userEmail');

  if (!isLoggedIn || !userEmail) {
    redirectToLogin();
  } else {
    document.getElementById('userEmail').textContent = userEmail;
  }
}

function initUI() {
  // Event listeners con validación de existencia
  if (elements.registerUserBtn) elements.registerUserBtn.addEventListener('click', showRegisterForm);
  if (elements.cancelBtn) elements.cancelBtn.addEventListener('click', hideRegisterForm);
  if (elements.logoutBtn) elements.logoutBtn.addEventListener('click', logout);
  
  const passwordField = document.getElementById('password');
  if (passwordField) passwordField.addEventListener('input', checkPasswordStrength);
  
  if (elements.registerForm) elements.registerForm.addEventListener('submit', handleFormSubmit);
}

function logout() {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userRole');
  redirectToLogin();
}

function redirectToLogin() {
  window.location.href = "index.html";
}

function showMessage(text, type) {
  if (elements.formMessage) {
    elements.formMessage.textContent = text;
    elements.formMessage.className = `form-message ${type}`;
    elements.formMessage.style.display = 'block';
    
    if (type !== 'loading') {
      setTimeout(() => {
        elements.formMessage.style.display = 'none';
      }, 5000);
    }
  }
}

function checkPasswordStrength() {
  const password = this.value;
  let strength = 0;
  
  if (password.length >= 8) strength++;
  if (/\d/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  const colors = ['#e53e3e', '#f6ad55', '#68d391', '#38a169'];
  elements.passwordStrength.style.width = `${strength * 25}%`;
  elements.passwordStrength.style.backgroundColor = colors[strength - 1] || '#e53e3e';
}
