// Configuración global optimizada
const CONFIG = {
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbyI4TwH2l1rrjl5-wR27HRNjRu7jzroC8W5Buf8UasI7Qq2yg0ruGnx9SEzrU5wQTorpA/exec",
  DEBUG_MODE: true,
  MAX_RETRIES: 2,
  RETRY_DELAY: 1000,
  REQUEST_TIMEOUT: 8000
};

// Estado de la aplicación mejorado
const appState = {
  isSubmitting: false,
  currentRetries: 0,
  lastRequestTime: null
};

// Función mejorada para verificar conectividad real
async function checkRealConnectivity() {
  try {
    // Verificar contra servicios conocidos
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Timeout")), 3000));
    
    const connectivityCheck = fetch("https://www.google.com/generate_204", {
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
  appState.lastRequestTime = new Date();

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
      referrerPolicy: 'no-referrer-when-downgrade',
      mode: 'cors'
    };

    console.log("Enviando petición con opciones:", fetchOptions);

    const response = await fetch(CONFIG.APPS_SCRIPT_URL, fetchOptions);
    clearTimeout(timeoutId);

    // Manejo mejorado de respuestas
    if (response.redirected) {
      console.log("Redirección detectada, siguiendo...");
      const redirectedResponse = await fetch(response.url, {
        signal: controller.signal
      });
      return await redirectedResponse.json();
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error HTTP: ${response.status}`);
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
  appState.currentRetries = 0;
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  let lastErrorMessage = '';
  
  try {
    // [Validaciones previas se mantienen igual...]

    // Mostrar estado de carga
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Guardando...';
    showMessage("⏳ Conectando con el servidor...", "loading");

    // Preparar datos
    const formData = { /* ... */ };

    // Intentar enviar con manejo profesional de reintentos
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
        
        // No reintentar si es error de validación
        if (error.message.includes('validación') || i === CONFIG.MAX_RETRIES) {
          throw error;
        }
        
        console.warn(`Intento ${i} fallido:`, error);
      }
    }

    // [Manejo de respuesta exitosa...]

  } catch (error) {
    console.error("Error final en handleFormSubmit:", {
      error: error.message,
      retries: appState.currentRetries,
      lastRequestTime: appState.lastRequestTime,
      currentTime: new Date()
    });

    // Mensajes de error específicos
    let userMessage = lastErrorMessage;
    if (error.message.includes('conexión') || error.message.includes('servidor')) {
      userMessage = `Problema de conexión con el servidor. Por favor:<br>
                    1. Verifica tu conexión a internet<br>
                    2. Intenta recargar la página<br>
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
