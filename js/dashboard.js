// Configuración global optimizada
const CONFIG = {
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbyI4TwH2l1rrjl5-wR27HRNjRu7jzroC8W5Buf8UasI7Qq2yg0ruGnx9SEzrU5wQTorpA/exec",
  DEBUG_MODE: true,
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000,
  REQUEST_TIMEOUT: 10000
};

// Estado de la aplicación
const appState = {
  isSubmitting: false,
  currentRetries: 0
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

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  console.log('Dashboard cargado - Inicializando...');
  checkSession();
  initUI();
  console.log('Inicialización completada');
});

// Función mejorada para verificar conectividad real
async function checkRealConnectivity() {
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Timeout")), 3000));
    
    const connectivityCheck = fetch("https://www.gstatic.com/generate_204", {
      method: 'GET',
      mode: 'no-cors'
    });
    
    await Promise.race([connectivityCheck, timeoutPromise]);
    return true;
  } catch (error) {
    console.warn("Verificación de conectividad fallida:", error);
    return false;
  }
}

// Función de envío de datos completamente revisada
async function sendToGoogleScript(data) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);

  try {
    // Verificación real de conectividad
    const isReallyOnline = await checkRealConnectivity();
    if (!isReallyOnline) {
      throw new Error("Problema de conectividad detectado");
    }

    // Configuración optimizada de la petición
    const fetchOptions = {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data),
      redirect: 'follow',
      signal: controller.signal,
      mode: 'no-cors',
      credentials: 'omit'
    };

    console.log("Enviando petición con opciones:", fetchOptions);

    // Usar URL con parámetro cache para evitar problemas
    const urlWithCache = `${CONFIG.APPS_SCRIPT_URL}?cache=${Date.now()}`;
    const response = await fetch(urlWithCache, fetchOptions);
    clearTimeout(timeoutId);

    // Manejo de redirecciones (necesario para Google Apps Script)
    if (response.redirected) {
      const redirectedResponse = await fetch(response.url);
      return await redirectedResponse.json();
    }

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || `Error HTTP: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    clearTimeout(timeoutId);
    console.error("Error completo en sendToGoogleScript:", {
      error: error.message,
      type: error.name,
      stack: CONFIG.DEBUG_MODE ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    // Mapeo de errores técnicos a mensajes entendibles
    const errorMap = {
      'AbortError': 'El servidor tardó demasiado en responder',
      'TypeError': 'Error de conexión con el servidor',
      'Failed to fetch': 'No se pudo conectar con el servidor'
    };

    throw new Error(errorMap[error.name] || errorMap[error.message] || error.message);
  }
}

// Manejo del formulario completamente revisado
async function handleFormSubmit(e) {
  e.preventDefault();
  
  if (appState.isSubmitting) return;
  appState.isSubmitting = true;
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  let lastErrorMessage = '';
  
  try {
    // Validaciones
    const password = document.getElementById('password').value;
    if (password.length < 4) {
      throw new Error("La contraseña debe tener al menos 4 caracteres");
    }

    // Mostrar estado de carga
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Guardando...';
    showMessage("⏳ Conectando con el servidor...", "loading");

    // Preparar datos
    const formData = {
      action: 'saveUserData',
      id: generateUserId(),
      rol: document.getElementById('userRole').value,
      nombre: document.getElementById('fullName').value,
      numero_colaborador: document.getElementById('employeeNumber').value,
      fecha_ingreso: document.getElementById('hireDate').value,
      email: document.getElementById('email').value,
      contraseña: password,
      vacaciones: document.getElementById('vacationAuth').value,
      jefe_directo: document.getElementById('managerName').value,
      correo_jefe: document.getElementById('managerEmail').value,
      titulo_evento: document.getElementById('eventTitle').value || '',
      correos_invitados: document.getElementById('guestEmails').value || '',
      descripcion: document.getElementById('description').value || '',
      mensaje: document.getElementById('message').value || ''
    };
    
    console.log("Datos a enviar:", formData);

    // Intentar enviar con reintentos
    let response;
    for (let i = 0; i <= CONFIG.MAX_RETRIES; i++) {
      try {
        appState.currentRetries = i;
        if (i > 0) {
          showMessage(`🔁 Reintentando (${i}/${CONFIG.MAX_RETRIES})...`, "warning");
          await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
        }
        
        response = await sendToGoogleScript(formData);
        break;
      } catch (error) {
        lastErrorMessage = error.message;
        
        if (i === CONFIG.MAX_RETRIES) {
          throw error;
        }
        
        console.warn(`Intento ${i} fallido:`, error);
      }
    }
    
    // Mostrar resultado
    showMessage("✅ " + (response.message || "Registro guardado exitosamente"), "success");
    setTimeout(() => {
      hideRegisterForm();
      resetForm();
    }, 1500);

  } catch (error) {
    console.error("Error final en handleFormSubmit:", {
      error: error.message,
      retries: appState.currentRetries,
      timestamp: new Date()
    });

    let userMessage = lastErrorMessage;
    if (error.message.includes('conexión') || error.message.includes('servidor')) {
      userMessage = `Problema de conexión detectado. Por favor:
        1. Verifica tu conexión a internet
        2. Intenta recargar la página
        3. Si persiste, contacta al soporte técnico`;
    }

    showMessage(`❌ ${userMessage}`, "error");
    elements.registerForm.classList.add('shake');
    setTimeout(() => elements.registerForm.classList.remove('shake'), 500);
    
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
    appState.isSubmitting = false;
  }
}

// Funciones auxiliares
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
  // Event listeners
  elements.registerUserBtn?.addEventListener('click', showRegisterForm);
  elements.cancelBtn?.addEventListener('click', hideRegisterForm);
  elements.logoutBtn?.addEventListener('click', logout);
  
  document.getElementById('password')?.addEventListener('input', checkPasswordStrength);
  elements.registerForm?.addEventListener('submit', handleFormSubmit);
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
  }
}

function checkPasswordStrength() {
  const password = this.value;
  let strength = 0;
  
  if (password.length >= 4) strength++;
  if (/\d/.test(password)) strength++;
  if (/[A-Za-z]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  const colors = ['#e53e3e', '#f6ad55', '#68d391', '#38a169'];
  elements.passwordStrength.style.width = `${strength * 25}%`;
  elements.passwordStrength.style.backgroundColor = colors[strength - 1] || '#e53e3e';
}
