// Configuración global
const CONFIG = {
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbyI4TwH2l1rrjl5-wR27HRNjRu7jzroC8W5Buf8UasI7Qq2yg0ruGnx9SEzrU5wQTorpA/exec",
  DEBUG_MODE: true
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
  passwordStrength: document.getElementById('passwordStrength'),
  userEmail: document.getElementById('userEmail')
};

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  console.log('Dashboard cargado - Inicializando...');
  checkSession();
  initUI();
  console.log('Inicialización completada');
});

// Función para enviar datos al backend
async function sendToGoogleScript(data) {
  try {
    if (!navigator.onLine) {
      throw new Error("❌ No hay conexión a Internet");
    }

    console.log("📤 Enviando datos:", data);

    const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data),
      redirect: 'follow'
    });

    if (response.redirected) {
      const redirectedResponse = await fetch(response.url);
      return await redirectedResponse.json();
    }
    
    return await response.json();

  } catch (error) {
    console.error("❌ Error completo:", error);
    throw new Error(`🚨 Error al enviar datos: ${error.message}`);
  }
}

// Manejo del formulario de registro
async function handleFormSubmit(e) {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  
  try {
    // Validaciones
    const password = document.getElementById('password').value;
    if (password.length < 4) {
      throw new Error("La contraseña debe tener al menos 4 caracteres");
    }

    // Mostrar estado de carga
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Guardando...';
    showMessage("⏳ Guardando información...", "loading");

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

    // Enviar datos
    const response = await sendToGoogleScript(formData);
    console.log("Respuesta del servidor:", response);
    
    // Mostrar resultado
    showMessage("✅ " + response.message, "success");
    setTimeout(() => {
      hideRegisterForm();
      resetForm();
    }, 1500);

  } catch (error) {
    console.error("Error en el formulario:", error);
    showMessage(`❌ Error: ${error.message}`, "error");
    elements.registerForm.classList.add('shake');
    setTimeout(() => elements.registerForm.classList.remove('shake'), 500);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

// Funciones auxiliares
function generateUserId() {
  return `USR-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
}

function showRegisterForm() {
  console.log('Mostrando formulario de registro');
  if (elements.optionsPanel && elements.registerFormPanel) {
    elements.optionsPanel.style.display = 'none';
    elements.registerFormPanel.style.display = 'block';
    document.getElementById('userId').value = generateUserId();
  }
}

function hideRegisterForm() {
  console.log('Ocultando formulario de registro');
  if (elements.registerFormPanel && elements.optionsPanel) {
    elements.registerFormPanel.style.display = 'none';
    elements.optionsPanel.style.display = 'grid';
  }
}

function resetForm() {
  if (elements.registerForm) {
    elements.registerForm.reset();
  }
  if (elements.passwordStrength) {
    elements.passwordStrength.style.width = '0%';
  }
}

function checkSession() {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const userEmail = localStorage.getItem('userEmail');

  if (!isLoggedIn || !userEmail) {
    redirectToLogin();
  } else {
    if (elements.userEmail) {
      elements.userEmail.textContent = userEmail;
    }
  }
}

function initUI() {
  console.log('Inicializando UI...');
  
  // Registrar nuevo usuario
  if (elements.registerUserBtn) {
    elements.registerUserBtn.addEventListener('click', showRegisterForm);
    console.log('Event listener agregado a registerUserBtn');
  }

  // Cancelar formulario
  if (elements.cancelBtn) {
    elements.cancelBtn.addEventListener('click', hideRegisterForm);
    console.log('Event listener agregado a cancelBtn');
  }

  // Cerrar sesión
  if (elements.logoutBtn) {
    elements.logoutBtn.addEventListener('click', logout);
    console.log('Event listener agregado a logoutBtn');
  }

  // Password strength
  const passwordField = document.getElementById('password');
  if (passwordField) {
    passwordField.addEventListener('input', checkPasswordStrength);
    console.log('Event listener agregado a password');
  }

  // Formulario
  if (elements.registerForm) {
    elements.registerForm.addEventListener('submit', handleFormSubmit);
    console.log('Event listener agregado a registerForm');
  }
}

function logout() {
  console.log('Cerrando sesión...');
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userRole');
  redirectToLogin();
}

function redirectToLogin() {
  console.log('Redirigiendo a login...');
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
  
  if (password.length >= 4) strength++;
  if (/\d/.test(password)) strength++;
  if (/[A-Za-z]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  const colors = ['#e53e3e', '#f6ad55', '#68d391', '#38a169'];
  if (elements.passwordStrength) {
    elements.passwordStrength.style.width = `${strength * 25}%`;
    elements.passwordStrength.style.backgroundColor = colors[strength - 1] || '#e53e3e';
  }
}
